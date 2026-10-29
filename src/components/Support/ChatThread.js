import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowLeft, faEnvelope, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import { TypingBubble, TypingText } from "./TypingDots";
import useConversation from "./useConversation";
import { getAttachmentUrl } from "./api";
import { localPreviews } from "./attachments";
import { isPending, messageKey } from "./merge";
import { dayKey, displayName, formatDayLabel } from "./format";
import { prefersReducedMotion } from "./motion";

const NEAR_BOTTOM_PX = 80;
const LOAD_OLDER_PX = 60;
const RUN_GAP_MS = 5 * 60 * 1000;

// Messages from one sender, on the same day and a few minutes apart, form a
// run: drawn close together, with the time (and the customer's avatar) only
// on the last one.
const continuesRun = (prev, next) =>
  Boolean(prev && next) &&
  prev.sender === next.sender &&
  dayKey(prev.createdAt) === dayKey(next.createdAt) &&
  Date.parse(next.createdAt) - Date.parse(prev.createdAt) <= RUN_GAP_MS;

const isSeen = (createdAt, peerLastReadAt) =>
  Boolean(peerLastReadAt) && Date.parse(createdAt) <= Date.parse(peerLastReadAt);

// The first message on screen and how far it sits from the top of the
// viewport. Put back after older messages are prepended, so the reader's
// place doesn't jump.
function captureAnchor(el) {
  const first = el.querySelector("[data-key]");
  return first ? { key: first.dataset.key, top: first.offsetTop - el.scrollTop } : null;
}

function restoreAnchor(el, anchor) {
  const node = Array.from(el.querySelectorAll("[data-key]")).find(
    (n) => n.dataset.key === anchor.key
  );
  if (node) el.scrollTop = node.offsetTop - anchor.top;
}

function ChatThread({ userId, conversation, drafts, onRead, announce, onBack }) {
  const name = displayName(conversation);
  const email =
    conversation && conversation.userEmail && conversation.userEmail !== name
      ? conversation.userEmail
      : null;

  const onCustomerMessages = useCallback(
    (messages) => announce(`${name}: ${messages[messages.length - 1].text || "sent an attachment"}`),
    [announce, name]
  );

  // Opens an attachment in a new tab. Download links expire, so this fetches a
  // fresh one; the tab opens straight away, while the click still counts for
  // popup blockers, and goes to the file once the link is ready.
  const openAttachment = useCallback(
    (a) => {
      const local = localPreviews.get(a.key);
      if (local) {
        window.open(local, "_blank", "noopener");
        return;
      }
      const tab = window.open("", "_blank");
      if (tab) tab.opener = null;
      getAttachmentUrl(userId, a.key)
        .catch(() => a.url)
        .then((url) => {
          if (tab) tab.location.href = url;
          else window.open(url, "_blank", "noopener");
        });
    },
    [userId]
  );
  const refreshAttachmentUrl = useCallback((key) => getAttachmentUrl(userId, key), [userId]);

  // Files dropped anywhere on the thread go to the composer.
  const composerRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const carriesFiles = (e) => Array.from((e.dataTransfer && e.dataTransfer.types) || []).includes("Files");
  const dropHandlers = {
    onDragEnter: (e) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current += 1;
      setDragging(true);
    },
    onDragOver: (e) => {
      if (carriesFiles(e)) e.preventDefault();
    },
    onDragLeave: (e) => {
      if (!carriesFiles(e)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setDragging(false);
    },
    onDrop: (e) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current = 0;
      setDragging(false);
      if (composerRef.current) composerRef.current.addFiles(e.dataTransfer.files);
    },
  };

  const {
    messages,
    hasMore,
    peerTyping,
    peerLastReadAt,
    loaded,
    reconnecting,
    loadingOlder,
    lastChange,
    loadOlder,
    send,
    retry,
    draftChanged,
  } = useConversation(userId, { onRead, onCustomerMessages });

  // A typing indicator from before the connection dropped may be stale.
  const showTyping = peerTyping && !reconnecting;

  const scrollRef = useRef(null);
  const atBottomRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const anchorRef = useRef(null);
  const countRef = useRef(0);
  const lastKeyRef = useRef(null);
  const [showPill, setShowPill] = useState(false);

  const scrollToBottom = useCallback((smooth) => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = true;
    setShowPill(false);
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
    });
  }, []);

  // Where to scroll after the message list changes.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    const lastKey = last ? messageKey(last) : null;

    if (lastChange === "history") {
      if (anchorRef.current) restoreAnchor(el, anchorRef.current);
      anchorRef.current = null;
    } else if (lastChange === "initial") {
      el.scrollTop = el.scrollHeight;
      atBottomRef.current = true;
    } else if (messages.length > countRef.current) {
      // New messages: follow them if the reader is already at the bottom (or
      // just sent one); otherwise don't yank the view - offer the pill.
      const justSent = last && isPending(last) && lastKey !== lastKeyRef.current;
      if (atBottomRef.current || justSent) scrollToBottom(true);
      else setShowPill(true);
    } else if (atBottomRef.current) {
      // Same messages, taller content (e.g. a "Not sent" line): stay pinned.
      scrollToBottom(false);
    }
    countRef.current = messages.length;
    lastKeyRef.current = lastKey;
  }, [messages, lastChange, scrollToBottom]);

  // Keep the typing bubble in view when it appears at the bottom.
  useLayoutEffect(() => {
    if (showTyping && atBottomRef.current) scrollToBottom(false);
  }, [showTyping, scrollToBottom]);

  // A short conversation never scrolls, so the "scrolled to the top" check
  // below can't fire: load older history straight away while there's room.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !loaded || !hasMore || loadingOlder) return;
    if (el.scrollHeight <= el.clientHeight + LOAD_OLDER_PX) {
      anchorRef.current = captureAnchor(el);
      loadOlder();
    }
  }, [loaded, hasMore, loadingOlder, messages, loadOlder]);

  const handleScroll = () => {
    const el = scrollRef.current;
    const scrolledUp = el.scrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = el.scrollTop;
    // Only the reader scrolling up un-pins the view. Our own smooth scroll to
    // the bottom passes through "not at the bottom" on the way down.
    if (el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX) {
      atBottomRef.current = true;
      setShowPill(false);
    } else if (scrolledUp) {
      atBottomRef.current = false;
    }

    const nearTop = el.scrollTop < LOAD_OLDER_PX;
    // Re-captured while loading, in case the reader keeps scrolling.
    if (loadingOlder || (nearTop && hasMore && loaded)) anchorRef.current = captureAnchor(el);
    if (nearTop && hasMore && loaded && !loadingOlder) loadOlder();
  };

  // Messages, with a separator at the start of each day, grouped into runs.
  const items = [];
  let prevDay = null;
  messages.forEach((m, i) => {
    const day = dayKey(m.createdAt);
    if (day !== prevDay) {
      items.push(
        <div key={`day:${day}`} className="support-day" role="separator">
          <span>{formatDayLabel(m.createdAt)}</span>
        </div>
      );
      prevDay = day;
    }
    const mine = m.sender === "admin";
    items.push(
      <MessageBubble
        key={messageKey(m)}
        message={m}
        grouped={continuesRun(messages[i - 1], m)}
        last={!continuesRun(m, messages[i + 1])}
        customerId={userId}
        customerName={name}
        seen={mine && !isPending(m) && isSeen(m.createdAt, peerLastReadAt)}
        animate={lastChange === "live"}
        onRetry={retry}
        onOpenAttachment={openAttachment}
        onRefreshUrl={refreshAttachmentUrl}
      />
    );
  });

  return (
    <div className="support-thread" {...dropHandlers}>
      <header className="support-thread-header">
        <button
          type="button"
          className="support-icon-btn support-back"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <Avatar seed={userId} name={name} size={40} />
        <div className="support-thread-who">
          <div className="support-thread-name">{name}</div>
          <div className="support-thread-sub">
            {showTyping ? <TypingText name={name} /> : email || "App customer"}
          </div>
        </div>
        {conversation && conversation.userEmail && (
          <a
            className="support-icon-btn support-thread-action"
            href={`mailto:${conversation.userEmail}`}
            aria-label={`Email ${conversation.userEmail}`}
            title={`Email ${conversation.userEmail}`}
          >
            <FontAwesomeIcon icon={faEnvelope} />
          </a>
        )}
      </header>

      <div className="support-scroll-wrap">
        {reconnecting && (
          <div className="support-banner" role="status">
            <span className="support-banner-dot" aria-hidden="true" />
            Reconnecting…
          </div>
        )}

        <div
          className="support-messages"
          ref={scrollRef}
          onScroll={handleScroll}
          role="region"
          aria-label={`Messages with ${name}`}
          tabIndex={0}
        >
          <div className="support-messages-inner">
            {loaded && !hasMore && messages.length > 0 && (
              <div className="support-history-note">Start of conversation</div>
            )}
            {loadingOlder && <div className="support-history-note">Loading earlier messages…</div>}
            {!loaded && !reconnecting && (
              <div className="support-history-note">Loading conversation…</div>
            )}
            {loaded && messages.length === 0 && (
              <div className="support-history-note">No messages yet</div>
            )}
            {items}
            <TypingBubble show={showTyping} name={name} seed={userId} />
          </div>
        </div>

        {showPill && (
          <button type="button" className="support-new-pill" onClick={() => scrollToBottom(true)}>
            New messages <FontAwesomeIcon icon={faArrowDown} />
          </button>
        )}
      </div>

      <Composer
        ref={composerRef}
        userId={userId}
        customerName={name}
        drafts={drafts}
        onSend={send}
        onDraftChange={draftChanged}
      />

      {dragging && (
        <div className="support-drop-overlay" aria-hidden="true">
          <FontAwesomeIcon icon={faPaperclip} />
          Drop images or PDFs to attach
        </div>
      )}
    </div>
  );
}

export default ChatThread;
