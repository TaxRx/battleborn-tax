import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut } from 'react-chartjs-2';
import { ChevronDown, ChevronRight, Save, BarChart2, Table as TableIcon } from 'lucide-react';
import { TaxInfo, TaxRates, TaxStrategy, TaxBreakdown, SavedCalculation } from '../types';
import { taxRates } from '../data/taxRates';
import { calculateTaxBreakdown, calculateStrategyTaxSavings } from '../utils/taxCalculations';
import { getTaxStrategies } from '../utils/taxStrategies';
import TaxBracketBreakdown from './TaxBracketBreakdown';
import AugustaRuleCalculator from './AugustaRuleCalculator';
import HireChildrenCalculator from './HireChildrenCalculator';
import CharitableDonationCalculator from './CharitableDonationCalculator';
import CostSegregationCalculator from './CostSegregationCalculator';
import FmcModal from './FmcModal';
import UpdateDialog from './UpdateDialog';
import StrategyCards from './StrategyCards';
import styled from 'styled-components';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface TaxResultsProps {
  taxInfo: TaxInfo;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onStrategiesSelect: (strategies: TaxStrategy[]) => void;
  onSaveCalculation: (calc: SavedCalculation) => void;
  onStrategyAction?: (strategyId: string, action: string) => void;
}

interface TaxBreakdownTableProps {
  breakdown: TaxBreakdown;
  totalIncome: number;
  label: string;
}

function TaxBreakdownTable({ breakdown, totalIncome, label }: TaxBreakdownTableProps) {
  const getMarginalRate = (type: string) => {
    switch (type) {
      case 'federal':
        return '37.00%';
      case 'state':
        return '12.30%';
      case 'selfEmployment':
        return '2.90%';
      case 'socialSecurity':
        return '6.20%';
      case 'medicare':
        return '2.35%';
      default:
        return '-';
    }
  };

  const getAverageRate = (amount: number) => {
    return ((amount / totalIncome) * 100).toFixed(2) + '%';
  };

  return (
    <div className="w-full">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-xs font-medium text-gray-500 uppercase tracking-wider leading-[1.1]">
              {label}
            </th>
            <th className="py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-right leading-[1.1]">
              ANNUAL RESULTS
            </th>
            <th className="py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-right leading-[1.1]">
              MARGINAL
            </th>
            <th className="py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-right leading-[1.1]">
              AVERAGE
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          <tr className="border-b">
            <td className="py-2">Federal Tax:</td>
            <td className="text-right">${breakdown.federal.toLocaleString()}</td>
            <td className="text-right">{getMarginalRate('federal')}</td>
            <td className="text-right">{getAverageRate(breakdown.federal)}</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">State Tax:</td>
            <td className="text-right">${breakdown.state.toLocaleString()}</td>
            <td className="text-right">{getMarginalRate('state')}</td>
            <td className="text-right">{getAverageRate(breakdown.state)}</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">Self-Employment Tax:</td>
            <td className="text-right">${breakdown.selfEmployment.toLocaleString()}</td>
            <td className="text-right">{getMarginalRate('selfEmployment')}</td>
            <td className="text-right">{getAverageRate(breakdown.selfEmployment)}</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">Social Security Tax:</td>
            <td className="text-right">${breakdown.socialSecurity.toLocaleString()}</td>
            <td className="text-right">{getMarginalRate('socialSecurity')}</td>
            <td className="text-right">{getAverageRate(breakdown.socialSecurity)}</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">Medicare Tax:</td>
            <td className="text-right">${breakdown.medicare.toLocaleString()}</td>
            <td className="text-right">{getMarginalRate('medicare')}</td>
            <td className="text-right">{getAverageRate(breakdown.medicare)}</td>
          </tr>
          <tr className="border-t-2 font-bold">
            <td className="py-2">TOTAL TAX:</td>
            <td className="text-right">${breakdown.total.toLocaleString()}</td>
            <td className="text-right">-</td>
            <td className="text-right">{getAverageRate(breakdown.total)}</td>
          </tr>
          <tr className="font-bold text-green-600">
            <td className="py-2">YOU KEEP:</td>
            <td className="text-right">${(totalIncome - breakdown.total).toLocaleString()}</td>
            <td className="text-right">-</td>
            <td className="text-right">{((1 - breakdown.total / totalIncome) * 100).toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const KPIContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 16px;
`;

const KPICard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const KPILabel = styled.div`
  font-size: 1rem;
  color: #475569;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const KPIValue = styled.div`
  font-size: 2.25rem;
  font-weight: 700;
  color: #1e293b;
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
`;

const KPISubtext = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
`;

const MissionContainer = styled.div`
  background: linear-gradient(135deg, #1a1a3f 0%, #2d2d67 100%);
  border-radius: 16px;
  padding: 3rem;
  color: white;
  margin-bottom: 3rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const MissionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  background: linear-gradient(90deg, #fff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const MissionText = styled.p`
  font-size: 1.125rem;
  line-height: 1.75;
  color: #e2e8f0;
  margin-bottom: 2rem;
`;

const MissionList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 1.5rem 0;
`;

const MissionItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 1.125rem;
  color: #e2e8f0;
  
  &:before {
    content: "•";
    color: #818cf8;
    font-weight: bold;
    margin-right: 1rem;
  }
`;

const MissionSection = styled.div`
  margin-top: 2rem;
  
  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #818cf8;
    margin-bottom: 1rem;
  }
`;

export default function TaxResults({ 
  taxInfo, 
  selectedYear, 
  onYearChange,
  onStrategiesSelect,
  onSaveCalculation,
  onStrategyAction
}: TaxResultsProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['income_shifted']);
  const [expandedStrategies, setExpandedStrategies] = useState<string[]>([]);
  const [showBracketBreakdown, setShowBracketBreakdown] = useState(false);
  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showBeforeTable, setShowBeforeTable] = useState(false);
  const [showAfterTable, setShowAfterTable] = useState(false);
  const [showFmcModal, setShowFmcModal] = useState(false);
  const [currentTaxInfo, setCurrentTaxInfo] = useState<TaxInfo>(taxInfo);
  const [strategies, setStrategies] = useState<TaxStrategy[]>(() => {
    const generatedStrategies = getTaxStrategies(currentTaxInfo, calculateTaxBreakdown(currentTaxInfo, taxRates[selectedYear]));
    console.log('Generated strategies:', generatedStrategies);
    return generatedStrategies;
  });

  const previousStrategiesRef = useRef<TaxStrategy[]>([]);

  const rates = useMemo(() => taxRates[selectedYear], [selectedYear]);
  
  const baseBreakdown = useMemo(() => 
    calculateTaxBreakdown(currentTaxInfo, rates),
    [currentTaxInfo, rates]
  );

  const strategyBreakdown = useMemo(() => 
    calculateTaxBreakdown(currentTaxInfo, rates, strategies.filter(s => s.enabled)),
    [currentTaxInfo, rates, strategies]
  );

  useEffect(() => {
    setCurrentTaxInfo(taxInfo);
  }, [taxInfo]);

  useEffect(() => {
    const enabledStrategies = strategies.filter(s => s.enabled);
    const prevEnabledStrategies = previousStrategiesRef.current.filter(s => s.enabled);
    
    const hasChanges = JSON.stringify(enabledStrategies) !== JSON.stringify(prevEnabledStrategies);
    
    if (hasChanges) {
      onStrategiesSelect(enabledStrategies);
      previousStrategiesRef.current = strategies;
    }
  }, [strategies, onStrategiesSelect]);

  const handleStrategySelect = useCallback((strategyId: string) => {
    setShowUpdateButton(true);
    setExpandedStrategies(prev =>
      prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
    
    setStrategies(prevStrategies => {
      const updatedStrategies = prevStrategies.map(strategy => {
        if (strategy.id === strategyId) {
          const enabled = !strategy.enabled;
          if (!enabled) return { ...strategy, enabled };

          const { federal, state } = calculateStrategyTaxSavings(currentTaxInfo, rates, strategy);
          const totalSavings = federal + state;

          return {
            ...strategy,
            enabled,
            estimatedSavings: totalSavings
          };
        }
        return strategy;
      });

      return updatedStrategies;
    });
  }, [currentTaxInfo, rates]);

  const handleStrategySavingsChange = useCallback((strategyId: string, details: any) => {
    setStrategies(prevStrategies => {
      const updatedStrategies = prevStrategies.map(s => {
        if (s.id === strategyId) {
          const updatedStrategy = { ...s, details };
          const { federal, state } = calculateStrategyTaxSavings(currentTaxInfo, rates, updatedStrategy);
          return {
            ...updatedStrategy,
            estimatedSavings: federal + state
          };
        }
        return s;
      });

      return updatedStrategies;
    });
  }, [currentTaxInfo, rates]);

  const handleStrategyAction = useCallback((strategyId: string, action: string) => {
    if (action === 'get_started') {
      switch (strategyId) {
        case 'family_management_company':
          setShowFmcModal(true);
          break;
        case 'augusta_rule':
          if (onStrategyAction) {
            onStrategyAction(strategyId, action);
          }
          break;
        default:
          break;
      }
    }
  }, [onStrategyAction]);

  const {
    totalIncome,
    shiftedIncome,
    deferredIncome,
    charitableDonationAmount,
    rawSavings,
    annualSavings,
    fiveYearValue,
    beforeRate,
    afterRate
  } = useMemo(() => {
    const totalIncome = currentTaxInfo.wagesIncome + 
                       currentTaxInfo.passiveIncome + 
                       currentTaxInfo.unearnedIncome +
                       (currentTaxInfo.businessOwner ? (currentTaxInfo.ordinaryK1Income || 0) + (currentTaxInfo.guaranteedK1Income || 0) : 0);

    const shiftedIncome = strategies
      .filter(s => s.enabled && s.category === 'income_shifted')
      .reduce((total, strategy) => {
        if (strategy.id === 'augusta_rule' && strategy.details?.augustaRule) {
          return total + (strategy.details.augustaRule.daysRented * strategy.details.augustaRule.dailyRate);
        }
        if (strategy.id === 'hire_children' && strategy.details?.hireChildren) {
          return total + strategy.details.hireChildren.children.reduce((sum, child) => sum + child.salary, 0);
        }
        if (strategy.id === 'family_management_company' && strategy.details?.familyManagementCompany) {
          return total + strategy.details.familyManagementCompany.totalSalaries;
        }
        return total;
      }, 0);

    const deferredIncome = strategies
      .filter(s => s.enabled && s.category === 'income_deferred')
      .reduce((total, s) => total + s.estimatedSavings, 0);

    // Get charitable donation details
    const charitableStrategy = strategies.find(s => s.enabled && s.id === 'charitable_donation');
    const charitableDonationAmount = charitableStrategy?.details?.charitableDonation?.donationAmount || 0;

    // Calculate total benefits from all strategies
    const totalBenefits = strategies
      .filter(s => s.enabled)
      .reduce((total, strategy) => {
        if (strategy.id === 'charitable_donation' && strategy.details?.charitableDonation) {
          // For charitable donations, use the net benefit
          return total + strategy.details.charitableDonation.totalBenefit;
        }
        if (strategy.details?.augustaRule) {
          return total + (strategy.details.augustaRule.totalBenefit || 0);
        }
        if (strategy.details?.familyManagementCompany) {
          return total + (strategy.details.familyManagementCompany.totalBenefit || 0);
        }
        if (strategy.details?.hireChildren) {
          return total + (strategy.details.hireChildren.totalBenefit || 0);
        }
        if (strategy.details?.costSegregation) {
          return total + (strategy.details.costSegregation.totalBenefit || 0);
        }
        return total + (strategy.estimatedSavings || 0);
      }, 0);

    // Calculate raw savings (total tax reduction)
    const rawSavings = baseBreakdown.total - strategyBreakdown.total;

    // Use total benefits as annual savings (this is the net benefit)
    const annualSavings = totalBenefits;

    // Calculate 5-year value with 8% growth
    const fiveYearValue = annualSavings * 5 * 1.08;

    const beforeRate = ((baseBreakdown.total / totalIncome) * 100).toFixed(1);
    const afterRate = ((strategyBreakdown.total / (totalIncome - shiftedIncome - deferredIncome)) * 100).toFixed(1);

    return {
      totalIncome,
      shiftedIncome,
      deferredIncome,
      charitableDonationAmount,
      rawSavings,
      annualSavings,
      fiveYearValue,
      beforeRate,
      afterRate
    };
  }, [currentTaxInfo, strategies, baseBreakdown, strategyBreakdown]);

  const beforeChartData = {
    labels: ['Federal Tax', 'State Tax', 'Social Security', 'Medicare', 'Self-Employment Tax', 'Take Home'],
    datasets: [{
      data: [
        baseBreakdown.federal,
        baseBreakdown.state,
        baseBreakdown.socialSecurity,
        baseBreakdown.medicare,
        baseBreakdown.selfEmployment,
        totalIncome - baseBreakdown.total
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',   // Federal - Blue
        'rgba(255, 99, 132, 0.8)',   // State - Red
        'rgba(255, 206, 86, 0.8)',   // Social Security - Yellow
        'rgba(153, 102, 255, 0.8)',  // Medicare - Purple
        'rgba(255, 159, 64, 0.8)',   // Self-Employment - Orange
        'rgba(75, 192, 192, 0.8)'    // Take Home - Teal
      ],
      borderWidth: 0
    }]
  };

  const afterChartData = {
    labels: ['Federal Tax', 'State Tax', 'Social Security', 'Medicare', 'Self-Employment Tax', 'Income Shifted', 'Income Deferred', 'Take Home'],
    datasets: [{
      data: [
        strategyBreakdown.federal,
        strategyBreakdown.state,
        strategyBreakdown.socialSecurity,
        strategyBreakdown.medicare,
        strategyBreakdown.selfEmployment,
        shiftedIncome,
        deferredIncome,
        totalIncome - strategyBreakdown.total - shiftedIncome - deferredIncome
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',   // Federal - Blue
        'rgba(255, 99, 132, 0.8)',   // State - Red
        'rgba(255, 206, 86, 0.8)',   // Social Security - Yellow
        'rgba(153, 102, 255, 0.8)',  // Medicare - Purple
        'rgba(255, 159, 64, 0.8)',   // Self-Employment - Orange
        'rgba(220, 53, 69, 0.8)',    // Income Shifted - Dark Red
        'rgba(40, 167, 69, 0.8)',    // Income Deferred - Green
        'rgba(75, 192, 192, 0.8)'    // Take Home - Teal
      ],
      borderWidth: 0
    }]
  };

  const incomeDistributionData = {
    labels: ['W-2 Income', 'Passive Income', 'Unearned Income', 'Ordinary K-1', 'Guaranteed K-1'],
    datasets: [{
      data: [
        currentTaxInfo.wagesIncome,
        currentTaxInfo.passiveIncome,
        currentTaxInfo.unearnedIncome,
        currentTaxInfo.ordinaryK1Income || 0,
        currentTaxInfo.guaranteedK1Income || 0
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',   // W-2 - Blue
        'rgba(255, 99, 132, 0.8)',   // Passive - Red
        'rgba(255, 206, 86, 0.8)',   // Unearned - Yellow
        'rgba(153, 102, 255, 0.8)',  // Ordinary K-1 - Purple
        'rgba(255, 159, 64, 0.8)'    // Guaranteed K-1 - Orange
      ],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            family: 'Inter, system-ui, sans-serif',
            weight: 'normal' as const
          },
          color: '#4B5563'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            return ` ${context.label}: $${value.toLocaleString()}`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold' as const,
          size: 11
        },
        formatter: (value: number) => {
          if (value < 1000) return '';
          return `$${(value / 1000).toFixed(0)}K`;
        }
      }
    }
  };

  const saveCalculation = useCallback(() => {
    const calculation: SavedCalculation = {
      id: Date.now().toString(),
      user_id: currentTaxInfo.user_id,
      year: selectedYear,
      date: new Date().toISOString(),
      tax_info: currentTaxInfo,
      breakdown: strategyBreakdown,
      strategies: strategies.filter(s => s.enabled)
    };
    onSaveCalculation(calculation);
    setShowUpdateButton(false);
  }, [currentTaxInfo, selectedYear, strategyBreakdown, strategies, onSaveCalculation]);

  const handleUpdateInfo = useCallback((updatedInfo: TaxInfo) => {
    setCurrentTaxInfo(updatedInfo);
    const newStrategies = getTaxStrategies(updatedInfo, calculateTaxBreakdown(updatedInfo, rates));
    setStrategies(newStrategies);
    setShowUpdateDialog(false);
    setShowUpdateButton(true);
  }, [rates]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-[#1a1a3f] to-[#2d2d67] rounded-xl shadow-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">{currentTaxInfo.fullName}</h2>
          <span className="text-gray-300">|</span>
          <span className="text-gray-300">{currentTaxInfo.state}</span>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="rounded-md border-none bg-white/10 text-white shadow-sm focus:ring-2 focus:ring-blue-400"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          <button
            onClick={() => setShowUpdateDialog(true)}
            className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            Update Info
          </button>
          <button
            onClick={saveCalculation}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors
              ${showUpdateButton 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'} shadow-lg`}
          >
            <Save size={16} />
            <span>{showUpdateButton ? 'Save Updates' : 'Save'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-transform hover:scale-[1.02] duration-300">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-white">Before Strategies</h3>
              <button
                onClick={() => setShowBeforeTable(!showBeforeTable)}
                className="text-white/80 hover:text-white"
              >
                {showBeforeTable ? <BarChart2 size={20} /> : <TableIcon size={20} />}
              </button>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-b from-white to-gray-50">
            {showBeforeTable ? (
              <TaxBreakdownTable
                breakdown={baseBreakdown}
                totalIncome={totalIncome}
                label="Before Strategies"
              />
            ) : (
              <>
                <div className="h-64 mb-4">
                  <Doughnut data={beforeChartData} options={chartOptions} />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${baseBreakdown.total.toLocaleString()}
                    <span className="text-red-600 ml-1">({beforeRate}%)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">TOTAL TAX</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-transform hover:scale-[1.02] duration-300">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-white">After Strategies</h3>
              <button
                onClick={() => setShowAfterTable(!showAfterTable)}
                className="text-white/80 hover:text-white"
              >
                {showAfterTable ? <BarChart2 size={20} /> : <TableIcon size={20} />}
              </button>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-b from-white to-gray-50">
            {showAfterTable ? (
              <TaxBreakdownTable
                breakdown={strategyBreakdown}
                totalIncome={totalIncome}
                label="After Strategies"
              />
            ) : (
              <>
                <div className="h-64 mb-4">
                  <Doughnut data={afterChartData} options={chartOptions} />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${strategyBreakdown.total.toLocaleString()}
                    <span className="text-emerald-600 ml-1">({afterRate}%)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">TOTAL TAX</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-transform hover:scale-[1.02] duration-300">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">Income Distribution</h3>
          </div>
          <div className="p-6 bg-gradient-to-b from-white to-gray-50">
            <div className="h-64 mb-4">
              <Doughnut data={incomeDistributionData} options={chartOptions} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${totalIncome.toLocaleString()}</div>
              <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">TOTAL INCOME</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
          <h3 className="text-xl font-semibold text-white">Tax Savings Value</h3>
        </div>
        <div className="p-6 bg-gradient-to-b from-white to-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl relative group shadow-lg hover:shadow-xl transition-shadow">
              <span className="block text-4xl font-bold text-emerald-600 mb-2">
                ${Math.max(0, annualSavings).toLocaleString()}
              </span>
              <span className="text-gray-600 font-medium tracking-wider">Annual Savings</span>
              {charitableDonationAmount > 0 && (
                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-sm rounded-lg p-3 -mt-2 z-10 shadow-xl">
                  Net benefit after subtracting ${charitableDonationAmount.toLocaleString()} donation
                </div>
              )}
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <span className="block text-4xl font-bold text-emerald-700 mb-2">
                ${Math.max(0, fiveYearValue).toLocaleString()}
              </span>
              <span className="text-gray-600 font-medium tracking-wider">5 Year Value at 8%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
          <h3 className="text-xl font-semibold text-white">Tax Bracket Analysis</h3>
        </div>
        <div className="p-6 bg-gradient-to-b from-white to-gray-50">
          <TaxBracketBreakdown
            taxInfo={currentTaxInfo}
            rates={rates}
            strategies={strategies}
            isExpanded={showBracketBreakdown}
            onToggle={() => setShowBracketBreakdown(!showBracketBreakdown)}
          />
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900">Available Tax Benefits</h3>
        <StrategyCards
          strategies={strategies}
          onStrategyChange={handleStrategySelect}
          onStrategyAction={handleStrategyAction}
          onSavingsChange={handleStrategySavingsChange}
          taxInfo={taxInfo}
          rates={rates}
        />
      </div>

      <UpdateDialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        taxInfo={currentTaxInfo}
        onUpdate={handleUpdateInfo}
      />

      <FmcModal
        isOpen={showFmcModal}
        onClose={() => setShowFmcModal(false)}
      />

      <div>
        <KPIContainer>
          <KPICard>
            <KPILabel>Net Tax Savings</KPILabel>
            <KPIValue>${(rawSavings - charitableDonationAmount).toLocaleString()}</KPIValue>
            <KPISubtext>Net annual savings after charitable contributions</KPISubtext>
          </KPICard>
          <KPICard>
            <KPILabel>5 Year Value</KPILabel>
            <KPIValue>${Math.max(0, (rawSavings - charitableDonationAmount) * 5 * 1.08).toLocaleString()}</KPIValue>
            <KPISubtext>Projected net savings over 5 years at 8% growth</KPISubtext>
          </KPICard>
          <KPICard>
            <KPILabel>Total Income</KPILabel>
            <KPIValue>${totalIncome.toLocaleString()}</KPIValue>
            <KPISubtext>Combined income from all sources</KPISubtext>
          </KPICard>
        </KPIContainer>
      </div>

      <MissionContainer>
        <MissionTitle>Join the Philanthropic Tax Benefit Movement</MissionTitle>
        <MissionText>
          Strategically leverage medical and biotechnology donations to achieve exceptional social impact and substantial tax savings. Our expert team coordinates every detail, working directly with:
        </MissionText>
        <MissionList>
          <MissionItem>Philanthropic donation specialists to identify high-impact opportunities.</MissionItem>
          <MissionItem>Vetted 501(c)(3) charities to ensure compliance and maximize benefits.</MissionItem>
          <MissionItem>Legal and accounting experts to safeguard and optimize your clients' returns.</MissionItem>
        </MissionList>
        <MissionText>
          Doing good and benefiting financially aren't mutually exclusive—they amplify each other.
        </MissionText>
        
        <MissionSection>
          <h3>At BattleBorn Advisory, we're:</h3>
          <MissionList>
            <MissionItem>A dedicated team of tax attorneys, technologists, and investment architects.</MissionItem>
            <MissionItem>Committed to delivering proven, IRS-compliant tax strategies.</MissionItem>
            <MissionItem>Focused on converting tax savings into meaningful, long-term investments and legacies.</MissionItem>
          </MissionList>
        </MissionSection>
        
        <MissionText style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', textAlign: 'center' }}>
          Do good. Get good. Together.
        </MissionText>
      </MissionContainer>
    </div>
  );
}