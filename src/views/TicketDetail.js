import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Input,
  Spinner,
  FormGroup,
  Label,
} from "reactstrap";
import useEmailTemplates from "hooks/useEmailTemplates";
import TemplateCardGrid from "components/TemplateCardGrid";

const TICKETS_API = "https://xe00jwul2g.execute-api.us-east-1.amazonaws.com/dev/tickets";

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const { templates } = useEmailTemplates();

  const adminEmail = localStorage.getItem("user_email") || "Unknown Admin";

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${TICKETS_API}/${id}`);
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      console.error("Error fetching ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSending(true);
      const res = await fetch(`${TICKETS_API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyMessage: replyText,
          status: "closed",
          repliedBy: adminEmail,
        }),
      });
      const updated = await res.json();
      setTicket(updated);
      setReplyText("");
      setSelectedTemplateId(null);
      alert("Reply sent to the customer!");
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div
        className="content"
        style={{
          background:
            "linear-gradient(135deg, #5b2fc4 0%, #2d1a6b 35%, #1a1035 65%, #120b26 100%)",
          minHeight: "100vh",
          textAlign: "center",
          paddingTop: 100,
        }}
      >
        <Spinner color="primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div
        className="content"
        style={{
          background:
            "linear-gradient(135deg, #5b2fc4 0%, #2d1a6b 35%, #1a1035 65%, #120b26 100%)",
          minHeight: "100vh",
          textAlign: "center",
          paddingTop: 100,
          color: "#fff",
        }}
      >
        Ticket not found.
      </div>
    );
  }

  return (
    <div
      className="content"
      style={{
        background:
          "linear-gradient(135deg, #5b2fc4 0%, #2d1a6b 35%, #1a1035 65%, #120b26 100%)",
        minHeight: "100vh",
      }}
    >
      <Row>
        <Col xs={12}>
          <Card
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "16px",
              boxShadow: "none",
            }}
          >
            <CardHeader style={{ borderBottom: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => navigate("/admin/tickets")}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "20px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Tickets
                </button>
                <CardTitle tag="h4" style={{ color: "#fff", margin: 0 }}>
                  {ticket.customerEmail}
                </CardTitle>
                <span
                  style={{
                    background:
                      ticket.status === "closed"
                        ? "rgba(74,222,128,0.15)"
                        : "rgba(251,191,36,0.15)",
                    color: ticket.status === "closed" ? "#86efac" : "#fde68a",
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "capitalize",
                  }}
                >
                  {ticket.status || "open"}
                </span>
              </div>
            </CardHeader>
            <CardBody>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 6,
                  }}
                >
                  Customer · {new Date(ticket.createdAt).toLocaleString()}
                </div>
                <div style={{ color: "#fff" }}>{ticket.message}</div>
              </div>

              {ticket.replies?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: 8,
                    }}
                  >
                    Reply History
                  </div>
                  {ticket.replies.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(167,139,250,0.1)",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.5)",
                          marginBottom: 4,
                          fontWeight: 700,
                        }}
                      >
                        {r.repliedBy || "Admin"} ·{" "}
                        {new Date(r.sentAt).toLocaleString()}
                      </div>
                      <div
                        style={{ color: "rgba(255,255,255,0.9)" }}
                        dangerouslySetInnerHTML={{ __html: r.message }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <FormGroup>
                <Label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Quick Reply Templates
                  <span
                    style={{
                      background: "linear-gradient(90deg, #f9a8d4, #a78bfa)",
                      color: "#2a0a1f",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 6,
                      textTransform: "uppercase",
                    }}
                  >
                    Quick Pick
                  </span>
                </Label>
                <TemplateCardGrid
                  templates={templates}
                  selectedId={selectedTemplateId}
                  onSelect={(t) => {
                    setSelectedTemplateId(t.id);
                    setReplyText(t.message);
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label style={{ color: "rgba(255,255,255,0.55)" }}>
                  Your Reply (sending as {adminEmail})
                </Label>
                <Input
                  type="textarea"
                  rows={6}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply to the customer..."
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    borderRadius: "10px",
                  }}
                />
              </FormGroup>

              <button
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                style={{
                  background:
                    sending || !replyText.trim()
                      ? "rgba(255,255,255,0.06)"
                      : "linear-gradient(90deg, #a78bfa, #60a5fa)",
                  color:
                    sending || !replyText.trim()
                      ? "rgba(255,255,255,0.35)"
                      : "#0a0612",
                  border: "none",
                  borderRadius: "20px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: sending || !replyText.trim() ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending..." : "Send Reply & Close Ticket"}
              </button>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TicketDetail;