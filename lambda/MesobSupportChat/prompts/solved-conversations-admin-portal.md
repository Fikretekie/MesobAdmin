# Admin portal: mark support chats as solved

You're working in the Mesob admin portal (React, this repo). The Support page lives in `src/components/Support/` (`SupportPage.js`, `ConversationList.js`, `ConversationRow.js`, `ChatThread.js`, `MessageBubble.js`, `Composer.js`, `useInbox.js`, `useConversation.js`, `merge.js`, `api.js`). It talks to the support chat Lambda through `supportChat(action, payload)` in `api.js`.

The backend already supports solved conversations (deployed). The mobile app already shows them. Build the portal side.

## Goal

Support staff can mark a customer's chat as **solved**, see which chats are open or solved, and reopen one. Customers can also mark their own chat solved and start a new one from the app; the portal must show that too.

## API (already live)

All calls are `supportChat(action, { userId, ... })` like the existing ones.

| Action | Body | Returns |
|---|---|---|
| `resolveConversation` | `userId` | `{ message, conversation }`. `message` is the new system message, or `null` if it was already solved |
| `startNewConversation` | `userId` | `{ message, conversation }`. Reopens a solved chat; `message` is `null` if it was already open |
| `listConversations` | `limit?`, `cursor?`, **new** `status?: "open" \| "solved"` | rows now also carry `status`, `ticketNumber`, `solvedAt`, `solvedBy` |
| `getMessages` | as today | `conversation` now also carries `status`, `ticketNumber`, `solvedAt`, `solvedBy` |

- `status` is `"open"` or `"solved"`. `ticketNumber` starts at 1 and goes up each time a solved chat is reopened. `solvedBy` is `"admin"` or `"user"`.
- **System messages:** the thread now contains messages with `sender: "system"`, `event: "solved" | "reopened"`, `by: "admin" | "user"` and `text: ""`. They arrive through the normal `getMessages` polling.
- **Sending a reply to a solved chat reopens it automatically.** The server inserts a `reopened` system message just before the reply.
- A filtered `listConversations` page can hold fewer than `limit` rows; keep using `nextCursor`.

## What to build

1. **System messages in the thread** (`ChatThread.js`, `MessageBubble.js`)
   - Today `MessageBubble` treats any sender other than `"admin"` as the customer, so a system message would show as an empty customer bubble. Render `sender === "system"` as a centered divider instead: a thin line, and a pill with an icon, the text and the time.
   - Text: `solved` by admin → "Marked as solved by support"; `solved` by user → "Customer marked this as solved"; `reopened` → "New conversation started" (add "by the customer" or "by support" from `by`).
   - System messages don't group with bubbles: reset `prevSender` after one.
   - No unread, sound or desktop notification for system messages. `useConversation.js` already only treats `sender === "user"` as customer messages; keep it that way.

2. **Thread header** (`ChatThread.js`, `<header className="support-thread-header">`)
   - When the chat is open: a **Mark as solved** button (check icon). Disable it and show a spinner while the call runs. On success, merge the returned `message` into the thread so the divider shows at once, and update the status.
   - When solved: a green **Solved** badge with "by support" / "by customer" and the time (`solvedAt`), plus a **Reopen** button that calls `startNewConversation`.
   - Keep the status in the conversation state from `getMessages` (`useConversation.js` already copies `peerTyping` and `peerLastReadAt` from `convo` into state; add `status`, `ticketNumber`, `solvedBy`, `solvedAt` the same way) so a solve from the customer's phone shows up on the next poll.
   - If `ticketNumber > 1`, show "Chat #N" in the header.

3. **Composer when solved** (`Composer.js`)
   - Keep it enabled; sending reopens the chat on the server. Above it, show a quiet one-line note: "This chat is solved. Sending a message reopens it."

4. **Conversation list** (`ConversationList.js`, `ConversationRow.js`, `merge.js`, `useInbox.js`)
   - Add `status`, `ticketNumber`, `solvedAt` and `solvedBy` to `CONVERSATION_FIELDS` in `merge.js`, or rows won't update when the status changes.
   - Tabs: **Open** (default), **Solved**, **All**, next to the existing Unread pill. Filter the loaded rows on the client by `status`, treating a missing status as open, so polling and the existing Unread logic keep working. The `status` filter on `listConversations` is there if you later page solved chats separately.
   - Keep the conversation that's open in the thread visible in its tab, even after its status changes. The Unread tab already does this.
   - Rows for solved chats: a small green check badge, slightly muted text. A customer's new message reopens the chat, so it moves back to Open by itself on the next poll.
   - Empty states: Open → "No open chats", Solved → "No solved chats yet".

5. **Errors:** if a call fails, show the existing error toast or inline error ("Couldn't mark as solved. Try again.") and leave the state unchanged.

## Testing

1. Mark an open chat solved: the divider appears at once, the header shows Solved, and the row moves to the Solved tab.
2. On the phone, the customer sees "Support marked this chat as solved" and a **Start a new chat** button.
3. The customer taps **Start a new chat**: within a few seconds the portal shows "New conversation started by the customer", the header shows Chat #2, and the row is back in Open.
4. The customer taps **Solved** in the app: the portal shows "Customer marked this as solved" and the row moves to Solved.
5. Reply to a solved chat: it reopens, the divider comes before your reply, and the customer gets the push notification.
6. **Reopen** button: the chat goes back to Open with a "New conversation started by support" divider.
7. Two staff click Mark as solved at once: only one divider appears.
8. Older conversations without a status show as Open.

## Don't

- Don't change `api.js` authentication or the polling intervals.
- Don't hide or delete history when a chat is solved.
- Don't count system messages as unread or play notification sounds for them.
