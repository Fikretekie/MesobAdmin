// Support chat settings. This is a CRA app, so they come from REACT_APP_*
// variables in .env and are baked in at build time.
export const SUPPORT_CHAT_API_URL = process.env.REACT_APP_SUPPORT_CHAT_API_URL || "";

export const isSupportConfigured = Boolean(SUPPORT_CHAT_API_URL);
