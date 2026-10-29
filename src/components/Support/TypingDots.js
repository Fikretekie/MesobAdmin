import React, { useEffect, useState } from "react";
import Avatar from "./Avatar";

// Three dots bouncing in a staggered wave (keyframes in support.css).
export function TypingDots() {
  return (
    <span className="support-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

// "typing•••" - stands in for the preview line in the list and the email
// line in the thread header.
export function TypingText({ name }) {
  return (
    <span className="support-typing-text" role="status" aria-label={`${name} is typing`}>
      typing
      <TypingDots />
    </span>
  );
}

const LEAVE_MS = 160;

// The bubble at the bottom of the thread. Stays mounted briefly after typing
// stops so it can fade out instead of vanishing.
export function TypingBubble({ show, name, seed }) {
  const [mounted, setMounted] = useState(show);

  useEffect(() => {
    if (show) {
      setMounted(true);
      return undefined;
    }
    const t = setTimeout(() => setMounted(false), LEAVE_MS);
    return () => clearTimeout(t);
  }, [show]);

  if (!show && !mounted) return null;
  return (
    <div className="support-msg is-theirs is-last">
      <div className="support-msg-row">
        <Avatar seed={seed} name={name} size={28} />
        <div
          className={`support-bubble support-typing-bubble${show ? "" : " is-leaving"}`}
          role="status"
          aria-label={`${name} is typing`}
        >
          <TypingDots />
        </div>
      </div>
    </div>
  );
}
