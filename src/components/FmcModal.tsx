import React, { useState, useEffect, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Check } from 'lucide-react';
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
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white rounded-xl shadow-xl z-[999] focus:outline-none">
          <div className="sticky top-0 bg-[#f8f6f1] px-6 py-4 flex justify-between items-center border-b">
            <Dialog.Title className="text-xl font-bold">
              Family Management Company
            </Dialog.Title>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#12ab61] text-white rounded-lg hover:bg-[#0f9654] inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Strategy</span>
              </button>
              <Dialog.Close asChild>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={onClose}
                >
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="p-6">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <p className="text-gray-600">
                  Create a family management company to handle business operations and maximize tax benefits through strategic income shifting. 
                  This strategy works especially well in conjunction with the Augusta Rule to manage rental activities and other business operations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-8 items-start">
                <div>
                  <h3 className="text-[#12ab61] font-bold text-lg mb-6">
                    How We Help You Implement This Strategy
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900">Complete Setup Package</h4>
                        <p className="text-base text-gray-600">
                          We handle all the paperwork and setup:
                        </p>
                        <ul className="mt-2 space-y-1 text-base text-gray-600">
                          <li>• Company Formation Documents</li>
                          <li>• Operating Agreement</li>
                          <li>• EIN Registration</li>
                          <li>• Bank Account Setup</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900">Compliance Package</h4>
                        <p className="text-base text-gray-600">
                          Stay compliant with all regulations:
                        </p>
                        <ul className="mt-2 space-y-1 text-base text-gray-600">
                          <li>• Employment Agreements</li>
                          <li>• Payroll Setup</li>
                          <li>• Tax Registration</li>
                          <li>• Record Keeping Templates</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900">Ongoing Support</h4>
                        <p className="text-base text-gray-600">
                          We provide continuous assistance:
                        </p>
                        <ul className="mt-2 space-y-1 text-base text-gray-600">
                          <li>• Annual Compliance Review</li>
                          <li>• Tax Planning Updates</li>
                          <li>• Strategy Optimization</li>
                          <li>• Audit Defense Package</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {members.map((member: FamilyMember, index: number) => (
                    <div key={member.id} className="bg-gray-50 p-4 rounded space-y-4">
                      <p className="text-sm font-medium text-gray-900">Family Member {index + 1}</p>
                      
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Age Group</p>
                        <select
                          value={member.ageGroup}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const newMembers = [...members];
                            newMembers[index] = { ...member, ageGroup: e.target.value as 'Under 18' | 'Over 18' };
                            setMembers(newMembers);
                          }}
                          className="text-lg font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
                        >
                          <option value="Under 18">Under 18</option>
                          <option value="Over 18">Over 18</option>
                        </select>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Annual Salary</p>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-gray-900">$</span>
                          <NumericFormat
                            value={member.salary}
                            onValueChange={(values: any) => {
                              const newMembers = [...members];
                              newMembers[index] = { ...member, salary: values.floatValue || 0 };
                              setMembers(newMembers);
                            }}
                            thousandSeparator={true}
                            className="text-2xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Tax Rate</p>
                          <div className="text-xl font-bold text-gray-900">
                            {calculateTaxRate(member).toFixed(1)}%
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Taxes Due</p>
                          <div className="text-xl font-bold text-gray-900">
                            ${calculateTaxesDue(member).toLocaleString()}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Payroll Taxes</p>
                          <div className="text-xl font-bold text-gray-900">
                            ${calculatePayrollTaxes(member).toLocaleString()}
                          </div>
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
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Add Family Member</span>
                  </button>

                  <div className="space-y-2 border-t border-gray-200 pt-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">TOTAL SALARIES</p>
                      <p className="text-2xl font-bold text-gray-900">${totalSalaries.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">STATE BENEFIT</p>
                      <p className="text-2xl font-bold text-emerald-600">${stateBenefit.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">FEDERAL BENEFIT</p>
                      <p className="text-2xl font-bold text-emerald-600">${federalBenefit.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">FICA BENEFIT</p>
                      <p className="text-2xl font-bold text-emerald-600">${ficaBenefit.toLocaleString()}</p>
                    </div>

                    <div className="border-t border-gray-200 pt-2">
                      <p className="text-xs font-medium text-gray-500 uppercase">TOTAL BENEFIT</p>
                      <p className="text-4xl font-bold text-emerald-600">${totalBenefit.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}