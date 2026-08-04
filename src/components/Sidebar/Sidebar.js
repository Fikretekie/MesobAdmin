/*!

=========================================================
* Now UI Dashboard React - v1.5.2
=========================================================

* Product Page: https://www.creative-tim.com/product/now-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/now-ui-dashboard-react/blob/main/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
/*eslint-disable*/
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Nav } from "reactstrap";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";

import logo from "logo.jpeg";

var ps;

function Sidebar(props) {
  const getUserRole = () => {
    const stored = localStorage.getItem("user_role");
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const userRole = getUserRole();
  const sidebar = React.useRef();
  const location = useLocation();
  // verifies if routeName is the one active (in browser input)
  const activeRoute = (routeName) => {
    return location.pathname.indexOf(routeName) > -1 ? "active" : "";
  };
  React.useEffect(() => {
    if (navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(sidebar.current, {
        suppressScrollX: true,
        suppressScrollY: false,
      });
    }
    return function cleanup() {
      if (navigator.platform.indexOf("Win") > -1) {
        ps.destroy();
      }
    };
  });
  return (
    <div
      className="sidebar"
      data-color={props.backgroundColor}
      style={{
        background: "transparent",
        padding: "20px 14px",
      }}
    >
      <style>{`
        .sidebar .logo:after {
          display: none !important;
        }
      `}</style>
      <div className="logo" style={{ padding: "0 6px 20px", border: "none" }}>
        <a href="#" className="simple-text logo-mini">
          <div className="logo-img">
            <img src={logo} alt="react-logo" />
          </div>
        </a>
        <a
          href="#"
          className="simple-text logo-normal"
          style={{ color: "#fff", fontWeight: 700 }}
        >
          Mesob Store
        </a>
      </div>
      <div className="sidebar-wrapper" ref={sidebar}>
        <Nav>
          {props.routes.map((prop, key) => {
            if (prop.redirect || prop.invisible) return null;
            if (
              prop.allowedRoles &&
              !prop.allowedRoles.includes(userRole)
            ) {
              return null;
            }
            const isActive = activeRoute(prop.layout + prop.path) === "active";
            return (
              <li
                key={key}
                style={{
                  listStyle: "none",
                  borderRadius: "12px",
                  marginBottom: "4px",
                  background: isActive
                    ? "linear-gradient(90deg, #a78bfa, #60a5fa)"
                    : "transparent",
                  boxShadow: isActive
                    ? "0 4px 14px rgba(167,139,250,0.35)"
                    : "none",
                }}
              >
                <NavLink
                  to={prop.layout + prop.path}
                  className="nav-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "11px 14px",
                    borderRadius: "12px",
                    color: isActive ? "#0a0612" : "rgba(255,255,255,0.55)",
                    fontWeight: isActive ? 700 : 600,
                  }}
                >
                  <i
                    className={"now-ui-icons " + prop.icon}
                    style={{ color: "inherit" }}
                  />
                  <p style={{ margin: 0, color: "inherit" }}>{prop.name}</p>
                </NavLink>
              </li>
            );
          })}
        </Nav>
      </div>
    </div>
  );
}

export default Sidebar;