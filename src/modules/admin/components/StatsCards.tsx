import React from 'react';
import { AdminStats } from '../types/proposal';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';

interface StatsCardsProps {
  stats: AdminStats | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const statCards = [
    {
      title: 'Total Proposals',
      value: formatNumber(stats.totalProposals),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: null
    },
    {
      title: 'Pending Review',
      value: formatNumber(stats.pendingReview),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: null
    },
    {
      title: 'Approved',
      value: formatNumber(stats.approved),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: null
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: null
    },
    {
      title: 'Average Savings',
      value: formatCurrency(stats.averageSavings),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      change: null
    },
    {
      title: 'Implemented',
      value: formatNumber(stats.implemented),
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: null
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Strategies */}
      {stats.topStrategies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Top Performing Strategies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topStrategies.map((strategy, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{strategy.name}</h4>
                  <span className="text-sm text-gray-500">{strategy.count} uses</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(strategy.averageSavings)}
                </p>
                <p className="text-xs text-gray-500">average savings</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'approved' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCards; 