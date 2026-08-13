import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Input,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  FormGroup,
  Label,
} from "reactstrap";
import useEmailTemplates from "hooks/useEmailTemplates";
import TemplateCardGrid from "components/TemplateCardGrid";

const TICKETS_API = "https://xe00jwul2g.execute-api.us-east-1.amazonaws.com/dev/tickets";

const STATUS_COLORS = {
  open: { bg: "rgba(251,191,36,0.15)", text: "#fde68a" },
  closed: { bg: "rgba(74,222,128,0.15)", text: "#86efac" },
};

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const { templates } = useEmailTemplates();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(TICKETS_API);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText("");
    setSelectedTemplateId(null);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSending(true);
      const res = await fetch(`${TICKETS_API}/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyMessage: replyText, status: "closed" }),
      });
      const updated = await res.json();
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setSelectedTicket(updated);
      setReplyText("");
      alert("Reply sent to the customer!");
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const filteredData = tickets.filter(
    (t) =>
      t.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      name: "Customer",
      selector: (row) => row.customerEmail,
      sortable: true,
    },
    {
      name: "Message",
      selector: (row) => row.message,
      cell: (row) => (
        <div
          style={{
            maxWidth: 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.message}
        </div>
      ),
      grow: 2,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        const c = STATUS_COLORS[row.status] || STATUS_COLORS.open;
        return (
          <span
            style={{
              background: c.bg,
              color: c.text,
              padding: "4px 12px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "capitalize",
            }}
          >
            {row.status}
          </span>
        );
      },
      width: "120px",
    },
    {
      name: "Received",
      selector: (row) => row.createdAt,
      cell: (row) => new Date(row.createdAt).toLocaleString(),
      sortable: true,
      width: "200px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <button
          onClick={() => openTicket(row)}
          style={{
            background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
            color: "#0a0612",
            border: "none",
            borderRadius: "20px",
            padding: "6px 16px",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          View / Reply
        </button>
      ),
      width: "150px",
    },
  ];

  return (
    <>
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <CardTitle tag="h4" style={{ color: "#fff", margin: 0 }}>
                    Support Tickets
                  </CardTitle>
                  <Input
                    type="text"
                    placeholder="Search by customer or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: "280px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#fff",
                      borderRadius: "10px",
                    }}
                  />
                </div>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spinner color="primary" />
                    <p style={{ color: "rgba(255,255,255,0.6)" }}>
                      Loading tickets...
                    </p>
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={filteredData}
                    responsive
                    highlightOnHover
                    pagination
                    paginationPerPage={25}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    noDataComponent="No support tickets yet."
                    customStyles={{
                      table: { style: { background: "transparent" } },
                      headRow: {
                        style: {
                          background: "rgba(255,255,255,0.02)",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                          minHeight: "44px",
                        },
                      },
                      headCells: {
                        style: {
                          color: "rgba(255,255,255,0.45)",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                          fontWeight: 600,
                        },
                      },
                      rows: {
                        style: {
                          background: "transparent",
                          color: "rgba(255,255,255,0.85)",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          minHeight: "52px",
                          "&:hover": { background: "rgba(255,255,255,0.04)" },
                        },
                      },
                      pagination: {
                        style: {
                          background: "transparent",
                          color: "rgba(255,255,255,0.6)",
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                        },
                        pageButtonsStyle: {
                          color: "rgba(255,255,255,0.6)",
                          fill: "rgba(255,255,255,0.6)",
                          "&:disabled": { fill: "rgba(255,255,255,0.2)" },
                          "&:hover:not(:disabled)": {
                            background: "rgba(255,255,255,0.08)",
                          },
                        },
                      },
                      noData: {
                        style: {
                          background: "transparent",
                          color: "rgba(255,255,255,0.4)",
                        },
                      },
                    }}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Ticket detail / reply modal */}
      <Modal
        isOpen={!!selectedTicket}
        toggle={() => setSelectedTicket(null)}
        size="lg"
        contentClassName="bg-dark"
      >
        <ModalHeader
          toggle={() => setSelectedTicket(null)}
          style={{ background: "#150f24", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          Ticket from {selectedTicket?.customerEmail}
        </ModalHeader>
        <ModalBody style={{ background: "#150f24", color: "#dbe7ff" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
              {selectedTicket && new Date(selectedTicket.createdAt).toLocaleString()}
            </div>
            <div>{selectedTicket?.message}</div>
          </div>

          {selectedTicket?.replies?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                Previous Replies
              </div>
              {selectedTicket.replies.map((r, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(167,139,250,0.1)",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                    {new Date(r.sentAt).toLocaleString()}
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: r.message }} />
                </div>
              ))}
            </div>
          )}

          <FormGroup>
            <Label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.55)" }}>
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
            <Label style={{ color: "rgba(255,255,255,0.55)" }}>Your Reply</Label>
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
              background: sending || !replyText.trim()
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(90deg, #a78bfa, #60a5fa)",
              color: sending || !replyText.trim() ? "rgba(255,255,255,0.35)" : "#0a0612",
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
        </ModalBody>
      </Modal>
    </>
  );
}

export default Tickets;