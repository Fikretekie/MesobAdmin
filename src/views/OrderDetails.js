import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Table,
  Spinner,
  Button,
} from "reactstrap";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import axios from "axios";
import { Helmet } from "react-helmet";
import "../assets/css/OrderDetails.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if this is seller view
  const isSellerView = useMemo(() => {
    return location.pathname.startsWith("/seller");
  }, [location.pathname]);
  
  const sellerEmail = useMemo(() => {
    return isSellerView ? localStorage.getItem("user_email") || "" : "";
  }, [isSellerView]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [discountedCost, setDiscountedCost] = useState(0);

  useEffect(() => {
    // Fetch order details by ID
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(
          `https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/items/${id}`
        );
        const itemData = response.data.Item;
        setOrderDetails(itemData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  // Filter products for seller view (only show seller's products)
  const displayProducts = useMemo(() => {
    if (!orderDetails?.Products) return [];
    if (!isSellerView) return orderDetails.Products;
    
    const normalizedEmail = sellerEmail.toLowerCase();
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
    
    return orderDetails.Products.filter((product) => {
      const productSellerEmail = 
        product.selleremail || 
        product.sellerEmail || 
        product.seller_email ||
        "";
      return emailMatches(productSellerEmail);
    });
  }, [orderDetails, isSellerView, sellerEmail]);
  
  // Calculate totals for seller view (only seller's products)
  const sellerTotals = useMemo(() => {
    if (!isSellerView || !displayProducts.length || !orderDetails) {
      return { totalCost: 0, discountedCost: 0 };	Price
    }
    
    let total_cost = 0;
    const promo_discount = orderDetails?.promodiscount || 0;
    
    displayProducts.forEach((product) => {
      const costStr = product.cost || product.content?.cost || "0";
      const cost = parseFloat(String(costStr).replace(/[\$,]/g, ""));
      const quantity = product.qty ?? product.quantity ?? 1;
      total_cost += quantity * cost;
    });
    
    const discounted_cost = promo_discount ? total_cost - promo_discount : total_cost;
    
    return { totalCost: total_cost, discountedCost: discounted_cost };
  }, [displayProducts, isSellerView, orderDetails]);
  
  // Calculate totals
  useEffect(() => {
    if (!orderDetails) return;
    
    let total_price = 0;
    let total_cost = 0;
    const promo_discount = orderDetails.promodiscount || 0;

    const productsToCalculate = isSellerView ? displayProducts : (orderDetails.Products || []);
    
    productsToCalculate.forEach((product) => {
      // Remove $ and comma from price and cost
      const priceStr = product.price || product.content?.price || "0";
      const costStr = product.cost || product.content?.cost || "0";
      const price = parseFloat(String(priceStr).replace(/[\$,]/g, ""));
      const cost = parseFloat(String(costStr).replace(/[\$,]/g, ""));
      const quantity = product.qty ?? product.quantity ?? 1;

      // Calculate totals
      total_price += quantity * price;
      total_cost += quantity * cost;
    });

    // Apply promo discount if available
    const discounted_price = promo_discount
      ? total_price - promo_discount
      : total_price;
    const discounted_cost = promo_discount
      ? total_cost - promo_discount
      : total_cost;

    setTotalPrice(total_price);
    setTotalCost(total_cost);
    setDiscountedPrice(discounted_price);
    setDiscountedCost(discounted_cost);
  }, [orderDetails, displayProducts, isSellerView]);

  // Early return AFTER all hooks
  if (loading || !orderDetails) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spinner color="primary" />
        <p>Loading order details...</p>
      </div>
    );
  }

  const senderInfo = JSON.parse(orderDetails.senderAddress || "{}");
  const receiverInfo = {
    name: orderDetails.name,
    email: orderDetails.useremail,
    phone: orderDetails.phone,
    address: orderDetails.address,
    city: orderDetails.city,
    state: orderDetails.state,
    country: orderDetails.country,
  };
  
  const promo_discount = orderDetails.promodiscount || 0;

  return (
    <>
      <Helmet>
        <title>Order Details - Mesob Store</title>
      </Helmet>

      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Order Details</h2>
          </div>
        }
      />
      <div className="content">
        <Row>
          <Col xs={12}>
            <Card className="order-card">
              <CardHeader className="order-header">
                <div className="d-flex align-items-center">
                  <Button
                    className="btn btn-link"
                    onClick={() => navigate(isSellerView ? "/seller/seller-orders" : "/admin/orders")}
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
                        <strong>Name:</strong> {senderInfo.name || "N/A"}
                      </li>
                      {!isSellerView && (
                        <>
                          <li>
                            <strong>Email:</strong> {senderInfo.email || "N/A"}
                          </li>
                          <li>
                            <strong>Phone:</strong> {senderInfo.phone || "N/A"}
                          </li>
                          <li>
                            <strong>Address:</strong> {senderInfo.address || "N/A"}
                          </li>
                          <li>
                            <strong>City:</strong> {senderInfo.city || "N/A"}
                          </li>
                          <li>
                            <strong>State:</strong> {senderInfo.state || "N/A"}
                          </li>
                          <li>
                            <strong>Pin Code:</strong> {senderInfo.pincode || "N/A"}
                          </li>
                        </>
                      )}
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
                </Row>

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
                      {!isSellerView && <th>Price</th>}
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayProducts.map((product, index) => (
                      <tr key={product.id || index}>
                        <td>
                          <img
                            src={product.image || product.content?.image || ""}
                            alt={product.title || product.content?.title || "Product"}
                            className="img-fluid"
                            style={{ maxWidth: "80px", maxHeight: "80px", objectFit: "cover" }}
                          />
                        </td>
                        <td>{product.title || product.content?.title || product.name || "N/A"}</td>
                        <td>{product.category || "N/A"}</td>
                        <td>{product.description || product.content?.description || "N/A"}</td>
                        <td>{product.country || product.content?.country || "N/A"}</td>
                        <td>{product.qty || product.quantity || 1}</td>
                        {!isSellerView && <td>{product.price || "N/A"}</td>}
                        <td>{product.cost || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Summary Section */}
                <div className="summary-section mt-4">
                  <div>
                    <div>
                      Discount:
                      <span>{promo_discount ? promo_discount : " - "}</span>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between">
                    {!isSellerView && (
                      <div>
                        Selling Price: <span>$ {discountedPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div>
                      {isSellerView ? "Total Price" : "Cost Price"}: <span>$ {isSellerView ? sellerTotals.discountedCost.toFixed(2) : discountedCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default OrderDetails;
