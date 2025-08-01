import React from 'react';
import { formatCurrency } from '../../../../utils/formatting';
import { StateProFormaCalculationService } from '../../services/stateProFormaCalculationService';

interface FilingProcessOverviewProps {
  businessData: any;
  selectedYear: any;
  calculations: any;
  selectedMethod: string;
}

export const FilingProcessOverview: React.FC<FilingProcessOverviewProps> = ({
  businessData,
  selectedYear,
  calculations,
  selectedMethod
}) => {
  // Extract summary numbers - handle the nested structure
  const fed = calculations?.federalCredits ?? {};
  const selectedFedData = fed[selectedMethod] ?? fed.standard ?? {};
  const totalQRE = calculations?.currentYearQRE?.total ?? 0;
  const totalCredit = selectedFedData.credit ?? 0;
  const taxYear = selectedYear?.year || new Date().getFullYear();

  // 🔧 FIX: Get REAL state credits from State Pro Forma calculations, not calculations page
  const [realStateCredits, setRealStateCredits] = React.useState<number>(0);
  const [loadingStateCredits, setLoadingStateCredits] = React.useState(true);

  // Load real state credits when component mounts or data changes
  React.useEffect(() => {
    const loadRealStateCredits = async () => {
      if (!selectedYear?.id) {
        setRealStateCredits(0);
        setLoadingStateCredits(false);
        return;
      }

      setLoadingStateCredits(true);
      try {
        console.log('🔧 [FILING GUIDE] 📊 Loading REAL state credits from Pro Forma calculations...');
        const stateCreditsResult = await StateProFormaCalculationService.getAllStateCreditsFromProForma(selectedYear.id);
        const realTotal = stateCreditsResult.total;
        
        console.log('🔧 [FILING GUIDE] ✅ REAL state credits loaded:', realTotal);
        console.log('🔧 [FILING GUIDE] 📊 State breakdown:', stateCreditsResult.breakdown);
        
        setRealStateCredits(realTotal);
      } catch (error) {
        console.error('🔧 [FILING GUIDE] ❌ Error loading real state credits:', error);
        setRealStateCredits(0);
      } finally {
        setLoadingStateCredits(false);
      }
    };

    loadRealStateCredits();
  }, [selectedYear?.id, businessData?.client_id]);

  // Use real state credits instead of calculations page data
  const stateCreditsTotal = realStateCredits;

  // More granular logs
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] 🔧 FIXED: Using REAL state credits from Pro Forma:', 'background: #00ff00; color: #000; font-weight: bold;', stateCreditsTotal);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] totalQRE:', 'background: #fffb00; color: #000; font-weight: bold;', totalQRE);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] totalCredit:', 'background: #fffb00; color: #000; font-weight: bold;', totalCredit);
  // eslint-disable-next-line no-console
  console.log('%c[FILING PROCESS] selectedFedData:', 'background: #fffb00; color: #000; font-weight: bold;', selectedFedData);

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
        
        {/* Enhanced Summary Table */}
        <div className="filing-summary-enhanced">
          <table className="filing-summary-table-enhanced">
            <tbody>
              <tr>
                <td className="summary-label"><strong>Business</strong></td>
                <td className="summary-value">{businessData?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td className="summary-label"><strong>Tax Year</strong></td>
                <td className="summary-value">{taxYear}</td>
              </tr>
              <tr>
                <td className="summary-label"><strong>Calculation Method</strong></td>
                <td className="summary-value">{selectedMethod === 'asc' ? 'ASC (Alternative Simplified Credit)' : 'Standard Credit'}</td>
              </tr>
              <tr>
                <td className="summary-label"><strong>Total QRE</strong></td>
                <td className="summary-value">{formatCurrency(totalQRE)}</td>
              </tr>
              <tr className="summary-row-highlight">
                <td className="summary-label"><strong>Federal Credit</strong></td>
                <td className="summary-value summary-amount">{formatCurrency(totalCredit)}</td>
              </tr>
              {/* Add State Credits if available - Fix: Use real-time calculation */}
              {stateCreditsTotal > 0 && (
                <tr className="summary-row-highlight">
                  <td className="summary-label"><strong>State Credits</strong></td>
                  <td className="summary-value summary-amount">{formatCurrency(stateCreditsTotal)}</td>
                </tr>
              )}
              <tr className="summary-row-total">
                <td className="summary-label"><strong>Total Tax Credits</strong></td>
                <td className="summary-value summary-total">
                  {formatCurrency(totalCredit + stateCreditsTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Important Notes */}
        <div className="summary-notes">
          <h4>Important Notes</h4>
          <ul>
            <li>This guide provides a pro forma calculation for reference only.</li>
            <li>Actual filing should be done by a qualified tax professional.</li>
            <li>Ensure all QREs meet the IRS requirements for qualified research.</li>
            <li>Consider consulting with a tax advisor for complex situations.</li>
            <li>Keep detailed records of all R&D activities and expenses.</li>
          </ul>
        </div>
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

 

    </div>
  );
}; 