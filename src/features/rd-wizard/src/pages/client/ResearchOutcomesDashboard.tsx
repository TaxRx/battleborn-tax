import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import useResearchOutcomesStore from '../../store/researchOutcomesStore';
import useActivitiesStore from '../../store/activitiesStore';
import useBusinessStore from '../../store/businessStore';
import { 
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const ResearchOutcomesDashboard: React.FC = () => {
  const { selectedActivities } = useActivitiesStore();
  const { yearStarted, availableYears } = useBusinessStore();
  const { getAverageMetrics, getTotalStats } = useResearchOutcomesStore();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});

  const handleExport = () => {
    // Create CSV content
    const headers = [
      'Activity',
      'Subcomponent',
      'Year',
      'Quarter',
      'Clinical Success',
      'Time Efficiency',
      'Cost Efficiency',
      'Patient Satisfaction',
      'Cases Completed',
      'Average Duration',
      'Complications',
      'Status'
    ].join(',');

    const rows = selectedActivities
      .filter(activity => activity.year === selectedYear)
      .map(activity => {
        const metrics = getAverageMetrics(activity.id, selectedYear);
        const stats = getTotalStats(activity.id, selectedYear);
        
        return [
          activity.name,
          activity.subcomponents.filter(s => s.isSelected).length + ' subcomponents',
          selectedYear,
          'Annual',
          metrics.clinicalSuccess.toFixed(2),
          metrics.timeEfficiency.toFixed(2),
          metrics.costEfficiency.toFixed(2),
          metrics.patientSatisfaction.toFixed(2),
          stats.totalCases,
          stats.averageDuration.toFixed(2),
          stats.totalComplications,
          'Aggregated'
        ].join(',');
      });

    const csvContent = [headers, ...rows].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-outcomes-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['DM_Serif_Display'] text-4xl text-gray-900">Research Outcomes Dashboard</h1>
            <p className="mt-2 text-lg text-gray-500">
              Visualize and analyze your research outcomes
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {selectedActivities
          .filter(activity => activity.year === selectedYear)
          .map(activity => {
            const metrics = getAverageMetrics(activity.id, selectedYear);
            const stats = getTotalStats(activity.id, selectedYear);
            
            return (
              <Card key={activity.id} className="overflow-hidden">
                <div 
                  className="flex items-center justify-between p-6 cursor-pointer"
                  onClick={() => setExpandedActivities(prev => ({
                    ...prev,
                    [activity.id]: !prev[activity.id]
                  }))}
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{activity.name}</h3>
                    <p className="text-sm text-gray-500">
                      {activity.subcomponents.filter(s => s.isSelected).length} active subcomponents
                    </p>
                  </div>
                  {expandedActivities[activity.id] ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {expandedActivities[activity.id] && (
                  <div className="border-t border-gray-200 p-6">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Clinical Success</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {metrics.clinicalSuccess.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Time Efficiency</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {metrics.timeEfficiency.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <CurrencyDollarIcon className="h-5 w-5 text-purple-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Cost Efficiency</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {metrics.costEfficiency.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <UserGroupIcon className="h-5 w-5 text-yellow-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Patient Satisfaction</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {metrics.patientSatisfaction.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Cases Completed</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalCases}</div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Average Duration</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {stats.averageDuration.toFixed(1)} min
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Complications</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalComplications}</div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
      </div>
    </motion.div>
  );
};

export default ResearchOutcomesDashboard; 