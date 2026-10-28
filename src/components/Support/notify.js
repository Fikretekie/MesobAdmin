// Staff don't get push notifications, so the open portal tab is how they
// hear about new customer messages: a short chime plus a desktop notification.

const MUTE_KEY = "support_notifications_muted";

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch (e) {
    return false;
  }
}

export function saveMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch (e) {}
}

// ---- sound -----------------------------------------------------------------
// Synthesised rather than an audio file: nothing extra to download. Browsers
// only let a page start audio after the user has interacted with it, so the
// context is created on the first click/keypress (unlockAudio) and reused.
let audioCtx = null;

export function unlockAudio() {
  // Some keypresses (e.g. a shortcut to open DevTools) don't count as a user
  // gesture; trying then only earns a console warning. Wait for one that does.
  const activation = navigator.userActivation;
  if (activation && !activation.isActive) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
}

export function playChime() {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    [
      [880, 0],
      [1320, 0.11],
    ].forEach(([freq, offset]) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.32);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.35);
    });
  } catch (e) {}
}

// ---- desktop notifications ---------------------------------------------------
export const notificationsSupported = typeof window !== "undefined" && "Notification" in window;

export const notificationPermission = () =>
  notificationsSupported ? window.Notification.permission : "unsupported";

export function showDesktopNotification({ title, body, tag, onClick }) {
  if (notificationPermission() !== "granted") return;
  try {
    // tag: a second message from the same customer replaces their earlier
    // notification instead of stacking up.
    const n = new window.Notification(title, { body, tag, icon: "/logo.jpeg" });
    n.onclick = () => {
      window.focus();
      onClick();
      n.close();
    };
  } catch (e) {
    // Some mobile browsers only allow notifications from a service worker.
  }
}
