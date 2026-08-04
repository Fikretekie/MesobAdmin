import React, { useState, useEffect, useRef } from "react";
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
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
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

const columns = [
  {
    name: "User ID",
    selector: (row) => row?.id,
    sortable: true,
    width: "120px",
    cell: (row) => <UserIdCell userId={row?.id} />,
  },
  {
    name: "Email",
    selector: (row) => row?.email,
    sortable: true,
    width: "300px",
  },
  {
    name: "Phone",
    selector: (row) => row?.phoneNo ?? "-",
    sortable: true,
    width: "100px",
  },
  {
    name: "Created At",
    selector: (row) => formatDate(row.createdAt),
    sortable: true,
    width: "250px",
  },
  {
    name: "Updated At",
    selector: (row) => formatDate(row.updatedAt),
    sortable: true,
    width: "250px",
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

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const editorRef = useRef(null);
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
    axios
      .get("https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/users")
      .then((response) => {
        if (response.data.Items) {
          setUsers(response.data.Items);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("There was an error fetching the users!", error);
      });
  }, []);

  const filteredData = users.filter((item) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      item.email?.toLowerCase().includes(searchTermLower) ||
      item.id.toString().includes(searchTermLower)
    );
  });

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleRowSelected = (state) => {
    setSelectedRows(state.selectedRows);
  };

  const handleEditorChange = (content, editor) => {
    setBody(content);
  };

  const handleEmailSend = async (e) => {
    e.preventDefault();

    const emails = selectedRows.map((user) => user.email).join(", ");
    const subjectMultipleUsers = subject;
    const messageMultipleUsers = body;

    console.log("Sending email to:", emails, "\n");
    console.log("subject: ", subjectMultipleUsers, "\n");
    console.log("message : ", messageMultipleUsers, "\n");

    const payload = {
      email: emails,
      message: messageMultipleUsers,
      subject: subjectMultipleUsers,
    };

    try {
      setSendMultipleBtnLoading(true);
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
        // Close modal after sending email
        setModalOpen(false);
        setSubject("");
        setBody("");
        setSendMultipleBtnLoading(false);

        notify("tr", "Emails sent successfully!", "success");
      } else {
        setSendMultipleBtnLoading(false);

        notify("tr", response.data.message, "danger");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error(error.response?.data?.message || "Error sending email");
    }
  };

  return (
    <>
      <Helmet>
        <title>Users - Mesob Store</title>
      </Helmet>

      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Users.</h2>
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
                    Users
                  </CardTitle>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "20px",
                        padding: "8px 14px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                      }}
                    >
                      {users.length} Users
                    </span>
                    <button
                      onClick={toggleModal}
                      disabled={selectedRows.length === 0}
                      style={{
                        background:
                          selectedRows.length === 0
                            ? "rgba(255,255,255,0.06)"
                            : "linear-gradient(90deg, #a78bfa, #60a5fa)",
                        color:
                          selectedRows.length === 0
                            ? "rgba(255,255,255,0.35)"
                            : "#0a0612",
                        border: "none",
                        borderRadius: "20px",
                        padding: "9px 16px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor:
                          selectedRows.length === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      Send Email
                    </button>
                    <Input
                      type="text"
                      placeholder="Search by email or user id..."
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
                </div>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spinner color="primary" />
                    <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading users...</p>
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

      {/* Modal for sending emails to selected users */}
      <Modal isOpen={modalOpen} toggle={toggleModal} size="lg">
        <ModalHeader toggle={toggleModal}>
          Send Email to Selected Users
        </ModalHeader>
        <ModalBody>
          {selectedRows.length > 0 ? (
            <DataTable
              columns={[{ name: "Emails", selector: (row) => row.email }]}
              data={selectedRows}
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
              <Label for="subject">Subject</Label>
              <Input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label for="body">Body</Label>
              {/* <Input
                type="textarea"
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              /> */}
              <Editor
                apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                onInit={(evt, editor) => (editorRef.current = editor)}
                initialValue=""
                init={{
                  height: 300,
                  menubar: true,
                  skin: "oxide-dark",
                  content_css: "dark",
                  branding: false,
                  plugins: [
                    "advlist autolink lists link image charmap print preview anchor",
                    "searchreplace visualblocks code fullscreen",
                    "insertdatetime media table paste code help wordcount",
                    "placeholder",
                  ],
                  toolbar:
                    "undo redo | formatselect | " +
                    "bold italic backcolor | alignleft aligncenter " +
                    "alignright alignjustify | bullist numlist outdent indent | " +
                    "removeformat",
                  placeholder: "Write your message here...",
                  content_style:
                    "body { background: #0f172a; color: #e8f1ff; font-family: Helvetica, Arial, sans-serif; }",
                }}
                onEditorChange={handleEditorChange}
              />
            </FormGroup>
            <style>{`
              .users-send-email-btn {
                background: linear-gradient(90deg, #a78bfa, #60a5fa) !important;
                color: #0a0612 !important;
                border: none !important;
                border-radius: 20px !important;
                font-weight: 700 !important;
                box-shadow: none !important;
              }
              .users-send-email-btn:hover,
              .users-send-email-btn:focus,
              .users-send-email-btn:active {
                background: linear-gradient(90deg, #a78bfa, #60a5fa) !important;
                color: #0a0612 !important;
                box-shadow: none !important;
              }
            `}</style>
            <Button
              className="users-send-email-btn"
              onClick={handleEmailSend}
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
          </Form>
        </ModalBody>
      </Modal>
    </>
  );
}

export default Users;