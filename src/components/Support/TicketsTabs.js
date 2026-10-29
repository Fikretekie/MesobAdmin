import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useSupport } from "./SupportProvider";
import UnreadBadge from "./UnreadBadge";
import { CHAT_PATH, TICKETS_PATH } from "./paths";
import "./TicketsTabs.css";

// The bar at the top of both Tickets views: email/web tickets and live chat.
// `children` are the current view's own actions, shown on the right.
function TicketsTabs({ children }) {
  const { pathname } = useLocation();
  const { unreadTotal } = useSupport();
  const onChat = pathname === CHAT_PATH || pathname.startsWith(`${CHAT_PATH}/`);

  return (
    <div className="tickets-bar">
      <nav className="tickets-tabs" aria-label="Tickets">
        <Link
          to={TICKETS_PATH}
          className={`tickets-tab${onChat ? "" : " is-active"}`}
          aria-current={onChat ? undefined : "page"}
        >
          <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
          Email &amp; web
        </Link>
        <Link
          to={CHAT_PATH}
          className={`tickets-tab${onChat ? " is-active" : ""}`}
          aria-current={onChat ? "page" : undefined}
        >
          <FontAwesomeIcon icon={faComments} aria-hidden="true" />
          Live chat
          <UnreadBadge count={unreadTotal} />
        </Link>
      </nav>
      {children && <div className="tickets-bar-actions">{children}</div>}
    </div>
  );
}

export default TicketsTabs;
