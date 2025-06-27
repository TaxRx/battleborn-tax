import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Clock, CheckCircle, AlertCircle, ArrowLeft, Plus, User } from 'lucide-react';
import { CommissionStats } from '../../../types/commission';
import { commissionService } from '../../shared/services/commissionService';
import { useNavigate } from 'react-router-dom';

// Mock transaction data for demonstration
const mockTransactions = [
  {
    id: '1',
    expert_name: 'Sarah Johnson',
    type: 'Expert Payment',
    amount: 2500,
    status: 'completed',
    date: '2024-01-15'
  },
  {
    id: '2',
    expert_name: 'Mike Chen',
    type: 'Affiliate Commission',
    amount: 1200,
    status: 'pending',
    date: '2024-01-14'
  },
  {
    id: '3',
    expert_name: 'Lisa Rodriguez',
    type: 'Expert Payment',
    amount: 3200,
    status: 'completed',
    date: '2024-01-13'
  },
  {
    id: '4',
    expert_name: 'David Kim',
    type: 'Affiliate Commission',
    amount: 800,
    status: 'failed',
    date: '2024-01-12'
  }
];

const CommissionDashboard: React.FC = () => {
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCommissionStats();
  }, []);

  const loadCommissionStats = async () => {
    setLoading(true);
    try {
      const data = await commissionService.getCommissionStats();
      setStats(data);
      setIsDemoMode(true); // Since we're using mock data for now
    } catch (error) {
      console.error('Error loading commission stats:', error);
      // Set fallback data if service fails
      setStats({
        total_expert_payments_received: 0,
        total_affiliate_payments_due: 0,
        total_affiliate_payments_sent: 0,
        monthly_commission_volume: 0,
        pending_assignments: 0,
        active_assignments: 0,
        completed_assignments: 0,
        total_commissions: 0,
        pending_payouts: 0,
        pending_transactions: 0,
        active_experts: 0,
        expert_utilization: 0,
        average_commission: 0,
        expert_workload: [],
        top_performing_affiliates: []
      });
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-financial animate-pulse p-6">
          <div className="h-6 bg-primary-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-primary-200 rounded w-3/4"></div>
                <div className="h-8 bg-primary-200 rounded w-1/2"></div>
              </div>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-800 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Commission Dashboard</h1>
        <p className="text-primary-100">Track expert performance and commission payouts</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-metric">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Total Commissions</p>
              <p className="text-3xl font-bold text-primary-900">${stats.total_commissions?.toLocaleString() || '0'}</p>
              <p className="text-sm text-profit-green font-medium">+12% this month</p>
            </div>
            <DollarSign className="h-12 w-12 text-accent-500" />
          </div>
        </div>

        <div className="card-metric border-l-brand-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Pending Payouts</p>
              <p className="text-3xl font-bold text-primary-900">${stats.pending_payouts?.toLocaleString() || '0'}</p>
              <p className="text-sm text-warning-amber font-medium">{stats.pending_transactions || 0} transactions</p>
            </div>
            <Clock className="h-12 w-12 text-brand-green" />
          </div>
        </div>

        <div className="card-metric border-l-brand-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Active Experts</p>
              <p className="text-3xl font-bold text-primary-900">{stats.active_experts || 0}</p>
              <p className="text-sm text-brand-blue font-medium">{stats.expert_utilization || 0}% utilization</p>
            </div>
            <Users className="h-12 w-12 text-brand-blue" />
          </div>
        </div>

        <div className="card-metric border-l-brand-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Avg. Commission</p>
              <p className="text-3xl font-bold text-primary-900">${stats.average_commission?.toLocaleString() || '0'}</p>
              <p className="text-sm text-brand-pink font-medium">Per completed proposal</p>
            </div>
            <TrendingUp className="h-12 w-12 text-brand-pink" />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card-financial">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-primary-900">Recent Commission Transactions</h2>
              <p className="text-sm text-primary-600">Latest expert payouts and affiliate commissions</p>
            </div>
            <button className="btn-accent">
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Expert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-primary-100">
                {mockTransactions.map((transaction) => (
                  <tr key={transaction.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-primary-900">{transaction.expert_name}</div>
                          <div className="text-sm text-primary-500">Expert</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-profit-green">
                        ${transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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