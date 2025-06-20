import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <Sidebar onCollapse={setIsSidebarCollapsed} />
      <main className={`transition-all duration-300 ${isSidebarCollapsed ? 'pl-16' : 'pl-64'} pt-16`}>
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout; 