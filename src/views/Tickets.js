import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Spinner } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faSearch } from "@fortawesome/free-solid-svg-icons";
import TicketsTabs from "components/Support/TicketsTabs";
import TicketDetail from "./TicketDetail";
import "components/Support/email-tickets.css";

const TICKETS_API = "https://xe00jwul2g.execute-api.us-east-1.amazonaws.com/dev/tickets";

const STATUS_COLORS = {
  open: { bg: "rgba(251,191,36,0.15)", text: "#fde68a" },
  closed: { bg: "rgba(74,222,128,0.15)", text: "#86efac" },
};

const SOURCE_BADGES = {
  contact_us_web: { label: "WEB", bg: "rgba(249,115,22,0.18)", text: "#fdba74" },
  contact_us_app: { label: "APP", bg: "rgba(167,139,250,0.18)", text: "#c4b5fd" },
  email_direct: { label: "EMAIL", bg: "rgba(74,222,128,0.18)", text: "#86efac" },
};
const DEFAULT_SOURCE_BADGE = { label: "OTHER", bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.6)" };

function Tickets() {
  const navigate = useNavigate();
  const { id } = useParams();
  const shellRef = useRef(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("open");
  useLayoutEffect(() => {
    const fit = () => {
      const el = shellRef.current;
      if (!el) return;
      const panel = el.closest(".main-panel");
      const top = el.getBoundingClientRect().top + (panel ? panel.scrollTop : 0);
      el.style.height = `${Math.max(window.innerHeight - top - 20, 420)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const updateTicket = (updated) => {
    setTickets((current) => current.map((ticket) => ticket.id === updated.id ? updated : ticket));
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(TICKETS_API);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredData = tickets
    .filter((t) => (t.status || "open") === activeTab)
    .filter(
      (t) =>
        t.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.message?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
    );

  const openCount = tickets.filter((t) => (t.status || "open") === "open").length;
  const closedCount = tickets.filter((t) => t.status === "closed").length;

  return (
    <div className="content email-tickets-page">
      <TicketsTabs />
      <div ref={shellRef} className={`email-inbox-shell${id ? " has-ticket" : ""}`}>
        <aside className="email-inbox-list" aria-label="Support tickets">
          <div className="email-inbox-list-header">
            <div className="email-inbox-filters" aria-label="Ticket status">
              {[ ["open", openCount], ["closed", closedCount] ].map(([status, count]) => (
                <button key={status} type="button" className={`email-inbox-filter${activeTab === status ? " is-active" : ""}`}
                  aria-pressed={activeTab === status} onClick={() => setActiveTab(status)}>
                  {status === "open" ? "Open" : "Closed"} ({count})
                </button>
              ))}
            </div>
            <div className="email-inbox-search">
              <FontAwesomeIcon icon={faSearch} aria-hidden="true" />
              <Input type="search" placeholder="Search by customer or message..." aria-label="Search tickets"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="email-inbox-rows">
            {loading ? <div className="email-inbox-notice"><Spinner size="sm" /> Loading tickets...</div> :
              filteredData.length === 0 ? <div className="email-inbox-notice">No {activeTab} tickets.</div> :
              filteredData.map((ticket) => {
                const source = SOURCE_BADGES[ticket.source] || DEFAULT_SOURCE_BADGE;
                const status = STATUS_COLORS[ticket.status || "open"] || STATUS_COLORS.open;
                const lastReply = ticket.replies?.[ticket.replies.length - 1];
                const preview = (lastReply?.message || ticket.message || "").replace(/<[^>]*>/g, " ");
                return (
                  <button key={ticket.id} type="button" className={`email-inbox-row${id === ticket.id ? " is-selected" : ""}`}
                    aria-current={id === ticket.id ? "true" : undefined}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}>
                    <span className="email-inbox-avatar" aria-hidden="true">{(ticket.customerEmail || "?").slice(0, 1).toUpperCase()}</span>
                    <span className="email-inbox-row-content">
                      <span className="email-inbox-row-top"><strong title={ticket.customerEmail}>{ticket.customerEmail}</strong>
                        <time title={new Date(ticket.updatedAt || ticket.createdAt).toLocaleString()}>
                          {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}
                        </time>
                      </span>
                      <span className="email-inbox-preview">{lastReply && lastReply.from !== "customer" ? "You: " : ""}{preview || "No message"}</span>
                      <span className="email-inbox-row-meta">
                        <span style={{ background: source.bg, color: source.text }}>{source.label}</span>
                        <span style={{ background: status.bg, color: status.text }}>{ticket.status || "open"}</span>
                        {lastReply?.repliedBy && <small title={lastReply.repliedBy}>Replied by {lastReply.repliedBy}</small>}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </aside>
        <section className="email-inbox-detail" aria-label="Ticket details">
          {id ? <TicketDetail key={id} embedded onTicketUpdated={updateTicket} /> : (
            <div className="email-inbox-empty">
              <span className="email-inbox-empty-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
              <h3>Email &amp; web support</h3>
              <p>Pick a ticket to read the conversation and reply.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Tickets;
