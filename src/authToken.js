/**
 * authToken.js
 *
 * The admin API used to answer anyone who knew its URL - a request to
 * /users returned every customer and their family's address, with no login
 * required. The API now issues a signed token at login and will start
 * refusing requests that arrive without one.
 *
 * Rather than edit 109 call sites across 20 files, this installs the token
 * once at the application's entry point: an axios interceptor and a wrapper
 * around window.fetch. Everything in the app keeps calling the API exactly
 * as it does today and the header is added underneath.
 *
 * Imported for side effects from src/index.js, before anything renders.
 */
import axios from "axios";

const TOKEN_KEY = "auth_token";

/**
 * Only our own API gets the token. A token attached to a third-party
 * request is a token handed to a third party.
 */
const API_HOSTS = [
  "2uys9kc217.execute-api.us-east-1.amazonaws.com",
  "igxw2trwl1.execute-api.us-east-1.amazonaws.com", // whatsapp
];

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    // private browsing, blocked storage - the app still works, the user
    // just gets asked to log in again next time
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch (e) {
    return "";
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

function isOurApi(url) {
  if (!url) return false;
  try {
    const u = new URL(String(url), window.location.origin);
    return API_HOSTS.includes(u.host);
  } catch (e) {
    // a relative path that failed to parse is same-origin, not our API
    return false;
  }
}

/**
 * The session has expired or was never valid. Send the user back to the
 * login screen rather than leaving them on a page of empty tables
 * wondering what broke.
 */
function sessionExpired() {
  clearToken();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

// --- axios (76 call sites) --------------------------------------------------
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token && isOurApi(config.url)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) sessionExpired();
    return Promise.reject(error);
  }
);

// --- fetch (33 call sites) --------------------------------------------------
const originalFetch = window.fetch.bind(window);

window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url;
  const token = getToken();

  if (token && isOurApi(url)) {
    const headers = new Headers(
      init.headers || (typeof input === "object" ? input.headers : undefined) || {}
    );
    if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    init = { ...init, headers };
  }

  const res = await originalFetch(input, init);

  // Don't bounce on a failed login attempt - that 401 is the user mistyping
  // their password, not an expired session.
  if (res.status === 401 && isOurApi(url) && !String(url).includes("/login")) {
    sessionExpired();
  }
  return res;
};