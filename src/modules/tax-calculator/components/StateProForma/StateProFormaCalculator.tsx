import React, { useState, useEffect } from 'react';
import { StateProFormaConfig, StateCreditBaseData, AlternativeCalculationMethod } from '../../services/stateCreditDataService';
import { StateValidationService, ValidationResult } from '../../services/stateValidationService';
import { AlertTriangle, CheckCircle, Info, Calculator, TrendingUp } from 'lucide-react';

interface StateProFormaCalculatorProps {
  stateConfig: StateProFormaConfig;
  baseData: StateCreditBaseData;
  onDataChange: (data: Record<string, number>) => void;
  initialData?: Record<string, number>;
}

export const StateProFormaCalculator: React.FC<StateProFormaCalculatorProps> = ({
  stateConfig,
  baseData,
  onDataChange,
  initialData = {}
}) => {
  const [currentMethod, setCurrentMethod] = useState<'standard' | 'alternative'>('standard');
  const [formData, setFormData] = useState<Record<string, number>>(initialData);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [selectedAlternativeMethod, setSelectedAlternativeMethod] = useState<AlternativeCalculationMethod | null>(null);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  // Get available alternative methods
  const availableAlternativeMethods = StateValidationService.getAvailableAlternativeMethods(stateConfig, baseData);

  useEffect(() => {
    // Validate current data
    const validation = StateValidationService.validateStateProForma(
      stateConfig,
      baseData,
      currentMethod
    );
    setValidationResult(validation);

    // Compare calculation methods if alternative methods are available
    if (availableAlternativeMethods.length > 0) {
      const comparison = StateValidationService.compareCalculationMethods(stateConfig, baseData);
      setComparisonResult(comparison);
    }
  }, [stateConfig, baseData, currentMethod, availableAlternativeMethods]);

  const handleInputChange = (field: string, value: number) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange(newData);
  };

  const handleMethodChange = (method: 'standard' | 'alternative') => {
    setCurrentMethod(method);
    if (method === 'alternative' && availableAlternativeMethods.length > 0) {
      setSelectedAlternativeMethod(availableAlternativeMethods[0]);
    } else {
      setSelectedAlternativeMethod(null);
    }
  };

  const getCurrentLines = () => {
    if (currentMethod === 'standard') {
      return stateConfig.forms.standard.lines;
    } else if (selectedAlternativeMethod) {
      return selectedAlternativeMethod.lines;
    }
    return [];
  };

  const calculateLineValue = (line: any, data: Record<string, number>) => {
    if (line.calc) {
      return line.calc({ ...baseData, ...data });
    }
    return data[line.field] || line.defaultValue || 0;
  };

  const renderValidationMessages = () => {
    if (!validationResult) return null;

    return (
      <div className="mb-4">
        {validationResult.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <h4 className="text-sm font-medium text-red-800">Validation Errors</h4>
            </div>
            <ul className="mt-2 text-sm text-red-700">
              {validationResult.errors.map((error, index) => (
                <li key={index} className="ml-4 list-disc">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-yellow-400 mr-2" />
              <h4 className="text-sm font-medium text-yellow-800">Validation Warnings</h4>
            </div>
            <ul className="mt-2 text-sm text-yellow-700">
              {validationResult.warnings.map((warning, index) => (
                <li key={index} className="ml-4 list-disc">{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {validationResult.isValid && validationResult.errors.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <h4 className="text-sm font-medium text-green-800">Validation Passed</h4>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMethodComparison = () => {
    if (!comparisonResult || availableAlternativeMethods.length === 0) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <div className="flex items-center mb-3">
          <Calculator className="h-5 w-5 text-blue-400 mr-2" />
          <h4 className="text-sm font-medium text-blue-800">Method Comparison</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-800">Standard Method</div>
            <div className="text-blue-600">${comparisonResult.standard.toLocaleString()}</div>
          </div>
          
          {comparisonResult.alternative && (
            <div>
              <div className="font-medium text-blue-800">Alternative Method</div>
              <div className="text-blue-600">${comparisonResult.alternative.toLocaleString()}</div>
            </div>
          )}
          
          <div>
            <div className="font-medium text-blue-800">Recommendation</div>
            <div className={`font-medium ${
              comparisonResult.recommendation === 'alternative' ? 'text-green-600' :
              comparisonResult.recommendation === 'standard' ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {comparisonResult.recommendation === 'alternative' && <TrendingUp className="inline h-4 w-4 mr-1" />}
              {comparisonResult.recommendation.charAt(0).toUpperCase() + comparisonResult.recommendation.slice(1)}
            </div>
          </div>
        </div>

        {comparisonResult.difference && (
          <div className="mt-3 text-sm text-blue-600">
            Difference: ${Math.abs(comparisonResult.difference).toLocaleString()} 
            ({comparisonResult.difference > 0 ? 'higher' : 'lower'} with alternative method)
          </div>
        )}
      </div>
    );
  };

  const renderMethodSelector = () => {
    if (availableAlternativeMethods.length === 0) return null;

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Calculation Method
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="calculationMethod"
              value="standard"
              checked={currentMethod === 'standard'}
              onChange={(e) => handleMethodChange(e.target.value as 'standard' | 'alternative')}
              className="mr-2"
            />
            <span className="text-sm">Standard Method</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="calculationMethod"
              value="alternative"
              checked={currentMethod === 'alternative'}
              onChange={(e) => handleMethodChange(e.target.value as 'standard' | 'alternative')}
              className="mr-2"
            />
            <span className="text-sm">Alternative Method</span>
          </label>
        </div>

        {currentMethod === 'alternative' && availableAlternativeMethods.length > 1 && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alternative Method
            </label>
            <select
              value={selectedAlternativeMethod?.name || ''}
              onChange={(e) => {
                const method = availableAlternativeMethods.find(m => m.name === e.target.value);
                setSelectedAlternativeMethod(method || null);
              }}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {availableAlternativeMethods.map((method) => (
                <option key={method.name} value={method.name}>
                  {method.name} - {method.description}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {stateConfig.name} R&D Credit Calculator
          </h3>
          <p className="text-sm text-gray-600">
            {stateConfig.form_reference} - {currentMethod === 'standard' ? 
              stateConfig.forms.standard.name : 
              selectedAlternativeMethod?.name || 'Alternative Method'
            }
          </p>
        </div>

        {renderMethodComparison()}
        {renderValidationMessages()}
        {renderMethodSelector()}

        <div className="space-y-4">
          {getCurrentLines()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((line) => {
              const value = calculateLineValue(line, formData);
              const isCalculated = line.line_type === 'calculated';
              const hasValidation = line.validation;

              return (
                <div key={line.line} className="flex items-center space-x-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    Line {line.line}
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {line.label}
                    </label>
                    
                    {isCalculated ? (
                      <div className="text-lg font-semibold text-gray-900">
                        ${value.toLocaleString()}
                      </div>
                    ) : (
                      <input
                        type={line.type === 'percentage' ? 'number' : 'number'}
                        value={value}
                        onChange={(e) => handleInputChange(line.field, parseFloat(e.target.value) || 0)}
                        className={`block w-full border border-gray-300 rounded-md px-3 py-2 text-sm ${
                          hasValidation && hasValidation.required && !value ? 'border-red-300' : ''
                        }`}
                        placeholder={line.defaultValue?.toString() || '0'}
                        min={hasValidation?.min}
                        max={hasValidation?.max}
                        step={line.type === 'percentage' ? '0.01' : '1'}
                      />
                    )}
                    
                    {hasValidation && hasValidation.message && !value && hasValidation.required && (
                      <p className="text-sm text-red-600 mt-1">{hasValidation.message}</p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {stateConfig.notes.map((note, index) => (
              <li key={index} className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}; 