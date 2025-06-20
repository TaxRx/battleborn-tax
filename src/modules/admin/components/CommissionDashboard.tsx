import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { CommissionStats } from '../../../types/commission';
import { commissionService } from '../../shared/services/commissionService';

const CommissionDashboard: React.FC = () => {
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommissionStats();
  }, []);

  const loadCommissionStats = async () => {
    setLoading(true);
    try {
      const data = await commissionService.getCommissionStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading commission stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No commission data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Commission Dashboard</h1>
        <button
          onClick={loadCommissionStats}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card-professional p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expert Payments Received</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.total_expert_payments_received.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card-professional p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Affiliate Payments Due</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.total_affiliate_payments_due.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card-professional p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Affiliate Payments Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.total_affiliate_payments_sent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card-professional p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.monthly_commission_volume.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-professional p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assignment Status</h3>
            <AlertCircle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-lg font-semibold text-yellow-600">
                {stats.pending_assignments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active</span>
              <span className="text-lg font-semibold text-blue-600">
                {stats.active_assignments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="text-lg font-semibold text-green-600">
                {stats.completed_assignments}
              </span>
            </div>
          </div>
        </div>

        {/* Expert Workload */}
        <div className="card-professional p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expert Workload</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.expert_workload.slice(0, 5).map((expert) => (
              <div key={expert.expert_id} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {expert.expert_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {expert.current_workload}/{expert.max_capacity}
                  </p>
                </div>
                <div className="ml-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    expert.utilization_rate >= 90 ? 'bg-red-100 text-red-800' :
                    expert.utilization_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {expert.utilization_rate.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Affiliates */}
        <div className="card-professional p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Affiliates</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.top_performing_affiliates.slice(0, 5).map((affiliate) => (
              <div key={affiliate.affiliate_id} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {affiliate.affiliate_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {affiliate.proposal_count} proposals
                  </p>
                </div>
                <div className="ml-2">
                  <span className="text-sm font-semibold text-green-600">
                    ${affiliate.total_commission.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            {stats.top_performing_affiliates.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No affiliate data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          title="Record Expert Payment"
          description="Log payments received from experts"
          icon={DollarSign}
          href="/admin/payments/record"
        />
        <QuickActionCard
          title="Process Affiliate Payments"
          description="Send commission payments to affiliates"
          icon={CheckCircle}
          href="/admin/payments/process"
        />
        <QuickActionCard
          title="Assignment Queue"
          description="Review and assign proposals to experts"
          icon={Users}
          href="/admin/assignments"
        />
      </div>
    </div>
  );
};

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  href 
}) => {
  return (
    <div className="card-professional p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default CommissionDashboard; 