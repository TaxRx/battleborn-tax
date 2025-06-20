import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  UsersIcon,
  BriefcaseIcon,
  CubeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  GlobeAmericasIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import useBusinessStore from '../../store/businessStore';
import useExpenseStore from '../../store/expenseStore';
import useActivitiesStore from '../../store/activitiesStore';
import useStaffStore from '../../store/staffStore';
import { stateCredits, calculateStateCredit } from '../../data/stateCredits';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="font-['DM_Serif_Display'] text-2xl text-gray-900 mb-6">{children}</h2>
);

const FinalizeCalculations: React.FC = () => {
  const navigate = useNavigate();
  const businessStore = useBusinessStore();
  const { yearStarted, availableYears, historicalData, state: userState, entityType } = businessStore;
  const [selectedYear, setSelectedYear] = useState(
    availableYears && availableYears.length > 0 ? Math.max(...availableYears) : new Date().getFullYear()
  );

  // Credit calculation method state
  const [calculationMethod, setCalculationMethod] = useState<'standard' | 'asc'>('asc');
  const [use280C, setUse280C] = useState(true);
  const [includeStateCredit, setIncludeStateCredit] = useState(true);
  const [showMethodInfo, setShowMethodInfo] = useState(false);

  const expenseStore = useExpenseStore();
  const activitiesStore = useActivitiesStore();
  const staffStore = useStaffStore();

  // Get all expenses for the selected year
  const contractorExpenses = Object.values(expenseStore.contractorExpenses)
    .filter(expense => expense.year === selectedYear);
  const supplyExpenses = Object.values(expenseStore.supplyExpenses)
    .filter(expense => expense.year === selectedYear);
  const employees = staffStore.employees;

  // Calculate totals
  const totals = React.useMemo(() => {
    const result = {
      totalWages: 0,
      totalAppliedWages: 0,
      totalContractors: 0,
      totalAppliedContractors: 0,
      totalSupplies: 0,
      totalAppliedSupplies: 0
    };

    employees.forEach(employee => {
      result.totalWages += Math.round(employee.annualWage);
      const totalAllocationPercent = Object.values(employee.yearlyActivities[selectedYear] || {})
        .reduce((sum, activity) => sum + (activity.percentage || 0), 0);
      result.totalAppliedWages += Math.round(employee.annualWage * (totalAllocationPercent / 100));
    });

    contractorExpenses.forEach(expense => {
      result.totalContractors += Math.round(expense.amount);
      result.totalAppliedContractors += Math.round(expense.amount * (expense.researchPercentage / 100));
    });

    supplyExpenses.forEach(expense => {
      result.totalSupplies += Math.round(expense.amount);
      result.totalAppliedSupplies += Math.round(expense.amount * (expense.researchPercentage / 100));
    });

    return result;
  }, [employees, contractorExpenses, supplyExpenses, selectedYear]);
  
  // Calculate total qualified expenses
  const totalQualifiedExpenses = Math.round(totals.totalAppliedWages + totals.totalAppliedContractors + totals.totalAppliedSupplies);

  // Calculate average gross receipts for prior 4 years
  const avgGrossReceipts = React.useMemo(() => {
    const priorYears = Array.from({ length: 4 }, (_, i) => selectedYear - (i + 1));
    const validGrossReceipts = priorYears
      .map(year => historicalData[year]?.grossReceipts || 0)
      .filter(amount => amount > 0);
    
    return validGrossReceipts.length > 0
      ? Math.round(validGrossReceipts.reduce((sum, amount) => sum + amount, 0) / validGrossReceipts.length)
      : 0;
  }, [selectedYear, historicalData]);

  // Calculate average QREs for prior 3 years
  const avgPriorQREs = React.useMemo(() => {
    const priorYears = Array.from({ length: 3 }, (_, i) => selectedYear - (i + 1));
    const validQREs = priorYears
      .map(year => historicalData[year]?.qre || 0)
      .filter(amount => amount > 0);
    
    return validQREs.length > 0
      ? Math.round(validQREs.reduce((sum, amount) => sum + amount, 0) / validQREs.length)
      : 0;
  }, [selectedYear, historicalData]);

  // Calculate base amount for states that need it
  const baseAmount = React.useMemo(() => {
    if (calculationMethod === 'standard') {
      return Math.round(Math.max(
        0.03 * avgGrossReceipts,
        totalQualifiedExpenses * 0.5
      ));
    } else {
      // For ASC, base amount is usually 0.5 * avgPriorQREs
      return Math.round(0.5 * avgPriorQREs);
    }
  }, [calculationMethod, avgGrossReceipts, totalQualifiedExpenses, avgPriorQREs]);

  // Calculate credit amount based on method
  const creditAmount = React.useMemo(() => {
    if (calculationMethod === 'standard') {
      // Check if we have gross receipts data
      if (avgGrossReceipts === 0) {
        return 0;
      }

      // Calculate fixed-base percentage (using 3% for startups)
      const isStartup = selectedYear - yearStarted < 5;
      const fixedBasePercentage = isStartup ? 3 : 3; // TODO: Implement historical calculation for established businesses

      // Calculate base amount
      const baseAmount = Math.round(Math.max(
        fixedBasePercentage * avgGrossReceipts / 100,
        totalQualifiedExpenses * 0.5 // Minimum base amount
      ));

      // Calculate standard credit
      return Math.round(0.2 * (totalQualifiedExpenses - baseAmount));
    } else {
      // ASC Method
      const priorYears = Array.from({ length: 3 }, (_, i) => selectedYear - (i + 1));
      const validQREs = priorYears
        .map(year => historicalData[year]?.qre || 0)
        .filter(amount => amount > 0);
      
      // If we have 3 valid prior years, use 14% rate with base amount
      if (validQREs.length === 3) {
        const avgPriorQREs = validQREs.reduce((sum, amount) => sum + amount, 0) / 3;
        return Math.round(0.14 * (totalQualifiedExpenses - (0.5 * avgPriorQREs)));
      } 
      // If we have some prior years but not 3, use 6% rate with base amount
      else if (validQREs.length > 0) {
        const avgPriorQREs = validQREs.reduce((sum, amount) => sum + amount, 0) / validQREs.length;
        return Math.round(0.06 * (totalQualifiedExpenses - (0.5 * avgPriorQREs)));
      }
      // If no prior years, use 6% rate on current year only
      else {
        return Math.round(0.06 * totalQualifiedExpenses);
      }
    }
  }, [calculationMethod, totalQualifiedExpenses, avgGrossReceipts, selectedYear, yearStarted, historicalData]);

  // Apply Section 280C reduction if elected (always 21% federal tax rate)
  const federalCreditAmount = use280C ? Math.round(creditAmount * 0.79) : creditAmount;
  
  // Get state credit rule
  const stateRule = stateCredits[userState as keyof typeof stateCredits];
  // Determine entity type eligibility
  const isCorporation = entityType === 'c_corp';
  const isPassthrough = ['s_corp', 'llc', 'pllc', 'partnership', 'sole_proprietorship'].includes(entityType);
  let eligible = false;
  if (stateRule) {
    if (stateRule.entityTypeRestrictions === 'both') eligible = true;
    else if (stateRule.entityTypeRestrictions === 'corporation' && isCorporation) eligible = true;
    else if (stateRule.entityTypeRestrictions === 'passthrough' && isPassthrough) eligible = true;
  }
  // Calculate state credit using real logic
  let stateCreditAmount = 0;
  let stateCreditMessage = '';
  if (!stateRule || stateRule.entityTypeRestrictions === 'none') {
    stateCreditMessage = 'No state R&D tax credit available for your state.';
  } else if (!eligible) {
    stateCreditMessage = `State credit not available for your entity type (${entityType.replace('_', ' ')}).`;
  } else {
    stateCreditAmount = includeStateCredit ? calculateStateCredit({
      state: userState,
      entityType: entityType as import('../../data/stateCredits').EntityType,
      QREs: totalQualifiedExpenses,
      priorYearQREs: historicalData[selectedYear - 1]?.qre || 0,
      grossReceipts: historicalData[selectedYear]?.grossReceipts || 0,
      federalCredit: federalCreditAmount,
      avgPriorQREs,
      avgGrossReceipts,
      baseAmount,
      basicResearchPayments: 0, // If you have this, pass it
      numEmployees: employees.length,
    }) : 0;
    stateCreditMessage = stateRule.calculation;
  }

  // Total credit amount
  const totalCreditAmount = federalCreditAmount + (includeStateCredit ? stateCreditAmount : 0);

  // Get research activities summary
  const selectedActivities = activitiesStore.selectedActivities
    .filter(activity => activity.year === selectedYear);
  
  // Calculate total QRE
  const wageQRE = employees.reduce((total, emp) => {
    const yearActivities = emp.yearlyActivities[selectedYear] || {};
    const empTotal = Object.values(yearActivities).reduce((sum: number, act: any) => {
      if (!act?.isSelected) return sum;
      return sum + ((act.percentage || 0) * (emp.annualWage || 0) / 100);
    }, 0);
    return total + empTotal;
  }, 0);

  // Calculate total contractor QRE
  const contractorQRE = contractorExpenses.reduce((total, expense) => {
    return total + ((expense.amount || 0) * (expense.researchPercentage || 0) / 100);
  }, 0);

  // Calculate total supply QRE
  const supplyQRE = supplyExpenses.reduce((total, expense) => {
    return total + ((expense.amount || 0) * (expense.researchPercentage || 0) / 100);
  }, 0);

  // Calculate total QRE
  const totalQRE = wageQRE + contractorQRE + supplyQRE;

  // Calculate credits
  const federalCredit = Math.round(totalQRE * 0.1); // 10% federal rate
  const stateCredit = Math.round(totalQRE * 0.05); // 5% state rate
  const estimatedCredit = federalCredit + stateCredit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['DM_Serif_Display'] text-4xl text-gray-900">Finalize Calculations</h1>
            <p className="mt-2 text-lg text-gray-500">
              Review your research credit calculation summary
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-36 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg font-medium h-12"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
                size="lg"
                onClick={() => navigate('/client/qualified-expenses')}
              icon={<ArrowLeftIcon className="h-5 w-5" />}
            >
              Previous Step
            </Button>
            <Button
              variant="primary"
                size="lg"
              onClick={() => navigate('/client/payment')}
                icon={<CheckCircleIcon className="h-5 w-5" />}
              iconPosition="right"
            >
                Proceed to Payment
            </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Credit Method Selection */}
      <Card accentColor="blue" title="Credit Calculation Settings">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMethodInfo(!showMethodInfo)}
              icon={<InformationCircleIcon className="h-5 w-5" />}
            >
              {showMethodInfo ? 'Hide Info' : 'Show Info'}
            </Button>
          </div>

          {showMethodInfo && (
            <div className="mb-6 bg-blue-50 p-6 rounded-lg">
          <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Standard Credit (IRC §41(a)(1))</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    20% of qualified expenses exceeding a base amount. The base amount is calculated using historical data
                    and must be at least 50% of current year QREs.
                  </p>
                  <div className="mt-2 text-sm text-blue-600">
                    <p>Requirements:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Gross receipts history for past 4 years</li>
                      <li>For established businesses: QRE history from 1984-1988</li>
                      <li>For startups: Uses simplified 3% rate</li>
                      </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-blue-900">ASC Credit (IRC §41(c)(5))</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Alternative Simplified Credit - easier to calculate and recommended for most businesses.
                  </p>
                  <div className="mt-2 text-sm text-blue-600">
                    <p>Two calculation methods:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>14% of QREs exceeding 50% of average QREs for prior 3 years</li>
                      <li>6% of current year QREs if no prior year data available</li>
                </ul>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Recommendation:</strong> The ASC method is generally recommended as it's simpler to calculate
                    and doesn't require gross receipts history. It's especially beneficial for businesses with increasing
                    research activities.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Federal Credit Method */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mr-2" />
                Federal Credit Method
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Calculation Method
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="asc"
                        value="asc"
                        checked={calculationMethod === 'asc'}
                        onChange={(e) => setCalculationMethod('asc')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="asc" className="ml-2 block text-sm text-gray-900">
                        Alternative Simplified Credit (ASC)
                        <span className="block text-xs text-gray-500">Recommended for most businesses</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="standard"
                        value="standard"
                        checked={calculationMethod === 'standard'}
                        onChange={(e) => setCalculationMethod('standard')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        disabled={avgGrossReceipts === 0}
                      />
                      <label htmlFor="standard" className="ml-2 block text-sm text-gray-900">
                        Standard Credit Method
                        <span className="block text-xs text-gray-500">
                          {avgGrossReceipts === 0 
                            ? 'Requires gross receipts history (not available)'
                            : 'Traditional calculation method'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 280C Election */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600 mr-2" />
                Section 280C Election
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="use280c"
                    checked={use280C}
                    onChange={(e) => setUse280C(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="use280c" className="ml-2 block text-sm text-gray-900">
                    Elect to reduce credit (recommended)
                    <span className="block text-xs text-gray-500">
                      Reduces credit by 21% federal tax rate to avoid deduction addback
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* State Credit Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GlobeAmericasIcon className="h-5 w-5 text-green-600 mr-2" />
                State Credit Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeState"
                    checked={includeStateCredit}
                    onChange={(e) => setIncludeStateCredit(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeState" className="ml-2 block text-sm text-gray-900">
                    Include state credit calculations
                    <span className="block text-xs text-gray-500">
                      Typically 21% of the federal credit amount
                    </span>
                  </label>
                </div>
              </div>
            </div>
            </div>
          </div>
        </Card>
        
      {/* Credit Amount Card */}
      <div className="bg-[#0b2b9d] rounded-xl shadow-xl p-10 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-['DM_Serif_Display'] text-4xl">Estimated R&D Tax Credit</h2>
            <p className="mt-3 text-xl text-blue-100">
              {calculationMethod === 'asc' 
                ? avgPriorQREs > 0
                  ? '14% of QREs exceeding 50% of prior 3-year average'
                  : '6% of current year QREs (no prior data)'
                : '20% of QREs exceeding base amount'}
            </p>
          </div>
          <div className="text-right space-y-4">
            <div>
              <p className="text-lg text-blue-200">Federal Credit</p>
              <p className="font-['DM_Serif_Display'] text-4xl">${federalCreditAmount.toLocaleString()}</p>
            </div>
            {includeStateCredit && (
              <div>
                <p className="text-lg text-blue-200">State Credit</p>
                <p className="font-['DM_Serif_Display'] text-4xl">${stateCreditAmount.toLocaleString()}</p>
                <p className="text-sm mt-2 text-blue-100">{stateCreditMessage}</p>
                {stateRule && stateRule.preApplication && (
                  <p className="text-xs mt-1 text-blue-200">Pre-application: {stateRule.preApplication}</p>
                )}
              </div>
            )}
            <div className="pt-4 border-t border-blue-400">
              <p className="text-lg text-blue-100">Total Credit</p>
              <p className="font-['DM_Serif_Display'] text-6xl">${totalCreditAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {calculationMethod === 'asc' && avgPriorQREs === 0 && (
          <div className="mt-6 bg-white bg-opacity-10 rounded-lg p-4">
            <div className="flex items-start">
              <QuestionMarkCircleIcon className="h-6 w-6 text-blue-200 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-blue-100">
                To maximize your credit, consider entering QREs for the last 3 years. 
                You may qualify for a higher ASC credit at 14% instead of the current 6%.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Calculation Details Card */}
      <Card accentColor="blue" title="Calculation Details">
        <div className="p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Year QREs</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Qualified Wages:</span>
                    <span className="font-medium">${totals.totalAppliedWages.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Qualified Contractor Expenses:</span>
                    <span className="font-medium">${totals.totalAppliedContractors.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Qualified Supply Expenses:</span>
                    <span className="font-medium">${totals.totalAppliedSupplies.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total QREs:</span>
                      <span className="font-bold text-blue-600">${totalQRE.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Historical Data</h3>
                <div className="space-y-3">
                  {calculationMethod === 'standard' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg. Gross Receipts (4 years):</span>
                        <span className="font-medium">${avgGrossReceipts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Fixed-Base Percentage:</span>
                        <span className="font-medium">3%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Base Amount:</span>
                        <span className="font-medium">
                          ${Math.max(avgGrossReceipts * 0.03, totalQualifiedExpenses * 0.5).toLocaleString()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg. QREs (3 years):</span>
                        <span className="font-medium">${avgPriorQREs.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">50% of Avg. QREs:</span>
                        <span className="font-medium">${(avgPriorQREs * 0.5).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Credit Rate:</span>
                        <span className="font-medium">{avgPriorQREs > 0 ? '14%' : '6%'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Research Activities Summary */}
      <Card accentColor="blue" title="Research Activities Summary">
        <div className="p-8">
          <div className="space-y-4">
            {selectedActivities.map(activity => (
              <div key={activity.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{activity.subcomponents.length} Subcomponents</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {activity.subcomponents.map(sub => (
                    <div key={sub.id} className="bg-gray-50 rounded-md p-3">
                      <div className="text-sm font-medium text-gray-900">{sub.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{sub.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Employee Summary Table */}
      <Card accentColor="blue" title="Employee Summary">
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <UsersIcon className="h-4 w-4 text-gray-400" />
                      <span>Employee</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                      <span>Role</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                      <span>Annual Wage</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <ChartBarIcon className="h-4 w-4 text-gray-400" />
                      <span>Applied Amount</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map(employee => {
                  const totalAllocationPercent = Object.values(employee.yearlyActivities[selectedYear] || {})
                    .reduce((sum, activity) => sum + (activity.percentage || 0), 0);
                  const appliedAmount = employee.annualWage * (totalAllocationPercent / 100);

                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.role}
                          {employee.isBusinessOwner && <span className="ml-1 text-xs text-blue-600">(Owner)</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${employee.annualWage?.toLocaleString() ?? '0'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">${appliedAmount?.toLocaleString() ?? '0'}</span>
                          <span className="text-gray-500 ml-1">({totalAllocationPercent.toFixed(1)}%)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Contractor Summary Table */}
      <Card accentColor="blue" title="Contractor Summary">
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                      <span>Contractor</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                      <span>Role</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                      <span>Contract Amount</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <ChartBarIcon className="h-4 w-4 text-gray-400" />
                      <span>Applied Amount</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contractorExpenses.map(expense => {
                  const appliedAmount = expense.amount * (expense.researchPercentage / 100);

                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{expense.contractorName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{expense.role}</div>
                        <div className="text-xs text-gray-500">{expense.contractorType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${expense.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="font-medium text-purple-600">${appliedAmount.toLocaleString()}</span>
                          <span className="text-gray-500 ml-1">({expense.researchPercentage.toFixed(1)}%)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Supply Summary Table */}
      <Card accentColor="blue" title="Supply Summary">
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <CubeIcon className="h-4 w-4 text-gray-400" />
                      <span>Supplier</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                      <span>Details</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                      <span>Total Cost</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <ChartBarIcon className="h-4 w-4 text-gray-400" />
                      <span>Applied Amount</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplyExpenses.map(expense => {
                  const appliedAmount = expense.amount * (expense.researchPercentage / 100);

                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{expense.supplierName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{expense.vendor}</div>
                        <div className="text-xs text-gray-500">Quantity: {expense.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${expense.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="font-medium text-green-600">${appliedAmount.toLocaleString()}</span>
                          <span className="text-gray-500 ml-1">({expense.researchPercentage.toFixed(1)}%)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FinalizeCalculations;