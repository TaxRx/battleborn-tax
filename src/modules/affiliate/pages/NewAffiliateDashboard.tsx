// Affiliate Dashboard - Main dashboard for affiliate accounts
// File: NewAffiliateDashboard.tsx
// Purpose: Dashboard portal with same design as admin/operator dashboards but for affiliates

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  FileText, 
  BarChart3, 
  UserCheck, 
  Home,
  ChevronRight,
  Menu,
  X,
  User,
  Bell,
  Calculator,
  Cog,
  Building,
  LogOut,
  Search,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import useAuthStore from '../../../store/authStore';
import { useUser } from '../../../context/UserContext';

const AffiliateDashboard: React.FC = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: authLogout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  // Use the actual user data
  const effectiveUser = user ? {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || user.profile?.full_name || 'Affiliate',
    role: 'affiliate',
    account: user.profile?.account
  } : null;

  // Access control - only allow affiliate accounts
  useEffect(() => {
    console.log('user in affiliate dashboard', user)
    if(user?.profile){
      if (user && user.profile?.account?.type !== 'affiliate') {
        navigate('/'); // Redirect non-affiliates
        return;
      }
      setLoading(false);
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      // Don't wait for Supabase signOut - do it in background
      supabase.auth.signOut().catch(error => console.error('Supabase signOut error:', error));
      
      // Clear auth store state
      authLogout();
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/affiliate', icon: Home, current: location.pathname === '/affiliate' },
    { name: 'Clients', href: '/affiliate/clients', icon: Users, current: location.pathname === '/affiliate/clients' },
    { name: 'Proposals', href: '/affiliate/proposals', icon: FileText, current: location.pathname === '/affiliate/proposals' },
    { name: 'Commissions', href: '/affiliate/commissions', icon: DollarSign, current: location.pathname === '/affiliate/commissions' },
    { name: 'Tools', href: '/affiliate/tools', icon: Calculator, current: location.pathname === '/affiliate/tools' },
  ];

  const getPageTitle = () => {
    const currentItem = navigationItems.find(item => item.current);
    return currentItem ? currentItem.name : 'Dashboard';
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Affiliate', href: '/affiliate' }];
    
    if (pathSegments.length > 1) {
      const currentItem = navigationItems.find(item => item.current);
      if (currentItem) {
        breadcrumbs.push({ name: currentItem.name, href: currentItem.href });
      }
    }
    
    return breadcrumbs;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-lg text-slate-600">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  // Access control check
  if (!effectiveUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600">Unauthorized access. Please log in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-slate-900 bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Modern Sidebar */}
      <div className={`sidebar-modern ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header-modern">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GT</span>
              </div>
              <div>
                <h1 className="text-heading-sm text-slate-900">Galileo Tax</h1>
                <p className="text-body-sm text-slate-500">Affiliate Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-medium text-slate-900 truncate">{effectiveUser.full_name}</p>
              <p className="text-body-sm text-slate-500">Affiliate</p>
              {effectiveUser.account?.name && (
                <p className="text-body-xs text-slate-400 truncate">{effectiveUser.account.name}</p>
              )}
            </div>
            <div className="relative">
              <button className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <Bell className="h-4 w-4" />
              </button>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav-modern">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`nav-item-modern w-full text-left ${item.current ? 'active' : ''}`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="text-body-md font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navigation */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="ml-4 lg:ml-0">
                <h1 className="text-2xl font-bold text-slate-900">{getPageTitle()}</h1>
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    {getBreadcrumbs().map((breadcrumb, index) => (
                      <li key={breadcrumb.name} className="flex items-center">
                        {index > 0 && <ChevronRight className="h-4 w-4 text-slate-400 mx-2" />}
                        <a
                          href={breadcrumb.href}
                          className="text-sm text-slate-500 hover:text-slate-700"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(breadcrumb.href);
                          }}
                        >
                          {breadcrumb.name}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <Bell className="h-5 w-5" />
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<AffiliateDashboardOverview />} />
            <Route path="/clients" element={<AffiliateClientsPage />} />
            <Route path="/proposals" element={<AffiliateProposalsPage />} />
            <Route path="/commissions" element={<AffiliateCommissionsPage />} />
            <Route path="/tools" element={<AffiliateToolsPage />} />
            
            <Route path="*" element={<Navigate to="/affiliate" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const AffiliateDashboardOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Welcome to Affiliate Portal</h2>
        <p className="text-slate-600">
          Manage your clients, track proposals, and grow your affiliate business with our comprehensive tools.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Clients</p>
              <p className="text-2xl font-semibold text-slate-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Active Proposals</p>
              <p className="text-2xl font-semibold text-slate-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Commission Earned</p>
              <p className="text-2xl font-semibold text-slate-900">$0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-slate-900">0%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for different pages
const AffiliateClientsPage: React.FC = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-6">
    <h2 className="text-xl font-semibold text-slate-900 mb-4">Clients</h2>
    <p className="text-slate-600">Client management coming soon...</p>
  </div>
);

const AffiliateProposalsPage: React.FC = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-6">
    <h2 className="text-xl font-semibold text-slate-900 mb-4">Proposals</h2>
    <p className="text-slate-600">Proposal management coming soon...</p>
  </div>
);

const AffiliateCommissionsPage: React.FC = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-6">
    <h2 className="text-xl font-semibold text-slate-900 mb-4">Commissions</h2>
    <p className="text-slate-600">Commission tracking coming soon...</p>
  </div>
);

const AffiliateToolsPage: React.FC = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-6">
    <h2 className="text-xl font-semibold text-slate-900 mb-4">Tools</h2>
    <p className="text-slate-600">Affiliate tools coming soon...</p>
  </div>
);

export default AffiliateDashboard;