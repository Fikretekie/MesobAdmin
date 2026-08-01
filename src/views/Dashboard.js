import React, { useEffect, useState } from "react";

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Row,
  Col,
  Spinner,
} from "reactstrap";

// Material-UI components for Analytics
import {
  Card as MUICard,
  CardContent,
  CardHeader as MUICardHeader,
  Grid,
  Typography,
  Box,
  Table as MUITable,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Paper,
  TextField,
  InputAdornment,
  Button as MUIButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@material-ui/core';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon } from '@material-ui/icons';

// core components
import PanelHeader from "components/PanelHeader/PanelHeader.js";

import axios from "axios";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { Line } from 'react-chartjs-2';

const API_URL = "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [Users, setUsers] = useState([]);
  const [totalStats, setTotalStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalCost: 0,
    totalCustomers: 0
  });

  // Analytics state
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [timeFilter, setTimeFilter] = useState("all"); // "all", "daily", "weekly", "monthly", "yearly"
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productViewsBreakdown, setProductViewsBreakdown] = useState(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [selectedCartProduct, setSelectedCartProduct] = useState(null);
  const [cartBreakdown, setCartBreakdown] = useState(null);
  const [loadingCartBreakdown, setLoadingCartBreakdown] = useState(false);

  const [pageViewModalOpen, setPageViewModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageViewBreakdown, setPageViewBreakdown] = useState(null);
  const [loadingPageViewBreakdown, setLoadingPageViewBreakdown] = useState(false);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [loadingCategoryBreakdown, setLoadingCategoryBreakdown] = useState(false);

  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [subcategoryBreakdown, setSubcategoryBreakdown] = useState(null);
  const [loadingSubcategoryBreakdown, setLoadingSubcategoryBreakdown] = useState(false);
  // NEW: Mobile sessions state
  const [mobileSessionsData, setMobileSessionsData] = useState(null);
  const [mobileSessionsModalOpen, setMobileSessionsModalOpen] = useState(false);
  const [loadingMobileSessions, setLoadingMobileSessions] = useState(false);

  // NEW: Web sessions state
  const [webSessionsData, setWebSessionsData] = useState(null);
  const [webSessionsModalOpen, setWebSessionsModalOpen] = useState(false);
  const [loadingWebSessions, setLoadingWebSessions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch dashboard totals from /dashboard endpoint
    axios
      .get("https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/dashboard")
      .then((response) => {
        if (response.data) {
          console.log('dashboard totals=>>>>>', response.data);
          // Directly set totals from API response
          setTotalStats({
            totalOrders: response.data.totalOrders || 0,
            totalSales: response.data.totalSales || 0,
            totalCost: response.data.totalCost || 0,
            totalCustomers: 0 // Not provided by /dashboard endpoint
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      });
    axios
      .get("https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/users")
      .then((response) => {
        if (response.data.Items) {
          setUsers(response.data.Count);
          console.log(response.data.Count);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("There was an error fetching the users!", error);
      });
  }, []);

  // Analytics functions
  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter]);

  const fetchProductsAndCategories = async () => {
    try {
      // Fetch all products
      const productsResponse = await fetch(`${API_URL}/products`);
      const productsData = await productsResponse.json();
      const productsList = Array.isArray(productsData) ? productsData : (productsData?.Items || []);
      setProducts(productsList);
      console.log('Total products loaded:', productsList.length);
      console.log('First 5 product IDs:', productsList.slice(0, 5).map(p => p.id));
      const productWithId2 = productsList.find(product => product.id === '2' || product.productId === '2');

      if (productWithId2) {
        console.log('Product with ID 2:', productWithId2);
      } else {
        console.log('No product found with ID 2');
      }
      // Fetch all categories
      const categoriesResponse = await fetch(`${API_URL}/categories`);
      const categoriesData = await categoriesResponse.json();
      const categoriesList = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.Items || []);
      setCategories(categoriesList);

      // Fetch subcategories for each category
      const allSubcategories = [];
      for (const category of categoriesList) {
        try {
          const subCatResponse = await fetch(`${API_URL}/categories/${category.id}/subcategories`);
          const subCatData = await subCatResponse.json();
          const subCatList = Array.isArray(subCatData) ? subCatData : (subCatData?.Items || []);
          allSubcategories.push(...subCatList);
        } catch (err) {
          console.error(`Failed to load subcategories for category ${category.id}`, err);
        }
      }
      setSubcategories(allSubcategories);
    } catch (error) {
      console.error("Error fetching products and categories:", error);
    }
  };

  // Helper function to get product details by ID
  const getProductDetails = (productId) => {
    const product = products.find(p => p.id === productId);
    console.log('getProductDetails', { productId, product });
    if (!product) {
      console.warn(`Product not found: ${productId}`);
      return {
        title: `Product ${productId} (Not Found)`,
        category: "-",
        subcategory: "-"
      };
    }

    // Get category name
    const categoryId = product.categories?.[0] || product.Menu_id || product.menuId;
    const category = categories.find(c => String(c.id) === String(categoryId));
    const categoryName = category?.name || product.category || "-";

    // Get subcategory name
    const subCategoryId = product.Sub_category_id || product.subCategoryId || product.sub_category_id;
    const subcategory = subcategories.find(sc => sc.id === subCategoryId);
    const subcategoryName = subcategory?.name || "-";
    console.log('product details', { productId, product, categoryName, subcategoryName });
    return {
      title: product.title || productId,
      category: categoryName,
      subcategory: subcategoryName
    };
  };

  // Helper function to filter products based on search query
  const filterProducts = (productList) => {
    if (!searchQuery.trim()) return productList;

    const query = searchQuery.toLowerCase().trim();
    return productList.filter((product) => {
      const productDetails = getProductDetails(product.productId);
      const title = (productDetails?.title || product.productId || "").toLowerCase();
      const category = (productDetails?.category || "").toLowerCase();
      const subcategory = (productDetails?.subcategory || "").toLowerCase();
      const productId = (product.productId || "").toLowerCase();

      return (
        title.includes(query) ||
        category.includes(query) ||
        subcategory.includes(query) ||
        productId.includes(query)
      );
    });
  };


  const getShortUserId = (rawUserId) => {
    let userId = rawUserId;
    if (rawUserId && typeof rawUserId === "object") {
      userId = rawUserId.id ?? rawUserId.userId ?? "";
    }
    if (typeof userId === "number") {
      userId = String(userId);
    }
    if (typeof userId !== "string" || !userId) {
      return "";
    }
    return `${userId.substring(0, 8)}...`;
  };


  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      const timeParam = timeFilter !== "all" ? `?timeFilter=${timeFilter}` : `?timeFilter=all`;

      console.log(`Fetching analytics with time filter: ${timeFilter}`);

      const [dashboard, revenue, purchases, users, mobileSessions, webSessions] = await Promise.all([
        fetch(`${API_URL}/analytics/dashboard${timeParam}`).then(r => r.json()),
        fetch(`${API_URL}/analytics/revenue${timeParam}`).then(r => r.json()),
        fetch(`${API_URL}/analytics/purchases${timeParam}`).then(r => r.json()),
        fetch(`${API_URL}/analytics/users${timeParam}`).then(r => r.json()),
        fetch(`${API_URL}/analytics/mobile-sessions${timeParam}`).then(r => r.json()),
        fetch(`${API_URL}/analytics/web-sessions${timeParam}`).then(r => r.json()) // NEW
      ]);

      console.log('🔍 Dashboard API Response:', {
        totalEvents: dashboard.totalEvents,
        productViewsCount: dashboard.mostViewedProducts?.length,
        mostViewedProducts: dashboard.mostViewedProducts,
        dateRange: dashboard.dateRange,
        timeFilter: dashboard.timeFilter
      });

      setDashboardData(dashboard);
      setRevenueData(revenue);
      setPurchaseData(purchases);
      setUserData(users);
      setMobileSessionsData(mobileSessions); // NEW
      setWebSessionsData(webSessions); // NEW

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchQuery(""); // Clear search when switching tabs
  };

  const handleViewsClick = async (product) => {
    setSelectedProduct(product);
    setViewsModalOpen(true);
    setLoadingBreakdown(true);

    try {
      // Fetch platform-specific view breakdown with user details for this product
      const timeParam = timeFilter !== "all" ? `?timeFilter=${timeFilter}` : `?timeFilter=all`;
      const url = `${API_URL}/analytics/product/${encodeURIComponent(product.productId)}/views${timeParam}`;

      console.log('=== DEBUG: Fetching Product Views ===');
      console.log('Product ID:', product.productId);
      console.log('Product Views (from list):', product.views);
      console.log('Time Filter:', timeFilter);
      console.log('API URL:', url);

      const response = await fetch(url);
      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);

      const data = await response.json();
      console.log('=== API Response Data ===');
      console.log('Raw API Response:', JSON.stringify(data, null, 2));
      console.log('data.web:', data?.web);
      console.log('data.ios:', data?.ios);
      console.log('data.android:', data?.android);
      console.log('data.total:', data?.total);

      // Check what keys are in the response
      console.log('Response keys:', Object.keys(data || {}));

      if (data && (data.web || data.ios || data.android)) {
        console.log('✅ Using API data - platform breakdown found');
        console.log('Web total:', data.web?.total);
        console.log('iOS total:', data.ios?.total);
        console.log('Android total:', data.android?.total);
        setProductViewsBreakdown(data);
      } else {
        console.log('⚠️ Using fallback - no platform breakdown in API response');
        console.log('Condition check: data exists?', !!data);
        console.log('Condition check: data.web?', !!data?.web);
        console.log('Condition check: data.ios?', !!data?.ios);
        console.log('Condition check: data.android?', !!data?.android);

        // Fallback structure
        setProductViewsBreakdown({
          total: product.views,
          web: { total: 0, users: [] },
          ios: { total: 0, users: [] },
          android: { total: 0, users: [] }
        });
      }
    } catch (error) {
      console.error('❌ Error fetching product views breakdown:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      setProductViewsBreakdown({
        total: product.views,
        web: { total: 0, users: [] },
        ios: { total: 0, users: [] },
        android: { total: 0, users: [] }
      });
    } finally {
      setLoadingBreakdown(false);
      console.log('=== DEBUG END ===');
    }
  };

  // Handler for Cart Additions
  const handleCartClick = async (product) => {
    setSelectedCartProduct(product);
    setCartModalOpen(true);
    setLoadingCartBreakdown(true);

    try {
      const timeParam = timeFilter !== "all" ? `?timeFilter=${timeFilter}` : `?timeFilter=all`;
      const response = await fetch(`${API_URL}/analytics/product/${encodeURIComponent(product.productId)}/cart${timeParam}`);
      const data = await response.json();

      if (data && (data.web || data.ios || data.android)) {
        setCartBreakdown(data);
      } else {
        setCartBreakdown({
          total: product.adds,
          web: { total: 0, users: [] },
          ios: { total: 0, users: [] },
          android: { total: 0, users: [] }
        });
      }
    } catch (error) {
      console.error("Error fetching cart breakdown:", error);
      setCartBreakdown({
        total: product.adds,
        web: { total: 0, users: [] },
        ios: { total: 0, users: [] },
        android: { total: 0, users: [] }
      });
    } finally {
      setLoadingCartBreakdown(false);
    }
  };

  const handleCloseCartModal = () => {
    setCartModalOpen(false);
    setSelectedCartProduct(null);
    setCartBreakdown(null);
  };

  // Handler for Page Views
  const handlePageViewClick = async (page) => {
    setSelectedPage(page);
    setPageViewModalOpen(true);
    setLoadingPageViewBreakdown(true);

    try {
      const timeParam = timeFilter !== "all" ? `?timeFilter=${timeFilter}` : `?timeFilter=all`;
      const response = await fetch(`${API_URL}/analytics/page/${encodeURIComponent(page.page)}/views${timeParam}`);
      const data = await response.json();

      if (data && (data.web || data.ios || data.android)) {
        setPageViewBreakdown(data);
      } else {
        setPageViewBreakdown({
          total: page.views,
          web: { total: 0, users: [] },
          ios: { total: 0, users: [] },
          android: { total: 0, users: [] }
        });
      }
    } catch (error) {
      console.error("Error fetching page view breakdown:", error);
      setPageViewBreakdown({
        total: page.views,
        web: { total: 0, users: [] },
        ios: { total: 0, users: [] },
        android: { total: 0, users: [] }
      });
    } finally {
      setLoadingPageViewBreakdown(false);
    }
  };

  const handleClosePageViewModal = () => {
    setPageViewModalOpen(false);
    setSelectedPage(null);
    setPageViewBreakdown(null);
  };

  // Handler for Categories
  const handleCategoryClick = async (category) => {
    console.log('Category clicked', { category, timeFilter });

    setSelectedCategory(category);
    setCategoryModalOpen(true);
    setLoadingCategoryBreakdown(true);

    try {
      const timeParam = timeFilter !== "all" ? `?timeFilter=${timeFilter}` : `?timeFilter=all`;
      const response = await fetch(`${API_URL}/analytics/category/${encodeURIComponent(category.categoryId)}/views${timeParam}`);
      const data = await response.json();

      if (data && (data.web || data.ios || data.android)) {
        setCategoryBreakdown(data);
      } else {
        setCategoryBreakdown({
          total: category.views,
          web: { total: 0, users: [] },
          ios: { total: 0, users: [] },
          android: { total: 0, users: [] }
        });
      }
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      setCategoryBreakdown({
        total: category.views,
        web: { total: 0, users: [] },
        ios: { total: 0, users: [] },
        android: { total: 0, users: [] }
      });
    } finally {
      setLoadingCategoryBreakdown(false);
    }
  };

  const handleCloseCategoryModal = () => {
    setCategoryModalOpen(false);
    setSelectedCategory(null);
    setCategoryBreakdown(null);
  };

  // Handler for Subcategories
  // const handleSubcategoryClick = async (subcategory) => {
  //   setSelectedSubcategory(subcategory);
  //   setSubcategoryModalOpen(true);
  //   setLoadingSubcategoryBreakdown(true);

  //   try {
  //     const timeParam = timeFilter !== "all" ? `?timeFilter=${timeFilter}` : `?timeFilter=all`;
  //     const response = await fetch(`${API_URL}/analytics/subcategory/${subcategory.subCategoryId}/views${timeParam}`);
  //     const data = await response.json();

  //     if (data && (data.web || data.ios || data.android)) {
  //       setSubcategoryBreakdown(data);
  //     } else {
  //       setSubcategoryBreakdown({
  //         total: subcategory.views,
  //         web: { total: 0, users: [] },
  //         ios: { total: 0, users: [] },
  //         android: { total: 0, users: [] }
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error fetching subcategory breakdown:", error);
  //     setSubcategoryBreakdown({
  //       total: subcategory.views,
  //       web: { total: 0, users: [] },
  //       ios: { total: 0, users: [] },
  //       android: { total: 0, users: [] }
  //     });
  //   } finally {
  //     setLoadingSubcategoryBreakdown(false);
  //   }
  // };
  const handleSubcategoryClick = async (subcategory) => {
    console.log('Subcategory clicked', { subcategory, timeFilter });
    setSelectedSubcategory(subcategory);
    setSubcategoryModalOpen(true);
    setLoadingSubcategoryBreakdown(true);

    try {
      const timeParam = timeFilter !== "all" ? `?timeFilter=${timeFilter}` : `?timeFilter=all`;

      // FIX: Use multiple possible field names and encode properly
      const subCatId = subcategory.subCategoryId || subcategory.id || subcategory.subcategoryId;

      const response = await fetch(
        `${API_URL}/analytics/subcategory/${encodeURIComponent(subCatId)}/views${timeParam}`
      );
      const data = await response.json();

      if (data && (data.web || data.ios || data.android)) {
        setSubcategoryBreakdown(data);
      } else {
        setSubcategoryBreakdown({
          total: subcategory.views || 0,
          web: { total: 0, users: [] },
          ios: { total: 0, users: [] },
          android: { total: 0, users: [] }
        });
      }
    } catch (error) {
      console.error("Error fetching subcategory breakdown:", error);
      setSubcategoryBreakdown({
        total: subcategory.views || 0,
        web: { total: 0, users: [] },
        ios: { total: 0, users: [] },
        android: { total: 0, users: [] }
      });
    } finally {
      setLoadingSubcategoryBreakdown(false);
    }
  };
  const handleCloseSubcategoryModal = () => {
    setSubcategoryModalOpen(false);
    setSelectedSubcategory(null);
    setSubcategoryBreakdown(null);
  };

  // NEW: Handler for Mobile Visits click
  const handleMobileVisitsClick = () => {
    setMobileSessionsModalOpen(true);
  };

  const handleCloseMobileSessionsModal = () => {
    setMobileSessionsModalOpen(false);
  };

  // NEW: Handler for Web Visits click
  const handleWebVisitsClick = () => {
    setWebSessionsModalOpen(true);
  };

  const handleCloseWebSessionsModal = () => {
    setWebSessionsModalOpen(false);
  };

  const handleCloseViewsModal = () => {
    setViewsModalOpen(false);
    setSelectedProduct(null);
    setProductViewsBreakdown(null);
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Mesob Store</title>
      </Helmet>
      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Dashboard</h2>
          </div>
        }
      />
      <style>{`
        @media (max-width: 768px) {
          .dashboard-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin: 0 -10px;
            padding: 0 10px;
          }
          .dashboard-table-wrapper table {
            min-width: 600px;
          }
          .dashboard-card-header {
            flex-direction: column !important;
          }
          .dashboard-card-header > div:first-child {
            margin-bottom: 12px !important;
          }
          .analytics-section {
            padding: 10px 5px !important;
          }
          .MuiCard-root {
            margin-bottom: 15px;
          }
          .MuiCardContent-root {
            padding: 12px !important;
          }
        }
        @media (max-width: 576px) {
          .card-stats .numbers {
            text-align: left;
          }
          .card-stats .icon-big {
            font-size: 2em;
          }
          .card-stats .card-category {
            font-size: 11px !important;
          }
          .card-stats h3 {
            font-size: 1.3rem !important;
          }
          .MuiButton-root {
            font-size: 0.7rem !important;
            padding: 4px 8px !important;
            min-width: 70px !important;
          }
          .MuiTab-root {
            font-size: 0.7rem !important;
            min-width: 70px !important;
            padding: 8px 10px !important;
          }
          .MuiTypography-h4 {
            font-size: 1.2rem !important;
          }
          .MuiTypography-body1 {
            font-size: 0.8rem !important;
          }
          .MuiChip-root {
            font-size: 0.65rem !important;
            height: 20px !important;
          }
        }
      `}</style>
      <div className="content dashboard-dark-theme">
        <Row>
          <Col xs="12" sm="6" lg="3" md="6">
            <Card className="card-stats dashboard-stat-card dashboard-stat-card--warning" style={{ marginBottom: '15px' }}>
              <CardBody>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center">
                      <i className="fas fa-shopping-cart text-warning" />
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category" style={{ fontSize: '12px', marginBottom: '5px' }}>TOTAL ORDERS</p>
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30px' }}>
                          <Spinner color="warning" size="sm" />
                        </div>
                      ) : (
                        <CardTitle tag="h3" style={{ fontSize: '1.5rem', marginBottom: 0 }}>{totalStats.totalOrders}</CardTitle>
                      )}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>

          <Col xs="12" sm="6" lg="3" md="6">
            <Card className="card-stats dashboard-stat-card dashboard-stat-card--success" style={{ marginBottom: '15px' }}>
              <CardBody>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center">
                      <i className="fas fa-dollar-sign text-success" />
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category" style={{ fontSize: '12px', marginBottom: '5px' }}>TOTAL SALES</p>
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30px' }}>
                          <Spinner color="success" size="sm" />
                        </div>
                      ) : (
                        <CardTitle tag="h3" style={{ fontSize: '1.5rem', marginBottom: 0 }}>
                          ${Number(totalStats.totalSales).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </CardTitle>
                      )}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>

          <Col xs="12" sm="6" lg="3" md="6">
            <Card className="card-stats dashboard-stat-card dashboard-stat-card--danger" style={{ marginBottom: '15px' }}>
              <CardBody>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center">
                      <i className="fas fa-chart-line text-danger" />
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category" style={{ fontSize: '12px', marginBottom: '5px' }}>TOTAL COST</p>
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30px' }}>
                          <Spinner color="danger" size="sm" />
                        </div>
                      ) : (
                        <CardTitle tag="h3" style={{ fontSize: '1.5rem', marginBottom: 0 }}>
                          ${Number(totalStats.totalCost).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </CardTitle>
                      )}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>

          <Col xs="12" sm="6" lg="3" md="6">
            <Card className="card-stats dashboard-stat-card dashboard-stat-card--primary" style={{ marginBottom: '15px' }}>
              <CardBody>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center">
                      <i className="fas fa-users text-primary" />
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category" style={{ fontSize: '12px', marginBottom: '5px' }}>TOTAL USERS</p>
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30px' }}>
                          <Spinner color="primary" size="sm" />
                        </div>
                      ) : (
                        <CardTitle tag="h3" style={{ fontSize: '1.5rem', marginBottom: 0 }}>
                          {Users}
                        </CardTitle>
                      )}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Analytics Section */}
        <Row>
          <Col md={12}>
            <div style={{ padding: "15px 10px" }} className="analytics-section">
              {/* Time Filter Buttons */}
              <Box
                display="flex"
                gap={1}
                mb={3}
                flexWrap="wrap"
                style={{
                  gap: '8px'
                }}
              >
                <MUIButton
                  variant={timeFilter === "all" ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setTimeFilter("all")}
                  size="small"
                >
                  All Time
                </MUIButton>
                <MUIButton
                  variant={timeFilter === "daily" ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setTimeFilter("daily")}
                  size="small"
                  disabled={analyticsLoading}
                >
                  Today
                </MUIButton>
                <MUIButton
                  variant={timeFilter === "weekly" ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setTimeFilter("weekly")}
                  size="small"
                  disabled={analyticsLoading}
                >
                  Last 7 Days
                </MUIButton>
                <MUIButton
                  variant={timeFilter === "monthly" ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setTimeFilter("monthly")}
                  size="small"
                  disabled={analyticsLoading}
                >
                  This Month
                </MUIButton>
                <MUIButton
                  variant={timeFilter === "yearly" ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setTimeFilter("yearly")}
                  size="small"
                  disabled={analyticsLoading}
                >
                  This Year
                </MUIButton>
              </Box>

              {/* Analytics Key Metrics Row 2 - Tracking Events */}
              <Grid container spacing={2} style={{ marginBottom: 20 }}>
                <Grid item xs={6} sm={6} md={3}>
                  <MUICard className="dashboard-summary-card dashboard-summary-card--cyan" style={{ height: '100%' }}>
                    <CardContent style={{ padding: '12px' }}>
                      <Typography color="textSecondary" gutterBottom style={{ fontSize: '0.75rem' }}>
                        Total Events Tracked
                      </Typography>
                      <Typography variant="h4" style={{ fontSize: '1.5rem' }}>
                        {dashboardData?.totalEvents || 0}
                      </Typography>
                    </CardContent>
                  </MUICard>
                </Grid>

                {/* WEB VISITS CARD */}
                <Grid item xs={6} sm={6} md={3}>
                  <MUICard
                    className="dashboard-summary-card dashboard-summary-card--orange"
                    style={{ height: '100%', cursor: 'pointer' }}
                    // onClick={handleWebVisitsClick}
                    hover
                  >
                    <CardContent style={{ padding: '12px' }}>
                      <Typography color="textSecondary" gutterBottom style={{ fontSize: '0.75rem' }}>
                        Web Visits (Sessions)
                      </Typography>
                      <Typography variant="h4" style={{ fontSize: '1.5rem' }}>
                        {dashboardData?.deviceBreakdown?.web || 0}
                      </Typography>
                      {/* <Typography variant="caption" color="primary" style={{ fontSize: '0.65rem', marginTop: '4px', display: 'block' }}>
                      Click for details →
                    </Typography> */}
                    </CardContent>
                  </MUICard>
                </Grid>

                {/* MOBILE VISITS CARD */}
                <Grid item xs={6} sm={6} md={3}>
                  <MUICard
                    className="dashboard-summary-card dashboard-summary-card--green"
                    style={{ height: '100%', cursor: 'pointer' }}
                    // onClick={handleMobileVisitsClick}
                    hover
                  >
                    <CardContent style={{ padding: '12px' }}>
                      <Typography color="textSecondary" gutterBottom style={{ fontSize: '0.75rem' }}>
                        Mobile Visits (Sessions)
                      </Typography>
                      <Typography variant="h4" style={{ fontSize: '1.5rem' }}>
                        {dashboardData?.deviceBreakdown?.mobile || 0}
                      </Typography>
                      {/* <Typography variant="caption" color="primary" style={{ fontSize: '0.65rem', marginTop: '4px', display: 'block' }}>
                      Click for details →
                    </Typography> */}
                    </CardContent>
                  </MUICard>
                </Grid>

                {/* PRODUCT VIEWS CARD */}
                <Grid item xs={6} sm={6} md={3}>
                  <MUICard className="dashboard-summary-card dashboard-summary-card--pink" style={{ height: '100%' }}>
                    <CardContent style={{ padding: '12px' }}>
                      <Typography color="textSecondary" gutterBottom style={{ fontSize: '0.75rem' }}>
                        Product Views
                      </Typography>
                      <Typography variant="h4" style={{ fontSize: '1.5rem' }}>
                        {dashboardData?.mostViewedProducts?.reduce((sum, p) => sum + p.views, 0) || 0}
                      </Typography>
                    </CardContent>
                  </MUICard>
                </Grid>
              </Grid>

              {/* Tabs for Different Analytics Views */}
              <Paper className="dashboard-tabs-shell" style={{ marginBottom: 15, overflowX: 'auto' }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Product Views" />
                  <Tab label="Purchases" />
                  <Tab label="Cart Additions" />
                  <Tab label="Page Views" />
                  <Tab label="Categories" />
                  <Tab label="Revenue" />
                </Tabs>
              </Paper>

              {analyticsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {/* Tab 1: Most Viewed Products */}
                  {activeTab === 0 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <MUICard>
                          <Box className="dashboard-card-header" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '12px 16px',
                            borderBottom: '2px solid #1976d2'
                          }}>
                            <Box style={{ marginBottom: '12px' }}>
                              <Typography variant="h6" style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                                Most Viewed Products
                              </Typography>
                              <Typography variant="body2" color="textSecondary" style={{ fontSize: '0.75rem' }}>
                                {dashboardData?.mostViewedProducts?.length || 0} products tracked - Showing products that users clicked on
                              </Typography>
                            </Box>
                            <TextField
                              placeholder="Search products..."
                              variant="outlined"
                              size="small"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <FontAwesomeIcon icon={faSearch} />
                                  </InputAdornment>
                                ),
                              }}
                              style={{
                                width: '100%'
                              }}
                            />
                          </Box>
                          <CardContent style={{ padding: 0 }}>
                            {(() => {
                              const filteredProducts = filterProducts(dashboardData?.mostViewedProducts || []);
                              return filteredProducts.length > 0 ? (
                                <Box className="dashboard-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
                                  <MUITable style={{ minWidth: 650 }}>
                                    <TableHead>
                                      <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell style={{ fontWeight: 'bold', padding: '8px', fontSize: '0.75rem' }}>#</TableCell>
                                        <TableCell style={{ fontWeight: 'bold', padding: '8px', fontSize: '0.75rem' }}>Product Title</TableCell>
                                        <TableCell className="d-none d-md-table-cell" style={{ fontWeight: 'bold', padding: '8px', fontSize: '0.75rem' }}>Category</TableCell>
                                        <TableCell className="d-none d-lg-table-cell" style={{ fontWeight: 'bold', padding: '8px', fontSize: '0.75rem' }}>Subcategory</TableCell>
                                        <TableCell align="right" style={{ fontWeight: 'bold', padding: '8px', fontSize: '0.75rem' }}>Total Views</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {filteredProducts.map((product, index) => {
                                        const productDetails = getProductDetails(product.productId);
                                        console.log('filteredProducts', product);

                                        return (
                                          <TableRow
                                            key={product.productId}
                                            style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}
                                            hover
                                          >
                                            <TableCell style={{ padding: '8px' }}>
                                              <Chip
                                                label={index + 1}
                                                size="small"
                                                color={index < 3 ? "primary" : "default"}
                                                style={{ minWidth: 30, fontSize: '0.7rem' }}
                                              />
                                            </TableCell>
                                            <TableCell style={{ padding: '8px' }}>
                                              <Typography variant="body1" style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                                {productDetails?.title || product.productId}
                                              </Typography>
                                              <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem', display: 'block' }}>
                                                ID: {product.productId}
                                              </Typography>
                                              <Box className="d-block d-md-none" style={{ marginTop: '4px' }}>
                                                <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.7rem' }}>
                                                  {productDetails?.category || "-"} {productDetails?.subcategory ? ` • ${productDetails.subcategory}` : ''}
                                                </Typography>
                                              </Box>
                                            </TableCell>
                                            <TableCell className="d-none d-md-table-cell" style={{ padding: '8px' }}>
                                              <Typography variant="body2" style={{ fontSize: '0.75rem' }}>
                                                {productDetails?.category || "-"}
                                              </Typography>
                                            </TableCell>
                                            <TableCell className="d-none d-lg-table-cell" style={{ padding: '8px' }}>
                                              <Typography variant="body2" style={{ fontSize: '0.75rem' }}>
                                                {productDetails?.subcategory || "-"}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="right" style={{ padding: '8px' }}>
                                              <Chip
                                                label={`${product.views} views`}
                                                color="primary"
                                                onClick={() => handleViewsClick(product)}
                                                style={{
                                                  minWidth: 70,
                                                  fontWeight: 'bold',
                                                  fontSize: '0.7rem',
                                                  cursor: 'pointer'
                                                }}
                                              />
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </MUITable>
                                </Box>
                              ) : (
                                <Box p={8} textAlign="center">
                                  <Typography variant="h6" color="textSecondary" gutterBottom>
                                    {searchQuery ? "🔍 No products found matching your search" : "📊 No Product Views Yet"}
                                  </Typography>
                                  <Typography color="textSecondary">
                                    {searchQuery ? "Try adjusting your search query" : "Add trackProductView() to your product detail pages to start tracking."}
                                  </Typography>
                                </Box>
                              );
                            })()}
                          </CardContent>
                        </MUICard>
                      </Grid>
                    </Grid>
                  )}

                  {/* Tab 2: Most Purchased Products */}
                  {activeTab === 1 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <MUICard>
                          <MUICardHeader
                            title="Most Purchased Products"
                            subheader={`${purchaseData?.mostPurchased?.length || 0} products sold - Based on completed orders`}
                            style={{ borderBottom: '2px solid #2e7d32' }}
                            action={
                              <TextField
                                placeholder="Search products..."
                                variant="outlined"
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <FontAwesomeIcon icon={faSearch} />
                                    </InputAdornment>
                                  ),
                                }}
                                style={{ minWidth: 250, marginRight: 16 }}
                              />
                            }
                          />
                          <CardContent style={{ padding: 0 }}>
                            {(() => {
                              const filteredProducts = filterProducts(purchaseData?.mostPurchased || []);
                              return filteredProducts.length > 0 ? (
                                <MUITable>
                                  <TableHead>
                                    <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                                      <TableCell style={{ fontWeight: 'bold' }}>#</TableCell>
                                      <TableCell style={{ fontWeight: 'bold' }}>Product Name</TableCell>
                                      <TableCell style={{ fontWeight: 'bold' }}>Category</TableCell>
                                      <TableCell style={{ fontWeight: 'bold' }}>Subcategory</TableCell>
                                      <TableCell align="right" style={{ fontWeight: 'bold' }}>Units Sold</TableCell>
                                      <TableCell align="right" style={{ fontWeight: 'bold' }}>Total Revenue</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {filteredProducts.map((product, index) => {
                                      const productDetails = getProductDetails(product.productId);
                                      return (
                                        <TableRow
                                          key={product.productId}
                                          style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}
                                          hover
                                        >
                                          <TableCell>
                                            <Chip
                                              label={index + 1}
                                              size="small"
                                              color={index < 3 ? "primary" : "default"}
                                              style={{ minWidth: 40 }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body1" style={{ fontWeight: 500 }}>
                                              {typeof product.title === 'string' ? product.title : (productDetails?.title || product.productId)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                              ID: {product.productId}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {productDetails?.category || "-"}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {productDetails?.subcategory || "-"}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="right">
                                            <Chip
                                              label={`${product.count} units`}
                                              style={{ backgroundColor: '#e3f2fd', minWidth: 100 }}
                                            />
                                          </TableCell>
                                          <TableCell align="right">
                                            <Typography
                                              variant="h6"
                                              style={{ color: '#2e7d32', fontWeight: 'bold' }}
                                            >
                                              ${product.revenue.toFixed(2)}
                                            </Typography>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </MUITable>
                              ) : (
                                <Box p={8} textAlign="center">
                                  <Typography variant="h6" color="textSecondary" gutterBottom>
                                    {searchQuery ? "🔍 No products found matching your search" : "🛒 No Purchases Yet"}
                                  </Typography>
                                  <Typography color="textSecondary">
                                    {searchQuery ? "Try adjusting your search query" : "Purchase data comes from completed orders."}
                                  </Typography>
                                </Box>
                              );
                            })()}
                          </CardContent>
                        </MUICard>
                      </Grid>
                    </Grid>
                  )}

                  {/* Tab 3: Most Added to Cart */}
                  {activeTab === 2 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <MUICard>
                          <MUICardHeader
                            title="Most Added to Cart"
                            subheader={`${dashboardData?.mostAddedToCart?.length || 0} products tracked - Products users are interested in`}
                            style={{ borderBottom: '2px solid #f50057' }}
                            action={
                              <TextField
                                placeholder="Search products..."
                                variant="outlined"
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <FontAwesomeIcon icon={faSearch} />
                                    </InputAdornment>
                                  ),
                                }}
                                style={{ minWidth: 250, marginRight: 16 }}
                              />
                            }
                          />
                          <CardContent style={{ padding: 0 }}>
                            {(() => {
                              const filteredProducts = filterProducts(dashboardData?.mostAddedToCart || []);
                              return filteredProducts.length > 0 ? (
                                <MUITable>
                                  <TableHead>
                                    <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                                      <TableCell style={{ fontWeight: 'bold' }}>#</TableCell>
                                      <TableCell style={{ fontWeight: 'bold' }}>Product Title</TableCell>
                                      <TableCell style={{ fontWeight: 'bold' }}>Category</TableCell>
                                      <TableCell style={{ fontWeight: 'bold' }}>Subcategory</TableCell>
                                      <TableCell align="right" style={{ fontWeight: 'bold' }}>Times Added</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {filteredProducts.map((product, index) => {
                                      const productDetails = getProductDetails(product.productId);
                                      return (
                                        <TableRow
                                          key={product.productId}
                                          style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}
                                          hover
                                        >
                                          <TableCell>
                                            <Chip
                                              label={index + 1}
                                              size="small"
                                              color={index < 3 ? "secondary" : "default"}
                                              style={{ minWidth: 40 }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body1" style={{ fontWeight: 500 }}>
                                              {productDetails?.title || product.productId}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                              ID: {product.productId}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {productDetails?.category || "-"}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {productDetails?.subcategory || "-"}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="right">
                                            <Chip
                                              label={`${product.adds} times`}
                                              color="secondary"
                                              onClick={() => handleCartClick(product)}

                                              style={{ minWidth: 100, fontWeight: 'bold', cursor: 'pointer' }}
                                            />
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </MUITable>
                              ) : (
                                <Box p={8} textAlign="center">
                                  <Typography variant="h6" color="textSecondary" gutterBottom>
                                    {searchQuery ? "🔍 No products found matching your search" : "🛒 No Cart Additions Yet"}
                                  </Typography>
                                  <Typography color="textSecondary">
                                    {searchQuery ? "Try adjusting your search query" : "Add trackAddToCart() to your cart buttons to start tracking."}
                                  </Typography>
                                </Box>
                              );
                            })()}
                          </CardContent>
                        </MUICard>
                      </Grid>
                    </Grid>
                  )}

                  {/* Tab 4: Page Views */}
                  {activeTab === 3 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <MUICard>
                          <MUICardHeader
                            title="Page Views"
                            subheader={`${dashboardData?.pageViews?.length || 0} pages tracked - Most visited pages on your site`}
                            style={{ borderBottom: '2px solid #9c27b0' }}
                          />
                          <CardContent style={{ padding: 0 }}>
                            {dashboardData?.pageViews?.length > 0 ? (
                              <MUITable>
                                <TableHead>
                                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell style={{ fontWeight: 'bold' }}>#</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Page Name</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>Total Views</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {dashboardData.pageViews.map((page, index) => (
                                    <TableRow
                                      key={index}
                                      style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}
                                      hover
                                    >
                                      <TableCell>
                                        <Chip
                                          label={index + 1}
                                          size="small"
                                          color={index < 3 ? "primary" : "default"}
                                          style={{ minWidth: 40 }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body1" style={{ fontWeight: 500 }}>
                                          {page.page}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Chip
                                          label={`${page.views} views`}
                                          onClick={() => handlePageViewClick(page)}
                                          style={{ backgroundColor: '#e1bee7', minWidth: 100, fontWeight: 'bold', cursor: 'pointer' }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </MUITable>
                            ) : (
                              <Box p={8} textAlign="center">
                                <Typography variant="h6" color="textSecondary" gutterBottom>
                                  📄 No Page Views Yet
                                </Typography>
                                <Typography color="textSecondary">
                                  Add trackPageView() to your pages to start tracking.
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </MUICard>
                      </Grid>
                    </Grid>
                  )}
                  {activeTab === 4 && (
                    <Grid container spacing={3}>
                      {/* Most Viewed Categories */}
                      <Grid item xs={12} lg={6}>
                        <MUICard style={{ height: '100%' }}>
                          <MUICardHeader
                            title="Most Viewed Categories"
                            subheader={`${dashboardData?.mostViewedCategories?.length || 0} categories tracked`}
                            style={{ borderBottom: '2px solid #ff9800' }}
                          />
                          <CardContent style={{ padding: 0 }}>
                            {dashboardData?.mostViewedCategories?.length > 0 ? (
                              <MUITable>
                                <TableHead>
                                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell style={{ fontWeight: 'bold' }}>#</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Category</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>Views</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {dashboardData.mostViewedCategories.map((category, index) => (
                                    <TableRow
                                      key={category.categoryId}
                                      style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}
                                      hover
                                    >
                                      <TableCell>
                                        <Chip
                                          label={index + 1}
                                          size="small"
                                          style={{ minWidth: 40 }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body1" style={{ fontWeight: 500 }}>
                                          {category.name || category.categoryId}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.75rem' }}>
                                          ID: {category.categoryId}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Chip
                                          label={`${category.views} views`}

                                          onClick={() => handleCategoryClick(category)}
                                          style={{ backgroundColor: '#ffe0b2', minWidth: 100, cursor: 'pointer' }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </MUITable>
                            ) : (
                              <Box p={8} textAlign="center">
                                <Typography variant="h6" color="textSecondary" gutterBottom>
                                  📂 No Category Views Yet
                                </Typography>
                                <Typography color="textSecondary">
                                  Add trackCategoryView() to category pages.
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </MUICard>
                      </Grid>

                      {/* Most Viewed Subcategories */}
                      <Grid item xs={12} lg={6}>
                        <MUICard style={{ height: '100%' }}>
                          <MUICardHeader
                            title="Most Viewed Subcategories"
                            subheader={`${dashboardData?.mostViewedSubCategories?.length || 0} subcategories tracked`}
                            style={{ borderBottom: '2px solid #ff9800' }}
                          />
                          <CardContent style={{ padding: 0 }}>
                            {dashboardData?.mostViewedSubCategories?.length > 0 ? (
                              <MUITable>
                                <TableHead>
                                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell style={{ fontWeight: 'bold' }}>#</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Subcategory</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>Views</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {dashboardData.mostViewedSubCategories.map((subCat, index) => (
                                    <TableRow
                                      key={subCat.subCategoryId}
                                      style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}
                                      hover
                                    >
                                      <TableCell>
                                        <Chip
                                          label={index + 1}
                                          size="small"
                                          style={{ minWidth: 40 }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body1" style={{ fontWeight: 500 }}>
                                          {subCat.name || subCat.subCategoryId}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.75rem' }}>
                                          ID: {subCat.subCategoryId}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Chip
                                          label={`${subCat.views} views`}
                                          onClick={() => handleSubcategoryClick(subCat)}
                                          style={{ backgroundColor: '#ffe0b2', minWidth: 100, cursor: 'pointer' }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </MUITable>
                            ) : (
                              <Box p={8} textAlign="center">
                                <Typography variant="h6" color="textSecondary" gutterBottom>
                                  📑 No Subcategory Views Yet
                                </Typography>
                                <Typography color="textSecondary">
                                  Add trackSubCategoryView() to subcategory pages.
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </MUICard>
                      </Grid>
                    </Grid>
                  )}
                  {/* Tab 6: Revenue */}
                  {/* {activeTab === 5 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <MUICard>
                          <MUICardHeader
                            title="Revenue Over Time"
                            subheader="Daily revenue trends from orders"
                            style={{ borderBottom: '2px solid #00bcd4' }}
                          />
                          <CardContent>
                            <Line
                              data={{
                                labels: revenueData?.revenueByDate?.map(d => d.date) || [],
                                datasets: [{
                                  label: 'Revenue ($)',
                                  data: revenueData?.revenueByDate?.map(d => parseFloat(d.revenue)) || [],
                                  borderColor: 'rgb(75, 192, 192)',
                                  backgroundColor: 'rgba(75, 192, 192, 0.1)',
                                  tension: 0.1,
                                  fill: true
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: true,
                                plugins: {
                                  legend: {
                                    position: 'top',
                                  },
                                  title: {
                                    display: false
                                  }
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: function (value) {
                                        return '$' + value.toFixed(0);
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </CardContent>
                        </MUICard>
                      </Grid>
                    </Grid>
                  )}
                  
                  */}

                  {activeTab === 5 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <MUICard>
                          <MUICardHeader
                            title="Revenue Over Time"
                            subheader={`Total Revenue: $${parseFloat(revenueData?.totalRevenue || 0).toLocaleString()} | Orders: ${revenueData?.totalOrders || 0}`}
                            style={{ borderBottom: '2px solid #00bcd4' }}
                          />
                          <CardContent>
                            {revenueData?.revenueByDate?.length > 0 ? (
                              <Line
                                data={{
                                  labels: revenueData.revenueByDate.map(d => d.date),
                                  datasets: [{
                                    label: 'Revenue ($)',
                                    // ✅ parse as float, not left as string
                                    data: revenueData.revenueByDate.map(d => parseFloat(d.revenue)),
                                    borderColor: 'rgb(75, 192, 192)',
                                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                                    tension: 0.1,
                                    fill: true
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                      labels: {
                                        color: '#dbe7ff'
                                      }
                                    },
                                    tooltip: {
                                      backgroundColor: '#0f172a',
                                      titleColor: '#f8fbff',
                                      bodyColor: '#dbe7ff',
                                      borderColor: 'rgba(56, 189, 248, 0.3)',
                                      borderWidth: 1,
                                      callbacks: {
                                        label: (context) => `$${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                      }
                                    }
                                  },
                                  scales: {
                                    x: {
                                      ticks: {
                                        color: '#8ea0c0'
                                      },
                                      grid: {
                                        color: 'rgba(148, 163, 184, 0.12)',
                                        drawBorder: false
                                      }
                                    },
                                    y: {
                                      beginAtZero: true,
                                      ticks: {
                                        color: '#8ea0c0',
                                        callback: (value) => '$' + Number(value).toLocaleString()
                                      },
                                      grid: {
                                        color: 'rgba(148, 163, 184, 0.12)',
                                        drawBorder: false
                                      }
                                    }
                                  }
                                }}
                              />
                            ) : (
                              // ✅ Show empty state instead of empty chart
                              <Box p={8} textAlign="center">
                                <Typography variant="h6" color="textSecondary">
                                  📊 No revenue data for this period
                                </Typography>
                                <Typography color="textSecondary" style={{ marginTop: 8 }}>
                                  Total Revenue: ${parseFloat(revenueData?.totalRevenue || 0).toFixed(2)} from {revenueData?.totalOrders || 0} orders
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </MUICard>
                      </Grid>
                    </Grid>
                  )}
                </>
              )}
            </div>
          </Col>
        </Row>

        {/* Product Views Breakdown Modal */}
        <Dialog
          open={viewsModalOpen}
          onClose={handleCloseViewsModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                View Breakdown
                {selectedProduct && (
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: '4px' }}>
                    {getProductDetails(selectedProduct.productId)?.title || selectedProduct.productId}
                  </Typography>
                )}
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleCloseViewsModal}
                aria-label="close"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>


          <DialogContent dividers style={{ padding: 0 }}>
            {loadingBreakdown ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : productViewsBreakdown ? (
              <Box>
                <Box style={{ padding: '20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" style={{ fontSize: '1.1rem' }}>
                    Total Views: <strong>{productViewsBreakdown.total || selectedProduct?.views || 0}</strong>
                  </Typography>
                </Box>

                {/* Web Platform Accordion */}
                <Accordion defaultExpanded={productViewsBreakdown?.web?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box
                          component="span"
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#1976d2',
                            marginRight: 12
                          }}
                        />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Web</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip
                          label={`${productViewsBreakdown.web?.total || 0} views`}
                          size="small"
                          style={{ backgroundColor: '#e3f2fd', fontWeight: 500 }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          {productViewsBreakdown.total
                            ? `${((productViewsBreakdown.web?.total || 0) / productViewsBreakdown.total * 100).toFixed(1)}%`
                            : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {productViewsBreakdown.web?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productViewsBreakdown.web.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>
                                  {user?.username || 'Anonymous'}
                                </Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={user?.count}
                                  size="small"
                                  style={{ minWidth: 40, fontSize: '0.7rem' }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">
                          No web views recorded
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* iOS Platform Accordion */}
                <Accordion defaultExpanded={productViewsBreakdown?.ios?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box
                          component="span"
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#2e7d32',
                            marginRight: 12
                          }}
                        />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>iOS</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip
                          label={`${productViewsBreakdown.ios?.total || 0} views`}
                          size="small"
                          style={{ backgroundColor: '#e8f5e9', fontWeight: 500 }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          {productViewsBreakdown.total
                            ? `${((productViewsBreakdown.ios?.total || 0) / productViewsBreakdown.total * 100).toFixed(1)}%`
                            : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {productViewsBreakdown.ios?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productViewsBreakdown.ios.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>
                                  {user?.username || 'Anonymous'}
                                </Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={user?.count}
                                  size="small"
                                  style={{ minWidth: 40, fontSize: '0.7rem' }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">
                          No iOS views recorded
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Android Platform Accordion */}
                <Accordion defaultExpanded={productViewsBreakdown?.android?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box
                          component="span"
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#f50057',
                            marginRight: 12
                          }}
                        />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Android</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip
                          label={`${productViewsBreakdown.android?.total || 0} views`}
                          size="small"
                          style={{ backgroundColor: '#fce4ec', fontWeight: 500 }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          {productViewsBreakdown.total
                            ? `${((productViewsBreakdown.android?.total || 0) / productViewsBreakdown.total * 100).toFixed(1)}%`
                            : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {productViewsBreakdown.android?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productViewsBreakdown.android.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>
                                  {user?.username || 'Anonymous'}
                                </Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={user?.count}
                                  size="small"
                                  style={{ minWidth: 40, fontSize: '0.7rem' }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">
                          No Android views recorded
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Typography variant="body1" color="textSecondary">
                  No view data available for this product.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <MUIButton onClick={handleCloseViewsModal} color="primary">Close</MUIButton>
          </DialogActions>
        </Dialog>

        {/* Cart Additions Breakdown Modal */}
        <Dialog
          open={cartModalOpen}
          onClose={handleCloseCartModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Cart Addition Breakdown
                {selectedCartProduct && (
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: '4px' }}>
                    {getProductDetails(selectedCartProduct.productId)?.title || selectedCartProduct.productId}
                  </Typography>
                )}
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleCloseCartModal}
                aria-label="close"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers style={{ padding: 0 }}>
            {loadingCartBreakdown ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : cartBreakdown ? (
              <Box>
                <Box style={{ padding: '20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" style={{ fontSize: '1.1rem' }}>
                    Total Additions: <strong>{cartBreakdown.total || selectedCartProduct?.adds || 0}</strong>
                  </Typography>
                </Box>

                {/* Web Platform */}
                <Accordion defaultExpanded={cartBreakdown.web?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1976d2', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Web</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${cartBreakdown.web?.total || 0} additions`} size="small" style={{ backgroundColor: '#e3f2fd', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {cartBreakdown.total ? `${((cartBreakdown.web?.total || 0) / cartBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {cartBreakdown.web?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Additions</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Added</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cartBreakdown.web.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No web additions recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* iOS Platform */}
                <Accordion defaultExpanded={cartBreakdown.ios?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2e7d32', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>iOS</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${cartBreakdown.ios?.total || 0} additions`} size="small" style={{ backgroundColor: '#e8f5e9', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {cartBreakdown.total ? `${((cartBreakdown.ios?.total || 0) / cartBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {cartBreakdown.ios?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Additions</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Added</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cartBreakdown.ios.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No iOS additions recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Android Platform */}
                <Accordion defaultExpanded={cartBreakdown?.android?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f50057', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Android</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${cartBreakdown.android?.total || 0} additions`} size="small" style={{ backgroundColor: '#fce4ec', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {cartBreakdown.total ? `${((cartBreakdown.android?.total || 0) / cartBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {cartBreakdown.android?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Additions</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Added</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cartBreakdown.android.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No Android additions recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Typography variant="body1" color="textSecondary">No cart addition data available.</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <MUIButton onClick={handleCloseCartModal} color="primary">Close</MUIButton>
          </DialogActions>
        </Dialog>

        {/* Page Views Breakdown Modal */}
        <Dialog
          open={pageViewModalOpen}
          onClose={handleClosePageViewModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Page View Breakdown
                {selectedPage && (
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: '4px' }}>
                    {selectedPage.page}
                  </Typography>
                )}
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleClosePageViewModal}
                aria-label="close"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers style={{ padding: 0 }}>
            {loadingPageViewBreakdown ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : pageViewBreakdown ? (
              <Box>
                <Box style={{ padding: '20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" style={{ fontSize: '1.1rem' }}>
                    Total Views: <strong>{pageViewBreakdown.total || selectedPage?.views || 0}</strong>
                  </Typography>
                </Box>

                {/* Web Platform */}
                <Accordion defaultExpanded={pageViewBreakdown?.web?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1976d2', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Web</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${pageViewBreakdown.web?.total || 0} views`} size="small" style={{ backgroundColor: '#e3f2fd', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {pageViewBreakdown.total ? `${((pageViewBreakdown.web?.total || 0) / pageViewBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {pageViewBreakdown.web?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pageViewBreakdown.web.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No web views recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* iOS Platform */}
                <Accordion defaultExpanded={pageViewBreakdown?.ios?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2e7d32', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>iOS</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${pageViewBreakdown.ios?.total || 0} views`} size="small" style={{ backgroundColor: '#e8f5e9', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {pageViewBreakdown.total ? `${((pageViewBreakdown.ios?.total || 0) / pageViewBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {pageViewBreakdown.ios?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pageViewBreakdown.ios.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No iOS views recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Android Platform */}
                <Accordion defaultExpanded={pageViewBreakdown?.android?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f50057', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Android</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${pageViewBreakdown.android?.total || 0} views`} size="small" style={{ backgroundColor: '#fce4ec', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {pageViewBreakdown.total ? `${((pageViewBreakdown.android?.total || 0) / pageViewBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {pageViewBreakdown.android?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pageViewBreakdown.android.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No Android views recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Typography variant="body1" color="textSecondary">No page view data available.</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <MUIButton onClick={handleClosePageViewModal} color="primary">Close</MUIButton>
          </DialogActions>
        </Dialog>

        {/* Category Views Breakdown Modal */}
        <Dialog
          open={categoryModalOpen}
          onClose={handleCloseCategoryModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Category View Breakdown
                {selectedCategory && (
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: '4px' }}>
                    {selectedCategory.name || selectedCategory.categoryId}
                  </Typography>
                )}
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleCloseCategoryModal}
                aria-label="close"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers style={{ padding: 0 }}>
            {loadingCategoryBreakdown ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : categoryBreakdown ? (
              <Box>
                <Box style={{ padding: '20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" style={{ fontSize: '1.1rem' }}>
                    Total Views: <strong>{categoryBreakdown.total || selectedCategory?.views || 0}</strong>
                  </Typography>
                </Box>

                {/* Web Platform */}
                <Accordion defaultExpanded={categoryBreakdown?.web?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1976d2', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Web</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${categoryBreakdown.web?.total || 0} views`} size="small" style={{ backgroundColor: '#e3f2fd', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {categoryBreakdown.total ? `${((categoryBreakdown.web?.total || 0) / categoryBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {categoryBreakdown.web?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryBreakdown.web.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No web views recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* iOS Platform */}
                <Accordion defaultExpanded={categoryBreakdown?.ios?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2e7d32', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>iOS</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${categoryBreakdown.ios?.total || 0} views`} size="small" style={{ backgroundColor: '#e8f5e9', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {categoryBreakdown.total ? `${((categoryBreakdown.ios?.total || 0) / categoryBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {categoryBreakdown.ios?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryBreakdown.ios.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No iOS views recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Android Platform */}
                <Accordion defaultExpanded={categoryBreakdown?.android?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f50057', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Android</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${categoryBreakdown.android?.total || 0} views`} size="small" style={{ backgroundColor: '#fce4ec', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {categoryBreakdown.total ? `${((categoryBreakdown.android?.total || 0) / categoryBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {categoryBreakdown.android?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryBreakdown.android.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No Android views recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Typography variant="body1" color="textSecondary">No category view data available.</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <MUIButton onClick={handleCloseCategoryModal} color="primary">Close</MUIButton>
          </DialogActions>
        </Dialog>

        {/* Subcategory Views Breakdown Modal */}
        <Dialog
          open={subcategoryModalOpen}
          onClose={handleCloseSubcategoryModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Subcategory View Breakdown
                {selectedSubcategory && (
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: '4px' }}>
                    {selectedSubcategory.name || selectedSubcategory.subCategoryId}
                  </Typography>
                )}
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleCloseSubcategoryModal}
                aria-label="close"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers style={{ padding: 0 }}>
            {loadingSubcategoryBreakdown ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : subcategoryBreakdown ? (
              <Box>
                <Box style={{ padding: '20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" style={{ fontSize: '1.1rem' }}>
                    Total Views: <strong>{subcategoryBreakdown.total || selectedSubcategory?.views || 0}</strong>
                  </Typography>
                </Box>

                {/* Web Platform */}
                <Accordion defaultExpanded={subcategoryBreakdown?.web?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1976d2', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Web</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${subcategoryBreakdown.web?.total || 0} views`} size="small" style={{ backgroundColor: '#e3f2fd', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {subcategoryBreakdown.total ? `${((subcategoryBreakdown.web?.total || 0) / subcategoryBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {subcategoryBreakdown.web?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subcategoryBreakdown.web.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No web views recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* iOS Platform */}
                <Accordion defaultExpanded={subcategoryBreakdown?.ios?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2e7d32', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>iOS</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${subcategoryBreakdown.ios?.total || 0} views`} size="small" style={{ backgroundColor: '#e8f5e9', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {subcategoryBreakdown.total ? `${((subcategoryBreakdown.ios?.total || 0) / subcategoryBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {subcategoryBreakdown.ios?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subcategoryBreakdown.ios.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No iOS views recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Android Platform */}
                <Accordion defaultExpanded={subcategoryBreakdown?.android?.total > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f50057', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Android</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} marginRight={2}>
                        <Chip label={`${subcategoryBreakdown.android?.total || 0} views`} size="small" style={{ backgroundColor: '#fce4ec', fontWeight: 500 }} />
                        <Typography variant="body2" color="textSecondary">
                          {subcategoryBreakdown.total ? `${((subcategoryBreakdown.android?.total || 0) / subcategoryBreakdown.total * 100).toFixed(1)}%` : '0%'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {subcategoryBreakdown.android?.users?.length > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Views</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Last Viewed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subcategoryBreakdown.android.users.map((user, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{user?.username || 'Anonymous'}</Typography>
                                {(typeof user?.userId === 'string' || typeof user?.userId === 'number') && String(user?.userId) !== 'anonymous' && (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {String(user?.userId).substring(0, 8)}...
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={user?.count} size="small" style={{ minWidth: 40, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(user?.lastViewTimestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No Android views recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Typography variant="body1" color="textSecondary">No subcategory view data available.</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <MUIButton onClick={handleCloseSubcategoryModal} color="primary">Close</MUIButton>
          </DialogActions>
        </Dialog>

        {/* Mobile Sessions Modal */}
        <Dialog
          open={mobileSessionsModalOpen}
          onClose={handleCloseMobileSessionsModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Mobile App Sessions
                <Typography variant="body2" color="textSecondary" style={{ marginTop: '4px' }}>
                  Each session = 1 app open (from launch to background)
                </Typography>
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleCloseMobileSessionsModal}
                aria-label="close"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers style={{ padding: 0 }}>
            {mobileSessionsData ? (
              <Box>
                <Box style={{ padding: '20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">Total Sessions</Typography>
                      <Typography variant="h5">{mobileSessionsData?.totalSessions || 0}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">iOS Sessions</Typography>
                      <Typography variant="h5" style={{ color: '#2e7d32' }}>{mobileSessionsData?.iosSessions || 0}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">Android Sessions</Typography>
                      <Typography variant="h5" style={{ color: '#f50057' }}>{mobileSessionsData?.androidSessions || 0}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* iOS Sessions */}
                <Accordion defaultExpanded={(mobileSessionsData?.sessions?.ios?.length || 0) > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2e7d32', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>iOS Sessions</Typography>
                      </Box>
                      <Chip label={`${mobileSessionsData?.iosSessions || 0} sessions`} size="small" style={{ backgroundColor: '#e8f5e9', fontWeight: 500, marginRight: 16 }} />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {(mobileSessionsData?.sessions?.ios?.length || 0) > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Device</TableCell>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>App Version</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mobileSessionsData.sessions.ios.map((session, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{session?.username || 'Anonymous'}</Typography>
                                {(() => {
                                  const shortUserId = getShortUserId(session?.userId);
                                  return shortUserId ? (
                                    <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                      ID: {shortUserId}
                                    </Typography>
                                  ) : null;
                                })()}
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" style={{ fontSize: '0.7rem' }}>
                                  {session?.deviceInfo?.deviceModel || 'iOS Device'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={session?.appVersion || 'Unknown'} size="small" style={{ fontSize: '0.65rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(session.timestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No iOS sessions recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Android Sessions */}
                <Accordion defaultExpanded={(mobileSessionsData?.sessions?.android?.length || 0) > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#f9fafb' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center">
                        <Box component="span" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f50057', marginRight: 12 }} />
                        <Typography variant="body1" style={{ fontWeight: 600 }}>Android Sessions</Typography>
                      </Box>
                      <Chip label={`${mobileSessionsData?.androidSessions || 0} sessions`} size="small" style={{ backgroundColor: '#fce4ec', fontWeight: 500, marginRight: 16 }} />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails style={{ padding: 0 }}>
                    {(mobileSessionsData?.sessions?.android?.length || 0) > 0 ? (
                      <MUITable size="small">
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#fafafa' }}>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Device</TableCell>
                            <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>App Version</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mobileSessionsData.sessions.android.map((session, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" style={{ fontWeight: 500 }}>{session?.username || 'Anonymous'}</Typography>
                                {(() => {
                                  const shortUserId = getShortUserId(session?.userId);
                                  return shortUserId ? (
                                    <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                      ID: {shortUserId}
                                    </Typography>
                                  ) : null;
                                })()}
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" style={{ fontSize: '0.7rem' }}>
                                  {session?.deviceInfo?.deviceModel || 'Android Device'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={session?.appVersion || 'Unknown'} size="small" style={{ fontSize: '0.65rem' }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(session.timestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </MUITable>
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="textSecondary">No Android sessions recorded</Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <CircularProgress />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <MUIButton onClick={handleCloseMobileSessionsModal} color="primary">Close</MUIButton>
          </DialogActions>
        </Dialog>

        {/* Web Sessions Modal */}
        <Dialog
          open={webSessionsModalOpen}
          onClose={handleCloseWebSessionsModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Web Sessions
                <Typography variant="body2" color="textSecondary" style={{ marginTop: '4px' }}>
                  Browser sessions tracked by page views
                </Typography>
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleCloseWebSessionsModal}
                aria-label="close"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers style={{ padding: 0 }}>
            {webSessionsData ? (
              <Box>
                <Box style={{ padding: '20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Total Sessions</Typography>
                      <Typography variant="h5">{webSessionsData?.totalSessions || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Total Page Views</Typography>
                      <Typography variant="h5" style={{ color: '#1976d2' }}>{webSessionsData?.totalPageViews || 0}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Sessions Table */}
                {(webSessionsData?.sessions?.length || 0) > 0 ? (
                  <Box style={{ padding: 0 }}>
                    <MUITable size="small">
                      <TableHead>
                        <TableRow style={{ backgroundColor: '#fafafa' }}>
                          <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>User</TableCell>
                          <TableCell style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Pages Viewed</TableCell>
                          <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Session Start</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {webSessionsData.sessions.slice(0, 50).map((session, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>
                              <Typography variant="body2" style={{ fontWeight: 500 }}>{session?.username || 'Anonymous'}</Typography>
                              {(() => {
                                const shortUserId = getShortUserId(session?.userId);
                                return shortUserId ? (
                                  <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.65rem' }}>
                                    ID: {shortUserId}
                                  </Typography>
                                ) : null;
                              })()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${session?.pageViews || 0} pages`}
                                size="small"
                                style={{ fontSize: '0.65rem', backgroundColor: '#e3f2fd' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption" color="textSecondary">
                                {new Date(session.timestamp).toLocaleString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </MUITable>
                    {webSessionsData.sessions.length > 50 && (
                      <Box p={2} textAlign="center" style={{ backgroundColor: '#f5f5f5' }}>
                        <Typography variant="caption" color="textSecondary">
                          Showing 50 of {webSessionsData.sessions.length} sessions
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box p={8} textAlign="center">
                    <Typography variant="body2" color="textSecondary">No web sessions recorded</Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <CircularProgress />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <MUIButton onClick={handleCloseWebSessionsModal} color="primary">Close</MUIButton>
          </DialogActions>
        </Dialog>

      </div>
    </>
  );
}

export default Dashboard;
