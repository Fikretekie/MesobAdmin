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

function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    axios
      .get("https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/users")
      .then((response) => {
        if (response.data) {
          setItems(response.data.Items);
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

    const emails = selectedUsers.map((user) => user.email).join(", ");
    const subjectMultipleUsers = subjectMultiUsers;
    const messageMultipleUsers = bodyMultiUsers;

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
        setModalMultiUsers(false);
        setSubjectMultiUsers("");
        setBodyMultiUsers("");
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
        <Button
          onClick={() => handleView(row)}
          color="info"
          className="btn-round btn-sm"
        >
          {"View"}
        </Button>
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
      <div className="content">
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <CardTitle tag="h4">Cart</CardTitle>
                  <Input
                    type="text"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginLeft: "10px", width: "250px" }}
                  />
                  <Button
                    color="secondary"
                    className="btn-round"
                    onClick={handleViewEmails}
                    disabled={selectedUsers.length === 0}
                  >
                    Send Email to Selected Emails
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spinner color="primary" />
                    <p>Loading cart...</p>
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
                        "removeformat | help",
                      placeholder: "Write your message here...",
                      content_style:
                        "body { background: #0f172a; color: #e8f1ff; font-family: Helvetica, Arial, sans-serif; }",
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
                    "removeformat | help",
                  placeholder: "Write your message here...",
                  content_style:
                    "body { background: #0f172a; color: #e8f1ff; font-family: Helvetica, Arial, sans-serif; }",
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
          </Form>
        </ModalBody>
      </Modal>
    </>
  );
}

export default Cart;
