import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.css";
import "assets/scss/now-ui-dashboard.scss?v1.5.0";
import "assets/css/demo.css";

import AdminLayout from "layouts/Admin.js";
import FinancialLayout from "layouts/financial.js";
import Login from "../src/views/Login";
import MesobFinanceLogin from "views/MesobFinanceLogin";
import ForgotPassword from "views/ForgotPassword";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Routes>
      {/* Route for the Login page */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/mesonfinancelogin" element={<MesobFinanceLogin />} />

      {/* Admin routes */}
      <Route path="/financial/*" element={<FinancialLayout />} />

      {/* Admin routes */}
      <Route path="/admin/*" element={<AdminLayout />} />

      {/* Seller routes */}
      <Route path="/seller/*" element={<AdminLayout />} />

      {/* Redirect any unknown routes to /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);
