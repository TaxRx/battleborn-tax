import React, { useState, useEffect } from 'react';
import { RadioGroup } from '@headlessui/react';
import { CheckCircle, Building, User } from 'lucide-react';

export interface StrategyApplication {
  strategyId: string;
  applicationType: 'personal' | 'business';
  businessId?: string; // Only set when applicationType is 'business'
}

interface StrategyApplicationSelectorProps {
  client: any; // Unified client data
  selectedApplications: StrategyApplication[];
  onApplicationsChange: (applications: StrategyApplication[]) => void;
  className?: string;
}

// Define the 6 specific strategies as requested
const AVAILABLE_STRATEGIES = [
  {
    id: 'charitable_donation',
    name: 'Charitable Donation',
    description: 'Maximize deductions through strategic charitable giving',
    alwaysAvailable: true
  },
  {
    id: 'family_management_company',
    name: 'FMC (Family Management Company)',
    description: 'Create a family management company for strategic income shifting',
    alwaysAvailable: true
  },
  {
    id: 'hire_children',
    name: 'Hire Your Kids',
    description: "Savings through your children's lower tax bracket",
    alwaysAvailable: true
  },
  {
    id: 'cost_segregation',
    name: 'Cost Segregation',
    description: 'Accelerate depreciation on business property',
    alwaysAvailable: true
  },
  {
    id: 'reinsurance', // This is the 831b strategy
    name: '831b Reinsurance',
    description: 'Microcaptive insurance arrangements reduce AGI and convert ordinary income to long-term capital gains',
    alwaysAvailable: false, // Only available if client is a business owner
    businessOwnerRequired: true
  },
  {
    id: 'convertible_tax_bonds',
    name: 'CTB (Convertible Tax Bonds)',
    description: 'Offset remaining tax burden through strategic CTB payments',
    alwaysAvailable: true
  }
];

export default function StrategyApplicationSelector({
  client,
  selectedApplications,
  onApplicationsChange,
  className = ''
}: StrategyApplicationSelectorProps) {
  const [applications, setApplications] = useState<StrategyApplication[]>(selectedApplications);

  // Check if client is a business owner
  const isBusinessOwner = client?.businesses && client.businesses.length > 0;

  // Get available strategies based on client status
  const availableStrategies = AVAILABLE_STRATEGIES.filter(strategy => {
    if (strategy.businessOwnerRequired && !isBusinessOwner) {
      return false;
    }
    return true;
  });

  // Get business options for the client
  const businessOptions = client?.businesses?.map((business: any) => ({
    id: business.business_id,
    name: business.business_name || `Business ${business.business_id}`
  })) || [];

  const handleApplicationChange = (strategyId: string, applicationType: 'personal' | 'business', businessId?: string) => {
    const newApplications = applications.filter(app => app.strategyId !== strategyId);
    
    if (applicationType === 'business' && businessId) {
      newApplications.push({
        strategyId,
        applicationType: 'business',
        businessId
      });
    } else {
      newApplications.push({
        strategyId,
        applicationType: 'personal'
      });
    }
    
    setApplications(newApplications);
    onApplicationsChange(newApplications);
  };

  const getCurrentApplication = (strategyId: string): StrategyApplication | null => {
    return applications.find(app => app.strategyId === strategyId) || null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Strategy Application
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Select whether each strategy should be applied to your personal taxes or to a specific business.
        </p>
      </div>

      <div className="space-y-4">
        {availableStrategies.map((strategy) => {
          const currentApplication = getCurrentApplication(strategy.id);
          
          return (
            <div key={strategy.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <h4 className="text-base font-medium text-gray-900">
                  {strategy.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {strategy.description}
                </p>
              </div>

              <RadioGroup
                value={currentApplication?.applicationType || 'personal'}
                onChange={(value) => handleApplicationChange(strategy.id, value as 'personal' | 'business')}
                className="space-y-3"
              >
                {/* Personal Option - Always Available */}
                <RadioGroup.Option
                  value="personal"
                  className={({ checked }) =>
                    `relative flex cursor-pointer rounded-lg px-4 py-3 border transition-all ${
                      checked
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`
                  }
                >
                  {({ checked }) => (
                    <>
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <RadioGroup.Label
                              as="p"
                              className={`font-medium ${
                                checked ? 'text-blue-900' : 'text-gray-900'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>Personal</span>
                              </div>
                            </RadioGroup.Label>
                            <RadioGroup.Description
                              as="span"
                              className={`inline ${
                                checked ? 'text-blue-700' : 'text-gray-500'
                              }`}
                            >
                              Apply to your individual tax return
                            </RadioGroup.Description>
                          </div>
                        </div>
                        {checked && (
                          <div className="shrink-0 text-blue-600">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </RadioGroup.Option>

                {/* Business Options - Only if client has businesses */}
                {isBusinessOwner && businessOptions.length > 0 && (
                  <>
                    {businessOptions.map((business) => (
                      <RadioGroup.Option
                        key={business.id}
                        value={`business-${business.id}`}
                        className={({ checked }) =>
                          `relative flex cursor-pointer rounded-lg px-4 py-3 border transition-all ${
                            checked
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`
                        }
                        onClick={() => handleApplicationChange(strategy.id, 'business', business.id)}
                      >
                        {({ checked }) => (
                          <>
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center">
                                <div className="text-sm">
                                  <RadioGroup.Label
                                    as="p"
                                    className={`font-medium ${
                                      checked ? 'text-blue-900' : 'text-gray-900'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Building className="h-4 w-4" />
                                      <span>{business.name}</span>
                                    </div>
                                  </RadioGroup.Label>
                                  <RadioGroup.Description
                                    as="span"
                                    className={`inline ${
                                      checked ? 'text-blue-700' : 'text-gray-500'
                                    }`}
                                  >
                                    Apply to this business's tax return
                                  </RadioGroup.Description>
                                </div>
                              </div>
                              {checked && (
                                <div className="shrink-0 text-blue-600">
                                  <CheckCircle className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </RadioGroup.Option>
                    ))}
                  </>
                )}
              </RadioGroup>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Applications</h4>
        <div className="space-y-1">
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">No strategies selected yet</p>
          ) : (
            applications.map((app) => {
              const strategy = availableStrategies.find(s => s.id === app.strategyId);
              const business = app.businessId ? businessOptions.find(b => b.id === app.businessId) : null;
              
              return (
                <div key={app.strategyId} className="text-sm text-gray-600">
                  <span className="font-medium">{strategy?.name}</span>
                  <span className="mx-1">→</span>
                  <span className="text-gray-500">
                    {app.applicationType === 'personal' ? 'Personal' : business?.name}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 