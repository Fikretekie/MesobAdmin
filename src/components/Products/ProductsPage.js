import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
  Table,
} from "reactstrap";
import { FaPlus } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import { Helmet } from "react-helmet";
import ProductFormModal from "components/Products/ProductFormModal";
import ProductDetailsModal from "components/Products/ProductDetailsModal";
import { buildColumns } from "components/Products/ProductTable";
import {
  initialProductState,
  mapApiProductToForm,
  buildPayload,
  parseProductImages,
  getProductRequestId,
} from "components/Products/utils";

const API_BASE =
  process.env.REACT_APP_MESOB_API_BASE ||
  "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/seller") ? "/seller" : "/admin";
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState(initialProductState);
  const [error, setError] = useState("");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  // Filter states
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState(null);
  const [filterSubCategories, setFilterSubCategories] = useState([]);
  const [loadingFilterSubCategories, setLoadingFilterSubCategories] = useState(false);
  const [allSubCategories, setAllSubCategories] = useState([]); // Store all subcategories for filtering
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedPending, setSelectedPending] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    sellingPrice: "",
    rejectionReason: "",
    notes: "",
  });
  const [processingApproval, setProcessingApproval] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  // Fetch subcategories for filter
  const userRole = useMemo(() => {
    const storedRole = Number(localStorage.getItem("user_role"));
    return Number.isFinite(storedRole) ? storedRole : 0;
  }, []);
  const userEmail = localStorage.getItem("user_email") || "";
  const isSeller = userRole === 2;

  const formatMoney = useCallback((value) => {
    if (value === undefined || value === null || value === "") return "-";
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return `$${numeric.toFixed(2)}`;
    }
    const trimmed = String(value).trim();
    if (trimmed.startsWith("$")) {
      return trimmed;
    }
    return `$${trimmed}`;
  }, []);

  const fetchFilterSubCategories = useCallback(async (menuId) => {
    if (!menuId) {
      setFilterSubCategories([]);
      return;
    }
    setLoadingFilterSubCategories(true);
    try {
      const response = await axios.get(
        `${API_BASE}/categories/${menuId}/subcategories`
      );
      const items = response.data?.Items || response.data || [];
      const filtered = items.filter((item) => item && item.id);
      const sorted = filtered.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
      setFilterSubCategories(sorted);
    } catch (err) {
      console.error("Failed to load sub categories for filter", err);
      setFilterSubCategories([]);
    } finally {
      setLoadingFilterSubCategories(false);
    }
  }, []);

  const fetchPendingApprovals = useCallback(async () => {
    setLoadingApprovals(true);
    try {
      const response = await axios.get(`${API_BASE}/pending-products`);
      const items = response.data?.Items || response.data || [];
      const pendingOnly = items.filter(
        (item) => (item.status || "pending") === "pending"
      );
      const sorted = pendingOnly.sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || "")
      );
      setPendingApprovals(sorted);
    } catch (err) {
      console.error("Failed to load pending approvals", err);
      setToast({
        type: "danger",
        message: "Unable to load pending products for approval.",
      });
    } finally {
      setLoadingApprovals(false);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (isSeller) {
      const normalizedEmail = userEmail.toLowerCase();
      filtered = filtered.filter((product) => {
        const owner =
          product.selleremail ||
          product.sellerEmail ||
          product.seller ||
          "";
        return owner?.toLowerCase() === normalizedEmail;
      });
    }

    // Filter by category/subcategory
    if (selectedSubCategoryFilter) {
      filtered = filtered.filter((product) => {
        const productSubCategoryId = String(
          product.Sub_category_id !== undefined && product.Sub_category_id !== null
            ? product.Sub_category_id
            : product.subCategoryId !== undefined && product.subCategoryId !== null
              ? product.subCategoryId
              : product.sub_category_id !== undefined && product.sub_category_id !== null
                ? product.sub_category_id
                : ""
        );
        return productSubCategoryId === String(selectedSubCategoryFilter);
      });
    } else if (selectedCategoryFilter) {
      const selectedCategoryId = String(selectedCategoryFilter);
      const selectedCategory =
        categories.find((cat) => String(cat.id) === selectedCategoryId) || null;

      filtered = filtered.filter((product) => {
        // 1) Collect ALL possible category/menu ids on the product
        const categoryIds = new Set();

        // categories array (may contain menuId and tags)
        const rawCategories = Array.isArray(product.categories)
          ? product.categories
          : [];
        rawCategories.forEach((c) => {
          const v = String(c).trim();
          if (v) categoryIds.add(v);
        });

        // Menu_id on product (may be scalar or list)
        const productMenuField = product.Menu_id;
        if (Array.isArray(productMenuField)) {
          productMenuField.forEach((entry) => {
            const v = String(entry).trim();
            if (v) categoryIds.add(v);
          });
        } else if (productMenuField !== undefined && productMenuField !== null) {
          const v = String(productMenuField).trim();
          if (v) categoryIds.add(v);
        }

        // Other menuId variants
        if (product.menuId !== undefined && product.menuId !== null) {
          const v = String(product.menuId).trim();
          if (v) categoryIds.add(v);
        }
        if (product.menu_id !== undefined && product.menu_id !== null) {
          const v = String(product.menu_id).trim();
          if (v) categoryIds.add(v);
        }

        // Direct category id match against any collected id
        if (categoryIds.has(selectedCategoryId)) {
          return true;
        }

        // 2) Fallback: match by category name if we know the selected category
        if (selectedCategory) {
          const productCategoryName = (product.category || "").toLowerCase();
          const selectedCategoryName = (selectedCategory.name || "").toLowerCase();
          if (
            productCategoryName &&
            selectedCategoryName &&
            (productCategoryName === selectedCategoryName ||
              productCategoryName.includes(selectedCategoryName) ||
              selectedCategoryName.includes(productCategoryName))
          ) {
            return true;
          }
        }

        // 3) Also check if product's subcategory belongs to the selected category
        const productSubCategoryId =
          product.Sub_category_id !== undefined &&
            product.Sub_category_id !== null
            ? product.Sub_category_id
            : product.subCategoryId !== undefined &&
              product.subCategoryId !== null
              ? product.subCategoryId
              : product.sub_category_id !== undefined &&
                product.sub_category_id !== null
                ? product.sub_category_id
                : null;

        if (productSubCategoryId !== null) {
          // Find the subcategory in our list
          const subCategory = allSubCategories.find(
            (sub) => String(sub.id) === String(productSubCategoryId)
          );

          if (subCategory) {
            // Check if subcategory's Menu_id includes the selected category
            const menuField = subCategory.Menu_id;
            if (Array.isArray(menuField)) {
              if (
                menuField.some(
                  (menuId) => String(menuId) === selectedCategoryId
                )
              ) {
                return true;
              }
            } else if (menuField !== undefined && menuField !== null) {
              if (String(menuField) === selectedCategoryId) {
                return true;
              }
            }
          }
        }

        return false;
      });
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter((product) => {
        const haystack = `${product.title} ${product.category} ${product.country
          } ${(product.categories || []).join(" ")}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      });
    }

    return filtered;
  }, [
    search,
    products,
    selectedCategoryFilter,
    selectedSubCategoryFilter,
    isSeller,
    userEmail,
    allSubCategories,
    categories,
  ]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE}/products`);
      const items = response.data?.Items || response.data || [];
      const sorted = items.sort((a, b) =>
        (b.updatedAt || b.createdAt || "").localeCompare(
          a.updatedAt || a.createdAt || ""
        )
      );
      setProducts(sorted);
    } catch (err) {
      console.error("Failed to load products", err);
      setError("Unable to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Fetch all subcategories for filtering
  const fetchAllSubCategories = useCallback(async () => {
    try {
      // Fetch subcategories for each category
      const allSubs = [];
      for (const category of categories) {
        try {
          const response = await axios.get(
            `${API_BASE}/categories/${category.id}/subcategories`
          );
          const items = response.data?.Items || response.data || [];
          allSubs.push(...items);
        } catch (err) {
          console.error(`Failed to load subcategories for category ${category.id}`, err);
        }
      }
      setAllSubCategories(allSubs);
    } catch (err) {
      console.error("Failed to load all subcategories", err);
      setAllSubCategories([]);
    }
  }, [categories]);

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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchAllSubCategories();
    }
  }, [categories, fetchAllSubCategories]);

  useEffect(() => {
    if (modalOpen && formState.menuId) {
      fetchSubCategories(formState.menuId);
    } else if (!formState.menuId) {
      setSubCategories([]);
    }
  }, [modalOpen, formState.menuId, fetchSubCategories]);

  useEffect(() => {
    if (!modalOpen || !formState.menuId) return;
    const selectedCategory = categories.find(
      (cat) => String(cat.id) === String(formState.menuId)
    );
    if (selectedCategory && formState.category !== selectedCategory.name) {
      setFormState((prev) => ({
        ...prev,
        category: selectedCategory.name || prev.category,
      }));
    }
  }, [modalOpen, formState.menuId, categories, formState.category]);

  useEffect(() => {
    if (!isSeller) {
      fetchPendingApprovals();
    }
  }, [isSeller, fetchPendingApprovals]);

  const handleEdit = useCallback(
    (product) => {
      setIsEditMode(true);
      console.log("[Products] Edit product identifiers", {
        id: product?.id,
        productId: product?.productId,
        product_id: product?.product_id,
        Product_id: product?.Product_id,
        requestId: getProductRequestId(product),
        product,
      });
      const mapped = mapApiProductToForm(product);
      setFormState(mapped);
      setModalOpen(true);
      if (mapped.menuId) {
        fetchSubCategories(mapped.menuId);
      } else {
        setSubCategories([]);
      }
    },
    [fetchSubCategories]
  );

  const handleDelete = useCallback((product) => {
    if (
      !window.confirm(
        `Delete "${product.title}" and remove it from customer carts?`
      )
    ) {
      return;
    }
    const requestProductId = getProductRequestId(product);
    const encodedProductId = encodeURIComponent(String(requestProductId || ""));
    axios
      .delete(`${API_BASE}/products/${encodedProductId}`)
      .then(() => {
        setProducts((prev) => prev.filter((item) => item.id !== product.id));
      })
      .catch((err) => {
        console.error("Failed to delete product", err);
        alert("Could not delete product. Please try again.");
      });
  }, []);

  const columns = useMemo(
    () => buildColumns(handleEdit, handleDelete, isSeller),
    [handleEdit, handleDelete, isSeller]
  );

  const handleCategorySelect = (event) => {
    const selectedMenuId = event.target.value;
    const selectedCategory = categories.find((cat) => String(cat.id) === selectedMenuId);
    setFormState((prev) => ({
      ...prev,
      menuId: selectedMenuId,
      category: selectedCategory?.name || "",
      subCategoryId: "",
    }));
    if (selectedMenuId) {
      fetchSubCategories(selectedMenuId);
    } else {
      setSubCategories([]);
    }
  };

  const handleSubCategorySelect = (event) => {
    const selectedId = event.target.value || "";
    setFormState((prev) => ({
      ...prev,
      subCategoryId: selectedId,
    }));
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setFormState(initialProductState);
    setSubCategories([]);
    setModalOpen(true);
  };

  // Handle category filter click
  const handleCategoryFilterClick = useCallback(async (categoryId) => {
    if (selectedCategoryFilter === categoryId) {
      // If clicking the same category, deselect it
      setSelectedCategoryFilter(null);
      setSelectedSubCategoryFilter(null);
      setFilterSubCategories([]);
    } else {
      setSelectedCategoryFilter(categoryId);
      // Don't clear subcategory filter - let user keep it if they want
      // setSelectedSubCategoryFilter(null);
      await fetchFilterSubCategories(categoryId);
    }
  }, [selectedCategoryFilter, fetchFilterSubCategories]);

  // Handle subcategory filter click
  const handleSubCategoryFilterClick = useCallback((subCategoryId) => {
    if (selectedSubCategoryFilter === subCategoryId) {
      // If clicking the same subcategory, deselect it
      setSelectedSubCategoryFilter(null);
    } else {
      setSelectedSubCategoryFilter(subCategoryId);
    }
  }, [selectedSubCategoryFilter]);

  const openApprovalModal = (pending) => {
    setSelectedPending(pending);
    setApprovalForm({
      sellingPrice: pending.sellingPrice || pending.proposedPrice || pending.sellerPrice || "",
      rejectionReason: "",
      notes: "",
    });
    setApprovalModalOpen(true);
  };

  const closeApprovalModal = () => {
    setApprovalModalOpen(false);
    setSelectedPending(null);
    setApprovalForm({
      sellingPrice: "",
      rejectionReason: "",
      notes: "",
    });
  };

  const handleApprovalFieldChange = (event) => {
    const { name, value } = event.target;
    setApprovalForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRowClick = (product) => {
    setSelectedProduct(product);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formState.title.trim() || !formState.menuId) {
      alert("Title and Category are required.");
      return;
    }

    const imageUrls = parseProductImages(formState.images || formState.image);

    // Validate that images are not base64 data URLs
    if (imageUrls.some((imageUrl) => imageUrl.startsWith("data:image"))) {
      alert("Base64 images are not supported. Please use an image URL instead (e.g., https://example.com/image.jpg)");
      return;
    }

    const payload = buildPayload(formState);
    console.log(
      `[Products] ${isEditMode ? "Update" : "Create"} payload`,
      payload
    );
    setSaving(true);
    try {
      console.log("formState.id", formState.id);

      if (isEditMode && formState.id) {
        const encodedProductId = encodeURIComponent(String(formState.id || ""));
        console.log("[Products] Update target id", {
          rawId: formState.id,
          encodedProductId,
        });
        const response = await fetch(`${API_BASE}/products/${encodedProductId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Update failed with status ${response.status}${
              errorText ? `: ${errorText}` : ""
            }`
          );
        }
      } else {
        await axios.post(`${API_BASE}/products`, payload);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Failed to save product", err);
      alert("Could not save product. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePending = async () => {
    if (!selectedPending) return;
    if (!approvalForm.sellingPrice) {
      setToast({
        type: "warning",
        message: "Selling price is required to approve a product.",
      });
      return;
    }
    setProcessingApproval(true);
    try {
      await axios.put(
        `${API_BASE}/pending-products/${selectedPending.id}/approve`,
        {
          sellingPrice: Number(approvalForm.sellingPrice),
          notes: approvalForm.notes,
          approvedBy: localStorage.getItem("user_email") || "admin",
        }
      );
      setToast({
        type: "success",
        message: `"${selectedPending.title}" approved and published.`,
      });
      closeApprovalModal();
      fetchPendingApprovals();
      fetchProducts();
    } catch (err) {
      console.error("Failed to approve product", err);
      setToast({
        type: "danger",
        message:
          err.response?.data?.message ||
          "Could not approve product. Please try again.",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleRejectPending = async () => {
    if (!selectedPending) return;
    if (!approvalForm.rejectionReason.trim()) {
      setToast({
        type: "warning",
        message: "Please provide a rejection reason.",
      });
      return;
    }
    setProcessingApproval(true);
    try {
      await axios.put(
        `${API_BASE}/pending-products/${selectedPending.id}/reject`,
        {
          reason: approvalForm.rejectionReason.trim(),
        }
      );
      setToast({
        type: "warning",
        message: `"${selectedPending.title}" was rejected.`,
      });
      closeApprovalModal();
      fetchPendingApprovals();
    } catch (err) {
      console.error("Failed to reject product", err);
      setToast({
        type: "danger",
        message:
          err.response?.data?.message ||
          "Could not reject product. Please try again.",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Products - Mesob Store</title>
      </Helmet>
      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Products</h2>
            <p className="category">
              Manage catalog, pricing, and featured recommendations
            </p>
          </div>
        }
      />
      <div className="content">
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader
                className="d-flex flex-column flex-md-row align-items-md-center justify-content-between"
                style={{ gap: "1rem" }}
              >
                <div style={{ whiteSpace: "nowrap" }}>
                  {/* <CardTitle tag="h4" className="mb-0">
                    Products 
                  </CardTitle> */}
                  {!isSeller && (
                    <small className="text-muted">
                      {filteredProducts.length} of {products.length} Products
                    </small>
                  )}
                </div>
                <div
                  className="d-flex flex-column flex-md-row w-100"
                  style={{ gap: "0.75rem", alignItems: "center" }}
                >
                  <Input
                    type="text"
                    placeholder="Search by name, category, country..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      height: "44px",
                      padding: "0.35rem 0.85rem",
                      fontSize: "0.95rem",
                    }}
                  />
                  {isSeller ? (
                    <Button
                      color="info"
                      className="btn-round"
                      onClick={() => navigate(`${basePath}/seller-products`)}
                      style={{
                        height: "44px",
                        padding: "0.35rem 1.2rem",
                        fontSize: "0.9rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <FaPlus style={{ marginRight: "0.5rem" }} /> Manage
                      Products
                    </Button>
                  ) : (
                    <Button
                      color="primary"
                      className="btn-round"
                      onClick={handleAddNew}
                      style={{
                        height: "44px",
                        padding: "0.35rem 1.2rem",
                        fontSize: "0.9rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <FaPlus style={{ marginRight: "0.5rem" }} /> Add Product
                    </Button>
                  )}
                </div>
              </CardHeader>
              {/* Category Filter Tabs */}
              <div style={{
                padding: "1rem",
                borderBottom: "1px solid rgba(125, 145, 180, 0.12)",
                background:
                  "linear-gradient(180deg, rgba(17, 24, 39, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)"
              }}>
                <div style={{ marginBottom: filterSubCategories.length > 0 ? "0.75rem" : "0" }}>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    alignItems: "center"
                  }}>
                    <small className="text-muted" style={{ marginRight: "0.5rem", fontWeight: "500" }}>
                      Categories:
                    </small>
                    <Button
                      size="sm"
                      color={selectedCategoryFilter === null ? "primary" : "light"}
                      onClick={() => {
                        setSelectedCategoryFilter(null);
                        // Only clear subcategory filter if no subcategory is selected
                        // This allows users to filter by subcategory alone
                        if (selectedSubCategoryFilter) {
                          // Keep subcategory filter, just clear category
                        } else {
                          setSelectedSubCategoryFilter(null);
                        }
                        setFilterSubCategories([]);
                      }}
                      style={{
                        fontSize: "0.85rem",
                        padding: "0.25rem 0.75rem",
                        backgroundColor:
                          selectedCategoryFilter === null
                            ? undefined
                            : "rgba(148, 163, 184, 0.12)",
                        borderColor:
                          selectedCategoryFilter === null
                            ? undefined
                            : "rgba(125, 145, 180, 0.18)",
                        color:
                          selectedCategoryFilter === null ? undefined : "#dbe7ff",
                        fontWeight: selectedCategoryFilter === null ? "500" : "400",
                      }}
                    >
                      All
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        size="sm"
                        color={selectedCategoryFilter === String(category.id) ? "primary" : "light"}
                        onClick={() => handleCategoryFilterClick(String(category.id))}
                        disabled={loadingFilterSubCategories}
                        style={{
                          fontSize: "0.85rem",
                          padding: "0.25rem 0.75rem",
                          backgroundColor:
                            selectedCategoryFilter === String(category.id)
                              ? undefined
                              : "rgba(148, 163, 184, 0.12)",
                          borderColor:
                            selectedCategoryFilter === String(category.id)
                              ? undefined
                              : "rgba(125, 145, 180, 0.18)",
                          color:
                            selectedCategoryFilter === String(category.id)
                              ? undefined
                              : "#dbe7ff",
                          fontWeight: selectedCategoryFilter === String(category.id) ? "500" : "400",
                        }}
                      >
                        {category.name || `Category ${category.id}`}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Subcategory Filter Tabs - Always show all subcategories */}
                {allSubCategories.length > 0 && (
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    alignItems: "center",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid rgba(125, 145, 180, 0.12)",
                    marginTop: "0.75rem"
                  }}>
                    <small className="text-muted" style={{ marginRight: "0.5rem", fontWeight: "500" }}>
                      Subcategories:
                    </small>
                    <Button
                      size="sm"
                      color={selectedSubCategoryFilter === null ? "info" : "light"}
                      onClick={() => {
                        setSelectedSubCategoryFilter(null);
                        // If a category is selected, keep it; otherwise clear both filters
                        if (!selectedCategoryFilter) {
                          setSelectedCategoryFilter(null);
                        }
                      }}
                      style={{
                        fontSize: "0.85rem",
                        padding: "0.25rem 0.75rem",
                        backgroundColor:
                          selectedSubCategoryFilter === null
                            ? undefined
                            : "rgba(148, 163, 184, 0.12)",
                        borderColor:
                          selectedSubCategoryFilter === null
                            ? undefined
                            : "rgba(125, 145, 180, 0.18)",
                        color:
                          selectedSubCategoryFilter === null
                            ? undefined
                            : "#dbe7ff",
                        fontWeight: selectedSubCategoryFilter === null ? "500" : "400",
                      }}
                    >
                      All
                    </Button>
                    {allSubCategories.map((subCategory) => (
                      <Button
                        key={subCategory.id}
                        size="sm"
                        color={selectedSubCategoryFilter === String(subCategory.id) ? "info" : "light"}
                        onClick={() => {
                          handleSubCategoryFilterClick(String(subCategory.id));
                          // When a subcategory is selected, optionally auto-select its parent category
                          if (subCategory.Menu_id && Array.isArray(subCategory.Menu_id) && subCategory.Menu_id.length > 0) {
                            const parentCategoryId = String(subCategory.Menu_id[0]);
                            if (!selectedCategoryFilter || selectedCategoryFilter !== parentCategoryId) {
                              setSelectedCategoryFilter(parentCategoryId);
                              fetchFilterSubCategories(parentCategoryId);
                            }
                          }
                        }}
                        style={{
                          fontSize: "0.85rem",
                          padding: "0.25rem 0.75rem",
                          backgroundColor:
                            selectedSubCategoryFilter === String(subCategory.id)
                              ? undefined
                              : "rgba(148, 163, 184, 0.12)",
                          borderColor:
                            selectedSubCategoryFilter === String(subCategory.id)
                              ? undefined
                              : "rgba(125, 145, 180, 0.18)",
                          color:
                            selectedSubCategoryFilter === String(subCategory.id)
                              ? undefined
                              : "#dbe7ff",
                          fontWeight: selectedSubCategoryFilter === String(subCategory.id) ? "500" : "400",
                        }}
                      >
                        {subCategory.name || `Subcategory ${subCategory.id}`}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <CardBody>
                {toast.message && (
                  <div className={`alert alert-${toast.type}`} role="alert">
                    {toast.message}
                  </div>
                )}
                {!isSeller && (
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5 className="mb-0">Pending Product Approvals</h5>
                      <Badge color="info">{pendingApprovals.length}</Badge>
                    </div>
                    {loadingApprovals ? (
                      <div className="text-center py-3">
                        <Spinner size="sm" color="primary" />{" "}
                        <span className="text-muted">Loading...</span>
                      </div>
                    ) : pendingApprovals.length > 0 ? (
                      <div className="table-responsive">
                        <Table hover size="sm" className="mb-0">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Seller</th>
                              <th>Cost</th>
                              <th>Submitted</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingApprovals.map((pending) => (
                              <tr key={pending.id}>
                                <td>
                                  <strong>{pending.title}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {pending.menuName || pending.category}
                                  </small>
                                </td>
                                <td>
                                  <div>{pending.sellerName || "-"}</div>
                                  <small className="text-muted">
                                    {pending.sellerEmail}
                                  </small>
                                </td>
                                <td>{formatMoney(pending.sellerPrice)}</td>
                                <td>
                                  <small className="text-muted">
                                    {pending.createdAt
                                      ? new Date(
                                        pending.createdAt
                                      ).toLocaleString()
                                      : "-"}
                                  </small>
                                </td>
                                <td className="text-right">
                                  <Button
                                    size="sm"
                                    color="info"
                                    onClick={() => openApprovalModal(pending)}
                                  >
                                    Review
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">
                        All caught up! No pending products right now.
                      </p>
                    )}
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner color="primary" />
                    <p className="mt-2 mb-0">Loading products...</p>
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={filteredProducts}
                    responsive
                    highlightOnHover
                    pointerOnHover
                    pagination
                    paginationPerPage={50}
                    paginationRowsPerPageOptions={[25, 50, 100, 200]}
                    noDataComponent="No products found."
                    fixedHeader
                    onRowClicked={handleRowClick}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>

      <ProductFormModal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        isEditMode={isEditMode}
        formState={formState}
        handleInputChange={handleInputChange}
        handleCategorySelect={handleCategorySelect}
        handleSubCategorySelect={handleSubCategorySelect}
        handleSubmit={handleSubmit}
        saving={saving}
        categories={categories}
        subCategories={subCategories}
        loadingCategories={loadingCategories}
        loadingSubCategories={loadingSubCategories}
      />

      <ProductDetailsModal
        isOpen={detailsModalOpen}
        toggle={closeDetailsModal}
        selectedProduct={selectedProduct}
      />

      {!isSeller && selectedPending && (
        <Modal isOpen={approvalModalOpen} toggle={closeApprovalModal} size="lg">
          <ModalHeader toggle={closeApprovalModal}>
            Product Approval - {selectedPending.title}
          </ModalHeader>
          <ModalBody>
            <Row>
              <Col md={6}>
                <h6 className="text-muted text-uppercase mb-2">
                  Product Information
                </h6>
                <p className="mb-1">
                  <strong>Category:</strong> {selectedPending.menuName || "-"}
                </p>
                <p className="mb-1">
                  <strong>Subcategory:</strong>{" "}
                  {selectedPending.subCategoryName || "-"}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  {selectedPending.description || "-"}
                </p>
              </Col>
              <Col md={6}>
                <h6 className="text-muted text-uppercase mb-2">
                  Seller Information
                </h6>
                <p className="mb-1">
                  <strong>Name:</strong> {selectedPending.sellerName || "-"}
                </p>
                <p className="mb-1">
                  <strong>Email:</strong> {selectedPending.sellerEmail || "-"}
                </p>
                <p className="mb-1">
                  <strong>Shipping Location:</strong>{" "}
                  {selectedPending.shippingLocation || "-"}
                </p>
                <p className="mb-1">
                  <strong>Shipping Notes:</strong>{" "}
                  {selectedPending.shippingDescription || "-"}
                </p>
              </Col>
            </Row>
            <hr />
            <FormGroup>
              <Label>Seller Requested Price (Cost)</Label>
              <Input
                value={formatMoney(selectedPending.sellerPrice)}
                readOnly
              />
            </FormGroup>
            <FormGroup>
              <Label for="approvalSellingPrice">Set Selling Price *</Label>
              <Input
                id="approvalSellingPrice"
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={approvalForm.sellingPrice}
                onChange={handleApprovalFieldChange}
              />
            </FormGroup>
            <FormGroup>
              <Label for="approvalNotes">Internal Notes</Label>
              <Input
                id="approvalNotes"
                name="notes"
                type="textarea"
                rows="2"
                value={approvalForm.notes}
                onChange={handleApprovalFieldChange}
                placeholder="Optional notes visible to admins"
              />
            </FormGroup>
            <FormGroup>
              <Label for="approvalRejectionReason">Rejection Reason</Label>
              <Input
                id="approvalRejectionReason"
                name="rejectionReason"
                type="textarea"
                rows="2"
                value={approvalForm.rejectionReason}
                onChange={handleApprovalFieldChange}
                placeholder="Provide a reason before rejecting"
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter className="justify-content-between">
            <Button color="secondary" onClick={closeApprovalModal} disabled={processingApproval}>
              Close
            </Button>
            <div className="d-flex" style={{ gap: "0.5rem" }}>
              <Button
                color="success"
                onClick={handleApprovePending}
                disabled={processingApproval}
              >
                {processingApproval ? (
                  <>
                    <Spinner size="sm" className="mr-2" /> Approving...
                  </>
                ) : (
                  "Approve & Publish"
                )}
              </Button>
              <Button
                color="danger"
                onClick={handleRejectPending}
                disabled={processingApproval}
              >
                Reject
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}

export default Products;

