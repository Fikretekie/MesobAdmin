// Attachment rules, mirrored from the support chat Lambda so a file that would
// be refused is caught before it's uploaded. The Lambda checks them again.
export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
export const ATTACHMENT_ACCEPT = ATTACHMENT_TYPES.join(",");

export const isImageType = (type) => typeof type === "string" && type.startsWith("image/");

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Splits newly picked files into those that can be attached and a message
// about the first one that can't.
export function pickFiles(current, incoming) {
  const accepted = [];
  let error = "";
  for (const file of incoming) {
    if (current.length + accepted.length >= MAX_ATTACHMENTS) {
      error = error || `Up to ${MAX_ATTACHMENTS} files per message`;
      break;
    }
    if (!ATTACHMENT_TYPES.includes(file.type)) {
      error = error || `${file.name} can't be attached: only JPEG, PNG, WebP or GIF images and PDFs`;
    } else if (file.size > MAX_ATTACHMENT_BYTES) {
      error = error || `${file.name} is over 10 MB`;
    } else {
      accepted.push(file);
    }
  }
  return { accepted, error };
}

// Images this tab has just uploaded, by S3 key -> local object URL, so the
// sender sees their own picture without downloading it straight back.
export const localPreviews = new Map();
