import React from 'react';
import { Shield, AlertTriangle, Info, Calculator, TrendingUp, Clock, Building, DollarSign } from 'lucide-react';

export interface ValidationRule {
  type: 'max_credit' | 'carryforward_limit' | 'entity_type_restriction' | 'gross_receipts_threshold' | 'alternative_method' | 'credit_rate' | 'base_calculation' | 'other';
  value?: number | string;
  message: string;
}

interface StateValidationRulesProps {
  validationRules?: ValidationRule[];
  alternativeValidationRules?: ValidationRule[];
  hasAlternativeMethod?: boolean;
  creditRate?: number;
  creditType?: string;
  formReference?: string;
  notes?: string[];
}

const getRuleIcon = (type: string) => {
  switch (type) {
    case 'max_credit':
      return <Shield className="w-4 h-4 text-blue-600" />;
    case 'carryforward_limit':
      return <Clock className="w-4 h-4 text-green-600" />;
    case 'entity_type_restriction':
      return <Building className="w-4 h-4 text-purple-600" />;
    case 'gross_receipts_threshold':
      return <DollarSign className="w-4 h-4 text-orange-600" />;
    case 'alternative_method':
      return <Calculator className="w-4 h-4 text-indigo-600" />;
    case 'credit_rate':
      return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    default:
      return <Info className="w-4 h-4 text-gray-600" />;
  }
};

const getRuleTitle = (type: string) => {
  switch (type) {
    case 'max_credit':
      return 'Maximum Credit Limit';
    case 'carryforward_limit':
      return 'Carryforward Period';
    case 'entity_type_restriction':
      return 'Entity Restrictions';
    case 'gross_receipts_threshold':
      return 'Gross Receipts Threshold';
    case 'alternative_method':
      return 'Alternative Method';
    case 'credit_rate':
      return 'Credit Rate';
    case 'base_calculation':
      return 'Base Calculation';
    default:
      return 'Additional Requirements';
  }
};

const formatValue = (type: string, value?: number | string) => {
  if (value === undefined) return '';
  
  switch (type) {
    case 'max_credit':
      return typeof value === 'number' ? `${value}% of tax liability` : value;
    case 'carryforward_limit':
      return typeof value === 'number' ? `${value} years` : value;
    case 'gross_receipts_threshold':
      return typeof value === 'number' ? `$${value.toLocaleString()}` : value;
    case 'credit_rate':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value;
    default:
      return value;
  }
};

export const StateValidationRules: React.FC<StateValidationRulesProps> = ({
  validationRules = [],
  alternativeValidationRules = [],
  hasAlternativeMethod = false,
  creditRate,
  creditType,
  formReference,
  notes = []
}) => {
  const allRules = [...validationRules, ...alternativeValidationRules];
  
  if (allRules.length === 0 && notes.length === 0 && !hasAlternativeMethod) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center mb-4">
        <Shield className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">State Validation Rules & Requirements</h3>
      </div>
      
      {/* Credit Information */}
      {(creditRate || creditType || formReference) && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center mb-2">
            <Calculator className="w-4 h-4 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">Credit Information</span>
          </div>
          <div className="space-y-1 text-sm text-blue-800">
            {creditRate && (
              <div>• Credit Rate: {(creditRate * 100).toFixed(1)}%</div>
            )}
            {creditType && (
              <div>• Credit Type: {creditType === 'incremental' ? 'Incremental' : 'Total QRE'}</div>
            )}
            {formReference && (
              <div>• Form Reference: {formReference}</div>
            )}
          </div>
        </div>
      )}

      {/* Alternative Method Notice */}
      {hasAlternativeMethod && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-md border border-indigo-200">
          <div className="flex items-center mb-2">
            <Calculator className="w-4 h-4 text-indigo-600 mr-2" />
            <span className="font-medium text-indigo-900">Alternative Calculation Method Available</span>
          </div>
          <p className="text-sm text-indigo-800">
            This state offers an alternative calculation method that may provide a higher credit amount. 
            Consider comparing both methods to determine the optimal approach.
          </p>
        </div>
      )}

      {/* Validation Rules */}
      {allRules.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Validation Rules</h4>
          <div className="space-y-3">
            {allRules.map((rule, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-md border border-gray-200">
                {getRuleIcon(rule.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {getRuleTitle(rule.type)}
                    </span>
                    {rule.value && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {formatValue(rule.type, rule.value)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{rule.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State Notes */}
      {notes.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Important Notes</h4>
          <div className="space-y-2">
            {notes.map((note, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-md border border-gray-200">
                <Info className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 