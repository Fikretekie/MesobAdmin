import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supportChat } from "./api";
import {
  applyLocalReads,
  markConversationRead,
  mergeConversations,
  newCustomerMessages,
  totalUnread,
} from "./merge";

const PAGE_SIZE = 30;
const BADGE_LIMIT = 100;

// On the Support page: every 5 s while the tab is visible, 15 s while hidden
// (the hidden-tab poll is what drives sounds and desktop notifications).
// Anywhere else in the portal: every 30 s, visible tab only, just to keep the
// sidebar badge current.
const PAGE_VISIBLE_MS = 5000;
const PAGE_HIDDEN_MS = 15000;
const BADGE_MS = 30000;

/**
 * The conversation list, kept fresh by one setTimeout-chained poll (never more
 * than one request in flight). Lives in SupportProvider rather than on the
 * page, so the sidebar badge and the page share a single poll and the list
 * survives navigating away and back.
 */
export default function useInbox({ enabled, pageMode, onNewCustomerMessages }) {
  const [conversations, setConversations] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // The latest list, so polls can diff against it outside of setState.
  const listRef = useRef([]);
  const loadedRef = useRef(false);
  const cursorKnownRef = useRef(false);
  const loadingMoreRef = useRef(false);
  // userId -> ISO time up to which support has read it here (see applyLocalReads).
  const readUpToRef = useRef({});
  // Bumped on sign-out so a response for the previous account is dropped.
  const epochRef = useRef(0);
  const pageModeRef = useRef(pageMode);
  const notifyRef = useRef(onNewCustomerMessages);
  const pollNowRef = useRef(() => {});

  useEffect(() => {
    notifyRef.current = onNewCustomerMessages;
  }, [onNewCustomerMessages]);

  const commit = useCallback((next) => {
    if (next === listRef.current) return;
    listRef.current = next;
    setConversations(next);
  }, []);

  // Signed out: forget the inbox, so the next account doesn't see it.
  useEffect(() => {
    if (enabled) return;
    epochRef.current += 1;
    listRef.current = [];
    loadedRef.current = false;
    cursorKnownRef.current = false;
    readUpToRef.current = {};
    setConversations([]);
    setLoaded(false);
    setNextCursor(null);
    setError(null);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    let stopped = false;
    let timer = null;
    let inFlight = false;

    const nextDelay = () => {
      if (pageModeRef.current) return document.hidden ? PAGE_HIDDEN_MS : PAGE_VISIBLE_MS;
      return document.hidden ? null : BADGE_MS;
    };

    const schedule = () => {
      clearTimeout(timer);
      const ms = nextDelay();
      if (!stopped && ms != null) timer = setTimeout(poll, ms);
    };

    async function poll() {
      if (stopped || inFlight) return;
      // Badge-only polling waits for the tab to come back (see onVisibility).
      if (!pageModeRef.current && document.hidden) return;
      inFlight = true;
      try {
        const limit = pageModeRef.current ? PAGE_SIZE : BADGE_LIMIT;
        const res = await supportChat("listConversations", { limit });
        if (stopped) return;

        const prev = listRef.current;
        const incoming = applyLocalReads(res.conversations || [], readUpToRef.current);
        const next = mergeConversations(prev, incoming);
        // Not on the first load - everything would look new.
        if (loadedRef.current && pageModeRef.current) {
          const fresh = newCustomerMessages(prev, next);
          if (fresh.length > 0) notifyRef.current(fresh);
        }
        commit(next);

        // Later polls only refresh the top of the list; paging further down
        // is loadMore's job, so the cursor is only taken from the first load.
        if (!cursorKnownRef.current) {
          cursorKnownRef.current = true;
          setNextCursor(res.nextCursor || null);
        }
        loadedRef.current = true;
        setLoaded(true);
        setError(null);
      } catch (e) {
        if (!stopped) setError(e);
      } finally {
        inFlight = false;
        schedule();
      }
    }

    const pollNow = () => {
      if (inFlight) return;
      clearTimeout(timer);
      poll();
    };
    pollNowRef.current = pollNow;

    const onVisibility = () => {
      if (!document.hidden) pollNow();
    };
    document.addEventListener("visibilitychange", onVisibility);
    poll();

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      pollNowRef.current = () => {};
    };
  }, [enabled, commit]);

  // Entering or leaving the Support page switches between the inbox poll and
  // the badge poll. Refresh straight away either way.
  useEffect(() => {
    if (pageModeRef.current === pageMode) return;
    pageModeRef.current = pageMode;
    pollNowRef.current();
  }, [pageMode]);

  const loadMore = useCallback(async () => {
    if (!enabled || loadingMoreRef.current || !nextCursor) return;
    const epoch = epochRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await supportChat("listConversations", { limit: PAGE_SIZE, cursor: nextCursor });
      if (epoch !== epochRef.current) return;
      const incoming = applyLocalReads(res.conversations || [], readUpToRef.current);
      commit(mergeConversations(listRef.current, incoming));
      setNextCursor(res.nextCursor || null);
    } catch (e) {
      if (epoch === epochRef.current) setError(e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [enabled, nextCursor, commit]);

  // Support has read this conversation up to `upTo` (the thread's markRead
  // succeeded). Clear its badge now rather than on the next list poll.
  const noteRead = useCallback(
    (userId, upTo) => {
      const prevUpTo = readUpToRef.current[userId];
      if (!prevUpTo || Date.parse(upTo) > Date.parse(prevUpTo)) {
        readUpToRef.current[userId] = upTo;
      }
      const row = listRef.current.find((c) => c.userId === userId);
      if (row && row.unread > 0 && Date.parse(row.lastMessageAt) <= Date.parse(upTo)) {
        commit(markConversationRead(listRef.current, userId));
      }
    },
    [commit]
  );

  // Opening a conversation clears its badge immediately, before the server
  // has confirmed the read.
  const markOpened = useCallback(
    (userId) => {
      const row = listRef.current.find((c) => c.userId === userId);
      if (row) noteRead(userId, row.lastMessageAt);
    },
    [noteRead]
  );

  return useMemo(
    () => ({
      conversations,
      loaded,
      error,
      hasMore: Boolean(nextCursor),
      loadingMore,
      loadMore,
      markOpened,
      noteRead,
      unreadTotal: totalUnread(conversations),
    }),
    [conversations, loaded, error, nextCursor, loadingMore, loadMore, markOpened, noteRead]
  );
}
