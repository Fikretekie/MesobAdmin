// Display helpers for the support inbox: names, avatars, times, links.

// Same palette as the Dashboard's customer avatars.
const AVATAR_COLORS = ["#8b5cf6", "#10b981", "#ec4899", "#3b82f6", "#f59e0b", "#06b6d4", "#ef4444"];

// Keyed on userId rather than the name, so a customer keeps their colour even
// if they change their name in the app.
export function avatarColor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export const displayName = (c) => (c && (c.userName || c.userEmail)) || "Customer";

export function initials(name) {
  const words = (name || "")
    .replace(/@.*/, "") // an email address: use the part before the @
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

// ---------------------------------------------------------------------------
// Times
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
// Calendar days between two dates. Math.round absorbs daylight-saving shifts.
const daysAgo = (d, now) => Math.round((startOfDay(now) - startOfDay(d)) / DAY_MS);

// "3:05 PM"
export const formatClock = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// Conversation list: "3:05 PM" today, "Yesterday", "Tuesday" within the
// last 6 days, otherwise "Oct 3".
export function formatListTime(iso, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = daysAgo(d, now);
  if (days <= 0) return formatClock(d);
  if (days === 1) return "Yesterday";
  if (days <= 6) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Thread day separators: "Today", "Yesterday", "Tue, Oct 27", "Oct 27, 2025".
export function formatDayLabel(iso, now = new Date()) {
  const d = new Date(iso);
  const days = daysAgo(d, now);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const dayKey = (iso) => new Date(iso).toDateString();

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;
const TRAILING_PUNCTUATION = /[.,!?;:'")\]]+$/;

// Splits message text into plain-text and link parts. The caller renders
// them as React text and <a> elements - message text is never treated as HTML.
export function splitLinks(text) {
  const parts = [];
  let last = 0;
  text.replace(URL_RE, (match, offset) => {
    const url = match.replace(TRAILING_PUNCTUATION, "");
    if (offset > last) parts.push({ text: text.slice(last, offset) });
    parts.push({ text: url, href: url.startsWith("www.") ? `https://${url}` : url });
    last = offset + url.length;
    return match;
  });
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
