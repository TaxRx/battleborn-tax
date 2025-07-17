// Epic 3 Sprint 4: Commission Management Dashboard
// File: CommissionDashboard.tsx
// Purpose: Commission tracking, payouts, and analytics interface
// Story: 4.4 - Commission Management System (6 points)

import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  TrendingUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import CommissionManagementService, {
  CommissionRecord,
  CommissionPayout,
  CommissionSummary,
  CommissionAnalytics,
  CommissionTier
} from '../../services/commissionManagementService';

export default function CommissionDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'payouts' | 'tiers' | 'analytics'>('overview');
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('');
  
  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>([]);
  const [commissionPayouts, setCommissionPayouts] = useState<CommissionPayout[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary[]>([]);
  const [commissionAnalytics, setCommissionAnalytics] = useState<CommissionAnalytics | null>(null);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);
  const [showCreatePayout, setShowCreatePayout] = useState(false);
  const [showCreateTier, setShowCreateTier] = useState(false);

  const commissionService = new CommissionManagementService();

  useEffect(() => {
    loadCommissionData();
  }, [selectedAffiliate]);

  const loadCommissionData = async () => {
    try {
      setLoading(true);
      
      const [records, payouts, summary, tiers] = await Promise.all([
        commissionService.getCommissionRecords(selectedAffiliate || undefined, { limit: 50 }),
        commissionService.getCommissionPayouts(selectedAffiliate || undefined, { limit: 50 }),
        commissionService.getCommissionSummary(selectedAffiliate || undefined),
        commissionService.getCommissionTiers()
      ]);

      setCommissionRecords(records);
      setCommissionPayouts(payouts);
      setCommissionSummary(summary);
      setCommissionTiers(tiers);

      // Get analytics for the last 90 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);
      
      const analytics = await commissionService.getCommissionAnalytics(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setCommissionAnalytics(analytics);
    } catch (error) {
      console.error('Error loading commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommission = async (commissionId: string) => {
    try {
      const result = await commissionService.approveCommission(commissionId);
      if (result.success) {
        loadCommissionData();
      }
    } catch (error) {
      console.error('Error approving commission:', error);
    }
  };

  const handleCreatePayout = async (affiliateId: string, payoutMethod: string) => {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const result = await commissionService.createCommissionPayout(
        affiliateId,
        currentMonth,
        payoutMethod as any
      );
      if (result.success) {
        setShowCreatePayout(false);
        loadCommissionData();
      }
    } catch (error) {
      console.error('Error creating payout:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'clawed_back': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedAffiliate}
            onChange={(e) => setSelectedAffiliate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Affiliates</option>
            {commissionSummary.map(affiliate => (
              <option key={affiliate.affiliateId} value={affiliate.affiliateId}>
                {affiliate.affiliateName}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreatePayout(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Payout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {commissionAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(commissionAnalytics.totalCommissionsPaid)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(commissionAnalytics.totalPendingCommissions)}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {commissionAnalytics.averageCommissionRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Affiliates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {commissionSummary.length}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'records', label: 'Commission Records' },
            { key: 'payouts', label: 'Payouts' },
            { key: 'tiers', label: 'Tiers' },
            { key: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-6">Commission Overview</h3>
            
            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-4">Top Performing Affiliates</h4>
                <div className="space-y-3">
                  {commissionSummary.slice(0, 5).map(affiliate => (
                    <div key={affiliate.affiliateId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{affiliate.affiliateName}</p>
                        <p className="text-xs text-gray-600">{affiliate.currentTier}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(affiliate.lifetimeEarnings)}</p>
                        <p className="text-xs text-gray-600">lifetime</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Commission Distribution by Tier</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(commissionAnalytics?.commissionsByTier || {}).map(([tier, amount]) => ({
                        name: tier,
                        value: amount
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(commissionAnalytics?.commissionsByTier || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-6">Commission Records</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissionRecords.map(record => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.affiliateName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(record.totalCommission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.commissionRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.tierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.status === 'pending' && (
                          <button
                            onClick={() => handleApproveCommission(record.id)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-6">Commission Payouts</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissionPayouts.map(payout => (
                    <tr key={payout.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payout.affiliateName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payout.payoutPeriod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payout.netPayout)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payout.payoutMethod.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payout.payoutStatus)}`}>
                          {payout.payoutStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payout.payoutDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Commission Tiers</h3>
              <button
                onClick={() => setShowCreateTier(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Tier
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commissionTiers.map(tier => (
                <div key={tier.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-lg">{tier.tierName}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Level:</span>
                      <span className="font-medium">{tier.tierLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Sales:</span>
                      <span className="font-medium">{formatCurrency(tier.minimumSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission Rate:</span>
                      <span className="font-medium">{tier.commissionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonus Rate:</span>
                      <span className="font-medium">{tier.bonusRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && commissionAnalytics && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-6">Commission Analytics</h3>
            
            {/* Monthly Trends */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">Monthly Commission Trends</h4>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={commissionAnalytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalCommissions" 
                    stroke="#3B82F6" 
                    name="Total Commissions"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalPayouts" 
                    stroke="#10B981" 
                    name="Total Payouts"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Performers */}
            <div>
              <h4 className="font-medium mb-4">Top Performing Affiliates</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earnings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissionAnalytics.topPerformingAffiliates.map(affiliate => (
                      <tr key={affiliate.affiliateId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.affiliateName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(affiliate.totalEarnings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.conversionRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Payout Modal */}
      {showCreatePayout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Create Commission Payout</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Select affiliate...</option>
                  {commissionSummary.map(affiliate => (
                    <option key={affiliate.affiliateId} value={affiliate.affiliateId}>
                      {affiliate.affiliateName} - {formatCurrency(affiliate.pendingCommissions)} pending
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout Method</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreatePayout(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreatePayout('', 'bank_transfer')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}