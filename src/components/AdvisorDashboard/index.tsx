import React, { useState } from 'react';
import ClientList from './ClientList';
import GroupList from './GroupList';
import DocumentCenter from './DocumentCenter';
import Notifications from './Notifications';
import AdminControls from './AdminControls';

const sections = [
  'Clients',
  'Groups',
  'Documents',
  'Notifications',
  'Admin',
];

export default function AdvisorDashboard() {
  const [activeSection, setActiveSection] = useState('Clients');

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-100 border-r flex flex-col">
        <div className="p-6 font-bold text-xl border-b">Advisor Dashboard</div>
        <nav className="flex-1 p-4 space-y-2">
          {sections.map((section) => (
            <button
              key={section}
              className={`w-full text-left px-4 py-2 rounded hover:bg-blue-100 ${activeSection === section ? 'bg-blue-200 font-semibold' : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {activeSection === 'Clients' && <ClientList />}
        {activeSection === 'Groups' && <GroupList />}
        {activeSection === 'Documents' && <DocumentCenter />}
        {activeSection === 'Notifications' && <Notifications />}
        {activeSection === 'Admin' && <AdminControls />}
      </main>
    </div>
  );
} 