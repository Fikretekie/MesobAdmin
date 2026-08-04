import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import {
  Card,
  CardBody,
  CardTitle,
  Row,
  Col,
  Input,
  Spinner,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Popover,
  PopoverBody,
  Button,
} from "reactstrap";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import formatDate from "utils/formatDate";
import { Helmet } from "react-helmet";
import classnames from "classnames";
import formatUserId from "utils/formatUID";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";

// Lives outside the component so it survives navigating away and back.
const ordersPageCache = {};

const Orders = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const navigate = useNavigate();

  const tableCustomStyles = {
    table: {
      style: {
        background: "transparent",
      },
    },
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
        "&:hover": {
          background: "rgba(255,255,255,0.04)",
        },
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
        "&:disabled": {
          fill: "rgba(255,255,255,0.2)",
        },
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
  };

  const pillTabStyle = (active) => ({
    borderRadius: "20px",
    padding: "8px 16px",
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

  // Fetch data based on active tab, page, and limit
  // const fetchOrders = async (page = 1, limit = 10, status = "Succeeded") => {
  //   setLoading(true);
  //   try {
  //     const response = await axios.get(
  //       "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/items",
  //       {
  //         params: {
  //           page,
  //           limit,
  //           status,
  //         },
  //       }
  //     );

  //     if (response.data) {
  //       console.log("data =>>>", response.data);
  //       setItems(response.data.items || []);
  //       setTotalRows(response.data.total || 0);
  //     }
  //   } catch (error) {
  //     console.error("There was an error fetching the items!", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // 1. Updated fetchOrders
  const fetchOrders = async (page = 1, limit = 10, status = "Succeeded", environment = "production") => {
    const cacheKey = `${page}-${limit}-${status}-${environment}`;

    // Already have this exact page/tab from a previous visit — skip refetching
    if (ordersPageCache[cacheKey]) {
      setItems(ordersPageCache[cacheKey].items);
      setTotalRows(ordersPageCache[cacheKey].totalRows);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/items",
        {
          params: {
            page,
            limit,
            status,
            ...(environment === "test" && { environment: "test" }),
          },
        }
      );

      if (response.data) {
        let fetchedItems = response.data.items || [];

        if (environment === "test") {
          fetchedItems = fetchedItems.filter(
            (item) => String(item.environment || "").toLowerCase() === "test"
          );
        } else if (status === "Succeeded") {
          // In Succeeded tab, hide test orders but keep undefined/empty/production.
          fetchedItems = fetchedItems.filter(
            (item) => String(item.environment || "").trim().toLowerCase() !== "test"
          );
        }

        const totalRows = environment === "test" ? fetchedItems.length : response.data.total || 0;

        setItems(fetchedItems);
        // Keep pagination count aligned for filtered lists.
        setTotalRows(totalRows);

        ordersPageCache[cacheKey] = { items: fetchedItems, totalRows };
      }
    } catch (error) {
      console.error("There was an error fetching the items!", error);
    } finally {
      setLoading(false);
    }
  };
  // Fetch data when component mounts or when tab/page changes
  // useEffect(() => {
  //   const statusMap = {
  //     "1": "Succeeded",
  //     "2": "Attempts",
  //     "3": "Closed",
  //   };
  //   fetchOrders(currentPage, perPage, statusMap[activeTab]);
  // }, [currentPage, perPage, activeTab]);


  useEffect(() => {
    const statusMap = {
      "1": "Succeeded",
      "2": "Attempts",
      "3": "Closed",
    };
    if (activeTab === "4") {
      fetchOrders(currentPage, perPage, "Succeeded", "test");
    } else {
      fetchOrders(currentPage, perPage, statusMap[activeTab], "production");
    }
  }, [currentPage, perPage, activeTab]);
  // Apply search filtering
  const filteredOrders = items.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleEdit = (id) => {
    navigate(`/admin/order/edit/${id}`);
  };

  // const handleDelete = async (id) => {
  //   if (
  //     !window.confirm(
  //       "Are you sure you want to delete this order and related finance record(s)?"
  //     )
  //   )
  //     return;

  //   try {
  //     const response = await axios.delete(
  //       `https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/items/${id}`
  //     );

  //     if (response.status === 200) {
  //       // Refresh data after deletion
  //       const statusMap = {
  //         "1": "Succeeded",
  //         "2": "Attempts",
  //         "3": "Closed",
  //       };
  //       fetchOrders(currentPage, perPage, statusMap[activeTab]);
  //       alert("Order and related finance record(s) deleted successfully.");
  //     } else {
  //       alert("Unexpected response while deleting order.");
  //     }
  //   } catch (error) {
  //     console.error("Delete failed:", error);
  //     alert("Failed to delete order.");
  //   }
  // };
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this order and related finance record(s)?"
      )
    )
      return;

    try {
      const response = await axios.delete(
        `https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/items/${id}`
      );

      if (response.status === 200) {
        const statusMap = {
          "1": "Succeeded",
          "2": "Attempts",
          "3": "Closed",
        };
        if (activeTab === "4") {
          fetchOrders(currentPage, perPage, "Succeeded", "test");
        } else {
          fetchOrders(currentPage, perPage, statusMap[activeTab], "production");
        }
        alert("Order and related finance record(s) deleted successfully.");
      } else {
        alert("Unexpected response while deleting order.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete order.");
    }
  };
  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      setCurrentPage(1); // Reset to first page when switching tabs
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
  };

  const columns = [
    {
      name: "User ID",
      selector: (row) => row.id,
      sortable: true,
      width: "150px",
      cell: (row) => <UserIdCell userId={row.id} />,
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      width: "200px",
    },
    {
      name: "Platform",
      selector: (row) => row.Platform ?? "-",
      sortable: true,
      width: "120px",
    },
    {
      name: "Created At",
      selector: (row) => formatDate(row.createdAt),
      sortable: true,
      width: "200px",
    },
    {
      name: "Assign",
      cell: (row) => {
        const label = row.assignedName || row.assignedEmail || "Assign";
        return (
          <button
            onClick={() => handleEdit(row.id)}
            style={{
              background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
              color: "#0a0612",
              border: "none",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "11.5px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            <FontAwesomeIcon icon={faEdit} style={{ marginRight: 6 }} />
            {label}
          </button>
        );
      },
      width: "170px",
    },
    {
      name: "Delete",
      cell: (row) => (
        <button
          onClick={() => handleDelete(row.id)}
          style={{
            background: "rgba(244,114,182,0.15)",
            color: "#f9a8d4",
            border: "1px solid rgba(244,114,182,0.3)",
            borderRadius: "20px",
            padding: "6px 14px",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "110px",
    },
  ];

  function UserIdCell({ userId }) {
    const [isOpen, setIsOpen] = useState(false);
    const targetRef = useRef(null);

    const toggle = () => setIsOpen(!isOpen);

    return (
      <div>
        <span ref={targetRef} onMouseEnter={toggle} onMouseLeave={toggle}>
          {formatUserId(userId)}
        </span>
        <Popover
          placement="right"
          isOpen={isOpen}
          target={targetRef}
          toggle={toggle}
          trigger="hover"
        >
          <PopoverBody>{userId}</PopoverBody>
        </Popover>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Orders - Mesob Store</title>
      </Helmet>

      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Orders</h2>
          </div>
        }
      />

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
              <CardBody>
                {/* Tabs */}
                <div style={{ marginBottom: 16 }}>
                  <button
                    style={pillTabStyle(activeTab === "1")}
                    onClick={() => toggleTab("1")}
                  >
                    Succeeded Orders
                  </button>
                  <button
                    style={pillTabStyle(activeTab === "2")}
                    onClick={() => toggleTab("2")}
                  >
                    Attempts Orders
                  </button>
                  <button
                    style={pillTabStyle(activeTab === "3")}
                    onClick={() => toggleTab("3")}
                  >
                    Closed Orders
                  </button>
                  <button
                    style={pillTabStyle(activeTab === "4")}
                    onClick={() => toggleTab("4")}
                  >
                    Test Orders
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <CardTitle tag="h4" style={{ color: "#fff" }}>
                    {activeTab === "1"
                      ? "Succeeded Orders"
                      : activeTab === "2"
                        ? "Attempts Orders"
                        : activeTab === "3"
                          ? "Closed Orders"
                          : "Test Orders"}
                  </CardTitle>
                  <Input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      marginLeft: "10px",
                      width: "250px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#fff",
                      borderRadius: "10px",
                    }}
                  />
                </div>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spinner color="primary" />
                    <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading orders...</p>
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={filteredOrders}
                    selectableRows
                    responsive
                    fixedHeader={true}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationDefaultPage={currentPage}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    paginationPerPage={perPage}
                    paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
                    highlightOnHover
                    customStyles={tableCustomStyles}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Orders;