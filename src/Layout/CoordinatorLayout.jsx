import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CoordinatorSidebar from './CoordinatorSidebar/CoordinatorSidebar.jsx';
import CoordinatorHeader from './CoordinatorHeader/CoordinatorHeader.jsx';
import data from "../Components/SuperAdmin/Category/categoryData.json"; // Import your category data
import './Layout.css'; // <- you need styles for overlay and responsive margin

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState('');

  useEffect(() => {
    // Find the specific campus, e.g., "Islamabad Campus 1"
    const campus = data.cities
      .flatMap(city => city.campuses)
      .find(campus => campus.name === "Islamabad Campus 1");

    if (campus) {
      setSelectedCampus(campus.name); // Set the found campus name
    } else {
      console.log("Campus not found!");
    }
  }, []);

  return (
    <div className="layout-container">
      <CoordinatorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="main-content">
        <CoordinatorHeader
          campus={selectedCampus} // Pass the selected campus here
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div style={{ padding: '1rem' }}>
          <Outlet />
        </div>
      </div>
      {sidebarOpen && (
        <div
          className="overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
