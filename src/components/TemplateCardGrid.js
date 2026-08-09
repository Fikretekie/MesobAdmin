import React from "react";

// A colorful, non-scrolling grid of saved-template "cards" — each shows
// just the template name/title. Click a card to apply that template's
// subject/body. Used in Notifications.js, Cart.js (both modals), and
// Users.js so this styling only needs to exist in one place.
const CARD_COLORS = [
  { bg: "rgba(167,139,250,0.18)", bg2: "rgba(167,139,250,0.05)", border: "rgba(167,139,250,0.5)" },
  { bg: "rgba(96,165,250,0.18)", bg2: "rgba(96,165,250,0.05)", border: "rgba(96,165,250,0.5)" },
  { bg: "rgba(74,222,128,0.18)", bg2: "rgba(74,222,128,0.05)", border: "rgba(74,222,128,0.5)" },
  { bg: "rgba(251,191,36,0.18)", bg2: "rgba(251,191,36,0.05)", border: "rgba(251,191,36,0.5)" },
  { bg: "rgba(244,114,182,0.18)", bg2: "rgba(244,114,182,0.05)", border: "rgba(244,114,182,0.5)" },
];

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
        // minmax(0, 1fr) — without the "0" minimum, a grid column can be
        // forced wider than intended by long unbroken text (like a title
        // with no spaces to wrap on), which is what broke the layout.
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
        gap: 10,
        marginBottom: 18,
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
              padding: "12px 14px",
              cursor: "pointer",
              background: `linear-gradient(135deg, ${color.bg}, ${color.bg2})`,
              border: `1.5px solid ${isOn ? color.border : "transparent"}`,
              transition: "border-color 0.15s",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {t.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}