import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AdminUser, AdminStats, TaxProposal } from '../../shared/types';
import { adminService } from '../services/adminService';
import StatsCards from '../components/StatsCards';
import ProposalQueue from '../components/ProposalQueue';
import ProposalDetailView from '../components/ProposalDetailView';
import ExpertManagement from '../components/ExpertManagement';
import CommissionDashboard from '../components/CommissionDashboard';
import { Settings, Users, FileText, BarChart3, UserCheck, DollarSign } from 'lucide-react';

interface AdminDashboardProps {
  user: AdminUser;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [proposals, setProposals] = useState<TaxProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, proposalsData] = await Promise.all([
        adminService.getAdminStats(),
        adminService.getAllProposals()
      ]);

      setStats(statsData);
      setProposals(proposalsData.data);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProposal = (id: string) => {
    navigate(`/admin/proposals/${id}`);
  };

  const handleApproveProposal = async (id: string) => {
    try {
      // In a real app, this would call the API
      console.log('Approving proposal:', id);
      // Refresh data after action
      loadDashboardData();
    } catch (error) {
      console.error('Error approving proposal:', error);
    }
  };

  const handleRejectProposal = async (id: string) => {
    try {
      // In a real app, this would call the API
      console.log('Rejecting proposal:', id);
      // Refresh data after action
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting proposal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user.full_name}
              </p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => navigate('/admin/commission')}
                className="btn-secondary flex items-center space-x-2"
              >
                <DollarSign className="h-5 w-5" />
                <span>Commission</span>
              </button>
              <button 
                onClick={() => navigate('/admin/experts')}
                className="btn-secondary flex items-center space-x-2"
              >
                <UserCheck className="h-5 w-5" />
                <span>Manage Experts</span>
              </button>
              <button 
                onClick={() => navigate('/admin/users')}
                className="btn-secondary flex items-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>Manage Users</span>
              </button>
              <button 
                onClick={() => navigate('/admin/reports')}
                className="btn-secondary flex items-center space-x-2"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Reports</span>
              </button>
              <button 
                onClick={() => navigate('/admin/settings')}
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route index element={
            <DashboardHome 
              stats={stats}
              proposals={proposals}
              loading={loading}
              onViewProposal={handleViewProposal}
              onApproveProposal={handleApproveProposal}
              onRejectProposal={handleRejectProposal}
            />
          } />
          <Route path="proposals/:id" element={<ProposalDetailView />} />
          <Route path="commission" element={<CommissionDashboard />} />
          <Route path="experts" element={<ExpertManagement />} />
          <Route path="users" element={<div>User Management (Coming Soon)</div>} />
          <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
          <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
        </Routes>
      </div>
    </div>
  );
};

// Dashboard Home Component
interface DashboardHomeProps {
  stats: AdminStats | null;
  proposals: TaxProposal[];
  loading: boolean;
  onViewProposal: (id: string) => void;
  onApproveProposal: (id: string) => void;
  onRejectProposal: (id: string) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  stats,
  proposals,
  loading,
  onViewProposal,
  onApproveProposal,
  onRejectProposal
}) => {
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} loading={loading} />}

      {/* Proposal Queue */}
      <ProposalQueue
        proposals={proposals}
        loading={loading}
        onViewProposal={onViewProposal}
        onApproveProposal={onApproveProposal}
        onRejectProposal={onRejectProposal}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <QuickActionCard
          title="Review Proposals"
          description="Process pending affiliate submissions"
          icon={FileText}
          count={proposals.filter(p => p.status === 'submitted').length}
          href="/admin/proposals"
        />
        <QuickActionCard
          title="Commission Dashboard"
          description="Track payments and commission status"
          icon={DollarSign}
          count={0}
          href="/admin/commission"
        />
        <QuickActionCard
          title="Manage Experts"
          description="Assign experts and track workloads"
          icon={UserCheck}
          count={0}
          href="/admin/experts"
        />
        <QuickActionCard
          title="Manage Affiliates"
          description="View affiliate performance and settings"
          icon={Users}
          count={0}
          href="/admin/users"
        />
      </div>
    </div>
  );
};

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  count: number;
  href: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  count, 
  href 
}) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(href)}
      className="card-professional-hover cursor-pointer"
    >
      <div className="flex items-start">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">{title}</h3>
            {count > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 