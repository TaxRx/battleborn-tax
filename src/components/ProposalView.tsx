import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  User, 
  Building, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calculator,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Shield,
  Briefcase,
  Home,
  Car,
  Gift
} from 'lucide-react';
import { TaxInfo } from '../lib/core/types/tax';
import { TaxStrategy } from '../types';

interface ProposalViewProps {
  proposal: {
    id: string;
    taxInfo: TaxInfo;
    strategies: TaxStrategy[];
    year: number;
    date: string;
    totalSavings?: number;
    annualSavings?: number;
    fiveYearValue?: number;
  };
  onBack: () => void;
  onEdit?: () => void;
  onSave?: () => void;
}

export default function ProposalView({ proposal, onBack, onEdit, onSave }: ProposalViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'calculations' | 'documents'>('overview');

  const enabledStrategies = proposal.strategies.filter(s => s.enabled);
  const totalIncome = proposal.taxInfo.wagesIncome + 
                     proposal.taxInfo.passiveIncome + 
                     proposal.taxInfo.unearnedIncome +
                     (proposal.taxInfo.businessOwner ? (proposal.taxInfo.ordinaryK1Income || 0) + (proposal.taxInfo.guaranteedK1Income || 0) : 0);

  const getStrategyIcon = (strategyId: string) => {
    switch (strategyId) {
      case 'augusta_rule': return <Home className="h-5 w-5" />;
      case 'family_management_company': return <Building className="h-5 w-5" />;
      case 'hire_children': return <User className="h-5 w-5" />;
      case 'charitable_donation': return <Gift className="h-5 w-5" />;
      case 'cost_segregation': return <Building className="h-5 w-5" />;
      case 'convertible_tax_bonds': return <Shield className="h-5 w-5" />;
      case 'reinsurance': return <Zap className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getStrategyColor = (strategyId: string) => {
    switch (strategyId) {
      case 'augusta_rule': return 'bg-blue-500';
      case 'family_management_company': return 'bg-purple-500';
      case 'hire_children': return 'bg-green-500';
      case 'charitable_donation': return 'bg-red-500';
      case 'cost_segregation': return 'bg-orange-500';
      case 'convertible_tax_bonds': return 'bg-indigo-500';
      case 'reinsurance': return 'bg-teal-500';
      default: return 'bg-gray-500';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tax Proposal #{proposal.id.slice(-6).toUpperCase()}
                </h1>
                <p className="text-sm text-gray-500">
                  Created on {formatDate(proposal.date)} • Tax Year {proposal.year}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Calculator className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              )}
              {onSave && (
                <button
                  onClick={onSave}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Save</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'strategies', label: 'Strategies', icon: Target },
              { id: 'calculations', label: 'Calculations', icon: Calculator },
              { id: 'documents', label: 'Documents', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Annual Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(proposal.annualSavings || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">5-Year Value</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(proposal.fiveYearValue || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Strategies</p>
                    <p className="text-2xl font-bold text-orange-600">{enabledStrategies.length}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-lg font-semibold text-gray-900">{proposal.taxInfo.fullName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Filing Status</p>
                    <p className="text-lg font-semibold text-gray-900">{proposal.taxInfo.filingStatus || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">State</p>
                    <p className="text-lg font-semibold text-gray-900">{proposal.taxInfo.state || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Owner</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {proposal.taxInfo.businessOwner ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dependents</p>
                    <p className="text-lg font-semibold text-gray-900">{proposal.taxInfo.dependents || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tax Year</p>
                    <p className="text-lg font-semibold text-gray-900">{proposal.year}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Income Breakdown</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Wages</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(proposal.taxInfo.wagesIncome || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Passive Income</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(proposal.taxInfo.passiveIncome || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Unearned Income</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(proposal.taxInfo.unearnedIncome || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Capital Gains</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(proposal.taxInfo.capitalGains || 0)}</p>
                    </div>
                  </div>
                  
                  {proposal.taxInfo.businessOwner && (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Building className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Ordinary K1</p>
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(proposal.taxInfo.ordinaryK1Income || 0)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Shield className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Guaranteed K1</p>
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(proposal.taxInfo.guaranteedK1Income || 0)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Tax Strategies</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Active:</span>
                <span className="text-sm font-medium text-green-600">{enabledStrategies.length}</span>
                <span className="text-sm text-gray-500">of {proposal.strategies.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {proposal.strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
                    strategy.enabled
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getStrategyColor(strategy.id)}`}>
                          {getStrategyIcon(strategy.id)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{strategy.name}</h3>
                          <p className="text-sm text-gray-500">{strategy.category.replace('_', ' ').toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {strategy.enabled ? (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-medium text-green-600">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-500">Inactive</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{strategy.description}</p>

                    {strategy.enabled && strategy.details && (
                      <div className="space-y-3">
                        {Object.entries(strategy.details).map(([key, value]) => {
                          if (typeof value === 'object' && value !== null) {
                            return (
                              <div key={key} className="bg-white rounded-lg border border-gray-200 p-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                                <div className="space-y-1">
                                  {Object.entries(value).map(([subKey, subValue]) => (
                                    <div key={subKey} className="flex justify-between text-sm">
                                      <span className="text-gray-500 capitalize">
                                        {subKey.replace(/([A-Z])/g, ' $1').trim()}:
                                      </span>
                                      <span className="font-medium text-gray-900">
                                        {typeof subValue === 'number' ? formatCurrency(subValue) : String(subValue)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}

                    {strategy.enabled && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Estimated Savings</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(strategy.estimatedSavings || 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calculations' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tax Calculations</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Savings Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Annual Savings</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(proposal.annualSavings || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">5-Year Value</span>
                    <span className="text-xl font-bold text-purple-600">
                      {formatCurrency(proposal.fiveYearValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Savings</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(proposal.totalSavings || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Breakdown</h3>
                <div className="space-y-3">
                  {enabledStrategies.map((strategy) => (
                    <div key={strategy.id} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStrategyColor(strategy.id)}`}></div>
                        <span className="text-sm text-gray-700">{strategy.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(strategy.estimatedSavings || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Documents & Notes</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
                <p className="text-gray-500">
                  Documents and notes will appear here once they are added to the proposal.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 