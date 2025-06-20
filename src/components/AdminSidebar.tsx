// @ts-nocheck
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Group, 
  FileText, 
  Bell, 
  History, 
  Heart, 
  Settings,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin'
  },
  {
    label: 'Strategies',
    icon: FileText,
    path: '/admin/strategies'
  },
  {
    label: 'R&D Tax Credit',
    icon: FileText,
    path: '/admin/rd-tax-credit'
  },
  {
    label: 'Clients',
    icon: Users,
    path: '/admin/clients'
  },
  {
    label: 'Advisors',
    icon: UserPlus,
    path: '/admin/advisors'
  },
  {
    label: 'Groups',
    icon: Group,
    path: '/admin/groups'
  },
  {
    label: 'Documents',
    icon: FileText,
    path: '/admin/documents'
  },
  {
    label: 'Notifications',
    icon: Bell,
    path: '/admin/notifications'
  },
  {
    label: 'Audit Log',
    icon: History,
    path: '/admin/audit'
  },
  {
    label: 'Charitable Donations',
    icon: Heart,
    path: '/admin/charitable-donations'
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/admin/settings'
  }
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white shadow-xl border-r flex flex-col justify-between transition-all duration-200 z-30 ${hovered ? 'w-72' : 'w-20'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        <div className={`flex items-center ${hovered ? 'px-8 py-8' : 'px-4 py-8'} border-b transition-all`}>
          <span className={`text-2xl font-extrabold text-blue-700 tracking-tight transition-all ${hovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>TaxRx Admin</span>
        </div>
        <nav className="mt-6 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`
                  group w-full flex items-center ${hovered ? 'px-8' : 'px-4'} py-4 text-lg font-medium rounded-xl transition-all
                  ${active ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}
                `}
                style={{ marginBottom: '4px' }}
              >
                <span className={`mr-0 flex items-center justify-center h-8 w-8 rounded-lg ${active ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'} transition-all`}>
                  <item.icon className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                </span>
                <span className={`ml-4 transition-all ${hovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className={`${hovered ? 'px-8' : 'px-4'} py-6 border-t transition-all`}>
        <button onClick={handleLogout} className="w-full flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors font-semibold py-3 rounded-lg bg-gray-50 hover:bg-red-50">
          <LogOut className="w-5 h-5 mr-2" />
          <span className={`transition-all ${hovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Sign Out</span>
        </button>
      </div>
    </div>
  );
} 