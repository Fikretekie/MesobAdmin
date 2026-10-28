/**
 * merge.js
 *
 * Pure helpers that fold API responses into the inbox and thread state.
 * No React and no I/O, so every rule can be unit-tested (merge.test.js).
 *
 * Thread rules:
 *  1. Dedupe by id - polls deliberately re-send the last ~10 s of messages.
 *  2. Confirmed (server) messages are sorted by id, which sorts by time.
 *  3. Optimistic messages (sending / failed) always come after them.
 *  4. A server message with the same clientId as an optimistic one replaces
 *     it - even when it arrives by poll before the sendMessage response does.
 *  5. (Ignoring responses for a conversation that is no longer open is the
 *     caller's job: see useConversation.)
 *
 * Every function returns the previous array unchanged when nothing changed,
 * so React can skip the re-render.
 */

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const isPending = (m) => m.localStatus === "sending" || m.localStatus === "failed";

// A React key that survives the optimistic -> confirmed swap, so the bubble
// isn't remounted (and re-animated) when the server copy replaces it.
export const messageKey = (m) => (m.clientId ? `c:${m.clientId}` : m.id);

const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function mergeMessages(prev, incoming) {
  if (!incoming || incoming.length === 0) return prev;

  const confirmed = new Map();
  const pending = [];
  prev.forEach((m) => {
    if (isPending(m)) pending.push(m);
    else confirmed.set(m.id, m);
  });

  let added = false;
  incoming.forEach((m) => {
    if (!confirmed.has(m.id)) {
      confirmed.set(m.id, m);
      added = true;
    }
  });

  const echoed = new Set();
  confirmed.forEach((m) => {
    if (m.clientId) echoed.add(m.clientId);
  });
  const stillPending = pending.filter((p) => !echoed.has(p.clientId));

  if (!added && stillPending.length === pending.length) return prev;
  return Array.from(confirmed.values()).sort(byId).concat(stillPending);
}

export function addPending(prev, { clientId, text, createdAt, attachments }) {
  return prev.concat({
    id: `pending:${clientId}`,
    clientId,
    sender: "admin",
    text,
    createdAt,
    localStatus: "sending",
    ...(attachments && attachments.length > 0 && { attachments }),
  });
}

// Changes fields of an optimistic message (status, upload progress). No-op
// (same array back) when the message has already been confirmed, so a late
// failure can't resurrect a message the server did receive.
export function updatePending(prev, clientId, patch) {
  let found = false;
  const next = prev.map((m) => {
    if (!isPending(m) || m.clientId !== clientId) return m;
    if (Object.keys(patch).every((k) => m[k] === patch[k])) return m;
    found = true;
    return { ...m, ...patch };
  });
  return found ? next : prev;
}

export const setPendingStatus = (prev, clientId, localStatus) =>
  updatePending(prev, clientId, { localStatus });

export function newestConfirmedId(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (!isPending(messages[i])) return messages[i].id;
  }
  return null;
}

export function oldestConfirmedId(messages) {
  const first = messages.find((m) => !isPending(m));
  return first ? first.id : null;
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

const CONVERSATION_FIELDS = [
  "userEmail",
  "userName",
  "lastMessageAt",
  "lastMessageText",
  "lastSender",
  "unread",
  "userTyping",
];

const sameConversation = (a, b) => CONVERSATION_FIELDS.every((k) => a[k] === b[k]);

const time = (iso) => Date.parse(iso) || 0;

// Most recent activity first. Array#sort is stable, so ties keep their order
// and rows don't shuffle between polls.
const byRecency = (a, b) => time(b.lastMessageAt) - time(a.lastMessageAt);

// Merge by userId. Rows whose fields didn't change keep their old object, so
// memoized rows skip re-rendering on every poll.
export function mergeConversations(prev, incoming) {
  if (!incoming || incoming.length === 0) return prev;

  const byUser = new Map(prev.map((c) => [c.userId, c]));
  let changed = false;
  incoming.forEach((c) => {
    const old = byUser.get(c.userId);
    if (old && sameConversation(old, c)) return;
    byUser.set(c.userId, c);
    changed = true;
  });

  if (!changed) return prev;
  return Array.from(byUser.values()).sort(byRecency);
}

// Opening a conversation zeroes its badge straight away, before the server
// has confirmed the read.
export function markConversationRead(prev, userId) {
  let found = false;
  const next = prev.map((c) => {
    if (c.userId === userId && c.unread > 0) {
      found = true;
      return { ...c, unread: 0 };
    }
    return c;
  });
  return found ? next : prev;
}

// A list poll that raced the markRead call can still report a conversation
// as unread. readUpTo maps userId -> the time up to which support has read it
// here; rows with nothing newer than that are shown as read.
export function applyLocalReads(incoming, readUpTo) {
  return incoming.map((c) => {
    const upTo = readUpTo[c.userId];
    if (c.unread > 0 && upTo && time(c.lastMessageAt) <= time(upTo)) {
      return { ...c, unread: 0 };
    }
    return c;
  });
}

// Conversations in `next` whose newest message is a customer message that
// wasn't there in `prev`. Drives sounds and desktop notifications.
export function newCustomerMessages(prev, next) {
  const before = new Map(prev.map((c) => [c.userId, c]));
  return next.filter((c) => {
    if (c.lastSender !== "user") return false;
    const old = before.get(c.userId);
    return !old || time(c.lastMessageAt) > time(old.lastMessageAt);
  });
}

export const totalUnread = (conversations) =>
  conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
