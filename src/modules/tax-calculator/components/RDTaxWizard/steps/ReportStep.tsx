import React, { useState } from 'react';

interface WizardState {
  business: any;
  selectedYear: any;
  selectedActivities: any[];
  employees: any[];
  supplies: any[];
  contractors: any[];
  calculations: any;
}

interface ReportStepProps {
  wizardState: WizardState;
  onComplete: () => void;
  onPrevious: () => void;
}

const ReportStep: React.FC<ReportStepProps> = ({
  wizardState,
  onComplete,
  onPrevious
}) => {
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const generateReport = async () => {
    setGeneratingReport(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setReportGenerated(true);
    setGeneratingReport(false);
  };

  const downloadReport = () => {
    // Create a simple text report (in a real app, this would be a PDF)
    const report = createReportText();
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `R&D_Tax_Credit_Report_${wizardState.business?.name || 'Company'}_${wizardState.selectedYear?.year || '2024'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const createReportText = () => {
    const { business, selectedYear, selectedActivities, employees, supplies, contractors, calculations } = wizardState;
    
    let report = '';
    report += 'R&D TAX CREDIT REPORT\n';
    report += '=====================\n\n';
    
    report += `Business Information:\n`;
    report += `Name: ${business?.name || 'N/A'}\n`;
    report += `EIN: ${business?.ein || 'N/A'}\n`;
    report += `Entity Type: ${business?.entityType || 'N/A'}\n`;
    report += `Address: ${business?.address || 'N/A'}, ${business?.city || 'N/A'}, ${business?.state || 'N/A'} ${business?.zip || 'N/A'}\n`;
    report += `Tax Year: ${selectedYear?.year || 'N/A'}\n`;
    report += `Gross Receipts: $${selectedYear?.grossReceipts?.toLocaleString() || 'N/A'}\n\n`;
    
    report += `Selected Research Activities (${selectedActivities.length}):\n`;
    selectedActivities.forEach((activity, index) => {
      report += `${index + 1}. ${activity.name}\n`;
      if (activity.description) {
        report += `   Description: ${activity.description}\n`;
      }
      if (activity.examples) {
        report += `   Examples: ${activity.examples}\n`;
      }
      report += '\n';
    });
    
    report += `Employees (${employees.length}):\n`;
    employees.forEach((emp, index) => {
      report += `${index + 1}. ${emp.name} - ${emp.title}\n`;
      report += `   Email: ${emp.email}\n`;
      report += `   Salary: $${emp.salary.toLocaleString()}\n`;
      report += `   Hours/Week: ${emp.hoursPerWeek}\n`;
      report += `   R&D Percentage: ${emp.rdPercentage}%\n`;
      report += `   R&D Salary: $${((emp.salary * emp.rdPercentage) / 100).toLocaleString()}\n\n`;
    });
    
    report += `Supplies & Materials (${supplies.length}):\n`;
    supplies.forEach((supply, index) => {
      report += `${index + 1}. ${supply.name}\n`;
      report += `   Description: ${supply.description}\n`;
      report += `   Cost: $${supply.cost.toLocaleString()}\n`;
      report += `   Date: ${new Date(supply.date).toLocaleDateString()}\n\n`;
    });
    
    report += `Contractors (${contractors.length}):\n`;
    contractors.forEach((contractor, index) => {
      report += `${index + 1}. ${contractor.name}\n`;
      report += `   Description: ${contractor.description}\n`;
      report += `   Cost: $${contractor.cost.toLocaleString()}\n`;
      report += `   Type: ${contractor.contractType === 'domestic' ? 'Domestic (65% credit)' : 'Foreign (0% credit)'}\n`;
      report += `   Date: ${new Date(contractor.date).toLocaleDateString()}\n\n`;
    });
    
    if (calculations) {
      report += `CALCULATION SUMMARY:\n`;
      report += `==================\n`;
      report += `Total Wages: $${calculations.totalWages.toLocaleString()}\n`;
      report += `Total Supplies: $${calculations.totalSupplies.toLocaleString()}\n`;
      report += `Total Contractors: $${calculations.totalContractors.toLocaleString()}\n`;
      report += `Total QRE: $${calculations.totalQRE.toLocaleString()}\n`;
      report += `Base Amount: $${calculations.baseAmount.toLocaleString()}\n`;
      report += `Incremental QRE: $${calculations.incrementalQRE.toLocaleString()}\n`;
      report += `Federal Credit: $${calculations.federalCredit.toLocaleString()}\n`;
      
      if (Object.keys(calculations.stateCredits).length > 0) {
        report += `State Credits:\n`;
        Object.entries(calculations.stateCredits).forEach(([state, credit]) => {
          report += `  ${state}: $${credit.toLocaleString()}\n`;
        });
      }
      
      report += `Total Credits: $${calculations.totalCredits.toLocaleString()}\n\n`;
    }
    
    report += `DISCLAIMER:\n`;
    report += `This report is for estimation purposes only. Actual tax credits may vary based on specific IRS regulations, state requirements, business structure, and documentation requirements. Consult with a qualified tax professional before filing your tax return.\n\n`;
    
    report += `Generated on: ${new Date().toLocaleString()}\n`;
    
    return report;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Report Generation</h3>
        <p className="text-gray-600">
          Generate and download your comprehensive R&D tax credit report.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">{wizardState.selectedActivities.length}</div>
          <div className="text-sm text-gray-600">Research Activities</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">{wizardState.employees.length}</div>
          <div className="text-sm text-gray-600">Employees</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">
            ${(wizardState.supplies.length + wizardState.contractors.length)}
          </div>
          <div className="text-sm text-gray-600">Expense Items</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-orange-600">
            ${wizardState.calculations?.totalCredits?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-600">Total Credits</div>
        </div>
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h4>
        
        {!reportGenerated ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <p className="text-gray-600 mb-6">
              Generate a comprehensive report containing all your R&D tax credit information, 
              calculations, and supporting documentation.
            </p>
            <button
              onClick={generateReport}
              disabled={generatingReport}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingReport ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating Report...</span>
                </div>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-green-600 text-6xl mb-4">✅</div>
            <h5 className="text-lg font-semibold text-gray-900 mb-2">Report Generated Successfully!</h5>
            <p className="text-gray-600 mb-6">
              Your R&D tax credit report is ready for download. The report includes all your 
              business information, research activities, expenses, and calculations.
            </p>
            <div className="space-y-3">
              <button
                onClick={downloadReport}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Download Report
              </button>
              <button
                onClick={() => setReportGenerated(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors ml-3"
              >
                Regenerate Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Contents Preview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Report Contents</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Business Information</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Research Activities</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Employee Details</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Expense Breakdown</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span className="text-sm text-gray-700">QRE Calculations</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Tax Credit Summary</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
              <span className="text-sm text-gray-700">State Credit Details</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Documentation Checklist</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Next Steps</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div>
              <div className="font-medium text-blue-900">Review Your Report</div>
              <div className="text-sm text-blue-700">
                Carefully review all information in your generated report for accuracy.
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div>
              <div className="font-medium text-blue-900">Consult with Tax Professional</div>
              <div className="text-sm text-blue-700">
                Share your report with a qualified tax professional for review and filing guidance.
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div>
              <div className="font-medium text-blue-900">Gather Supporting Documentation</div>
              <div className="text-sm text-blue-700">
                Collect time records, expense receipts, and other documentation to support your claim.
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </div>
            <div>
              <div className="font-medium text-blue-900">File Your Tax Return</div>
              <div className="text-sm text-blue-700">
                Include Form 6765 (Credit for Increasing Research Activities) with your tax return.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Important Reminders
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>This report is for estimation purposes only</li>
                <li>Actual credits may vary based on IRS interpretation</li>
                <li>Maintain detailed records and documentation</li>
                <li>Consider filing Form 6765 with your tax return</li>
                <li>Consult with a qualified tax professional</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Complete Wizard
        </button>
      </div>
    </div>
  );
};

export default ReportStep; 