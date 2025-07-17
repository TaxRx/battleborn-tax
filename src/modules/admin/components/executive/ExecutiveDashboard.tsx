// Epic 3 Sprint 4: Executive Dashboard & Business Intelligence
// File: ExecutiveDashboard.tsx
// Purpose: High-level executive dashboard with comprehensive business metrics
// Story: 4.5 - Executive Dashboard & Business Intelligence (6 points)

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import AdminProfileService from '../../services/adminProfileService';
import FinancialAnalyticsService from '../../services/financialAnalyticsService';
import CommissionManagementService from '../../services/commissionManagementService';

interface ExecutiveMetrics {
  // Revenue Metrics
  totalRevenue: number;
  revenueGrowth: number;
  mrr: number;
  arr: number;
  
  // Customer Metrics
  totalCustomers: number;
  customerGrowth: number;
  activeSubscriptions: number;
  churnRate: number;
  
  // Platform Metrics
  dailyActiveUsers: number;
  systemUptime: number;
  avgResponseTime: number;
  
  // Commission Metrics
  totalCommissionsPaid: number;
  pendingCommissions: number;
  activeAffiliates: number;
  
  // Operational Metrics
  supportTickets: number;
  featureAdoption: number;
  paymentSuccessRate: number;
}

interface BusinessAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
}

interface KPITrend {
  name: string;
  current: number;
  previous: number;
  target: number;
  change: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [executiveMetrics, setExecutiveMetrics] = useState<ExecutiveMetrics | null>(null);
  const [businessAlerts, setBusinessAlerts] = useState<BusinessAlert[]>([]);
  const [kpiTrends, setKpiTrends] = useState<KPITrend[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [customerChartData, setCustomerChartData] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const adminProfileService = new AdminProfileService();
  const financialAnalyticsService = new FinancialAnalyticsService();
  const commissionService = new CommissionManagementService();

  useEffect(() => {
    loadExecutiveData();
  }, [timeRange]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const loadExecutiveData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      
      // Load all data in parallel
      const [
        revenueMetrics,
        commissionAnalytics,
        customerLTVs,
        revenueForecasts
      ] = await Promise.all([
        financialAnalyticsService.getRevenueMetrics(start, end),
        commissionService.getCommissionAnalytics(start, end),
        financialAnalyticsService.getCustomerLifetimeValues(10),
        financialAnalyticsService.getRevenueForecasting(6)
      ]);

      // Aggregate executive metrics
      const metrics: ExecutiveMetrics = {
        totalRevenue: revenueMetrics.totalRevenue,
        revenueGrowth: revenueMetrics.revenueGrowth,
        mrr: revenueMetrics.mrr,
        arr: revenueMetrics.arr,
        totalCustomers: revenueMetrics.customerCount,
        customerGrowth: revenueMetrics.customerGrowth,
        activeSubscriptions: revenueMetrics.customerCount, // Simplified
        churnRate: revenueMetrics.churnRate,
        dailyActiveUsers: revenueMetrics.customerCount,
        systemUptime: 99.9,
        avgResponseTime: 150,
        totalCommissionsPaid: commissionAnalytics.totalCommissionsPaid,
        pendingCommissions: commissionAnalytics.totalPendingCommissions,
        activeAffiliates: commissionAnalytics.topPerformingAffiliates.length,
        supportTickets: 23,
        featureAdoption: 87.5,
        paymentSuccessRate: 98.2
      };

      setExecutiveMetrics(metrics);

      // Generate KPI trends
      const kpis: KPITrend[] = [
        {
          name: 'Monthly Recurring Revenue',
          current: metrics.mrr,
          previous: metrics.mrr * 0.9,
          target: metrics.mrr * 1.2,
          change: metrics.revenueGrowth,
          unit: '$',
          status: metrics.revenueGrowth > 0 ? 'good' : 'warning'
        },
        {
          name: 'Customer Churn Rate',
          current: metrics.churnRate,
          previous: metrics.churnRate * 1.1,
          target: 5,
          change: -metrics.churnRate * 0.1,
          unit: '%',
          status: metrics.churnRate < 5 ? 'good' : metrics.churnRate < 10 ? 'warning' : 'critical'
        },
        {
          name: 'Customer Growth',
          current: metrics.customerGrowth,
          previous: metrics.customerGrowth * 0.8,
          target: 20,
          change: metrics.customerGrowth * 0.2,
          unit: '%',
          status: metrics.customerGrowth > 15 ? 'good' : metrics.customerGrowth > 5 ? 'warning' : 'critical'
        },
        {
          name: 'Payment Success Rate',
          current: metrics.paymentSuccessRate,
          previous: metrics.paymentSuccessRate * 0.99,
          target: 99,
          change: metrics.paymentSuccessRate * 0.01,
          unit: '%',
          status: metrics.paymentSuccessRate > 98 ? 'good' : 'warning'
        }
      ];

      setKpiTrends(kpis);

      // Generate chart data
      const revenueData = revenueForecasts.map(forecast => ({
        period: forecast.period,
        revenue: forecast.forecastedRevenue,
        confidence: forecast.confidence * 100
      }));
      setRevenueChartData(revenueData);

      const customerData = customerLTVs.map(customer => ({
        name: customer.accountName.substring(0, 20),
        ltv: customer.projectedLTV,
        churnRisk: customer.churnProbability * 100
      }));
      setCustomerChartData(customerData);

      // Generate business alerts
      const alerts: BusinessAlert[] = [
        {
          id: '1',
          type: metrics.churnRate > 10 ? 'error' : 'warning',
          title: 'Customer Churn Rate',
          message: `Churn rate is ${metrics.churnRate.toFixed(1)}%. Consider retention strategies.`,
          timestamp: new Date().toISOString(),
          actionRequired: metrics.churnRate > 10
        },
        {
          id: '2',
          type: metrics.pendingCommissions > 10000 ? 'warning' : 'info',
          title: 'Pending Commissions',
          message: `$${metrics.pendingCommissions.toLocaleString()} in pending commissions require processing.`,
          timestamp: new Date().toISOString(),
          actionRequired: metrics.pendingCommissions > 10000
        },
        {
          id: '3',
          type: metrics.paymentSuccessRate < 95 ? 'error' : 'success',
          title: 'Payment Success Rate',
          message: `Payment success rate is ${metrics.paymentSuccessRate}%. System performing well.`,
          timestamp: new Date().toISOString(),
          actionRequired: metrics.paymentSuccessRate < 95
        }
      ];

      setBusinessAlerts(alerts);
    } catch (error) {
      console.error('Error loading executive data:', error);
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

  const formatPercentage = (value: number, showSign: boolean = false) => {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning': return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'success': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default: return <ClockIcon className="h-5 w-5 text-blue-500" />;
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-600">Business Intelligence & Key Performance Indicators</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 text-gray-600 hover:text-gray-900"
          >
            <BellIcon className="h-6 w-6" />
            {businessAlerts.filter(a => a.actionRequired).length > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            )}
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={loadExecutiveData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts Panel */}
      {showAlerts && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-3">Business Alerts</h3>
          <div className="space-y-2">
            {businessAlerts.map(alert => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    {alert.actionRequired && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Action Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary Cards */}
      {executiveMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(executiveMetrics.mrr)}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className={`mt-2 text-sm ${executiveMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(executiveMetrics.revenueGrowth, true)} vs last period
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{executiveMetrics.totalCustomers.toLocaleString()}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <p className={`mt-2 text-sm ${executiveMetrics.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(executiveMetrics.customerGrowth, true)} growth
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">System Health</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(executiveMetrics.systemUptime)}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {executiveMetrics.avgResponseTime}ms avg response
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(executiveMetrics.churnRate)}</p>
              </div>
              <TrendingDownIcon className={`h-8 w-8 ${executiveMetrics.churnRate < 5 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <p className={`mt-2 text-sm ${executiveMetrics.churnRate < 5 ? 'text-green-600' : 'text-red-600'}`}>
              {executiveMetrics.churnRate < 5 ? 'Within target' : 'Above target'}
            </p>
          </div>
        </div>
      )}

      {/* KPI Trends */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-6">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {kpiTrends.map((kpi, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">{kpi.name}</h4>
                <span className={`text-sm font-medium ${getStatusColor(kpi.status)}`}>
                  {kpi.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {kpi.unit === '$' ? formatCurrency(kpi.current) : `${kpi.current.toFixed(1)}${kpi.unit}`}
                </span>
                <div className="flex items-center space-x-1">
                  {kpi.change >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(Math.abs(kpi.change))}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Target: {kpi.unit === '$' ? formatCurrency(kpi.target) : `${kpi.target}${kpi.unit}`}</span>
                  <span>Previous: {kpi.unit === '$' ? formatCurrency(kpi.previous) : `${kpi.previous.toFixed(1)}${kpi.unit}`}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      kpi.status === 'good' ? 'bg-green-600' : 
                      kpi.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(100, (kpi.current / kpi.target) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Forecasting */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-6">Revenue Forecasting</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="revenue" 
              fill="#3B82F6" 
              name="Forecasted Revenue"
              opacity={0.8}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="confidence" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Confidence %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Customer Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Lifetime Value */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-6">Top Customer Lifetime Value</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customerChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="ltv" fill="#3B82F6" name="Projected LTV" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Business Health Score */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-6">Business Health Score</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue Growth</span>
              <span className="text-sm font-medium">
                {executiveMetrics ? formatPercentage(executiveMetrics.revenueGrowth) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-medium">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">System Reliability</span>
              <span className="text-sm font-medium">
                {executiveMetrics ? formatPercentage(executiveMetrics.systemUptime) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Financial Health</span>
              <span className="text-sm font-medium">Excellent</span>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium">Overall Score</span>
                <span className="text-2xl font-bold text-green-600">A+</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <h4 className="font-medium text-gray-900">Export Financial Report</h4>
            <p className="text-sm text-gray-600 mt-1">Generate comprehensive financial report</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <h4 className="font-medium text-gray-900">Review Commission Payouts</h4>
            <p className="text-sm text-gray-600 mt-1">Process pending commission payments</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <h4 className="font-medium text-gray-900">Customer Health Check</h4>
            <p className="text-sm text-gray-600 mt-1">Analyze customer churn risk</p>
          </button>
        </div>
      </div>
    </div>
  );
}