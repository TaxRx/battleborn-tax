import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  DocumentTextIcon,
  CalculatorIcon,
  CreditCardIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LightBulbIcon // Add a new icon for Solutions
} from '@heroicons/react/24/outline';
import { useUser } from '../../context/UserContext';

interface MenuItem {
  name: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
  },
  {
    name: 'Business Info',
    href: '/business-info',
    icon: UserGroupIcon,
  },
  {
    name: 'Document Upload',
    href: '/document-upload',
    icon: DocumentTextIcon,
  },
  {
    name: 'Qualified Activities',
    href: '/qualified-activities',
    icon: CalculatorIcon,
  },
  {
    name: 'Research Outcomes',
    href: '/research-outcomes',
    icon: ChartBarIcon,
    children: [
      {
        name: 'Enter Data',
        href: '/research-outcomes',
      },
      {
        name: 'Dashboard',
        href: '/research-outcomes/dashboard',
      },
    ],
  },
  {
    name: 'Databank',
    href: '/databank',
    icon: DocumentTextIcon,
  },
  {
    name: 'Payment',
    href: '/payment',
    icon: CreditCardIcon,
  },
  {
    name: 'Solutions',
    href: '/client/solutions',
    icon: LightBulbIcon,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: CogIcon,
  },
];

const SideMenu: React.FC = () => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});
  const { user } = useUser();
  // Be tolerant to different shapes; default to 'client'
  const userRole = (user as any)?.user_metadata?.role || (user as any)?.role || 'client';

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const isChildActive = (children: MenuItem[] = []) => {
    return children.some(child => location.pathname === child.href);
  };

  // Only show Solutions for client users
  const filteredMenuItems = userRole === 'client'
    ? menuItems
    : menuItems.filter(item => item.name !== 'Solutions');

  return (
    <nav className="space-y-1">
      {filteredMenuItems.map((item) => (
        <div key={item.name}>
          {item.children ? (
            <div>
              <button
                onClick={() => toggleExpand(item.name)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md ${
                  isChildActive(item.children)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  {item.icon && (
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isChildActive(item.children)
                          ? 'text-blue-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                  )}
                  {item.name}
                </div>
                {expandedItems[item.name] ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
              {expandedItems[item.name] && (
                <div className="pl-8 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      to={child.href}
                      className={`block px-4 py-2 text-sm font-medium rounded-md ${
                        isActive(child.href)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              to={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon && (
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive(item.href)
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
              )}
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default SideMenu; 