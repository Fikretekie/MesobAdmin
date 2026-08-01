import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, ModalBody, ModalHeader, Row, Col } from "reactstrap";
import { FaChevronLeft, FaChevronRight, FaExpand } from "react-icons/fa";
import { formatCurrency } from "./utils";

const detailLabelStyle = { fontWeight: 600, marginBottom: "0.25rem" };
const detailValueStyle = { marginBottom: "0.75rem", color: "#525f7f" };

const imageFrameStyle = {
  position: "relative",
  border: "1px solid #dfe3e8",
  borderRadius: "12px",
  overflow: "hidden",
  background: "#f8f9fb",
};

const sliderButtonStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 2,
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "rgba(17, 17, 17, 0.7)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const expandButtonStyle = {
  position: "absolute",
  top: 10,
  right: 10,
  zIndex: 2,
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "rgba(17, 17, 17, 0.7)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const parseImageSource = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => parseImageSource(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parseImageSource(parsed) : [];
      } catch (error) {
        // Fall back to simple string parsing below.
      }
    }

    return trimmed
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getProductImages = (product) => {
  const candidates = [
    product?.content?.images,
    product?.content?.image,
    product?.images,
    product?.image,
  ];

  return [...new Set(candidates.flatMap((candidate) => parseImageSource(candidate)))];
};

const ProductDetailsModal = ({ isOpen, toggle, selectedProduct }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  const productImages = useMemo(
    () => getProductImages(selectedProduct),
    [selectedProduct]
  );

  useEffect(() => {
    setActiveImageIndex(0);
    setPreviewOpen(false);
  }, [selectedProduct, isOpen]);

  const hasMultipleImages = productImages.length > 1;
  const activeImage = productImages[activeImageIndex] || null;

  const showPreviousImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === 0 ? productImages.length - 1 : currentIndex - 1
    );
  };

  const showNextImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === productImages.length - 1 ? 0 : currentIndex + 1
    );
  };

  return (
    <>
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>
        {selectedProduct?.title || "Product Details"}
      </ModalHeader>
      <ModalBody>
        {selectedProduct ? (
          <>
            <Row>
              <Col md={4} className="mb-3 mb-md-0">
                <div className="details-image-wrapper">
                  {activeImage ? (
                    <div style={imageFrameStyle}>
                      {hasMultipleImages && (
                        <>
                          <button
                            type="button"
                            onClick={showPreviousImage}
                            style={{ ...sliderButtonStyle, left: 10 }}
                            aria-label="Show previous image"
                          >
                            <FaChevronLeft size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={showNextImage}
                            style={{ ...sliderButtonStyle, right: 10 }}
                            aria-label="Show next image"
                          >
                            <FaChevronRight size={14} />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        style={expandButtonStyle}
                        aria-label="View larger image"
                      >
                        <FaExpand size={14} />
                      </button>

                      <img
                        src={activeImage}
                        alt={selectedProduct.title}
                        className="img-fluid"
                        style={{
                          width: "100%",
                          maxHeight: 260,
                          objectFit: "cover",
                          cursor: "zoom-in",
                        }}
                        onClick={() => setPreviewOpen(true)}
                      />
                    </div>
                  ) : (
                    <div className="details-image-placeholder">No Image</div>
                  )}

                  {hasMultipleImages && (
                    <>
                      <div
                        className="d-flex align-items-center justify-content-between mt-2 mb-2"
                        style={{ fontSize: 12, color: "#6c757d" }}
                      >
                        <span>
                          Image {activeImageIndex + 1} of {productImages.length}
                        </span>
                        <span>Click image to zoom</span>
                      </div>
                      <div
                        className="d-flex flex-wrap"
                        style={{ gap: "0.5rem" }}
                      >
                        {productImages.map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            aria-label={`Show image ${index + 1}`}
                            style={{
                              width: 64,
                              height: 64,
                              padding: 0,
                              borderRadius: 10,
                              overflow: "hidden",
                              border:
                                index === activeImageIndex
                                  ? "2px solid #343a40"
                                  : "1px solid #dfe3e8",
                              background: "#fff",
                              boxShadow:
                                index === activeImageIndex
                                  ? "0 0 0 2px rgba(52,58,64,0.12)"
                                  : "none",
                            }}
                          >
                            <img
                              src={image}
                              alt={`${selectedProduct.title} ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Col>
              <Col md={8}>
                <h5 className="mb-2">Summary</h5>
                <Row>
                  <Col sm={6}>
                    <div style={detailLabelStyle}>Category</div>
                    <div style={detailValueStyle}>
                      {selectedProduct.category ||
                        selectedProduct.menu_name ||
                        "—"}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div style={detailLabelStyle}>Country</div>
                    <div style={detailValueStyle}>{selectedProduct.country || "—"}</div>
                  </Col>
                  <Col sm={6}>
                    <div style={detailLabelStyle}>Price</div>
                    <div style={detailValueStyle}>
                      {formatCurrency(selectedProduct.content?.price)}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div style={detailLabelStyle}>Cost</div>
                    <div style={detailValueStyle}>
                      {formatCurrency(selectedProduct.content?.cost)}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div style={detailLabelStyle}>Stock Quantity</div>
                    <div style={detailValueStyle}>
                      {selectedProduct.stockQuantity ??
                        selectedProduct.quantity ??
                        "—"}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div style={detailLabelStyle}>Available Quantity</div>
                    <div style={detailValueStyle}>
                      {selectedProduct.availableQuantity ?? "—"}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div style={detailLabelStyle}>Off %</div>
                    <div style={detailValueStyle}>{selectedProduct.off_percentage || "—"}</div>
                  </Col>
                  <Col sm={6}>
                    <div style={detailLabelStyle}>Recommended</div>
                    <div style={detailValueStyle}>
                      {selectedProduct.isRecommended ? "Yes" : "No"}
                    </div>
                  </Col>
                </Row>
                <div style={detailLabelStyle}>Description</div>
                <div
                  style={{
                    border: "1px solid #dfe3e8",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    minHeight: "100px",
                    background: "#fafafa",
                    color: "#4d4f5c",
                  }}
                >
                  {selectedProduct.content?.description || "—"}
                </div>
              </Col>
            </Row>
            <hr />
            <Row>
              <Col md={6}>
                <div style={detailLabelStyle}>Categories</div>
                <div style={detailValueStyle}>
                  {(selectedProduct.categories || []).length
                    ? selectedProduct.categories.join(", ")
                    : "—"}
                </div>
              </Col>
              <Col md={6}>
                <div style={detailLabelStyle}>Sub Category</div>
                <div style={detailValueStyle}>
                  {selectedProduct.sub_category_name ||
                    selectedProduct.subCategoryName ||
                    selectedProduct.Sub_category_id ||
                    "—"}
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <div style={detailLabelStyle}>Created</div>
                <div style={detailValueStyle}>
                  {selectedProduct.createdAt
                    ? new Date(selectedProduct.createdAt).toLocaleString()
                    : "—"}
                </div>
              </Col>
              <Col md={6}>
                <div style={detailLabelStyle}>Updated</div>
                <div style={detailValueStyle}>
                  {selectedProduct.updatedAt
                    ? new Date(selectedProduct.updatedAt).toLocaleString()
                    : "—"}
                </div>
              </Col>
            </Row>
          </>
        ) : (
          <p className="text-muted mb-0">No product selected.</p>
        )}
      </ModalBody>
    </Modal>
    <Modal
      isOpen={previewOpen}
      toggle={() => setPreviewOpen(false)}
      size="xl"
      centered
    >
      <ModalHeader toggle={() => setPreviewOpen(false)}>
        {selectedProduct?.title || "Image Preview"}
      </ModalHeader>
      <ModalBody style={{ background: "#111", padding: "1rem" }}>
        {activeImage && (
          <div style={{ position: "relative" }}>
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  style={{ ...sliderButtonStyle, left: 16 }}
                  aria-label="Preview previous image"
                >
                  <FaChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  style={{ ...sliderButtonStyle, right: 16 }}
                  aria-label="Preview next image"
                >
                  <FaChevronRight size={16} />
                </button>
              </>
            )}

            <div
              className="d-flex align-items-center justify-content-center"
              style={{ minHeight: "70vh" }}
            >
              <img
                src={activeImage}
                alt={selectedProduct?.title || "Preview"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  borderRadius: 12,
                }}
              />
            </div>
            {hasMultipleImages && (
              <div
                className="text-center mt-3"
                style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}
              >
                Image {activeImageIndex + 1} of {productImages.length}
              </div>
            )}
          </div>
        )}
      </ModalBody>
    </Modal>
    </>
  );
};

export default ProductDetailsModal;

