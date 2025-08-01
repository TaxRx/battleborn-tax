import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, Users, DollarSign, Activity, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProgressStep {
  name: string;
  key: string;
  completed: boolean;
  completedAt?: string;
}

interface MetricChip {
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
  icon?: React.ReactNode;
}

interface YearProgress {
  year: number;
  steps: ProgressStep[];
  overallPercentage: number;
  lastUpdated?: string;
  metrics: MetricChip[];
  chipMetrics: MetricChip[];
}

interface ClientProgressIndicatorProps {
  businessId: string;
  className?: string;
  showYearLabels?: boolean;
  maxYears?: number;
}

const ClientProgressIndicator: React.FC<ClientProgressIndicatorProps> = ({
  businessId,
  className = '',
  showYearLabels = true,
  maxYears = 4
}) => {
  const [yearProgress, setYearProgress] = useState<YearProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgressData();
  }, [businessId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the most recent business years for this business (current year and earlier only)
      const currentYear = new Date().getFullYear();
      const { data: businessYears, error: businessYearsError } = await supabase
        .from('rd_business_years')
        .select(`
          id,
          year,
          business_setup_completed,
          business_setup_completed_at,
          research_activities_completed,
          research_activities_completed_at,
          research_design_completed,
          research_design_completed_at,
          calculations_completed,
          calculations_completed_at,
          qre_locked,
          overall_completion_percentage,
          completion_updated_at
        `)
        .eq('business_id', businessId)
        .lte('year', currentYear)
        .order('year', { ascending: false })
        .limit(maxYears);

      if (businessYearsError) {
        console.error('Error loading business years:', businessYearsError);
        setError('Failed to load progress data');
        return;
      }

      if (!businessYears || businessYears.length === 0) {
        setYearProgress([]);
        return;
      }

      // Transform data into progress format with metrics
      const progressData: YearProgress[] = await Promise.all(
        businessYears.map(async (year) => {
          const metrics: MetricChip[] = [];
          const chipMetrics: MetricChip[] = [];

          // Add last updated chip if we have a date
          if (year.completion_updated_at) {
            chipMetrics.push({
              label: 'Updated',
              value: formatDate(year.completion_updated_at),
              color: 'gray',
              icon: <Calendar className="w-3 h-3" />
            });
          }

          // Get research design metrics if completed (now goes to chip area)
          if (year.research_design_completed) {
            try {
              // Count research activities
              const { count: activitiesCount } = await supabase
                .from('rd_selected_activities')
                .select('*', { count: 'exact', head: true })
                .eq('business_year_id', year.id);

              // Count total subcomponents
              const { count: subcomponentsCount } = await supabase
                .from('rd_selected_subcomponents')
                .select('*', { count: 'exact', head: true })
                .eq('business_year_id', year.id);

              if (activitiesCount !== null && activitiesCount > 0) {
                chipMetrics.push({
                  label: 'Activities',
                  value: activitiesCount,
                  color: 'blue',
                  icon: <Activity className="w-3 h-3" />
                });
              }

              if (subcomponentsCount !== null && subcomponentsCount > 0) {
                chipMetrics.push({
                  label: 'Subcomponents',
                  value: subcomponentsCount,
                  color: 'purple',
                  icon: <Users className="w-3 h-3" />
                });
              }
            } catch (error) {
              console.warn('Error fetching research design metrics:', error);
            }
          }

          // Get calculation metrics if completed
          if (year.calculations_completed) {
            try {
              // Get QRE and Federal credit data from results table
              const { data: creditData, error: creditError } = await supabase
                .from('rd_federal_credit_results')
                .select(`
                  total_federal_credit, 
                  qre_breakdown, 
                  standard_incremental_qre, 
                  asc_incremental_qre, 
                  standard_credit,
                  asc_credit,
                  selected_method
                `)
                .eq('business_year_id', year.id)
                .single();

              if (creditError) {
                if (creditError.code === 'PGRST116') {
                  console.log('📋 No credit results found for this business year - this is normal if calculations haven\'t been saved yet');
                } else {
                  console.warn('❌ Error fetching credit data:', creditError);
                }
              }

              if (creditData) {
                // Use method-specific credit amount instead of total
                const selectedMethod = creditData.selected_method;
                const creditAmount = selectedMethod === 'asc' 
                  ? creditData.asc_credit 
                  : creditData.standard_credit;

                // Calculate QRE based on selected method
                let qreAmount = selectedMethod === 'asc' 
                  ? creditData.asc_incremental_qre 
                  : creditData.standard_incremental_qre;

                // Fallback: Extract from qre_breakdown if incremental QRE is null
                if (!qreAmount && creditData.qre_breakdown) {
                  try {
                    const breakdown = typeof creditData.qre_breakdown === 'string' 
                      ? JSON.parse(creditData.qre_breakdown) 
                      : creditData.qre_breakdown;
                    
                    // Look for method-specific QRE values first, then fallback to general totals
                    if (selectedMethod === 'asc') {
                      qreAmount = breakdown.asc_qre || 
                                 breakdown.asc_incremental_qre ||
                                 breakdown.total ||           
                                 breakdown.totalQRE || 
                                 breakdown.total_qre;
                    } else {
                      qreAmount = breakdown.standard_qre || 
                                 breakdown.standard_incremental_qre ||
                                 breakdown.total ||           
                                 breakdown.totalQRE || 
                                 breakdown.total_qre;
                    }
                  } catch (e) {
                    console.warn('❌ Error parsing qre_breakdown:', e);
                  }
                }

                if (qreAmount && qreAmount > 0) {
                  metrics.push({
                    label: 'Total QREs',
                    value: `$${Math.round(qreAmount).toLocaleString()}`,
                    color: 'green',
                    icon: <DollarSign className="w-3 h-3" />
                  });
                }

                // Use method-specific credit amount, fallback to total if needed
                const finalCreditAmount = creditAmount || creditData.total_federal_credit;
                
                if (finalCreditAmount && finalCreditAmount > 0) {
                  metrics.push({
                    label: `Federal Credit (${selectedMethod?.toUpperCase() || 'Unknown'})`,
                    value: `$${Math.round(finalCreditAmount).toLocaleString()}`,
                    color: 'orange',
                    icon: <DollarSign className="w-3 h-3" />
                  });
                }
              } else {
                console.log('📭 No credit data from results table, trying legacy rd_credit_calculations...');
                
                // Fallback: Try the older rd_credit_calculations table
                try {
                  const { data: legacyData, error: legacyError } = await supabase
                    .from('rd_credit_calculations')
                    .select('total_credit, qras')
                    .eq('year', year.year)
                    .single();

                  if (legacyData && legacyData.total_credit && legacyData.total_credit > 0) {
                    metrics.push({
                      label: 'Federal Credit',
                      value: `$${Math.round(legacyData.total_credit).toLocaleString()}`,
                      color: 'orange',
                      icon: <DollarSign className="w-3 h-3" />
                    });
                  }
                } catch (legacyError) {
                  console.warn('❌ Failed to fetch legacy credit data:', legacyError);
                }
              }
            } catch (error) {
              console.warn('❌ Exception fetching calculation metrics:', error);
            }
          }

          return {
            year: year.year,
            overallPercentage: year.overall_completion_percentage || 0,
            lastUpdated: year.completion_updated_at,
            metrics,
            chipMetrics,
            steps: [
              {
                name: 'Research Design',
                key: 'researchDesign',
                completed: year.research_design_completed || false,
                completedAt: year.research_design_completed_at
              },
              {
                name: 'QREs',
                key: 'qres',
                completed: year.qre_locked || false,
                completedAt: year.completion_updated_at
              },
              {
                name: 'Calculations',
                key: 'calculations',
                completed: year.calculations_completed || false,
                completedAt: year.calculations_completed_at
              }
            ]
          };
        })
      );

      setYearProgress(progressData);

    } catch (error) {
      console.error('Error loading progress data:', error);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (completed: boolean, isLoading: boolean = false) => {
    if (isLoading) return <Clock className="w-4 h-4 text-gray-400 animate-pulse" />;
    return completed 
      ? <CheckCircle className="w-4 h-4 text-green-600" />
      : <Circle className="w-4 h-4 text-gray-300" />;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 67) return 'bg-blue-500';
    if (percentage >= 33) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getChipColors = (color: MetricChip['color']) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'gray':
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const renderMetricChip = (metric: MetricChip, index: number) => (
    <div 
      key={index}
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getChipColors(metric.color)}`}
    >
      {metric.icon}
      <span className="text-xs">{metric.label}:</span>
      <span className="font-semibold">{metric.value}</span>
    </div>
  );

  if (loading) {
    return (
      <div className={`w-full flex justify-center ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <Clock className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Loading progress...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full flex justify-center ${className}`}>
        <div className="flex items-center space-x-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to load progress</span>
        </div>
      </div>
    );
  }

  if (yearProgress.length === 0) {
    return (
      <div className={`w-full flex justify-center ${className}`}>
        <div className="flex items-center space-x-2 text-gray-400">
          <Circle className="w-4 h-4" />
          <span className="text-sm">No progress data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-2 gap-4 w-full">
        {yearProgress.slice(0, 4).map((year) => (
          <div 
            key={year.year}
            className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:bg-white hover:shadow-lg transition-all duration-200"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-xl font-bold text-gray-900">{year.year}</span>
                <div className={`w-3 h-3 rounded-full ${getProgressColor(year.overallPercentage)}`} />
              </div>
              <span className="text-lg font-bold text-gray-700">
                {year.overallPercentage}%
              </span>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-4">
              {year.steps.map((step) => (
                <div 
                  key={step.key}
                  className="flex flex-col items-center group relative"
                >
                  <div className="relative mb-2">
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-20">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                        <div className="font-medium">{step.name}</div>
                        <div className="text-gray-300">
                          {step.completed ? 'Completed' : 'Pending'}
                        </div>
                        {step.completed && step.completedAt && (
                          <div className="text-gray-400 text-xs mt-1">
                            {formatDate(step.completedAt)}
                          </div>
                        )}
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  
                  <span className="text-xs text-gray-600 text-center leading-tight font-medium">
                    {step.name.includes(' ') ? (
                      <>
                        {step.name.split(' ')[0]}<br />{step.name.split(' ').slice(1).join(' ')}
                      </>
                    ) : (
                      step.name
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Metrics */}
            {year.metrics.length > 0 && (
              <div className="space-y-2">
                {year.metrics
                  .filter(metric => metric.label !== 'Updated')
                  .sort((a, b) => {
                    // Prioritize financial metrics first
                    const financialLabels = ['Total QREs', 'Federal Credit'];
                    const aIsFinancial = financialLabels.includes(a.label);
                    const bIsFinancial = financialLabels.includes(b.label);
                    
                    if (aIsFinancial && !bIsFinancial) return -1;
                    if (!aIsFinancial && bIsFinancial) return 1;
                    return 0;
                  })
                  .slice(0, 2)
                  .map((metric, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center space-x-2 text-gray-600">
                        {metric.icon}
                        <span className="font-medium">{metric.label}</span>
                      </div>
                      <span className={`font-bold ${
                        metric.color === 'green' ? 'text-green-700' :
                        metric.color === 'orange' ? 'text-orange-700' :
                        metric.color === 'blue' ? 'text-blue-700' :
                        metric.color === 'purple' ? 'text-purple-700' :
                        'text-gray-700'
                      }`}>
                        {metric.value}
                      </span>
                    </div>
                  ))}
                
                {/* Chip metrics at bottom */}
                {year.chipMetrics.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-3 pt-2 border-t border-gray-200">
                    {year.chipMetrics.map((chip, index) => (
                      <div 
                        key={index}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                          chip.color === 'gray' ? 'bg-gray-200 text-gray-600' :
                          chip.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                          chip.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                          chip.color === 'green' ? 'bg-green-100 text-green-700' :
                          chip.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {chip.icon}
                        <span>{chip.label}: {chip.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state for metrics */}
            {year.metrics.length === 0 && (
              <div className="text-center py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500 font-medium">Complete steps to see financial metrics</span>
              </div>
            )}
          </div>
        ))}
        
        {/* Fill empty slots if less than 4 years */}
        {Array.from({ length: Math.max(0, 4 - yearProgress.length) }).map((_, index) => (
          <div 
            key={`empty-${index}`}
            className="bg-gray-100 border border-gray-200 rounded-xl p-5 flex items-center justify-center"
          >
            <div className="text-center">
              <Circle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <span className="text-sm text-gray-500 font-medium">No data available</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientProgressIndicator;