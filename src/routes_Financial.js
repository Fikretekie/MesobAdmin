import Financial_Dashboard from "views/Financial_Dashboard";

// import EditOrder from "views/EditOrder";

var dash_FinancialRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "design_app",
    component: <Financial_Dashboard />,
    layout: "/financial",
  },

];
export default dash_FinancialRoutes;
