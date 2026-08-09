import React from "react";

// A colorful, scrollable grid of saved-template "cards" — each shows the
// template name and a short preview of its body text. Click a card to
// apply that template's subject/body. Used in Cart.js (both modals) and
// Users.js so this styling only needs to exist in one place.
const CARD_COLORS = [
  { bg: "rgba(167,139,250,0.18)", bg2: "rgba(167,139,250,0.05)", border: "rgba(167,139,250,0.5)" },
  { bg: "rgba(96,165,250,0.18)", bg2: "rgba(96,165,250,0.05)", border: "rgba(96,165,250,0.5)" },
  { bg: "rgba(74,222,128,0.18)", bg2: "rgba(74,222,128,0.05)", border: "rgba(74,222,128,0.5)" },
  { bg: "rgba(251,191,36,0.18)", bg2: "rgba(251,191,36,0.05)", border: "rgba(251,191,36,0.5)" },
  { bg: "rgba(244,114,182,0.18)", bg2: "rgba(244,114,182,0.05)", border: "rgba(244,114,182,0.5)" },
];

const stripHtml = (html) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return tmp.textContent || tmp.innerText || "";
};

export default function TemplateCardGrid({ templates, selectedId, onSelect }) {
  if (!templates || templates.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
        No saved templates yet — save one below after writing your email.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        marginBottom: 18,
        maxHeight: 220,
        overflowY: "auto",
        paddingRight: 4,
      }}
    >
      {templates.map((t, i) => {
        const color = CARD_COLORS[i % CARD_COLORS.length];
        const isOn = selectedId === t.id;
        return (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            style={{
              borderRadius: 12,
              padding: 12,
              cursor: "pointer",
              background: `linear-gradient(135deg, ${color.bg}, ${color.bg2})`,
              border: `1.5px solid ${isOn ? color.border : "transparent"}`,
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
              {t.name}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: "rgba(255,255,255,0.5)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {stripHtml(t.message)}
            </div>
          </div>
        );
      })}
    </div>
  );
}