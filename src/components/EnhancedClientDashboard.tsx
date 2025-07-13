import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BellIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  EyeIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { authService, AuthUser, ClientUser } from '../services/authService';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import ClientProfileModal from './ClientProfileModal';
import UserManagementModal from './UserManagementModal';

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
  user_name?: string;
}

interface EngagementStatus {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'on_hold' | 'cancelled';
  last_activity_at: string;
  last_login_at: string;
  total_activities: number;
  pending_actions: number;
  completion_percentage: number;
  next_action_due: string;
}

interface DashboardMetrics {
  total_proposals: number;
  active_proposals: number;
  total_savings: number;
  recent_activities: number;
  completion_rate: number;
  calculated_at: string;
}

export default function EnhancedClientDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientUser | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [engagementStatus, setEngagementStatus] = useState<EngagementStatus | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize and mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // Set primary client as default selection
        if (currentUser && currentUser.isClientUser) {
          const primaryClient = authService.getPrimaryClient(currentUser);
          setSelectedClient(primaryClient);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientData();
    }
  }, [selectedClient]);

  const loadClientData = async () => {
    if (!selectedClient) return;

    try {
      setMetricsLoading(true);
      
      // Load recent activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('recent_client_activities')
        .select('*')
        .eq('client_id', selectedClient.client_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

      // Load engagement status
      const { data: engagementData, error: engagementError } = await supabase
        .from('client_engagement_status')
        .select('*')
        .eq('client_id', selectedClient.client_id)
        .single();

      if (engagementError && engagementError.code !== 'PGRST116') {
        throw engagementError;
      }
      setEngagementStatus(engagementData);

      // Load dashboard metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('calculate_dashboard_metrics', { p_client_id: selectedClient.client_id });

      if (metricsError) throw metricsError;
      setDashboardMetrics(metricsData);

    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setMetricsLoading(false);
    }
  };

  const logActivity = async (type: string, title: string, description?: string) => {
    if (!selectedClient || !user) return;

    try {
      const { error } = await supabase
        .rpc('log_client_activity', {
          p_client_id: selectedClient.client_id,
          p_user_id: user.profile.id,
          p_activity_type: type,
          p_title: title,
          p_description: description
        });

      if (error) throw error;
      
      // Reload activities
      loadClientData();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const markActivityAsRead = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('client_activities')
        .update({ is_read: true })
        .eq('id', activityId);

      if (error) throw error;
      
      // Update local state
      setActivities(activities.map(activity => 
        activity.id === activityId ? { ...activity, is_read: true } : activity
      ));
    } catch (error) {
      console.error('Error marking activity as read:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'member': return 'Member';
      case 'viewer': return 'Viewer';
      case 'accountant': return 'Accountant';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-green-100 text-green-800';
      case 'accountant': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <UserGroupIcon className="w-5 h-5" />;
      case 'document_upload': return <DocumentTextIcon className="w-5 h-5" />;
      case 'proposal_view': return <EyeIcon className="w-5 h-5" />;
      case 'profile_update': return <CogIcon className="w-5 h-5" />;
      case 'calculation_run': return <ChartBarIcon className="w-5 h-5" />;
      default: return <BellIcon className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEngagementStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Dashboard...</h2>
          <p className="mt-2 text-gray-600">Please wait while we load your information.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Please log in to access the client dashboard.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Mobile-Friendly Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-3"
              >
                {isSidebarOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
              
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm sm:text-lg">B</span>
              </div>
              <div className="ml-3 sm:ml-4">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Client Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Welcome back, {authService.getUserDisplayName(user)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => logActivity('login', 'Dashboard accessed')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={handleSignOut}
                className="bg-gray-100 text-gray-700 px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Mobile-Responsive Sidebar */}
          <AnimatePresence>
            {(isSidebarOpen || !isMobile) && (
              <motion.div 
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`
                  ${isSidebarOpen ? 'block' : 'hidden'} 
                  lg:block lg:w-80 w-full
                  ${isMobile && isSidebarOpen ? 'fixed inset-0 z-30 bg-gray-50 pt-20 px-4' : ''}
                `}
              >
                <div className="space-y-4 sm:space-y-6">
                  {/* User Info */}
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500">Email</label>
                        <p className="text-xs sm:text-sm text-gray-900 break-all">{user.profile.email}</p>
                      </div>
                      
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500">Account Type</label>
                        <div className="flex items-center mt-1">
                          {user.isClientUser && (
                            <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Client User
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500">Organizations</label>
                        <p className="text-xs sm:text-sm text-gray-900">{user.clientUsers.length} organizations</p>
                      </div>
                    </div>
                  </div>

                  {/* Client Organizations */}
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Your Organizations</h2>
                    
                    <div className="space-y-3">
                      {user.clientUsers.map((clientUser) => (
                        <motion.div 
                          key={clientUser.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all touch-manipulation ${
                            selectedClient?.id === clientUser.id 
                              ? 'border-blue-500 bg-blue-50 shadow-md' 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                          onClick={() => {
                            setSelectedClient(clientUser);
                            // Close sidebar on mobile after selection
                            if (isMobile) {
                              setIsSidebarOpen(false);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center min-w-0 flex-1">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-xs sm:text-sm">
                                  {clientUser.client?.full_name?.charAt(0) || 'C'}
                                </span>
                              </div>
                              <div className="ml-3 min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                  {clientUser.client?.full_name || 'Unknown Business'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {clientUser.client?.filing_status || 'Individual'}
                                </p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getRoleColor(clientUser.role)}`}>
                              {getRoleDisplayName(clientUser.role)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Overlay */}
          {isSidebarOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {selectedClient ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Available Actions - Enhanced for Mobile */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Available Actions</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowProfileModal(true)}
                      className="flex items-center justify-center p-4 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all touch-manipulation min-h-[60px]"
                    >
                      <CogIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">Manage Profile</span>
                    </motion.button>

                    {selectedClient.role === 'owner' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowUserManagementModal(true)}
                        className="flex items-center justify-center p-4 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all touch-manipulation min-h-[60px]"
                      >
                        <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">Manage Users</span>
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => logActivity('document_view', 'Viewed documents')}
                      className="flex items-center justify-center p-4 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all touch-manipulation min-h-[60px]"
                    >
                      <EyeIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">View Documents</span>
                    </motion.button>
                  </div>
                </div>

                {/* Enhanced Dashboard Metrics - Mobile Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {/* Total Proposals Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-4 sm:p-6 border border-blue-200 hover:shadow-lg transition-all duration-300 touch-manipulation"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="p-2 sm:p-3 bg-blue-500 rounded-lg shadow-lg flex-shrink-0">
                          <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-blue-700">Total Proposals</p>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <p className="text-xl sm:text-2xl font-bold text-blue-900">
                              {metricsLoading ? '...' : dashboardMetrics?.total_proposals || 0}
                            </p>
                            <div className="flex items-center text-xs text-green-600 bg-green-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                              <ArrowTrendingUpIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              +12%
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">vs last month</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mini trend chart */}
                    <div className="mt-3 sm:mt-4">
                      <div className="flex items-end space-x-1 h-6 sm:h-8">
                        {[65, 70, 68, 75, 82, 78, 85].map((height, index) => (
                          <div
                            key={index}
                            className="bg-blue-400 rounded-sm opacity-70"
                            style={{ height: `${height}%`, width: isMobile ? '8px' : '12px' }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Active Proposals Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-4 sm:p-6 border border-green-200 hover:shadow-lg transition-all duration-300 touch-manipulation"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="p-2 sm:p-3 bg-green-500 rounded-lg shadow-lg flex-shrink-0">
                          <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-green-700">Active Proposals</p>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <p className="text-xl sm:text-2xl font-bold text-green-900">
                              {metricsLoading ? '...' : dashboardMetrics?.active_proposals || 0}
                            </p>
                            <div className="flex items-center text-xs text-green-600 bg-green-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                              <ArrowTrendingUpIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              +8%
                            </div>
                          </div>
                          <p className="text-xs text-green-600 mt-1">vs last month</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="mt-3 sm:mt-4">
                      <div className="flex justify-between text-xs text-green-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(((dashboardMetrics?.active_proposals || 0) / Math.max(dashboardMetrics?.total_proposals || 1, 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(((dashboardMetrics?.active_proposals || 0) / Math.max(dashboardMetrics?.total_proposals || 1, 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Total Savings Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm p-4 sm:p-6 border border-yellow-200 hover:shadow-lg transition-all duration-300 touch-manipulation"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="p-2 sm:p-3 bg-yellow-500 rounded-lg shadow-lg flex-shrink-0">
                          <ArrowTrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-yellow-700">Total Savings</p>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <p className="text-lg sm:text-2xl font-bold text-yellow-900 truncate">
                              {metricsLoading ? '...' : formatCurrency(dashboardMetrics?.total_savings || 0)}
                            </p>
                            <div className="flex items-center text-xs text-green-600 bg-green-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full flex-shrink-0">
                              <ArrowTrendingUpIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              +24%
                            </div>
                          </div>
                          <p className="text-xs text-yellow-600 mt-1">vs last month</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Savings breakdown */}
                    <div className="mt-3 sm:mt-4">
                      <div className="flex justify-between text-xs text-yellow-600 mb-2">
                        <span>Tax Credits</span>
                        <span>Federal</span>
                        <span>State</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="flex-1 bg-yellow-500 h-2 rounded-l-full" />
                        <div className="flex-1 bg-yellow-400 h-2" />
                        <div className="flex-1 bg-yellow-300 h-2 rounded-r-full" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Completion Rate Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-4 sm:p-6 border border-purple-200 hover:shadow-lg transition-all duration-300 touch-manipulation"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="p-2 sm:p-3 bg-purple-500 rounded-lg shadow-lg flex-shrink-0">
                          <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-purple-700">Completion Rate</p>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <p className="text-xl sm:text-2xl font-bold text-purple-900">
                              {metricsLoading ? '...' : `${Math.round(dashboardMetrics?.completion_rate || 0)}%`}
                            </p>
                            <div className="flex items-center text-xs text-green-600 bg-green-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                              <ArrowTrendingUpIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              +5%
                            </div>
                          </div>
                          <p className="text-xs text-purple-600 mt-1">vs last month</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Circular progress */}
                    <div className="mt-3 sm:mt-4 flex items-center justify-center">
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90" viewBox="0 0 64 64">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-purple-200"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - (dashboardMetrics?.completion_rate || 0) / 100)}`}
                            className="text-purple-500 transition-all duration-500"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-900">
                            {Math.round(dashboardMetrics?.completion_rate || 0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Enhanced Engagement Status */}
                {engagementStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-xl shadow-sm p-6 border border-indigo-100"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500 rounded-lg">
                          <ChartBarIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Engagement Overview</h2>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEngagementStatusColor(engagementStatus.status)}`}>
                        {engagementStatus.status.charAt(0).toUpperCase() + engagementStatus.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Main engagement metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Activity</label>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              {engagementStatus.last_activity_at 
                                ? formatDate(engagementStatus.last_activity_at)
                                : 'No recent activity'
                              }
                            </p>
                          </div>
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <ClockIcon className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Actions</label>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-sm font-semibold text-gray-900">{engagementStatus.pending_actions}</p>
                              <span className="text-xs text-gray-500">items</span>
                            </div>
                          </div>
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Activities</label>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{engagementStatus.total_activities}</p>
                          </div>
                          <div className="p-2 bg-green-100 rounded-lg">
                            <ChartBarIcon className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Action Due</label>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              {engagementStatus.next_action_due 
                                ? formatDate(engagementStatus.next_action_due)
                                : 'No scheduled actions'
                              }
                            </p>
                          </div>
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <CalendarDaysIcon className="w-4 h-4 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Completion Progress Bar */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">Overall Progress</label>
                        <span className="text-sm font-semibold text-gray-900">
                          {Math.round(engagementStatus.completion_percentage || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${engagementStatus.completion_percentage || 0}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Started</span>
                        <span>In Progress</span>
                        <span>Complete</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Recent Activities */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                    <button
                      onClick={() => loadClientData()}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <AnimatePresence>
                      {activities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all ${
                            activity.is_read 
                              ? 'bg-gray-50 border-gray-300' 
                              : 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                          }`}
                          onClick={() => !activity.is_read && markActivityAsRead(activity.id)}
                        >
                          <div className="flex items-start">
                            <div className={`p-2 rounded-lg mr-3 ${getPriorityColor(activity.priority)}`}>
                              {getActivityIcon(activity.activity_type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                <span className="text-xs text-gray-500">{formatDate(activity.created_at)}</span>
                              </div>
                              {activity.description && (
                                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                              )}
                              {activity.user_name && (
                                <p className="text-xs text-gray-500 mt-1">by {activity.user_name}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {activities.length === 0 && (
                      <div className="text-center py-8">
                        <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No recent activities</p>
                      </div>
                    )}
                  </div>
                </div>


              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
                  <p className="text-gray-600">Choose an organization from the sidebar to view your dashboard and available actions.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedClient && (
        <>
          <ClientProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            clientId={selectedClient.client_id}
            onProfileUpdated={() => {
              logActivity('profile_update', 'Profile updated');
              loadClientData();
            }}
          />

          <UserManagementModal
            isOpen={showUserManagementModal}
            onClose={() => setShowUserManagementModal(false)}
            clientId={selectedClient.client_id}
            onUsersUpdated={() => {
              logActivity('status_update', 'User permissions updated');
              loadClientData();
            }}
          />
        </>
      )}
    </div>
  );
} 