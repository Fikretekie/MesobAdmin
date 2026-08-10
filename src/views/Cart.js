import React, { useState, useEffect, useRef } from "react";
import useEmailTemplates from "hooks/useEmailTemplates";
import TemplateCardGrid from "components/TemplateCardGrid";
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
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Table,
  Form,
  FormGroup,
  Label,
  Popover,
  PopoverBody,
} from "reactstrap";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import axios from "axios";
import formatDate from "utils/formatDate";
import { Helmet } from "react-helmet";
import NotificationAlert from "react-notification-alert";
import "react-notification-alert/dist/animate.css";
import formatUserId from "utils/formatUID";
import { Editor } from "@tinymce/tinymce-react";

// Lives outside the component so it survives navigating away and back.
const cartPageCache = { items: null };

function Cart() {
  const [items, setItems] = useState(cartPageCache.items ?? []);
  const [loading, setLoading] = useState(!cartPageCache.items);
  const [searchTerm, setSearchTerm] = useState("");
  const { templates, saveTemplate } = useEmailTemplates();
  const [selectedSingleTemplateId, setSelectedSingleTemplateId] = useState(null);
  const [selectedMultiTemplateId, setSelectedMultiTemplateId] = useState(null);

  const handleSaveAsTemplate = async (subject, message) => {
    if (!subject.trim() || !message.trim()) {
      alert("Fill in a subject and message before saving as a template.");
      return;
    }
    const name = window.prompt("Name this template:");
    if (!name) return;
    try {
      await saveTemplate(name, subject, message);
      alert("Template saved!");
    } catch (err) {
      alert("Failed to save template.");
    }
  };

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

  // For single user
  const [selectedUser, setSelectedUser] = useState(null); // User data for modal
  const [modalCartItem, setModalCartItems] = useState(false); // Modal state
  const [subjectCartItem, setSubjectCartItem] = useState("");
  const [bodyCartItem, setBodyCartItem] = useState("");
  const editorRef = useRef(null);

  // for multiple users
  const [selectedUsers, setSelectedUsers] = useState([]); // Store selected users
  const [modalMultiUsers, setModalMultiUsers] = useState(false); // Modal state
  const [subjectMultiUsers, setSubjectMultiUsers] = useState("");
  const [bodyMultiUsers, setBodyMultiUsers] = useState("");

  const [sendBtnLoading, setSendBtnLoading] = useState(false);
  const [sendMultipleBtnLoading, setSendMultipleBtnLoading] = useState(false);
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

  useEffect(() => {
    // Already have this from a previous visit — skip refetching
    if (cartPageCache.items) {
      return;
    }
    axios
      .get("https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/users")
      .then((response) => {
        if (response.data) {
          setItems(response.data.Items);
          cartPageCache.items = response.data.Items;
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("There was an error fetching the items!", error);
      });
  }, []);

  const handleView = (user) => {
    setSelectedUser(user);
    setModalCartItems(true);
  };

  const handleCartEditorChange = (content, editor) => {
    setBodyCartItem(content);
  };

  const handleMultiUsersEditorChange = (content, editor) => {
    setBodyMultiUsers(content);
  };

  const handleEmailSend = async (e) => {
    e.preventDefault();

    const subject = subjectCartItem;
    const message = bodyCartItem;
    const email = selectedUser?.email;

    const payload = {
      email,
      message,
      subject,
    };

    try {
      setSendBtnLoading(true);
      // Make POST request to the API URL
      const response = await axios.post(
        "https://q0v1vrhy5g.execute-api.us-east-1.amazonaws.com/staging",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Email API Response:", response.data);

      if (response.data.statusCode) {
        // Log response
        // Close modal after sending email
        setModalCartItems(false);
        // Stop button loading
        setSendBtnLoading(false);

        setSubjectCartItem("");
        setBodyCartItem("");

        notify("tr", "Email sent successfully!", "success");
      } else {
        // Stop button loading
        setSendBtnLoading(false);

        notify("tr", response.data.message, "danger");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error(error.response?.data?.message || "Error sending email");
    }
  };

  const handleRowSelected = (state) => {
    setSelectedUsers(state.selectedRows);
  };

  const handleViewEmails = () => {
    setModalMultiUsers(true);
  };

  const handleMultipleEmailSend = async (e) => {
    e.preventDefault();

    const subjectMultipleUsers = subjectMultiUsers;
    const messageMultipleUsers = bodyMultiUsers;

    try {
      setSendMultipleBtnLoading(true);

      // Send one separate, private email per recipient instead of one
      // combined email — so no one sees anyone else's address.
      const results = await Promise.allSettled(
        selectedUsers.map((user) =>
          axios.post(
            "https://q0v1vrhy5g.execute-api.us-east-1.amazonaws.com/staging",
            {
              email: user.email,
              message: messageMultipleUsers,
              subject: subjectMultipleUsers,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        )
      );

      const failed = results.filter((r) => r.status === "rejected");

      setSendMultipleBtnLoading(false);

      if (failed.length === 0) {
        setModalMultiUsers(false);
        setSubjectMultiUsers("");
        setBodyMultiUsers("");
        notify("tr", `Sent ${selectedUsers.length} individual emails successfully!`, "success");
      } else if (failed.length < selectedUsers.length) {
        notify(
          "tr",
          `Sent ${selectedUsers.length - failed.length} of ${selectedUsers.length} emails. ${failed.length} failed.`,
          "warning"
        );
      } else {
        notify("tr", "Failed to send emails.", "danger");
      }
    } catch (error) {
      setSendMultipleBtnLoading(false);
      console.error("Error sending emails:", error);
      notify("tr", "Error sending emails", "danger");
    }
  };

  const filteredData = items
    .filter((item) => item.CartItem && item.CartItem.length >= 1)
    .filter((item) =>
      item.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const columns = [
    {
      name: "User ID",
      selector: (row) => row.id,
      sortable: true,
      width: "120px",
      cell: (row) => <UserIdCell userId={row.id} />,
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
      width: "300px",
    },
    {
      name: "Cart Count",
      selector: (row) => row.CartItem?.length || 0,
      sortable: true,
      width: "150px",
    },
    {
      name: "Updated At",
      selector: (row) => formatDate(row.updatedAt),
      sortable: true,
      width: "250px",
    },
    {
      name: "Cart Items",
      cell: (row) => (
        <button
          onClick={() => handleView(row)}
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
          View
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
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
        <title>Cart - Mesob Store</title>
      </Helmet>

      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Cart</h2>
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
                    Cart
                  </CardTitle>
                  <Input
                    type="text"
                    placeholder="Search by email..."
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
                    onClick={handleViewEmails}
                    disabled={selectedUsers.length === 0}
                    style={{
                      background:
                        selectedUsers.length === 0
                          ? "rgba(255,255,255,0.06)"
                          : "linear-gradient(90deg, #34d399, #10b981)",
                      color:
                        selectedUsers.length === 0
                          ? "rgba(255,255,255,0.35)"
                          : "#06281c",
                      border: "none",
                      borderRadius: "20px",
                      padding: "9px 16px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor:
                        selectedUsers.length === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    Send Email to Selected Emails
                  </button>
                </div>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spinner color="primary" />
                    <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading cart...</p>
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={filteredData}
                    selectableRows
                    onSelectedRowsChange={handleRowSelected}
                    responsive
                    fixedHeader={true}
                    pagination
                    paginationPerPage={100}
                    paginationRowsPerPageOptions={[100, 200, 300, 500, 1000]}
                    highlightOnHover
                    customStyles={tableCustomStyles}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Modal for viewing user cart items */}
      <Modal
        isOpen={modalCartItem}
        toggle={() => setModalCartItems(false)}
        size="xl"
      >
        <ModalHeader toggle={() => setModalCartItems(false)}>
          Cart Items for {selectedUser?.email}
        </ModalHeader>
        <ModalBody>
          {selectedUser ? (
            <>
              {selectedUser.CartItem.length > 0 ? (
                <Table bordered responsive>
                  <thead>
                    <tr>
                      <td className="font-weight-bold">#</td>
                      <td className="font-weight-bold">Product Title</td>
                      <td className="font-weight-bold">Quantity</td>
                      <td className="font-weight-bold">Category</td>
                      <td className="font-weight-bold">Price</td>
                      <td className="font-weight-bold">Cost</td>
                      <td className="font-weight-bold">isRecommended</td>
                      <td className="font-weight-bold">Off Percentage</td>
                      <td className="font-weight-bold">Country</td>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.CartItem.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.title}</td>
                        <td>{item.qty}</td>
                        <td>{item.category}</td>
                        <td>{item.content.price}</td>
                        <td>{item.content.cost}</td>
                        <td>{item.isRecommended == true ? "Yes" : "No"}</td>
                        <td>{item.off_percentage ?? "-"}</td>
                        <td>{item.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No items in the cart.</p>
              )}
              <hr />
              <h6 className="mb-3">Send Email</h6>
              <Form>
                <FormGroup>
                  <Label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    Saved Templates
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
                    selectedId={selectedSingleTemplateId}
                    onSelect={(t) => {
                      setSelectedSingleTemplateId(t.id);
                      setSubjectCartItem(t.subject);
                      if (editorRef.current) {
                        editorRef.current.setContent(t.message);
                      }
                    }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="subject">Subject</Label>
                  <Input
                    type="text"
                    id="subject"
                    value={subjectCartItem}
                    onChange={(e) => setSubjectCartItem(e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="body">Body</Label>
                  {/* <Input
                    type="textarea"
                    id="body"
                    value={bodyCartItem}
                    onChange={(e) => setBodyCartItem(e.target.value)}
                  /> */}
                  <Editor
                    tinymceScriptSrc={`${process.env.PUBLIC_URL}/tinymce/tinymce.min.js`}
                    onInit={(evt, editor) => (editorRef.current = editor)}
                    initialValue=""
                    init={{
                      height: 500,
                      menubar: true,
                      skin: "oxide-dark",
                      toolbar_mode: "wrap",
                      content_css: "dark",
                      branding: false,
                      promotion: false,
                      license_key: "gpl",
                      plugins:
                        "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount",
                      toolbar:
                        "undo redo | blocks fontfamily fontsize | " +
                        "bold italic underline forecolor backcolor | " +
                        "alignleft aligncenter alignright alignjustify | " +
                        "bullist numlist outdent indent | " +
                        "link image media table | removeformat | help",
                      image_advtab: true,
                                              file_picker_types: "image",
                                              file_picker_callback: (callback) => {
                                                const input = document.createElement("input");
                                                input.setAttribute("type", "file");
                                                input.setAttribute("accept", "image/*");
                                                input.onchange = () => {
                                                  const file = input.files[0];
                                                  const reader = new FileReader();
                                                  reader.onload = () => {
                                                    callback(reader.result, { alt: file.name });
                                                  };
                                                  reader.readAsDataURL(file);
                                                };
                                                input.click();
                                              },
                                                  file_picker_types: "image",
                                                  file_picker_callback: (callback) => {
                                                    const input = document.createElement("input");
                                                    input.setAttribute("type", "file");
                                                    input.setAttribute("accept", "image/*");
                                                    input.onchange = () => {
                                                      const file = input.files[0];
                                                      const reader = new FileReader();
                                                      reader.onload = () => {
                                                        callback(reader.result, { alt: file.name });
                                                      };
                                                      reader.readAsDataURL(file);
                                                    };
                                                    input.click();
                                                  },
                      image_caption: true,
                      object_resizing: true,
                      placeholder: "Write your message here...",
                      content_style:
                        "body { background: #0f172a; color: #e8f1ff; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; }",
                    }}
                    onEditorChange={handleCartEditorChange}
                  />
                </FormGroup>
                <Input
                  type="hidden"
                  id="userEmail"
                  name="userEmail"
                  value={selectedUser?.email}
                />
                <Button
                  color="info"
                  className="btn-round"
                  onClick={handleEmailSend}
                  disabled={sendBtnLoading}
                >
                  {sendBtnLoading ? (
                    <>
                      Sending...
                      <Spinner color="secondary" size="sm" className="ml-1" />
                    </>
                  ) : (
                    "Send Email"
                  )}
                </Button>
                <Button
                  color="secondary"
                  className="btn-round ml-2"
                  type="button"
                  onClick={() => handleSaveAsTemplate(subjectCartItem, bodyCartItem)}
                >
                  Save as Template
                </Button>
              </Form>
            </>
          ) : (
            <p>No data available</p>
          )}
        </ModalBody>
      </Modal>

      {/* Modal for sending email to multiple users */}
      <Modal
        isOpen={modalMultiUsers}
        toggle={() => setModalMultiUsers(false)}
        size="lg"
      >
        <ModalHeader toggle={() => setModalMultiUsers(false)}>
          Send Email to Selected Users
        </ModalHeader>
        <ModalBody>
          {selectedUsers.length > 0 ? (
            <DataTable
              size={"sm"}
              columns={[{ name: "Emails", selector: (row) => row.email }]}
              data={selectedUsers}
              pagination
              paginationPerPage={3}
              paginationRowsPerPageOptions={[3, 10, 20, 50]}
              highlightOnHover
            />
          ) : (
            <p>No users selected.</p>
          )}
          <hr />
          <h6 className="mb-3">Send Email</h6>
          <Form>
            <FormGroup>
              <Label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Saved Templates
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
                selectedId={selectedMultiTemplateId}
                onSelect={(t) => {
                  setSelectedMultiTemplateId(t.id);
                  setSubjectMultiUsers(t.subject);
                  if (editorRef.current) {
                    editorRef.current.setContent(t.message);
                  }
                }}
              />
            </FormGroup>
            <FormGroup>
              <Label size="small">Subject</Label>
              <Input
                type="text"
                id="subject"
                value={subjectMultiUsers}
                onChange={(e) => setSubjectMultiUsers(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label size="small">Body</Label>
              {/* <Input
                type="textarea"
                id="body"
                value={bodyMultiUsers}
                onChange={(e) => setBodyMultiUsers(e.target.value)}
              /> */}
              <Editor
                tinymceScriptSrc={`${process.env.PUBLIC_URL}/tinymce/tinymce.min.js`}
                onInit={(evt, editor) => (editorRef.current = editor)}
                initialValue=""
                init={{
                  height: 500,
                  menubar: true,
                  skin: "oxide-dark",
                  toolbar_mode: "wrap",
                  content_css: "dark",
                  branding: false,
                  promotion: false,
                  license_key: "gpl",
                  plugins:
                    "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount",
                  toolbar:
                    "undo redo | blocks fontfamily fontsize | " +
                    "bold italic underline forecolor backcolor | " +
                    "alignleft aligncenter alignright alignjustify | " +
                    "bullist numlist outdent indent | " +
                    "link image media table | removeformat | help",
                  image_advtab: true,
                  image_caption: true,
                  object_resizing: true,
                  placeholder: "Write your message here...",
                  content_style:
                    "body { background: #0f172a; color: #e8f1ff; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; }",
                }}
                onEditorChange={handleMultiUsersEditorChange}
              />
            </FormGroup>
            <Button
              color="info"
              className="btn-round"
              onClick={handleMultipleEmailSend}
              disabled={sendMultipleBtnLoading}
            >
              {sendMultipleBtnLoading ? (
                <>
                  Sending...
                  <Spinner color="secondary" size="sm" className="ml-1" />
                </>
              ) : (
                "Send Email"
              )}
            </Button>
            <Button
              color="secondary"
              className="btn-round ml-2"
              type="button"
              onClick={() => handleSaveAsTemplate(subjectMultiUsers, bodyMultiUsers)}
            >
              Save as Template
            </Button>
          </Form>
        </ModalBody>
      </Modal>
    </>
  );
}

export default Cart;