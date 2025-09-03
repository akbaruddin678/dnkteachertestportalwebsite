import React, { useState, useRef, useEffect } from "react";
import "./SAHeader.css";
import { FiBell, FiUser, FiMenu, FiSun, FiMoon } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// const navItems = [
//   { id: "/superadmin/dashboard", label: "Dashboard" },
//   { id: "/superadmin/manageteachers", label: "Teachers" },
//   { id: "/superadmin/managestudents", label: "Students" },
//   { id: "/superadmin/courses", label: "Courses" },
//   { id: "/superadmin/settings", label: "Settings" },
// ];

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  // const location = window.location.pathname;
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowModal(false);
    // Perform logout logic
    navigate("/");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="hamburger-btn"
          onClick={onToggleSidebar}
          title="Menu"
        >
          <FiMenu size={22} />
        </button>

        <div className="greeting">
          <h1 style={{
            marginBottom:"0"
          }} className="greeting-title">
           Welcome Admin
          </h1>
        </div>
      </div>

      <div className="header-right">
        {/* <nav className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.id}
              className={`nav-link ${location === item.id ? "active" : ""}`}
              title={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav> */}
{/* 
        <button
          className="icon-button notification-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <FiBell size={20} />
          <span className="badge">3</span>
        </button> */}

        {/* <button
          className="icon-button darkmode-btn"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle Dark Mode"
        >
          {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button> */}

        <div className="profile-container">
          <button
            className="icon-button avatar-btn"
            aria-label="Profile"
            onClick={() => setShowModal(!showModal)}
            title="Profile Options"
          >
            <FiUser size={22} />
          </button>

          {showModal && (
            <div className="profile-modal" ref={modalRef}>
              <div className="user-info">
                {/* <strong>Maietry</strong> */}
                <span>Super Admin</span>
              </div>

              <button
                className="modal-btn"
                onClick={() => {
                  setShowModal(false);
                  navigate("/profile");
                }}
              >
                View Profile
              </button>

              <button
                className="modal-btn"
                onClick={() => navigate("/superadmin/settings")}
              >
                Account Settings
              </button>

              <hr className="modal-divider" />
              <button className="modal-btn logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
