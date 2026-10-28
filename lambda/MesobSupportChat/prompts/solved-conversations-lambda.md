# Support chat Lambda: solved conversations and new chats

You're working on the support chat Lambda `MesobSupportChat` (`lambda/MesobSupportChat/index.mjs`, Node.js 22, AWS SDK v3 from the runtime, no npm dependencies). It serves the Mesob Store mobile app (customers) and the admin portal (support staff) from one POST endpoint, routed by `action` in the JSON body.

**Status:** this is already implemented in `index.mjs` and tested locally. Use this brief to review the implementation, to re-implement it, or as the contract for the admin portal and the mobile app.

## Goal

Support staff and customers can mark a chat as **solved**. The customer can then **start a new chat**. History stays in one thread per customer, and each solved/new boundary is a divider in it.

## Data

Everything lives in the existing DynamoDB table (`TABLE_NAME`, default `MesobSupportChat`, keys `pk`/`sk`).

- **Conversation record** (`pk = CONV#<sub>`, `sk = META`) gains:
  - `status`: `"open"` or `"solved"`. Missing (older conversations) means `"open"`.
  - `ticketNumber`: 1 for the first conversation, +1 each time a solved chat starts again. Missing means 1.
  - `solvedAt` (ISO time) and `solvedBy` (`"user"` or `"admin"`): set while solved, removed when it reopens.
- **System messages** are ordinary message items (`sk = MSG#<id>`, same id format `<ISO time>#<8 random chars>`) with:
  `{ sender: "system", event: "solved" | "reopened", by: "user" | "admin", text: "" }`.
  They come back from `getMessages` like any message, including in polls (`after`), so both clients see them live.

## Actions

| Action | Who | Body | Returns |
|---|---|---|---|
| `resolveConversation` | customer, or admin with `userId` | none | `{ message, conversation }`. `message` is the new `solved` system message, or `null` if it was already solved |
| `startNewConversation` | customer, or admin with `userId` | none | `{ message, conversation }`. `message` is the new `reopened` system message, or `null` if it wasn't solved |

`conversation` is `{ status, ticketNumber, solvedAt, solvedBy }`.

Changes to existing actions:
- **`sendMessage` to a solved conversation reopens it:** it writes a `reopened` system message 1 ms before the new message in the same transaction, sets `status: "open"`, increments `ticketNumber`, and removes `solvedAt`/`solvedBy`. This applies to both sides; a support reply reopens the chat and still sends the push notification.
- **`getMessages`:** `conversation` also carries `status`, `ticketNumber`, `solvedAt`, `solvedBy`.
- **`listConversations`:** each row also carries those four fields. A new optional `status` filter (`"open"` or `"solved"`; anything else is a 400). Rows without a status count as open. A filtered page can hold fewer than `limit` rows; keep paging with `nextCursor` until it's null.

## Rules

- `resolveConversation` on a conversation that doesn't exist → 400 `There is no conversation to mark as solved`.
- Both actions are idempotent. Status changes use a transaction with a condition on `status`, so two people clicking at once produce one system message; the loser gets `message: null` and the current state.
- Marking solved clears both typing flags. It doesn't change unread counts, `lastMessageText` or the conversation order, and sends no push.
- `status` is a DynamoDB reserved word: always use `ExpressionAttributeNames`.

## Tests to keep passing

1. A new conversation is open, ticket 1.
2. Admin marks solved → `solved` system message (also returned by an `after` poll), status solved, `solvedBy: "admin"`.
3. Marking solved twice → one system message.
4. `listConversations` with `status: "solved"` / `"open"` returns only those; a bad value → 400.
5. Customer `startNewConversation` → `reopened` message, ticket 2; repeating does nothing.
6. Customer can mark solved (`solvedBy: "user"`).
7. Customer writes to a solved chat → `solved`, `reopened`, then the message, in that order; ticket 3.
8. Admin writes to a solved chat → reopens it and still pushes to the customer's phones.
9. Normal messages never carry `event`; system messages always have `event`, `by` and empty `text`.

## Don't

- Don't change the message id format, existing fields, or other actions' responses.
- Don't delete history when a chat is solved.
