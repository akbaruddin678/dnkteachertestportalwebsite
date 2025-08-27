import { useState, useRef, useEffect } from "react";
import "./Header.css";
import { FiBell, FiUser, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const CoordinatorHeader = ({ campus, onToggleSidebar }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
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
          <h1 className="greeting-title">
            Hello Coordinator{" "}
            <span role="img" aria-label="wave">
              👋
            </span>
          </h1>
          <p className="greeting-subtitle">
            Campus: {campus || "Select a campus"}
          </p>
        </div>
      </div>

      <div className="header-right">
        <button
          className="icon-button notification-btn"
          aria-label="Notifications"
        >
          <FiBell size={20} />
          <span className="badge">3</span>
        </button>

        <div className="profile-container">
          <button
            className="icon-button avatar-btn"
            aria-label="Profile"
            onClick={() => setShowModal(!showModal)}
          >
            <FiUser size={24} />
          </button>

          {showModal && (
            <div className="profile-modal" ref={modalRef}>
              <div className="user-info">
                <strong>Maietry</strong>
                <span>Coordinator</span>
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
                onClick={() => navigate("/coordinator/settings")}
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

export default CoordinatorHeader;
