import React, { useState, useEffect } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import ProgressTrackingService, { 
  ProgressDashboardRow, 
  MilestoneType,
  MilestoneUpdateData 
} from '../modules/tax-calculator/services/progressTrackingService';
import { useUser } from '../context/UserContext';

interface ProgressSnapshotProps {
  onRefresh?: () => void;
}

interface GroupedProgress {
  businessId: string;
  businessName: string;
  clientId: string;
  businessStartYear: number;
  years: ProgressDashboardRow[];
}

const ProgressSnapshot: React.FC<ProgressSnapshotProps> = ({ onRefresh }) => {
  const { user } = useUser();
  const [progressData, setProgressData] = useState<ProgressDashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBusinesses, setExpandedBusinesses] = useState<Set<string>>(new Set());
  const [editingMilestone, setEditingMilestone] = useState<{
    businessYearId: string;
    milestoneType: MilestoneType;
  } | null>(null);
  const [contractExpiration, setContractExpiration] = useState<string>('');

  // Load progress data
  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 [ProgressSnapshot] Loading progress data');
      
      const data = await ProgressTrackingService.getProgressDashboard();
      setProgressData(data);
      
      console.log('✅ [ProgressSnapshot] Progress data loaded:', data.length, 'rows');
    } catch (err) {
      console.error('❌ [ProgressSnapshot] Error loading progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgressData();
  }, []);

  // Group data by business
  const groupedData = React.useMemo(() => {
    const groups: { [businessId: string]: GroupedProgress } = {};
    
    progressData.forEach(row => {
      if (!groups[row.business_id]) {
        groups[row.business_id] = {
          businessId: row.business_id,
          businessName: row.business_name,
          clientId: row.client_id,
          businessStartYear: row.business_start_year,
          years: []
        };
      }
      groups[row.business_id].years.push(row);
    });

    // Sort years within each business (newest first)
    Object.values(groups).forEach(group => {
      group.years.sort((a, b) => b.year - a.year);
    });

    return Object.values(groups).sort((a, b) => a.businessName.localeCompare(b.businessName));
  }, [progressData]);

  // Toggle business expansion
  const toggleBusiness = (businessId: string) => {
    const newExpanded = new Set(expandedBusinesses);
    if (newExpanded.has(businessId)) {
      newExpanded.delete(businessId);
    } else {
      newExpanded.add(businessId);
    }
    setExpandedBusinesses(newExpanded);
  };

  // Handle milestone update
  const handleMilestoneUpdate = async (
    businessYearId: string,
    milestoneType: MilestoneType,
    isCompleted: boolean,
    expiration?: string
  ) => {
    try {
      console.log('📝 [ProgressSnapshot] Updating milestone:', {
        businessYearId,
        milestoneType,
        isCompleted,
        expiration
      });

      const updateData: MilestoneUpdateData = {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : undefined,
        completed_by: isCompleted ? user?.id : undefined
      };

      if (milestoneType === 'engaged' && expiration) {
        updateData.engagement_contract_expiration = expiration;
      }

      await ProgressTrackingService.updateMilestone(
        businessYearId,
        milestoneType,
        updateData,
        user?.id
      );

      // Refresh data
      await loadProgressData();
      
      console.log('✅ [ProgressSnapshot] Milestone updated successfully');
    } catch (err) {
      console.error('❌ [ProgressSnapshot] Error updating milestone:', err);
      setError('Failed to update milestone');
    }
  };

  // Get milestone icon
  const getMilestoneIcon = (milestoneType: MilestoneType, isCompleted: boolean) => {
    const iconClass = `w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`;
    
    if (isCompleted) {
      return <CheckCircleIconSolid className={iconClass} />;
    }

    switch (milestoneType) {
      case 'engaged':
        return <DocumentTextIcon className={iconClass} />;
      case 'tax_returns_received':
        return <DocumentTextIcon className={iconClass} />;
      case 'wages_received':
        return <CurrencyDollarIcon className={iconClass} />;
      case 'support_documents_received':
        return <DocumentTextIcon className={iconClass} />;
      case 'scoping_call':
        return <PhoneIcon className={iconClass} />;
      case 'data_entry':
        return <ComputerDesktopIcon className={iconClass} />;
      case 'qc_review':
        return <ShieldCheckIcon className={iconClass} />;
      case 'jurat':
        return <PencilSquareIcon className={iconClass} />;
      case 'completed':
        return <CheckIcon className={iconClass} />;
      default:
        return <ClockIcon className={iconClass} />;
    }
  };

  // Render milestone cell
  const renderMilestoneCell = (
    row: ProgressDashboardRow,
    milestoneType: MilestoneType,
    isCompleted: boolean,
    completedAt?: string,
    isAuto: boolean = false
  ) => {
    const handleClick = () => {
      if (isAuto) return; // Auto milestones can't be manually edited
      
      if (milestoneType === 'engaged') {
        setEditingMilestone({ businessYearId: row.business_year_id, milestoneType });
        setContractExpiration(row.engagement_expiration || '');
      } else {
        handleMilestoneUpdate(row.business_year_id, milestoneType, !isCompleted);
      }
    };

    return (
      <td key={milestoneType} className="px-3 py-2 text-center">
        <div className="flex items-center justify-center">
          <button
            onClick={handleClick}
            disabled={isAuto}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
              isAuto 
                ? 'cursor-not-allowed opacity-75' 
                : 'hover:bg-gray-100 cursor-pointer'
            }`}
            title={`${milestoneType} ${isCompleted ? '✓ Completed' : '○ Pending'}${isAuto ? ' (Auto)' : ''}`}
          >
            {getMilestoneIcon(milestoneType, isCompleted)}
          </button>
        </div>
        {completedAt && (
          <div className="text-xs text-gray-500 mt-1">
            {new Date(completedAt).toLocaleDateString()}
          </div>
        )}
      </td>
    );
  };

  // Render engagement modal
  const renderEngagementModal = () => {
    if (!editingMilestone || editingMilestone.milestoneType !== 'engaged') return null;

    const handleSave = () => {
      handleMilestoneUpdate(
        editingMilestone.businessYearId,
        editingMilestone.milestoneType,
        true,
        contractExpiration
      );
      setEditingMilestone(null);
      setContractExpiration('');
    };

    const handleCancel = () => {
      setEditingMilestone(null);
      setContractExpiration('');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-md">
          <h3 className="text-lg font-semibold mb-4">Mark Engagement Complete</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Expiration Date
            </label>
            <input
              type="date"
              value={contractExpiration}
              onChange={(e) => setContractExpiration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading progress data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadProgressData}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const milestoneTypes = ProgressTrackingService.getMilestoneTypes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Progress Snapshot</h2>
          <p className="text-gray-600 text-sm mt-1">
            Track key milestones in the R&D tax credit process for each business year
          </p>
        </div>
        <button
          onClick={loadProgressData}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircleIconSolid className="w-4 h-4 text-green-600" />
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <ComputerDesktopIcon className="w-4 h-4 text-blue-600" />
            <span>Auto-tracked</span>
          </div>
        </div>
      </div>

      {/* Progress Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business / Year
                </th>
                {milestoneTypes.map(milestone => (
                  <th key={milestone.type} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex flex-col items-center">
                      <span>{milestone.label}</span>
                      {milestone.isAuto && (
                        <span className="text-blue-500 text-xs">(Auto)</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedData.map(group => {
                const isExpanded = expandedBusinesses.has(group.businessId);
                const currentYear = new Date().getFullYear();
                const visibleYears = isExpanded ? group.years : group.years.slice(0, 2);
                const hasMoreYears = group.years.length > 2;

                return (
                  <React.Fragment key={group.businessId}>
                    {visibleYears.map((row, yearIndex) => {
                      const isBusinessHeader = yearIndex === 0;
                      const isCurrentYear = row.year === currentYear;
                      
                      return (
                        <tr 
                          key={row.business_year_id}
                          className={`${isCurrentYear ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                          {/* Business/Year Column */}
                          <td className="px-6 py-4">
                            {isBusinessHeader ? (
                              <div className="flex items-center">
                                {hasMoreYears && (
                                  <button
                                    onClick={() => toggleBusiness(group.businessId)}
                                    className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronDownIcon className="w-4 h-4" />
                                    ) : (
                                      <ChevronRightIcon className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {group.businessName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {row.year}
                                    {isCurrentYear && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="ml-8">
                                <div className="text-sm text-gray-500">
                                  {row.year}
                                  {isCurrentYear && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Current
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Milestone Columns */}
                          {renderMilestoneCell(row, 'engaged', row.engaged_completed, row.engaged_completed_at)}
                          {renderMilestoneCell(row, 'tax_returns_received', row.tax_returns_completed, row.tax_returns_completed_at)}
                          {renderMilestoneCell(row, 'wages_received', row.wages_completed, row.wages_completed_at)}
                          {renderMilestoneCell(row, 'support_documents_received', row.support_docs_completed, row.support_docs_completed_at)}
                          {renderMilestoneCell(row, 'scoping_call', row.scoping_call_completed, row.scoping_call_completed_at)}
                          {renderMilestoneCell(row, 'data_entry', row.data_entry_completed, row.data_entry_completed_at, true)}
                          {renderMilestoneCell(row, 'qc_review', row.qc_review_completed, row.qc_review_completed_at)}
                          {renderMilestoneCell(row, 'jurat', row.jurat_completed, row.jurat_completed_at, true)}
                          {renderMilestoneCell(row, 'completed', row.project_completed, row.project_completed_at)}

                          {/* Progress Column */}
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${row.progress_percentage}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm text-gray-600">
                                {Math.round(row.progress_percentage)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Show collapse/expand info */}
                    {hasMoreYears && !isExpanded && (
                      <tr>
                        <td colSpan={milestoneTypes.length + 2} className="px-6 py-2 text-center">
                          <button
                            onClick={() => toggleBusiness(group.businessId)}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Show {group.years.length - 2} more years...
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {groupedData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No progress data available. Create some business years to get started.
          </div>
        )}
      </div>

      {/* Engagement Modal */}
      {renderEngagementModal()}
    </div>
  );
};

export default ProgressSnapshot;