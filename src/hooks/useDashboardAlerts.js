import { useState, useEffect, useCallback, useRef } from "react";

const ALERTS_API = "https://x5tlald4r8.execute-api.us-east-1.amazonaws.com/dev";

// How often to re-check for new orders/tickets. Kept deliberately long
// because the admin panel gets used on slow 2G connections — a shorter
// interval just burns bandwidth re-downloading mostly-unchanged data.
const POLL_INTERVAL_MS = 300000; // 5 minutes

// We remember when the admin last opened the bell, so anything newer than
// that counts as unread. Kept in localStorage so it survives page reloads
// (no backend read/unread state needed).
const LAST_SEEN_KEY = "notifications_last_seen";

const getLastSeen = () => {
  const stored = localStorage.getItem(LAST_SEEN_KEY);
  return stored ? new Date(stored).getTime() : 0;
};

// Shared logic for the dashboard alert strip and the navbar notification
// bell, so both read from the same single fetch instead of each polling
// the API separately.
export default function useDashboardAlerts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSeen, setLastSeen] = useState(getLastSeen);
  const lastFetchRef = useRef(0);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      lastFetchRef.current = Date.now();
      const res = await fetch(ALERTS_API);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching dashboard alerts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let intervalId = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(fetchAlerts, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    // Don't keep downloading in the background while the admin is in another
    // tab — on a slow connection that bandwidth is better spent elsewhere.
    // When they come back, refresh once if the data has gone stale.
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        if (Date.now() - lastFetchRef.current >= POLL_INTERVAL_MS) {
          fetchAlerts();
        }
        startPolling();
      }
    };

    fetchAlerts();
    startPolling();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchAlerts]);

  // Called when the admin opens the bell — everything currently in the list
  // becomes "read" from that moment on.
  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_KEY, now);
    setLastSeen(new Date(now).getTime());
  }, []);

  const notifications = (data?.notifications || []).map((n) => ({
    ...n,
    unread: new Date(n.timestamp).getTime() > lastSeen,
  }));

  const unreadCount = notifications.filter((n) => n.unread).length;

  return {
    data,
    loading,
    error,
    notifications,
    unreadCount,
    markAllRead,
    refresh: fetchAlerts,
  };
}

// Turns an ISO timestamp into "4 minutes ago" / "Yesterday" style text.
export const timeAgo = (iso) => {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
};