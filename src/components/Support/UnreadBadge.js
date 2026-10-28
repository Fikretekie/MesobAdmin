import React, { useLayoutEffect, useRef, useState } from "react";
import "./UnreadBadge.css";

// Red count pill, as on the navbar bell. Pops whenever the count goes up so a
// new message catches the eye; going down (reading) stays quiet.
function UnreadBadge({ count, className = "" }) {
  const prevRef = useRef(count);
  const [pops, setPops] = useState(0);

  // Layout effect: the re-render with the animation happens before paint, so
  // there's no frame of the badge at full size before it pops.
  useLayoutEffect(() => {
    if (count > prevRef.current) setPops((n) => n + 1);
    prevRef.current = count;
  }, [count]);

  if (!count) return null;
  return (
    <span
      // A new key remounts the span, which restarts the CSS animation.
      key={pops}
      className={`unread-badge${pops ? " is-popping" : ""} ${className}`}
      aria-label={`${count} unread`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default UnreadBadge;
