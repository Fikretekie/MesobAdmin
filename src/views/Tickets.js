import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "reactstrap";

const TICKETS_API = "https://xe00jwul2g.execute-api.us-east-1.amazonaws.com/dev/tickets";

const STATUS_COLORS = {
  open: { bg: "rgba(251,191,36,0.15)", text: "#fde68a" },
  closed: { bg: "rgba(74,222,128,0.15)", text: "#86efac" },
};

function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("open");

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

  const filteredData = tickets
    .filter((t) => (t.status || "open") === activeTab)
    .filter(
      (t) =>
        t.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.message?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
    );

  const openCount = tickets.filter((t) => (t.status || "open") === "open").length;
  const closedCount = tickets.filter((t) => t.status === "closed").length;

  const pillStyle = (active) => ({
    borderRadius: "20px",
    padding: "8px 18px",
    fontWeight: 600,
    fontSize: "12.5px",
    border: "none",
    cursor: "pointer",
    marginRight: "8px",
    ...(active
      ? {
          background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
          color: "#0a0612",
        }
      : {
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.65)",
        }),
  });

  const columns = [
    {
      name: "Customer",
      selector: (row) => row.customerEmail,
      sortable: true,
    },
    {
      name: "Last replied by",
      selector: (row) =>
        row.replies?.length ? row.replies[row.replies.length - 1].repliedBy : "-",
      width: "180px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        const c = STATUS_COLORS[row.status || "open"];
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
            {row.status || "open"}
          </span>
        );
      },
      width: "110px",
    },
    {
      name: "Last Activity",
      selector: (row) => row.updatedAt || row.createdAt,
      cell: (row) =>
        new Date(row.updatedAt || row.createdAt).toLocaleString(),
      sortable: true,
      width: "190px",
    },
  ];

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
            <CardHeader style={{ borderBottom: "none", paddingBottom: 0 }}>
              {/* Row 1: title only */}
              <CardTitle tag="h4" style={{ color: "#fff", margin: "0 0 14px 0" }}>
                Support Tickets
              </CardTitle>

              {/* Row 2: search — its own full-width row, never overlaps anything below it */}
              <Input
                type="text"
                placeholder="Search by customer or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "420px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  borderRadius: "10px",
                  marginBottom: 16,
                }}
              />

              {/* Row 3: tabs — its own row, clearly below the search */}
              <div style={{ marginBottom: 16 }}>
                <button
                  style={pillStyle(activeTab === "open")}
                  onClick={() => setActiveTab("open")}
                >
                  Open ({openCount})
                </button>
                <button
                  style={pillStyle(activeTab === "closed")}
                  onClick={() => setActiveTab("closed")}
                >
                  Closed ({closedCount})
                </button>
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
                  pointerOnHover
                  onRowClicked={(row) => navigate(`/admin/tickets/${row.id}`)}
                  pagination
                  paginationPerPage={25}
                  paginationRowsPerPageOptions={[25, 50, 100]}
                  noDataComponent={`No ${activeTab} tickets.`}
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
  );
}

export default Tickets;