// Epic 3 Sprint 4: Platform Usage Analytics Dashboard
// File: PlatformAnalyticsDashboard.tsx
// Purpose: Platform usage analytics, performance monitoring, and capacity planning
// Story: 4.3 - Platform Usage Analytics (7 points)

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
  BoltIcon,
  TrendingUpIcon,
  ClockIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../../../lib/supabase';

interface UsageMetric {
  metricDate: string;
  metricName: string;
  metricValue: number;
  trendDirection: 'up' | 'down' | 'stable' | 'new';
  percentageChange: number;
}

interface FeatureAdoption {
  featureName: string;
  featureCategory: string;
  totalUsers: number;
  totalUsageCount: number;
  avgUsagePerUser: number;
  adoptionRate: number;
}

interface PerformanceMetric {
  endpoint: string;
  operationType: string;
  requestCount: number;
  avgResponseTimeMs: number;
  p95ResponseTimeMs: number;
  errorRate: number;
  successRate: number;
}

interface CapacityMetric {
  metricName: string;
  currentValue: number;
  growthRate: number;
  projected30Days: number;
  projected90Days: number;
  capacityThreshold: number;
  daysUntilThreshold: number | null;
}

export default function PlatformAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'usage' | 'performance' | 'features' | 'capacity'>('usage');
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  
  const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>([]);
  const [featureAdoption, setFeatureAdoption] = useState<FeatureAdoption[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [capacityMetrics, setCapacityMetrics] = useState<CapacityMetric[]>([]);
  const [dailyActiveUsers, setDailyActiveUsers] = useState<number>(0);
  const [avgResponseTime, setAvgResponseTime] = useState<number>(0);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Get usage trends
      const { data: usageTrends, error: usageError } = await supabase.rpc('get_usage_trends', {
        p_metric_type: 'user_activity',
        p_days: timeRange
      });
      if (usageError) throw usageError;
      setUsageMetrics(usageTrends || []);

      // Get feature adoption stats
      const { data: featureStats, error: featureError } = await supabase.rpc('get_feature_adoption_stats', {
        p_days: timeRange
      });
      if (featureError) throw featureError;
      setFeatureAdoption(featureStats || []);

      // Get performance metrics
      const { data: perfMetrics, error: perfError } = await supabase.rpc('analyze_performance_metrics', {
        p_hours: timeRange * 24
      });
      if (perfError) throw perfError;
      setPerformanceMetrics(perfMetrics || []);

      // Get capacity planning metrics
      const { data: capacityData, error: capacityError } = await supabase.rpc('get_capacity_planning_metrics', {
        p_days: 90
      });
      if (capacityError) throw capacityError;
      setCapacityMetrics(capacityData || []);

      // Calculate summary metrics
      const latestDau = usageTrends?.find(m => m.metricName === 'daily_active_users');
      setDailyActiveUsers(latestDau?.metricValue || 0);

      const avgResponse = perfMetrics?.reduce((sum, m) => sum + m.avgResponseTimeMs, 0) / (perfMetrics?.length || 1);
      setAvgResponseTime(avgResponse || 0);

    } catch (error) {
      console.error('Error loading platform analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toFixed(0);
  };

  const getStatusColor = (value: number, threshold: number, inverse: boolean = false) => {
    if (inverse) {
      return value < threshold ? 'text-green-600' : 'text-red-600';
    }
    return value > threshold ? 'text-green-600' : 'text-red-600';
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
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value) as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Daily Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dailyActiveUsers)}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Platform engagement
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{avgResponseTime.toFixed(0)}ms</p>
            </div>
            <BoltIcon className="h-8 w-8 text-green-600" />
          </div>
          <p className={`mt-2 text-sm ${getStatusColor(avgResponseTime, 200, true)}`}>
            {avgResponseTime < 200 ? 'Excellent' : 'Needs optimization'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Feature Adoption</p>
              <p className="text-2xl font-bold text-gray-900">{featureAdoption.length}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Active features
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">API Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {performanceMetrics.length > 0 ? 
                  (performanceMetrics.reduce((sum, m) => sum + m.successRate, 0) / performanceMetrics.length).toFixed(1) : 
                  '0'
                }%
              </p>
            </div>
            <CpuChipIcon className="h-8 w-8 text-green-600" />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            System reliability
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'usage', label: 'Usage Trends', icon: TrendingUpIcon },
            { key: 'performance', label: 'Performance', icon: BoltIcon },
            { key: 'features', label: 'Feature Adoption', icon: ChartBarIcon },
            { key: 'capacity', label: 'Capacity Planning', icon: ServerIcon }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'usage' && (
          <div>
            <h3 className="text-lg font-medium mb-6">Platform Usage Trends</h3>
            
            {/* Usage Chart */}
            <div className="mb-8">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={usageMetrics.filter(m => m.metricName === 'daily_active_users').reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metricDate" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="metricValue" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="Daily Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Usage Metrics Table */}
            <div>
              <h4 className="font-medium mb-4">Detailed Usage Metrics</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usageMetrics.slice(0, 10).map((metric, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.metricName.replace(/_/g, ' ').toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatNumber(metric.metricValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                            metric.trendDirection === 'up' ? 'bg-green-100 text-green-800' :
                            metric.trendDirection === 'down' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {metric.trendDirection}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.percentageChange ? `${metric.percentageChange.toFixed(1)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <h3 className="text-lg font-medium mb-6">API Performance Metrics</h3>
            
            {/* Response Time Distribution */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">Response Time by Endpoint</h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceMetrics.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgResponseTimeMs" fill="#3B82F6" name="Avg Response (ms)" />
                  <Bar dataKey="p95ResponseTimeMs" fill="#EF4444" name="P95 Response (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Table */}
            <div>
              <h4 className="font-medium mb-4">Endpoint Performance Details</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performanceMetrics.map((metric, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.endpoint}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(metric.requestCount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.avgResponseTimeMs.toFixed(0)}ms
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            metric.successRate >= 99 ? 'text-green-600' :
                            metric.successRate >= 95 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {metric.successRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            metric.errorRate < 1 ? 'text-green-600' :
                            metric.errorRate < 5 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {metric.errorRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div>
            <h3 className="text-lg font-medium mb-6">Feature Adoption Analytics</h3>
            
            {/* Feature Adoption Chart */}
            <div className="mb-8">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={featureAdoption.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="featureName" angle={-45} textAnchor="end" height={150} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="adoptionRate" fill="#10B981" name="Adoption Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Feature Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-medium mb-4">Adoption by Category</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        featureAdoption.reduce((acc, f) => {
                          acc[f.featureCategory] = (acc[f.featureCategory] || 0) + f.totalUsers;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, users]) => ({ name: category, value: users }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {featureAdoption.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="font-medium mb-4">Top Features by Usage</h4>
                <div className="space-y-2">
                  {featureAdoption.slice(0, 5).map(feature => (
                    <div key={feature.featureName} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{feature.featureName}</p>
                        <p className="text-xs text-gray-600">{feature.totalUsers} users</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatNumber(feature.totalUsageCount)}</p>
                        <p className="text-xs text-gray-600">total uses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div>
            <h3 className="text-lg font-medium mb-6">Capacity Planning & Projections</h3>
            
            {/* Capacity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {capacityMetrics.map(metric => (
                <div key={metric.metricName} className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium mb-4 capitalize">{metric.metricName.replace(/_/g, ' ')}</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current</span>
                      <span className="text-sm font-medium">{formatNumber(metric.currentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Growth Rate</span>
                      <span className={`text-sm font-medium ${metric.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.growthRate >= 0 ? '+' : ''}{metric.growthRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">30-Day Projection</span>
                      <span className="text-sm font-medium">{formatNumber(metric.projected30Days)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">90-Day Projection</span>
                      <span className="text-sm font-medium">{formatNumber(metric.projected90Days)}</span>
                    </div>
                    
                    {/* Capacity Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-600">Capacity Usage</span>
                        <span className="text-xs font-medium">
                          {((metric.currentValue / metric.capacityThreshold) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            metric.currentValue / metric.capacityThreshold < 0.7 ? 'bg-green-600' :
                            metric.currentValue / metric.capacityThreshold < 0.9 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(100, (metric.currentValue / metric.capacityThreshold) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {metric.daysUntilThreshold && (
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${
                          metric.daysUntilThreshold > 90 ? 'text-green-600' :
                          metric.daysUntilThreshold > 30 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {metric.daysUntilThreshold} days until capacity
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}