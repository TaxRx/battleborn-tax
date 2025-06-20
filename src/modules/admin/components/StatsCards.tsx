import React from 'react';
import { FileText, Users, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { AdminStats } from '../../shared/types';

interface StatsCardsProps {
  stats: AdminStats;
  loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-professional animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Proposals',
      value: stats.total_proposals,
      icon: FileText,
      color: 'blue',
      subtitle: `${stats.monthly_growth}% growth this month`
    },
    {
      title: 'Pending Review',
      value: stats.pending_review,
      icon: Clock,
      color: 'orange',
      subtitle: `Avg review: ${stats.average_review_time}h`
    },
    {
      title: 'Projected Savings',
      value: `$${stats.total_savings_projected.toLocaleString()}`,
      icon: TrendingUp,
      color: 'green',
      subtitle: 'Annual tax savings'
    },
    {
      title: 'Active Clients',
      value: stats.active_clients,
      icon: Users,
      color: 'purple',
      subtitle: `${stats.expert_utilization}% expert utilization`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'orange' | 'green' | 'purple';
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  return (
    <div className="card-professional-hover">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCards; 