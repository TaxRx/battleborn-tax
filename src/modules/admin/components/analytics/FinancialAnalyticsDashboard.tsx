// Epic 3 Sprint 4: Financial Analytics Dashboard
// File: FinancialAnalyticsDashboard.tsx
// Purpose: Comprehensive financial analytics and reporting interface
// Story: 4.2 - Financial Analytics & Reporting (8 points)

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import FinancialAnalyticsService, {
  RevenueMetrics,
  CustomerLifetimeValue,
  ChurnAnalysis,
  RevenueForecasting,
  FinancialReport
} from '../../services/financialAnalyticsService';

export default function FinancialAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'30days' | '90days' | '12months'>('30days');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'customers' | 'forecasting' | 'reports'>('overview');
  
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [customerLTVs, setCustomerLTVs] = useState<CustomerLifetimeValue[]>([]);
  const [churnAnalysis, setChurnAnalysis] = useState<ChurnAnalysis | null>(null);
  const [forecasting, setForecasting] = useState<RevenueForecasting[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);

  const analyticsService = new FinancialAnalyticsService();

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '90days':
        start.setDate(end.getDate() - 90);
        break;
      case '12months':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      
      const [metrics, ltvs, churn, forecast, report] = await Promise.all([
        analyticsService.getRevenueMetrics(start, end),
        analyticsService.getCustomerLifetimeValues(20),
        analyticsService.getChurnAnalysis(start, end),
        analyticsService.getRevenueForecasting(6),
        analyticsService.generateFinancialReport('monthly', new Date().toISOString())
      ]);

      setRevenueMetrics(metrics);
      setCustomerLTVs(ltvs);
      setChurnAnalysis(churn);
      setForecasting(forecast);
      setFinancialReport(report);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
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

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
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
        <h1 className="text-2xl font-bold text-gray-900">Financial Analytics</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="12months">Last 12 Months</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {revenueMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">MRR</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueMetrics.mrr)}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              ARR: {formatCurrency(revenueMetrics.arr)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueMetrics.totalRevenue)}</p>
              </div>
              {revenueMetrics.revenueGrowth >= 0 ? (
                <TrendingUpIcon className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDownIcon className="h-8 w-8 text-red-600" />
              )}
            </div>
            <p className={`mt-2 text-sm ${revenueMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(revenueMetrics.revenueGrowth)} vs previous period
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{revenueMetrics.customerCount}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <p className={`mt-2 text-sm ${revenueMetrics.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(revenueMetrics.customerGrowth)} growth
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900">{revenueMetrics.churnRate.toFixed(1)}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              ARPC: {formatCurrency(revenueMetrics.averageRevenuePerCustomer)}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'revenue', label: 'Revenue Analysis' },
            { key: 'customers', label: 'Customer Analytics' },
            { key: 'forecasting', label: 'Forecasting' },
            { key: 'reports', label: 'Reports' }
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
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'overview' && financialReport && (
          <div>
            <h3 className="text-lg font-medium mb-6">Financial Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <div>
                <h4 className="font-medium mb-4">Revenue Breakdown</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Subscription', value: financialReport.subscriptionRevenue },
                        { name: 'One-Time', value: financialReport.oneTimeRevenue }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Payment Success Rate */}
              <div>
                <h4 className="font-medium mb-4">Payment Metrics</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="text-sm font-medium">{financialReport.paymentMetrics.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${financialReport.paymentMetrics.successRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {financialReport.paymentMetrics.totalTransactions}
                      </p>
                      <p className="text-sm text-gray-600">Total Transactions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(financialReport.paymentMetrics.averageTransactionValue)}
                      </p>
                      <p className="text-sm text-gray-600">Avg Transaction</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && forecasting.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-6">Revenue Trends & Analysis</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={forecasting}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="forecastedRevenue" 
                  stroke="#3B82F6" 
                  name="Forecasted Revenue"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'customers' && (
          <div>
            <h3 className="text-lg font-medium mb-6">Customer Analytics</h3>
            
            {/* Customer LTV Table */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">Top Customer Lifetime Values</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Monthly</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projected LTV</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Churn Risk</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerLTVs.slice(0, 10).map(customer => (
                      <tr key={customer.accountId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.accountName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.averageMonthlyValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(customer.projectedLTV)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  customer.churnProbability < 0.3 ? 'bg-green-600' : 
                                  customer.churnProbability < 0.6 ? 'bg-yellow-600' : 'bg-red-600'
                                }`}
                                style={{ width: `${customer.churnProbability * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {(customer.churnProbability * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Churn Analysis */}
            {churnAnalysis && (
              <div>
                <h4 className="font-medium mb-4">Churn Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Churn Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{churnAnalysis.churnRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Avg Customer Lifespan</p>
                    <p className="text-2xl font-bold text-gray-900">{churnAnalysis.averageLifespan.toFixed(1)} months</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">At Risk Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{churnAnalysis.highRiskCustomers.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'forecasting' && (
          <div>
            <h3 className="text-lg font-medium mb-6">Revenue Forecasting</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={forecasting}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="forecastedRevenue" fill="#3B82F6" name="Forecasted Revenue" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {forecasting.slice(0, 3).map(forecast => (
                <div key={forecast.period} className="bg-gray-50 p-4 rounded">
                  <h5 className="font-medium mb-2">{forecast.period}</h5>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(forecast.forecastedRevenue)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Confidence: {(forecast.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && financialReport && (
          <div>
            <h3 className="text-lg font-medium mb-6">Financial Report - {financialReport.period}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Revenue Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-medium">{formatCurrency(financialReport.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Subscription Revenue</span>
                    <span className="font-medium">{formatCurrency(financialReport.subscriptionRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">One-Time Revenue</span>
                    <span className="font-medium">{formatCurrency(financialReport.oneTimeRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Refunds</span>
                    <span className="font-medium text-red-600">-{formatCurrency(financialReport.refunds)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold">
                    <span>Net Revenue</span>
                    <span>{formatCurrency(financialReport.netRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Customer Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">New Customers</span>
                    <span className="font-medium text-green-600">+{financialReport.customerMetrics.newCustomers}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Churned Customers</span>
                    <span className="font-medium text-red-600">-{financialReport.customerMetrics.churnedCustomers}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold">
                    <span>Total Active</span>
                    <span>{financialReport.customerMetrics.totalActive}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Export Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}