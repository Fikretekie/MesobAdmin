import Dashboard from "views/Dashboard.js";
import Notifications from "views/Notifications.js";
import UserPage from "views/UserPage.js";
import Users from "views/Users.js";
import PromoCodes from "views/PromoCodes.js";
import Products from "components/Products/ProductsPage";
import Categories from "views/Categories.js";
import SellerProductManagement from "views/SellerProductManagement.js";
import SellerSubcategoryManagement from "views/SellerSubcategoryManagement.js";
import SellerOrders from "views/SellerOrders.js";
import Orders from "views/Orders.js";
import Cart from "views/Cart";
import OrderDetails from "views/OrderDetails";
import EditOrder from "views/EditOrder";
import MesobFinancial from "views/MesobFinancial";

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
