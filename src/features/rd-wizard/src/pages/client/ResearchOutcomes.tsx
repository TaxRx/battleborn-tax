import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PercentageSlider from '../../components/forms/PercentageSlider';
import useActivitiesStore from '../../store/activitiesStore';
import useResearchOutcomesStore from '../../store/researchOutcomesStore';
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '../../lib/utils';

const ResearchOutcomes: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor((new Date().getMonth() / 3) + 1));
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  const [showQuarterlyUpdateModal, setShowQuarterlyUpdateModal] = useState(false);
  const [selectedSubcomponent, setSelectedSubcomponent] = useState<{
    activityId: string;
    subcomponentId: string;
  } | null>(null);

  const { selectedActivities } = useActivitiesStore();
  const { 
    addOutcome, 
    getOutcomesForSubcomponent,
    getAverageMetrics,
    getTotalStats,
    getQuarterlyTrends
  } = useResearchOutcomesStore();

  const handleOpenUpdateModal = (activityId: string, subcomponentId: string) => {
    setSelectedSubcomponent({ activityId, subcomponentId });
    setShowQuarterlyUpdateModal(true);
  };

  const MetricsChart: React.FC<{ activityId: string }> = ({ activityId }) => {
    const metrics = getAverageMetrics(activityId, selectedYear);
    const data = [
      { name: 'Clinical Success', value: metrics.clinicalSuccess },
      { name: 'Time Efficiency', value: metrics.timeEfficiency },
      { name: 'Cost Efficiency', value: metrics.costEfficiency },
      { name: 'Patient Satisfaction', value: metrics.patientSatisfaction }
    ];

    return (
      <div className="h-48 w-full">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const TrendChart: React.FC<{ activityId: string; subcomponentId: string }> = ({ activityId, subcomponentId }) => {
    const trends = getQuarterlyTrends(activityId, subcomponentId, selectedYear);
    const data = trends.map((trend: { quarter: number; metrics: { clinicalSuccess: number; timeEfficiency: number } }) => ({
      quarter: `Q${trend.quarter}`,
      clinicalSuccess: trend.metrics.clinicalSuccess,
      timeEfficiency: trend.metrics.timeEfficiency
    }));

    return (
      <div className="h-48 w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarter" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
            <Line type="monotone" dataKey="clinicalSuccess" stroke="#3B82F6" name="Clinical Success" />
            <Line type="monotone" dataKey="timeEfficiency" stroke="#10B981" name="Time Efficiency" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const QuickStats: React.FC<{ activityId: string }> = ({ activityId }) => {
    const stats = getTotalStats(activityId, selectedYear);
    const previousStats = getTotalStats(activityId, selectedYear - 1);
    
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };
    
    const casesTrend = calculateTrend(stats.totalCases, previousStats.totalCases);
    const durationTrend = calculateTrend(stats.averageDuration, previousStats.averageDuration);
    const complicationsTrend = calculateTrend(stats.totalComplications, previousStats.totalComplications);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Total Cases</span>
            </div>
            <div className={cn(
              "flex items-center text-sm",
              casesTrend > 0 ? "text-green-600" : "text-red-600"
            )}>
              {casesTrend > 0 ? <ArrowTrendingUpIcon className="h-4 w-4 mr-1" /> : <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />}
              {Math.abs(casesTrend).toFixed(1)}%
            </div>
          </div>
          <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.totalCases}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Avg Duration</span>
            </div>
            <div className={cn(
              "flex items-center text-sm",
              durationTrend < 0 ? "text-green-600" : "text-red-600"
            )}>
              {durationTrend < 0 ? <ArrowTrendingDownIcon className="h-4 w-4 mr-1" /> : <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />}
              {Math.abs(durationTrend).toFixed(1)}%
            </div>
          </div>
          <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.averageDuration.toFixed(1)} min</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Complications</span>
            </div>
            <div className={cn(
              "flex items-center text-sm",
              complicationsTrend < 0 ? "text-green-600" : "text-red-600"
            )}>
              {complicationsTrend < 0 ? <ArrowTrendingDownIcon className="h-4 w-4 mr-1" /> : <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />}
              {Math.abs(complicationsTrend).toFixed(1)}%
            </div>
          </div>
          <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.totalComplications}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Research Outcomes</h1>
          <p className="mt-1 text-gray-500">Track and measure your research activities' performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {[2023, 2024, 2025].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {[1, 2, 3, 4].map(q => (
              <option key={q} value={q}>Q{q}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        <AnimatePresence>
          {selectedActivities
            .filter(activity => activity.year === selectedYear)
            .map(activity => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedActivities(prev => ({
                      ...prev,
                      [activity.id]: !prev[activity.id]
                    }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">{activity.name}</h3>
                      </div>
                      {expandedActivities[activity.id] ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Activity Metrics Chart */}
                    <MetricsChart activityId={activity.id} />
                    
                    {/* Activity Quick Stats */}
                    <QuickStats activityId={activity.id} />
                  </div>

                  {/* Subcomponents */}
                  <AnimatePresence>
                    {expandedActivities[activity.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200"
                      >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activity.subcomponents
                            .filter(sub => sub.isSelected)
                            .map(subcomponent => {
                              const outcomes = getOutcomesForSubcomponent(subcomponent.id, selectedYear, selectedQuarter);
                              const hasData = outcomes.length > 0;
                              
                              return (
                                <Card key={subcomponent.id} className="hover:shadow-md transition-shadow">
                                  <div 
                                    className="p-4 cursor-pointer"
                                    onClick={() => handleOpenUpdateModal(activity.id, subcomponent.id)}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-medium text-gray-900">{subcomponent.name}</h4>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenUpdateModal(activity.id, subcomponent.id);
                                        }}
                                      >
                                        {hasData ? 'Update' : 'Add Data'}
                                      </Button>
                                    </div>
                                    
                                    {hasData ? (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Clinical Success:</span>
                                            <span className="font-medium text-gray-900">
                                              {outcomes[0].metrics.clinicalSuccess}%
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Time Efficiency:</span>
                                            <span className="font-medium text-gray-900">
                                              {outcomes[0].metrics.timeEfficiency}%
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Cases:</span>
                                            <span className="font-medium text-gray-900">
                                              {outcomes[0].stats.casesCompleted}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {/* Trend Chart */}
                                        <TrendChart activityId={activity.id} subcomponentId={subcomponent.id} />
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-gray-500">
                                        <PlusIcon className="h-8 w-8 mx-auto mb-2" />
                                        <p>No data for this quarter</p>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Quarterly Update Modal */}
      <Modal
        isOpen={showQuarterlyUpdateModal}
        onClose={() => setShowQuarterlyUpdateModal(false)}
        title="Update Research Outcomes"
        maxWidth="2xl"
      >
        {selectedSubcomponent && (
          <QuarterlyUpdateForm
            activityId={selectedSubcomponent.activityId}
            subcomponentId={selectedSubcomponent.subcomponentId}
            quarter={selectedQuarter}
            year={selectedYear}
            onClose={() => setShowQuarterlyUpdateModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

interface QuarterlyUpdateFormProps {
  activityId: string;
  subcomponentId: string;
  quarter: number;
  year: number;
  onClose: () => void;
}

const QuarterlyUpdateForm: React.FC<QuarterlyUpdateFormProps> = ({
  activityId,
  subcomponentId,
  quarter,
  year,
  onClose
}) => {
  const [formData, setFormData] = useState({
    metrics: {
      clinicalSuccess: 0,
      timeEfficiency: 0,
      costEfficiency: 0,
      patientSatisfaction: 0
    },
    stats: {
      casesCompleted: 0,
      averageDuration: 0,
      complicationCount: 0
    },
    status: 'meeting' as const,
    notes: ''
  });

  const { addOutcome } = useResearchOutcomesStore();
  const { selectedActivities } = useActivitiesStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addOutcome({
      activityId,
      subcomponentId,
      quarter,
      year,
      submittedBy: 'current-user', // Replace with actual user ID
      metrics: formData.metrics,
      stats: formData.stats,
      status: formData.status,
      notes: formData.notes
    });
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Core Metrics</h3>
        <PercentageSlider
          label="Clinical Success Rate"
          value={formData.metrics.clinicalSuccess}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            metrics: { ...prev.metrics, clinicalSuccess: value }
          }))}
          helperText="Rate of successful clinical outcomes"
        />
        <PercentageSlider
          label="Time Efficiency"
          value={formData.metrics.timeEfficiency}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            metrics: { ...prev.metrics, timeEfficiency: value }
          }))}
          helperText="Improvement in procedure time"
        />
        <PercentageSlider
          label="Cost Efficiency"
          value={formData.metrics.costEfficiency}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            metrics: { ...prev.metrics, costEfficiency: value }
          }))}
          helperText="Reduction in associated costs"
        />
        <PercentageSlider
          label="Patient Satisfaction"
          value={formData.metrics.patientSatisfaction}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            metrics: { ...prev.metrics, patientSatisfaction: value }
          }))}
          helperText="Overall patient satisfaction score"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cases Completed</label>
            <input
              type="number"
              min="0"
              value={formData.stats.casesCompleted}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                stats: { ...prev.stats, casesCompleted: parseInt(e.target.value) || 0 }
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Average Duration (mins)</label>
            <input
              type="number"
              min="0"
              value={formData.stats.averageDuration}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                stats: { ...prev.stats, averageDuration: parseInt(e.target.value) || 0 }
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Complications</label>
            <input
              type="number"
              min="0"
              value={formData.stats.complicationCount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                stats: { ...prev.stats, complicationCount: parseInt(e.target.value) || 0 }
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            status: e.target.value as typeof formData.status
          }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="exceeding">Exceeding Expectations</option>
          <option value="meeting">Meeting Expectations</option>
          <option value="below">Below Expectations</option>
          <option value="needs-review">Needs Review</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            notes: e.target.value
          }))}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Add any additional observations or notes..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Update
        </Button>
      </div>
    </form>
  );
};

export default ResearchOutcomes; 