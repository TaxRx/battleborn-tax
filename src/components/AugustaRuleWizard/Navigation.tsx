import React from 'react';
import { Calculator, LayoutDashboard, FileText, Menu, X } from 'lucide-react';

interface NavigationProps {
  isMobile: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onClose: () => void;
}

export default function Navigation({ 
  isMobile, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  onClose 
}: NavigationProps) {
  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      onClick: onClose,
      active: false
    },
    {
      label: 'Augusta Rule Wizard',
      icon: Calculator,
      onClick: () => {},
      active: true
    },
    {
      label: 'Tax Strategies',
      icon: FileText,
      onClick: () => {},
      active: false,
      disabled: true
    }
  ];

  const renderMenuContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2">
          <Calculator className="h-8 w-8 text-navy" />
          <span className="text-xl font-bold">TaxRx</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            disabled={item.disabled}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              item.active 
                ? 'bg-navy text-white' 
                : item.disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-navy-50'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        >
          <Menu size={24} />
        </button>

        {isMobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
              {renderMenuContent()}
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r">
      {renderMenuContent()}
    </div>
  );
}