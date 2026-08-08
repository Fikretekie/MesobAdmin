import { useState, useEffect, useCallback } from "react";

const TEMPLATES_API = "https://0sslhltjh2.execute-api.us-east-1.amazonaws.com/dev/templates";

// Shared logic for the "saved email templates" feature — used by the
// single-send and bulk-send modals in both Cart.js and Users.js, so the
// fetch/save/delete code only needs to exist in one place.
export default function useEmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const res = await fetch(TEMPLATES_API);
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const saveTemplate = async (name, subject, message) => {
    const res = await fetch(TEMPLATES_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, message }),
    });
    if (!res.ok) throw new Error("Failed to save template");
    const saved = await res.json();
    setTemplates((prev) => [...prev, saved]);
    return saved;
  };

  const deleteTemplate = async (id) => {
    const res = await fetch(`${TEMPLATES_API}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete template");
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return { templates, loadingTemplates, fetchTemplates, saveTemplate, deleteTemplate };
}