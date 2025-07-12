import React from 'react';

interface FilingProcessOverviewProps {
  calculations: any;
  businessData: any;
  selectedYear: any;
  selectedMethod?: 'asc' | 'standard';
  debugData?: any;
}

export const FilingProcessOverview: React.FC<FilingProcessOverviewProps> = ({
  calculations,
  businessData,
  selectedYear,
  selectedMethod,
  debugData
}) => {
  // BRIGHT DEBUG LOGS
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] calculations:', 'background: #00ff00; color: #000; font-weight: bold;', calculations);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] businessData:', 'background: #00ff00; color: #000; font-weight: bold;', businessData);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] selectedYear:', 'background: #00ff00; color: #000; font-weight: bold;', selectedYear);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] selectedMethod:', 'background: #00ff00; color: #000; font-weight: bold;', selectedMethod);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] debugData:', 'background: #00ff00; color: #000; font-weight: bold;', debugData);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Extract summary numbers - handle the nested structure
  const fed = calculations?.federalCredits ?? {};
  const selectedFedData = fed[selectedMethod] ?? fed.standard ?? {};
  const totalQRE = calculations?.currentYearQRE?.total ?? 0;
  const totalCredit = selectedFedData.credit ?? 0;
  const taxYear = selectedYear?.year || new Date().getFullYear();

  // More granular logs
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] totalQRE:', 'background: #fffb00; color: #000; font-weight: bold;', totalQRE);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] totalCredit:', 'background: #fffb00; color: #000; font-weight: bold;', totalCredit);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] selectedFedData:', 'background: #fffb00; color: #000; font-weight: bold;', selectedFedData);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] fed DETAILED:', 'background: #ff0000; color: #fff; font-weight: bold;', JSON.stringify(fed, null, 2));

  // Check if we have data
  const hasData = totalQRE > 0 && totalCredit > 0;

  if (!hasData) {
    return (
      <div className="filing-process-overview">
        <h2 className="filing-guide-section-title">Filing Process Overview</h2>
        <div className="warning-box">
          <h3>⚠️ No Summary Data Available</h3>
          <p>No summary data is available for the filing process overview. Please ensure QRE data has been entered and calculations have been performed.</p>
          <div className="debug-info">
            <strong>Debug Info:</strong>
            <pre>{JSON.stringify({ totalQRE, totalCredit, selectedMethod, hasData }, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="filing-process-overview">
      <h2 className="filing-guide-section-title">Filing Process Overview</h2>
      
      <div className="filing-summary-section">
        <h3 className="filing-guide-section-title">Summary</h3>
        <table className="filing-summary-table">
          <tbody>
            <tr>
              <td><strong>Business</strong></td>
              <td>{businessData?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Tax Year</strong></td>
              <td>{taxYear}</td>
            </tr>
            <tr>
              <td><strong>Calculation Method</strong></td>
              <td>{selectedMethod === 'asc' ? 'ASC (Alternative Simplified Credit)' : 'Standard Credit'}</td>
            </tr>
            <tr>
              <td><strong>Total QRE</strong></td>
              <td>{formatCurrency(totalQRE)}</td>
            </tr>
            <tr>
              <td><strong>Federal Credit</strong></td>
              <td>{formatCurrency(totalCredit)}</td>
            </tr>
            <tr>
              <td><strong>Credit Rate</strong></td>
              <td>{selectedMethod === 'asc' ? '6%' : '20%'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="filing-process-steps">
        <h3 className="filing-guide-section-title">Filing Process Steps</h3>
        <ol className="filing-process-list">
          <li>
            <strong>Gather Documentation</strong>
            <p>Collect all supporting documentation for your R&D activities, including time records, expense receipts, and project descriptions.</p>
          </li>
          <li>
            <strong>Complete Form 6765</strong>
            <p>Fill out IRS Form 6765 with the calculated credit amounts. Use the pro forma provided in this guide as a reference.</p>
          </li>
          <li>
            <strong>Attach Supporting Schedules</strong>
            <p>Include detailed schedules showing the breakdown of QREs by category (wages, supplies, contract research).</p>
          </li>
          <li>
            <strong>File with Tax Return</strong>
            <p>Submit Form 6765 with your business tax return (Form 1120, 1120S, 1065, or 1040 Schedule C).</p>
          </li>
          <li>
            <strong>Maintain Records</strong>
            <p>Keep all supporting documentation for at least 3 years after filing, as the IRS may request additional information.</p>
          </li>
        </ol>
      </div>

      <div className="method-details">
        <h3 className="filing-guide-section-title">Method Details</h3>
        {selectedMethod === 'asc' ? (
          <div className="calculation-method-explanation">
            <h4>ASC (Alternative Simplified Credit) Method</h4>
            <ul>
              <li><strong>Credit Rate:</strong> 6% of incremental QRE</li>
              <li><strong>Base Amount:</strong> Average of prior 3 years' QRE (or 50% of current year if startup)</li>
              <li><strong>Incremental QRE:</strong> Current year QRE minus base amount</li>
              <li><strong>Advantages:</strong> Simpler calculation, no gross receipts test</li>
              <li><strong>Limitations:</strong> Lower credit rate than standard method</li>
            </ul>
          </div>
        ) : (
          <div className="calculation-method-explanation">
            <h4>Standard Credit Method</h4>
            <ul>
              <li><strong>Credit Rate:</strong> 20% of incremental QRE</li>
              <li><strong>Base Amount:</strong> Greater of fixed base amount or 50% of current year QRE</li>
              <li><strong>Fixed Base Amount:</strong> Average of prior 4 years' QRE × base percentage</li>
              <li><strong>Base Percentage:</strong> Average of QRE to gross receipts ratio for prior 4 years</li>
              <li><strong>Advantages:</strong> Higher potential credit</li>
              <li><strong>Limitations:</strong> More complex calculation, requires gross receipts data</li>
            </ul>
          </div>
        )}
      </div>

      <div className="filing-process-notes">
        <h3 className="filing-guide-section-title">Important Notes</h3>
        <div className="filing-note">
          <ul>
            <li>This guide provides a pro forma calculation for reference only.</li>
            <li>Actual filing should be done by a qualified tax professional.</li>
            <li>Ensure all QREs meet the IRS requirements for qualified research.</li>
            <li>Consider consulting with a tax advisor for complex situations.</li>
            <li>Keep detailed records of all R&D activities and expenses.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 