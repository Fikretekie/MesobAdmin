import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBellSlash,
  faComments,
  faDesktop,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import { useSupport } from "./SupportProvider";
import ConversationList from "./ConversationList";
import ChatThread from "./ChatThread";
import "./support.css";

// A deep link to a conversation that isn't on the first page of the list:
// page down this far looking for it (for the name/email in the header).
const MAX_PAGES_TO_FIND_LINKED = 5;

// The inbox fills the window below the header, however tall the navbar and
// toolbar turn out to be at this width. Re-measured when `layoutKey` changes
// (on phones the toolbar hides while a conversation is open).
function useFillViewport(ref, layoutKey) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      const panel = el.closest(".main-panel");
      const top = el.getBoundingClientRect().top + (panel ? panel.scrollTop : 0);
      el.style.height = `${Math.max(window.innerHeight - top - 20, 420)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ref, layoutKey]);
}

function Notice({ icon, title, children }) {
  return (
    <div className="support-card">
      <span className="support-card-icon" aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function ToolbarButton({ icon, label, active, onClick, pressed }) {
  return (
    <button
      type="button"
      className={`support-btn${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
    >
      <FontAwesomeIcon icon={icon} />
      <span className="support-btn-label">{label}</span>
    </button>
  );
}

function SupportInbox({ support }) {
  const navigate = useNavigate();
  const {
    inbox,
    activeUserId,
    drafts,
    muted,
    toggleMute,
    permission,
    requestNotifications,
    announcement,
    announce,
  } = support;

  const shellRef = useRef(null);
  useFillViewport(shellRef, Boolean(activeUserId));

  const conversation = activeUserId
    ? inbox.conversations.find((c) => c.userId === activeUserId)
    : null;

  const { loaded, hasMore, loadingMore, loadMore } = inbox;
  const searchRef = useRef({ userId: null, pages: 0 });
  useEffect(() => {
    if (!activeUserId || conversation || !loaded || !hasMore || loadingMore) return;
    if (searchRef.current.userId !== activeUserId) searchRef.current = { userId: activeUserId, pages: 0 };
    if (searchRef.current.pages >= MAX_PAGES_TO_FIND_LINKED) return;
    searchRef.current.pages += 1;
    loadMore();
  }, [activeUserId, conversation, loaded, hasMore, loadingMore, loadMore]);

  return (
    <div className={`support-inbox${activeUserId ? " has-thread" : ""}`}>
      <div className="support-toolbar">
        <p className="support-toolbar-info">Live chat with app customers</p>
        <div className="support-toolbar-actions">
          {permission === "default" && (
            <ToolbarButton
              icon={faDesktop}
              label="Enable desktop notifications"
              onClick={requestNotifications}
            />
          )}
          {permission === "denied" && (
            <span className="support-toolbar-hint">
              Desktop notifications are blocked for this site in your browser settings
            </span>
          )}
          <ToolbarButton
            icon={muted ? faBellSlash : faBell}
            label="Mute notifications"
            active={muted}
            pressed={muted}
            onClick={toggleMute}
          />
        </div>
      </div>

      <div ref={shellRef} className="support-shell">
        <ConversationList inbox={inbox} activeUserId={activeUserId} />
        <section className="support-thread-pane" aria-label="Conversation">
          {activeUserId ? (
            <ChatThread
              key={activeUserId}
              userId={activeUserId}
              conversation={conversation}
              drafts={drafts}
              onRead={inbox.noteRead}
              announce={announce}
              onBack={() => navigate("/admin/support")}
            />
          ) : (
            <div className="support-select">
              <FontAwesomeIcon icon={faComments} aria-hidden="true" />
              <p>Select a conversation</p>
            </div>
          )}
        </section>
      </div>

      <div className="support-sr-only" aria-live="polite" aria-atomic="true">
        {announcement && <span key={announcement.id}>{announcement.text}</span>}
      </div>
    </div>
  );
}

function SupportPage() {
  const support = useSupport();
  const { status, unreadTotal } = support;

  // Pages without their own <Helmet> (Tickets, for one) keep the last title
  // set; don't leave a stale unread count in the tab after leaving.
  useEffect(
    () => () => {
      document.title = "Mesob Store";
    },
    []
  );

  const body =
    status === "unconfigured" ? (
      <Notice icon={faHeadset} title="Support chat isn't set up yet">
        <p>
          Add <code>REACT_APP_SUPPORT_CHAT_API_URL</code> to <code>.env</code>, then restart the dev
          server or rebuild.
        </p>
      </Notice>
    ) : (
      <SupportInbox support={support} />
    );

  return (
    <>
      <Helmet>
        <title>{`${unreadTotal > 0 ? `(${unreadTotal}) ` : ""}Support - Mesob Store`}</title>
      </Helmet>
      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Support</h2>
          </div>
        }
      />
      <div className="content support-page">{body}</div>
    </>
  );
}

export default SupportPage;
