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
            {/* Non-R&D segment */}
            {nonRDPercent > 0 && (
              <div 
                className="bar-segment non-rd"
                style={{ width: `${nonRDPercent}%` }}
                title={`Non-R&D: ${nonRDPercent.toFixed(1)}%`}
              >
                <span className="segment-label">Non-R&D</span>
              </div>
            )}
            
            {/* Research activity segments */}
            {baseline.activities.map((activity, index) => {
              const width = totalPractice > 0 ? ((activity.applied_percent || 0) / totalPractice) * 100 : 0;
              return (
                <div
                  key={activity.id}
                  className="bar-segment research-activity"
                  style={{ 
                    width: `${width}%`,
                    backgroundColor: activityColors[index % activityColors.length]
                  }}
                  title={`${activity.name}: ${(activity.applied_percent || 0).toFixed(1)}%`}
                >
                  {width > 8 && (
                    <span className="segment-label">
                      {activity.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="activity-legend">
            {nonRDPercent > 0 && (
              <div className="legend-item">
                <span className="legend-color non-rd"></span>
                <span className="legend-name">Non-R&D ({nonRDPercent.toFixed(1)}%)</span>
              </div>
            )}
            {baseline.activities.map((activity, index) => (
              <div key={activity.id} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: activityColors[index % activityColors.length] }}
                ></span>
                <span className="legend-name">{activity.name} ({(activity.applied_percent || 0).toFixed(1)}%)</span>
              </div>
            ))}
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
        // Fetch QRE data for the main table
        const qreData: SectionGQREEntry[] = await SectionGQREService.getQREDataForSectionG(selectedYear.id);
        console.log('%c[CALCULATION SPECIFICS QRE DATA]', 'background: #ff0; color: #d00; font-size: 16px; font-weight: bold;', qreData);
        
        // Group by person (name+role+category), aggregate QRE and applied %, collect activities and subcomponents
        const groupMap: Record<string, BreakdownEntry> = {};
        qreData.forEach(entry => {
          const key = `${entry.category}|${entry.name}|${entry.role || ''}`;
          if (!groupMap[key]) {
            groupMap[key] = {
              name: entry.name,
              role: entry.role,
              appliedPercent: 0,
              qreAmount: 0,
              activities: [],
              subcomponents: [],
            };
          }
          groupMap[key].appliedPercent += entry.applied_percentage;
          groupMap[key].qreAmount += entry.calculated_qre;
          // Add activity if not already present
          if (entry.activity_title && !groupMap[key].activities?.some(a => a.activity === entry.activity_title)) {
            groupMap[key].activities?.push({ activity: entry.activity_title, percent: entry.applied_percentage });
          }
          // Add subcomponent if not already present
          if (entry.subcomponent_name && !groupMap[key].subcomponents?.includes(entry.subcomponent_name)) {
            groupMap[key].subcomponents?.push(entry.subcomponent_name);
          }
        });
        
        // Split by category
        const employeesArr: BreakdownEntry[] = [];
        const contractorsArr: BreakdownEntry[] = [];
        const suppliesArr: BreakdownEntry[] = [];
        Object.entries(groupMap).forEach(([key, entry]) => {
          if (key.startsWith('Employee|')) employeesArr.push(entry);
          else if (key.startsWith('Contractor|')) contractorsArr.push(entry);
          else if (key.startsWith('Supply|')) suppliesArr.push(entry);
        });
        setEmployees(employeesArr);
        setContractors(contractorsArr);
        setSupplies(suppliesArr);
        
        // Fetch research activity baseline data
        const activities = await ResearchActivitiesService.getResearchActivitiesWithAppliedPercentages(selectedYear.id);
        
        // Fetch subcomponent data for each activity
        const subcomponentsByActivity: Record<string, Array<{ name: string; applied: number; color: string }>> = {};
        const subcomponentColors = ['#3b82f6', '#10b981', '#f59e42', '#f43f5e', '#a21caf', '#eab308', '#6366f1', '#14b8a6', '#f472b6', '#facc15'];
        
        for (const activity of activities) {
          try {
            const { data: subcomponentsData } = await supabase
              .from('rd_selected_subcomponents')
              .select('applied_percentage, subcomponent:rd_research_subcomponents(name)')
              .eq('business_year_id', selectedYear.id)
              .eq('research_activity_id', activity.id);
            
            if (subcomponentsData && subcomponentsData.length > 0) {
              subcomponentsByActivity[activity.id] = subcomponentsData.map((sub, index) => ({
                name: sub.subcomponent?.name || 'Unknown Subcomponent',
                applied: sub.applied_percentage || 0,
                color: subcomponentColors[index % subcomponentColors.length]
              }));
            }
          } catch (error) {
            console.error('Error fetching subcomponents for activity:', activity.id, error);
          }
        }
        
        setResearchActivityBaseline({
          activities,
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