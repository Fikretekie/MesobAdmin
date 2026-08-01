import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import PerfectScrollbar from "perfect-scrollbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";

// core components
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import Footer from "components/Footer/Footer.js";
import Sidebar from "components/Sidebar/Sidebar.js";

import routes from "routes.js";

var ps;

function Admin(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [backgroundColor, setBackgroundColor] = useState("dark");
  const [showGoToTop, setShowGoToTop] = useState(false);
  const mainPanel = useRef();

  const userRole = useMemo(() => {
    const storedRole = Number(localStorage.getItem("user_role"));
    return Number.isFinite(storedRole) ? storedRole : 0;
  }, []);

  // Detect if we're in /seller or /admin context
  const basePath = useMemo(() => {
    return location.pathname.startsWith("/seller") ? "/seller" : "/admin";
  }, [location.pathname]);

  const accessibleRoutes = useMemo(
    () =>
      routes
        .filter(
          (route) =>
            !route.allowedRoles || route.allowedRoles.includes(userRole)
        )
        .filter((route) => route.layout === basePath), // Filter by base path
    [userRole, basePath]
  );

  const defaultRoute = useMemo(() => {
    if (accessibleRoutes.length > 0) {
      return accessibleRoutes[0].path;
    }
    return "/products"; // Default to products for sellers, or first available route
  }, [accessibleRoutes]);

  // Check user session on component mount
  useEffect(() => {
    const userEmail = localStorage.getItem("user_email");
    if (!userEmail) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(mainPanel.current, {
        suppressScrollX: true,
        suppressScrollY: false,
      });
      document.body.classList.toggle("perfect-scrollbar-on");
    }
    return function cleanup() {
      if (navigator.platform.indexOf("Win") > -1) {
        ps.destroy();
        document.body.classList.toggle("perfect-scrollbar-on");
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    mainPanel.current.scrollTop = 0;
  }, [location]);

  useEffect(() => {
    document.body.classList.add("app-dark-theme");
    document.documentElement.classList.add("app-dark-theme");

    return () => {
      document.body.classList.remove("app-dark-theme");
      document.documentElement.classList.remove("app-dark-theme");
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = mainPanel.current.scrollTop;
      setShowGoToTop(scrollTop > 200);
    };

    const panel = mainPanel.current;
    panel.addEventListener("scroll", handleScroll);

    return () => {
      panel.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const scrollStep = -mainPanel.current.scrollTop / (500 / 15);
    const scrollInterval = setInterval(() => {
      if (mainPanel.current.scrollTop !== 0) {
        mainPanel.current.scrollBy(0, scrollStep);
      } else {
        clearInterval(scrollInterval);
      }
    }, 15);
  };

  return (
    <div className="wrapper app-dark-theme">
      <Sidebar
        {...props}
        routes={accessibleRoutes}
        backgroundColor={backgroundColor}
      />
      <div
        className="main-panel"
        ref={mainPanel}
        style={{ height: "100vh", overflow: "auto" }}
      >
        <DemoNavbar {...props} />
        <Routes>
          {accessibleRoutes.map((prop, key) => (
            <Route path={prop.path} element={prop.component} key={key} exact />
          ))}
          <Route
            path={basePath === "/seller" ? "/seller" : "/admin"}
            element={<Navigate to={`${basePath}${defaultRoute}`} replace />}
          />
        </Routes>
        <Footer fluid />
        {showGoToTop && (
          <button
            className="go-to-top"
            onClick={scrollToTop}
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              opacity: 1,
              transition: "opacity 0.3s ease-in-out",
              backgroundColor: "#2b2b2b",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              fontSize: "20px",
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
              zIndex: 1000,
            }}
            title="Scroll to top of page"
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Admin;
