import { useCallback, useEffect, useRef, useState } from "react";
import { supportChat, uploadAttachment } from "./api";
import {
  addPending,
  isPending,
  mergeMessages,
  newestConfirmedId,
  oldestConfirmedId,
  setPendingStatus,
  updatePending,
} from "./merge";
import { isImageType, localPreviews } from "./attachments";

const PAGE_SIZE = 30;
const POLL_MS = 2500;
// After a failed poll: 2.5 s -> 5 -> 10 -> 15 s, then stay at 15 s.
const BACKOFF_MS = [5000, 10000, 15000];
// The server drops the typing flag after 6 s, so refresh it every 3 s.
const TYPING_PING_MS = 3000;

const EMPTY = {
  messages: [],
  hasMore: false,
  peerTyping: false,
  peerLastReadAt: null,
  loaded: false,
  reconnecting: false,
  loadingOlder: false,
  // What the last change to `messages` was: "initial" | "live" | "history" |
  // "status". The thread uses it to decide how to scroll and what to animate.
  lastChange: "initial",
};

// Only claim the customer's messages were seen when someone could actually
// be looking at them. Otherwise their app shows ✓✓ for messages nobody read.
const canMarkRead = () => document.visibilityState === "visible" && document.hasFocus();

function newClientId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * One open conversation: initial load, polling for new messages, sending,
 * retrying, typing pings and paging back through history.
 *
 * The thread is keyed by userId, so this hook only ever serves one
 * conversation. Responses that land after it closed - the staff member
 * switched conversations - are ignored (merge rule 5).
 */
export default function useConversation(userId, { onRead, onCustomerMessages }) {
  const [state, setState] = useState(EMPTY);

  const messagesRef = useRef([]);
  const hasMoreRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const aliveRef = useRef(true);
  const typingRef = useRef({ lastPing: 0, pinged: false });
  // Messages being sent, by clientId: { text, files, previews, uploaded }.
  // Kept until the server confirms, so a retry resumes where it failed.
  const jobsRef = useRef(new Map());
  // Object URLs for local image previews, freed when the thread closes.
  const previewsRef = useRef([]);
  const onReadRef = useRef(onRead);
  const onCustomerRef = useRef(onCustomerMessages);

  useEffect(() => {
    onReadRef.current = onRead;
    onCustomerRef.current = onCustomerMessages;
  }, [onRead, onCustomerMessages]);

  // Apply a pure update to the message list.
  const apply = useCallback((fn, change) => {
    if (!aliveRef.current) return;
    const prev = messagesRef.current;
    const next = fn(prev);
    if (next === prev) return;
    messagesRef.current = next;
    setState((s) => ({ ...s, messages: next, lastChange: change }));
  }, []);

  // ---- polling -------------------------------------------------------------
  useEffect(() => {
    aliveRef.current = true;
    let timer = null;
    let inFlight = false;
    let failures = 0;
    let loadedOnce = false;

    const schedule = (ms) => {
      clearTimeout(timer);
      // Paused while the tab is hidden; the inbox poll keeps watching.
      if (aliveRef.current && !document.hidden) timer = setTimeout(poll, ms);
    };

    async function poll() {
      if (!aliveRef.current || inFlight) return;
      inFlight = true;
      const markRead = canMarkRead();
      const after = newestConfirmedId(messagesRef.current);
      const params =
        loadedOnce && after
          ? { userId, after, markRead }
          : { userId, limit: PAGE_SIZE, markRead };
      try {
        const res = await supportChat("getMessages", params);
        if (!aliveRef.current) return;

        const incoming = res.messages || [];
        const prev = messagesRef.current;
        const next = mergeMessages(prev, incoming);
        messagesRef.current = next;

        if (loadedOnce && next !== prev) {
          const known = new Set(prev.map((m) => m.id));
          const fromCustomer = incoming.filter((m) => m.sender === "user" && !known.has(m.id));
          if (fromCustomer.length > 0) onCustomerRef.current(fromCustomer);
        }

        const first = !loadedOnce;
        if (first) hasMoreRef.current = Boolean(res.hasMore);
        const convo = res.conversation;
        setState((s) => ({
          ...s,
          messages: next,
          hasMore: hasMoreRef.current,
          peerTyping: Boolean(convo && convo.peerTyping),
          peerLastReadAt: convo ? convo.peerLastReadAt || null : s.peerLastReadAt,
          loaded: true,
          reconnecting: false,
          lastChange: first ? "initial" : next !== prev ? "live" : s.lastChange,
        }));

        loadedOnce = true;
        failures = 0;
        if (markRead) onReadRef.current(userId, res.serverTime || new Date().toISOString());
        schedule(POLL_MS);
      } catch (e) {
        if (!aliveRef.current) return;
        failures += 1;
        setState((s) => (s.reconnecting ? s : { ...s, reconnecting: true }));
        schedule(BACKOFF_MS[Math.min(failures, BACKOFF_MS.length) - 1]);
      } finally {
        inFlight = false;
      }
    }

    const pollNow = () => {
      if (inFlight) return;
      clearTimeout(timer);
      poll();
    };
    const onVisibility = () => {
      if (document.hidden) clearTimeout(timer);
      else pollNow();
    };
    // Coming back to the window: poll now, which also marks the messages
    // that arrived meanwhile as read.
    const onFocus = () => pollNow();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    poll();

    return () => {
      aliveRef.current = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      // Leaving mid-draft: tell the customer we stopped typing.
      if (typingRef.current.pinged) {
        supportChat("setTyping", { userId, isTyping: false }).catch(() => {});
      }
    };
  }, [userId]);

  // ---- history ---------------------------------------------------------------
  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current || !hasMoreRef.current) return;
    const before = oldestConfirmedId(messagesRef.current);
    if (!before) return;
    loadingOlderRef.current = true;
    setState((s) => ({ ...s, loadingOlder: true }));
    try {
      const res = await supportChat("getMessages", { userId, before, limit: PAGE_SIZE });
      if (!aliveRef.current) return;
      const older = res.messages || [];
      // hasMore can be true once when nothing older exists; the empty page
      // that follows settles it.
      hasMoreRef.current = Boolean(res.hasMore) && older.length > 0;
      apply((prev) => mergeMessages(prev, older), "history");
      setState((s) => ({ ...s, hasMore: hasMoreRef.current, loadingOlder: false }));
    } catch (e) {
      if (aliveRef.current) setState((s) => ({ ...s, loadingOlder: false }));
    } finally {
      loadingOlderRef.current = false;
    }
  }, [userId, apply]);

  // ---- sending ---------------------------------------------------------------
  useEffect(() => {
    const previews = previewsRef.current;
    return () =>
      previews.forEach(({ url, key }) => {
        URL.revokeObjectURL(url);
        if (key) localPreviews.delete(key);
      });
  }, []);

  // Uploads whatever hasn't been uploaded yet, then sends the message.
  const deliver = useCallback(
    async (clientId) => {
      const job = jobsRef.current.get(clientId);
      if (!job) return;
      try {
        const total = job.files.reduce((sum, f) => sum + f.size, 0);
        for (let i = 0; i < job.files.length; i += 1) {
          if (!job.uploaded[i]) {
            const file = job.files[i];
            const before = job.files.slice(0, i).reduce((sum, f) => sum + f.size, 0);
            job.uploaded[i] = await uploadAttachment(userId, file, (p) => {
              // In 5% steps, so the bubble doesn't re-render on every progress event.
              const progress = Math.floor(((before + p * file.size) / total) * 20) / 20;
              apply((prev) => updatePending(prev, clientId, { progress }), "status");
            });
            const preview = job.previews[i];
            if (preview) {
              preview.key = job.uploaded[i].key;
              localPreviews.set(preview.key, preview.url);
            }
          }
        }
        const res = await supportChat("sendMessage", {
          userId,
          text: job.text,
          clientId,
          ...(job.uploaded.length > 0 && { attachments: job.uploaded }),
        });
        jobsRef.current.delete(clientId);
        apply((prev) => mergeMessages(prev, [res.message]), "live");
      } catch (e) {
        apply((prev) => setPendingStatus(prev, clientId, "failed"), "status");
      }
    },
    [userId, apply]
  );

  const send = useCallback(
    (raw, files = []) => {
      const text = raw.trim();
      if (!text && files.length === 0) return;
      // Sending clears the typing flag on the server; don't send our own "false".
      typingRef.current = { lastPing: 0, pinged: false };
      const clientId = newClientId();
      const previews = files.map((file) => {
        if (!isImageType(file.type)) return null;
        const preview = { url: URL.createObjectURL(file), key: null };
        previewsRef.current.push(preview);
        return preview;
      });
      jobsRef.current.set(clientId, { text, files, previews, uploaded: [] });
      apply(
        (prev) =>
          addPending(prev, {
            clientId,
            text,
            createdAt: new Date().toISOString(),
            attachments: files.map((file, i) => ({
              key: `local:${clientId}:${i}`,
              name: file.name,
              contentType: file.type,
              size: file.size,
              url: previews[i] ? previews[i].url : null,
            })),
          }),
        "live"
      );
      deliver(clientId);
    },
    [apply, deliver]
  );

  // Retries reuse the clientId, so a send that did reach the server isn't
  // shown twice, and skip files that already uploaded.
  const retry = useCallback(
    (clientId) => {
      const failed = messagesRef.current.find(
        (m) => isPending(m) && m.clientId === clientId && m.localStatus === "failed"
      );
      if (!failed) return;
      if (!jobsRef.current.has(clientId)) {
        jobsRef.current.set(clientId, { text: failed.text, files: [], previews: [], uploaded: [] });
      }
      apply((prev) => setPendingStatus(prev, clientId, "sending"), "status");
      deliver(clientId);
    },
    [apply, deliver]
  );

  // ---- typing ----------------------------------------------------------------
  // Called on every draft edit. Fire-and-forget: a lost ping only means the
  // customer's typing bubble is a little late.
  const draftChanged = useCallback(
    (draft) => {
      const t = typingRef.current;
      if (draft.trim().length > 0) {
        if (Date.now() - t.lastPing >= TYPING_PING_MS) {
          typingRef.current = { lastPing: Date.now(), pinged: true };
          supportChat("setTyping", { userId, isTyping: true }).catch(() => {});
        }
      } else if (t.pinged) {
        typingRef.current = { lastPing: 0, pinged: false };
        supportChat("setTyping", { userId, isTyping: false }).catch(() => {});
      }
    },
    [userId]
  );

  return { ...state, loadOlder, send, retry, draftChanged };
}
