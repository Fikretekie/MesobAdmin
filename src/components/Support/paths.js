// Live chat lives under Tickets: /admin/tickets/chat[/<userId>].
export const TICKETS_PATH = "/admin/tickets";
export const CHAT_PATH = "/admin/tickets/chat";

export const CHAT_PATH_RE = /^\/admin\/tickets\/chat(?:\/([^/]+))?\/?$/;

export const conversationPath = (userId) => `${CHAT_PATH}/${encodeURIComponent(userId)}`;
