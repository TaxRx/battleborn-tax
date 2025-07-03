import React, { useState, useEffect } from 'react';
import { TaxInfo } from '../../../lib/core/types/tax';
import { TaxStrategy } from '../../../types';
import { TaxCalculationSummary } from '../types/proposal';
import { proposalService } from '../services/proposalService';
import { 
  Calculator, 
  FileText, 
  User, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ProposalCreatorProps {
  taxInfo: TaxInfo;
  strategies: TaxStrategy[];
  year: number;
  onProposalCreated?: (proposalId: string) => void;
  onCancel?: () => void;
}

const ProposalCreator: React.FC<ProposalCreatorProps> = ({
  taxInfo,
  strategies,
  year,
  onProposalCreated,
  onCancel
}) => {
  const [clientName, setClientName] = useState(taxInfo.fullName || '');
  const [clientEmail, setClientEmail] = useState(taxInfo.email || '');
  const [affiliateId, setAffiliateId] = useState('');
  const [affiliateName, setAffiliateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate summary data from calculator inputs
  const calculateSummary = (): TaxCalculationSummary => {
    const totalIncome = taxInfo.householdIncome || 
                       taxInfo.wagesIncome + 
                       taxInfo.passiveIncome + 
                       taxInfo.unearnedIncome +
                       (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0);

    // Mock calculations - in real app these would come from actual tax calculations
    const beforeTaxes = {
      federal: totalIncome * 0.24, // Estimate
      state: totalIncome * 0.05, // Estimate
      socialSecurity: totalIncome * 0.062, // 6.2% up to limit
      medicare: totalIncome * 0.0145, // 1.45%
      selfEmployment: 0, // Would be calculated if applicable
      total: totalIncome * 0.24 + totalIncome * 0.05 + totalIncome * 0.062 + totalIncome * 0.0145,
      effectiveRate: 36.65 // Combined rate
    };

    const enabledStrategies = strategies.filter(s => s.enabled);
    const totalSavings = enabledStrategies.reduce((sum, s) => sum + (s.estimatedSavings || 0), 0);

    const afterTaxes = {
      federal: beforeTaxes.federal - totalSavings * 0.7, // Assume 70% of savings is federal
      state: beforeTaxes.state - totalSavings * 0.2, // Assume 20% of savings is state
      socialSecurity: beforeTaxes.socialSecurity,
      medicare: beforeTaxes.medicare,
      selfEmployment: beforeTaxes.selfEmployment,
      total: beforeTaxes.total - totalSavings,
      effectiveRate: ((beforeTaxes.total - totalSavings) / totalIncome) * 100
    };

    const shiftedIncome = enabledStrategies
      .filter(s => s.category === 'income_shifted')
      .reduce((sum, s) => sum + (s.estimatedSavings || 0), 0);

    const deferredIncome = enabledStrategies
      .filter(s => s.category === 'income_deferred')
      .reduce((sum, s) => sum + (s.estimatedSavings || 0), 0);

    return {
      totalIncome,
      filingStatus: taxInfo.filingStatus,
      state: taxInfo.state,
      year,
      beforeTaxes,
      afterTaxes,
      strategies: strategies.map(s => ({
        id: s.id,
        name: s.name,
        enabled: s.enabled,
        estimatedSavings: s.estimatedSavings || 0,
        category: s.category,
        details: s.details
      })),
      savings: {
        rawSavings: totalSavings,
        annualSavings: totalSavings,
        fiveYearValue: totalSavings * 5 * 1.08, // 8% growth
        beforeRate: beforeTaxes.effectiveRate.toFixed(1),
        afterRate: afterTaxes.effectiveRate.toFixed(1),
        shiftedIncome,
        deferredIncome
      },
      incomeDistribution: {
        wagesIncome: taxInfo.wagesIncome,
        passiveIncome: taxInfo.passiveIncome,
        unearnedIncome: taxInfo.unearnedIncome,
        ordinaryK1Income: taxInfo.ordinaryK1Income || 0,
        guaranteedK1Income: taxInfo.guaranteedK1Income || 0
      }
    };
  };

  const handleCreateProposal = async () => {
    if (!clientName.trim() || !clientEmail.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const calculation = calculateSummary();
      
      const result = await proposalService.createProposal(
        'client-' + Date.now(), // Generate client ID
        clientName,
        clientEmail,
        calculation,
        affiliateId || undefined,
        affiliateName || undefined
      );

      if (result.success && result.data) {
        setSuccess(true);
        if (onProposalCreated) {
          onProposalCreated(result.data.id);
        }
      } else {
        setError(result.message || 'Failed to create proposal');
      }
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const summary = calculateSummary();

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Proposal Created Successfully!</h3>
          <p className="text-gray-600 mb-4">
            The tax proposal has been created and is ready for review.
          </p>
          <button
            onClick={onCancel}
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <FileText className="h-6 w-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Create Tax Proposal</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Client Information */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Client Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter client name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email *
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter client email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affiliate ID (Optional)
                </label>
                <input
                  type="text"
                  value={affiliateId}
                  onChange={(e) => setAffiliateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter affiliate ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affiliate Name (Optional)
                </label>
                <input
                  type="text"
                  value={affiliateName}
                  onChange={(e) => setAffiliateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter affiliate name"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-green-600" />
              Calculation Summary
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Before Strategies</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-700">Total Tax:</span>
                      <span className="font-medium text-red-900">{formatCurrency(summary.beforeTaxes.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-700">Effective Rate:</span>
                      <span className="font-medium text-red-900">{summary.beforeTaxes.effectiveRate}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-green-800 mb-2">After Strategies</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Total Tax:</span>
                      <span className="font-medium text-green-900">{formatCurrency(summary.afterTaxes.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Effective Rate:</span>
                      <span className="font-medium text-green-900">{summary.afterTaxes.effectiveRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Savings Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Annual Savings:</span>
                    <p className="font-bold text-blue-900">{formatCurrency(summary.savings.annualSavings)}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">5-Year Value:</span>
                    <p className="font-bold text-blue-900">{formatCurrency(summary.savings.fiveYearValue)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Strategies</h4>
                <div className="space-y-2">
                  {summary.strategies
                    .filter(s => s.enabled)
                    .map((strategy, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-900">{strategy.name}</span>
                        <span className="text-sm text-green-600 font-medium">
                          {formatCurrency(strategy.estimatedSavings)}
                        </span>
                      </div>
                    ))}
                  {summary.strategies.filter(s => s.enabled).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No strategies selected</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleCreateProposal}
          disabled={loading || !clientName.trim() || !clientEmail.trim()}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Create Proposal
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProposalCreator; 