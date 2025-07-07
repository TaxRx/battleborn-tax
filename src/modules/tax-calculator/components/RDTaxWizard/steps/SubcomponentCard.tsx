import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabase';

// Custom slider styles
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 18px;
    width: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider::-moz-range-thumb {
    height: 18px;
    width: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

interface Role {
  id: string;
  name: string;
}

interface SubcomponentCardProps {
  subcomponent: {
    id: string;
    title: string;
    hint: string;
    roles: string[];
  };
  stepId: string;
  businessId: string;
  year: number;
  stepTimePercent: number;
  practicePercent: number;
  isSelected: boolean;
  frequencyPercent: number;
  yearPercent: number;
  startYear: number;
  startMonth: number;
  monthName: string;
  selectedRoles: string[];
  appliedPercentage: number;
  parentActivityRoles: string[]; // Role IDs from parent activity
  subcomponentData?: any; // Data from rd_research_subcomponents
  onToggle: (subcomponentId: string, stepId: string) => Promise<void>;
  onFrequencyChange: (stepId: string, subcomponentId: string, value: number) => void;
  onYearChange: (subcomponentId: string, value: number) => void;
  onStartYearChange: (subcomponentId: string, value: number) => void;
  onMonthChange: (subcomponentId: string, month: string) => void;
  onRoleToggle: (subcomponentId: string, role: string) => void;
  onTextFieldChange: (subcomponentId: string, field: string, value: string) => Promise<void>;
}

const SubcomponentCard: React.FC<SubcomponentCardProps> = ({
  subcomponent,
  stepId,
  businessId,
  year,
  stepTimePercent,
  practicePercent,
  isSelected,
  frequencyPercent,
  yearPercent,
  startYear,
  startMonth,
  monthName,
  selectedRoles,
  appliedPercentage,
  parentActivityRoles,
  subcomponentData,
  onToggle,
  onFrequencyChange,
  onYearChange,
  onStartYearChange,
  onMonthChange,
  onRoleToggle,
  onTextFieldChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResearchExpanded, setIsResearchExpanded] = useState(false);
  const [textFields, setTextFields] = useState<{[key: string]: string}>({});
  const [allRoles, setAllRoles] = useState<Role[]>([]);

  // Load all roles from database
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('rd_roles')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        setAllRoles(data || []);
    } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    
    loadRoles();
  }, []);

  // Get role name by ID
  const getRoleName = (roleId: string): string => {
    const role = allRoles.find(r => r.id === roleId);
    return role ? role.name : roleId; // Fallback to ID if role not found
  };

  // Load text fields from subcomponentData on mount
  useEffect(() => {
    if (subcomponentData) {
      const fields = {
        general_description: subcomponentData.general_description || '',
        goal: subcomponentData.goal || '',
        hypothesis: subcomponentData.hypothesis || '',
        alternatives: subcomponentData.alternatives || '',
        uncertainties: subcomponentData.uncertainties || '',
        developmental_process: subcomponentData.developmental_process || '',
        primary_goal: subcomponentData.primary_goal || '',
        expected_outcome_type: subcomponentData.expected_outcome_type || '',
        cpt_codes: subcomponentData.cpt_codes || '',
        cdt_codes: subcomponentData.cdt_codes || '',
        alternative_paths: subcomponentData.alternative_paths || ''
      };
      setTextFields(fields);
    }
  }, [subcomponentData]);

  // Initialize selected roles from parent activity roles when component is selected
  useEffect(() => {
    if (isSelected && selectedRoles.length === 0 && parentActivityRoles.length > 0) {
      // Initialize with parent activity roles
      parentActivityRoles.forEach(roleId => {
        handleRoleToggle(roleId);
      });
    }
  }, [isSelected, parentActivityRoles]);

  const handleTextFieldChange = async (field: string, value: string) => {
    setTextFields(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Save to database
    await onTextFieldChange(subcomponent.id, field, value);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthPercentage = (month: string): number => {
    const monthIndex = months.indexOf(month);
    return monthIndex >= 0 ? 100 - (monthIndex * (100 / 12)) : 100;
  };

  // Helper function to format percentages with max 2 decimal places
  const formatPercentage = (value: number): string => {
    return value.toFixed(2);
  };

  // Corrected applied percentage calculation using decimals
  const calculateAppliedPercentage = (): number => {
    // Convert all to decimals
    const practice = practicePercent / 100;
    const step = stepTimePercent / 100;
    const freq = frequencyPercent / 100;
    const yearP = yearPercent / 100;
    return +(practice * step * freq * yearP * 100).toFixed(2); // Return as percent
  };

  const handleFrequencyChange = (value: number) => {
    onFrequencyChange(stepId, subcomponent.id, value);
  };

  const handleYearChange = (month: string) => {
    const newYearPercent = getMonthPercentage(month);
    onYearChange(subcomponent.id, newYearPercent);
    onMonthChange(subcomponent.id, month);
  };

  const handleStartYearChange = (value: number) => {
    onStartYearChange(subcomponent.id, value);
  };

  const handleRoleToggle = (roleId: string) => {
    onRoleToggle(subcomponent.id, roleId);
  };

  const calculatedAppliedPercentage = calculateAppliedPercentage();

  return (
    <div className={`rounded-xl border transition-all duration-300 ${
      isSelected 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-lg' 
        : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`}>
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      
      {/* Header - Always visible with enhanced design */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className={`font-semibold text-lg ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                {subcomponent.title}
              </h4>
            </div>
            <p className={`text-sm leading-relaxed ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
              {subcomponent.hint}
            </p>
            </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3 ml-4">
            {/* Applied Percentage Chip - Always visible when selected */}
            {isSelected && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                {formatPercentage(calculatedAppliedPercentage)}%
              </div>
            )}
            
            {/* Toggle Switch */}
            <button
              onClick={() => onToggle(subcomponent.id, stepId)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                isSelected ? 'bg-blue-600 shadow-lg' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                  isSelected ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            
            {/* Expand/Collapse Button - Only show if selected */}
            {isSelected && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isExpanded ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg
                  className={`w-5 h-5 transform transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content - Only show if selected and expanded */}
      {isSelected && isExpanded && (
        <div className="border-t border-blue-200 bg-white">
          {/* Configuration Section */}
          <div className="p-5 space-y-6">
            {/* Frequency Slider */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-blue-900">Frequency %</label>
                <span className="text-lg font-bold text-blue-700">{formatPercentage(frequencyPercent)}%</span>
              </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                step="0.1"
                value={frequencyPercent}
                onChange={(e) => handleFrequencyChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

            {/* Year % and Start Year in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <label className="block text-sm font-semibold text-purple-900 mb-2">Year %</label>
                <select
                  value={monthName}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month} ({formatPercentage(getMonthPercentage(month))}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <label className="block text-sm font-semibold text-green-900 mb-2">Start Year</label>
                <select
                  value={startYear}
                  onChange={(e) => handleStartYearChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Chips */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
              <label className="block text-sm font-semibold text-orange-900 mb-3">Roles</label>
              <div className="flex flex-wrap gap-2">
                {parentActivityRoles.map((roleId) => {
                  const isRoleSelected = selectedRoles.includes(roleId);
                  return (
                    <button
                      key={roleId}
                      onClick={() => handleRoleToggle(roleId)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isRoleSelected
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-100'
                      }`}
                    >
                      {getRoleName(roleId)}
                    </button>
                  );
                })}
              </div>
              {parentActivityRoles.length === 0 && (
                <p className="text-sm text-orange-600 italic">
                  No roles selected in parent activity. Please go back to Research Activities and select roles.
                </p>
              )}
            </div>

            {/* Applied Percentage Display */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-4 text-white">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Applied Percentage</span>
                <span className="text-2xl font-bold">
                  {formatPercentage(calculatedAppliedPercentage)}%
                </span>
              </div>
              <div className="text-xs opacity-90 mt-1">
                Practice {formatPercentage(practicePercent)}% × Step {formatPercentage(stepTimePercent)}% × Frequency {formatPercentage(frequencyPercent)}% × Year {formatPercentage(yearPercent)}%
              </div>
            </div>
          </div>

          {/* Research Specifics Section */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => setIsResearchExpanded(!isResearchExpanded)}
              className="w-full px-5 py-4 text-left bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-500 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h5 className="font-semibold text-gray-900">RESEARCH SPECIFICS</h5>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                    isResearchExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Research Specifics Content - Now with scrolling */}
            {isResearchExpanded && (
              <div className="max-h-96 overflow-y-auto p-5 bg-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">General Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter general description..."
                      value={textFields.general_description}
                      onChange={(e) => handleTextFieldChange('general_description', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Goal</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter goal..."
                      value={textFields.goal}
                      onChange={(e) => handleTextFieldChange('goal', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hypothesis</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter hypothesis..."
                      value={textFields.hypothesis}
                      onChange={(e) => handleTextFieldChange('hypothesis', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternative Approaches</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter alternative approaches..."
                      value={textFields.alternatives}
                      onChange={(e) => handleTextFieldChange('alternatives', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Uncertainties</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter uncertainties..."
                      value={textFields.uncertainties}
                      onChange={(e) => handleTextFieldChange('uncertainties', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Development Process</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter development process..."
                      value={textFields.developmental_process}
                      onChange={(e) => handleTextFieldChange('developmental_process', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Goal</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter primary goal..."
                      value={textFields.primary_goal}
                      onChange={(e) => handleTextFieldChange('primary_goal', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Outcome Type</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter expected outcome type..."
                      value={textFields.expected_outcome_type}
                      onChange={(e) => handleTextFieldChange('expected_outcome_type', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPT Codes</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter CPT codes..."
                      value={textFields.cpt_codes}
                      onChange={(e) => handleTextFieldChange('cpt_codes', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CDT Codes</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter CDT codes..."
                      value={textFields.cdt_codes}
                      onChange={(e) => handleTextFieldChange('cdt_codes', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternative Paths</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter alternative paths..."
                      value={textFields.alternative_paths}
                      onChange={(e) => handleTextFieldChange('alternative_paths', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubcomponentCard; 