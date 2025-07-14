import React, { useState, useEffect } from 'react';
import './StateProForma.css';

export interface StateProFormaLine {
  line: string;
  label: string;
  field: string;
  editable: boolean;
  calc?: (data: Record<string, number>) => number;
  method?: 'standard' | 'alternative';
  defaultValue?: number; // Add default value support
  type?: 'currency' | 'percentage' | 'yesno'; // Add field type support
  description?: string; // Add description support
}

interface StateCreditProFormaProps {
  lines: StateProFormaLine[];
  initialData?: Record<string, number>;
  onSave?: (data: Record<string, number>, businessYearId: string) => Promise<void>;
  title?: string;
  businessYearId?: string;
}

// Formatting utilities
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(value));
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/[$,]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : Math.round(parsed);
};

const parsePercentage = (value: string): number => {
  const cleanValue = value.replace(/%/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

export const StateCreditProForma: React.FC<StateCreditProFormaProps> = ({
  lines,
  initialData = {},
  onSave,
  title = 'State Credit Pro Forma',
  businessYearId,
}) => {
  const [formData, setFormData] = useState<Record<string, number>>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Initialize form data with default values
  useEffect(() => {
    const dataWithDefaults = { ...initialData };
    lines.forEach(line => {
      if (line.defaultValue !== undefined && !(line.field in dataWithDefaults)) {
        dataWithDefaults[line.field] = line.defaultValue;
      }
    });
    setFormData(dataWithDefaults);
  }, [initialData, lines]);

  // Calculate computed values
  const computedData = { ...formData };
  lines.forEach(line => {
    if (line.calc && !line.editable) {
      computedData[line.field] = line.calc(computedData);
    }
  });

  // Determine if a field should be formatted as percentage
  const isPercentageField = (field: string, line: StateProFormaLine): boolean => {
    if (line.type === 'percentage') return true;
    if (line.type === 'yesno') return false;
    if (line.type === 'currency') return false;
    return field === 'fixedBasePercent' || field.includes('percent') || field.includes('Percent') || field.includes('Factor');
  };

  // Determine if a field should be formatted as yes/no
  const isYesNoField = (line: StateProFormaLine): boolean => {
    return line.type === 'yesno';
  };

  // Get display value for a field
  const getDisplayValue = (field: string, value: number, line: StateProFormaLine): string => {
    if (isYesNoField(line)) {
      return value === 1 ? 'Yes' : 'No';
    }
    if (isPercentageField(field, line)) {
      return formatPercentage(value);
    }
    return formatCurrency(value);
  };

  // Handle input change for different field types
  const handleInputChange = (field: string, value: string, line: StateProFormaLine) => {
    let numValue: number;
    
    if (isYesNoField(line)) {
      // For yes/no fields, convert to 1 for "Yes", 0 for "No"
      numValue = value.toLowerCase() === 'yes' || value === '1' ? 1 : 0;
    } else if (isPercentageField(field, line)) {
      numValue = parsePercentage(value);
    } else {
      numValue = parseCurrency(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSave = async () => {
    if (!onSave || !businessYearId) {
      setSaveMessage('Save function not available');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await onSave(computedData, businessYearId);
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving data');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="state-proforma-container">
      <h3 className="state-proforma-title">{title}</h3>
      
      <div className="state-proforma-table">
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const value = computedData[line.field] || 0;
              const isPercentage = isPercentageField(line.field, line);
              
              return (
                <tr key={line.line}>
                  <td className="font-medium">
                    {line.line}
                  </td>
                  <td>
                    {line.label}
                  </td>
                  <td>
                    {line.editable ? (
                      <input
                        type="text"
                        value={getDisplayValue(line.field, value, line)}
                        onChange={(e) => handleInputChange(line.field, e.target.value, line)}
                        onBlur={(e) => {
                          // Re-format on blur
                          let numValue: number;
                          if (isYesNoField(line)) {
                            numValue = value === 1 ? 1 : 0; // Keep 1 or 0
                          } else if (isPercentageField(line.field, line)) {
                            numValue = parsePercentage(e.target.value);
                          } else {
                            numValue = parseCurrency(e.target.value);
                          }
                          e.target.value = getDisplayValue(line.field, numValue, line);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right font-mono"
                        placeholder={
                          isYesNoField(line) ? 'Yes/No' :
                          isPercentageField(line.field, line) ? '3.00%' : 
                          '$0'
                        }
                        style={{ textAlign: 'right' }}
                      />
                    ) : (
                      <span className="text-right font-mono block w-full">
                        {getDisplayValue(line.field, value, line)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {onSave && businessYearId && (
        <div className="state-proforma-save">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          {saveMessage && (
            <span className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      )}
    </div>
  );
}; 