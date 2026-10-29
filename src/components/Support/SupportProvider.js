import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isSupportConfigured } from "./config";
import useInbox from "./useInbox";
import { CHAT_PATH_RE, conversationPath } from "./paths";
import { displayName } from "./format";
import {
  isMuted,
  saveMuted,
  unlockAudio,
  playChime,
  notificationsSupported,
  notificationPermission,
  showDesktopNotification,
} from "./notify";

const SupportContext = createContext(null);

// Outside the admin layout (seller and financial pages) there is no support
// inbox; the sidebar just sees zero unread.
const NO_SUPPORT = { enabled: false, unreadTotal: 0 };

export const useSupport = () => useContext(SupportContext) || NO_SUPPORT;

export { conversationPath };

/**
 * Mounted once in the admin layout. Holds the inbox poll (fast on the Support
 * page, a slow badge-only poll everywhere else), drafts, and the sound /
 * desktop notifications for new customer messages.
 *
 * There is no support sign-in: being in the admin portal is what makes you
 * support staff (see api.js).
 */
export function SupportProvider({ enabled, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const match = location.pathname.match(CHAT_PATH_RE);
  const pageMode = Boolean(match);
  const activeUserId = match && match[1] ? decodeURIComponent(match[1]) : null;

  const status = isSupportConfigured ? "ready" : "unconfigured";
  const ready = enabled && isSupportConfigured;

  const [muted, setMuted] = useState(isMuted);
  const [permission, setPermission] = useState(notificationPermission);
  const [announcement, setAnnouncement] = useState(null);
  // Unsent replies, per conversation, kept in memory while the portal is open.
  const draftsRef = useRef(new Map());

  const activeRef = useRef(activeUserId);
  const mutedRef = useRef(muted);
  useEffect(() => {
    activeRef.current = activeUserId;
    mutedRef.current = muted;
  }, [activeUserId, muted]);

  // Read out by the page's polite aria-live region. The id makes a repeat of
  // the same text count as a new announcement.
  const announce = useCallback((text) => {
    setAnnouncement((prev) => ({ id: (prev ? prev.id : 0) + 1, text }));
  }, []);

  // A customer wrote and the staff member isn't looking at that conversation:
  // the tab is in the background, or a different conversation is open. The
  // open conversation announces its own messages (see ChatThread).
  const handleNewCustomerMessages = useCallback(
    (conversations) => {
      const unseen = conversations.filter(
        (c) => document.hidden || c.userId !== activeRef.current
      );
      if (unseen.length === 0) return;
      announce(`New message from ${displayName(unseen[0])}: ${unseen[0].lastMessageText}`);
      if (mutedRef.current) return;
      playChime();
      unseen.forEach((c) =>
        showDesktopNotification({
          title: displayName(c),
          body: c.lastMessageText,
          tag: `support-${c.userId}`,
          onClick: () => navigate(conversationPath(c.userId)),
        })
      );
    },
    [announce, navigate]
  );

  const inbox = useInbox({
    enabled: ready,
    pageMode,
    onNewCustomerMessages: handleNewCustomerMessages,
  });

  const { markOpened, loaded } = inbox;
  useEffect(() => {
    if (activeUserId && loaded) markOpened(activeUserId);
  }, [activeUserId, loaded, markOpened]);

  // Browsers only allow sound after the user has interacted with the page.
  useEffect(() => {
    if (!pageMode) return undefined;
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [pageMode]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      saveMuted(!m);
      return !m;
    });
  }, []);

  // Must be called from a click: browsers ignore permission prompts that
  // weren't started by the user.
  const requestNotifications = useCallback(async () => {
    if (!notificationsSupported) return;
    unlockAudio();
    try {
      setPermission(await window.Notification.requestPermission());
    } catch (e) {
      setPermission(notificationPermission());
    }
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      status,
      inbox,
      unreadTotal: ready ? inbox.unreadTotal : 0,
      activeUserId,
      drafts: draftsRef.current,
      muted,
      toggleMute,
      permission,
      requestNotifications,
      announcement,
      announce,
    }),
    [
      enabled,
      status,
      inbox,
      ready,
      activeUserId,
      muted,
      toggleMute,
      permission,
      requestNotifications,
      announcement,
      announce,
    ]
  );

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
}
