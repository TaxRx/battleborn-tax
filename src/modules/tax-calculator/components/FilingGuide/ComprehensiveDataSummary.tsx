import React from 'react';

interface ComprehensiveDataSummaryProps {
  businessData: any;
  selectedYear: any;
  calculations: any;
  selectedMethod?: 'asc' | 'standard';
  debugData?: any;
}

export const ComprehensiveDataSummary: React.FC<ComprehensiveDataSummaryProps> = ({
  businessData,
  selectedYear,
  calculations,
  selectedMethod,
  debugData
}) => {
  // BRIGHT DEBUG LOGS
  // eslint-disable-next-line no-console
  console.log('%c[DATA SUMMARY] businessData:', 'background: #00ff88; color: #000; font-weight: bold;', businessData);
  // eslint-disable-next-line no-console
  console.log('%c[DATA SUMMARY] selectedYear:', 'background: #00ff88; color: #000; font-weight: bold;', selectedYear);
  // eslint-disable-next-line no-console
  console.log('%c[DATA SUMMARY] calculations:', 'background: #00ff88; color: #000; font-weight: bold;', calculations);
  // eslint-disable-next-line no-console
  console.log('%c[DATA SUMMARY] selectedMethod:', 'background: #00ff88; color: #000; font-weight: bold;', selectedMethod);
  // eslint-disable-next-line no-console
  console.log('%c[DATA SUMMARY] debugData:', 'background: #00ff88; color: #000; font-weight: bold;', debugData);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  // Extract data from calculations
  const researchActivities = calculations?.researchActivities ?? [];
  const employees = calculations?.employees ?? [];
  const contractors = calculations?.contractors ?? [];
  const supplies = calculations?.supplies ?? [];

  // Check if we have data
  const hasData = researchActivities.length > 0 || employees.length > 0 || contractors.length > 0 || supplies.length > 0;

  if (!hasData) {
    return (
      <div className="comprehensive-data-summary">
        <h2 className="filing-guide-section-title">Comprehensive Data Summary</h2>
        <div className="warning-box">
          <h3>⚠️ No Detailed Data Available</h3>
          <p>No detailed research activities, employees, contractors, or supplies data is available. Please ensure all data has been entered and calculations have been performed.</p>
          <div className="debug-info">
            <strong>Debug Info:</strong>
            <pre>{JSON.stringify({ 
              researchActivities: researchActivities.length, 
              employees: employees.length, 
              contractors: contractors.length, 
              supplies: supplies.length 
            }, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comprehensive-data-summary">
      <h2 className="filing-guide-section-title">Comprehensive Data Summary</h2>
      
      {/* Research Activities Section */}
      {researchActivities.length > 0 && (
        <div className="data-summary-section">
          <h3 className="filing-guide-section-title">Research Activities</h3>
          <table className="data-summary-table">
            <thead>
              <tr>
                <th>Activity Name</th>
                <th>Description</th>
                <th>Steps</th>
                <th>Subcomponents</th>
                <th>Total QRE</th>
              </tr>
            </thead>
            <tbody>
              {researchActivities.map((activity: any, index: number) => (
                <tr key={index}>
                  <td><strong>{activity.name || 'N/A'}</strong></td>
                  <td>{activity.description || 'N/A'}</td>
                  <td>{activity.steps?.length || 0} steps</td>
                  <td>{activity.subcomponents?.length || 0} subcomponents</td>
                  <td className="amount-cell">{formatCurrency(activity.totalQRE || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employees Section */}
      {employees.length > 0 && (
        <div className="data-summary-section">
          <h3 className="filing-guide-section-title">Employees</h3>
          <table className="data-summary-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Position</th>
                <th>Applied Percentage</th>
                <th>Applied Amount</th>
                <th>Time Percentage</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee: any, index: number) => (
                <tr key={index}>
                  <td><strong>{employee.name || 'N/A'}</strong></td>
                  <td>{employee.position || 'N/A'}</td>
                  <td className="percentage-cell">{formatPercentage(employee.appliedPercentage || 0)}</td>
                  <td className="amount-cell">{formatCurrency(employee.appliedAmount || 0)}</td>
                  <td className="percentage-cell">{formatPercentage(employee.timePercentage || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contractors Section */}
      {contractors.length > 0 && (
        <div className="data-summary-section">
          <h3 className="filing-guide-section-title">Contractors</h3>
          <table className="data-summary-table">
            <thead>
              <tr>
                <th>Contractor Name</th>
                <th>Services</th>
                <th>Applied Percentage</th>
                <th>Applied Amount</th>
                <th>Contract Amount</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor: any, index: number) => (
                <tr key={index}>
                  <td><strong>{contractor.name || 'N/A'}</strong></td>
                  <td>{contractor.services || 'N/A'}</td>
                  <td className="percentage-cell">{formatPercentage(contractor.appliedPercentage || 0)}</td>
                  <td className="amount-cell">{formatCurrency(contractor.appliedAmount || 0)}</td>
                  <td className="amount-cell">{formatCurrency(contractor.contractAmount || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplies Section */}
      {supplies.length > 0 && (
        <div className="data-summary-section">
          <h3 className="filing-guide-section-title">Supplies</h3>
          <table className="data-summary-table">
            <thead>
              <tr>
                <th>Supply Name</th>
                <th>Category</th>
                <th>Applied Percentage</th>
                <th>Applied Amount</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((supply: any, index: number) => (
                <tr key={index}>
                  <td><strong>{supply.name || 'N/A'}</strong></td>
                  <td>{supply.category || 'N/A'}</td>
                  <td className="percentage-cell">{formatPercentage(supply.appliedPercentage || 0)}</td>
                  <td className="amount-cell">{formatCurrency(supply.appliedAmount || 0)}</td>
                  <td className="amount-cell">{formatCurrency(supply.totalCost || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Totals */}
      <div className="data-summary-totals">
        <h3 className="filing-guide-section-title">Summary Totals</h3>
        <table className="data-summary-table">
          <tbody>
            <tr>
              <td><strong>Total Research Activities</strong></td>
              <td>{researchActivities.length}</td>
            </tr>
            <tr>
              <td><strong>Total Employees</strong></td>
              <td>{employees.length}</td>
            </tr>
            <tr>
              <td><strong>Total Contractors</strong></td>
              <td>{contractors.length}</td>
            </tr>
            <tr>
              <td><strong>Total Supplies</strong></td>
              <td>{supplies.length}</td>
            </tr>
            <tr className="total-row">
              <td><strong>Total QRE</strong></td>
              <td className="amount-cell">{formatCurrency(calculations?.currentYearQRE?.total || 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}; 