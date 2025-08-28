
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar/SASidebar';
import Header from './SuperAdminHeader/SuperAdminHeader';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <SuperAdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main style={{ flex: 1, marginLeft: '250px', overflowX: 'auto' }}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ padding: '1rem' }}>
          <Outlet />
        </div>
      </main>
      {/* Dim background when sidebar is open on mobile */}
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
