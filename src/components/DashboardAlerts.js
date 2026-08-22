import React from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col } from "reactstrap";
import useDashboardAlerts from "hooks/useDashboardAlerts";

// One card in the coloured strip. `tone` picks the accent colour, which is
// what makes an at-a-glance scan work — red means something needs doing.
function AlertCard({ tone, label, value, sub, onClick }) {
  const TONES = {
    red: { bg: "rgba(239,68,68,0.14)", border: "#ef4444", label: "#fca5a5" },
    amber: { bg: "rgba(251,191,36,0.14)", border: "#fbbf24", label: "#fde68a" },
    green: { bg: "rgba(74,222,128,0.14)", border: "#22c55e", label: "#86efac" },
    blue: { bg: "rgba(96,165,250,0.14)", border: "#60a5fa", label: "#93c5fd" },
  };
  const t = TONES[tone] || TONES.blue;

  return (
    <div
      onClick={onClick}
      style={{
        flex: "1 1 150px",
        minWidth: 0,
        background: t.bg,
        borderLeft: `3px solid ${t.border}`,
        borderRadius: 8,
        padding: "10px 12px",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1.4,
          color: t.label,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: 20,
          fontWeight: 600,
          color: "#fff",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 10.5,
            color: "rgba(255,255,255,0.45)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function DashboardAlerts() {
  const navigate = useNavigate();
  const { data, loading, error } = useDashboardAlerts();

  if (loading && !data) {
    return (
      <div
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 12.5,
          padding: "8px 4px 16px",
        }}
      >
        Loading alerts...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        style={{
          color: "#fca5a5",
          fontSize: 12.5,
          padding: "8px 4px 16px",
        }}
      >
        Couldn't load alerts.
      </div>
    );
  }

  const orders = data?.orders || {};
  const tickets = data?.tickets || {};
  const email = data?.email;

  // Tickets go amber only once something has actually been waiting a while —
  // a brand new ticket isn't a problem yet.
  const ticketTone =
    tickets.oldestOpenHours >= 48 ? "red" : tickets.oldestOpenHours >= 12 ? "amber" : "green";

  // Bounce rate drives its own colour, since crossing 5% gets SES suspended.
  const bounceTone =
    email?.bounceStatus === "critical"
      ? "red"
      : email?.bounceStatus === "warning"
      ? "amber"
      : "green";

  return (
    <Row>
      <Col xs="12">
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <AlertCard
            tone={orders.needsAction > 0 ? "red" : "green"}
            label="Orders to ship"
            value={orders.needsAction ?? 0}
            sub="Unshipped, last 7 days"
            onClick={() => navigate("/admin/orders")}
          />

          <AlertCard
            tone={tickets.open > 0 ? ticketTone : "green"}
            label="Open tickets"
            value={tickets.open ?? 0}
            sub={
              tickets.open > 0 && tickets.oldestOpenLabel
                ? `Oldest waiting ${tickets.oldestOpenLabel}`
                : "All answered"
            }
            onClick={() => navigate("/admin/tickets")}
          />

          {email && (
            <AlertCard
              tone="blue"
              label="Emails left today"
              value={email.remaining.toLocaleString()}
              sub={`${email.sentLast24Hours.toLocaleString()} of ${email.max24HourSend.toLocaleString()} used`}
            />
          )}

          {email && (
            <AlertCard
              tone={bounceTone}
              label="Email delivery"
              value={
                email.bounceStatus === "healthy"
                  ? "Good"
                  : email.bounceStatus === "warning"
                  ? "Watch"
                  : "At risk"
              }
              sub={
                email.bounceRate === 0
                  ? "No failed deliveries"
                  : `${email.bounceRate}% failed to deliver`
              }
            />
          )}
        </div>
      </Col>
    </Row>
  );
}

export default DashboardAlerts;