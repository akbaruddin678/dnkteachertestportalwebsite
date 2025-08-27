import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import { FiBell, FiUser, FiMenu } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';

// const navItems = [
//   { id: "/teacher/dashboard", label: "Dashboard" },
//   { id: "/teacher/managestudents", label: "Students" },
//   { id: "/teacher/courses", label: "Courses" },
//   { id: "/teacher/reports", label: "Report" },
//   { id: "/teacher/settings", label: "Settings" },
// ];

const TeacherHeader = ({ onToggleSidebar }) => {
  // const location = window.location.pathname;
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowModal(false);
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onToggleSidebar}>
          <FiMenu size={24} />
        </button>

        <div className="greeting">
          <h1 className="greeting-title">Welcome To DNK LMS </h1>
          {/* <p className="greeting-subtitle">Let's learn something new today!</p> */}
        </div>
      </div>

      <div className="header-right">
        {/* <nav className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.id}
              className={`nav-link ${location === item.id ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav> */}

        {/* <button
          className="icon-button notification-btn"
          aria-label="Notifications"
        >
          <FiBell size={20} />
          <span className="badge">3</span>
        </button> */}

        <div className="profile-container">
          <button
            className="icon-button avatar-btn"
            aria-label="Profile"
            onClick={() => setShowModal(!showModal)}
          >
            <FiUser size={15} />
          </button>

          {showModal && (
            <div className="profile-modal" ref={modalRef}>
              <div className="user-info">
                {/* <strong>Maietry</strong> */}
                <strong>
                  <span>Teacher</span>
                </strong>
              </div>

              {/* <button
                className="modal-btn"
                onClick={() => {
                  setShowModal(false);
                  navigate("/profile");
                }}
              >
                View Profile
              </button> */}

              <button
                className="modal-btn"
                onClick={() => navigate("/teacher/settings")}
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

export default TeacherHeader;
