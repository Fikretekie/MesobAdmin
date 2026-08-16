import React from "react";

const Dashboard = React.lazy(() => import("views/Dashboard.js"));
const Notifications = React.lazy(() => import("views/Notifications.js"));
const UserPage = React.lazy(() => import("views/UserPage.js"));
const Users = React.lazy(() => import("views/Users.js"));
const PromoCodes = React.lazy(() => import("views/PromoCodes.js"));
const Products = React.lazy(() => import("components/Products/ProductsPage"));
const Categories = React.lazy(() => import("views/Categories.js"));
const Tickets = React.lazy(() => import("views/Tickets.js"));
const TicketDetail = React.lazy(() => import("views/TicketDetail.js"));
const SellerProductManagement = React.lazy(() => import("views/SellerProductManagement.js"));
const SellerSubcategoryManagement = React.lazy(() => import("views/SellerSubcategoryManagement.js"));
const SellerOrders = React.lazy(() => import("views/SellerOrders.js"));
const Orders = React.lazy(() => import("views/Orders.js"));
const Cart = React.lazy(() => import("views/Cart"));
const OrderDetails = React.lazy(() => import("views/OrderDetails"));
const EditOrder = React.lazy(() => import("views/EditOrder"));
const MesobFinancial = React.lazy(() => import("views/MesobFinancial"));

// import EditOrder from "views/EditOrder";

var dashRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "design_app",
    component: <Dashboard />,
    layout: "/admin",
    allowedRoles: [0],
  },
  {
    path: "/orders",
    name: "Orders",
    icon: "shopping_box",
    component: <Orders />,
    layout: "/admin",
    allowedRoles: [0],
  },
  {
    path: "/cart",
    name: "Cart",
    icon: "shopping_cart-simple",
    component: <Cart />,
    layout: "/admin",
    allowedRoles: [0],
  },
  {
    path: "/products",
    name: "Products",
    icon: "shopping_bag-16",
    component: <Products />,
    layout: "/admin",
  },
  {
    path: "/products",
    name: "Products",
    icon: "shopping_bag-16",
    component: <Products />,
    layout: "/seller",
    allowedRoles: [2],
  },
  {
    path: "/seller-products",
    name: "Product Management",
    icon: "ui-1_simple-add",
    component: <SellerProductManagement />,
    layout: "/seller",
    allowedRoles: [2],
  },
  {
    path: "/seller-products",
    name: "Product Management",
    icon: "ui-1_simple-add",
    component: <SellerProductManagement />,
    layout: "/admin",
    allowedRoles: [2],
  },
  {
    path: "/seller-subcategories",
    name: "Subcategory Management",
    icon: "design_bullet-list-67",
    component: <SellerSubcategoryManagement />,
    layout: "/seller",
    allowedRoles: [2],
  },
  {
    path: "/seller-orders",
    name: "My Orders",
    icon: "shopping_box",
    component: <SellerOrders />,
    layout: "/seller",
    allowedRoles: [2],
  },
  {
    path: "/categories",
    name: "Categories",
    icon: "design_bullet-list-67",
    component: <Categories />,
    layout: "/admin",
    allowedRoles: [0],
  },
  {
    path: "/tickets",
    name: "Tickets",
    icon: "ui-2_chat-round",
    component: <Tickets />,
    layout: "/admin",
    allowedRoles: [0],
  },
  {
    path: "/tickets/:id",
    name: "Ticket Detail",
    invisible: true,
    component: <TicketDetail />,
    layout: "/admin",
    allowedRoles: [0],
  },
  {
    path: "/promo-codes",
    name: "Promo Codes",
    icon: "shopping_tag-content",
    component: <PromoCodes />,
    layout: "/admin",
    allowedRoles: [0],
  },
  {
    path: "/users",
    name: "Users",
    icon: "users_single-02",
    component: <Users />,
    layout: "/admin",
    allowedRoles: [0],
  },
  {
    path: "/notifications",
    name: "Notifications",
    icon: "ui-1_bell-53",
    component: <Notifications />,
    layout: "/admin",
    allowedRoles: [0],
  },
  {
    path: "/order/details/:id",
    name: "Order Details",
    component: <OrderDetails />,
    layout: "/admin",
    invisible: true,
  },
  {
    path: "/order/details/:id",
    name: "Order Details",
    component: <OrderDetails />,
    layout: "/seller",
    invisible: true,
  },
  {
    path: "/order/edit/:id", 
    name: "Edit Order",
    component: <EditOrder />,
    layout: "/admin",
    invisible: true,
  },
  {
    path: "/MesobFinancial",
    name: "Financial Report",
    icon: "business_money-coins",
    component: <MesobFinancial />,
    layout: "/admin",
    allowedRoles: [0],
  },
];
export default dashRoutes;