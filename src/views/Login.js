import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../assets/css/Login.css";
import NotificationAlert from "react-notification-alert";
import "react-notification-alert/dist/animate.css";
import { Helmet } from "react-helmet";
import logo from "logo.jpeg";
import { Spinner } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"; // Import Font Awesome icons

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const notificationAlertRef = useRef(null);

  // Protect the login page: redirect if user is already logged in
  useEffect(() => {
    const userEmail = localStorage.getItem("user_email");
    if (userEmail) {
      const userRole = Number(localStorage.getItem("user_role")) || 0;
      const redirectPath = userRole === 2 ? "/seller/products" : "/admin/dashboard";
      navigate(redirectPath);
    }
  }, [navigate]);

  const showNotification = (type, message) => {
    const options = {
      place: "tr", // top right
      message: (
        <div>
          <div>{message}</div>
        </div>
      ),
      type: type,
      icon: "now-ui-icons ui-1_bell-53",
      autoDismiss: 5,
    };
    notificationAlertRef.current.notificationAlert(options);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            Password: password,
          }),
        }
      );

      const result = await response.json();

      if (result.message == "success") {
        // Store data in localStorage
        console.log("user: ", result.user);

        localStorage.setItem("user_email", result.user.email);
        localStorage.setItem("user_name", result.user.name);
        const parsedRole = Number(result.user?.role);
        const normalizedRole = Number.isFinite(parsedRole) ? parsedRole : 0;
        localStorage.setItem("user_role", String(normalizedRole));

        // Show success notification
        showNotification("success", "Login successful!");

        // Redirect based on role: sellers go to /seller/products, admins to /admin/dashboard
        const redirectPath = normalizedRole === 2 ? "/seller/products" : "/admin/dashboard";
        setTimeout(() => navigate(redirectPath), 1000);

        setLoading(false);
      } else {
        setLoading(false);
        // Show error notification
        showNotification(
          "danger",
          "Invalid email or password. Please try again."
        );
      }
    } catch (error) {
      // Show error notification for network errors or server issues
      showNotification("danger", "An error occurred. Please try again later.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Mesob Store</title>
      </Helmet>
      <div className="login-container">
        <NotificationAlert ref={notificationAlertRef} />
        <div className="login-box">
          <img src={logo} alt="Logo" className="logo_img" />
          <h2>Login</h2>
          <p>Welcome! Login to access the Mesob Store</p>
          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autocomplete={true}
              />
            </div>
            <div className="login-input-group">
              <label>Password</label>
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prevState) => !prevState)}
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    size="lg"
                  />
                </button>
              </div>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <Spinner color="secondary" size="sm" /> Please wait.
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
          <div style={{ marginTop: "15px" }}>
            <Link
              to="/forgot-password"
              style={{
                color: "#007bff",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
