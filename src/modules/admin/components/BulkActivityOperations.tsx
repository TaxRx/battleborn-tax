// Epic 3: Bulk Activity Operations Component
// File: BulkActivityOperations.tsx
// Purpose: Mass activity analysis, reporting, and bulk operations for admin users

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  BarChart3, 
  FileText, 
  Calendar,
  Filter,
  Database,
  TrendingUp,
  PieChart,
  Activity as ActivityIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  RefreshCw,
  Eye,
  Settings,
  Target
} from 'lucide-react';
import AdminAccountService, { ActivitySummary } from '../services/adminAccountService';

interface BulkActivityOperationsProps {
  className?: string;
}

interface BulkFilters {
  dateFrom?: string;
  dateTo?: string;
  activityTypes?: string[];
  accountTypes?: string[];
  includeSystem?: boolean;
}

interface ActivityReport {
  totalActivities: number;
  uniqueAccounts: number;
  timeRange: string;
  topActivityTypes: { type: string; count: number; percentage: number }[];
  accountBreakdown: { type: string; count: number; percentage: number }[];
  dailyTrends: { date: string; count: number }[];
  hourlyTrends: { hour: number; count: number }[];
  systemVsUser: { system: number; user: number };
}

const AdminAccountService_instance = AdminAccountService.getInstance();

export const BulkActivityOperations: React.FC<BulkActivityOperationsProps> = ({ className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<BulkFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    dateTo: new Date().toISOString().split('T')[0], // Today
    activityTypes: [],
    accountTypes: [],
    includeSystem: true
  });

  // Summary data
  const [summary, setSummary] = useState<ActivitySummary[]>([]);

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (filters.dateFrom && filters.dateTo) {
      generateReport();
    }
  }, [filters]);

  const loadSummary = async () => {
    try {
      const summaryData = await AdminAccountService_instance.getActivitySummary();
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading summary:', err);
      setError('Failed to load activity summary');
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This would be implemented with a dedicated bulk analytics endpoint
      // For now, we'll simulate the report generation
      const reportData = await generateActivityReport(filters);
      setReport(reportData);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate activity report');
    } finally {
      setLoading(false);
    }
  };

  const generateActivityReport = async (filters: BulkFilters): Promise<ActivityReport> => {
    // This would call a dedicated analytics endpoint
    // For now, we'll create a mock report structure
    
    // Get metrics for the date range
    const metrics = await AdminAccountService_instance.getActivityMetrics();
    
    return {
      totalActivities: metrics.totalActivities,
      uniqueAccounts: 0, // Would be calculated from actual data
      timeRange: `${filters.dateFrom} to ${filters.dateTo}`,
      topActivityTypes: metrics.topActivityTypes.map((type, index) => ({
        type: type.type,
        count: type.count,
        percentage: (type.count / metrics.totalActivities) * 100
      })),
      accountBreakdown: [
        { type: 'client', count: 0, percentage: 0 },
        { type: 'admin', count: 0, percentage: 0 },
        { type: 'affiliate', count: 0, percentage: 0 },
        { type: 'expert', count: 0, percentage: 0 }
      ],
      dailyTrends: metrics.activityTrends,
      hourlyTrends: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Math.floor(Math.random() * 100) })),
      systemVsUser: { system: Math.floor(metrics.totalActivities * 0.3), user: Math.floor(metrics.totalActivities * 0.7) }
    };
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'json' | 'excel') => {
    if (!report) {
      setError('No report data to export');
      return;
    }

    setExportLoading(format);
    setError(null);

    try {
      // Generate export based on format
      switch (format) {
        case 'csv':
          await exportToCSV(report, filters);
          break;
        case 'json':
          await exportToJSON(report, filters);
          break;
        case 'pdf':
          await exportToPDF(report, filters);
          break;
        case 'excel':
          await exportToExcel(report, filters);
          break;
      }
    } catch (err) {
      console.error(`Error exporting to ${format}:`, err);
      setError(`Failed to export report as ${format.toUpperCase()}`);
    } finally {
      setExportLoading(null);
    }
  };

  const exportToCSV = async (report: ActivityReport, filters: BulkFilters) => {
    const csvData = [
      ['Activity Report - ' + report.timeRange],
      [''],
      ['Summary'],
      ['Total Activities', report.totalActivities.toString()],
      ['Unique Accounts', report.uniqueAccounts.toString()],
      [''],
      ['Top Activity Types'],
      ['Type', 'Count', 'Percentage'],
      ...report.topActivityTypes.map(type => [type.type, type.count.toString(), type.percentage.toFixed(2) + '%']),
      [''],
      ['Daily Trends'],
      ['Date', 'Count'],
      ...report.dailyTrends.map(trend => [trend.date, trend.count.toString()])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity_report_${filters.dateFrom}_to_${filters.dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = async (report: ActivityReport, filters: BulkFilters) => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      filters,
      report
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity_report_${filters.dateFrom}_to_${filters.dateTo}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async (report: ActivityReport, filters: BulkFilters) => {
    // PDF export would require a PDF library like jsPDF
    // For now, we'll create a simple text export
    console.log('PDF export not implemented yet');
    setError('PDF export feature coming soon');
  };

  const exportToExcel = async (report: ActivityReport, filters: BulkFilters) => {
    // Excel export would require a library like SheetJS
    // For now, we'll create a CSV with .xlsx extension
    console.log('Excel export not implemented yet');
    setError('Excel export feature coming soon');
  };

  const activityTypes = [
    'account_created', 'account_updated', 'account_deleted',
    'profile_added', 'profile_removed', 'profile_updated',
    'status_changed', 'type_changed', 'access_granted', 'access_revoked',
    'tool_assigned', 'tool_removed', 'billing_updated',
    'subscription_changed', 'payment_processed',
    'login_success', 'login_failed', 'password_changed',
    'data_export', 'bulk_operation', 'admin_action'
  ];

  const accountTypes = ['client', 'admin', 'affiliate', 'expert'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bulk Activity Operations</h2>
            <p className="text-gray-600 mt-1">Mass analysis and reporting for account activities</p>
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Activity Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Types</label>
            <select
              multiple
              value={filters.activityTypes || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters(prev => ({ ...prev, activityTypes: selected }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={3}
            >
              {activityTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Account Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Types</label>
            <select
              multiple
              value={filters.accountTypes || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters(prev => ({ ...prev, accountTypes: selected }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={3}
            >
              {accountTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.includeSystem || false}
              onChange={(e) => setFilters(prev => ({ ...prev, includeSystem: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Include system-generated activities</span>
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="ml-2 text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Report Results */}
      {report && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center">
                  <ActivityIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{report.totalActivities.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">Total Activities</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-md bg-green-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{report.uniqueAccounts.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">Unique Accounts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-md bg-purple-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{report.systemVsUser.user.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">User Activities</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-md bg-orange-100 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{report.systemVsUser.system.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">System Activities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Report</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleExport('csv')}
                disabled={exportLoading === 'csv'}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                <span>{exportLoading === 'csv' ? 'Exporting...' : 'Export CSV'}</span>
              </button>

              <button
                onClick={() => handleExport('json')}
                disabled={exportLoading === 'json'}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Database className="h-4 w-4" />
                <span>{exportLoading === 'json' ? 'Exporting...' : 'Export JSON'}</span>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={exportLoading === 'pdf'}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                <span>{exportLoading === 'pdf' ? 'Exporting...' : 'Export PDF'}</span>
              </button>

              <button
                onClick={() => handleExport('excel')}
                disabled={exportLoading === 'excel'}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                <BarChart3 className="h-4 w-4" />
                <span>{exportLoading === 'excel' ? 'Exporting...' : 'Export Excel'}</span>
              </button>
            </div>
          </div>

          {/* Top Activity Types */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Activity Types</h3>
            <div className="space-y-3">
              {report.topActivityTypes.slice(0, 10).map((type, index) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {type.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{type.count.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">({type.percentage.toFixed(1)}%)</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, type.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Activity Trends</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Simple trend visualization */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Last 30 Days</h4>
                <div className="space-y-2">
                  {report.dailyTrends.slice(-7).map((trend, index) => (
                    <div key={trend.date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{new Date(trend.date).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{trend.count}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(trend.count / Math.max(...report.dailyTrends.map(t => t.count))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System vs User breakdown */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Activity Source</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">User Actions</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{report.systemVsUser.user.toLocaleString()}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(report.systemVsUser.user / report.totalActivities) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">System Actions</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{report.systemVsUser.system.toLocaleString()}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${(report.systemVsUser.system / report.totalActivities) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      {summary.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Summary (Last 30 Days)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affected Accounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Occurrence
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.map((item) => (
                  <tr key={item.activity_type} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.activity_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.total_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.affected_accounts.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.last_occurrence).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActivityOperations;