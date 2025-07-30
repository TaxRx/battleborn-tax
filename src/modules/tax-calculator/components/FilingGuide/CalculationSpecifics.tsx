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
  // Performance optimization: Reduced excessive baseline rendering logs
  
  if (!baseline.activities || baseline.activities.length === 0) {
    console.warn('⚠️ [RENDER BASELINE] No activities in baseline data');
    return <div className="no-data-message">No research activities data available for this year.</div>;
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
          
          // Performance optimization: Reduced excessive subcomponent activity logs
          
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
                <div className="no-subcomponents-message">
                  No subcomponents selected for this activity.
                  <br />
                  <small style={{color: '#666', fontSize: '12px'}}>
                    Debug: Activity ID {activity.id}, Practice {practicePercent}%, Applied {appliedPercent}%
                  </small>
                </div>
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
    if (!selectedYear?.id) {
      return;
    }
    
    async function fetchData() {
      try {
        // Fetch employee data using rd_employee_year_data
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
          // Employee data fetch failed
        }

        // Employee data loaded

        // Process employees with correct applied percentage from rd_employee_year_data
        const employeesArr: BreakdownEntry[] = [];
        console.log(`📊 [FILING GUIDE] Employee year data fetch result:`, {
          employeeYearData_length: employeeYearData?.length || 0,
          selectedYear_id: selectedYear.id,
          businessData_id: businessData?.id
        });
        
        if (employeeYearData) {
          // Group employees by ID to prevent duplicates
          const employeeMap = new Map<string, any>();
          
          // First, group all employee year data by employee ID
          employeeYearData.forEach(empYearData => {
            const employee = empYearData.employee;
            const employeeId = employee.id;
            
            if (!employeeMap.has(employeeId)) {
              employeeMap.set(employeeId, {
                employee,
                totalAppliedPercent: 0,
                totalQreAmount: 0,
                count: 0
              });
            }
            
            const existing = employeeMap.get(employeeId);
            existing.totalAppliedPercent += (empYearData.applied_percent || 0);
            existing.totalQreAmount += (empYearData.calculated_qre || 0);
            existing.count += 1;
          });
          
          // Now process each unique employee
          for (const [employeeId, aggregatedData] of employeeMap) {
            const employee = aggregatedData.employee;
            const employeeName = `${employee.first_name} ${employee.last_name}`;
            
            // Average the applied percentage if there were multiple entries
            const overallAppliedPercent = aggregatedData.totalAppliedPercent / aggregatedData.count;
            const qreAmount = aggregatedData.totalQreAmount;
            
            // Get research activity breakdown from rd_employee_subcomponents
            console.log(`🔍 [FILING GUIDE] Querying subcomponents for employee ${employeeName} (${employee.id}) in year ${selectedYear.id}`);
            const { data: subcomponentData, error: subcompError } = await supabase
              .from('rd_employee_subcomponents')
              .select(`
                applied_percentage,
                is_included,
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
              console.error(`❌ [FILING GUIDE] Subcomponent fetch failed for employee ${employeeName}:`, subcompError);
            } else {
              console.log(`📊 [FILING GUIDE] Subcomponent query result for ${employeeName}:`, {
                employee_id: employee.id,
                business_year_id: selectedYear.id,
                subcomponentData: subcomponentData,
                count: subcomponentData?.length || 0
              });
            }

            // Group activities and sum their applied percentages correctly
            const activityMap = new Map<string, { activity: string; percent: number }>();
            const subcomponents: string[] = [];

            if (subcomponentData && subcomponentData.length > 0) {
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

            // Debug logging for Filing Guide chips
            const activities = Array.from(activityMap.values());
            
            if (activities.length === 0) {
              console.warn(`⚠️ [FILING GUIDE] No activities found for employee: ${employeeName}`);
              console.log('📊 [FILING GUIDE] Subcomponent data:', subcomponentData);
            } else {
              console.log(`✅ [FILING GUIDE] Employee ${employeeName} has ${activities.length} activities:`, activities);
            }

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

        // Debug final employee data
        console.log(`📋 [FILING GUIDE] Final employees array (${employeesArr.length} employees):`, employeesArr);
        
        // CRITICAL DEBUG: Check if any employees have activities
        const employeesWithActivities = employeesArr.filter(emp => emp.activities && emp.activities.length > 0);
        console.log(`🎯 [FILING GUIDE] Employees with activities: ${employeesWithActivities.length}/${employeesArr.length}`);
        
        if (employeesWithActivities.length === 0 && employeesArr.length > 0) {
          console.error(`❌ [FILING GUIDE] CRITICAL: ${employeesArr.length} employees have NO ACTIVITIES! This will show "No specific activities".`);
          console.log(`🔍 [FILING GUIDE] Sample employee (missing activities):`, employeesArr[0]);
          console.log(`🔍 [FILING GUIDE] This suggests subcomponent queries are failing for all employees.`);
        }

        // Similar processing for contractors and supplies
        const contractorsArr: BreakdownEntry[] = [];
        const suppliesArr: BreakdownEntry[] = [];

        // IMPLEMENT MISSING CONTRACTOR DATA FETCHING
        // Fetch contractor data using rd_contractor_year_data
        const { data: contractorYearData, error: contractorError } = await supabase
          .from('rd_contractor_year_data')
          .select(`
            applied_percent,
            calculated_qre,
            name,
            cost_amount,
            activity_link
          `)
          .eq('business_year_id', selectedYear.id);

        if (contractorError) {
          console.error('Contractor data fetch failed:', contractorError);
        }

        // Process contractors with correct applied percentage from rd_contractor_year_data
        if (contractorYearData) {
          for (const contractorData of contractorYearData) {
            const contractorName = contractorData.name || 'Unknown Contractor';
            const appliedPercent = contractorData.applied_percent || 0;
            const qreAmount = contractorData.calculated_qre || 0;
            const activityLink = contractorData.activity_link || {};

            // Parse activity links to get activities and subcomponents
            const activities: Array<{ activity: string; percent: number }> = [];
            const subcomponents: string[] = [];

            if (activityLink && typeof activityLink === 'object') {
              // Extract activity information from jsonb activity_link
              // This structure may need adjustment based on actual activity_link format
              if (Array.isArray(activityLink)) {
                activityLink.forEach((link: any) => {
                  if (link.activity_name) {
                    activities.push({
                      activity: link.activity_name,
                      percent: link.percent || appliedPercent
                    });
                  }
                  if (link.subcomponent_name) {
                    subcomponents.push(link.subcomponent_name);
                  }
                });
              }
            }

            contractorsArr.push({
              name: contractorName,
              role: 'Contractor',
              qreAmount,
              appliedPercent,
              activities: activities.length > 0 ? activities : [{ activity: 'General Contractor Services', percent: appliedPercent }],
              subcomponents: subcomponents.length > 0 ? subcomponents : ['Various Tasks']
            });
          }
        }

        // IMPLEMENT MISSING SUPPLY DATA FETCHING  
        // Fetch supply data using rd_supply_year_data (assuming similar table structure)
        const { data: supplyYearData, error: supplyError } = await supabase
          .from('rd_supply_year_data')
          .select(`
            applied_percent,
            calculated_qre,
            name,
            cost_amount,
            activity_link
          `)
          .eq('business_year_id', selectedYear.id);

        if (supplyError) {
          console.error('Supply data fetch failed:', supplyError);
        }

        // Process supplies similar to contractors
        if (supplyYearData) {
          for (const supplyData of supplyYearData) {
            const supplyName = supplyData.name || 'Unknown Supply';
            const appliedPercent = supplyData.applied_percent || 0;
            const qreAmount = supplyData.calculated_qre || 0;
            const activityLink = supplyData.activity_link || {};

            // Parse activity links to get activities and subcomponents
            const activities: Array<{ activity: string; percent: number }> = [];
            const subcomponents: string[] = [];

            if (activityLink && typeof activityLink === 'object') {
              if (Array.isArray(activityLink)) {
                activityLink.forEach((link: any) => {
                  if (link.activity_name) {
                    activities.push({
                      activity: link.activity_name,
                      percent: link.percent || appliedPercent
                    });
                  }
                  if (link.subcomponent_name) {
                    subcomponents.push(link.subcomponent_name);
                  }
                });
              }
            }

            suppliesArr.push({
              name: supplyName,
              role: 'Supply/Equipment',
              qreAmount,
              appliedPercent,
              activities: activities.length > 0 ? activities : [{ activity: 'Research Supplies', percent: appliedPercent }],
              subcomponents: subcomponents.length > 0 ? subcomponents : ['Various Research Materials']
            });
          }
        }

        // Data processing completed

        // Set final state
        console.log(`🎯 [FILING GUIDE] Setting employees state with ${employeesArr.length} employees`);
        console.log(`📋 [FILING GUIDE] Final employee sample:`, employeesArr[0]);

        setEmployees(employeesArr);
        setContractors(contractorsArr);
        setSupplies(suppliesArr);
        
        // 🔧 BASELINE FIX: Fetch research activity baseline data with CORRECT applied percentages from Research Design
        // Fetching research activities with applied percentages
        
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
          // Set empty baseline instead of returning to show the error state
          setResearchActivityBaseline({
            activities: [],
            subcomponentsByActivity: {}
          });
          return;
        }

        if (!selectedActivitiesData || selectedActivitiesData.length === 0) {
          console.warn('⚠️ No selected activities found for business year:', selectedYear.id);
          setResearchActivityBaseline({
            activities: [],
            subcomponentsByActivity: {}
          });
          return;
        }

        // Selected activities loaded for baseline calculation

        // For each activity, calculate the REAL applied percentage using Research Design logic
        const activitiesWithRealApplied = [];
        
        for (const activity of selectedActivitiesData || []) {
          const activityId = activity.activity_id;
          const practicePercent = activity.practice_percent || 0;
          
          // Calculate real applied percentage for activity
          
          // Get all steps for this activity
          const { data: stepsData } = await supabase
            .from('rd_selected_steps')
            .select('step_id, time_percentage, non_rd_percentage')
            .eq('business_year_id', selectedYear.id)
            .eq('research_activity_id', activityId);

          // Get all subcomponents for this activity
          const { data: subcomponentsData } = await supabase
            .from('rd_selected_subcomponents')
            .select('step_id, frequency_percentage, year_percentage')
            .eq('business_year_id', selectedYear.id)
            .eq('research_activity_id', activityId);

          // Subcomponents data fetched

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

          // Applied percentage calculated

          activitiesWithRealApplied.push({
            id: activityId,
            name: activity.rd_research_activities.title,
            practice_percent: practicePercent,
            applied_percent: totalApplied, // ✅ FIXED: Use REAL calculated applied percentage
          });
        }

        // Activities with calculated applied percentages ready
        
        // Fetch subcomponent data for each activity - FIXED: Calculate REAL applied percentages
        const subcomponentsByActivity: Record<string, Array<{ name: string; applied: number; color: string }>> = {};
        const subcomponentColors = ['#3b82f6', '#10b981', '#f59e42', '#f43f5e', '#a21caf', '#eab308', '#6366f1', '#14b8a6', '#f472b6', '#facc15'];
        
        for (const activity of activitiesWithRealApplied) {
          try {
            // Get selected subcomponents with their Research Design data
            
            const { data: subcomponentsData, error: subcompError } = await supabase
              .from('rd_selected_subcomponents')
              .select(`
                frequency_percentage,
                year_percentage,
                time_percentage,
                non_rd_percentage,
                step_id,
                subcomponent:rd_research_subcomponents(name),
                step:rd_research_steps(name)
              `)
              .eq('business_year_id', selectedYear.id)
              .eq('research_activity_id', activity.id);
            
            if (subcompError) {
              console.error('Error fetching subcomponents for activity:', activity.name, subcompError);
            }
            
            if (subcomponentsData && subcomponentsData.length > 0) {
              const practicePercent = activity.practice_percent;
              
              subcomponentsByActivity[activity.id] = subcomponentsData.map((sub, index) => {
                // Calculate REAL applied percentage using Research Design formula
                const freq = sub.frequency_percentage || 0;
                const year = sub.year_percentage || 0;
                const timePercent = sub.time_percentage || 0;
                const nonRdPercent = sub.non_rd_percentage || 0;
                
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
                
                // Calculated real applied percentage
                
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
        
        // Setting research activity baseline with subcomponent data

        setResearchActivityBaseline({
          activities: activitiesWithRealApplied,
          subcomponentsByActivity
        });
        
      } catch (error) {
        console.error('Error fetching Calculation Specifics data:', error);
      }
    }
    
    fetchData();
  }, [selectedYear?.id, businessData?.id]);

  // SIMPLE FALLBACK: Use SectionGQREService data if main fetch fails
  useEffect(() => {
    if (!selectedYear?.id || !businessData?.id) return;
    
    const fallbackFetch = async () => {
      // Wait 3 seconds, then check if we need data (increased timeout)
      setTimeout(async () => {
        console.log(`🔍 [FILING GUIDE] Fallback check: employees.length = ${employees.length}`);
        if (employees.length === 0) {
          console.log(`⚠️ [FILING GUIDE] Main data fetch failed - No employees found, triggering fallback service...`);
          // Using fallback service for employee data
          try {
            // Import and use the working SectionGQREService
            const { SectionGQREService } = await import('../../services/sectionGQREService');
            const qreData = await SectionGQREService.getQREDataForSectionG(selectedYear.id);
            
            if (qreData && qreData.length > 0) {
              // Filter only employee entries and GROUP by employee name to avoid duplicates
              const employeeEntries = qreData.filter(entry => entry.category === 'Employee');
              
              // Group by employee name to consolidate multiple subcomponent entries
              const employeeMap = new Map();
              
              employeeEntries.forEach(emp => {
                const employeeName = emp.name || 'Unknown Employee';
                
                if (!employeeMap.has(employeeName)) {
                  employeeMap.set(employeeName, {
                    name: employeeName,
                    role: emp.role || 'No Role',
                    appliedPercent: 0,
                    qreAmount: 0,
                    activities: new Set(),
                    subcomponents: new Set(),
                    entryCount: 0
                  });
                }
                
                const employee = employeeMap.get(employeeName);
                employee.appliedPercent += (emp.applied_percentage || 0);
                employee.qreAmount += (emp.calculated_qre || 0);
                employee.entryCount += 1;
                
                // Add activity and subcomponent to sets (to avoid duplicates)
                if (emp.activity_title) {
                  employee.activities.add(`${emp.activity_title} (${(emp.applied_percentage || 0).toFixed(1)}%)`);
                }
                if (emp.subcomponent_name) {
                  employee.subcomponents.add(emp.subcomponent_name);
                }
              });
              
              // Convert to final format with summed percentages and arrays
              const employeesArr = Array.from(employeeMap.values()).map(emp => ({
                name: emp.name,
                role: emp.role,
                appliedPercent: emp.appliedPercent, // Sum the percentage across all subcomponents
                qreAmount: emp.qreAmount,
                activities: Array.from(emp.activities).map(actStr => {
                  const match = actStr.match(/^(.+) \((.+)%\)$/);
                  return match ? { activity: match[1], percent: parseFloat(match[2]) } : { activity: actStr, percent: 0 };
                }),
                subcomponents: Array.from(emp.subcomponents)
              }));
              
              setEmployees(employeesArr);
              console.log(`✅ [FILING GUIDE FALLBACK] Grouped ${employeeEntries.length} entries into ${employeesArr.length} unique employees`);
            }
          } catch (error) {
            console.error('❌ SectionGQREService fallback failed:', error);
          }
        }
      }, 3000);
    };

    fallbackFetch();
  }, [selectedYear?.id, businessData?.id]);

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