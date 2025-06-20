import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  BellIcon,
  FlagIcon,
  FolderIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useUser } from '../../context/UserContext';

interface SidebarProps {
  onCollapse: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useUser();

  const handleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapse(newCollapsedState);
  };

  return (
    <aside className={`bg-white border-r border-gray-100 h-screen fixed left-0 top-16 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <button
        onClick={handleCollapse}
        className="absolute -right-3 top-4 bg-white p-1 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>

      <nav className="p-4 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg transition-colors duration-200 ${
              isActive 
                ? 'bg-[#e8f0ff] text-[#4772fa]' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <HomeIcon className="h-6 w-6" />
          {!isCollapsed && <span className="ml-3 text-lg font-medium">Home</span>}
        </NavLink>

        {/* Admin links: only show if user is admin */}
        {user?.role === 'admin' && <>
          <NavLink
            to="/admin/document-review"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <DocumentTextIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">Document Review</span>}
          </NavLink>
          <NavLink
            to="/admin/activity-review"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <ChartBarIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">Activity Review</span>}
          </NavLink>
          <NavLink
            to="/admin/rd-tax-credit"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <DocumentTextIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">R&D Tax Credit</span>}
          </NavLink>
          <NavLink
            to="/admin/expense-review"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <DocumentDuplicateIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">Expense Review</span>}
          </NavLink>
          <NavLink
            to="/admin/pending-approval"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <FlagIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">Pending Approval</span>}
          </NavLink>
          <NavLink
            to="/admin/audit-logs"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <ChartBarIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">Audit Log</span>}
          </NavLink>
        </>}
        {/* End admin links */}

        {/* Client links: only show if user is client */}
        {user?.role === 'client' && <>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <BellIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">Notifications</span>}
          </NavLink>
          <NavLink
            to="/goals"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <FlagIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">Goals</span>}
          </NavLink>
          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <DocumentTextIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">Documents</span>}
          </NavLink>
          <NavLink
            to="/team"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#e8f0ff] text-[#4772fa]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <UserGroupIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-lg font-medium">Team</span>}
          </NavLink>
        </>}

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg transition-colors duration-200 ${
              isActive 
                ? 'bg-[#e8f0ff] text-[#4772fa]' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <ChartBarIcon className="h-6 w-6" />
          {!isCollapsed && <span className="ml-3 text-lg font-medium">Analytics</span>}
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar; 