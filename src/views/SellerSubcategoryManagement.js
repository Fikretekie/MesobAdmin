import React, { useCallback, useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  Row,
  Spinner,
  Table,
} from "reactstrap";
import { FaUpload, FaEdit } from "react-icons/fa";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import { Helmet } from "react-helmet";

const API_BASE =
  process.env.REACT_APP_MESOB_API_BASE ||
  "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

const SellerSubcategoryManagement = () => {
  const sellerEmail = localStorage.getItem("user_email") || "";

  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [formState, setFormState] = useState({ des: "", icon: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const fileInputRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories`);
      const items = response.data?.Items || response.data || [];
      setCategories(items);
    } catch (err) {
      console.error("Failed to load categories", err);
      setCategories([]);
    }
  }, []);

  const fetchSubcategories = useCallback(async (showLoading = true) => {
    if (!sellerEmail) {
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    try {
      const response = await axios.get(
        `${API_BASE}/seller/subcategories?sellerEmail=${encodeURIComponent(sellerEmail)}`
      );
      // Handle different response formats
      let items = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data?.Items) {
        items = response.data.Items;
      } else if (response.data?.body) {
        // If body is a string, parse it
        const parsed = typeof response.data.body === 'string' 
          ? JSON.parse(response.data.body) 
          : response.data.body;
        items = Array.isArray(parsed) ? parsed : (parsed?.Items || []);
      }
      
      console.log("Fetched subcategories:", items);
      // Create completely new objects to force React re-render
      const newItems = items.map(item => ({ ...item }));
      console.log("Setting subcategories to:", newItems);
      setSubcategories(newItems);
      // Force component re-render by updating refresh key
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Failed to load subcategories", err);
      setSubcategories([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [sellerEmail]);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, [fetchCategories, fetchSubcategories]);

  const handleFileButtonClick = () => {
    if (fileInputRef.current && typeof fileInputRef.current.click === 'function') {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (PNG, JPG, JPEG, GIF, or WEBP).");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size should be less than 5MB.");
      return;
    }

    setUploadError("");
    setUploading(true);
    setUploadProgress(0);

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
          
          // Handle both direct response and stringified response
          let responseData = response.data;
          if (typeof responseData === 'string') {
            try {
              responseData = JSON.parse(responseData);
            } catch (e) {
              console.error('Failed to parse response as JSON:', e);
            }
          }
          
          if (responseData?.url) {
            // Update form state with S3 URL
            const s3Url = responseData.url;
            setUploadedImageUrl(s3Url);
            setFormState(prev => ({ ...prev, icon: s3Url }));
            setTimeout(() => setUploadProgress(0), 1000);
          } else {
            throw new Error("No URL returned from upload");
          }
        } catch (error) {
          console.error("Upload error:", error);
          
          let errorMessage = "Failed to upload image. Please try again.";
          
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          setUploadError(errorMessage);
          setUploadProgress(0);
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };
      
      reader.onerror = () => {
        setUploadError("Failed to read image file.");
        setUploading(false);
        setUploadProgress(0);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File processing error:", error);
      setUploadError("Failed to process image file.");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (subcategory) => {
    setEditingSubcategory(subcategory);
    setFormState({
      des: subcategory.des || "",
      icon: subcategory.icon || "",
    });
    setUploadedImageUrl("");
    setUploadError("");
    setEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingSubcategory) return;

    setSaving(true);
    try {
      // Find the category ID from Menu_id
      const categoryId = Array.isArray(editingSubcategory.Menu_id) 
        ? editingSubcategory.Menu_id[0] 
        : editingSubcategory.Menu_id;

      const response = await axios.put(
        `${API_BASE}/seller/categories/${categoryId}/subcategories/${editingSubcategory.id}`,
        {
          des: formState.des?.trim() || "",
          icon: formState.icon?.trim() || "",
        },
        {
          params: {
            sellerEmail: sellerEmail,
          },
        }
      );

      console.log("Update response:", response.data);
      
      // Parse response data
      let updatedData = response.data;
      if (typeof updatedData === 'string') {
        try {
          updatedData = JSON.parse(updatedData);
        } catch (e) {
          console.error("Failed to parse response:", e);
        }
      }
      
      // Update local state FIRST with the response - create completely new objects
      if (updatedData && editingSubcategory) {
        const subcategoryId = editingSubcategory.id;
        setSubcategories(prev => {
          const updated = prev.map(sub => {
            if (sub.id === subcategoryId) {
              // Create a completely new object to force React re-render
              const newSub = {
                ...sub,
                des: updatedData.des !== undefined ? String(updatedData.des) : sub.des,
                icon: updatedData.icon !== undefined ? String(updatedData.icon) : sub.icon
              };
              console.log(`Updating subcategory ${subcategoryId}:`, {
                old: sub.des,
                new: newSub.des
              });
              return newSub;
            }
            return { ...sub }; // Create new object for all items
          });
          console.log("Updated subcategories state:", updated);
          // Create a completely new array reference
          return [...updated];
        });
        // Force re-render immediately with timestamp
        setRefreshKey(Date.now());
      }
      
      // Close modal and reset form after state update
      handleCloseModal();
      
      // Refetch to get the latest data from server (without loading spinner)
      // Use a small delay to ensure state update completes
      setTimeout(async () => {
        await fetchSubcategories(false);
      }, 200);
    } catch (err) {
      console.error("Failed to update subcategory", err);
      alert(
        err.response?.data?.message ||
        "Failed to update subcategory. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setEditingSubcategory(null);
    setFormState({ des: "", icon: "" });
    setUploadedImageUrl("");
    setUploadError("");
  };

  // Get category name helper
  const getCategoryName = (subcategory) => {
    if (!subcategory.Menu_id) return "N/A";
    
    const categoryId = Array.isArray(subcategory.Menu_id) 
      ? String(subcategory.Menu_id[0]) 
      : String(subcategory.Menu_id);
    
    const category = categories.find(cat => String(cat.id) === categoryId);
    return category ? category.name : `Category ${categoryId}`;
  };

  return (
    <>
      <Helmet>
        <title>Subcategory Management - Seller</title>
      </Helmet>
      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Subcategory Management</h2>
            <p className="category">
              Manage subcategories assigned to your seller account. You can update description and icon only.
            </p>
          </div>
        }
      />
      <div className="content">
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <h4 className="card-title">My Subcategories</h4>
                <p className="card-category">
                  Subcategories where your email ({sellerEmail}) is listed as a seller
                </p>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner color="primary" />
                    <p className="mt-2">Loading subcategories...</p>
                  </div>
                ) : subcategories.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">
                      No subcategories found. Contact admin to be assigned to subcategories.
                    </p>
                  </div>
                ) : (
                  <div key={`table-container-${refreshKey}-${subcategories.length}`} style={{ minHeight: '200px' }}>
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Icon</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subcategories.map((subcategory, index) => {
                          const desc = subcategory.des || '';
                          const descHash = desc.substring(0, 20).replace(/\s/g, ''); // Use first 20 chars as hash
                          const displayDesc = desc.length > 50
                            ? `${desc.substring(0, 50)}...`
                            : desc;
                          
                          return (
                            <tr key={`row-${subcategory.id}-${refreshKey}-${descHash}`}>
                              <td>{subcategory.id}</td>
                              <td>{subcategory.name || "N/A"}</td>
                              <td>{getCategoryName(subcategory)}</td>
                              <td>
                                {desc ? (
                                  <span title={desc} key={`desc-span-${subcategory.id}-${descHash}`}>
                                    {displayDesc}
                                  </span>
                                ) : (
                                  <span className="text-muted">No description</span>
                                )}
                              </td>
                          <td>
                            {subcategory.icon ? (
                              <img
                                src={subcategory.icon}
                                alt="Icon"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-muted">No icon</span>
                            )}
                          </td>
                          <td>
                            <Button
                              color="primary"
                              size="sm"
                              onClick={() => handleEdit(subcategory)}
                            >
                              <FaEdit /> Edit
                            </Button>
                          </td>
                        </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} toggle={handleCloseModal} size="lg">
        <ModalHeader toggle={handleCloseModal}>
          Edit Subcategory: {editingSubcategory?.name}
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label>Subcategory Name</Label>
              <Input
                type="text"
                value={editingSubcategory?.name || ""}
                disabled
                style={{ backgroundColor: "#f5f5f5" }}
              />
              <small className="text-muted">Name cannot be changed</small>
            </FormGroup>

            <FormGroup>
              <Label for="des">Description</Label>
              <Input
                type="textarea"
                id="des"
                name="des"
                value={formState.des}
                onChange={handleInputChange}
                placeholder="Enter subcategory description"
                rows={4}
              />
            </FormGroup>

            <FormGroup>
              <Label for="icon">Subcategory Icon</Label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
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
                <div className="mt-2">
                  <Progress value={uploadProgress} color="success" />
                  <small className="text-muted">Uploading... {uploadProgress}%</small>
                </div>
              )}
              {uploadError && (
                <div className="mt-2">
                  <small className="text-danger">{uploadError}</small>
                </div>
              )}
              {uploadedImageUrl && (
                <div className="mt-2">
                  <small className="text-success">✓ Image uploaded successfully</small>
                </div>
              )}
              <small className="text-muted">
                Upload an image file (PNG, JPG, JPEG, GIF, WEBP - max 5MB)
              </small>
              {(formState.icon || uploadedImageUrl) && (
                <div className="mt-2" style={{ textAlign: "center" }}>
                  <img
                    src={formState.icon || uploadedImageUrl}
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
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={handleCloseModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={saving}>
              {saving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                "Update Subcategory"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </>
  );
};

export default SellerSubcategoryManagement;

