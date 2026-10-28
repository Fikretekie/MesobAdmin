import React, { memo } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import UnreadBadge from "./UnreadBadge";
import { TypingText } from "./TypingDots";
import { displayName, formatListTime } from "./format";
import { conversationPath } from "./SupportProvider";

// Memoized: polls keep the same object for rows that didn't change (see
// mergeConversations), so only rows that did change re-render. The list also
// passes a `today` prop, purely so "3:05 PM" turns into "Yesterday" after
// midnight.
function ConversationRow({ conversation: c, selected, entering, delay }) {
  const name = displayName(c);
  const unread = c.unread > 0;

  return (
    <li
      data-flip-key={c.userId}
      className={`support-row-item${entering ? " is-entering" : ""}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <Link
        to={conversationPath(c.userId)}
        className={`support-row${selected ? " is-selected" : ""}${unread ? " is-unread" : ""}`}
        aria-current={selected ? "page" : undefined}
      >
        <Avatar seed={c.userId} name={name} size={42} />
        <span className="support-row-main">
          <span className="support-row-line">
            <span className="support-row-name">{name}</span>
            <span className="support-row-time">{formatListTime(c.lastMessageAt)}</span>
          </span>
          {c.userName && c.userEmail && <span className="support-row-email">{c.userEmail}</span>}
          <span className="support-row-line">
            <span className="support-row-preview">
              {c.userTyping ? (
                <TypingText name={name} />
              ) : (
                <>
                  {c.lastSender === "admin" && <span className="support-row-you">You: </span>}
                  {c.lastMessageText}
                </>
              )}
            </span>
            <UnreadBadge count={c.unread} />
          </span>
        </span>
      </Link>
    </li>
  );
}

export default memo(ConversationRow);
