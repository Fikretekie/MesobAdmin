import React, { useEffect, useState, useRef } from "react";

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Row,
  Col,
  Table,
  Button,
  Label,
  FormGroup,
  Input,
  UncontrolledTooltip,
  Spinner,
  Popover,
  PopoverBody,
} from "reactstrap";

// core components
import PanelHeader from "components/PanelHeader/PanelHeader.js";

import axios from "axios";
import formatDate from "utils/formatDate";
import { Helmet } from "react-helmet";
import DataTable from "react-data-table-component";
import formatUserId from "utils/formatUID";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

function Financial_Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [Users, setUsers] = useState([]);
  const [totalStats, setTotalStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalCost: 0,
    totalCustomers: 0
  });
  const navigate = useNavigate();
  const handleEdit = (id) => {
    navigate(`/admin/order/edit/${id}`);
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
      name: "Is Sender",
      selector: (row) => (row.isSender === true ? "Yes" : "No"),
      sortable: true,
      width: "120px",
    },
    {
      name: "Created At",
      selector: (row) => formatDate(row.createdAt),
      sortable: true,
      width: "250px",
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
  const calculateTotals = (data) => {
    const succeededOrders = data.filter(item => item.adminStatus === "Succeeded");
    let totalSales = 0;
    let totalCost = 0;

    succeededOrders.forEach(order => {
      // Round each value to 2 decimal places before adding
      totalSales += Number((order.totalSellingPrice || 0).toFixed(2));
      totalCost += Number((order.totalCostPrice || 0).toFixed(2));
    });

    setTotalStats({
      totalOrders: succeededOrders.length,
      totalSales: Number(totalSales.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      totalCustomers: new Set(succeededOrders.map(order => order.userID)).size
    });
  };

  useEffect(() => {
    axios
      .get("https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/items")
      .then((response) => {
        if (response.data) {
          setItems(response.data);
          calculateTotals(response.data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
    axios
      .get("https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/users")
      .then((response) => {
        if (response.data.Items) {
          setUsers(response.data.Count);
          console.log(response.data.Count);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("There was an error fetching the users!", error);
      });
  }, []);

  const latestSucceededOrders = items
    .filter((item) => item.adminStatus === "Succeeded")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by createdAt in descending order
    .slice(0, 10);

  return (
    <>
      <Helmet>
        <title>Dashboard - Mesob Store</title>
      </Helmet>
      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Dashboard</h2>
          </div>
        }
      />
      <div className="content dashboard-dark-theme">
        <Row>
          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center">
                      <i className="fas fa-shopping-cart text-warning" />
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">TOTAL ORDERS</p>
                      <CardTitle tag="h3">{totalStats.totalOrders}</CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>

            </Card>
          </Col>

          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center">
                      <i className="fas fa-dollar-sign text-success" />
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">TOTAL SALES</p>
                      <CardTitle tag="h3">
                        ${Number(totalStats.totalSales).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>

            </Card>
          </Col>

          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center">
                      <i className="fas fa-chart-line text-danger" />
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">TOTAL COST</p>
                      <CardTitle tag="h3">
                        ${Number(totalStats.totalCost).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>

            </Card>
          </Col>

          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center">
                      <i className="fas fa-users text-primary" />
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">TOTAL USERS</p>
                      <CardTitle tag="h3">
                        ${Users}
                      </CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>

            </Card>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Card>
              <CardHeader>
                <h5 className="card-category">Orders</h5>
                <CardTitle tag="h4">Latest Succeeded Orders</CardTitle>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spinner color="primary" />
                    <p>Loading orders...</p>
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={latestSucceededOrders}
                    responsive
                    pagination
                    paginationPerPage={100}
                    paginationRowsPerPageOptions={[100, 200, 300, 500, 1000]}
                    highlightOnHover
                  />
                )}
              </CardBody>
            </Card>
          </Col>
          <Col md={12}>
            <Card className="card-tasks">
              <CardHeader>
                <h5 className="card-category">Backend Development</h5>
                <CardTitle tag="h4">Tasks</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="table-full-width table-responsive">
                  <Table>
                    <tbody>
                      <tr>
                        <td>
                          <FormGroup check>
                            <Label check>
                              <Input defaultChecked type="checkbox" />
                              <span className="form-check-sign" />
                            </Label>
                          </FormGroup>
                        </td>
                        <td className="text-left">
                          Sign contract for "What are conference organizers
                          afraid of?"
                        </td>
                        <td className="td-actions text-right">
                          <Button
                            className="btn-round btn-icon btn-icon-mini btn-neutral"
                            color="info"
                            id="tooltip731609871"
                            type="button"
                          >
                            <i className="now-ui-icons ui-2_settings-90" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip731609871"
                          >
                            Edit Task
                          </UncontrolledTooltip>
                          <Button
                            className="btn-round btn-icon btn-icon-mini btn-neutral"
                            color="danger"
                            id="tooltip923217206"
                            type="button"
                          >
                            <i className="now-ui-icons ui-1_simple-remove" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip923217206"
                          >
                            Remove
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FormGroup check>
                            <Label check>
                              <Input type="checkbox" />
                              <span className="form-check-sign" />
                            </Label>
                          </FormGroup>
                        </td>
                        <td className="text-left">
                          Lines From Great Russian Literature? Or E-mails From
                          My Boss?
                        </td>
                        <td className="td-actions text-right">
                          <Button
                            className="btn-round btn-icon btn-icon-mini btn-neutral"
                            color="info"
                            id="tooltip907509347"
                            type="button"
                          >
                            <i className="now-ui-icons ui-2_settings-90" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip907509347"
                          >
                            Edit Task
                          </UncontrolledTooltip>
                          <Button
                            className="btn-round btn-icon btn-icon-mini btn-neutral"
                            color="danger"
                            id="tooltip496353037"
                            type="button"
                          >
                            <i className="now-ui-icons ui-1_simple-remove" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip496353037"
                          >
                            Remove
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FormGroup check>
                            <Label check>
                              <Input defaultChecked type="checkbox" />
                              <span className="form-check-sign" />
                            </Label>
                          </FormGroup>
                        </td>
                        <td className="text-left">
                          Flooded: One year later, assessing what was lost and
                          what was found when a ravaging rain swept through
                          metro Detroit
                        </td>
                        <td className="td-actions text-right">
                          <Button
                            className="btn-round btn-icon btn-icon-mini btn-neutral"
                            color="info"
                            id="tooltip326247652"
                            type="button"
                          >
                            <i className="now-ui-icons ui-2_settings-90" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip326247652"
                          >
                            Edit Task
                          </UncontrolledTooltip>
                          <Button
                            className="btn-round btn-icon btn-icon-mini btn-neutral"
                            color="danger"
                            id="tooltip389516969"
                            type="button"
                          >
                            <i className="now-ui-icons ui-1_simple-remove" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip389516969"
                          >
                            Remove
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="now-ui-icons loader_refresh spin" /> Updated 3
                  minutes ago
                </div>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Financial_Dashboard;
