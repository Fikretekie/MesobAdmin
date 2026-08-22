import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useDashboardAlerts, { timeAgo } from "hooks/useDashboardAlerts";

// Colour + icon per notification type, so orders and tickets are
// distinguishable at a glance in the dropdown.
const TYPE_STYLES = {
  order: { icon: "now-ui-icons shopping_bag-16", color: "#93c5fd" },
  ticket: { icon: "now-ui-icons ui-2_chat-round", color: "#c4b5fd" },
};

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { notifications, unreadCount, markAllRead, loading } = useDashboardAlerts();

  // Close the panel when clicking anywhere outside it.
  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const togglePanel = () => {
    const next = !open;
    setOpen(next);
    // Opening the panel is what marks things read.
    if (next && unreadCount > 0) markAllRead();
  };

  const handleItemClick = (n) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", marginRight: 8 }}>
      <button
        onClick={togglePanel}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px 10px",
          position: "relative",
          lineHeight: 1,
        }}
      >
        <i
          className="now-ui-icons ui-1_bell-53"
          style={{ fontSize: 20, color: "rgba(255,255,255,0.7)" }}
        />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "#ef4444",
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              padding: "1px 5px",
              borderRadius: 8,
              minWidth: 16,
              textAlign: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            width: 330,
            maxWidth: "calc(100vw - 32px)",
            background: "rgba(26,16,53,0.98)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            overflow: "hidden",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "11px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
              Notifications
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
              {notifications.length} recent
            </span>
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {loading && notifications.length === 0 && (
              <div
                style={{
                  padding: "18px 14px",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 12.5,
                  textAlign: "center",
                }}
              >
                Loading...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div
                style={{
                  padding: "18px 14px",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 12.5,
                  textAlign: "center",
                }}
              >
                Nothing new right now.
              </div>
            )}

            {notifications.map((n, i) => {
              const s = TYPE_STYLES[n.type] || TYPE_STYLES.order;
              return (
                <div
                  key={`${n.type}-${n.id}-${i}`}
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "11px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: n.unread ? "rgba(96,165,250,0.07)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <i
                    className={s.icon}
                    style={{
                      fontSize: 15,
                      color: n.unread ? s.color : "rgba(255,255,255,0.4)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12.5,
                        color: n.unread ? "#fff" : "rgba(255,255,255,0.6)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.title}
                      {n.subtitle ? ` · ${n.subtitle}` : ""}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {timeAgo(n.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;