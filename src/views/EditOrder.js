import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Spinner,
  Button,
  FormGroup,
  Input,
  Label,
  Table,
} from "reactstrap";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import axios from "axios";
import { Helmet } from "react-helmet";
import "../assets/css/OrderDetails.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import NotificationAlert from "react-notification-alert";
import "react-notification-alert/dist/animate.css";
import { Editor } from "@tinymce/tinymce-react";

const EditOrder = () => {
  const { id } = useParams();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [senderEmail, setSenderEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const notificationAlertRef = useRef(null);
  const navigate = useNavigate();
  const [updateBtnLoading, setUpdateBtnLoading] = useState(false);

  const [orderStatus, setOrderStatus] = useState("");
  const [markStatus, setMarkStatus] = useState("");
  const [notes, setNotes] = useState("");

  const [productRows, setProductRows] = useState([]);
  const [totalSellingPrice, setTotalSellingPrice] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [discountedCost, setDiscountedCost] = useState(0);

  const editorRef = useRef(null);
  const [adminUser, setAdminUser] = useState([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState("");

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(
        `https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/items/${id}`
      );
      const itemData = response?.data?.Item;

      // Parse senderAddress JSON string
      const senderAddressParsed = JSON.parse(itemData?.senderAddress || "{}");

      setOrderDetails(itemData);
      setOrderStatus(itemData?.Status);
      setSenderEmail(senderAddressParsed?.email);
      setRecipientEmail(itemData?.useremail);
      setMarkStatus(itemData?.adminStatus);
      setLoading(false);
      calculateTotals(itemData);
      setSelectedAdminUser(itemData?.assignedName);
      setNotes(itemData?.notes);

      if (itemData?.Products) {
        let sellingPrice = 0;
        let costPrice = 0;
        let rows = [];

        // Iterate through products to calculate totals
        itemData.Products.forEach((product, index) => {
          const price = parseFloat(product.price.replace(/[$,]/g, ""));
          const cost = parseFloat(product.cost.replace(/[$,]/g, ""));

          // console.log("price", price);
          // console.log("cost", cost);

          const quantity = parseFloat(product.quantity || product.qty);

          sellingPrice += price * quantity;
          costPrice += cost * quantity;

          // Create the row and push to it
          let row = ` 
          <tr key=${index + 1}>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
              ${index + 1}
            </td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
              ${product.name ?? product.title}
            </td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
              ${product.country}
            </td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
              ${product.quantity ?? product.qty}
            </td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
              ${product.price}
            </td>
          </tr>`;

          rows.push(row);
        });

        setProductRows(rows);
        setTotalSellingPrice(sellingPrice);
        setTotalCost(costPrice);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await axios.get(
        "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/adminuser"
      );
      const users = response?.data;

      setAdminUser(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    fetchAdminUsers();
  }, []);

  let promo_discount = "";

  const calculateTotals = (item) => {
    let total_price = 0;
    let total_cost = 0;
    promo_discount = item.promodiscount;

    item.Products.forEach((product) => {
      // Remove $ and comma from price and cost
      const price = parseFloat(product.price.replace(/[\$,]/g, ""));
      const cost = parseFloat(product.cost.replace(/[\$,]/g, ""));
      const quantity = product.qty ?? product.quantity;

      // Calculate totals
      total_price += quantity * price;
      total_cost += quantity * cost;
    });

    // Apply promo discount if available
    const discounted_price = promo_discount
      ? total_price - promo_discount
      : total_price;

    const discounted_cost = total_cost; // Keep total cost unchanged

    setTotalSellingPrice(total_price);
    setTotalCost(total_cost);
    setDiscountedPrice(discounted_price);
    setDiscountedCost(discounted_cost);
  };

  const tableHTML = productRows;

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setOrderStatus(newStatus);
  };

  const handleMarkStatusChange = (e) => {
    setMarkStatus(e.target.value);
  };

  const handleAdminUserChange = (e) => {
    setSelectedAdminUser(e.target.value);
  };

  // const handleNotesChange = (e) => {
  //   setNotes(e.target.value);
  // };

  const handleNotesEditorChange = (content, editor) => {
    setNotes(content);
  };

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

  const handleUpdate = async () => {
    const safeNotes = notes ?? "";
    console.log("id: ", id);
    console.log("orderStatus: ", orderStatus);
    console.log("markStatus: ", markStatus);
    console.log("safeNotes: ", safeNotes);
    console.log("assignedName: ", selectedAdminUser);
    console.log("finance: ", false);

    try {
      setUpdateBtnLoading(true);
      const updatedBy = localStorage.getItem("user_email");
      const queryParams = new URLSearchParams();
      // Only send Status when changed; avoids backend status side-effects on no-op updates.
      if (orderStatus && orderStatus !== orderDetails?.Status) {
        queryParams.set("Status", orderStatus);
      }
      queryParams.set("adminStatus", markStatus ?? "");
      queryParams.set("notes", safeNotes);
      queryParams.set("updatedBy", updatedBy ?? "");
      queryParams.set("assignedName", selectedAdminUser ?? "");
      queryParams.set("finance", "false");

      const response = await fetch(
        `https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/items/${id}?${queryParams.toString()}`,
        {
          method: "PATCH",
        }
      );
      console.log("response: ", response);


      if (response.ok) {
        notify("tr", "Order updated successfully!", "success");
        setUpdateBtnLoading(false);
        if (orderDetails?.Status !== orderStatus) {
          // Get email content and send email
          const emailMessage = getEmailContentByStatus(orderStatus);
          await Promise.all([
            sendEmail(
              senderEmail,
              emailMessage,
              `Order Status: ${orderStatus}`
            ),
            sendEmail(
              recipientEmail,
              emailMessage,
              `Order Status: ${orderStatus}`
            ),
          ]);
        } else {
          notify("tr", "No changes made to order status.", "info");
        }
        // // Reload the page
        window.location.reload();

        // navigate('/admin/orders')
      } else {
        const errorText = await response.text();
        throw new Error(
          `Failed to update order (${response.status}): ${errorText || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error updating order:", error);
      notify("tr", "Failed to update order", "danger");
      setUpdateBtnLoading(false);
    } finally {
      setOrderStatus(orderStatus);
    }
  };

  const sendEmail = async (email, message, subject) => {
    const payload = {
      email,
      message,
      subject,
    };

    try {
      setUpdateBtnLoading(true);
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

      if (response.status === 200) {
        setUpdateBtnLoading(false);
      }

      return response.data;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error(error.response?.data?.message || "Error sending email");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spinner color="primary" />
        <p>Loading order details...</p>
      </div>
    );
  }

  const senderInfo = JSON.parse(orderDetails.senderAddress);
  const receiverInfo = {
    name: orderDetails.name,
    email: orderDetails.useremail,
    phone: orderDetails.phone,
    address: orderDetails.address,
    city: orderDetails.city,
    state: orderDetails.state,
    country: orderDetails.country,
  };

  const getEmailContentByStatus = (status) => {
    switch (status) {
      case "Shipped":
        return `
        <div style="display: flex; align-items: center;">
          <h2 style="font-style: italic; color: black; margin-right: 20px;">
            <span style="color: red;">M</span>esob 
            <span style="color: red;">S</span>tore
          </h2>
          <div style="display: flex; justify-content: center; align-items: center; margin-left: 10px;">
            <img style="margin-top:5px; max-width: 35px; height: 35px; vertical-align: middle;" src="http://admin.mesobstore.com/logo.png" alt="Your Logo">
          </div>
        </div>
        <p style="color:black;">Dear customer,<br />
          We are excited to let you know that your order has been shipped!
          <br />
           If you have any questions or need further assistance, please don't hesitate to contact our customer service team at mesob@mesobstore.com or 614-580-7521
          <br />
          Thank you for shopping with Mesob Store! We hope you enjoy your purchase and look forward to serving you again.
          <br/><br/>
          Best regards,
        </p>
      `;
      case "Delivered":
        return `
        <div style="display: flex; align-items: center;">
          <h2 style="font-style: italic; color: black; margin-right: 10px;">
            <span style="color: red;">M</span>esob 
            <span style="color: red;">S</span>tore
          </h2>
          <div style="display: flex; justify-content: center; align-items: center; margin-left: 20px;">
            <img style="margin-top:5px; max-width: 35px; height: 35px; vertical-align: middle;" src="http://admin.mesobstore.com/logo.png" alt="Your Logo">
          </div>
        </div>
        <p style="color:black;">Dear customer,<br />
          We are pleased to inform you that your order has been successfully delivered!
          <br />
          We hope you are delighted with your purchase! If you have any questions or need any assistance, please do not hesitate to contact our customer service team at mesob@mesobstore.com or 614-580-7521
          <br />
          Your feedback is important to us. If you have a moment, please let us know about your shopping experience by leaving a review.
          <br/>
          Google play link
          <br/>
          https://play.google.com/store/apps/details?id=com.mesob.store.app&pcampaignid=web_share
          <br/>
          Apple store link
          <br/>
          https://apps.apple.com/us/app/mesob-store/id1617565954
          <br/>
          Thank you for choosing mesobstore.com. We look forward to serving you again soon!
          <br/><br/>
          Best regards,
        </p>
      `;
      case "Orderd":
        return `
        <h3>1. Sender Info: </h3>
        <ul>
          <li>Name: ${senderInfo.name}</li>
          <li>Email: ${senderInfo.email}</li>
          <li>Address: ${senderInfo.address}</li>
          <li>Phone: ${senderInfo.phone}</li>
          <li>City: ${senderInfo.city}</li>
          <li>State: ${senderInfo.state}</li>
          <li>Zip Code: ${senderInfo.pincode}</li>
        </ul>
        <h3>2. Receiver Info: </h3>
        <ul>
          <li>Name: ${receiverInfo.name}</li>
          <li>Street Address: ${receiverInfo.address}</li>
          <li>Phone: ${receiverInfo.phone}</li>
          <li>City: ${receiverInfo.city}</li>
        </ul>
        <h2>Order Details:</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px;">Sr No.</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Name</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Country</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Quantity</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Selling Price</th>
            </tr>
          </thead>
          <tbody>
            ${tableHTML}
          </tbody>
        </table>
        <p>Total Promo Discount :$ ${orderDetails.promodiscount}</p>
        <p>Total Selling Price: ${totalSellingPrice}</p>
        
        <p>
          Thank you for your order!
          <br />
          We hope you are delighted with your purchase! If you have any questions or need any assistance, please do not hesitate to contact our customer service team at mesob@mesobstore.com or 614-580-7521
          <br />
          Your feedback is important to us. If you have a moment, please let us know about your shopping experience by leaving a review.
          <br/>
          Google play link
          <br/>
          https://play.google.com/store/apps/details?id=com.mesob.store.app&pcampaignid=web_share
          <br/>
          Apple store link
          <br/>
          https://apps.apple.com/us/app/mesob-store/id1617565954
          <br/>
          Thank you for choosing mesobstore.com. We look forward to serving you again soon!
          <br/><br/>
          Best regards,
        </p>
        
      `;
    }
    // <p>Total Cost Price: ${totalCost}</p>;
  };

  return (
    <>
      <Helmet>
        <title>Edit Order - Mesob Store</title>
      </Helmet>

      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Edit Order</h2>
          </div>
        }
      />
      <NotificationAlert ref={notificationAlertRef} />
      <div className="content">
        <Row>
          <Col xs={12}>
            <Card className="order-card">
              <CardHeader className="order-header">
                <div className="d-flex align-items-center">
                  <Button
                    className="btn btn-link"
                    onClick={() => navigate("/admin/orders")}
                    style={{ fontSize: "20px", marginRight: "10px" }}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </Button>
                  <h4 className="card-title">
                    <b>Order ID:</b> {orderDetails.id}
                  </h4>
                </div>
              </CardHeader>
              <CardBody>
                <Row>
                  {/* Sender Info */}
                  <Col md={6} className="order-info-col">
                    <h5 className="section-heading">Sender Information</h5>
                    <ul className="list-unstyled">
                      <li>
                        <strong>Name:</strong> {senderInfo.name}
                      </li>
                      <li>
                        <strong>Email:</strong> {senderInfo.email}
                      </li>
                      <li>
                        <strong>Phone:</strong> {senderInfo.phone}
                      </li>
                      <li>
                        <strong>Address:</strong> {senderInfo.address}
                      </li>
                      <li>
                        <strong>City:</strong> {senderInfo.city}
                      </li>
                      <li>
                        <strong>State:</strong> {senderInfo.state}
                      </li>
                      <li>
                        <strong>Pin Code:</strong> {senderInfo.pincode}
                      </li>
                    </ul>
                  </Col>

                  {/* Receiver Info */}
                  <Col md={6} className="order-info-col">
                    <h5 className="section-heading">Receiver Information</h5>
                    <ul className="list-unstyled">
                      <li>
                        <strong>Name:</strong> {receiverInfo.name}
                      </li>
                      <li>
                        <strong>Email:</strong> {receiverInfo.email}
                      </li>
                      <li>
                        <strong>Phone:</strong> {receiverInfo.phone}
                      </li>
                      <li>
                        <strong>Address:</strong> {receiverInfo.address}
                      </li>
                      <li>
                        <strong>City:</strong> {receiverInfo.city}
                      </li>
                      <li>
                        <strong>State:</strong> {receiverInfo.state}
                      </li>
                      <li>
                        <strong>Country:</strong> {receiverInfo.country}
                      </li>
                    </ul>
                  </Col>

                  <Col md={12} className="order-info-col">
                    {/* Products Table */}
                    <h5 className="section-heading mt-4">Products</h5>
                    <Table responsive className="order-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Country</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetails.Products.map((product) => (
                          <tr key={product.id}>
                            <td>
                              <img
                                src={product.image}
                                alt={product.title}
                                className="img-fluid"
                              />
                            </td>
                            <td>{product.title}</td>
                            <td>{product.category}</td>
                            <td>{product.description}</td>
                            <td>{product.country}</td>
                            <td>{product.qty}</td>
                            <td>{product.price}</td>
                            <td>{product.cost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={12} className="order-info-col">
                    {/* Summary Section */}
                    <div className="summary-section mt-4 mb-5">
                      <div>
                        <div>
                          Discount: {" "}
                          <span>
                            {orderDetails.promodiscount
                              ? orderDetails.promodiscount
                              : " - "}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <div>
                          Selling Price:{" "}
                          <span>$ {discountedPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          Cost Price: <span>$ {discountedCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Conditionally render Tracking Company and Tracking No */}
                {orderDetails.trackingCompany && orderDetails.trackingNo && (
                  <>
                    <p>
                      <b>Tracking Company:</b> {orderDetails.trackingCompany}
                    </p>
                    <p>
                      <b>Tracking No:</b> {orderDetails.trackingNo}
                    </p>
                  </>
                )}

                {/* Order Status */}
                <FormGroup>
                  <Label>Order Status</Label>
                  <Input
                    type="select"
                    name="orderStatus"
                    id="orderStatus"
                    value={orderStatus}
                    onChange={handleStatusChange}
                  >
                    <option value="Orderd">Orderd</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </Input>
                </FormGroup>

                <hr className="mt-5" />

                {/* Mark Status */}
                <h5 className="section-heading">Admin Info</h5>
                <FormGroup>
                  <Label>Mark Status</Label>
                  <Input
                    id="status"
                    value={markStatus}
                    onChange={handleMarkStatusChange}
                    type="select"
                  >
                    <option value="" selected>
                      Please Select
                    </option>
                    <option value="Succeeded">Succeeded</option>
                    <option value="Attempts">Attempts</option>
                    <option value="Closed">Closed</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Admin Users</Label>
                  <Input
                    id="status"
                    type="select"
                    value={selectedAdminUser}
                    onChange={handleAdminUserChange}
                  >
                    <option value="" disabled selected>
                      Please Select
                    </option>
                    {adminUser.map((user) => (
                      <option key={user.id} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>

                {/* Admin Notes */}
                <FormGroup>
                  <Label>Notes</Label>
                  <Editor
                    apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                    onInit={(evt, editor) => (editorRef.current = editor)}
                    value={notes}
                    // initialValue="<p>Enter Notes</p>"
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
                      ],
                      toolbar:
                        "undo redo | formatselect | " +
                        "bold italic backcolor | alignleft aligncenter " +
                        "alignright alignjustify | bullist numlist outdent indent | " +
                        "removeformat | help",
                      content_style:
                        "body { background: #0f172a; color: #e8f1ff; font-family: Helvetica, Arial, sans-serif; }",
                    }}
                    onEditorChange={handleNotesEditorChange}
                  />
                </FormGroup>

                {/* Updated By Info */}
                {orderDetails.updatedBy && (
                  <div className="d-flex justify-content-end mt-3">
                    <div className="text-right">
                      <p className="mb-1">
                        <strong>Updated By:</strong>
                      </p>
                      <p className="mb-1">{orderDetails.updatedBy}</p>
                    </div>
                  </div>
                )}

                {/* Update Button */}
                <Button
                  color="info"
                  className="btn-round"
                  onClick={handleUpdate}
                  disabled={updateBtnLoading}
                >
                  {updateBtnLoading ? (
                    <>
                      Updating...
                      <Spinner color="secondary" size="sm" className="ml-1" />
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default EditOrder;
