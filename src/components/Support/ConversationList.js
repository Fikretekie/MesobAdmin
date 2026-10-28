import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import ConversationRow from "./ConversationRow";
import { prefersReducedMotion } from "./motion";

// The first screenful of rows fades in one after another on first load.
const STAGGER_ROWS = 12;
const STAGGER_MS = 35;

// Today's date as a string, updated each minute: rows re-render (to turn
// "3:05 PM" into "Yesterday") only when the day actually changes.
function useToday() {
  const [today, setToday] = useState(() => new Date().toDateString());
  useEffect(() => {
    const id = setInterval(() => setToday(new Date().toDateString()), 60000);
    return () => clearInterval(id);
  }, []);
  return today;
}

// FLIP: when a row moves (a conversation jumps to the top on a new message),
// start it at its old position and let it slide into the new one.
function useFlip(containerRef, orderKey) {
  const positions = useRef(new Map());
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const nodes = container.querySelectorAll("[data-flip-key]");
    const next = new Map();
    nodes.forEach((node) => next.set(node.dataset.flipKey, node.offsetTop));

    if (!prefersReducedMotion()) {
      nodes.forEach((node) => {
        const before = positions.current.get(node.dataset.flipKey);
        const after = next.get(node.dataset.flipKey);
        if (before === undefined || before === after) return;
        node.style.transition = "none";
        node.style.transform = `translateY(${before - after}px)`;
        node.getBoundingClientRect(); // commit the starting position
        node.style.transition = "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)";
        node.style.transform = "";
      });
    }
    positions.current = next;
  }, [containerRef, orderKey]);
}

function ConversationList({ inbox, activeUserId }) {
  const { conversations, loaded, error, hasMore, loadingMore, loadMore } = inbox;
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const today = useToday();

  const listRef = useRef(null);
  const sentinelRef = useRef(null);

  const unreadCount = useMemo(
    () => conversations.filter((c) => c.unread > 0).length,
    [conversations]
  );

  const visible = useMemo(() => {
    let list = conversations;
    // The open conversation stays in the Unread tab after it's been read,
    // instead of vanishing from under the cursor.
    if (tab === "unread") list = list.filter((c) => c.unread > 0 || c.userId === activeUserId);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.userName || "").toLowerCase().includes(q) ||
          (c.userEmail || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, tab, search, activeUserId]);

  const orderKey = visible.map((c) => c.userId).join("|");
  useFlip(listRef, orderKey);

  // Which rows have been on screen before: only new arrivals animate in.
  const seenRef = useRef(new Set());
  const staggerRef = useRef(true);
  useEffect(() => {
    visible.forEach((c) => seenRef.current.add(c.userId));
    if (visible.length > 0) staggerRef.current = false;
  }, [visible]);

  // Infinite scroll. Only on the plain "All" view: the search box is for
  // conversations already loaded, and paging through everything to fill an
  // empty filter would be surprising.
  const autoLoad = tab === "all" && !search.trim() && hasMore && !loadingMore;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!autoLoad || !sentinel || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { root: listRef.current, rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [autoLoad, loadMore]);

  let empty = null;
  if (!loaded) {
    // The server's own message, so a misconfigured endpoint says what's wrong.
    empty = error ? `Couldn't load conversations (${error.message}). Retrying…` : null;
  } else if (visible.length === 0) {
    if (search.trim()) empty = `No loaded conversations match “${search.trim()}”`;
    else if (tab === "unread") empty = "You're all caught up";
    else empty = "No conversations yet";
  }

  return (
    <section className="support-list-pane" aria-label="Conversations">
      <div className="support-list-header">
        <div className="aurora-pill-row support-tabs" role="tablist" aria-label="Filter conversations">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            className={`aurora-pill${tab === "all" ? " active" : ""}`}
            onClick={() => setTab("all")}
          >
            All
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "unread"}
            className={`aurora-pill${tab === "unread" ? " active" : ""}`}
            onClick={() => setTab("unread")}
          >
            Unread ({unreadCount})
          </button>
        </div>
        <label className="support-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search loaded conversations"
            aria-label="Search loaded conversations by name or email"
          />
        </label>
      </div>

      <ul className="support-list" ref={listRef}>
        {!loaded && !error &&
          Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="support-row-skeleton" aria-hidden="true">
              <span className="support-skeleton-circle" />
              <span className="support-skeleton-lines">
                <span />
                <span />
              </span>
            </li>
          ))}

        {visible.map((c, i) => {
          const entering = !seenRef.current.has(c.userId);
          const stagger = entering && staggerRef.current && i < STAGGER_ROWS;
          return (
            <ConversationRow
              key={c.userId}
              conversation={c}
              selected={c.userId === activeUserId}
              entering={entering}
              delay={stagger ? i * STAGGER_MS : 0}
              today={today}
            />
          );
        })}

        {empty && <li className="support-empty-note">{empty}</li>}

        <li ref={sentinelRef} className="support-list-sentinel" aria-hidden={!loadingMore}>
          {loadingMore && "Loading more…"}
        </li>
      </ul>
    </section>
  );
}

export default ConversationList;
