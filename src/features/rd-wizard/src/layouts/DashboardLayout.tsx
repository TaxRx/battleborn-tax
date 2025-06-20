import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UserIcon, 
  DocumentTextIcon, 
  PresentationChartLineIcon,
  CreditCardIcon,
  ArrowLeftOnRectangleIcon,
  UsersIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { BeakerIcon as BeakerIconSolid } from '@heroicons/react/24/solid';
import { LightbulbIcon as LightBulbIcon } from 'lucide-react';
import { cn } from '../utils/styles';
import useAuthStore from '../store/authStore';

interface DashboardLayoutProps {
  userType: 'client' | 'admin';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userType }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications] = useState<{ id: string; message: string; time: string }[]>([
    { id: '1', message: 'Your documents have been reviewed', time: '10 minutes ago' },
    { id: '2', message: 'Tax calculation is complete', time: '1 hour ago' }
  ]);
  
  const { isAuthenticated, demoMode, logout, disableDemoMode } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !demoMode) {
      navigate('/login');
    }
  }, [isAuthenticated, demoMode, navigate]);

  const clientNavItems = [
    { name: 'Dashboard', icon: HomeIcon, href: '/client' },
    { name: 'Business Info', icon: UserIcon, href: '/client/business-info' },
    { name: 'Document Upload', icon: DocumentTextIcon, href: '/client/document-upload' },
    { name: 'Qualified Activities', icon: LightBulbIcon, href: '/client/qualified-activities' },
    { name: 'Qualified Expenses', icon: UsersIcon, href: '/client/qualified-expenses' },
    { name: 'Research Outcomes', icon: PresentationChartLineIcon, href: '/client/research-outcomes' },
    { name: 'Finalize Calculations', icon: PresentationChartLineIcon, href: '/client/finalize-calculations' },
    { name: 'Payment', icon: CreditCardIcon, href: '/client/payment' },
    { name: 'Reports', icon: DocumentCheckIcon, href: '/client/reports' }
  ];

  const adminNavItems = [
    { name: 'Dashboard', icon: HomeIcon, href: '/admin' },
    { name: 'Clients', icon: UsersIcon, href: '/admin/clients' },
    { name: 'Document Review', icon: DocumentTextIcon, href: '/admin/document-review' },
    { name: 'Activity Review', icon: LightBulbIcon, href: '/admin/activity-review' },
    { name: 'Expense Review', icon: PresentationChartLineIcon, href: '/admin/expense-review' },
    { name: 'Audit Logs', icon: ClipboardDocumentListIcon, href: '/admin/audit-logs' },
    { name: 'Pending Approval', icon: ClockIcon, href: '/admin/pending-approval' }
  ];

  const navItems = userType === 'client' ? clientNavItems : adminNavItems;

  const handleLogout = () => {
    if (demoMode) {
      disableDemoMode();
    } else {
      logout();
    }
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className={`fixed left-0 top-0 h-screen z-20 transition-all duration-300 ease-in-out bg-white border-r border-gray-200 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <Link to="/" className="flex items-center">
              <BeakerIconSolid className="h-8 w-8 text-[#4772fa]" />
              {!isSidebarCollapsed && (
                <span className="ml-2 text-xl font-['DM_Serif_Display'] text-[#2c3e50]">Direct Research</span>
              )}
            </Link>
          </div>
          <div className="relative flex-1 flex flex-col min-h-0 overflow-y-auto">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-4 bg-white p-1 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors z-30"
            >
              {isSidebarCollapsed ? (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
              )}
            </button>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || 
                                (item.href !== `/${userType}` && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      isActive
                        ? 'bg-[#e8f0ff] text-[#4772fa]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? 'text-[#4772fa]' : 'text-gray-400 group-hover:text-gray-500',
                        'flex-shrink-0 h-6 w-6 transition-colors duration-200'
                      )}
                      aria-hidden="true"
                    />
                    {!isSidebarCollapsed && (
                      <span className="ml-3 text-lg truncate">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                className="flex-shrink-0 w-full group flex items-center px-2 py-2 text-base text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                onClick={handleLogout}
              >
                <ArrowLeftOnRectangleIcon 
                  className="flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500" 
                />
                {!isSidebarCollapsed && (
                  <span className="ml-3 truncate">{demoMode ? 'Exit Demo' : 'Logout'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 transition-opacity md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white transition-transform transform md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <Link to="/" className="flex items-center">
              <BeakerIconSolid className="h-8 w-8 text-[#4772fa]" />
              <span className="ml-2 text-xl font-['DM_Serif_Display'] text-[#2c3e50]">Direct Research</span>
            </Link>
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 h-0 overflow-y-auto">
            <nav className="px-2 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || 
                                (item.href !== `/${userType}` && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      isActive
                        ? 'bg-[#e8f0ff] text-[#4772fa]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-base font-medium rounded-lg'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        isActive ? 'text-[#4772fa]' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-4 flex-shrink-0 h-6 w-6'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              className="flex-shrink-0 w-full group flex items-center px-2 py-2 text-base text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
            >
              <ArrowLeftOnRectangleIcon 
                className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" 
              />
              <span>{demoMode ? 'Exit Demo' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            type="button"
            className="md:hidden px-4 text-gray-500 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-xl font-medium text-gray-900">
                {navItems.find(item => 
                  location.pathname === item.href || 
                  (item.href !== `/${userType}` && location.pathname.startsWith(item.href))
                )?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification dropdown */}
              <div className="relative">
                <button 
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4772fa]"
                >
                  <span className="sr-only">View notifications</span>
                  <div className="relative">
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                    )}
                  </div>
                </button>
              </div>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button 
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4772fa]"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-[#e8f0ff] flex items-center justify-center">
                      <span className="font-medium text-[#4772fa]">JD</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;