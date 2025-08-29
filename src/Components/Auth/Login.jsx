import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FaFacebookF, FaWhatsapp, FaInstagram } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

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

  // ---------- Inline Styles ----------
  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      fontFamily:
        '"Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif',
      background: "#f5f7fa",
    },
    left: {
      flex: 1,
      background: "#eef2f7",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "50px 30px",
      textAlign: "center",
    },
    tagline: {
      marginTop: 20,
      fontSize: 22,
      fontWeight: 600,
      color: "#0066cc",
      lineHeight: 1.5,
      maxWidth: 520,
    },
    socials: {
      marginTop: 30,
      display: "flex",
      gap: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    socialIcon: {
      fontSize: 18,
      color: "#444",
      cursor: "pointer",
      transition: "transform .2s ease, opacity .2s ease",
      opacity: 0.9,
    },
    right: {
      flex: 1,
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    },
    card: {
      width: "100%",
      maxWidth: 380,
      padding: "35px 40px",
      borderRadius: 12,
      background: "#ffffff",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    },
    title: {
      textAlign: "center",
      fontSize: 26,
      fontWeight: 700,
      marginBottom: 8,
      color: "#222",
    },
    subtitle: {
      textAlign: "center",
      marginBottom: 20,
      color: "#666",
      fontSize: 15,
    },
    error: {
      textAlign: "center",
      color: "#d9534f",
      background: "#fcebea",
      padding: "8px 10px",
      borderRadius: 6,
      marginBottom: 15,
      fontSize: 14,
    },
    label: {
      display: "block",
      marginBottom: 6,
      fontWeight: 600,
      color: "#333",
      fontSize: 14,
    },
    input: {
      width: "100%",
      padding: "15px 12px",
      marginBottom: 16,
      border: "1px solid #ccc",
      borderRadius: 6,
      fontSize: 15,
      outline: "none",
      transition: "border .2s ease, box-shadow .2s ease",
      boxShadow: "0 0 0 0 rgba(0,0,0,0)",
    },
    inputFocus: {
      borderColor: "#0066cc",
      boxShadow: "0 0 0 3px rgba(0,102,204,0.12)",
    },
    passwordField: {
      position: "relative",
    },
    toggleIcon: {
      position: "absolute",
      top: "40%",
      right: 3,
      transform: "translateY(-50%)",
      color: "#666",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: 24,
      width: 24,
    },
    button: {
      width: "100%",
      padding: 12,
      backgroundColor: "#0066cc",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      fontSize: 16,
      cursor: "pointer",
      transition: "opacity .2s ease, transform .02s ease",
    },
    buttonDisabled: {
      opacity: 0.7,
      cursor: "not-allowed",
    },
    // Simple mobile stacking (used by the <style> tag below)
    responsiveWrapper: {
      width: "100%",
    },
  };

  // Track focus to apply focus style inline
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <>
      <div className="stack" style={{ ...styles.container }}>
        {/* Left side */}
        <div className="hide-on-mobile" style={styles.left}>
          <h1
            style={{
              fontSize: "40px",
              fontWeight: 800,
              background: "linear-gradient(90deg, #0066cc, #00b4d8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            DNK LMS
          </h1>

          <h2 style={styles.tagline}>
            DNK Learning Management System Makes Learning Easy!
          </h2>

          <div style={styles.socials}>
            <a href="#" aria-label="Facebook" className="hover-bump">
              <FaFacebookF style={styles.socialIcon} />
            </a>
            <a href="#" aria-label="WhatsApp" className="hover-bump">
              <FaWhatsapp style={styles.socialIcon} />
            </a>
            <a href="#" aria-label="Instagram" className="hover-bump">
              <FaInstagram style={styles.socialIcon} />
            </a>
          </div>
        </div>

        {/* Right side */}
        <div style={{ ...styles.right }}>
          <div className="pad-mobile" style={styles.card}>
            <h2 style={styles.title}>Welcome TO DNKLMS</h2>
            <p style={styles.subtitle}>Login into your account</p>

            {error ? <p style={styles.error}>{error}</p> : null}

            <form onSubmit={handleSubmit} style={styles.responsiveWrapper}>
              <label style={styles.label}>Username/Email</label>
              <input
                type="email"
                placeholder="Enter your Username/Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={{
                  ...styles.input,
                  paddingLeft: "6px",
                  fontSize: "20px",
                  ...(emailFocused ? styles.inputFocus : {}),
                }}
              />

              <label style={styles.label}>Password</label>
              <div style={styles.passwordField}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  style={{
                    ...styles.input,
                    paddingLeft: "6px",
                    fontSize: "20px",
                    ...(passwordFocused ? styles.inputFocus : {}),
                  }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.toggleIcon}
                  title={showPassword ? "Hide password" : "Show password"}
                  role="button"
                >
                  {showPassword ? (
                    <MdVisibilityOff size={22} />
                  ) : (
                    <MdVisibility size={22} />
                  )}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="hover-dim"
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
