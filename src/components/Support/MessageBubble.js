import React, { memo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCheckDouble,
  faClock,
  faFilePdf,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import Avatar from "./Avatar";
import { formatClock, splitLinks } from "./format";
import { messageKey } from "./merge";
import { formatBytes, isImageType, localPreviews } from "./attachments";

// Message text is rendered as React text, never as HTML. pre-wrap (in CSS)
// keeps the customer's line breaks; URLs become links.
function MessageText({ text }) {
  return splitLinks(text).map((part, i) =>
    part.href ? (
      <a key={i} href={part.href} target="_blank" rel="noopener noreferrer">
        {part.text}
      </a>
    ) : (
      <React.Fragment key={i}>{part.text}</React.Fragment>
    )
  );
}

function Status({ message, seen }) {
  if (message.localStatus === "sending") {
    return <FontAwesomeIcon icon={faClock} className="support-status" title="Sending" aria-label="Sending" />;
  }
  if (message.localStatus === "failed") return null; // the retry line says it
  if (seen) {
    return (
      <FontAwesomeIcon icon={faCheckDouble} className="support-status is-seen" title="Seen" aria-label="Seen" />
    );
  }
  return <FontAwesomeIcon icon={faCheck} className="support-status" title="Sent" aria-label="Sent" />;
}

// Images get a fixed-size thumbnail, so the thread doesn't jump as they load.
// Keys starting "local:" belong to a message still being sent.
function ImageAttachment({ attachment: a, onOpen, onRefresh }) {
  const [src, setSrc] = useState(() => localPreviews.get(a.key) || a.url);
  const [broken, setBroken] = useState(false);
  const refreshed = useRef(false);
  const local = a.key.startsWith("local:");

  // The download link has probably expired: ask for a fresh one, once.
  const handleError = () => {
    if (refreshed.current || local) {
      setBroken(true);
      return;
    }
    refreshed.current = true;
    onRefresh(a.key)
      .then(setSrc)
      .catch(() => setBroken(true));
  };

  return (
    <button
      type="button"
      className="support-attachment-image"
      onClick={() => onOpen(a)}
      disabled={local || broken}
      aria-label={`Open ${a.name}`}
      title={a.name}
    >
      {src && !broken ? (
        <img src={src} alt={a.name} loading="lazy" onError={handleError} />
      ) : (
        <span className="support-attachment-missing">
          <FontAwesomeIcon icon={faImage} />
          Image unavailable
        </span>
      )}
    </button>
  );
}

function FileAttachment({ attachment: a, onOpen }) {
  return (
    <button
      type="button"
      className="support-attachment-file"
      onClick={() => onOpen(a)}
      disabled={a.key.startsWith("local:")}
    >
      <FontAwesomeIcon icon={faFilePdf} className="support-attachment-file-icon" />
      <span className="support-attachment-file-text">
        <span className="support-attachment-file-name">{a.name}</span>
        <span className="support-attachment-file-size">{formatBytes(a.size)}</span>
      </span>
    </button>
  );
}

// `grouped`: continues the previous message's run; `last`: ends its run, so
// it carries the time, the status and (for the customer) the avatar.
function MessageBubble({
  message,
  seen,
  grouped,
  last,
  customerId,
  customerName,
  animate,
  onRetry,
  onOpenAttachment,
  onRefreshUrl,
}) {
  // Decided once, when the bubble first mounts: history doesn't animate in,
  // and a later re-render must not restart the animation.
  const [enter] = useState(animate);
  const mine = message.sender === "admin";
  const failed = message.localStatus === "failed";
  const attachments = message.attachments || [];
  const images = attachments.filter((a) => isImageType(a.contentType));
  const documents = attachments.filter((a) => !isImageType(a.contentType));
  const uploading = message.localStatus === "sending" && attachments.length > 0;
  const percent = Math.round((message.progress || 0) * 100);

  return (
    <div
      data-key={messageKey(message)}
      className={[
        "support-msg",
        mine ? "is-mine" : "is-theirs",
        grouped ? "is-grouped" : "",
        last ? "is-last" : "",
        enter ? "is-entering" : "",
        failed ? "is-failed" : "",
      ].join(" ")}
    >
      <div className="support-msg-row">
        {!mine &&
          (last ? (
            <Avatar seed={customerId} name={customerName} size={28} />
          ) : (
            <span className="support-msg-avatar-gap" aria-hidden="true" />
          ))}
        <div className={`support-bubble${attachments.length > 0 ? " has-attachments" : ""}`}>
          {images.length > 0 && (
            <div className={`support-attachment-images${images.length > 1 ? " is-grid" : ""}`}>
              {images.map((a) => (
                <ImageAttachment key={a.key} attachment={a} onOpen={onOpenAttachment} onRefresh={onRefreshUrl} />
              ))}
            </div>
          )}
          {documents.length > 0 && (
            <div className="support-attachment-files">
              {documents.map((a) => (
                <FileAttachment key={a.key} attachment={a} onOpen={onOpenAttachment} />
              ))}
            </div>
          )}
          {uploading && (
            <div
              className="support-upload"
              role="progressbar"
              aria-label="Uploading"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
          )}
          {message.text && (
            <div className="support-bubble-text">
              <MessageText text={message.text} />
            </div>
          )}
        </div>
      </div>
      {(last || failed) && (
        <div className="support-msg-meta">
          {failed ? (
            <button type="button" className="support-retry" onClick={() => onRetry(message.clientId)}>
              Not sent · Click to retry
            </button>
          ) : (
            <>
              <time dateTime={message.createdAt}>{formatClock(message.createdAt)}</time>
              {mine && <Status message={message} seen={seen} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(MessageBubble);
