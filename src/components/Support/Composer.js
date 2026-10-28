import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faPaperclip, faPaperPlane, faXmark } from "@fortawesome/free-solid-svg-icons";
import { ATTACHMENT_ACCEPT, formatBytes, isImageType, pickFiles } from "./attachments";

const MAX_LENGTH = 2000;
const SHOW_COUNTER_AT = MAX_LENGTH - 200;
const MAX_HEIGHT = 140; // about 6 lines, then it scrolls

// Thumbnails for the picked images, freed when the files change.
function useObjectUrls(files) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    const next = files.map((f) => (isImageType(f.type) ? URL.createObjectURL(f) : null));
    setUrls(next);
    return () => next.forEach((url) => url && URL.revokeObjectURL(url));
  }, [files]);
  return urls;
}

// Remounted per conversation (the thread is keyed by userId), so the draft
// for each conversation - text and picked files - comes from, and goes back
// to, the shared drafts map. The thread calls addFiles() for dropped files.
const Composer = forwardRef(function Composer({ userId, drafts, onSend, onDraftChange }, ref) {
  const [draft, setDraft] = useState(() => (drafts.get(userId) || {}).text || "");
  const [files, setFiles] = useState(() => (drafts.get(userId) || {}).files || []);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const thumbs = useObjectUrls(files);

  useEffect(() => {
    if (draft || files.length > 0) drafts.set(userId, { text: draft, files });
    else drafts.delete(userId);
  }, [drafts, userId, draft, files]);

  // Opening a conversation puts the cursor in the reply box.
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus({ preventScroll: true });
  }, []);

  // Grow with the text, up to MAX_HEIGHT.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [draft]);

  const addFiles = useCallback(
    (list) => {
      const { accepted, error: problem } = pickFiles(files, Array.from(list || []));
      if (accepted.length > 0) setFiles((current) => [...current, ...accepted]);
      setError(problem);
      if (inputRef.current) inputRef.current.focus();
    },
    [files]
  );
  useImperativeHandle(ref, () => ({ addFiles }), [addFiles]);

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, i) => i !== index));
    setError("");
  };

  const handleChange = (e) => {
    setDraft(e.target.value);
    onDraftChange(e.target.value);
  };

  const canSend = draft.trim().length > 0 || files.length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(draft, files);
    setDraft("");
    setFiles([]);
    setError("");
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter is a new line. Not while an IME is composing
    // (Enter there confirms the character).
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  // Pasting a screenshot attaches it.
  const handlePaste = (e) => {
    const pasted = Array.from((e.clipboardData && e.clipboardData.files) || []);
    if (pasted.length > 0) {
      e.preventDefault();
      addFiles(pasted);
    }
  };

  const remaining = MAX_LENGTH - draft.length;

  return (
    <form
      className="support-composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {(files.length > 0 || error) && (
        <div className="support-tray">
          {files.map((file, i) => (
            <div className="support-tray-item" key={`${file.name}-${file.size}-${file.lastModified}-${i}`}>
              {thumbs[i] ? (
                <img src={thumbs[i]} alt="" />
              ) : (
                <span className="support-tray-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faFilePdf} />
                </span>
              )}
              <span className="support-tray-text">
                <span className="support-tray-name">{file.name}</span>
                <span className="support-tray-size">{formatBytes(file.size)}</span>
              </span>
              <button
                type="button"
                className="support-tray-remove"
                onClick={() => removeFile(i)}
                aria-label={`Remove ${file.name}`}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          ))}
          {error && (
            <p className="support-tray-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      <div className="support-composer-row">
        <button
          type="button"
          className="support-attach"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          aria-label="Attach images or PDFs"
          title="Attach images or PDFs (up to 10 MB each)"
        >
          <FontAwesomeIcon icon={faPaperclip} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // so picking the same file again still fires
          }}
        />
        <div className="support-composer-box">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a reply…"
            aria-label="Reply to customer"
          />
          {draft.length >= SHOW_COUNTER_AT && (
            <span
              className={`support-counter${remaining <= 0 ? " is-limit" : ""}`}
              title={`${remaining} characters left`}
            >
              {remaining}
            </span>
          )}
        </div>
        <button type="submit" className="support-send" disabled={!canSend} aria-label="Send reply">
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </form>
  );
});

export default Composer;
