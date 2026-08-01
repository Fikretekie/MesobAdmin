import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NotificationAlert from "react-notification-alert";
import "react-notification-alert/dist/animate.css";
import { Helmet } from "react-helmet";
import logo from "logo.jpeg";
import { Spinner } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const MesobFinanceAuth = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const notificationAlertRef = useRef(null);
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [beginningCash, setBeginningCash] = useState("");
  const [outstandingDebt, setOutstandingDebt] = useState("");
  const [startFromZero, setStartFromZero] = useState(false);
  useEffect(() => {
    const userEmail = localStorage.getItem("user_email");
    if (userEmail) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const showNotification = (type, message) => {
    const options = {
      place: "tr",
      message: <div>{message}</div>,
      type: type,
      icon: "now-ui-icons ui-1_bell-53",
      autoDismiss: 5,
    };
    notificationAlertRef.current.notificationAlert(options);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/MesobFinancialSystem/Signin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password: password }),
        }
      );

      const result = await response.json();
      console.log();

      if (result.message === "Sign-in successful") {
        localStorage.setItem("user_email", result.user.email);
        localStorage.setItem("user_name", result.user.name);
        showNotification("success", "Login successful!");
        setTimeout(() => navigate("/financial/dashboard"), 1000);
      } else {
        showNotification("danger", "Invalid email or password. Please try again.");
      }
    } catch (error) {
      showNotification("danger", "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(
        "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/MesobFinancialSystem/SignUp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            companyName,
            businessType,
            beginningCash: startFromZero ? 0 : parseFloat(beginningCash),
            outstandingDebt: startFromZero ? 0 : parseFloat(outstandingDebt),
          }),
        }
      );
      const result = await response.json();
      if (result.message === "User registered successfully") {
        showNotification("success", "Sign up successful! Please log in.");
        setActiveTab("login");
      } else {
        showNotification("danger", "Sign up failed. Please try again.");
      }
    } catch (error) {
      showNotification("danger", "An error occurred during sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Helmet>
        <title>{activeTab === "login" ? "Login" : "Sign Up"} - Mesob Store</title>
      </Helmet>
      <div className="auth-container">
        <NotificationAlert ref={notificationAlertRef} />
        <div className="auth-box">
          <img src={logo} alt="Logo" className="logo_img" />
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
            <button
              className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => setActiveTab("signup")}
            >
              Sign Up
            </button>
          </div>
          {activeTab === "login" ? (
            <form onSubmit={handleLogin}>
              <h2>Login</h2>
              <p>Welcome! Login to access the Mesob Financial Services</p>
              <div className="auth-input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="auth-input-group">
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
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} size="lg" />
                  </button>
                </div>
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner color="secondary" size="sm" /> Please wait
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <h2>Sign Up</h2>
              <p>Create an account to access Mesob Financial Services</p>

              <div className="explanation-box">
                <p>To get started, we need to know where your business stands financially today. This includes how much cash you have, any money owed to you, any debt you owe, and any valuable items (like inventory) you own. This helps us build an accurate financial picture of your business (recommended).</p>
                <button type="button" className="start-from-zero" onClick={() => setStartFromZero(true)}>
                  Start from zero
                </button>
              </div>

              <div className="signup-grid">
                <div className="column">
                  <div className="auth-input-group">
                    <label>Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                  </div>
                  <div className="auth-input-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                </div>
                <div className="column">
                  <div className="auth-input-group">
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
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} size="lg" />
                      </button>
                    </div>
                  </div>
                  <div className="auth-input-group">
                    <label>Company Name</label>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="signup-row">
                <div className="auth-input-group">
                  <label>Type of Business</label>
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} required>
                    <option value="">Select business type</option>
                    <option value="trucking">Trucking</option>
                    <option value="groceries">Groceries</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                {!startFromZero && (
                  <>
                    <div className="auth-input-group">
                      <label>Beginning Cash</label>
                      <input type="number" value={beginningCash} onChange={(e) => setBeginningCash(e.target.value)} step="0.01" />
                    </div>
                    <div className="auth-input-group">
                      <label>Outstanding Debt</label>
                      <input type="number" value={outstandingDebt} onChange={(e) => setOutstandingDebt(e.target.value)} step="0.01" />
                    </div>
                  </>
                )}
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner color="secondary" size="sm" />
                    Please wait
                  </>
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>



          )}
        </div>
      </div>
      <style jsx>{`
        body {
          background-color: #f0f2f5;
        }
        .auth-container {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
          .signup-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .column {
          display: flex;
          flex-direction: column;
        }

        @media screen and (max-width: 768px) {
          .signup-grid {
            grid-template-columns: 1fr;
          }
        }

          .explanation-box {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
          text-align: left;
        }
      .signup-row {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
      }

      .signup-row .auth-input-group {
        flex: 1;
      }

      @media screen and (max-width: 768px) {
        .signup-row {
          flex-direction: column;
        }
      }

        .start-from-zero {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }

        .start-from-zero:hover {
          background-color: #218838;
        }

        select {
          width: 100%;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #ccc;
          font-size: 16px;
          background-color: white;
        }

        .auth-box {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 1200px;
            text-align: center;
        }
        h2 {
          margin-bottom: 20px;
          color: #333333;
        }
          .signup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .column {
          display: flex;
          flex-direction: column;
        }

        @media screen and (max-width: 768px) {
          .signup-grid {
            grid-template-columns: 1fr;
          }
        }

        .auth-tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .auth-tab {
          padding: 10px 20px;
          background-color: #f0f0f0;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s, color 0.3s;
        }
        .auth-tab.active {
          background-color: #007bff;
          color: white;
        }
        .auth-input-group {
          margin-bottom: 15px;
          text-align: left;
        }
        .auth-input-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #555555;
        }
        .auth-input-group input {
          width: 100%;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #ccc;
          font-size: 16px;
        }
        .auth-btn {
          background-color: #007bff;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          width: 100%;
        }
        .auth-btn:hover {
          background-color: #0056b3;
        }
        .logo_img {
          width: 100px;
          margin-bottom: 20px;
        }
        .password-container {
          position: relative;
        }
        .password-container input {
          width: calc(100% - 40px);
        }
        .toggle-password {
          position: absolute;
          top: calc(50% - 8px);
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
        }
        @media screen and (max-width: 768px) {
          .auth-box {
            padding: 15px;
            width: 90%;
          }
          h2 {
            font-size: 24px;
          }
          .auth-input-group input {
            font-size: 14px;
          }
          .auth-btn {
            font-size: 14px;
          }
        }
        @media screen and (max-width: 480px) {
          h2 {
            font-size: 20px;
          }
          .auth-input-group input {
            font-size: 12px;
          }
          .auth-btn {
            font-size: 12px;
            padding: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default MesobFinanceAuth;
