import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Spinner,
  Table,
  Progress,
} from "reactstrap";
import { FaUpload } from "react-icons/fa";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import { Helmet } from "react-helmet";

const API_BASE =
  process.env.REACT_APP_MESOB_API_BASE ||
  "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

const defaultFormState = {
  title: "",
  description: "",
  image: "",
  menuId: "",
  subCategoryId: "",
  sellerPrice: "",
  stockQuantity: "",
  availableQuantity: "",
  shippingLocation: "",
  shippingDescription: "",
  country: "",
};

const statusColorMap = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  deleted: "secondary",
};

const SellerProductManagement = () => {
  const sellerEmail = localStorage.getItem("user_email") || "";
  const sellerName = localStorage.getItem("user_name") || "";

  // Debug: Log component mount
  useEffect(() => {
    console.log("SellerProductManagement component mounted");
  }, []);

  const [formState, setFormState] = useState(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  const [pendingProducts, setPendingProducts] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await axios.get(`${API_BASE}/categories`);
      const items = response.data?.Items || response.data || [];
      const sorted = items.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
      setCategories(sorted);
    } catch (err) {
      console.error("Failed to load categories", err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchSubCategories = useCallback(async (menuId) => {
    if (!menuId) {
      setSubCategories([]);
      return;
    }
    setLoadingSubCategories(true);
    try {
      const response = await axios.get(
        `${API_BASE}/categories/${menuId}/subcategories`
      );
      const items = response.data?.Items || response.data || [];
      const filtered = items.filter((item) => item && item.id);
      const sorted = filtered.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
      setSubCategories(sorted);
    } catch (err) {
      console.error("Failed to load sub categories", err);
      setSubCategories([]);
    } finally {
      setLoadingSubCategories(false);
    }
  }, []);

  const fetchPendingProducts = useCallback(async () => {
    setLoadingPending(true);
    try {
      const response = await axios.get(`${API_BASE}/pending-products`, {
        params: { sellerEmail },
      });
      const items = response.data?.Items || response.data || [];
      // Filter out deleted products
      const filtered = items.filter((item) => {
        const status = item.status || "pending";
        return status !== "deleted";
      });
      const sorted = filtered.sort((a, b) =>
        (b.updatedAt || b.createdAt || "").localeCompare(
          a.updatedAt || a.createdAt || ""
        )
      );
      setPendingProducts(sorted);
    } catch (err) {
      console.error("Failed to load pending products", err);
      setPendingProducts([]);
    } finally {
      setLoadingPending(false);
    }
  }, [sellerEmail]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPendingProducts();
  }, [fetchPendingProducts]);

  useEffect(() => {
    if (formState.menuId) {
      fetchSubCategories(formState.menuId);
    } else {
      setSubCategories([]);
    }
  }, [formState.menuId, fetchSubCategories]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current && typeof fileInputRef.current.click === 'function') {
      fileInputRef.current.click();
    }
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setFeedback({
        type: "danger",
        message: "Please select an image file (PNG, JPG, JPEG, GIF, or WEBP).",
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: "danger",
        message: "Image size should be less than 5MB.",
      });
      return;
    }
    
    setFileName(file.name);
    setUploading(true);
    setUploadProgress(0);
    setFeedback({ type: "", message: "" });

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        
        try {
          setUploadProgress(50);
          
          // Upload to S3 via Lambda
          const response = await axios.post(`${API_BASE}/upload-image`, {
            imageData: base64Data,
            fileName: file.name,
          });

          setUploadProgress(100);
          
          if (response.data?.url) {
            // Update form state with S3 URL
            setFormState((prev) => ({
              ...prev,
              image: response.data.url,
            }));
            setFeedback({
              type: "success",
              message: "Image uploaded successfully!",
            });
            setTimeout(() => {
              setUploadProgress(0);
              setFeedback({ type: "", message: "" });
            }, 2000);
          } else {
            throw new Error("No URL returned from upload");
          }
        } catch (error) {
          console.error("Upload error:", error);
          console.error("Error response:", error.response?.data);
          console.error("Error status:", error.response?.status);
          console.error("Error details:", JSON.stringify(error.response?.data, null, 2));
          
          let errorMessage = "Failed to upload image. Please try again.";
          
          if (error.response?.status === 500) {
            errorMessage = error.response?.data?.message || 
              "Server error. Please check if the upload endpoint is configured correctly in Lambda.";
          } else if (error.response?.status === 404) {
            errorMessage = "Upload endpoint not found. Please add the /upload-image endpoint to your Lambda function.";
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          setFeedback({
            type: "danger",
            message: errorMessage,
          });
          setUploadProgress(0);
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };
      
      reader.onerror = () => {
        setFeedback({
          type: "danger",
          message: "Failed to read image file.",
        });
        setUploading(false);
        setUploadProgress(0);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File processing error:", error);
      setFeedback({
        type: "danger",
        message: "Failed to process image file.",
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.title.trim() || !formState.menuId || !formState.sellerPrice) {
      setFeedback({
        type: "danger",
        message: "Title, Category, and Price are required.",
      });
      return;
    }

    // Validate that image is not a base64 data URL
    if (formState.image && formState.image.trim().startsWith("data:image")) {
      setFeedback({
        type: "danger",
        message: "Base64 images are not supported. Please use an image URL instead (e.g., https://example.com/image.jpg)",
      });
      return;
    }

    setSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        image: formState.image.trim(),
        menuId: formState.menuId,
        menuName:
          categories.find((cat) => String(cat.id) === String(formState.menuId))
            ?.name || "",
        subCategoryId: formState.subCategoryId || "",
        subCategoryName:
          subCategories.find(
            (sub) => String(sub.id) === String(formState.subCategoryId)
          )?.name || "",
        sellerPrice: Number(formState.sellerPrice),
        stockQuantity: formState.stockQuantity,
        availableQuantity: formState.availableQuantity,
        shippingLocation: formState.shippingLocation,
        shippingDescription: formState.shippingDescription,
        country: formState.country,
        sellerEmail,
        sellerName,
      };
      await axios.post(`${API_BASE}/pending-products`, payload);
      setFeedback({
        type: "success",
        message: "Product submitted for approval.",
      });
      resetForm();
      fetchPendingProducts();
    } catch (err) {
      console.error("Failed to submit product", err);
      setFeedback({
        type: "danger",
        message:
          err.response?.data?.message ||
          "Could not submit product. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status) => {
    const normalizedStatus = status || "pending";
    const displayStatus = normalizedStatus === "deleted" ? "deleted by admin" : normalizedStatus;
    return (
      <Badge color={statusColorMap[normalizedStatus] || "secondary"} className="text-uppercase">
        {displayStatus}
      </Badge>
    );
  };

  const hasPendingProducts = useMemo(
    () => (pendingProducts || []).length > 0,
    [pendingProducts]
  );

  return (
    <>
      <Helmet>
        <title>Product Management - Seller</title>
      </Helmet>
      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Product Management</h2>
            <p className="category">
              Submit products for review. Approved products will appear in the
              main catalog.
            </p>
          </div>
        }
      />
      <div className="content">
        <Row>
          <Col lg={7}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">Seller / Staff</h5>
                <small className="text-muted">
                  Provide product information below. The price you set will be
                  treated as the cost for admin review.
                </small>
              </CardHeader>
              <CardBody>
                {feedback.message && (
                  <div
                    className={`alert alert-${feedback.type}`}
                    role="alert"
                  >
                    {feedback.message}
                  </div>
                )}
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={12}>
                      <h6 className="text-muted text-uppercase mb-3">
                        Product Information
                      </h6>
                    </Col>
                    <Col md={6}>
                      <FormGroup style={{ marginBottom: "0" }}>
                        <Label for="title">Product Name *</Label>
                        <Input
                          id="title"
                          name="title"
                          value={formState.title}
                          onChange={handleInputChange}
                          placeholder="Enter product name"
                          required
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="image">Product Image</Label>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            disabled={uploading}
                            style={{ 
                              flex: 1,
                              padding: "0.375rem 0.75rem",
                              fontSize: "0.875rem",
                              lineHeight: "1.5",
                              color: "#495057",
                              backgroundColor: "#fff",
                              border: "1px solid #ced4da",
                              borderRadius: "0.25rem"
                            }}
                          />
                          <Button
                            type="button"
                            color="primary"
                            size="sm"
                            onClick={handleFileButtonClick}
                            disabled={uploading}
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "0.25rem",
                              whiteSpace: "nowrap",
                              minWidth: "80px"
                            }}
                          >
                            <FaUpload size={12} />
                            {uploading ? "Uploading..." : "Upload"}
                          </Button>
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="mt-2 mb-2">
                            <Progress value={uploadProgress} color="success" />
                            <small className="text-muted">Uploading... {uploadProgress}%</small>
                          </div>
                        )}
                        <small className="text-muted">
                          Upload an image file (PNG, JPG, JPEG, GIF, WEBP - max 5MB)
                        </small>
                        {formState.image && (
                          <div className="mt-2" style={{ textAlign: "center" }}>
                            <img
                              src={formState.image}
                              alt="Preview"
                              style={{
                                maxWidth: "200px",
                                maxHeight: "200px",
                                borderRadius: "8px",
                                border: "1px solid #dee2e6",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </FormGroup>
                    </Col>
                    <Col md={12}>
                      <FormGroup>
                        <Label for="description">Description</Label>
                        <Input style={{ border: "1px solid #e0e0e0", borderRadius: "8px" }}
                          id="description"
                          name="description"
                          type="textarea"
                          rows="3"
                          value={formState.description}
                          onChange={handleInputChange}
                          placeholder="Enter product description"
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={12}>
                      <h6 className="text-muted text-uppercase mb-3">
                        Price &amp; Stock
                      </h6>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label for="sellerPrice">Price (Cost) *</Label>
                        <Input
                          id="sellerPrice"
                          name="sellerPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formState.sellerPrice}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          required
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label for="stockQuantity">Stock Quantity</Label>
                        <Input
                          id="stockQuantity"
                          name="stockQuantity"
                          type="number"
                          min="0"
                          value={formState.stockQuantity}
                          onChange={handleInputChange}
                          placeholder="0"
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label for="availableQuantity">Available Quantity</Label>
                        <Input
                          id="availableQuantity"
                          name="availableQuantity"
                          type="number"
                          min="0"
                          value={formState.availableQuantity}
                          onChange={handleInputChange}
                          placeholder="0"
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={12}>
                      <h6 className="text-muted text-uppercase mb-3">
                        Seller Information
                      </h6>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Seller Email</Label>
                        <Input value={sellerEmail} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Seller Name</Label>
                        <Input value={sellerName} disabled />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={12}>
                      <h6 className="text-muted text-uppercase mb-3">
                        Shipping Information
                      </h6>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="shippingLocation">Shipping Location</Label>
                        <Input
                          id="shippingLocation"
                          name="shippingLocation"
                          value={formState.shippingLocation}
                          onChange={handleInputChange}
                          placeholder="Enter shipping location"
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formState.country}
                          onChange={handleInputChange}
                          placeholder="Country of origin or shipping"
                        />
                      </FormGroup>
                    </Col>
                    <Col md={12}>
                      <FormGroup>
                        <Label for="shippingDescription">
                          Shipping Description
                        </Label>
                        <Input
                          id="shippingDescription"
                          name="shippingDescription"
                          type="textarea"
                          rows="2"
                          value={formState.shippingDescription}
                          onChange={handleInputChange}
                          placeholder="Enter shipping details"
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={12}>
                      <h6 className="text-muted text-uppercase mb-3">
                        Category Selection
                      </h6>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="menuId">Category/Country *</Label>
                        <Input
                          type="select"
                          id="menuId"
                          name="menuId"
                          value={formState.menuId}
                          onChange={handleInputChange}
                          required
                          disabled={loadingCategories}
                        >
                          <option value="">
                            {loadingCategories
                              ? "Loading categories..."
                              : "Select category"}
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={String(category.id)}>
                              {category.name || category.id}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="subCategoryId">Subcategory</Label>
                        <Input
                          type="select"
                          id="subCategoryId"
                          name="subCategoryId"
                          value={formState.subCategoryId}
                          onChange={handleInputChange}
                          disabled={
                            !formState.menuId || loadingSubCategories
                          }
                        >
                          <option value="">
                            {formState.menuId
                              ? loadingSubCategories
                                ? "Loading subcategories..."
                                : "Select subcategory"
                              : "Select a category first"}
                          </option>
                          {subCategories.map((sub) => (
                            <option key={sub.id} value={String(sub.id)}>
                              {sub.name || sub.id}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end mt-4">
                    <Button
                      color="secondary"
                      type="button"
                      onClick={resetForm}
                      disabled={saving}
                      className="mr-2"
                    >
                      Reset
                    </Button>
                    <Button color="primary" type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Spinner size="sm" className="mr-2" /> Saving...
                        </>
                      ) : (
                        "Save Product"
                      )}
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
          <Col lg={5}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">Product Approval Status</h5>
                <small className="text-muted">
                  Track the review status of your submissions. Approved products
                  will appear in the main catalog.
                </small>
              </CardHeader>
              <CardBody>
                {loadingPending ? (
                  <div className="text-center py-4">
                    <Spinner color="primary" />
                    <p className="mt-2 mb-0">Loading pending products...</p>
                  </div>
                ) : hasPendingProducts ? (
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Status</th>
                          <th>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingProducts.map((pending) => (
                          <tr key={pending.id}>
                            <td>
                              <strong>{pending.title}</strong>
                              <br />
                              <small className="text-muted">
                                ${pending.sellerPrice ?? 0} cost
                              </small>
                              {(pending.status || "pending") === "deleted" && (
                                <div className="text-warning small mt-1 font-weight-bold">
                                  ⚠️ Product deleted by admin
                                </div>
                              )}
                              {pending.rejectionReason && (
                                <div className="text-danger small mt-1">
                                  Rejection reason: {pending.rejectionReason}
                                </div>
                              )}
                            </td>
                            <td>{statusBadge(pending.status || "pending")}</td>
                            <td>
                              <small className="text-muted">
                                {pending.updatedAt
                                  ? new Date(pending.updatedAt).toLocaleString()
                                  : pending.createdAt
                                  ? new Date(
                                      pending.createdAt
                                    ).toLocaleString()
                                  : "-"}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    No submissions yet. Use the form to add your first product.
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SellerProductManagement;

