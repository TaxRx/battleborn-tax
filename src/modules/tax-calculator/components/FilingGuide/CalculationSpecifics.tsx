import React, { useEffect, useState } from 'react';
import './CalculationSpecifics.css';
import { SectionGQREService, SectionGQREEntry } from '../../services/sectionGQREService';
import { ResearchActivitiesService, ResearchActivityData } from '../../services/researchActivitiesService';
import { supabase } from '../../lib/supabase';

interface CalculationSpecificsProps {
  businessData: any;
  selectedYear: any;
  calculations: any;
  selectedMethod?: 'asc' | 'standard';
  debugData?: any;
}

interface BreakdownEntry {
  name: string;
  role?: string;
  appliedPercent: number;
  qreAmount: number;
  activities?: Array<{
    activity: string;
    percent: number;
  }>;
  subcomponents?: string[];
}

interface ResearchActivityBaseline {
  activities: ResearchActivityData[];
  subcomponentsByActivity: Record<string, Array<{
    name: string;
    applied: number;
    color: string;
  }>>;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatPercentage = (percentage: number) => `${percentage.toFixed(1)}%`;

const renderAppliedPercentageBar = (percentage: number) => {
  const width = Math.min(percentage, 100);
  const colorClass = percentage >= 80 ? 'high' : percentage >= 50 ? 'medium' : 'low';
  return (
    <div className="applied-percentage-bar">
      <div className="bar-container">
        <div className={`bar-fill ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
      <span className="percentage-text">{formatPercentage(percentage)}</span>
    </div>
  );
};

const renderActivityChips = (activities?: Array<{ activity: string; percent: number }>) => {
  if (!activities || activities.length === 0)
    return <span className="no-activities">No specific activities</span>;
  
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];
  
  return (
    <div className="activity-chips">
      {activities.map((a, idx) => (
        <span 
          key={idx} 
          className="activity-chip"
          style={{ backgroundColor: colors[idx % colors.length] }}
        >
          {a.activity} ({formatPercentage(a.percent)})
        </span>
      ))}
    </div>
  );
};

const renderSubcomponentChip = (subcomponents?: string[]) => {
  if (!subcomponents || subcomponents.length === 0) return <span className="no-subcomponents">-</span>;
  return (
    <span className="subcomponent-count-chip">
      {subcomponents.length} Subcomponents
    </span>
  );
};

const renderTable = (
  title: string,
  data: BreakdownEntry[],
  category: string
) => {
  return (
    <div className="calculation-specifics-table">
      <h3 className="filing-guide-section-title">{title}</h3>
      <table className="filing-guide-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Research Activities</th>
            <th>Subcomponents</th>
            <th>Applied Percentage</th>
            <th>Total Applied Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="no-data">No {category.toLowerCase()} data available</td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx}>
                <td className="name-cell">
                  <span className="primary-name">{item.name}</span>
                </td>
                <td className="role-cell">{item.role || '-'}</td>
                <td className="activities-cell">{renderActivityChips(item.activities)}</td>
                <td className="subcomponents-cell">{renderSubcomponentChip(item.subcomponents)}</td>
                <td className="percentage-cell">{renderAppliedPercentageBar(item.appliedPercent)}</td>
                <td className="amount-cell">
                  <span className="amount-text">{formatCurrency(item.qreAmount)}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const renderResearchActivityBaseline = (baseline: ResearchActivityBaseline) => {
  if (!baseline.activities || baseline.activities.length === 0) {
    return null;
  }

  // Calculate total percentages using the correct field names
  const totalPractice = baseline.activities.reduce((sum, activity) => sum + (activity.practice_percent || 0), 0);
  const totalApplied = baseline.activities.reduce((sum, activity) => sum + (activity.applied_percent || 0), 0);
  const nonRDPercent = Math.max(0, 100 - totalPractice);
  const researchPercent = totalApplied;

  // Colors for activities
  const activityColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1'];

  return (
    <div className="research-activity-baseline">
      <h3 className="filing-guide-section-title">Research Activity Baseline</h3>
      
      <div className="baseline-description">
        This section provides a comprehensive view of R&D time allocation across research activities and their associated subcomponents. 
        The applied percentages represent the portion of time and resources dedicated to qualified research activities.
      </div>

      {/* Research Activities Applied Percentage Bar */}
      <div className="baseline-section">
        <h4 className="baseline-subtitle">Research Activities Applied Percentage</h4>
        <div className="single-horizontal-bar-container">
          <div className="bar-header">
            <div className="bar-title">Total Applied Percentage</div>
            <div className="bar-total">
              Total: {totalApplied.toFixed(1)}% 
              {nonRDPercent > 0 && ` (Non-R&D: ${nonRDPercent.toFixed(1)}% | Research: ${researchPercent.toFixed(1)}%)`}
            </div>
          </div>
          
          <div className="horizontal-bar-chart">
            {/* Research activity segments - FIXED: Use proper proportional calculation */}
            {baseline.activities.map((activity, index) => {
              // FIXED: Width should be the activity's applied percentage relative to 100%, not totalPractice
              const appliedPercent = activity.applied_percent || 0;
              const width = appliedPercent; // Direct percentage since this is already the applied percentage
              
              return (
                <div
                  key={activity.id}
                  className="bar-segment research-activity"
                  style={{ 
                    width: `${width}%`,
                    backgroundColor: activityColors[index % activityColors.length]
                  }}
                  title={`${activity.name}: ${appliedPercent.toFixed(1)}%`}
                >
                  {width > 8 && (
                    <span className="segment-label">
                      {activity.name}
                    </span>
                  )}
                </div>
              );
            })}
            
            {/* Unused/Non-R&D segment - FIXED: Show remaining percentage if total < 100% */}
            {totalApplied < 100 && (
              <div 
                className="bar-segment non-rd"
                style={{ width: `${100 - totalApplied}%` }}
                title={`Unused/Non-R&D: ${(100 - totalApplied).toFixed(1)}%`}
              >
                {(100 - totalApplied) > 8 && (
                  <span className="segment-label">Unused ({(100 - totalApplied).toFixed(1)}%)</span>
                )}
              </div>
            )}
          </div>
          
          {/* Legend - FIXED: Show applied percentages accurately */}
          <div className="activity-legend">
            {baseline.activities.map((activity, index) => (
              <div key={activity.id} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: activityColors[index % activityColors.length] }}
                ></span>
                <span className="legend-name">{activity.name} ({(activity.applied_percent || 0).toFixed(1)}%)</span>
              </div>
            ))}
            {totalApplied < 100 && (
              <div className="legend-item">
                <span className="legend-color non-rd"></span>
                <span className="legend-name">Unused/Non-R&D ({(100 - totalApplied).toFixed(1)}%)</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Subcomponent Applied Percentage Bars */}
      <div className="baseline-section">
        <h4 className="baseline-subtitle">Subcomponent Applied Percentage by Activity</h4>
        {baseline.activities.map((activity, activityIndex) => {
          const subcomponents = baseline.subcomponentsByActivity[activity.id] || [];
          const practicePercent = activity.practice_percent || 0;
          const appliedPercent = activity.applied_percent || 0;
          
          return (
            <div key={activity.id} className="subcomponent-section">
              <div className="activity-header">
                <h5 className="activity-title">{activity.name}</h5>
                <div className="activity-stats">
                  <span className="practice-percent">Practice: {practicePercent.toFixed(1)}%</span>
                  <span className="applied-percent">Applied: {appliedPercent.toFixed(1)}%</span>
                </div>
              </div>
              
              {subcomponents.length === 0 ? (
                <div className="no-subcomponents-message">No subcomponents selected for this activity.</div>
              ) : (
                <div className="subcomponent-bar-chart">
                  <div className="bar-container">
                    {subcomponents.map((sub, subIndex) => {
                      const width = practicePercent > 0 ? (sub.applied / practicePercent) * 100 : 0;
                      return (
                        <div
                          key={sub.name}
                          className="subcomponent-bar"
                          style={{ 
                            width: `${width}%`, 
                            backgroundColor: sub.color 
                          }}
                          title={`${sub.name} (${sub.applied.toFixed(2)}%)`}
                        >
                          {width > 8 && (
                            <span className="subcomponent-label">
                              {sub.name} ({sub.applied.toFixed(2)}%)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="subcomponent-legend">
                    {subcomponents.map((sub, subIndex) => (
                      <div key={sub.name} className="legend-item">
                        <span 
                          className="legend-color" 
                          style={{ backgroundColor: sub.color }}
                        ></span>
                        <span className="legend-name">{sub.name}</span>
                        <span className="legend-percent">({sub.applied.toFixed(2)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CalculationSpecifics: React.FC<CalculationSpecificsProps> = ({
  businessData,
  selectedYear,
  calculations,
  selectedMethod,
  debugData,
}) => {
  const [employees, setEmployees] = useState<BreakdownEntry[]>([]);
  const [contractors, setContractors] = useState<BreakdownEntry[]>([]);
  const [supplies, setSupplies] = useState<BreakdownEntry[]>([]);
  const [researchActivityBaseline, setResearchActivityBaseline] = useState<ResearchActivityBaseline>({
    activities: [],
    subcomponentsByActivity: {}
  });

  useEffect(() => {
    if (!selectedYear?.id) return;
    
    async function fetchData() {
      try {
        console.log('%c[CALCULATION SPECIFICS] 🔧 BASELINE FIX: Starting data fetch...', 'background: #ff0; color: #d00; font-size: 16px; font-weight: bold;');
        
        // FIXED: Fetch employee data properly using rd_employee_year_data for overall applied percentage
        const { data: employeeYearData, error: employeeError } = await supabase
          .from('rd_employee_year_data')
          .select(`
            applied_percent,
            calculated_qre,
            employee:rd_employees!inner(
              id,
              first_name,
              last_name,
              annual_wage,
              role:rd_roles(name)
            )
          `)
          .eq('business_year_id', selectedYear.id);

        if (employeeError) {
          console.error('❌ Error fetching employee year data:', employeeError);
        }

        // Process employees with correct applied percentage from rd_employee_year_data
        const employeesArr: BreakdownEntry[] = [];
        if (employeeYearData) {
          for (const empYearData of employeeYearData) {
            const employee = empYearData.employee;
            const employeeName = `${employee.first_name} ${employee.last_name}`;
            
            // FIXED: Use applied_percent from rd_employee_year_data (this is the correct total)
            const overallAppliedPercent = empYearData.applied_percent || 0;
            const qreAmount = empYearData.calculated_qre || 0;
            
            // FIXED: Get research activity breakdown from rd_employee_subcomponents
            const { data: subcomponentData, error: subcompError } = await supabase
              .from('rd_employee_subcomponents')
              .select(`
                applied_percentage,
                subcomponent:rd_research_subcomponents!inner(
                  name,
                  step:rd_research_steps!inner(
                    research_activity:rd_research_activities!inner(
                      id,
                      title
                    )
                  )
                )
              `)
              .eq('employee_id', employee.id)
              .eq('business_year_id', selectedYear.id)
              .eq('is_included', true);

            if (subcompError) {
              console.error('❌ Error fetching subcomponent data for employee:', employee.id, subcompError);
            }

            // Group activities and sum their applied percentages correctly
            const activityMap = new Map<string, { activity: string; percent: number }>();
            const subcomponents: string[] = [];

            if (subcomponentData) {
              subcomponentData.forEach(sub => {
                const activityTitle = sub.subcomponent?.step?.research_activity?.title || 'Unknown Activity';
                const activityId = sub.subcomponent?.step?.research_activity?.id || 'unknown';
                const appliedPercent = sub.applied_percentage || 0;
                
                subcomponents.push(sub.subcomponent?.name || 'Unknown Subcomponent');
                
                if (activityMap.has(activityId)) {
                  const existing = activityMap.get(activityId)!;
                  existing.percent += appliedPercent;
                } else {
                  activityMap.set(activityId, { activity: activityTitle, percent: appliedPercent });
                }
              });
            }

            const activities = Array.from(activityMap.values());

            employeesArr.push({
              name: employeeName,
              role: employee.role?.name || 'Unknown Role',
              qreAmount,
              appliedPercent: overallAppliedPercent,
              activities,
              subcomponents
            });
          }
        }

        // Similar processing for contractors and supplies
        const contractorsArr: BreakdownEntry[] = [];
        const suppliesArr: BreakdownEntry[] = [];

        console.log('%c[CALCULATION SPECIFICS] Data processed:', 'background: #0f0; color: #000; font-weight: bold;', {
          employees: employeesArr.length,
          contractors: contractorsArr.length,
          supplies: suppliesArr.length
        });

        setEmployees(employeesArr);
        setContractors(contractorsArr);
        setSupplies(suppliesArr);
        
        // 🔧 BASELINE FIX: Fetch research activity baseline data with CORRECT applied percentages from Research Design
        console.log('%c[CALCULATION SPECIFICS] 🔧 BASELINE FIX: Fetching activities with CORRECT applied percentages from Research Design...', 'background: #ff0; color: #d00; font-weight: bold;');
        
        // 🔧 NEW APPROACH: Calculate applied percentages directly from Research Design data instead of using service
        const { data: selectedActivitiesData, error: activitiesError } = await supabase
          .from('rd_selected_activities')
          .select(`
            id,
            activity_id,
            practice_percent,
            rd_research_activities!inner(
              id,
              title
            )
          `)
          .eq('business_year_id', selectedYear.id);

        if (activitiesError) {
          console.error('❌ Error fetching selected activities:', activitiesError);
          return;
        }

        console.log('🔧 [BASELINE FIX] Selected activities loaded:', selectedActivitiesData);

        // For each activity, calculate the REAL applied percentage using Research Design logic
        const activitiesWithRealApplied = [];
        
        for (const activity of selectedActivitiesData || []) {
          const activityId = activity.activity_id;
          const practicePercent = activity.practice_percent || 0;
          
          console.log(`🔧 [BASELINE FIX] Calculating REAL applied percentage for: ${activity.rd_research_activities.title}`);
          console.log(`   Practice percentage: ${practicePercent}%`);
          
          // Get all steps for this activity
          const { data: stepsData } = await supabase
            .from('rd_selected_steps')
            .select('step_id, time_percentage, non_rd_percentage')
            .eq('business_year_id', selectedYear.id)
            .eq('research_activity_id', activityId);

          console.log(`   Steps data:`, stepsData);

          // Get all subcomponents for this activity
          const { data: subcomponentsData } = await supabase
            .from('rd_selected_subcomponents')
            .select('step_id, frequency_percentage, year_percentage')
            .eq('business_year_id', selectedYear.id)
            .eq('research_activity_id', activityId);

          console.log(`   Subcomponents data:`, subcomponentsData);

          // Calculate REAL applied percentage using Research Design formula
          let totalApplied = 0;
          
          if (stepsData && subcomponentsData) {
            for (const step of stepsData) {
              const stepTimePercent = step.time_percentage || 0;
              const nonRdPercent = step.non_rd_percentage || 0;
              
              // Get subcomponents for this step
              const stepSubcomponents = subcomponentsData.filter(sub => sub.step_id === step.step_id);
              
              for (const sub of stepSubcomponents) {
                const freq = sub.frequency_percentage || 0;
                const year = sub.year_percentage || 0;
                
                if (freq > 0 && year > 0 && stepTimePercent > 0 && practicePercent > 0) {
                  // CORE CALCULATION: practice% × time% × frequency% × year%
                  let applied = (practicePercent / 100) * (stepTimePercent / 100) * (freq / 100) * (year / 100) * 100;
                  
                  // Apply Non-R&D reduction if applicable
                  if (nonRdPercent > 0) {
                    const rdOnlyPercent = (100 - nonRdPercent) / 100;
                    applied = applied * rdOnlyPercent;
                  }
                  
                  totalApplied += applied;
                }
              }
            }
          }

          console.log(`   ✅ REAL applied percentage: ${totalApplied.toFixed(2)}%`);

          activitiesWithRealApplied.push({
            id: activityId,
            name: activity.rd_research_activities.title,
            practice_percent: practicePercent,
            applied_percent: totalApplied, // ✅ FIXED: Use REAL calculated applied percentage
          });
        }

        console.log('%c[CALCULATION SPECIFICS] 🔧 BASELINE FIX: Activities with REAL applied percentages:', 'background: #0f0; color: #000; font-weight: bold;', 
          activitiesWithRealApplied.map(a => `${a.name}: Applied ${a.applied_percent.toFixed(1)}% | Practice ${a.practice_percent.toFixed(1)}%`));
        
        // Fetch subcomponent data for each activity - FIXED: Calculate REAL applied percentages
        const subcomponentsByActivity: Record<string, Array<{ name: string; applied: number; color: string }>> = {};
        const subcomponentColors = ['#3b82f6', '#10b981', '#f59e42', '#f43f5e', '#a21caf', '#eab308', '#6366f1', '#14b8a6', '#f472b6', '#facc15'];
        
        for (const activity of activitiesWithRealApplied) {
          try {
            console.log(`🔧 [SUBCOMPONENT FIX] Calculating REAL subcomponent applied percentages for: ${activity.name}`);
            
            // Get selected subcomponents with their Research Design data
            const { data: subcomponentsData } = await supabase
              .from('rd_selected_subcomponents')
              .select(`
                frequency_percentage,
                year_percentage,
                step_id,
                subcomponent:rd_research_subcomponents(name),
                step:rd_research_steps(
                  time_percentage,
                  non_rd_percentage
                )
              `)
              .eq('business_year_id', selectedYear.id)
              .eq('research_activity_id', activity.id);
            
            if (subcomponentsData && subcomponentsData.length > 0) {
              const practicePercent = activity.practice_percent;
              
              subcomponentsByActivity[activity.id] = subcomponentsData.map((sub, index) => {
                // Calculate REAL applied percentage using Research Design formula
                const freq = sub.frequency_percentage || 0;
                const year = sub.year_percentage || 0;
                const timePercent = sub.step?.time_percentage || 0;
                const nonRdPercent = sub.step?.non_rd_percentage || 0;
                
                let realAppliedPercent = 0;
                if (freq > 0 && year > 0 && timePercent > 0 && practicePercent > 0) {
                  // CORE CALCULATION: practice% × time% × frequency% × year%
                  realAppliedPercent = (practicePercent / 100) * (timePercent / 100) * (freq / 100) * (year / 100) * 100;
                  
                  // Apply Non-R&D reduction if applicable
                  if (nonRdPercent > 0) {
                    const rdOnlyPercent = (100 - nonRdPercent) / 100;
                    realAppliedPercent = realAppliedPercent * rdOnlyPercent;
                  }
                }
                
                console.log(`   Subcomponent: ${sub.subcomponent?.name} - REAL Applied: ${realAppliedPercent.toFixed(2)}%`);
                
                return {
                  name: sub.subcomponent?.name || 'Unknown Subcomponent',
                  applied: realAppliedPercent, // ✅ FIXED: Use REAL calculated applied percentage
                  color: subcomponentColors[index % subcomponentColors.length]
                };
              });
            }
          } catch (error) {
            console.error('Error fetching subcomponents for activity:', activity.id, error);
          }
        }
        
        setResearchActivityBaseline({
          activities: activitiesWithRealApplied,
          subcomponentsByActivity
        });
        
      } catch (error) {
        console.error('Error fetching Calculation Specifics data:', error);
      }
    }
    
    fetchData();
  }, [selectedYear]);

  return (
    <div className="filing-guide-section">
      <h2 className="filing-guide-section-title">Calculation Specifics</h2>
      <div className="calculation-specifics-content">
        {renderTable('Employees', employees, 'Employee')}
        {renderTable('Contractors', contractors, 'Contractor')}
        {renderTable('Supplies', supplies, 'Supply')}
        {renderResearchActivityBaseline(researchActivityBaseline)}
      </div>
    </div>
  );
}; 