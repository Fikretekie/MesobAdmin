import React, { useState, useRef } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Spinner,
  Progress,
} from "reactstrap";
import { FaUpload } from "react-icons/fa";
import axios from "axios";

const API_BASE =
  process.env.REACT_APP_MESOB_API_BASE ||
  "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

const SubCategoryFormModal = ({
  isOpen,
  toggle,
  isEditMode,
  formState,
  handleInputChange,
  handleSubmit,
  saving,
  categories,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const fileInputRef = useRef(null);

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
            handleInputChange({
              target: { name: "icon", value: s3Url, type: "text" },
            });
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

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>
        {isEditMode ? "Edit Subcategory" : "Add New Subcategory"}
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <FormGroup>
            <Label for="categoryId">Category *</Label>
            <Input
              type="select"
              id="categoryId"
              name="categoryId"
              value={formState.categoryId || ""}
              onChange={handleInputChange}
              required
              disabled={isEditMode}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name || `Category ${category.id}`}
                </option>
              ))}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="name">Subcategory Name *</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formState.name || ""}
              onChange={handleInputChange}
              placeholder="Enter subcategory name"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="des">Description</Label>
            <Input
              type="textarea"
              id="des"
              name="des"
              value={formState.des || ""}
              onChange={handleInputChange}
              placeholder="Enter subcategory description"
              rows={3}
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
                  color: "#dbe7ff",
                  backgroundColor: "#0f172a",
                  border: "1px solid rgba(125, 145, 180, 0.18)",
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
                    border: "1px solid rgba(125, 145, 180, 0.18)",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="sellerEmail">Seller Email</Label>
            <Input
              type="text"
              id="sellerEmail"
              name="sellerEmail"
              value={formState.sellerEmail || ""}
              onChange={handleInputChange}
              placeholder="seller@example.com, seller2@example.com"
            />
            <small className="text-muted">
              Enter one or more email addresses separated by commas
            </small>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggle} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" color="primary" disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : isEditMode ? (
              "Update Subcategory"
            ) : (
              "Create Subcategory"
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default SubCategoryFormModal;

