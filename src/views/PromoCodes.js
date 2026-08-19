import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Input,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Form,
  Spinner,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import { Helmet } from "react-helmet";
import NotificationAlert from "react-notification-alert";
import "react-notification-alert/dist/animate.css";

// Dropdown action cell component
const ActionDropdown = ({ row, onEdit, onDelete }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen((prevState) => !prevState);

  return (
    <Dropdown isOpen={dropdownOpen} toggle={toggle}>
      <style>{`
        .promo-actions-toggle {
          background: linear-gradient(90deg, #a78bfa, #60a5fa) !important;
          color: #0a0612 !important;
          border: none !important;
          border-radius: 20px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          padding: 6px 14px !important;
          box-shadow: none !important;
        }
        .promo-actions-toggle:hover,
        .promo-actions-toggle:focus,
        .promo-actions-toggle:active {
          background: linear-gradient(90deg, #a78bfa, #60a5fa) !important;
          color: #0a0612 !important;
          box-shadow: none !important;
        }
      `}</style>
      <DropdownToggle caret className="promo-actions-toggle">
        Actions
      </DropdownToggle>
      <DropdownMenu
        style={{
          background: "#150f24",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <DropdownItem
          onClick={() => onEdit(row)}
          style={{ color: "rgba(255,255,255,0.85)", background: "transparent" }}
        >
          Edit
        </DropdownItem>
        <DropdownItem
          onClick={() => onDelete(row.id)}
          style={{ color: "#f9a8d4", background: "transparent" }}
        >
          Delete
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

const columns = (onEdit, onDelete) => [
  {
    name: "ID",
    selector: (row) => row.id,
    sortable: true,
    width: "70px",
  },
  {
    name: "Code",
    selector: (row) => row.Code,
    sortable: true,
    width: "150px",
  },
  {
    name: "Is Active",
    selector: (row) => (row.Status ? "Yes" : "No"),
    sortable: true,
    width: "100px",
  },
  {
    name: "Discount Percentage",
    selector: (row) => row.Discount,
    sortable: true,
    width: "200px",
  },
  {
    name: "Discount Type",
    selector: (row) => row.Discount_Type,
    sortable: true,
    width: "150px",
  },
  {
    name: "Order Limit",
    selector: (row) => row.Order_Limit,
    sortable: true,
    width: "150px",
  },
  {
    name: "Action",
    cell: (row) => (
      <ActionDropdown row={row} onEdit={onEdit} onDelete={onDelete} />
    ),
    ignoreRowClick: true,
    allowOverflow: true,
    button: true,
    width: "150px",
  },
];

function PromoCodes() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);

  const toggleModal = (isEditMode = false, promo = null) => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
      // If closing the modal, reset the promo code
      setSelectedPromo(null);
      setIsEditMode(false);
    } else if (isEditMode && promo) {
      // If opening for edit, set selected promo code
      setSelectedPromo(promo);
      setIsEditMode(true);
    }
  };

  const notificationAlertRef = useRef(null);

  const notify = (place, message, type) => {
    const options = {
      place: place,
      message: (
        <div>
          <div>{message}</div>
        </div>
      ),
      type: type,
      icon: "now-ui-icons ui-1_bell-53",
      autoDismiss: 7,
    };
    notificationAlertRef.current.notificationAlert(options);
  };

  // Refactor the fetchPromoCodes function for reusability
  const fetchPromoCodes = () => {
    setLoading(true);
    axios
      .get(
        "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/promocode"
      )
      .then((response) => {
        // Sort the data by ID in ascending order
        const sortedData = (response.data.Items || []).sort(
          (a, b) => a.id - b.id
        );
        setData(sortedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching promo codes:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  // const handleSave = async () => {
  //   if (
  //     !selectedPromo?.Code ||
  //     !selectedPromo?.Discount_Type ||
  //     !selectedPromo?.Discount ||
  //     !selectedPromo?.Order_Limit
  //   ) {
  //     notify("tr", "Please fill in all fields.", "danger");
  //     return;
  //   }

  //   if (isEditMode) {
  //     // Update existing promo code
  //     // Log the promo code details in update
  //     console.log("Updating promo code:", selectedPromo);

  //     const id = selectedPromo?.id;
  //     const code = selectedPromo?.Code;
  //     const discount_percentage = selectedPromo?.Discount;
  //     const discount_type = selectedPromo?.Discount_Type;
  //     const order_limit = selectedPromo?.Order_Limit;
  //     const is_active = selectedPromo?.Status;
  //     const is_display = selectedPromo?.Display;
  //     const is_auto = selectedPromo?.Auto;
  //     const is_manual = selectedPromo?.Manual;

  //     const url = `https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/promocode/${encodeURIComponent(
  //       id
  //     )}?code3=${encodeURIComponent(code)}&discount3=${encodeURIComponent(
  //       discount_percentage
  //     )}&discount_typevalue3=${encodeURIComponent(
  //       discount_type
  //     )}&order_limit3=${encodeURIComponent(
  //       order_limit
  //     )}&status3=${encodeURIComponent(is_active)}&display3=${encodeURIComponent(
  //       is_display
  //     )}&auto3=${encodeURIComponent(is_auto)}&manual3=${encodeURIComponent(
  //       is_manual
  //     )}`;

  //     try {
  //       setBtnLoading(true);
  //       const response = await axios.patch(url, {
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       });
  //       console.log("API Response:", response.data);
  //       if (response.status === 200) {
  //         notify("tr", "Promo code updated successfully!", "success");
  //         toggleModal();
  //         setBtnLoading(false);

  //         // Refresh the data after updating
  //         fetchPromoCodes();
  //       } else {
  //         setBtnLoading(false);
  //         notify("tr", "Failed to add promo code.", "danger");
  //       }
  //     } catch (error) {
  //       console.error("Error sending promo code data:", error);
  //     }
  //   } else {
  //     // Log the promo code details in add
  //     console.log("Adding new promo code:", selectedPromo);

  //     const code = selectedPromo?.Code;
  //     const discount_percentage = selectedPromo?.Discount;
  //     const discount_type = selectedPromo?.Discount_Type;
  //     const order_limit = selectedPromo?.Order_Limit;
  //     const is_active = selectedPromo?.Status;
  //     const is_display = selectedPromo?.Display;
  //     const is_auto = selectedPromo?.Auto;
  //     const is_manual = selectedPromo?.Manual;

  //     const url = 'https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/promocode';

  //     try {
  //       setBtnLoading(true);
  //       const response = await axios.post(url, {
  //         code,
  //         discount: discount_percentage,
  //         discount_type: discount_type,
  //         limit: order_limit,
  //         statusvalue: is_active,
  //         displayvalue: is_display,
  //         autovalue: is_auto,
  //         manualvalue: is_manual
  //       }, {
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       });
  //       console.log("API Response:", response.data);
  //       if (response.status === 200) {
  //         notify("tr", "Promo code added Successfully!", "success");
  //         toggleModal();
  //         setBtnLoading(false);
  //         // Refresh the data after adding
  //         fetchPromoCodes();
  //       } else {
  //         setBtnLoading(false);
  //         notify("tr", "Failed to add promo code.", "danger");
  //       }
  //     } catch (error) {
  //       console.error("Error sending promo code data:", error);
  //       setBtnLoading(false);
  //       notify("tr", "Failed to add promo code.", "danger");
  //     } finally {
  //       // Ensure button loading state is reset even if an error occurs
  //       setBtnLoading(false);
  //     }
  //   }
  // };
  const handleSave = async () => {
    // Validate required fields
    if (
      !selectedPromo?.Code ||
      !selectedPromo?.Discount_Type ||
      !selectedPromo?.Discount ||
      !selectedPromo?.Order_Limit
    ) {
      notify("tr", "Please fill in all fields.", "danger");
      return;
    }

    // Extract all fields, ensure correct mapping and types
    const code = selectedPromo?.Code;
    const discount_percentage = selectedPromo?.Discount;
    const discount_type = selectedPromo?.Discount_Type;
    const order_limit = selectedPromo?.Order_Limit;
    const is_active = selectedPromo?.Status;
    const is_display = selectedPromo?.Display;
    const is_auto = selectedPromo?.Auto;
    const is_manual = selectedPromo?.Manual;

    if (isEditMode) {
      // PATCH: Update existing promo code (uses query parameters)
      console.log("Updating promo code:", selectedPromo);

      const id = selectedPromo?.id;
      const url = `https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/promocode/${encodeURIComponent(
        id
      )}?code3=${encodeURIComponent(code)}&discount3=${encodeURIComponent(
        discount_percentage
      )}&discount_type3=${encodeURIComponent(
        discount_type
      )}&order_limit3=${encodeURIComponent(
        order_limit
      )}&status3=${encodeURIComponent(is_active)}&display3=${encodeURIComponent(
        is_display
      )}&auto3=${encodeURIComponent(is_auto)}&manual3=${encodeURIComponent(
        is_manual
      )}`;

      try {
        setBtnLoading(true);
        const response = await axios.patch(url, {}, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("API Response:", response.data);
        if (response.status === 200) {
          notify("tr", "Promo code updated successfully!", "success");
          toggleModal();
          fetchPromoCodes();
        } else {
          notify("tr", "Failed to update promo code.", "danger");
        }
      } catch (error) {
        console.error("Error sending promo code data:", error);
        notify("tr", "Failed to update promo code.", "danger");
      } finally {
        setBtnLoading(false);
      }
    } else {
      // POST: Add new promo code (send as JSON body)
      const url = 'https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/promocode';
      const data = {
        code,
        discount: discount_percentage,
        discount_type,
        limit: order_limit,
        statusvalue: is_active,
        displayvalue: is_display,
        autovalue: is_auto,
        manualvalue: is_manual
      };

      console.log("Adding new promo code, sending data:", data);

      try {
        setBtnLoading(true);
        const response = await axios.post(url, data, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log("API Response:", response.data);
        if (response.status === 200) {
          notify("tr", "Promo code added Successfully!", "success");
          toggleModal();
          fetchPromoCodes();
        } else {
          notify("tr", "Failed to add promo code.", "danger");
        }
      } catch (error) {
        console.error("Error sending promo code data:", error);
        notify("tr", "Failed to add promo code.", "danger");
      } finally {
        setBtnLoading(false);
      }
    }
  };

  const deletePromoCode = async (id) => {
    if (window.confirm("Are you sure you want to delete this promo code?")) {
      try {
        const url = `https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/promocode/${encodeURIComponent(
          id
        )}`;
        const response = await axios.delete(url);

        if (response.status === 200) {
          notify("tr", "Promo code deleted successfully.", "success");
          fetchPromoCodes();
        } else {
          notify(
            "tr",
            `Error deleting promo code. Status: ${response.status}`,
            "danger"
          );
        }
      } catch (error) {
        notify("tr", `Network error: ${error}`, "danger");
      }
    }
  };

  const filteredData = data.filter((item) => {
    return (
      item.Code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Discount_Type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <>
      <Helmet>
        <title>Promo Codes - Mesob Store</title>
      </Helmet>
      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Promo Codes</h2>
          </div>
        }
      />
      <NotificationAlert ref={notificationAlertRef} />
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
                    Promo Codes
                  </CardTitle>
                  <Input
                    type="text"
                    placeholder="Search..."
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
                  <button
                    onClick={() => toggleModal()}
                    style={{
                      background: "linear-gradient(90deg, #34d399, #10b981)",
                      color: "#06281c",
                      border: "none",
                      borderRadius: "20px",
                      padding: "9px 16px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Add Promo Code
                  </button>
                </div>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center">
                    <Spinner color="primary" />
                    <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading promo codes...</p>
                  </div>
                ) : (
                  <DataTable
                    columns={columns(
                      (promo) => toggleModal(true, promo),
                      deletePromoCode
                    )}
                    data={filteredData}
                    selectableRows
                    responsive
                    highlightOnHover
                    customStyles={{
                      table: {
                        style: { background: "transparent" },
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

      {/* Modal for adding/editing promo code */}
      <Modal
        isOpen={modalOpen}
        toggle={toggleModal}
        backdrop={true}
        centered={true}
      >
        <ModalHeader toggle={toggleModal}>
          {isEditMode ? "Edit Promo Code" : "Add Promo Code"}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row form>
              <Col md={6}>
                <FormGroup>
                  <Label for="Code">Code</Label>
                  <Input
                    type="text"
                    id="promoCode"
                    value={selectedPromo?.Code || ""}
                    onChange={(e) =>
                      setSelectedPromo((prev) => ({
                        ...prev,
                        Code: e.target.value,
                      }))
                    }
                    placeholder="Enter promo code"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="discountType">Discount Type</Label>
                  <Input
                    type="text"
                    id="discountType"
                    value={selectedPromo?.Discount_Type || ""}
                    onChange={(e) =>
                      setSelectedPromo((prev) => ({
                        ...prev,
                        Discount_Type: e.target.value,
                      }))
                    }
                    placeholder="Enter discount type"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row form>
              <Col md={6}>
                <FormGroup>
                  <Label for="discountPercentage">Discount Percentage</Label>
                  <Input
                    type="number"
                    id="discountPercentage"
                    value={selectedPromo?.Discount || ""}
                    onChange={(e) =>
                      setSelectedPromo((prev) => ({
                        ...prev,
                        Discount: e.target.value,
                      }))
                    }
                    placeholder="Enter discount percentage"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="orderLimit">Order Limit</Label>
                  <Input
                    type="number"
                    id="orderLimit"
                    value={selectedPromo?.Order_Limit || ""}
                    onChange={(e) =>
                      setSelectedPromo((prev) => ({
                        ...prev,
                        Order_Limit: e.target.value,
                      }))
                    }
                    placeholder="Enter order limit"
                  />
                </FormGroup>
              </Col>
            </Row>
            {/* New fields for Display, Auto, Manual, IsActive */}
            <Row form>
              <Col md={6}>
                <FormGroup tag="fieldset">
                  <Label check inline>
                    Display
                  </Label>
                  <FormGroup check>
                    <Label className="d-flex">
                      <Input
                        type="radio"
                        name="display"
                        value="1"
                        checked={selectedPromo?.Display === "1"}
                        onChange={() =>
                          setSelectedPromo((prev) => ({
                            ...prev,
                            Display: "1",
                          }))
                        }
                        style={{ marginRight: "8px" }}
                      />
                      Yes
                    </Label>
                    <Label className="d-flex">
                      <Input
                        type="radio"
                        name="display"
                        value="0"
                        checked={selectedPromo?.Display === "0"}
                        onChange={() =>
                          setSelectedPromo((prev) => ({
                            ...prev,
                            Display: "0",
                          }))
                        }
                        style={{ marginRight: "8px" }}
                      />
                      No
                    </Label>
                  </FormGroup>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup tag="fieldset">
                  <Label check>Is Active</Label>
                  <FormGroup check>
                    <Label className="d-flex">
                      <Input
                        type="radio"
                        name="isActive"
                        value="1"
                        checked={selectedPromo?.Status === "1"}
                        onChange={() =>
                          setSelectedPromo((prev) => ({
                            ...prev,
                            Status: "1",
                          }))
                        }
                        style={{ marginRight: "8px" }}
                      />
                      Yes
                    </Label>
                    <Label className="d-flex">
                      <Input
                        type="radio"
                        name="isActive"
                        value="0"
                        checked={selectedPromo?.Status === "0"}
                        onChange={() =>
                          setSelectedPromo((prev) => ({
                            ...prev,
                            Status: "0",
                          }))
                        }
                        style={{ marginRight: "8px" }}
                      />
                      No
                    </Label>
                  </FormGroup>
                </FormGroup>
              </Col>
            </Row>
            <Row form>
              <Col md={6}>
                <FormGroup tag="fieldset">
                  <Label check>Auto</Label>
                  <FormGroup check>
                    <Label className="d-flex">
                      <Input
                        type="radio"
                        name="auto"
                        value="1"
                        checked={selectedPromo?.Auto === "1"}
                        onChange={() =>
                          setSelectedPromo((prev) => ({
                            ...prev,
                            Auto: "1",
                          }))
                        }
                        style={{ marginRight: "8px" }}
                      />
                      Yes
                    </Label>
                    <Label className="d-flex">
                      <Input
                        type="radio"
                        name="auto"
                        value="0"
                        checked={selectedPromo?.Auto === "0"}
                        onChange={() =>
                          setSelectedPromo((prev) => ({
                            ...prev,
                            Auto: "0",
                          }))
                        }
                        style={{ marginRight: "8px" }}
                      />
                      No
                    </Label>
                  </FormGroup>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup tag="fieldset">
                  <Label check>Manual</Label>
                  <FormGroup check>
                    <Label className="d-flex">
                      <Input
                        type="radio"
                        name="manual"
                        value="1"
                        checked={selectedPromo?.Manual === "1"}
                        onChange={() =>
                          setSelectedPromo((prev) => ({
                            ...prev,
                            Manual: "1",
                          }))
                        }
                        style={{ marginRight: "8px" }}
                      />
                      Yes
                    </Label>
                    <Label className="d-flex">
                      <Input
                        type="radio"
                        name="manual"
                        value="0"
                        checked={selectedPromo?.Manual === "0"}
                        onChange={() =>
                          setSelectedPromo((prev) => ({
                            ...prev,
                            Manual: "0",
                          }))
                        }
                        style={{ marginRight: "8px" }}
                      />
                      No
                    </Label>
                  </FormGroup>
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="info"
            className="btn-round"
            onClick={handleSave}
            disabled={btnLoading}
          >
            {btnLoading ? (
              <>
                Saving...
                <Spinner color="secondary" size="sm" className="ml-1" />
              </>
            ) : isEditMode ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
          <Button color="secondary" className="btn-round" onClick={toggleModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default PromoCodes;