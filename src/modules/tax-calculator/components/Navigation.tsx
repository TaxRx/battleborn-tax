import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calculator, User, LogOut, Menu, X, FileText, Settings, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  userType: string;
}

export default function Navigation({ 
  currentView, 
  onViewChange,
  isAuthenticated,
  onLoginClick,
  onLogoutClick,
  userType
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleViewChange = (view: string) => {
    navigate(`/${view}`);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      onLogoutClick();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'tax-calculator',
      label: 'Tax Estimator',
      icon: Calculator,
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'solutions',
      label: 'Solutions',
      icon: Lightbulb,
      gradient: 'from-yellow-400 to-yellow-600'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      gradient: 'from-amber-500 to-amber-600'
    }
  ];

  // Admin-specific navigation items
  const adminNavigationItems = [
    {
      id: 'admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'admin/clients',
      label: 'Clients',
      icon: User,
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'admin/advisors',
      label: 'Advisors',
      icon: User,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'admin/groups',
      label: 'Groups',
      icon: User,
      gradient: 'from-yellow-400 to-yellow-600'
    },
    {
      id: 'admin/strategies',
      label: 'Strategies',
      icon: Lightbulb,
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      id: 'admin/rd-tax-credit',
      label: 'R&D Tax Credit',
      icon: Calculator,
      gradient: 'from-red-500 to-red-600'
    }
  ];

  const renderNavigationContent = () => (
    <>
      <div className={`mb-8 ${!isExpanded && 'flex justify-center'}`}>
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 rounded-lg">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          {isExpanded && <span className="text-xl font-bold text-white">TaxRx</span>}
        </div>
      </div>

      <nav className="space-y-2">
        {(userType === 'admin' ? adminNavigationItems : navigationItems).map(item => (
          <button
            key={item.id}
            onClick={() => handleViewChange(item.id)}
            className={`w-full flex items-center ${isExpanded ? 'px-4' : 'justify-center'} py-3 rounded-lg transition-all duration-300
              ${location.pathname === `/${item.id}` || location.pathname.startsWith(`/${item.id}/`)
                ? `bg-gradient-to-r ${item.gradient} shadow-lg` 
                : 'text-white/80 hover:bg-white/10'}`}
          >
            <item.icon size={20} className={location.pathname === `/${item.id}` || location.pathname.startsWith(`/${item.id}/`) ? 'text-white' : 'text-white/80'} />
            {isExpanded && (
              <span className={`ml-3 ${location.pathname === `/${item.id}` || location.pathname.startsWith(`/${item.id}/`) ? 'text-white font-medium' : 'text-white/80'}`}>
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className={`absolute bottom-6 ${isExpanded ? 'left-6 right-6' : 'left-0 right-0'}`}>
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isExpanded ? 'px-4' : 'justify-center'} py-3 rounded-lg text-white/80 hover:bg-white/10 transition-colors`}
          >
            <LogOut size={20} />
            {isExpanded && <span className="ml-3">Sign Out</span>}
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className={`w-full flex items-center ${isExpanded ? 'px-4' : 'justify-center'} py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all`}
          >
            <LogOut size={20} />
            {isExpanded && <span className="ml-3">Sign In</span>}
          </button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-gray-800 to-gray-900 z-[150] px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-white">TaxRx</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-white/80 hover:text-white"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-[150]"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed right-0 top-0 bottom-0 w-64 bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg z-[151] p-6"
              >
                {renderNavigationContent()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="h-16" />
      </>
    );
  }

  return (
    <div 
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg transition-all duration-300 z-[150] ${isExpanded ? 'w-64' : 'w-20'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="p-6">
        {renderNavigationContent()}
      </div>
    </div>
  );
}