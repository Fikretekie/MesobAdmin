import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Tickets from "./Tickets";

jest.mock("components/Support/TicketsTabs", () => () => <div>Email &amp; web</div>);
jest.mock("hooks/useEmailTemplates", () => () => ({ templates: [] }));

const ticket = {
  id: "ticket-1", customerEmail: "customer@example.com", message: "Help with my order",
  status: "open", source: "email_direct", createdAt: "2026-10-31T08:00:00Z", replies: [],
};
let container;
let root;
let originalFetch;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  originalFetch = global.fetch;
  global.fetch = jest.fn(async (url, options) => ({
    json: async () => options?.method === "PATCH" ? { ...ticket, status: "closed" } :
      url.endsWith("/ticket-1") ? ticket : [ticket],
  }));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  global.fetch = originalFetch;
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
async function renderInbox(path = "/admin/tickets") {
  await act(async () => root.render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/tickets" element={<Tickets />} />
        <Route path="/admin/tickets/:id" element={<Tickets />} />
      </Routes>
    </MemoryRouter>
  ));
}
async function click(element) {
  await act(async () => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

test("opens a selected ticket beside the list and returns to the empty state", async () => {
  await renderInbox();
  expect(container.querySelector(".email-inbox-empty")).not.toBeNull();
  await click(container.querySelector(".email-inbox-row"));
  expect(container.querySelector(".email-inbox-list")).not.toBeNull();
  expect(container.querySelector(".email-ticket-embedded").textContent).toContain("Help with my order");
  expect(container.querySelector(".email-inbox-row.is-selected")).not.toBeNull();
  await click(Array.from(container.querySelectorAll("button")).find((button) => button.textContent.includes("Back to Tickets")));
  expect(container.querySelector(".email-inbox-empty")).not.toBeNull();
});

test("direct ticket links load details and status changes update list counts", async () => {
  await renderInbox("/admin/tickets/ticket-1");
  expect(container.querySelector("textarea")).not.toBeNull();
  await click(Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Mark as Closed"));
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/ticket-1"), expect.objectContaining({
    method: "PATCH", body: JSON.stringify({ status: "closed" }),
  }));
  expect(container.querySelector(".email-inbox-filters").textContent).toBe("Open (0)Closed (1)");
  expect(container.querySelector(".email-inbox-detail").textContent).toContain("Reopen Ticket");
  await click(Array.from(container.querySelectorAll(".email-inbox-filter"))[1]);
  expect(container.querySelector(".email-inbox-row").textContent).toContain("customer@example.com");
});
