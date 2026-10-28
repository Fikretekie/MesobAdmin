import {
  mergeMessages,
  addPending,
  setPendingStatus,
  newestConfirmedId,
  oldestConfirmedId,
  mergeConversations,
  markConversationRead,
  applyLocalReads,
  newCustomerMessages,
  totalUnread,
} from "./merge";

const msg = (iso, sender = "user", extra = {}) => ({
  id: `${iso}#abcd1234`,
  sender,
  text: `message at ${iso}`,
  createdAt: iso,
  ...extra,
});

const ids = (list) => list.map((m) => m.id);

describe("mergeMessages", () => {
  const a = msg("2026-10-28T10:00:00.000Z");
  const b = msg("2026-10-28T10:00:05.000Z");
  const c = msg("2026-10-28T10:00:09.000Z");
  const d = msg("2026-10-28T10:00:12.000Z");

  test("overlapping polls don't duplicate messages", () => {
    const first = mergeMessages([], [a, b, c]);
    // The next poll re-sends ~10 s before the cursor, plus one new message.
    const second = mergeMessages(first, [b, c, d]);
    expect(ids(second)).toEqual(ids([a, b, c, d]));
  });

  test("a poll that changes nothing returns the same array", () => {
    const first = mergeMessages([], [a, b]);
    expect(mergeMessages(first, [a, b])).toBe(first);
    expect(mergeMessages(first, [])).toBe(first);
  });

  test("keeps existing message objects when they are re-sent", () => {
    const first = mergeMessages([], [a, b]);
    const second = mergeMessages(first, [{ ...b }, c]);
    expect(second[1]).toBe(first[1]);
  });

  test("sorts confirmed messages by id even when they arrive out of order", () => {
    expect(ids(mergeMessages([], [c, a, d, b]))).toEqual(ids([a, b, c, d]));
  });

  test("a poll that delivers our message before the sendMessage response replaces the optimistic copy", () => {
    let state = mergeMessages([], [a]);
    state = addPending(state, { clientId: "cid-1", text: "hi", createdAt: "2026-10-28T10:00:10.000Z" });
    expect(state).toHaveLength(2);
    expect(state[1].localStatus).toBe("sending");

    const server = msg("2026-10-28T10:00:10.100Z", "admin", { text: "hi", clientId: "cid-1" });
    state = mergeMessages(state, [a, server]);
    expect(ids(state)).toEqual(ids([a, server]));
    expect(state.some((m) => m.localStatus)).toBe(false);
  });

  test("a late sendMessage response is a no-op", () => {
    let state = addPending(mergeMessages([], [a]), {
      clientId: "cid-1",
      text: "hi",
      createdAt: "2026-10-28T10:00:10.000Z",
    });
    const server = msg("2026-10-28T10:00:10.100Z", "admin", { text: "hi", clientId: "cid-1" });
    state = mergeMessages(state, [server]); // the poll got there first

    expect(mergeMessages(state, [server])).toBe(state); // late success
    expect(setPendingStatus(state, "cid-1", "failed")).toBe(state); // late failure
  });

  test("a failed send that actually reached the server heals on the next poll with no duplicate", () => {
    let state = addPending(mergeMessages([], [a]), {
      clientId: "cid-1",
      text: "hi",
      createdAt: "2026-10-28T10:00:10.000Z",
    });
    state = setPendingStatus(state, "cid-1", "failed");
    expect(state[1].localStatus).toBe("failed");

    const server = msg("2026-10-28T10:00:10.100Z", "admin", { text: "hi", clientId: "cid-1" });
    state = mergeMessages(state, [a, server]);
    expect(ids(state)).toEqual(ids([a, server]));
    expect(state.filter((m) => m.clientId === "cid-1")).toHaveLength(1);
  });

  test("older pages prepend in order and pending messages stay last", () => {
    let state = mergeMessages([], [c, d]);
    state = addPending(state, { clientId: "p1", text: "one", createdAt: "2026-10-28T10:00:13.000Z" });
    state = addPending(state, { clientId: "p2", text: "two", createdAt: "2026-10-28T10:00:14.000Z" });
    state = setPendingStatus(state, "p1", "failed");

    state = mergeMessages(state, [a, b]); // history page, oldest first
    expect(ids(state)).toEqual([...ids([a, b, c, d]), "pending:p1", "pending:p2"]);
    expect(state[4].localStatus).toBe("failed");
    expect(state[5].localStatus).toBe("sending");
  });

  test("new confirmed messages land before pending ones", () => {
    let state = addPending(mergeMessages([], [a]), {
      clientId: "p1",
      text: "x",
      createdAt: "2026-10-28T10:00:01.000Z",
    });
    state = mergeMessages(state, [b]);
    expect(ids(state)).toEqual([a.id, b.id, "pending:p1"]);
  });

  test("retrying keeps the same clientId and position", () => {
    let state = addPending([], { clientId: "p1", text: "x", createdAt: "2026-10-28T10:00:01.000Z" });
    state = setPendingStatus(state, "p1", "failed");
    state = setPendingStatus(state, "p1", "sending");
    expect(state).toEqual([expect.objectContaining({ clientId: "p1", localStatus: "sending" })]);
  });

  test("newest / oldest confirmed ids ignore pending messages", () => {
    let state = mergeMessages([], [a, b]);
    state = addPending(state, { clientId: "p1", text: "x", createdAt: "2026-10-28T10:00:06.000Z" });
    expect(newestConfirmedId(state)).toBe(b.id);
    expect(oldestConfirmedId(state)).toBe(a.id);
    expect(newestConfirmedId(addPending([], { clientId: "p", text: "x", createdAt: "" }))).toBeNull();
  });
});

describe("mergeConversations", () => {
  const conv = (userId, lastMessageAt, extra = {}) => ({
    userId,
    userEmail: `${userId}@example.com`,
    userName: userId.toUpperCase(),
    lastMessageAt,
    lastMessageText: "hello",
    lastSender: "user",
    unread: 0,
    userTyping: false,
    ...extra,
  });

  const one = conv("one", "2026-10-28T10:03:00.000Z");
  const two = conv("two", "2026-10-28T10:02:00.000Z");
  const three = conv("three", "2026-10-28T10:01:00.000Z");

  test("keeps object identity for unchanged rows", () => {
    const state = mergeConversations([], [one, two, three]);
    const next = mergeConversations(state, [{ ...one }, { ...two, userTyping: true }, { ...three }]);
    expect(next).not.toBe(state);
    expect(next[0]).toBe(state[0]);
    expect(next[1]).not.toBe(state[1]);
    expect(next[1].userTyping).toBe(true);
    expect(next[2]).toBe(state[2]);
  });

  test("returns the same array when nothing changed", () => {
    const state = mergeConversations([], [one, two]);
    expect(mergeConversations(state, [{ ...one }, { ...two }])).toBe(state);
  });

  test("re-sorts when a conversation gets a new message", () => {
    const state = mergeConversations([], [one, two, three]);
    const bumped = { ...three, lastMessageAt: "2026-10-28T10:04:00.000Z", unread: 1 };
    const next = mergeConversations(state, [bumped]);
    expect(next.map((c) => c.userId)).toEqual(["three", "one", "two"]);
    expect(next[1]).toBe(state[0]);
  });

  test("adds conversations from later pages without dropping loaded ones", () => {
    const state = mergeConversations([], [one, two]);
    const next = mergeConversations(state, [three]);
    expect(next.map((c) => c.userId)).toEqual(["one", "two", "three"]);
  });

  test("markConversationRead zeroes only that row", () => {
    const state = mergeConversations([], [conv("a", "2026-10-28T10:00:00.000Z", { unread: 3 }), two]);
    const find = (list, id) => list.find((c) => c.userId === id);
    const next = markConversationRead(state, "a");
    expect(find(next, "a").unread).toBe(0);
    expect(find(next, "two")).toBe(find(state, "two"));
    expect(markConversationRead(next, "a")).toBe(next);
  });

  test("applyLocalReads hides unread that a racing poll still reports", () => {
    const row = conv("a", "2026-10-28T10:00:00.000Z", { unread: 2 });
    expect(applyLocalReads([row], { a: "2026-10-28T10:00:00.000Z" })[0].unread).toBe(0);
    // A newer customer message is real unread again.
    const newer = { ...row, lastMessageAt: "2026-10-28T10:00:30.000Z" };
    expect(applyLocalReads([newer], { a: "2026-10-28T10:00:00.000Z" })[0].unread).toBe(2);
    expect(applyLocalReads([row], {})[0]).toBe(row);
  });

  test("newCustomerMessages finds customer messages only", () => {
    const before = [one, two];
    const after = [
      { ...one, lastMessageAt: "2026-10-28T10:05:00.000Z", lastSender: "user" },
      { ...two, lastMessageAt: "2026-10-28T10:05:00.000Z", lastSender: "admin" },
      conv("new", "2026-10-28T10:06:00.000Z"),
    ];
    expect(newCustomerMessages(before, after).map((c) => c.userId)).toEqual(["one", "new"]);
    expect(newCustomerMessages(before, before)).toEqual([]);
  });

  test("totalUnread sums the badges", () => {
    expect(totalUnread([conv("a", "", { unread: 2 }), conv("b", "", { unread: 3 }), one])).toBe(5);
  });
});
