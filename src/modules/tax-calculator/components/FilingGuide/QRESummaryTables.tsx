import React from 'react';

interface QRESummaryTablesProps {
  businessData: any;
  selectedYear: any;
  calculations: any;
  selectedMethod?: 'asc' | 'standard';
  debugData?: any;
}

export const QRESummaryTables: React.FC<QRESummaryTablesProps> = ({
  businessData,
  selectedYear,
  calculations,
  selectedMethod,
  debugData
}) => {
  // BRIGHT DEBUG LOGS
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] businessData:', 'background: #00fff7; color: #000; font-weight: bold;', businessData);
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] selectedYear:', 'background: #00fff7; color: #000; font-weight: bold;', selectedYear);
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] calculations:', 'background: #00fff7; color: #000; font-weight: bold;', calculations);
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] selectedMethod:', 'background: #00fff7; color: #000; font-weight: bold;', selectedMethod);
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] debugData:', 'background: #00fff7; color: #000; font-weight: bold;', debugData);

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

  // Extract QRE data - handle different possible structures
  const currentYearQRE = calculations?.currentYearQRE?.total ?? calculations?.currentYearQRE ?? 0;
  const historicalData = calculations?.historicalData ?? [];
  const totalQRE = calculations?.currentYearQRE?.total ?? calculations?.totalQRE ?? 0;

  // More granular logs
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] currentYearQRE:', 'background: #fffb00; color: #000; font-weight: bold;', currentYearQRE);
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] currentYearQRE DETAILED:', 'background: #ff0000; color: #fff; font-weight: bold;', JSON.stringify(calculations?.currentYearQRE, null, 2));
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] historicalData:', 'background: #fffb00; color: #000; font-weight: bold;', historicalData);
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] historicalData DETAILED:', 'background: #ff0000; color: #fff; font-weight: bold;', JSON.stringify(calculations?.historicalData, null, 2));
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] totalQRE:', 'background: #fffb00; color: #000; font-weight: bold;', totalQRE);
  // eslint-disable-next-line no-console
  console.log('%c[QRE SUMMARY] federalCredits DETAILED:', 'background: #ff0000; color: #fff; font-weight: bold;', JSON.stringify(calculations?.federalCredits, null, 2));

  // Check if we have data
  const hasData = totalQRE > 0 || (historicalData && historicalData.length > 0);

  if (!hasData) {
    return (
      <div className="qre-summary-tables">
        <h2 className="filing-guide-section-title">QRE Summary Tables</h2>
        <div className="warning-box">
          <h3>⚠️ No QRE Data Available</h3>
          <p>No Qualified Research Expenses have been entered for this business year. Please complete the QRE setup steps first.</p>
          <div className="debug-info">
            <strong>Debug Info:</strong>
            <pre>{JSON.stringify({ totalQRE, historicalData: historicalData?.length, calculations: !!calculations }, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qre-summary-tables">
      <h2 className="filing-guide-section-title">QRE Summary Tables</h2>
      
      {/* Current Year QRE Breakdown */}
      <div className="qre-table-section">
        <h3 className="qre-table-title">Current Year QRE Breakdown ({selectedYear?.year})</h3>
        <table className="qre-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Employee Wages</td>
              <td className="qre-amount">{formatCurrency(calculations?.currentYearQRE?.employee_wages ?? 0)}</td>
              <td className="qre-percentage">{formatPercentage(((calculations?.currentYearQRE?.employee_wages ?? 0) / totalQRE) * 100)}</td>
            </tr>
            <tr>
              <td>Contractor Costs</td>
              <td className="qre-amount">{formatCurrency(calculations?.currentYearQRE?.contractor_costs ?? 0)}</td>
              <td className="qre-percentage">{formatPercentage(((calculations?.currentYearQRE?.contractor_costs ?? 0) / totalQRE) * 100)}</td>
            </tr>
            <tr>
              <td>Supply Costs</td>
              <td className="qre-amount">{formatCurrency(calculations?.currentYearQRE?.supply_costs ?? 0)}</td>
              <td className="qre-percentage">{formatPercentage(((calculations?.currentYearQRE?.supply_costs ?? 0) / totalQRE) * 100)}</td>
            </tr>
            <tr className="qre-total-row">
              <td><strong>Total QRE</strong></td>
              <td className="qre-amount"><strong>{formatCurrency(totalQRE)}</strong></td>
              <td className="qre-percentage"><strong>100%</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Historical QRE Data */}
      {historicalData && historicalData.length > 0 && (
        <div className="qre-table-section">
          <h3 className="qre-table-title">Historical QRE Data</h3>
          <table className="qre-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>QRE Amount</th>
                <th>Gross Receipts</th>
                <th>QRE % of Receipts</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Filter to show only report year + previous 3 years
                const currentYear = selectedYear?.year || new Date().getFullYear();
                const filteredData = historicalData
                  .filter((year: any) => year.year <= currentYear && year.year >= (currentYear - 3))
                  .sort((a: any, b: any) => b.year - a.year); // Sort descending (newest first)
                
                return filteredData.map((year: any, index: number) => (
                  <tr key={index}>
                    <td>{year.year}</td>
                    <td className="qre-amount">{formatCurrency(year.qre)}</td>
                    <td className="qre-amount">{formatCurrency(year.gross_receipts)}</td>
                    <td className="qre-percentage">{formatPercentage((year.qre / year.gross_receipts) * 100)}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Method Summary */}
      <div className="qre-table-section">
        <h3 className="qre-table-title">Calculation Method Summary</h3>
        <div className="calculation-method-explanation">
          <p><strong>Selected Method:</strong> <span className="method-highlight">{selectedMethod === 'asc' ? 'ASC (Alternative Simplified Credit)' : 'Standard Credit'}</span></p>
          <p><strong>Total QRE:</strong> {formatCurrency(totalQRE)}</p>
          {calculations?.federalCredits && (
            <div className="method-details">
              <h4>Federal Credit Breakdown:</h4>
              <ul>
                {selectedMethod === 'asc' ? (
                  <>
                    <li>Average Prior QRE: <span className="qre-amount">{formatCurrency(calculations.federalCredits.asc?.avgPriorQRE ?? 0)}</span></li>
                    <li>50% of Average Prior QRE: <span className="qre-amount">{formatCurrency((calculations.federalCredits.asc?.avgPriorQRE ?? 0) * 0.5)}</span></li>
                    <li>Incremental QRE: <span className="qre-amount">{formatCurrency(calculations.federalCredits.asc?.incrementalQRE ?? 0)}</span></li>
                    <li><strong>Calculated Credit: <span className="qre-amount">{formatCurrency(calculations.federalCredits.asc?.credit ?? 0)}</span></strong></li>
                  </>
                ) : (
                  <>
                    <li>Base Percentage: <span className="qre-percentage">{formatPercentage((calculations.federalCredits.standard?.basePercentage ?? 0) * 100)}</span></li>
                    <li>Fixed Base Amount: <span className="qre-amount">{formatCurrency(calculations.federalCredits.standard?.fixedBaseAmount ?? 0)}</span></li>
                    <li>Incremental QRE: <span className="qre-amount">{formatCurrency(calculations.federalCredits.standard?.incrementalQRE ?? 0)}</span></li>
                    <li><strong>Calculated Credit: <span className="qre-amount">{formatCurrency(calculations.federalCredits.standard?.credit ?? 0)}</span></strong></li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 