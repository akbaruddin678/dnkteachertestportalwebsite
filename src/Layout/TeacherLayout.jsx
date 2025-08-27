// src/Components/Layout/Layout.jsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar/TeacherSidebar.jsx';
import TeacherHeader from './TeacherHeader/TeacherHeader.jsx';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <TeacherSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main style={{ flex: 1, marginLeft: '250px', overflowX: 'auto' }}>
        <TeacherHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ padding: '1rem' }}>
          <Outlet />
        </div>
      </main>
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
