
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

        setItems(fetchedItems);
        // Keep pagination count aligned for filtered lists.
        setTotalRows(environment === "test" ? fetchedItems.length : response.data.total || 0);
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
      name: "Phone",
      selector: (row) => row.phone ?? "-",
      sortable: true,
      width: "150px",
    },
    {
      name: "City",
      selector: (row) => row.city ?? "-",
      sortable: true,
      width: "150px",
    },
    {
      name: "Platform",
      selector: (row) => row.Platform ?? "-",
      sortable: true,
      width: "120px",
    },
    {
      name: "Is Sender",
      selector: (row) => (row.isSender === true ? "Yes" : "No"),
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
        if (row.assignedEmail || row.assignedName) {
          return (
            <Button
              className="btn btn-info btn-round btn-sm"
              onClick={() => handleEdit(row.id)}
            >
              <FontAwesomeIcon icon={faEdit} className="mr-2" />
              {row.assignedName || row.assignedEmail}
            </Button>
          );
        } else {
          return (
            <Button
              className="btn btn-info btn-round btn-sm"
              onClick={() => handleEdit(row.id)}
            >
              <FontAwesomeIcon icon={faEdit} className="mr-2" />
              Assign
            </Button>
          );
        }
      },
      width: "150px",
    },
    {
      name: "Delete",
      cell: (row) => (
        <Button
          className="btn btn-danger btn-sm"
          onClick={() => handleDelete(row.id)}
        >
          Delete
        </Button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "100px",
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

      <div className="content">
        <Row>
          <Col xs={12}>
            <Card>
              <CardBody>
                {/* Tabs */}
                <Nav tabs>
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeTab === "1" })}
                      onClick={() => toggleTab("1")}
                    >
                      Succeeded Orders
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeTab === "2" })}
                      onClick={() => toggleTab("2")}
                    >
                      Attempts Orders
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeTab === "3" })}
                      onClick={() => toggleTab("3")}
                    >
                      Closed Orders
                    </NavLink>
                  </NavItem>

                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeTab === "4" })}
                      onClick={() => toggleTab("4")}
                    >
                      Test Orders
                    </NavLink>
                  </NavItem>
                </Nav>

                {/* Tab Content */}
                <TabContent activeTab={activeTab}>
                  <TabPane tabId={activeTab}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <CardTitle tag="h4">
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
                        style={{ marginLeft: "10px", width: "250px" }}
                      />
                    </div>
                    {loading ? (
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        <Spinner color="primary" />
                        <p>Loading orders...</p>
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
                      />
                    )}
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Orders;