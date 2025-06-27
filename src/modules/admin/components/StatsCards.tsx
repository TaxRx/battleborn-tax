import React from 'react';
import { AdminStats } from '../../shared/types';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface StatsCardsProps {
  stats: AdminStats | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  // Mock data for demonstration
  const mockStats = {
    total_proposals: 127,
    pending_review: 23,
    total_savings_projected: 2847500,
    active_clients: 45,
    monthly_growth: 12.5,
    proposals_by_status: {
      draft: 5,
      submitted: 23,
      in_review: 15,
      approved: 89,
      rejected: 8,
      finalized: 45,
      implemented: 34
    },
    average_review_time: 2.5,
    expert_utilization: 78
  };

  const displayStats = stats || mockStats;

  const statCards = [
    {
      title: 'Total Proposals',
      value: displayStats.total_proposals || 0,
      change: '+12%',
      changeType: 'positive' as const,
      icon: FileText,
      description: 'All time submissions',
      color: 'blue'
    },
    {
      title: 'Pending Review',
      value: displayStats.pending_review || 0,
      change: '+3',
      changeType: 'neutral' as const,
      icon: Clock,
      description: 'Awaiting approval',
      color: 'orange'
    },
    {
      title: 'Approved',
      value: displayStats.proposals_by_status?.approved || 0,
      change: '+8%',
      changeType: 'positive' as const,
      icon: CheckCircle,
      description: 'Ready for experts',
      color: 'emerald'
    },
    {
      title: 'Total Savings',
      value: displayStats.total_savings_projected || 0,
      change: '+15.2%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'Client tax savings',
      color: 'purple',
      format: 'currency'
    }
  ];

  const formatValue = (value: number | undefined, format?: string) => {
    if (value === undefined || value === null) {
      return '0';
    }
    
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString();
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          accent: 'border-blue-200'
        };
      case 'orange':
        return {
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          accent: 'border-orange-200'
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          accent: 'border-emerald-200'
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          accent: 'border-purple-200'
        };
      default:
        return {
          iconBg: 'bg-slate-100',
          iconColor: 'text-slate-600',
          accent: 'border-slate-200'
        };
    }
  };

  const getChangeIcon = (changeType: 'positive' | 'negative' | 'neutral') => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="h-3 w-3" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getChangeColor = (changeType: 'positive' | 'negative' | 'neutral') => {
    switch (changeType) {
      case 'positive':
        return 'text-emerald-600 bg-emerald-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  if (!displayStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="metric-card-modern">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                <div className="w-8 h-4 bg-slate-200 rounded"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const colors = getColorClasses(stat.color);
        
        return (
          <div 
            key={index} 
            className={`metric-card-modern border-l-4 ${colors.accent}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${colors.iconBg}`}>
                <Icon className={`h-5 w-5 ${colors.iconColor}`} />
              </div>
              <div className={`metric-change-modern ${getChangeColor(stat.changeType)}`}>
                {getChangeIcon(stat.changeType)}
                <span>{stat.change}</span>
              </div>
            </div>
            
            <div className="metric-value-modern">
              {formatValue(stat.value, stat.format)}
            </div>
            
            <div className="metric-label-modern mb-1">
              {stat.title}
            </div>
            
            <p className="text-body-sm text-slate-500">
              {stat.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards; 