import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock } from "react-icons/md";
import { FaFacebookF, FaWhatsapp, FaInstagram, FaGoogle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      // navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Modern gradient color scheme
  const colors = {
    primary: "#4361ee",
    primaryLight: "#4895ef",
    secondary: "#3a0ca3",
    accent: "#f72585",
    light: "#f8f9fa",
    dark: "#212529",
    gray: "#6c757d",
    success: "#4cc9f0",
  };

  // ---------- Modernized Styles ----------
  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      background: "linear-gradient(135deg, #f5f7fa 0%, #e4e7ec 100%)",
      position: "relative",
      overflow: "hidden",
    },
    left: {
      flex: 1,
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "50px 30px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    },
    leftDecoration: {
      position: "absolute",
      top: "-50px",
      left: "-50px",
      width: "200px",
      height: "200px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.1)",
    },
    leftDecoration2: {
      position: "absolute",
      bottom: "-80px",
      right: "-80px",
      width: "300px",
      height: "300px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.1)",
    },
    tagline: {
      marginTop: "30px",
      fontSize: "28px",
      fontWeight: 700,
      color: "#fff",
      lineHeight: 1.4,
      maxWidth: "500px",
      zIndex: 1,
      textShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    featureList: {
      marginTop: "40px",
      textAlign: "left",
      color: "rgba(255,255,255,0.9)",
      fontSize: "16px",
      zIndex: 1,
    },
    featureItem: {
      marginBottom: "15px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    socials: {
      marginTop: "40px",
      display: "flex",
      gap: "20px",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    socialIcon: {
      fontSize: "20px",
      color: "#fff",
      cursor: "pointer",
      transition: "all 0.3s ease",
      padding: "12px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    right: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    },
    card: {
      width: "100%",
      maxWidth: "450px",
      padding: "40px",
      borderRadius: "16px",
      background: "#ffffff",
      boxShadow: "0 15px 35px rgba(50,50,93,0.1), 0 5px 15px rgba(0,0,0,0.07)",
      position: "relative",
      zIndex: 1,
    },
    title: {
      textAlign: "center",
      fontSize: "28px",
      fontWeight: 800,
      marginBottom: "8px",
      color: colors.dark,
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    subtitle: {
      textAlign: "center",
      marginBottom: "30px",
      color: colors.gray,
      fontSize: "16px",
    },
    error: {
      textAlign: "center",
      color: "#d9534f",
      background: "#fcebea",
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "20px",
      fontSize: "14px",
      borderLeft: `4px solid #d9534f`,
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: 600,
      color: colors.dark,
      fontSize: "14px",
      // display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    inputContainer: {
      position: "relative",
      marginBottom: "20px",
    },
    inputIcon: {
      position: "absolute",
      left: "15px",
      top: "50%",
      transform: "translateY(-50%)",
      color: colors.gray,
      fontSize: "20px",
    },
    input: {
      width: "100%",
      padding: "16px",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      fontSize: "16px",
      outline: "none",
      transition: "all 0.3s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      backgroundColor: "#f8fafc",
    },
    inputFocus: {
      borderColor: colors.primaryLight,
      boxShadow: `0 0 0 3px rgba(67, 97, 238, 0.15)`,
      backgroundColor: "#fff",
    },
    passwordField: {
      position: "relative",
    },
    toggleIcon: {
      position: "absolute",
      top: "50%",
      right: "15px",
      transform: "translateY(-50%)",
      color: colors.gray,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "22px",
    },
    button: {
      width: "100%",
      padding: "16px",
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontSize: "16px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 6px rgba(67, 97, 238, 0.3)",
      marginTop: "10px",
    },
    buttonDisabled: {
      opacity: 0.7,
      cursor: "not-allowed",
      transform: "none",
    },
    divider: {
      display: "flex",
      alignItems: "center",
      margin: "25px 0",
      color: colors.gray,
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      backgroundColor: "#e2e8f0",
    },
    dividerText: {
      padding: "0 15px",
      fontSize: "14px",
    },
    googleButton: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#fff",
      color: colors.gray,
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      fontSize: "16px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    footerLinks: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "20px",
      fontSize: "14px",
    },
    link: {
      color: colors.primary,
      textDecoration: "none",
      fontWeight: 500,
      transition: "all 0.2s ease",
    },
  };

  // Track focus to apply focus style inline
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <div className="main-login-container" style={styles.container}>
      {/* Left side */}
      <div className="hide-on-mobile" style={styles.left}>
        <div style={styles.leftDecoration}></div>
        <div style={styles.leftDecoration2}></div>

        <h1
          style={{
            fontSize: "42px",
            fontWeight: 800,
            color: "#fff",
            margin: 0,
            zIndex: 1,
            textShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          DNK LMS
        </h1>

        <h2 style={styles.tagline}>
          Transform Your Learning Experience With Our Modern Platform
        </h2>

        <div style={styles.featureList}>
          <div style={styles.featureItem}>
            <span>✓</span> Interactive course materials
          </div>
          <div style={styles.featureItem}>
            <span>✓</span> Progress tracking & analytics
          </div>
          <div style={styles.featureItem}>
            <span>✓</span> Collaborative learning tools
          </div>
          <div style={styles.featureItem}>
            <span>✓</span> Mobile-friendly platform
          </div>
        </div>

        <div style={styles.socials}>
          <a href="#" aria-label="Facebook" style={styles.socialIcon}>
            <FaFacebookF />
          </a>
          <a href="#" aria-label="WhatsApp" style={styles.socialIcon}>
            <FaWhatsapp />
          </a>
          <a href="#" aria-label="Instagram" style={styles.socialIcon}>
            <FaInstagram />
          </a>
        </div>
      </div>

      {/* Right side */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Welcome to DNK LMS</h2>
          <p style={styles.subtitle}>
            Sign in to continue your learning journey
          </p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.inputContainer}>
              <label style={styles.label}>
                <MdEmail /> Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={{
                  ...styles.input,
                  width: "93%",
                  ...(emailFocused ? styles.inputFocus : {}),
                }}
              />
            </div>

            <div style={styles.inputContainer}>
              <label style={styles.label}>
                <MdLock /> Password
              </label>
              <div style={styles.passwordField}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  style={{
                    ...styles.input,
                    width: "93%",
                    ...(passwordFocused ? styles.inputFocus : {}),
                  }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.toggleIcon}
                  title={showPassword ? "Hide password" : "Show password"}
                  role="button"
                  tabIndex="0"
                >
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 7px 14px rgba(67, 97, 238, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 6px rgba(67, 97, 238, 0.3)";
                }
              }}
            >
              {loading ? "Logging in..." : "Login to Account"}
            </button>
          </form>

          {/* <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <div style={styles.dividerText}>or continue with</div>
            <div style={styles.dividerLine}></div>
          </div> */}
          {/* 
          <button
            style={styles.googleButton}
            onMouseOver={(e) => {
              e.target.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            <FaGoogle style={{ color: "#DB4437" }} />
            Sign in with Google
          </button> */}
          {/* 
          <div style={styles.footerLinks}>
            <a href="#" style={styles.link}>
              Create an account
            </a>
            <a href="#" style={styles.link}>
              Forgot password?
            </a>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;