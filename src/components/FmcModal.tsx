import React, { useState, useEffect, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Check, Info } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { TaxInfo, TaxStrategy } from '../types';
import { calculateTaxBreakdown, calculateMarginalRate, calculateEffectiveStrategyBenefit } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';
import { taxRates } from '../data/taxRates';

interface StrategyMember {
  id: string;
  name: string;
  role: string;
  salary: number;
  ageGroup?: 'Under 18' | 'Over 18';
  filingStatus?: 'single' | 'married_joint';
}

interface FamilyMember {
  id: string;
  ageGroup: 'Under 18' | 'Over 18';
  filingStatus: 'single' | 'married_joint';
  salary: number;
  name?: string;
  role?: string;
}

interface FmcModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FmcModal({ isOpen, onClose }: FmcModalProps) {
  const { taxInfo, selectedYear, updateStrategy } = useTaxStore();
  const rates = useMemo(() => taxRates[selectedYear], [selectedYear]);

  // Get existing FMC strategy if it exists
  const existingFmcStrategy = useMemo(() => 
    useTaxStore.getState().selectedStrategies.find((s: TaxStrategy) => s.id === 'family_management_company'),
    []
  );

  const [members, setMembers] = useState<FamilyMember[]>(() => {
    if (existingFmcStrategy?.details?.familyManagementCompany?.members) {
      return existingFmcStrategy.details.familyManagementCompany.members.map((member: StrategyMember) => ({
        id: member.id,
        ageGroup: member.ageGroup || 'Under 18',
        filingStatus: member.filingStatus || 'single',
        salary: member.salary,
        name: member.name,
        role: member.role
      }));
    }
    const dependents = taxInfo?.dependents || 1;
    const standardDeduction = selectedYear === 2024 ? 14600 : 15000;
    return Array.from({ length: dependents }, (_, index) => ({
      id: (index + 1).toString(),
      ageGroup: 'Under 18',
      filingStatus: 'single',
      salary: standardDeduction
    }));
  });

  const totalSalaries = useMemo(() => 
    members.reduce((sum: number, member: FamilyMember) => sum + member.salary, 0),
    [members]
  );

  const calculateTaxRate = (member: FamilyMember) => {
    if (!rates?.federal?.brackets) return 0;
    const standardDeduction = member.filingStatus === 'single' ? 15000 : 30000;
    const taxableIncome = Math.max(0, member.salary - standardDeduction);
    return calculateMarginalRate(taxableIncome, rates.federal.brackets, member.filingStatus) * 100;
  };

  const calculateTaxesDue = (member: FamilyMember) => {
    if (!rates?.federal?.brackets) return 0;
    const standardDeduction = member.filingStatus === 'single' ? 15000 : 30000;
    const taxableIncome = Math.max(0, member.salary - standardDeduction);
    
    let tax = 0;
    let remainingIncome = taxableIncome;
    
    for (const bracket of rates.federal.brackets) {
      const min = bracket[member.filingStatus];
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, min);
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }
    
    return Math.round(tax);
  };

  const calculatePayrollTaxes = (member: FamilyMember) => {
    if (member.ageGroup === 'Under 18') return 0;
    return Math.round(member.salary * (rates?.fica?.socialSecurity?.rate || 0.062));
  };

  const { stateBenefit, federalBenefit, ficaBenefit, totalBenefit } = useMemo(() => {
    if (!taxInfo || !rates || totalSalaries <= 0) {
      return { stateBenefit: 0, federalBenefit: 0, ficaBenefit: 0, totalBenefit: 0 };
    }

    // Create FMC strategy for effective calculation
    const fmcStrategy: TaxStrategy = {
      id: 'family_management_company',
      name: 'Family Management Company',
      category: 'income_shifted',
      description: 'Create a family management company to handle Augusta Rule rentals and maximize tax benefits through strategic income shifting',
      estimatedSavings: 0,
      enabled: true,
      details: {
        familyManagementCompany: {
          members: members.map(m => ({
            id: m.id,
            name: m.name || `Family Member ${m.id}`,
            role: m.role || (m.ageGroup === 'Under 18' ? 'Junior Associate' : 'Associate'),
            salary: m.salary
          })),
          totalSalaries,
          stateBenefit: 0,
          federalBenefit: 0,
          ficaBenefit: 0,
          totalBenefit: 0
        }
      }
    };

    // Use unified effective strategy benefit calculation
    const { federal, state, fica, total } = calculateEffectiveStrategyBenefit(taxInfo, rates, fmcStrategy, []);

    return {
      federalBenefit: federal,
      stateBenefit: state,
      ficaBenefit: fica,
      totalBenefit: total
    };
  }, [taxInfo, rates, totalSalaries, members]);

  const handleSave = async () => {
    try {
      // Validate that we have meaningful data
      if (totalSalaries <= 0) {
        alert('Please add family members with salaries before saving.');
        return;
      }

      // Check if strategy already exists
      const { selectedStrategies } = useTaxStore.getState();
      const existingFmc = selectedStrategies.find((s: TaxStrategy) => s.id === 'family_management_company');
      
      if (existingFmc && existingFmc.enabled) {
        const confirmReplace = window.confirm(
          'Family Management Company strategy is already active. Do you want to replace it with the new configuration?'
        );
        if (!confirmReplace) {
          return;
        }
        // Remove existing strategy first
        await useTaxStore.getState().removeStrategy('family_management_company');
      }

      // Create the FMC strategy
      const fmcStrategy: TaxStrategy = {
        id: 'family_management_company',
        name: 'Family Management Company',
        category: 'income_shifted',
        description: 'Create a family management company to handle Augusta Rule rentals and maximize tax benefits through strategic income shifting',
        estimatedSavings: totalBenefit,
        enabled: true,
        details: {
          familyManagementCompany: {
            members: members.map((m: FamilyMember) => ({
              id: m.id,
              name: m.name || `Family Member ${m.id}`,
              role: m.role || (m.ageGroup === 'Under 18' ? 'Junior Associate' : 'Associate'),
              salary: m.salary
            })),
            totalSalaries,
            stateBenefit,
            federalBenefit,
            ficaBenefit,
            totalBenefit
          }
        },
        synergy: {
          with: 'augusta_rule',
          label: 'Synergy with Augusta Rule'
        }
      };

      // Update the strategy in the store
      await updateStrategy('family_management_company', fmcStrategy);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error saving Family Management Company strategy:', error);
      alert('Error saving strategy. Please try again.');
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl z-[999] focus:outline-none">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center border-b border-blue-500">
            <Dialog.Title className="text-xl font-bold text-white flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>Family Management Company</span>
            </Dialog.Title>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 inline-flex items-center space-x-2 font-medium"
              >
                <Check className="w-4 h-4" />
                <span>Enable Strategy</span>
              </button>
              <Dialog.Close asChild>
                <button 
                  className="text-white/80 hover:text-white transition-colors duration-200"
                  onClick={onClose}
                >
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="p-6">
            {/* Information Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">How Family Management Company Works</h3>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    Create a family management company to handle business operations and maximize tax benefits through strategic income shifting. 
                    This strategy works especially well in conjunction with the Augusta Rule to manage rental activities and other business operations.
                    Children under 18 are exempt from FICA taxes, providing significant payroll tax savings.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Inputs */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Member Configuration</h3>
                  
                  <div className="space-y-4">
                    {members.map((member: FamilyMember, index: number) => (
                      <div key={member.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Family Member {index + 1}</h4>
                          {members.length > 1 && (
                            <button
                              onClick={() => setMembers(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Age Group
                            </label>
                            <select
                              value={member.ageGroup}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newMembers = [...members];
                                newMembers[index] = { ...member, ageGroup: e.target.value as 'Under 18' | 'Over 18' };
                                setMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Under 18">Under 18 (No FICA)</option>
                              <option value="Over 18">Over 18</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Filing Status
                            </label>
                            <select
                              value={member.filingStatus}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newMembers = [...members];
                                newMembers[index] = { ...member, filingStatus: e.target.value as 'single' | 'married_joint' };
                                setMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="single">Single</option>
                              <option value="married_joint">Married Filing Jointly</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Annual Salary
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <NumericFormat
                              value={member.salary}
                              onValueChange={(values: any) => {
                                const newMembers = [...members];
                                newMembers[index] = { ...member, salary: values.floatValue || 0 };
                                setMembers(newMembers);
                              }}
                              thousandSeparator={true}
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-500 uppercase">Tax Rate</p>
                            <p className="text-lg font-bold text-gray-900">
                              {calculateTaxRate(member).toFixed(1)}%
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-500 uppercase">Taxes Due</p>
                            <p className="text-lg font-bold text-gray-900">
                              ${calculateTaxesDue(member).toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-500 uppercase">Payroll Tax</p>
                            <p className="text-lg font-bold text-gray-900">
                              ${calculatePayrollTaxes(member).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setMembers((prev: FamilyMember[]) => [...prev, {
                        id: (prev.length + 1).toString(),
                        ageGroup: 'Under 18',
                        filingStatus: 'single',
                        salary: selectedYear === 2024 ? 14600 : 15000
                      }])}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center space-x-2 transition-colors duration-200"
                    >
                      <Plus size={20} />
                      <span>Add Family Member</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Implementation Services</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-gray-900">Complete Setup Package</h5>
                        <p className="text-sm text-gray-600">Company formation, operating agreement, EIN registration, and bank account setup</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-gray-900">Compliance Package</h5>
                        <p className="text-sm text-gray-600">Employment agreements, payroll setup, tax registration, and record keeping</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-gray-900">Ongoing Support</h5>
                        <p className="text-sm text-gray-600">Annual compliance review, tax planning updates, and audit defense</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Results */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Benefit Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Total Salaries</span>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="text-2xl font-bold text-blue-900">
                          ${totalSalaries.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">State Tax Benefit</span>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <span className="text-2xl font-bold text-green-900">
                          ${stateBenefit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Federal Tax Benefit</span>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <span className="text-2xl font-bold text-green-900">
                          ${federalBenefit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">FICA Tax Benefit</span>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <span className="text-2xl font-bold text-green-900">
                          ${ficaBenefit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-emerald-100">Total Annual Benefit</span>
                      </div>
                      <div className="bg-white/10 p-3 rounded-lg">
                        <span className="text-3xl font-bold text-white">
                          ${totalBenefit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Key Benefits</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Children under 18 are exempt from FICA taxes (15.3% savings)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Income shifting to lower tax brackets</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Synergy with Augusta Rule for rental income management</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Legitimate business structure with proper documentation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}