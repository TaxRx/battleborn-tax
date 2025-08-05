import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BellIcon,
  DocumentTextIcon, 
  UserGroupIcon, 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { authService, AuthUser, ClientUser } from '../services/authService';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import ClientProfileModal from './ClientProfileModal';
import UserManagementModal from './UserManagementModal';
import { CentralizedClientService, CentralizedBusiness } from '../services/centralizedClientService';
import { RDReportService, RDReport } from '../modules/tax-calculator/services/rdReportService';


interface BusinessWithReports extends CentralizedBusiness {
  rd_reports: RDReport[];
  has_rd_data: boolean;
}

export default function EnhancedClientDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [businesses, setBusinesses] = useState<BusinessWithReports[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
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
      loadBusinessesWithReports();
    }
  }, [selectedClient]);

  const loadBusinessesWithReports = async () => {
    if (!selectedClient) return;

    try {
      setBusinessesLoading(true);
      
      // Load businesses for the client
      const clientBusinesses = await CentralizedClientService.getClientBusinesses(selectedClient.id);
      
      // For each business, load R&D reports
      const businessesWithReports: BusinessWithReports[] = await Promise.all(
        clientBusinesses.map(async (business) => {
          try {
            // Check if business has R&D data by looking for rd_businesses entry
            const { data: rdBusiness, error: rdError } = await supabase
              .from('rd_businesses')
              .select('id, business_years(id)')
              .eq('client_id', selectedClient.id)
              .eq('name', business.business_name)
              .single();

            let rd_reports: RDReport[] = [];
            let has_rd_data = false;

            if (rdBusiness && !rdError) {
              has_rd_data = true;
              
              // Get business years and their reports
              if (rdBusiness.business_years && rdBusiness.business_years.length > 0) {
                for (const businessYear of rdBusiness.business_years) {
                  try {
                    const report = await RDReportService.getReport(businessYear.id, 'RESEARCH_SUMMARY');
                    if (report) {
                      rd_reports.push(report);
                    }
                  } catch (reportError) {
                    console.log('No report found for business year:', businessYear.id);
                  }
                }
              }
            }

            return {
              ...business,
              rd_reports,
              has_rd_data
            };
          } catch (error) {
            console.error('Error loading R&D data for business:', business.business_name, error);
            return {
              ...business,
              rd_reports: [],
              has_rd_data: false
            };
          }
        })
      );

      setBusinesses(businessesWithReports);

    } catch (error) {
      console.error('Error loading businesses with reports:', error);
      toast.error('Failed to load R&D reports');
    } finally {
      setBusinessesLoading(false);
    }
  };

  const handleViewReport = (report: RDReport, businessName: string) => {
    // Open report in a new window/tab
    const reportContent = report.generated_html || report.generated_text;
    if (reportContent) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${businessName} - R&D Tax Credit Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                .header { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${businessName} - R&D Tax Credit Report</h1>
                <p><strong>Generated:</strong> ${new Date(report.created_at).toLocaleDateString()}</p>
                <p><strong>Report Type:</strong> ${report.type}</p>
              </div>
              ${reportContent}
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      toast.error('Report content not available');
    }
  };

  const handleDownloadReport = (report: RDReport, businessName: string) => {
    const reportContent = report.generated_html || report.generated_text;
    if (reportContent) {
      const htmlContent = `
        <html>
          <head>
            <title>${businessName} - R&D Tax Credit Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
              .header { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${businessName} - R&D Tax Credit Report</h1>
              <p><strong>Generated:</strong> ${new Date(report.created_at).toLocaleDateString()}</p>
              <p><strong>Report Type:</strong> ${report.type}</p>
            </div>
            ${reportContent}
          </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${businessName.replace(/[^a-z0-9]/gi, '_')}_RD_Report.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } else {
      toast.error('Report content not available for download');
    }
  };

  const logActivity = async (type: string, title: string, description?: string) => {
    if (!selectedClient || !user) return;

    try {
      const { error } = await supabase
        .rpc('log_client_activity', {
          p_client_id: selectedClient.id,
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

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
                <span className="text-white font-bold text-sm sm:text-lg">GT</span>
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
                        <p className="text-xs sm:text-sm text-gray-900">{user.clients?.length || 0} organizations</p>
                      </div>
                    </div>
                  </div>

                  {/* Client Organizations */}
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Your Organizations</h2>
                    
                    <div className="space-y-3">
                      {user.clients && user.clients.length > 0 ? user.clients.map((client) => (
                        <motion.div 
                          key={client.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all touch-manipulation ${
                            selectedClient?.id === client.id 
                              ? 'border-blue-500 bg-blue-50 shadow-md' 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                          onClick={() => {
                            setSelectedClient(client);
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
                                  {client.full_name?.charAt(0) || 'C'}
                                </span>
                              </div>
                              <div className="ml-3 min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                  {client.full_name || 'Unknown Business'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {client.filing_status || 'Individual'}
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 bg-blue-100 text-blue-800">
                              Account Member
                            </span>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-8">
                          <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
                          <p className="text-gray-600">No clients are associated with your account yet.</p>
                        </div>
                      )}
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

                    {/* All users in account have full access */}
                    {true && (
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

                {/* R&D Reports Section */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                        <DocumentTextIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">R&D Tax Credit Reports</h2>
                        <p className="text-sm text-gray-600">View and download your research and development tax credit reports</p>
                      </div>
                    </div>
                  </div>

                  {businessesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading R&D reports...</p>
                      </div>
                    </div>
                  ) : businesses.length === 0 ? (
                    <div className="text-center py-12">
                      <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Businesses Found</h3>
                      <p className="text-gray-600">No businesses are associated with your account yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {businesses.map((business) => (
                        <motion.div
                          key={business.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BuildingOfficeIcon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">{business.business_name}</h4>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                  <span className="flex items-center">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    {business.entity_type}
                                  </span>
                                  {business.ein && (
                                    <span>EIN: {business.ein}</span>
                                  )}
                                  {business.business_state && (
                                    <span>{business.business_state}</span>
                                  )}
                                </div>
                                
                                {business.has_rd_data ? (
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                                      <span className="text-sm font-medium text-green-700">
                                        R&D Data Available ({business.rd_reports.length} report{business.rd_reports.length !== 1 ? 's' : ''} generated)
                                      </span>
                                    </div>
                                    
                                    {business.rd_reports.length > 0 ? (
                                      <div className="space-y-2">
                                        {business.rd_reports.map((report) => (
                                          <div key={report.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2">
                                                <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-900">
                                                  {report.type.replace('_', ' ')} Report
                                                </span>
                                              </div>
                                              <p className="text-xs text-gray-600 mt-1">
                                                Generated: {new Date(report.created_at).toLocaleDateString()}
                                              </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <button
                                                onClick={() => handleViewReport(report, business.business_name)}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                              >
                                                <EyeIcon className="w-4 h-4 mr-1" />
                                                View
                                              </button>
                                              <button
                                                onClick={() => handleDownloadReport(report, business.business_name)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                              >
                                                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                                                Download
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <div className="flex items-center">
                                          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2" />
                                          <span className="text-sm text-yellow-700">
                                            R&D data is available but no reports have been generated yet.
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center">
                                      <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
                                      <span className="text-sm text-gray-600">
                                        No R&D tax credit data available for this business.
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
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
            clientId={selectedClient.id}
            onProfileUpdated={() => {
              logActivity('profile_update', 'Profile updated');
              loadBusinessesWithReports();
            }}
          />

          <UserManagementModal
            isOpen={showUserManagementModal}
            onClose={() => setShowUserManagementModal(false)}
            clientId={selectedClient.id}
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