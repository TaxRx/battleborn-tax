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
  // Extract summary numbers - use the correct structure from RDCalculationsService
  const totalQRE = calculations?.currentYearQRE?.total ?? 0;
  const taxYear = selectedYear?.year || new Date().getFullYear();
  
  // 🔧 FIX: Get federal credit based on selectedMethod from the correct calculation structure
  const federalCredits = calculations?.federalCredits ?? {};
  let totalCredit = 0;
  
  if (selectedMethod === 'asc' && federalCredits.asc) {
    totalCredit = federalCredits.asc.adjustedCredit ?? federalCredits.asc.credit ?? 0;
  } else if (selectedMethod === 'standard' && federalCredits.standard) {
    totalCredit = federalCredits.standard.adjustedCredit ?? federalCredits.standard.credit ?? 0;
  } else {
    // Fallback to totalFederalCredit from calculations
    totalCredit = calculations?.totalFederalCredit ?? 0;
  }

  // 🔧 FIX: Get REAL state credits from State Pro Forma calculations for the business's state
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
        // Resolve state code from business data (domicile -> contact_info.state -> state)
        const stateCode = businessData?.domicile_state || businessData?.contact_info?.state || businessData?.state;
        if (!stateCode) {
          setRealStateCredits(0);
          setLoadingStateCredits(false);
          return;
        }
        const stateCreditsResult = await StateProFormaCalculationService.getStateCreditsFromProForma(selectedYear.id, stateCode, 'standard');
        setRealStateCredits(stateCreditsResult.total || 0);
      } catch (error) {
        console.error('Error loading state credits:', error);
        setRealStateCredits(0);
      } finally {
        setLoadingStateCredits(false);
      }
    };

    loadRealStateCredits();
  }, [selectedYear?.id, businessData?.domicile_state, businessData?.contact_info?.state, businessData?.state]);

  // Use real state credits instead of calculations page data
  const stateCreditsTotal = realStateCredits;


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
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: 0, marginBottom: 8, color: '#1f2937' }}>Federal Filing Guidance</h3>
        <p style={{ margin: 0, marginBottom: 8 }}>
          Filing for the Research and Development (R&D) tax credit can be a complex process, but with the right guidance
          and a pro forma template, it can be done accurately and efficiently. This document provides clear guidance on
          taking the credit. In addition, our team is standing by to assist you and your accounting team with any questions.
        </p>
        <p style={{ margin: 0 }}>
          In this guide, we will walk you through the steps for filing for the R&D tax credit using federal Form 6765, and we
          provide a pro forma template for your convenience. We also include information about the election under IRC 280C(c)(3)
          and when a company might make this election.
        </p>
      </div>
      
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
                <td className="summary-value summary-amount">{formatCurrency(Math.round(totalCredit))}</td>
              </tr>
              {/* Add State Credits if available - Fix: Use real-time calculation */}
              {stateCreditsTotal > 0 && (
                <tr className="summary-row-highlight">
                  <td className="summary-label"><strong>State Credits</strong></td>
                  <td className="summary-value summary-amount">{formatCurrency(Math.round(stateCreditsTotal))}</td>
                </tr>
              )}
              <tr className="summary-row-total">
                <td className="summary-label"><strong>Total Tax Credits</strong></td>
                <td className="summary-value summary-total">
                  {formatCurrency(Math.round(totalCredit + stateCreditsTotal))}
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
            <li>Consider consulting with a tax advisor for complex situations.</li>
            <li>Keep detailed records of all R&D activities and expenses.</li>
          </ul>
        </div>
      </div>

      <div className="filing-process-steps">
        {/* 1. Eligibility */}
        <div className="qre-table-section">
          <h3 className="filing-guide-section-title">1. Eligibility for the R&D Tax Credit</h3>
          <p>
            To claim the R&D tax credit, your company must meet certain criteria. Specifically, your company
            engaged in qualified research activities that met the following requirements:
          </p>
          <p>
            With your assistance, we applied these and other qualifying criteria to your business activities to develop
            the supporting materials included in this packet and accompanying report.
          </p>
          <ul className="filing-process-list" style={{ listStyle: 'disc', paddingLeft: 20 }}>
            <li>
              The research was undertaken for the purpose of discovering information that is technological in nature.
              There is no requirement to discover new information for your industry; the application of technology or
              systems that are new to your business is sufficient.
            </li>
            <li>
              The information being sought was intended to be useful in the development of a new or improved business
              component. A business component is a process that is important to the viability of your business.
            </li>
            <li>
              The research involved a process of experimentation. This means that you engaged in a systematic process
              to evaluate your protocols or products to achieve a result.
            </li>
          </ul>
        </div>

        {/* 2. Form 6765 */}
        <div className="qre-table-section">
          <h3 className="filing-guide-section-title">2. Form 6765</h3>
          <p>
            Form 6765 is required to claim the research credit. It is necessary to include the following information:
          </p>
          <ul className="filing-process-list" style={{ listStyle: 'disc', paddingLeft: 20 }}>
            <li>Your company's name, address, and Employer Identification Number (EIN).</li>
            <li>The amount of your qualified research expenses for the tax year, including wages, supplies, and contract research expenses.</li>
            <li>Any base amount adjustments or gross receipts adjustments.</li>
            <li>Any carryforwards or carrybacks of unused credits.</li>
            <li>Any information related to the election IRC 280C(c)(3) (if applicable).</li>
          </ul>
          <p>
            To help make the process easier, we have provided a pro forma template that your accounting team can use to
            complete Form 6765. The pro forma includes all necessary sections and calculations, and it is designed to
            ensure that you don't miss any important information. If applicable, information regarding carryforwards and
            carrybacks will need to be added by your accounting team. You can access the pro forma template in the next
            section of this information packet.
          </p>
        </div>

        {/* 3. Eligible Small Businesses */}
        <div className="qre-table-section">
          <h3 className="filing-guide-section-title">3. Eligible Small Businesses</h3>
          <p>
            If your company is an eligible small business, you may elect to apply the R&D tax credit against your
            payroll taxes instead of your income taxes. To be eligible for this election, your company must have gross
            receipts of less than $5 million for the current tax year and no gross receipts for any tax year preceding
            the 5-year period ending with the current tax year. If your company meets these criteria, you can elect to
            apply the R&D tax credit against your payroll taxes for up to five years.
          </p>
          <p>
            Making this election can be a valuable tool for eligible small businesses, as it can provide a significant
            cash flow benefit. However, it is important to note that once you make this election, you cannot claim the
            R&D tax credit against your income taxes for that tax year.
          </p>
        </div>

        {/* 4. IRC Section 280C Election */}
        <div className="qre-table-section">
          <h3 className="filing-guide-section-title">4. IRC Section 280C Election</h3>
          <p>
            IRC Section 280C(c)(3)(B) is an important provision for companies that are claiming the R&D tax credit and
            wish to take a reduced credit in lieu of adding back Section 174 expenses. This provision allows companies
            to elect to reduce their R&D tax credit by the amount of their Section 174 expenses that are taken as a
            deduction in the tax year.
          </p>
          <p>
            Section 174 expenses are expenses related to research and experimental activities that are deductible in the
            year they are incurred. However, under the general rule for calculating the R&D tax credit, these expenses
            must be added back to the qualified research expenses (QREs) used to calculate the credit.
          </p>
          <p>
            By making the election under Section 280C(c)(3)(B), companies can avoid adding back these expenses and
            instead reduce their R&D tax credit by the same amount. This can result in a smaller credit, but it can also
            simplify the calculation process and reduce the risk of errors.
          </p>
          <p>
            It is important to note that this election is not available to all companies. To be eligible, a company must
            have gross receipts of less than $50 million for the prior tax year and meet certain other criteria.
            Additionally, once a company makes this election, it cannot switch back to the general rule for calculating
            the credit in future years.
          </p>
          <p>
            If the 280C(c)(3) election is not made, taxable income must be increased by making an adjustment to Schedule
            M-3 or Schedule M-1. Schedule M-1 is required for taxpayers with total receipts and total assets that are
            $250,000 or greater.
          </p>
          <ul className="filing-process-list" style={{ listStyle: 'disc', paddingLeft: 20 }}>
            <li>For partnerships and S-corporations, this adjustment to taxable income is generally reported on line 4 of Schedule M-1.</li>
            <li>For corporations, this is generally adjusted on line 5 of Schedule M-1.</li>
          </ul>
          <p>
            Please work with your CPA to determine whether this election is beneficial for you. An election under IRC
            Section 280C(c)(3)(B) to claim the reduced credit can only be made on a timely filed return, including
            extensions. It is impermissible to make this election on an amended return filed after such due date.
          </p>
        </div>

        {/* 5. File Your Tax Return */}
        <div className="qre-table-section">
          <h3 className="filing-guide-section-title">5. File Your Tax Return</h3>
          <p>
            Once Form 6765 is completed, your accounting team will need to attach it and the Summary Report (included
            separately in the accompanying materials) to your company's tax return. The R&D tax credit is claimed on Form
            6765, but it is taken on the appropriate line of your company's tax return. Again, should any questions arise
            at any step of this process, we are here to assist. Please do not hesitate to contact us directly.
          </p>
        </div>
      </div>

 

    </div>
  );
}; 