import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Row,
  Spinner,
  Table,
  Badge,
} from "reactstrap";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";

const API_BASE =
  process.env.REACT_APP_MESOB_API_BASE ||
  "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

const SellerOrders = () => {
  const sellerEmail = localStorage.getItem("user_email") || "";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sellerEmail) {
      setLoading(false);
      return;
    }

    fetchOrders();
  }, [sellerEmail]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/seller/orders?sellerEmail=${encodeURIComponent(sellerEmail)}`
      );
      
      // Handle different response formats
      let items = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data?.Items && Array.isArray(response.data.Items)) {
        items = response.data.Items;
      } else if (response.data && typeof response.data === 'object') {
        // Try to parse if it's a JSON string
        try {
          const parsed = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          items = Array.isArray(parsed) ? parsed : (parsed.Items || []);
        } catch {
          items = [];
        }
      }
      
      console.log("Fetched orders:", items.length);
      setOrders(items);
    } catch (err) {
      console.error("Failed to load orders", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error message:", err.response?.data?.message || err.message);
      setOrders([]);
      
      // Show user-friendly error message
      if (err.response?.status === 400) {
        alert(
          `Error: ${err.response?.data?.message || "Bad Request. Please check:\n1. Lambda function has GET /seller/orders case\n2. API Gateway has /seller/orders endpoint\n3. Both are deployed"}`
        );
      } else if (err.response?.status >= 500) {
        alert("Server error. Please try again later or contact support.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "success";
      case "Shipped":
        return "info";
      case "Ordered":
        return "warning";
      default:
        return "secondary";
    }
  };

  const calculateOrderTotal = (order) => {
    if (!order.Products || !Array.isArray(order.Products)) return 0;
    const normalizedEmail = sellerEmail.toLowerCase();
    
    // Helper function to check if seller email matches (handles comma-separated)
    const emailMatches = (productSellerEmail) => {
      if (!productSellerEmail) return false;
      const emailString = String(productSellerEmail).trim();
      if (!emailString) return false;
      const emailList = emailString
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(email => email.length > 0);
      return emailList.includes(normalizedEmail);
    };
    
    // Only calculate total for seller's products using cost (not price)
    return order.Products.reduce((total, product) => {
      const productSellerEmail = 
        product.selleremail || 
        product.sellerEmail || 
        product.seller_email ||
        "";
      
      // Only include this product if it belongs to the seller
      if (!emailMatches(productSellerEmail)) {
        return total;
      }
      
      // Use cost instead of price for sellers
      const costStr = product.cost || product.content?.cost || "0";
      const cost = parseFloat(String(costStr).replace(/[$,]/g, ""));
      const qty = product.qty || product.quantity || 1;
      return total + cost * qty;
    }, 0);
  };

  const getSellerProductsCount = (order) => {
    if (!order.Products || !Array.isArray(order.Products)) return 0;
    const normalizedEmail = sellerEmail.toLowerCase();
    
    // Helper function to check if seller email matches (handles comma-separated)
    const emailMatches = (productSellerEmail) => {
      if (!productSellerEmail) return false;
      
      const emailString = String(productSellerEmail).trim();
      if (!emailString) return false;
      
      // Split by comma and check each email
      const emailList = emailString
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(email => email.length > 0);
      
      return emailList.includes(normalizedEmail);
    };
    
    return order.Products.filter((product) => {
      // Try multiple field name variations
      const productSellerEmail = 
        product.selleremail || 
        product.sellerEmail || 
        product.seller_email ||
        "";
      
      return emailMatches(productSellerEmail);
    }).length;
  };

  return (
    <>
      <Helmet>
        <title>My Orders - Seller</title>
      </Helmet>
      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">My Orders</h2>
            <p className="category">
              Orders containing products you added. Only your products are shown.
            </p>
          </div>
        }
      />
      <div className="content">
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <h4 className="card-title">Orders with My Products</h4>
                <p className="card-category">
                  Total: {orders.length} order{orders.length !== 1 ? "s" : ""}
                </p>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner color="primary" />
                    <p className="mt-2">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">
                      No orders found. Orders will appear here when customers
                      purchase your products.
                    </p>
                  </div>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>My Products</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const sellerProductsCount = getSellerProductsCount(order);
                        const orderTotal = calculateOrderTotal(order);
                        return (
                          <tr key={order.id}>
                            <td>
                              <code>{order.id}</code>
                            </td>
                            <td>
                              {order.name || order.userID || "N/A"}
                              {order.phone && (
                                <div>
                                  <small className="text-muted">
                                    {order.phone}
                                  </small>
                                </div>
                              )}
                            </td>
                            <td>
                              <Badge color={getStatusColor(order.Status)}>
                                {order.Status || "N/A"}
                              </Badge>
                            </td>
                            <td>
                              <Badge color="primary">
                                {sellerProductsCount} product
                                {sellerProductsCount !== 1 ? "s" : ""}
                              </Badge>
                            </td>
                            <td>
                              <strong>
                                ${orderTotal.toFixed(2)}
                              </strong>
                            </td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() =>
                                  navigate(`/seller/order/details/${order.id}`)
                                }
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SellerOrders;

