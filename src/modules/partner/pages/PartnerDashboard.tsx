
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import PartnerClientList from '../components/PartnerClientList';
import PartnerAffiliateList from '../components/PartnerAffiliateList';
import PartnerBillingPage from '../components/PartnerBillingPage';

// Define the shape of the dashboard data we expect from the API
interface PartnerDashboardData {
  partnerName: string;
  clientCount: number;
  affiliateCount: number;
  recentActivity: any[]; // Define a more specific type later
}

const PartnerDashboard: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/partner' },
    { name: 'Clients', href: '/partner/clients' },
    { name: 'Affiliates', href: '/partner/affiliates' },
    { name: 'Billing', href: '/partner/billing' },
    { name: 'Settings', href: '/partner/settings' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-8">Partner Workspace</h2>
        <nav>
          <ul>
            {navigation.map((item) => (
              <li key={item.name}>
                <Link 
                  to={item.href} 
                  className={`block py-2 px-4 rounded ${location.pathname === item.href ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/clients" element={<PartnerClientList />} />
          <Route path="/affiliates" element={<PartnerAffiliateList />} />
          <Route path="/billing" element={<PartnerBillingPage />} />
          {/* Add routes for other sections here */}
        </Routes>
      </div>
    </div>
  );
};

// Main Dashboard component to keep the dashboard-specific logic separate
const DashboardHome: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);
        
        const { data, error } = await supabase.functions.invoke('partner-service', {
          body: { pathname: '/partner-service/dashboard' },
        });

        if (error) throw error;

        setDashboardData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {dashboardData?.partnerName}</h1>
      <p className="text-lg text-gray-600 mb-8">Here is a summary of your organization's activity.</p>

      {/* Placeholder for Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">{dashboardData?.clientCount}</h3>
          <p className="text-sm text-gray-500">Total Clients</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">{dashboardData?.affiliateCount}</h3>
          <p className="text-sm text-gray-500">Total Affiliates</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">0</h3>
          <p className="text-sm text-gray-500">Pending Invoices</p>
        </div>
      </div>

      {/* Placeholder for Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500">Recent activity feed will be displayed here.</p>
      </div>
    </div>
  );
};

export default PartnerDashboard;
