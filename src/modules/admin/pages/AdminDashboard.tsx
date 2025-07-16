console.log("AdminDashboard");

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AdminStats, TaxProposal } from '../types/proposal';
import { ProposalService } from '../services/proposalService';
import StatsCards from '../components/StatsCards';
import ProposalQueue from '../components/ProposalQueue';
import ProposalDetailView from '../components/ProposalDetailView';
import ProposalsTable from '../components/ProposalsTable';
import ExpertManagement from '../components/ExpertManagement';
import CommissionDashboard from '../components/CommissionDashboard';
import ClientRetentionDashboard from '../components/ClientRetentionDashboard';
import AdminTaxCalculator from '../components/AdminTaxCalculator';
import AugustaRuleWizard from '../../../modules/tax-calculator/components/AugustaRuleWizard';
import RDTaxWizard from '../../../modules/tax-calculator/components/RDTaxWizard/RDTaxWizard';
import { RDTaxCreditDashboard } from '../../../modules/tax-calculator/components/RDTaxCreditDashboard';
import UnifiedClientDashboard from '../../../components/UnifiedClientDashboard';
import { 
  Settings, 
  Users, 
  FileText, 
  BarChart3, 
  UserCheck, 
  DollarSign, 
  Home,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Bell,
  Search,
  Calculator,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight,
  Zap,
  Award,
  Briefcase,
  PieChart,
  Building,
  CreditCard,
  FileText as FileTextIcon,
  Activity,
  Database
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import CreateClientModal from '../components/CreateClientModal';
import { useUser } from '../../../context/UserContext';
import useAuthStore from '../../../store/authStore';
import RDClientManagement from '../../../components/RDClientManagement';
import PartnersList from '../components/PartnersList'; // Import the new component
import AccountManagement from '../components/AccountManagement';
import BulkActivityOperations from '../components/BulkActivityOperations';

const proposalService = ProposalService.getInstance();

const AdminDashboard: React.FC = () => {
  const { user } = useUser();
  const { demoMode } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [proposals, setProposals] = useState<TaxProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a mock user for demo mode or use the actual user
  const effectiveUser = demoMode ? {
    id: 'demo-admin',
    email: 'admin@taxrxgroup.com',
    full_name: 'Demo Administrator',
    role: 'admin'
  } : user ? {
    id: user.id,
    email: user.email || 'admin@taxrxgroup.com',
    full_name: user.user_metadata?.full_name || 'Administrator',
    role: 'admin'
  } : null;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, proposalsData] = await Promise.all([
        proposalService.getAdminStats(),
        proposalService.getAllProposals()
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
      console.log('Approving proposal:', id);
      loadDashboardData();
    } catch (error) {
      console.error('Error approving proposal:', error);
    }
  };

  const handleRejectProposal = async (id: string) => {
    try {
      console.log('Rejecting proposal:', id);
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting proposal:', error);
    }
  };
  const handleDeleteProposal = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this proposal? This action cannot be undone.")) {
      try {
        const response = await proposalService.deleteProposal(id);
        if (response.success) {
          console.log("Proposal deleted:", response.data);
          loadDashboardData();
        } else {
          console.error("Failed to delete proposal:", response.message);
        }
      } catch (error) {
        console.error("Error deleting proposal:", error);
      }
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: Home, current: location.pathname === '/admin' },
    { name: 'Account Management', href: '/admin/accounts', icon: Users, current: location.pathname === '/admin/accounts' },
    { name: 'Activity Analytics', href: '/admin/activity-analytics', icon: Activity, current: location.pathname === '/admin/activity-analytics' },
    { name: 'Client Management', href: '/admin/clients', icon: Users, current: location.pathname === '/admin/clients' },
    { name: 'R&D Clients', href: '/admin/rd-clients', icon: Zap, current: location.pathname === '/admin/rd-clients' },
    { name: 'Proposals', href: '/admin/proposals', icon: FileText, current: location.pathname.includes('/admin/proposals') },
    { name: 'Tax Tools', href: '/admin/tax-tools', icon: Calculator, current: location.pathname.includes('/admin/tax-tools') },
    { name: 'Tax Planning', href: '/admin/calculator', icon: Calculator, current: location.pathname === '/admin/calculator' },
    { name: 'Client Retention', href: '/admin/retention', icon: Shield, current: location.pathname === '/admin/retention' },
    { name: 'Commission', href: '/admin/commission', icon: DollarSign, current: location.pathname === '/admin/commission' },
    { name: 'Experts', href: '/admin/experts', icon: UserCheck, current: location.pathname === '/admin/experts' },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: location.pathname === '/admin/reports' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: location.pathname === '/admin/settings' },
    { name: 'Partners', href: '/admin/partners', icon: Briefcase, current: location.pathname === '/admin/partners' },
  ];

  const getPageTitle = () => {
    const currentItem = navigationItems.find(item => item.current);
    return currentItem ? currentItem.name : 'Dashboard';
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Admin', href: '/admin' }];
    
    if (pathSegments.length > 1) {
      const currentItem = navigationItems.find(item => item.current);
      if (currentItem) {
        breadcrumbs.push({ name: currentItem.name, href: currentItem.href });
      }
    }
    
    return breadcrumbs;
  };

  // If no effective user, show loading or error
  if (!effectiveUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
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
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BB</span>
              </div>
              <div>
                <h1 className="text-heading-sm text-slate-900">BattleBorn</h1>
                <p className="text-body-sm text-slate-500">Admin Panel</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-medium text-slate-900 truncate">{effectiveUser.full_name}</p>
              <p className="text-body-sm text-slate-500">Administrator</p>
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
                          className={`text-sm ${
                            index === getBreadcrumbs().length - 1
                              ? 'text-slate-900 font-medium'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
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
              <button className="flex items-center space-x-2 p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route 
              path="/" 
              element={
                <DashboardHome
                  stats={stats}
                  proposals={proposals}
                  loading={loading}
                  onViewProposal={handleViewProposal}
                  onApproveProposal={handleApproveProposal}
                  onRejectProposal={handleRejectProposal}
                />
              } 
            />
            <Route path="/accounts" element={<AccountManagement />} />
            <Route path="/activity-analytics" element={<BulkActivityOperations />} />
            <Route path="/clients" element={<UnifiedClientDashboard />} />
            <Route path="/rd-clients" element={<RDClientManagement />} />
            <Route path="/proposals" element={<ProposalsTable proposals={proposals} onViewProposal={handleViewProposal} onApproveProposal={handleApproveProposal} onRejectProposal={handleRejectProposal} />} />
            <Route path="/proposals/:id" element={<ProposalDetailView />} />
            <Route path="/tax-tools" element={<TaxToolsHome />} />
            <Route path="/tax-tools/augusta-rule" element={<AugustaRuleTool />} />
            <Route path="/tax-tools/rd-credit" element={<RDTaxCreditDashboard />} />
            <Route path="/tax-tools/rd-credit/wizard/:businessId" element={<RDTaxCreditTool />} />
            <Route path="/calculator" element={<AdminTaxCalculator />} />
            <Route path="/retention" element={<ClientRetentionDashboard />} />
            <Route path="/commission" element={<CommissionDashboard />} />
            <Route path="/experts" element={<ExpertManagement />} />
            <Route path="/reports" element={<div className="p-8"><h1 className="text-2xl font-bold">Reports</h1><p>Coming soon...</p></div>} />
            <Route path="/settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1><p>Coming soon...</p></div>} />
            <Route path="/partners" element={<PartnersList />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>

      {/* Create Client Modal */}
      {showCreateClientModal && (
        <CreateClientModal
          isOpen={showCreateClientModal}
          onClose={() => setShowCreateClientModal(false)}
          onSubmit={async (clientData) => {
            console.log('Creating client:', clientData);
            setShowCreateClientModal(false);
          }}
        />
      )}
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
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingProposals = proposals.filter(p => p.status === 'submitted').length;
  const approvedProposals = proposals.filter(p => p.status === 'approved').length;
  const totalRevenue = proposals.reduce((sum, p) => sum + (p.projectedRevenue || 0), 0);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{proposals.length}</h3>
              <p className="text-sm text-gray-500">Total Proposals</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{pendingProposals}</h3>
              <p className="text-sm text-gray-500">Pending Review</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{approvedProposals}</h3>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-purple-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">${totalRevenue.toLocaleString()}</h3>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/proposals')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Review Proposals</h3>
                <p className="text-sm text-gray-500">{pendingProposals} pending</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/tax-tools')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calculator className="h-6 w-6 text-green-600 mr-3" />
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Tax Tools</h3>
                <p className="text-sm text-gray-500">Augusta Rule & R&D Credits</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/calculator')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calculator className="h-6 w-6 text-purple-600 mr-3" />
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Tax Calculator</h3>
                <p className="text-sm text-gray-500">Run calculations</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/experts')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserCheck className="h-6 w-6 text-orange-600 mr-3" />
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Manage Experts</h3>
                <p className="text-sm text-gray-500">Expert assignments</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Proposals */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Proposals</h2>
            <button
              onClick={() => navigate('/admin/proposals')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proposals.slice(0, 5).map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.clientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(proposal.projectedRevenue || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => onViewProposal(proposal.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      {proposal.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => onApproveProposal(proposal.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onRejectProposal(proposal.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tax Tools Home Component
const TaxToolsHome: React.FC = () => {
  const navigate = useNavigate();

  const taxTools = [
    {
      id: 'augusta-rule',
      name: 'Augusta Rule Calculator',
      description: 'Calculate tax benefits from renting your home to your business for up to 14 days per year',
      icon: Building,
      href: '/admin/tax-tools/augusta-rule',
      features: [
        'Multi-step wizard for data collection',
        'Real-time tax benefit calculations',
        'State and federal tax savings',
        'Implementation guidance'
      ]
    },
    {
      id: 'rd-credit',
      name: 'R&D Tax Credit Management',
      description: 'Comprehensive client and business management for R&D tax credit calculations',
      icon: CreditCard,
      href: '/admin/tax-tools/rd-credit',
      features: [
        'Client management dashboard',
        'Business setup and tracking',
        'R&D activity exploration',
        'Tax credit calculations'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Tools</h1>
          <p className="mt-2 text-lg text-gray-600">
            Professional tax planning and calculation tools for your clients
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {taxTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div key={tool.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900">{tool.name}</h3>
                    <p className="text-gray-600">{tool.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Key Features</h4>
                  <ul className="space-y-2">
                    {tool.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => navigate(tool.href)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <span>Launch Tool</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">About Our Tax Tools</h3>
        <p className="text-blue-800 mb-4">
          These professional-grade tax tools help you provide accurate calculations and strategic tax planning for your clients. 
          Each tool is designed to handle complex tax scenarios and provide detailed breakdowns of potential savings.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            <span>IRS Compliant Calculations</span>
          </div>
          <div className="flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2" />
            <span>Detailed Documentation</span>
          </div>
          <div className="flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            <span>Real-time Results</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Augusta Rule Tool Component
const AugustaRuleTool: React.FC = () => {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-between p-6 bg-white border-b">
          <h1 className="text-2xl font-bold">Augusta Rule Wizard</h1>
          <button
            onClick={() => setShowWizard(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close Wizard
          </button>
        </div>
        <div className="p-0">
          <AugustaRuleWizard onClose={() => setShowWizard(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Augusta Rule Calculator</h1>
          <p className="text-gray-600">Direct access to the full Augusta Rule wizard</p>
        </div>
        <button
          onClick={() => navigate('/admin/tax-tools')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Back to Tax Tools
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center py-12">
          <Building className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Augusta Rule Setup Wizard</h2>
          <p className="text-gray-600 mb-6">
            Launch the complete Augusta Rule wizard directly in the admin panel:
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Full Wizard Features</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Step 1: Parties Information (Homeowner & Business details)</li>
                <li>• Step 2: Rental Rate Analysis (Market comparables)</li>
                <li>• Step 3: Rental Dates & Activities (Day-by-day planning)</li>
                <li>• Google Maps integration for address verification</li>
                <li>• Market rate analysis with comparable properties</li>
                <li>• Comprehensive documentation for IRS compliance</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto space-x-2"
          >
            <ArrowRight className="w-5 h-5" />
            <span>Launch Full Wizard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// R&D Tax Credit Tool Component
const RDTaxCreditTool: React.FC = () => {
  const navigate = useNavigate();
  const { businessId } = useParams<{ businessId: string }>();
  const [showWizard, setShowWizard] = useState(true);

  if (showWizard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-between p-6 bg-white border-b">
          <h1 className="text-2xl font-bold">R&D Tax Credit Wizard</h1>
          <button
            onClick={() => navigate('/admin/tax-tools/rd-credit')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Back to Dashboard
          </button>
        </div>
        <div className="p-0">
          <RDTaxWizard 
            onClose={() => navigate('/admin/tax-tools/rd-credit')} 
            businessId={businessId}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default AdminDashboard; 