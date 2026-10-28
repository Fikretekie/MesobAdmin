import axios from "axios";
import { SUPPORT_CHAT_API_URL } from "./config";

// No credentials are sent: the Lambda treats requests without a token as
// the support side (owner's decision, Oct 2026). Anyone who has this URL can
// do the same, so the URL is the only thing keeping the inbox private.

export class SupportApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "SupportApiError";
    this.status = status; // 0 = network / no response
  }
}

/**
 * POST { action, ...payload } to the support chat Lambda.
 * Resolves with the response body; throws a SupportApiError { status, message }.
 */
export async function supportChat(action, payload = {}) {
  try {
    const res = await axios.post(
      SUPPORT_CHAT_API_URL,
      { action, ...payload },
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );
    return res.data;
  } catch (e) {
    const status = e.response?.status || 0;
    const message =
      e.response?.data?.message || (status ? `Request failed (${status})` : "Network error");
    throw new SupportApiError(status, message);
  }
}

// Sending a file: the Lambda hands out a one-off upload URL and the file goes
// straight to S3. Resolves with what sendMessage needs: { key, name }.
export async function uploadAttachment(userId, file, onProgress) {
  const { key, uploadUrl, headers } = await supportChat("getUploadUrl", {
    userId,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });
  try {
    await axios.put(uploadUrl, file, {
      headers,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(e.loaded / e.total);
      },
    });
  } catch (e) {
    throw new SupportApiError(e.response?.status || 0, `Couldn't upload ${file.name}`);
  }
  return { key, name: file.name };
}

// Download links expire after an hour or so; this gets a fresh one.
export async function getAttachmentUrl(userId, key) {
  const { url } = await supportChat("getAttachmentUrl", { userId, key });
  return url;
}
