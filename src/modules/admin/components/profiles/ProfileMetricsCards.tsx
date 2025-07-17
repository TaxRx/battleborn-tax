// Epic 3 Sprint 3 Day 1: Profile Metrics Cards Component
// File: ProfileMetricsCards.tsx
// Purpose: Display key profile metrics in card format
// Story: 3.1 - Profile Management CRUD Operations

import React from 'react';
import { ProfileMetrics, ProfileFilters } from '../../services/adminProfileService';

interface ProfileMetricsCardsProps {
  metrics: ProfileMetrics;
  onMetricClick: (filter: Partial<ProfileFilters>) => void;
}

const ProfileMetricsCards: React.FC<ProfileMetricsCardsProps> = ({ metrics, onMetricClick }) => {
  const cards = [
    {
      title: 'Total Profiles',
      value: metrics.total_profiles,
      icon: '👥',
      color: 'blue',
      onClick: () => onMetricClick({}),
      description: 'All profiles in system'
    },
    {
      title: 'Active',
      value: metrics.active_profiles,
      icon: '✅',
      color: 'green',
      onClick: () => onMetricClick({ status: 'active' }),
      description: 'Currently active profiles'
    },
    {
      title: 'Pending',
      value: metrics.pending_profiles,
      icon: '⏳',
      color: 'yellow',
      onClick: () => onMetricClick({ status: 'pending' }),
      description: 'Awaiting activation'
    },
    {
      title: 'Suspended',
      value: metrics.suspended_profiles,
      icon: '🚫',
      color: 'red',
      onClick: () => onMetricClick({ status: 'suspended' }),
      description: 'Suspended profiles'
    },
    {
      title: 'Verified',
      value: metrics.verified_profiles,
      icon: '✓',
      color: 'green',
      onClick: () => onMetricClick({ verificationStatus: 'verified' }),
      description: 'Email verified'
    },
    {
      title: 'Sync Conflicts',
      value: metrics.sync_conflicts,
      icon: '⚠️',
      color: 'orange',
      onClick: () => onMetricClick({ syncStatus: 'conflict' }),
      description: 'Auth sync issues'
    },
    {
      title: '2FA Enabled',
      value: metrics.profiles_with_2fa,
      icon: '🔐',
      color: 'purple',
      onClick: () => onMetricClick({}),
      description: 'Two-factor authentication'
    },
    {
      title: 'Never Logged In',
      value: metrics.never_logged_in,
      icon: '👤',
      color: 'gray',
      onClick: () => onMetricClick({ lastLoginRange: 'never' }),
      description: 'No login activity'
    }
  ];

  const getCardClasses = (color: string) => {
    const colorClasses = {
      blue: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
      green: 'border-green-200 hover:border-green-300 hover:bg-green-50',
      yellow: 'border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50',
      red: 'border-red-200 hover:border-red-300 hover:bg-red-50',
      orange: 'border-orange-200 hover:border-orange-300 hover:bg-orange-50',
      purple: 'border-purple-200 hover:border-purple-300 hover:bg-purple-50',
      gray: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    };
    
    return `${colorClasses[color as keyof typeof colorClasses] || colorClasses.gray}`;
  };

  const getValueColor = (color: string) => {
    const colorClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
      purple: 'text-purple-600',
      gray: 'text-gray-600'
    };
    
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          onClick={card.onClick}
          className={`
            bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200
            ${getCardClasses(card.color)}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{card.icon}</span>
                <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              </div>
              <div className={`text-2xl font-bold ${getValueColor(card.color)}`}>
                {card.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
          </div>
        </div>
      ))}
      
      {/* Role Distribution */}
      {Object.keys(metrics.profiles_by_role).length > 0 && (
        <div className="md:col-span-2 lg:col-span-2 bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
            <span>🎯</span>
            Profiles by Role
          </h3>
          <div className="space-y-2">
            {Object.entries(metrics.profiles_by_role).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                  onClick={() => onMetricClick({ role })}
                >
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {role}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Account Type Distribution */}
      {Object.keys(metrics.profiles_by_account_type).length > 0 && (
        <div className="md:col-span-2 lg:col-span-2 bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
            <span>🏢</span>
            Profiles by Account Type
          </h3>
          <div className="space-y-2">
            {Object.entries(metrics.profiles_by_account_type).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                  onClick={() => onMetricClick({ accountType: type })}
                >
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMetricsCards;