
import "./Sidebar.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdHome, MdSchool, MdCategory, MdHowToReg, MdAssignment,
  MdLibraryBooks, MdNotifications, MdBarChart, MdSettings, MdMenuBook , MdHelp
} from "react-icons/md";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeComponent = location.pathname;

  const menuItems = [
    { id: "/coordinator/dashboard", label: "Dashboard", icon: <MdHome /> },
    { id: "/coordinator/category", label: "Category", icon: <MdCategory /> },
    { id: "/coordinator/registrations", label: "Registrations", icon: <MdAssignment /> },
    { id: "/coordinator/courses", label: "Courses", icon: <MdMenuBook  /> },
    { id: "/coordinator/uploadlessonsplans", label: "Lesson Plans", icon: <MdLibraryBooks /> },
    { id: "/coordinator/notifications", label: "Notifications", icon: <MdNotifications /> },
    { id: "/coordinator/reports", label: "Reports", icon: <MdBarChart /> },
    { id: "/coordinator/attendance", label: "Attendance", icon: <MdHowToReg  /> },
    { id: "/coordinator/settings", label: "Settings", icon: <MdSettings /> },
  ];

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h2
          onClick={() => navigate("/coordinator/dashboard")}
          style={{ cursor: "pointer" }}
        >
          Nclex LMS
        </h2>
      </div>
      <nav className="sidebar-nav" role="navigation">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              activeComponent === item.id ? "active" : ""
            }`}
            onClick={() => {
              navigate(item.id);
              setIsOpen?.(false); // Close on mobile after navigation
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      {/* Bottom item */}
      <div className="sidebar-footer">
        <button
          className={`nav-item ${
            activeComponent === "/coordinator/help" ? "active" : ""
          }`}
          onClick={() => {
            navigate("/coordinator/help");
            setIsOpen?.(false);
          }}
        >
          <span className="nav-icon">
            <MdHelp />
          </span>
          <span className="nav-label">Help and Docs</span>
        </button>
      </div>
    </div>
  );
   };
   

export default Sidebar;
