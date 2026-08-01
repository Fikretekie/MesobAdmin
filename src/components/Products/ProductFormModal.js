// import React, { useState, useRef } from "react";
// import {
//   Modal,
//   ModalBody,
//   ModalFooter,
//   ModalHeader,
//   Form,
//   FormGroup,
//   Label,
//   Input,
//   Button,
//   Row,
//   Col,
//   Card,
//   CardBody,
//   CardTitle,
//   Spinner,
//   Progress,
// } from "reactstrap";
// import {
//   FaDatabase,
//   FaDotCircle,
//   FaExternalLinkAlt,
//   FaUpload,
//   FaImage,
// } from "react-icons/fa";
// import axios from "axios";

// const API_BASE =
//   process.env.REACT_APP_MESOB_API_BASE ||
//   "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

// const ProductFormModal = ({
//   isOpen,
//   toggle,
//   isEditMode,
//   formState,
//   handleInputChange,
//   handleCategorySelect,
//   handleSubCategorySelect,
//   handleSubmit,
//   saving,
//   categories,
//   subCategories,
//   loadingCategories,
//   loadingSubCategories,
// }) => {
//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [uploadError, setUploadError] = useState("");
//   const [uploadedImageUrl, setUploadedImageUrl] = useState("");
//   const fileInputRef = useRef(null);
//   const cardHeaderStyle = {
//     display: "flex",
//     alignItems: "flex-start",
//     gap: "0.5rem",
//     marginBottom: "1rem",
//     paddingBottom: "0.75rem",
//     borderBottom: "1px solid #e9ecef",
//   };

//   const cardTitleStyle = {
//     fontSize: "1rem",
//     fontWeight: 600,
//     margin: 0,
//     color: "#2d2d6f",
//   };

//   const cardSubtitleStyle = {
//     fontSize: "0.875rem",
//     color: "#8898aa",
//     margin: 0,
//     marginTop: "0.25rem",
//   };

//   const iconStyle = {
//     color: "#5e72e4",
//     fontSize: "1rem",
//   };

//   const cardStyle = {
//     marginBottom: "1.5rem",
//     border: "1px solid #e7eaf0",
//     borderRadius: "18px",
//     boxShadow: "0 12px 24px rgba(50, 50, 93, 0.08)",
//   };

//   const handleFileButtonClick = () => {
//     if (fileInputRef.current && typeof fileInputRef.current.click === 'function') {
//       fileInputRef.current.click();
//     }
//   };

//   const handleFileChange = async (event) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     // Validate file type
//     if (!file.type.startsWith("image/")) {
//       setUploadError("Please select an image file (PNG, JPG, JPEG, GIF, or WEBP).");
//       return;
//     }

//     // Validate file size (max 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       setUploadError("Image size should be less than 5MB.");
//       return;
//     }

//     setUploadError("");
//     setUploading(true);
//     setUploadProgress(0);

//     try {
//       // Convert file to base64
//       const reader = new FileReader();
//       reader.onload = async (e) => {
//         const base64Data = e.target.result;
        
//         try {
//           setUploadProgress(50);
          
//           // Upload to S3 via Lambda
//           console.log('Sending upload request to:', `${API_BASE}/upload-image`);
//           console.log('File name:', file.name);
//           console.log('Base64 data length:', base64Data.length);
          
//           const response = await axios.post(`${API_BASE}/upload-image`, {
//             imageData: base64Data,
//             fileName: file.name,
//           });

//           console.log('Upload response:', response);
//           console.log('Response data:', response.data);

//           setUploadProgress(100);
          
//           // Handle both direct response and stringified response
//           let responseData = response.data;
//           if (typeof responseData === 'string') {
//             try {
//               responseData = JSON.parse(responseData);
//             } catch (e) {
//               console.error('Failed to parse response as JSON:', e);
//             }
//           }
          
//           if (responseData?.url) {
//             // Update form state with S3 URL
//             const s3Url = responseData.url;
//             console.log('Upload successful, S3 URL:', s3Url);
//             setUploadedImageUrl(s3Url);
//             handleInputChange({
//               target: { name: "image", value: s3Url, type: "text" },
//             });
//             setTimeout(() => setUploadProgress(0), 1000);
//           } else {
//             console.error('No URL in response:', responseData);
//             throw new Error("No URL returned from upload");
//           }
//         } catch (error) {
//           console.error("Upload error:", error);
//           console.error("Error response:", error.response?.data);
//           console.error("Error status:", error.response?.status);
//           console.error("Error details:", JSON.stringify(error.response?.data, null, 2));
          
//           let errorMessage = "Failed to upload image. Please try again.";
          
//           if (error.response?.status === 500) {
//             errorMessage = "Server error. Please check if the upload endpoint is configured correctly in Lambda.";
//           } else if (error.response?.status === 404) {
//             errorMessage = "Upload endpoint not found. Please add the /upload-image endpoint to your Lambda function.";
//           } else if (error.response?.data?.message) {
//             errorMessage = error.response.data.message;
//           } else if (error.message) {
//             errorMessage = error.message;
//           }
          
//           setUploadError(errorMessage);
//           setUploadProgress(0);
//         } finally {
//           setUploading(false);
//           if (fileInputRef.current) {
//             fileInputRef.current.value = "";
//           }
//         }
//       };
      
//       reader.onerror = () => {
//         setUploadError("Failed to read image file.");
//         setUploading(false);
//         setUploadProgress(0);
//       };
      
//       reader.readAsDataURL(file);
//     } catch (error) {
//       console.error("File processing error:", error);
//       setUploadError("Failed to process image file.");
//       setUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   const handleImageChange = (event) => {
//     const value = event.target.value.trim();
//     // Allow manual URL entry
//     handleInputChange(event);
//   };

//   const handlePreviewClick = () => {
//     if (!formState.image) return;
//     if (typeof window !== "undefined") {
//       window.open(formState.image, "_blank", "noopener,noreferrer");
//     }
//   };

//   return (
//     <Modal
//       isOpen={isOpen}
//       toggle={toggle}
//       size="lg"
//       backdrop="static"
//       style={{ maxWidth: "900px" }}
//     >
//       <Form onSubmit={handleSubmit}>
//         <ModalHeader toggle={toggle}>
//           {isEditMode ? "Edit Product" : "Add Product"}
//         </ModalHeader>
//         <ModalBody style={{ padding: "1.5rem", background: "#f5f7fb" }}>
//           <Row>
//             {/* Product Information Card */}
//             <Col md={6} className="d-flex">
//               <Card style={{ ...cardStyle, width: "100%" }}>
//                 <CardBody>
//                   <div style={cardHeaderStyle}>
//                     <FaDotCircle style={iconStyle} />
//                     <div>
//                       <CardTitle tag="h6" style={cardTitleStyle}>
//                         Product Information
//                       </CardTitle>
//                       <p style={cardSubtitleStyle}>Enter basic product details</p>
//                     </div>
//                   </div>
//                   <FormGroup>
//                     <Label for="title">Product Name *</Label>
//                     <Input
//                       id="title"
//                       name="title"
//                       value={formState.title}
//                       onChange={handleInputChange}
//                       placeholder="Enter product name"
//                       required
//                     />
//                   </FormGroup>
//                   <FormGroup>
//                     <Label for="image">Product Image</Label>
//                     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                       <input
//                         ref={fileInputRef}
//                         type="file"
//                         accept="image/*"
//                         onChange={handleFileChange}
//                         disabled={uploading}
//                         style={{ 
//                           flex: 1,
//                           padding: "0.375rem 0.75rem",
//                           fontSize: "0.875rem",
//                           lineHeight: "1.5",
//                           color: "#495057",
//                           backgroundColor: "#fff",
//                           border: "1px solid #ced4da",
//                           borderRadius: "0.25rem"
//                         }}
//                       />
//                       <Button
//                         type="button"
//                         color="primary"
//                         size="sm"
//                         onClick={handleFileButtonClick}
//                         disabled={uploading}
//                         style={{ 
//                           display: "flex", 
//                           alignItems: "center", 
//                           gap: "0.25rem",
//                           whiteSpace: "nowrap",
//                           minWidth: "80px"
//                         }}
//                       >
//                         <FaUpload size={12} />
//                         {uploading ? "Uploading..." : "Upload"}
//                       </Button>
//                     </div>
//                     {uploadProgress > 0 && uploadProgress < 100 && (
//                       <div className="mt-2">
//                         <Progress value={uploadProgress} color="success" />
//                         <small className="text-muted">Uploading... {uploadProgress}%</small>
//                       </div>
//                     )}
//                     {uploadError && (
//                       <div className="mt-2">
//                         <small className="text-danger">{uploadError}</small>
//                       </div>
//                     )}
//                     {uploadedImageUrl && (
//                       <div className="mt-2">
//                         <small className="text-success">✓ Image uploaded successfully</small>
//                       </div>
//                     )}
//                     <small className="text-muted">
//                       Upload an image file (PNG, JPG, JPEG, GIF, WEBP - max 5MB)
//                     </small>
//                     {(formState.image || uploadedImageUrl) && (
//                       <div className="mt-2" style={{ textAlign: "center" }}>
//                         <img
//                           src={formState.image || uploadedImageUrl}
//                           alt="Preview"
//                           style={{
//                             maxWidth: "200px",
//                             maxHeight: "200px",
//                             borderRadius: "8px",
//                             border: "1px solid #dee2e6",
//                           }}
//                           onError={(e) => {
//                             e.target.style.display = "none";
//                           }}
//                         />
//                       </div>
//                     )}
//                   </FormGroup>
//                   <FormGroup>
//                     <Label for="description">Description</Label>
//                     <Input
//                       id="description"
//                       name="description"
//                       type="textarea"
//                       value={formState.description}
//                       onChange={handleInputChange}
//                       placeholder="Enter product description"
//                       rows={4}
//                       style={{ border: "1px solid #dfe3e8", borderRadius: "8px" }}
//                     />
//                   </FormGroup>
//                 </CardBody>
//               </Card>
//             </Col>

//             {/* Pricing & Stock Card */}
//             <Col md={6} className="d-flex">
//               <Card style={{ ...cardStyle, width: "100%" }}>
//                 <CardBody>
//                   <div style={cardHeaderStyle}>
//                     <FaDotCircle style={iconStyle} />
//                     <div>
//                       <CardTitle tag="h6" style={cardTitleStyle}>
//                         Pricing & Stock
//                       </CardTitle>
//                       <p style={cardSubtitleStyle}>Set cost, selling price and inventory</p>
//                     </div>
//                   </div>
//                   <FormGroup>
//                     <Label for="cost">$ Cost</Label>
//                     <Input
//                       id="cost"
//                       name="cost"
//                       type="text"
//                       value={formState.cost}
//                       onChange={handleInputChange}
//                       placeholder="0.00"
//                     />
//                   </FormGroup>
//                   <FormGroup>
//                     <Label for="price">$ Selling Price</Label>
//                     <Input
//                       id="price"
//                       name="price"
//                       type="text"
//                       value={formState.price}
//                       onChange={handleInputChange}
//                       placeholder="0.00"
//                     />
//                   </FormGroup>
//                   <FormGroup>
//                     <Label for="off_percentage">Off Percentage</Label>
//                     <Input
//                       id="off_percentage"
//                       name="off_percentage"
//                       type="text"
//                       value={formState.off_percentage}
//                       onChange={handleInputChange}
//                       placeholder="%"
//                     />
//                   </FormGroup>
//                   <FormGroup>
//                     <Label for="country">Country</Label>
//                     <Input
//                       id="country"
//                       name="country"
//                       type="text"
//                       value={formState.country}
//                       onChange={handleInputChange}
//                       placeholder="Enter country"
//                     />
//                   </FormGroup>
//                   <Row>
//                     <Col md={6}>
//                       <FormGroup>
//                         <Label for="stockQuantity">Stock Quantity</Label>
//                         <Input
//                           id="stockQuantity"
//                           name="stockQuantity"
//                           type="number"
//                           value={formState.stockQuantity}
//                           onChange={handleInputChange}
//                           placeholder="0"
//                           min="0"
//                         />
//                       </FormGroup>
//                     </Col>
//                     <Col md={6}>
//                       <FormGroup>
//                         <Label for="availableQuantity">Available Quantity</Label>
//                         <Input
//                           id="availableQuantity"
//                           name="availableQuantity"
//                           type="number"
//                           value={formState.availableQuantity}
//                           onChange={handleInputChange}
//                           placeholder="0"
//                           min="0"
//                         />
//                       </FormGroup>
//                     </Col>
//                   </Row>
//                 </CardBody>
//               </Card>
//             </Col>
//           </Row>

//           {/* Category Management Card */}
//           <Row>
//             <Col md={12}>
//               <Card style={cardStyle}>
//                 <CardBody>
//                   <div style={cardHeaderStyle}>
//                     <FaDatabase style={iconStyle} />
//                     <div>
//                       <CardTitle tag="h6" style={cardTitleStyle}>
//                         Category Management
//                       </CardTitle>
//                       <p style={cardSubtitleStyle}>Organize product categories</p>
//                     </div>
//                   </div>
//                   <Row>
//                     <Col md={6}>
//                       <FormGroup>
//                         <Label for="menuId">Category/Country</Label>
//                         <Input
//                           type="select"
//                           id="menuId"
//                           name="menuId"
//                           value={formState.menuId}
//                           onChange={handleCategorySelect}
//                           required
//                           disabled={loadingCategories}
//                         >
//                           <option value="">
//                             {loadingCategories ? "Loading categories..." : "Select category"}
//                           </option>
//                           {categories.map((cat) => (
//                             <option key={cat.id} value={String(cat.id)}>
//                               {cat.name || cat.title || cat.id}
//                             </option>
//                           ))}
//                         </Input>
//                         {!loadingCategories && !categories.length && (
//                           <small className="text-muted">No categories available.</small>
//                         )}
//                       </FormGroup>
//                     </Col>
//                     <Col md={6}>
//                       <FormGroup>
//                         <Label for="subCategoryId">Subcategory</Label>
//                         <Input
//                           type="select"
//                           id="subCategoryId"
//                           name="subCategoryId"
//                           value={formState.subCategoryId}
//                           onChange={handleSubCategorySelect}
//                           disabled={!formState.menuId || loadingSubCategories}
//                         >
//                           <option value="">
//                             {formState.menuId
//                               ? loadingSubCategories
//                                 ? "Loading sub categories..."
//                                 : "Select subcategory"
//                               : "Select a category first"}
//                           </option>
//                           {subCategories.map((sub) => (
//                             <option key={sub.id} value={String(sub.id)}>
//                               {sub.name || sub.title || sub.id}
//                             </option>
//                           ))}
//                         </Input>
//                       </FormGroup>
//                     </Col>
//                   </Row>
//                   {/* <Row>
//                     <Col md={12}>
//                       <FormGroup>
//                         <Label for="categoriesInput">Tags (comma separated)</Label>
//                         <Input
//                           id="categoriesInput"
//                           name="categoriesInput"
//                           value={formState.categoriesInput}
//                           onChange={handleInputChange}
//                           placeholder="Optional tags e.g. Organic, Special"
//                         />
//                       </FormGroup>
//                     </Col>
//                   </Row> */}
//                   <Row>
//                     <Col md={12}>
//                       <FormGroup check className="mt-2">
//                         <input
//                           id="isRecommended"
//                           type="checkbox"
//                           name="isRecommended"
//                           checked={formState.isRecommended}
//                           onChange={handleInputChange}
//                           className="form-check-input"
//                           style={{ opacity: 1, visibility: "visible" }}
//                         />
//                         <Label
//                           for="isRecommended"
//                           check
//                           style={{
//                             marginLeft: "0.5rem",
//                             marginBottom: 0,
//                             cursor: "pointer",
//                             paddingLeft: 0,
//                             lineHeight: "normal",
//                           }}
//                         >
//                           Mark as recommended product
//                         </Label>
//                       </FormGroup>
//                     </Col>
//                   </Row>
//                 </CardBody>
//               </Card>
//             </Col>
//           </Row>
//         </ModalBody>
//         <ModalFooter className="d-flex justify-content-between">
//           <Button
//             type="button"
//             className="btn-round"
//             color="secondary"
//             onClick={toggle}
//             disabled={saving}
//           >
//             Cancel
//           </Button>
//           <Button
//             type="submit"
//             color="primary"
//             className="btn-round"
//             disabled={saving}
//             style={{ minWidth: "120px" }}
//           >
//             {saving ? (
//               <>
//                 <Spinner size="sm" color="light" className="mr-2" />
//                 Saving...
//               </>
//             ) : isEditMode ? (
//               "Update Product"
//             ) : (
//               "Publish"
//             )}
//           </Button>
//         </ModalFooter>
//       </Form>
//     </Modal>
//   );
// };

// export default ProductFormModal;


import React, { useMemo, useRef, useState } from "react";
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
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Spinner,
  Progress,
} from "reactstrap";
import {
  FaDatabase,
  FaDotCircle,
  FaUpload,
  FaTrash,
} from "react-icons/fa";
import axios from "axios";
import {
  parseProductImages,
  stringifyProductImages,
} from "./utils";

const API_BASE =
  process.env.REACT_APP_MESOB_API_BASE ||
  "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

const ProductFormModal = ({
  isOpen,
  toggle,
  isEditMode,
  formState,
  handleInputChange,
  handleCategorySelect,
  handleSubCategorySelect,
  handleSubmit,
  saving,
  categories,
  subCategories,
  loadingCategories,
  loadingSubCategories,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");
  const [offPercentageError, setOffPercentageError] = useState("");
  const fileInputRef = useRef(null);
  const cardHeaderStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    marginBottom: "1rem",
    paddingBottom: "0.75rem",
    borderBottom: "1px solid rgba(125, 145, 180, 0.16)",
  };

  const cardTitleStyle = {
    fontSize: "1rem",
    fontWeight: 600,
    margin: 0,
    color: "#e8f1ff",
  };

  const cardSubtitleStyle = {
    fontSize: "0.875rem",
    color: "#8ea0c0",
    margin: 0,
    marginTop: "0.25rem",
  };

  const iconStyle = {
    color: "#60a5fa",
    fontSize: "1rem",
  };

  const cardStyle = {
    marginBottom: "1.5rem",
    border: "1px solid rgba(125, 145, 180, 0.16)",
    borderRadius: "18px",
    background: "linear-gradient(180deg, rgba(17, 24, 39, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)",
    boxShadow: "0 18px 40px rgba(2, 6, 23, 0.24)",
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current && typeof fileInputRef.current.click === 'function') {
      fileInputRef.current.click();
    }
  };

  const imageUrls = useMemo(
    () => parseProductImages(formState.images || formState.image),
    [formState.image, formState.images]
  );

  const syncImageFields = (nextImageUrls) => {
    const normalizedUrls = parseProductImages(nextImageUrls);
    const firstImage = normalizedUrls[0] || "";
    const serializedImages = stringifyProductImages(normalizedUrls);

    handleInputChange({
      target: { name: "image", value: firstImage, type: "text" },
    });
    handleInputChange({
      target: { name: "images", value: serializedImages, type: "textarea" },
    });
  };

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result || "");
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(file);
    });

  const uploadSingleFile = async (file, index, totalFiles) => {
    const base64Data = await readFileAsBase64(file);
    const startProgress = Math.round((index / totalFiles) * 100);
    const endProgress = Math.round(((index + 1) / totalFiles) * 100);

    setUploadProgress(Math.max(startProgress, 10));

    const response = await axios.post(`${API_BASE}/upload-image`, {
      imageData: base64Data,
      fileName: file.name,
    });

    let responseData = response.data;
    if (typeof responseData === "string") {
      try {
        responseData = JSON.parse(responseData);
      } catch (error) {
        console.error("Failed to parse response as JSON:", error);
      }
    }

    if (!responseData?.url) {
      throw new Error("No URL returned from upload");
    }

    setUploadProgress(endProgress);
    return responseData.url;
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const invalidTypeFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidTypeFile) {
      setUploadError(
        `Please select only image files. "${invalidTypeFile.name}" is not supported.`
      );
      return;
    }

    const oversizedFile = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFile) {
      setUploadError(`"${oversizedFile.name}" is larger than 5MB.`);
      return;
    }

    setUploadError("");
    setUploadSuccessMessage("");
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls = [];

      for (const [index, file] of files.entries()) {
        const uploadedUrl = await uploadSingleFile(file, index, files.length);
        uploadedUrls.push(uploadedUrl);
      }

      const nextImageUrls = [...imageUrls, ...uploadedUrls];
      syncImageFields(nextImageUrls);
      setUploadSuccessMessage(
        `${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded successfully`
      );
      setTimeout(() => setUploadProgress(0), 800);
    } catch (error) {
      console.error("Upload error:", error);

      let errorMessage = "Failed to upload image. Please try again.";

      if (error.response?.status === 500) {
        errorMessage =
          "Server error. Please check if the upload endpoint is configured correctly in Lambda.";
      } else if (error.response?.status === 404) {
        errorMessage =
          "Upload endpoint not found. Please add the /upload-image endpoint to your Lambda function.";
      } else if (error.response?.data?.message) {
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

  const handleRemoveImage = (event, indexToRemove) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const imageToRemove = imageUrls[indexToRemove];
    if (!imageToRemove) return;

    const shouldRemove = window.confirm("Are you sure you want to delete this image?");

    if (!shouldRemove) {
      return;
    }

    const nextImageUrls = imageUrls.filter((_, index) => index !== indexToRemove);
    syncImageFields(nextImageUrls);
    setUploadError("");
    setUploadSuccessMessage(
      nextImageUrls.length
        ? "Image removed. Save the product to keep this change."
        : "All images removed. Save the product to keep this change."
    );
  };

  // Validate Off Percentage when isRecommended changes or Off Percentage changes
  const validateOffPercentage = (isRecommended, offPercentage) => {
    if (isRecommended) {
      const offValue = String(offPercentage).trim();
      if (!offValue || offValue === "0" || offValue === "") {
        return "Off Percentage is required when marking as recommended product";
      }
      // Check if it's a valid number
      const numValue = parseFloat(offValue);
      if (isNaN(numValue) || numValue <= 0) {
        return "Off Percentage must be a valid positive number";
      }
    }
    return "";
  };

  const handleFormInputChange = (event) => {
    const { name, value, checked, type } = event.target;
    
    // Call the parent's handleInputChange
    handleInputChange(event);

    // If isRecommended checkbox is being toggled, validate off percentage
    if (name === "isRecommended") {
      const error = validateOffPercentage(checked, formState.off_percentage);
      setOffPercentageError(error);
    }

    // If off_percentage is being changed and isRecommended is true, validate
    if (name === "off_percentage" && formState.isRecommended) {
      const error = validateOffPercentage(formState.isRecommended, value);
      setOffPercentageError(error);
    }
  };

  const handleFormSubmit = (event) => {
    // Validate before submission
    const error = validateOffPercentage(formState.isRecommended, formState.off_percentage);
    
    if (error) {
      setOffPercentageError(error);
      event.preventDefault();
      return;
    }

    // If validation passes, call the parent's handleSubmit
    handleSubmit(event);
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="lg"
      backdrop="static"
      style={{ maxWidth: "900px" }}
    >
      <Form onSubmit={handleFormSubmit}>
        <ModalHeader toggle={toggle}>
          {isEditMode ? "Edit Product" : "Add Product"}
        </ModalHeader>
        <ModalBody
          style={{
            padding: "1.5rem",
            background:
              "linear-gradient(180deg, rgba(9, 15, 28, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)",
          }}
        >
          <Row>
            {/* Product Information Card */}
            <Col md={6} className="d-flex">
              <Card style={{ ...cardStyle, width: "100%" }}>
                <CardBody>
                  <div style={cardHeaderStyle}>
                    <FaDotCircle style={iconStyle} />
                    <div>
                      <CardTitle tag="h6" style={cardTitleStyle}>
                        Product Information
                      </CardTitle>
                      <p style={cardSubtitleStyle}>Enter basic product details</p>
                    </div>
                  </div>
                  <FormGroup>
                    <Label for="title">Product Name *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formState.title}
                      onChange={handleFormInputChange}
                      placeholder="Enter product name"
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="image">Product Images</Label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        disabled={uploading}
                        style={{ display: "none" }}
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
                      <small className="text-muted">
                        Use the `Upload` button to add more images.
                      </small>
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
                    {uploadSuccessMessage && (
                      <div className="mt-2">
                        <small className="text-success">✓ {uploadSuccessMessage}</small>
                      </div>
                    )}
                    <small className="text-muted">
                      Upload one or more image files (PNG, JPG, JPEG, GIF, WEBP - max 5MB each)
                    </small>
                    {imageUrls.length > 0 && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">
                            {imageUrls.length} image{imageUrls.length > 1 ? "s" : ""} selected. The first image will be used as the main product image.
                          </small>
                        </div>
                        <div
                          className="d-flex flex-wrap"
                          style={{ gap: "0.75rem" }}
                        >
                          {imageUrls.map((imageUrl, index) => (
                            <div
                              key={`${imageUrl}-${index}`}
                              style={{
                                position: "relative",
                                width: "96px",
                                height: "96px",
                                borderRadius: "10px",
                                overflow: "hidden",
                                border:
                                  index === 0
                                    ? "2px solid #60a5fa"
                                    : "1px solid rgba(125, 145, 180, 0.18)",
                                background: "#0f172a",
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt={`Preview ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                              <button
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                }}
                                onClick={(event) => handleRemoveImage(event, index)}
                                aria-label={`Remove image ${index + 1}`}
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  border: "none",
                                  background: "rgba(0,0,0,0.7)",
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <FaTrash size={10} />
                              </button>
                              {index === 0 && (
                                <div
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: "rgba(37, 99, 235, 0.85)",
                                    color: "#fff",
                                    fontSize: "10px",
                                    padding: "2px 4px",
                                    textAlign: "center",
                                  }}
                                >
                                  Main
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </FormGroup>
                  <FormGroup>
                    <Label for="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      type="textarea"
                      value={formState.description}
                      onChange={handleFormInputChange}
                      placeholder="Enter product description"
                      rows={4}
                      style={{
                        border: "1px solid rgba(125, 145, 180, 0.18)",
                        borderRadius: "8px",
                      }}
                    />
                  </FormGroup>
                </CardBody>
              </Card>
            </Col>

            {/* Pricing & Stock Card */}
            <Col md={6} className="d-flex">
              <Card style={{ ...cardStyle, width: "100%" }}>
                <CardBody>
                  <div style={cardHeaderStyle}>
                    <FaDotCircle style={iconStyle} />
                    <div>
                      <CardTitle tag="h6" style={cardTitleStyle}>
                        Pricing & Stock
                      </CardTitle>
                      <p style={cardSubtitleStyle}>Set cost, selling price and inventory</p>
                    </div>
                  </div>
                  <FormGroup>
                    <Label for="cost">$ Cost</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="text"
                      value={formState.cost}
                      onChange={handleFormInputChange}
                      placeholder="0.00"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="price">$ Selling Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="text"
                      value={formState.price}
                      onChange={handleFormInputChange}
                      placeholder="0.00"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="off_percentage">
                      Off Percentage
                      {formState.isRecommended && (
                        <span style={{ color: "#dc3545", marginLeft: "0.25rem" }}>*</span>
                      )}
                    </Label>
                    <Input
                      id="off_percentage"
                      name="off_percentage"
                      type="text"
                      value={formState.off_percentage}
                      onChange={handleFormInputChange}
                      placeholder="%"
                      invalid={!!offPercentageError}
                    />
                    {offPercentageError && (
                      <div className="mt-2">
                        <small className="text-danger">{offPercentageError}</small>
                      </div>
                    )}
                  </FormGroup>
                  <FormGroup>
                    <Label for="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      value={formState.country}
                      onChange={handleFormInputChange}
                      placeholder="Enter country"
                    />
                  </FormGroup>
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="stockQuantity">Stock Quantity</Label>
                        <Input
                          id="stockQuantity"
                          name="stockQuantity"
                          type="number"
                          value={formState.stockQuantity}
                          onChange={handleFormInputChange}
                          placeholder="0"
                          min="0"
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="availableQuantity">Available Quantity</Label>
                        <Input
                          id="availableQuantity"
                          name="availableQuantity"
                          type="number"
                          value={formState.availableQuantity}
                          onChange={handleFormInputChange}
                          placeholder="0"
                          min="0"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Category Management Card */}
          <Row>
            <Col md={12}>
              <Card style={cardStyle}>
                <CardBody>
                  <div style={cardHeaderStyle}>
                    <FaDatabase style={iconStyle} />
                    <div>
                      <CardTitle tag="h6" style={cardTitleStyle}>
                        Category Management
                      </CardTitle>
                      <p style={cardSubtitleStyle}>Organize product categories</p>
                    </div>
                  </div>
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="menuId">Category/Country</Label>
                        <Input
                          type="select"
                          id="menuId"
                          name="menuId"
                          value={formState.menuId}
                          onChange={handleCategorySelect}
                          required
                          disabled={loadingCategories}
                        >
                          <option value="">
                            {loadingCategories ? "Loading categories..." : "Select category"}
                          </option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={String(cat.id)}>
                              {cat.name || cat.title || cat.id}
                            </option>
                          ))}
                        </Input>
                        {!loadingCategories && !categories.length && (
                          <small className="text-muted">No categories available.</small>
                        )}
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
                          onChange={handleSubCategorySelect}
                          disabled={!formState.menuId || loadingSubCategories}
                        >
                          <option value="">
                            {formState.menuId
                              ? loadingSubCategories
                                ? "Loading sub categories..."
                                : "Select subcategory"
                              : "Select a category first"}
                          </option>
                          {subCategories.map((sub) => (
                            <option key={sub.id} value={String(sub.id)}>
                              {sub.name || sub.title || sub.id}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <FormGroup check className="mt-2">
                        <input
                          id="isRecommended"
                          type="checkbox"
                          name="isRecommended"
                          checked={formState.isRecommended}
                          onChange={handleFormInputChange}
                          className="form-check-input"
                          style={{ opacity: 1, visibility: "visible" }}
                        />
                        <Label
                          for="isRecommended"
                          check
                          style={{
                            marginLeft: "0.5rem",
                            marginBottom: 0,
                            cursor: "pointer",
                            paddingLeft: 0,
                            lineHeight: "normal",
                          }}
                        >
                          Mark as recommended product
                        </Label>
                      </FormGroup>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="d-flex justify-content-between">
          <Button
            type="button"
            className="btn-round"
            color="secondary"
            onClick={toggle}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            className="btn-round"
            disabled={saving || !!offPercentageError}
            style={{ minWidth: "120px" }}
          >
            {saving ? (
              <>
                <Spinner size="sm" color="light" className="mr-2" />
                Saving...
              </>
            ) : isEditMode ? (
              "Update Product"
            ) : (
              "Publish"
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default ProductFormModal;