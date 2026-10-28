import { formatBytes, pickFiles, MAX_ATTACHMENT_BYTES } from "./attachments";
import { addPending, updatePending, setPendingStatus } from "./merge";

const file = (name, type, size = 1000) => ({ name, type, size });

describe("pickFiles", () => {
  test("accepts images and PDFs", () => {
    const { accepted, error } = pickFiles([], [file("a.png", "image/png"), file("b.pdf", "application/pdf")]);
    expect(accepted.map((f) => f.name)).toEqual(["a.png", "b.pdf"]);
    expect(error).toBe("");
  });

  test("refuses other types and oversize files, keeping the good ones", () => {
    const { accepted, error } = pickFiles(
      [],
      [file("notes.txt", "text/plain"), file("big.pdf", "application/pdf", MAX_ATTACHMENT_BYTES + 1), file("ok.jpg", "image/jpeg")]
    );
    expect(accepted.map((f) => f.name)).toEqual(["ok.jpg"]);
    expect(error).toMatch(/notes\.txt can't be attached/);
  });

  test("stops at 5 files per message", () => {
    const current = [1, 2, 3, 4].map((i) => file(`${i}.png`, "image/png"));
    const { accepted, error } = pickFiles(current, [file("5.png", "image/png"), file("6.png", "image/png")]);
    expect(accepted.map((f) => f.name)).toEqual(["5.png"]);
    expect(error).toBe("Up to 5 files per message");
  });
});

test("formatBytes", () => {
  expect(formatBytes(512)).toBe("512 B");
  expect(formatBytes(2048)).toBe("2 KB");
  expect(formatBytes(3.5 * 1024 * 1024)).toBe("3.5 MB");
});

describe("pending messages with attachments", () => {
  const attachments = [{ key: "local:c1:0", name: "a.png", contentType: "image/png", size: 10, url: "blob:x" }];

  test("addPending keeps attachments, and omits them when there are none", () => {
    expect(addPending([], { clientId: "c1", text: "", createdAt: "t", attachments })[0].attachments).toBe(attachments);
    expect("attachments" in addPending([], { clientId: "c2", text: "hi", createdAt: "t", attachments: [] })[0]).toBe(false);
  });

  test("updatePending sets upload progress, and is a no-op when nothing changes", () => {
    const state = addPending([], { clientId: "c1", text: "", createdAt: "t", attachments });
    const next = updatePending(state, "c1", { progress: 0.5 });
    expect(next[0].progress).toBe(0.5);
    expect(updatePending(next, "c1", { progress: 0.5 })).toBe(next);
    expect(setPendingStatus(next, "c1", "failed")[0]).toMatchObject({ localStatus: "failed", progress: 0.5 });
  });
});
