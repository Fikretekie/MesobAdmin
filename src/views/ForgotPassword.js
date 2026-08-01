import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../assets/css/Login.css";
import NotificationAlert from "react-notification-alert";
import "react-notification-alert/dist/animate.css";
import { Helmet } from "react-helmet";
import logo from "logo.jpeg";
import { Spinner } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const API_BASE = process.env.REACT_APP_MESOB_API_BASE || "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email input, 2: OTP verification, 3: password reset
  const navigate = useNavigate();
  const notificationAlertRef = useRef(null);

  const showNotification = (type, message) => {
    const options = {
      place: "tr",
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification("success", result.message || "Verification code sent to your email. Please check your inbox.");
        setStep(2);
      } else {
        showNotification("danger", result.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("danger", "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      showNotification("danger", "Please enter a valid 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
        }),
      });

      const result = await response.json();

      if (response.ok && result.verified) {
        showNotification("success", "Verification code verified successfully. Please set your new password.");
        setStep(3);
      } else {
        showNotification("danger", result.message || "Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("danger", "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showNotification("danger", "Passwords do not match. Please try again.");
      return;
    }

    if (newPassword.length < 6) {
      showNotification("danger", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/forgot-password/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otp, // Include OTP for verification
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.message === "Password reset successfully") {
        showNotification("success", "Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        showNotification("danger", result.message || "Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("danger", "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - Mesob Store</title>
      </Helmet>
      <div className="login-container">
        <NotificationAlert ref={notificationAlertRef} />
        <div className="login-box">
          <img src={logo} alt="Logo" className="logo_img" />
          <h2>Forgot Password</h2>
          
          {step === 1 ? (
            <>
              <p>Enter your email address to receive a verification code</p>
              <form onSubmit={handleEmailSubmit}>
                <div className="login-input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner color="secondary" size="sm" /> Sending...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            </>
          ) : step === 2 ? (
            <>
              <p>Enter the 6-digit verification code sent to your email</p>
              <form onSubmit={handleOtpVerify}>
                <div className="login-input-group">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    style={{ textAlign: "center", letterSpacing: "8px", fontSize: "20px", fontWeight: "bold" }}
                  />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner color="secondary" size="sm" /> Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#007bff",
                    cursor: "pointer",
                    marginTop: "10px",
                    textDecoration: "underline",
                  }}
                >
                  Back to Email
                </button>
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#007bff",
                    cursor: "pointer",
                    marginTop: "5px",
                    textDecoration: "underline",
                    fontSize: "14px",
                  }}
                >
                  Resend Code
                </button>
              </form>
            </>
          ) : (
            <>
              <p>Set your new password</p>
              <form onSubmit={handlePasswordReset}>
                <div className="login-input-group">
                  <label>New Password</label>
                  <div className="password-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter new password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      <FontAwesomeIcon
                        icon={showNewPassword ? faEyeSlash : faEye}
                        size="lg"
                      />
                    </button>
                  </div>
                </div>
                <div className="login-input-group">
                  <label>Confirm Password</label>
                  <div className="password-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm new password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      <FontAwesomeIcon
                        icon={showConfirmPassword ? faEyeSlash : faEye}
                        size="lg"
                      />
                    </button>
                  </div>
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner color="secondary" size="sm" /> Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#007bff",
                    cursor: "pointer",
                    marginTop: "10px",
                    textDecoration: "underline",
                  }}
                >
                  Back to Verification
                </button>
              </form>
            </>
          )}
          
          <div style={{ marginTop: "20px" }}>
            <Link
              to="/login"
              style={{
                color: "#007bff",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;

