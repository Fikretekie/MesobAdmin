import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Input,
  Row,
  Spinner,
  Badge,
} from "reactstrap";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import { Helmet } from "react-helmet";
import { FaChevronDown, FaChevronRight, FaPlus, FaEdit } from "react-icons/fa";
import CategoryFormModal from "components/Categories/CategoryFormModal";
import SubCategoryFormModal from "components/Categories/SubCategoryFormModal";

const API_BASE =
  process.env.REACT_APP_MESOB_API_BASE ||
  "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [loadingSubCategories, setLoadingSubCategories] = useState({});
  
  // Modal states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subCategoryModalOpen, setSubCategoryModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryFormState, setCategoryFormState] = useState({
    id: "",
    name: "",
    des: "",
    icon: "",
    sellerEmail: "",
  });
  const [subCategoryFormState, setSubCategoryFormState] = useState({
    id: "",
    categoryId: "",
    name: "",
    des: "",
    icon: "",
    sellerEmail: "",
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE}/categories`);
      const items = response.data?.Items || response.data || [];
      const sorted = items.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
      setCategories(sorted);
    } catch (err) {
      console.error("Failed to load categories", err);
      setError("Unable to load categories. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubCategories = useCallback(async (categoryId, forceRefresh = false) => {
    if (!forceRefresh && subCategoriesMap[categoryId]) {
      // Already loaded
      return;
    }

    setLoadingSubCategories((prev) => ({ ...prev, [categoryId]: true }));
    try {
      const response = await axios.get(
        `${API_BASE}/categories/${categoryId}/subcategories`
      );
      const items = response.data?.Items || response.data || [];
      const filtered = items.filter((item) => item && item.id);
      const sorted = filtered.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
      setSubCategoriesMap((prev) => ({
        ...prev,
        [categoryId]: sorted,
      }));
    } catch (err) {
      console.error("Failed to load sub categories", err);
      setSubCategoriesMap((prev) => ({
        ...prev,
        [categoryId]: [],
      }));
    } finally {
      setLoadingSubCategories((prev) => ({ ...prev, [categoryId]: false }));
    }
  }, [subCategoriesMap]);

  // Category handlers
  const handleAddCategory = () => {
    setIsEditMode(false);
    setCategoryFormState({
      id: "",
      name: "",
      des: "",
      icon: "",
      sellerEmail: "",
    });
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setIsEditMode(true);
    setCategoryFormState({
      id: category.id,
      name: category.name || "",
      des: category.des || "",
      icon: category.icon || "",
      sellerEmail: category.Seller_email || category.sellerEmail || "",
    });
    setCategoryModalOpen(true);
  };


  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: categoryFormState.name.trim(),
        des: categoryFormState.des?.trim() || "",
        icon: categoryFormState.icon?.trim() || "",
        Seller_email: categoryFormState.sellerEmail?.trim() || "",
      };

      if (isEditMode) {
        await axios.put(`${API_BASE}/categories/${categoryFormState.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/categories`, payload);
      }
      setCategoryModalOpen(false);
      await fetchCategories();
    } catch (err) {
      console.error("Failed to save category", err);
      alert("Could not save category. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  // Subcategory handlers
  const handleAddSubCategory = (categoryId) => {
    setIsEditMode(false);
    setSubCategoryFormState({
      id: "",
      categoryId: categoryId || "",
      name: "",
      des: "",
      icon: "",
      sellerEmail: "",
    });
    setSubCategoryModalOpen(true);
  };

  const handleEditSubCategory = (subCategory, categoryId) => {
    setIsEditMode(true);
    setSubCategoryFormState({
      id: subCategory.id,
      categoryId: categoryId,
      name: subCategory.name || "",
      des: subCategory.des || "",
      icon: subCategory.icon || "",
      sellerEmail: subCategory.Seller_email || subCategory.sellerEmail || "",
    });
    setSubCategoryModalOpen(true);
  };


  const handleSubCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setSubCategoryFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: subCategoryFormState.name.trim(),
        des: subCategoryFormState.des?.trim() || "",
        icon: subCategoryFormState.icon?.trim() || "",
        Seller_email: subCategoryFormState.sellerEmail?.trim() || "",
      };

      if (isEditMode) {
        await axios.put(
          `${API_BASE}/categories/${subCategoryFormState.categoryId}/subcategories/${subCategoryFormState.id}`,
          payload
        );
      } else {
        await axios.post(
          `${API_BASE}/categories/${subCategoryFormState.categoryId}/subcategories`,
          payload
        );
      }
      setSubCategoryModalOpen(false);
      await fetchSubCategories(subCategoryFormState.categoryId, true);
    } catch (err) {
      console.error("Failed to save subcategory", err);
      alert("Could not save subcategory. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      fetchSubCategories(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    return categories.filter((category) => {
      const haystack = `${category.name || ""} ${category.id || ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [search, categories]);

  // Build table data with categories and their subcategories
  const tableData = useMemo(() => {
    const data = [];
    filteredCategories.forEach((category) => {
      // Add category row
      data.push({
        id: `category-${category.id}`,
        type: "category",
        categoryId: category.id,
        name: category.name || `Category ${category.id}`,
        subcategories: subCategoriesMap[category.id] || [],
        isExpanded: expandedCategories.has(String(category.id)),
        loading: loadingSubCategories[category.id],
      });

      // Add subcategory rows if expanded
      if (expandedCategories.has(String(category.id))) {
        const subCategories = subCategoriesMap[category.id] || [];
        if (loadingSubCategories[category.id]) {
          data.push({
            id: `loading-${category.id}`,
            type: "loading",
            categoryId: category.id,
          });
        } else if (subCategories.length === 0) {
          data.push({
            id: `empty-${category.id}`,
            type: "empty",
            categoryId: category.id,
            name: "No subcategories",
          });
        } else {
          subCategories.forEach((subCategory) => {
            data.push({
              id: `subcategory-${subCategory.id}`,
              type: "subcategory",
              categoryId: category.id,
              subCategoryId: subCategory.id,
              name: subCategory.name || `Subcategory ${subCategory.id}`,
            });
          });
        }
      }
    });
    return data;
  }, [filteredCategories, expandedCategories, subCategoriesMap, loadingSubCategories]);

  const columns = [
    {
      name: "Name",
      cell: (row) => {
        if (row.type === "category") {
          const category = categories.find(c => String(c.id) === String(row.categoryId)) || {};
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  paddingLeft: "0.5rem",
                  flex: 1,
                }}
                onClick={() => toggleCategory(String(row.categoryId))}
              >
                {row.isExpanded ? (
                  <FaChevronDown size={12} />
                ) : (
                  <FaChevronRight size={12} />
                )}
                <strong>{row.name}</strong>
                <Badge color="primary" style={{ marginLeft: "0.5rem" }}>
                  Category
                </Badge>
              </div>
              <div style={{ display: "flex", gap: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  color="link"
                  onClick={() => handleEditCategory(category)}
                  style={{ padding: "0.25rem 0.5rem" }}
                  title="Edit Category"
                >
                  <FaEdit size={12} color="#17a2b8" />
                </Button>
                <Button
                  size="sm"
                  color="link"
                  onClick={() => handleAddSubCategory(row.categoryId)}
                  style={{ padding: "0.25rem 0.5rem" }}
                  title="Add Subcategory"
                >
                  <FaPlus size={12} color="#28a745" />
                </Button>
              </div>
            </div>
          );
        } else if (row.type === "subcategory") {
          const subCategory = subCategoriesMap[row.categoryId]?.find(sc => sc.id === row.subCategoryId);
          return (
            <div style={{ paddingLeft: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#6c757d" }}>└─</span>
              <span style={{ flex: 1 }}>{row.name}</span>
              <Badge color="info" style={{ marginLeft: "0.5rem" }}>
                Subcategory
              </Badge>
              <div style={{ display: "flex", gap: "0.25rem", marginLeft: "0.5rem" }}>
                <Button
                  size="sm"
                  color="link"
                  onClick={() => handleEditSubCategory(subCategory, row.categoryId)}
                  style={{ padding: "0.25rem 0.5rem" }}
                  title="Edit Subcategory"
                >
                  <FaEdit size={12} color="#17a2b8" />
                </Button>
              </div>
            </div>
          );
        } else if (row.type === "loading") {
          return (
            <div style={{ paddingLeft: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Spinner size="sm" color="primary" />
              <span style={{ color: "#6c757d" }}>Loading subcategories...</span>
            </div>
          );
        } else if (row.type === "empty") {
          return (
            <div style={{ paddingLeft: "2rem", color: "#6c757d", fontStyle: "italic" }}>
              {row.name}
            </div>
          );
        }
        return null;
      },
      sortable: false,
      width: "500px",
    },
    {
      name: "ID",
      selector: (row) => (row.type === "category" ? row.categoryId : row.subCategoryId) || "-",
      sortable: true,
      width: "150px",
      cell: (row) => {
        if (row.type === "category" || row.type === "subcategory") {
          return <code style={{ fontSize: "0.85rem" }}>{row.type === "category" ? row.categoryId : row.subCategoryId}</code>;
        }
        return "-";
      },
    },
    {
      name: "Subcategories Count",
      selector: (row) => (row.type === "category" ? (row.subcategories?.length || 0) : "-"),
      sortable: true,
      width: "180px",
      cell: (row) => {
        if (row.type === "category") {
          const count = row.subcategories?.length || 0;
          return count > 0 ? (
            <Badge color="secondary">{count} subcategory{count !== 1 ? "ies" : ""}</Badge>
          ) : (
            <span style={{ color: "#6c757d" }}>No subcategories</span>
          );
        }
        return "-";
      },
    },
  ];

  return (
    <>
      <Helmet>
        <title>Categories - Mesob Store</title>
      </Helmet>
      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Categories</h2>
            <p className="category">
              Manage product categories and subcategories
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
                  <small className="text-muted">
                    {categories.length} Total Categories
                  </small>
                </div>
                <div
                  className="d-flex flex-column flex-md-row w-100"
                  style={{ gap: "0.75rem", alignItems: "center" }}
                >
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      height: "44px",
                      padding: "0.35rem 0.85rem",
                      fontSize: "0.95rem",
                    }}
                  />
                  <Button
                    color="primary"
                    className="btn-round"
                    onClick={handleAddCategory}
                    style={{
                      height: "44px",
                      padding: "0.35rem 1.2rem",
                      fontSize: "0.9rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <FaPlus style={{ marginRight: "0.5rem" }} /> Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner color="primary" />
                    <p className="mt-2 mb-0">Loading categories...</p>
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={tableData}
                    responsive
                    highlightOnHover
                    pagination
                    paginationPerPage={50}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    noDataComponent="No categories found."
                    fixedHeader
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>

      <CategoryFormModal
        isOpen={categoryModalOpen}
        toggle={() => setCategoryModalOpen(false)}
        isEditMode={isEditMode}
        formState={categoryFormState}
        handleInputChange={handleCategoryInputChange}
        handleSubmit={handleCategorySubmit}
        saving={saving}
      />

      <SubCategoryFormModal
        isOpen={subCategoryModalOpen}
        toggle={() => setSubCategoryModalOpen(false)}
        isEditMode={isEditMode}
        formState={subCategoryFormState}
        handleInputChange={handleSubCategoryInputChange}
        handleSubmit={handleSubCategorySubmit}
        saving={saving}
        categories={categories}
      />
    </>
  );
}

export default Categories;

