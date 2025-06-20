import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Users, Plus, FileText, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { AffiliateUser, ClientProfile, TaxProposal, AffiliateStats } from '../../shared/types';
import { authService } from '../../auth/services/authService';
import { affiliateService } from '../services/affiliateService';
import ClientList from '../components/ClientList';
import CreateClientModal from '../components/CreateClientModal';
import ProposalList from '../components/ProposalList';
import { TaxCalculatorModule } from '../../tax-calculator';

interface AffiliateDashboardProps {
  user: AffiliateUser;
}

const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [proposals, setProposals] = useState<TaxProposal[]>([]);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, clientsData, proposalsData] = await Promise.all([
        affiliateService.getStats(user.id),
        affiliateService.getClients(user.id),
        affiliateService.getProposals(user.id)
      ]);

      setStats(statsData);
      setClients(clientsData);
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (clientData: any) => {
    try {
      const newClient = await affiliateService.createClient(user.id, clientData);
      setClients(prev => [...prev, newClient]);
      setShowCreateClient(false);
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleCreateProposal = async (proposalData: any) => {
    try {
      const newProposal = await affiliateService.createProposal(proposalData);
      setProposals(prev => [...prev, newProposal]);
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error creating proposal:', error);
    }
  };

  const handleClientSelect = (client: ClientProfile) => {
    setSelectedClient(client);
    navigate(`/affiliate/clients/${client.id}/calculator`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.full_name}
              </h1>
              <p className="text-gray-600">
                Affiliate Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user.affiliate_code}</span>
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateClient(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>New Client</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route index element={<DashboardHome stats={stats} />} />
          <Route path="clients" element={
            <ClientList 
              clients={clients} 
              onClientSelect={handleClientSelect}
              onRefresh={loadDashboardData}
            />
          } />
          <Route path="clients/:clientId/calculator" element={
            selectedClient ? (
              <TaxCalculatorModule
                clientId={selectedClient.id}
                affiliateId={user.id}
                onProposalCreate={handleCreateProposal}
                initialTaxInfo={selectedClient.tax_info as any}
              />
            ) : <Navigate to="/affiliate/clients" />
          } />
          <Route path="proposals" element={
            <ProposalList 
              proposals={proposals}
              onRefresh={loadDashboardData}
            />
          } />
        </Routes>
      </div>

      {/* Create Client Modal */}
      {showCreateClient && (
        <CreateClientModal
          onClose={() => setShowCreateClient(false)}
          onCreate={handleCreateClient}
        />
      )}
    </div>
  );
};

// Dashboard Home Component
const DashboardHome: React.FC<{ stats: AffiliateStats | null }> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={stats.active_clients}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Proposals"
          value={stats.total_proposals}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Projected Savings"
          value={`$${stats.total_savings_projected.toLocaleString()}`}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Commission Earned"
          value={`$${stats.commission_earned.toLocaleString()}`}
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Create New Client"
            description="Add a new client and start tax planning"
            icon={Users}
            href="/affiliate/clients/new"
          />
          <QuickActionCard
            title="View Proposals"
            description="Review submitted proposals and track status"
            icon={FileText}
            href="/affiliate/proposals"
          />
          <QuickActionCard
            title="Pending Reviews"
            description={`${stats.pending_review} proposals awaiting admin review`}
            icon={Clock}
            href="/affiliate/proposals?status=in_review"
          />
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600',
    green: 'bg-green-500 text-green-600',
    purple: 'bg-purple-500 text-purple-600',
    orange: 'bg-orange-500 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-opacity-10 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Quick Action Card Component
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, description, icon: Icon, href }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(href)}
    >
      <div className="flex items-center mb-2">
        <Icon className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

export default AffiliateDashboard; 