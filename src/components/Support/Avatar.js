import React from "react";
import { avatarColor, initials } from "./format";

function Avatar({ seed, name, size = 40 }) {
  return (
    <span
      className="support-avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: avatarColor(seed),
        fontSize: Math.round(size * 0.38),
      }}
    >
      {initials(name)}
    </span>
  );
}

export default Avatar;
