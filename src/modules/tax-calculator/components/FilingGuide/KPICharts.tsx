import React, { useState, useEffect } from 'react';
import { ResearchActivitiesService, ResearchActivityData } from '../../services/researchActivitiesService';
import './KPICharts.css';

interface KPIChartsProps {
  businessData: any;
  selectedYear: any;
  calculations: any;
  selectedMethod?: 'asc' | 'standard';
  debugData?: any;
}

export const KPICharts: React.FC<KPIChartsProps> = ({
  businessData,
  selectedYear,
  calculations,
  selectedMethod,
  debugData
}) => {
  // Use the same data as the QRE Summary Table for the donut chart
  const qreData = {
    employees: calculations?.currentYearQRE?.employee_wages || 0,
    contractors: calculations?.currentYearQRE?.contractor_costs || 0,
    supplies: calculations?.currentYearQRE?.supply_costs || 0
  };
  const totalQRE = qreData.employees + qreData.contractors + qreData.supplies;

  // Calculate percentages for donut chart
  const employeePercentage = totalQRE > 0 ? (qreData.employees / totalQRE) * 100 : 0;
  const contractorPercentage = totalQRE > 0 ? (qreData.contractors / totalQRE) * 100 : 0;
  const suppliesPercentage = totalQRE > 0 ? (qreData.supplies / totalQRE) * 100 : 0;

  // Shrinkback chart: fetch from DB
  const [researchActivities, setResearchActivities] = useState<ResearchActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedYear?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const activities = await ResearchActivitiesService.getResearchActivitiesWithAppliedPercentages(selectedYear.id);
        setResearchActivities(activities);
      } catch (error) {
        console.error('[KPICharts] Error fetching shrinkback data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear?.id]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Donut chart colors
  const colors = {
    employees: '#3B82F6', // Blue
    contractors: '#10B981', // Green
    supplies: '#F59E0B' // Amber
  };

  // Calculate donut chart segments
  const radius = 80;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  
  const employeeOffset = 0;
  const contractorOffset = employeeOffset + (employeePercentage / 100) * circumference;
  const suppliesOffset = contractorOffset + (contractorPercentage / 100) * circumference;

  return (
    <div className="kpi-charts-container">
      <h3 className="kpi-charts-title">Key Performance Indicators</h3>
      <div className="kpi-charts-grid">
        {/* QRE Distribution Donut Chart */}
        <div className="kpi-chart-card">
          <h4 className="chart-title">QRE Distribution by Category</h4>
          <div className="donut-chart-container">
            <svg width="200" height="200" className="donut-chart">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth={strokeWidth}
              />
              {/* Employee segment */}
              {employeePercentage > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={colors.employees}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (employeePercentage / 100) * circumference}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                />
              )}
              {/* Contractor segment */}
              {contractorPercentage > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={colors.contractors}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (contractorPercentage / 100) * circumference}
                  strokeLinecap="round"
                  transform={`rotate(${-90 + (employeePercentage / 100) * 360} 100 100)`}
                />
              )}
              {/* Supplies segment */}
              {suppliesPercentage > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={colors.supplies}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (suppliesPercentage / 100) * circumference}
                  strokeLinecap="round"
                  transform={`rotate(${-90 + ((employeePercentage + contractorPercentage) / 100) * 360} 100 100)`}
                />
              )}
              {/* Center text */}
              <text x="100" y="95" textAnchor="middle" className="donut-center-text">
                {formatCurrency(totalQRE)}
              </text>
              <text x="100" y="110" textAnchor="middle" className="donut-center-subtext">
                Total QRE
              </text>
            </svg>
            {/* Legend */}
            <div className="donut-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: colors.employees }}></div>
                <div className="legend-text">
                  <span className="legend-label">Employees</span>
                  <span className="legend-value">{formatCurrency(qreData.employees)}</span>
                  <span className="legend-percentage">({employeePercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: colors.contractors }}></div>
                <div className="legend-text">
                  <span className="legend-label">Contractors</span>
                  <span className="legend-value">{formatCurrency(qreData.contractors)}</span>
                  <span className="legend-percentage">({contractorPercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: colors.supplies }}></div>
                <div className="legend-text">
                  <span className="legend-label">Supplies</span>
                  <span className="legend-value">{formatCurrency(qreData.supplies)}</span>
                  <span className="legend-percentage">({suppliesPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Shrinkback Analysis Chart */}
        <div className="kpi-chart-card">
          <h4 className="chart-title">Research Activity Applied Percentages</h4>
          <div className="shrinkback-chart-container">
            {loading ? (
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <p>Loading KPI data...</p>
              </div>
            ) : researchActivities.length > 0 ? (
              <div className="shrinkback-chart">
                {researchActivities.map((activity: ResearchActivityData, index: number) => {
                  const appliedPercent = activity.applied_percent || 0;
                  const barWidth = Math.min(appliedPercent, 100);
                  const isOver100 = appliedPercent > 100;
                  return (
                    <div key={index} className="activity-bar-container">
                      <div className="activity-label">
                        <span className="activity-name">{activity.name || `Activity ${index + 1}`}</span>
                        <span className="activity-percent">{appliedPercent.toFixed(1)}%</span>
                      </div>
                      <div className="bar-container">
                        <div 
                          className={`activity-bar ${isOver100 ? 'over-100' : ''}`}
                          style={{ 
                            width: `${barWidth}%`,
                            backgroundColor: isOver100 ? '#EF4444' : '#3B82F6'
                          }}
                        ></div>
                        {isOver100 && (
                          <div className="over-100-indicator">
                            <span className="over-100-text">Over 100%</span>
                          </div>
                        )}
                      </div>
                      <div className="bar-baseline">100%</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-data-message">
                <div className="no-data-icon">📊</div>
                <p>No research activities data available</p>
                <p className="no-data-subtext">Research activities will appear here when data is loaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 