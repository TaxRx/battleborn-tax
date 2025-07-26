import React, { useState, useRef } from 'react';
import { X, Upload, Download, Info, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  businessId
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const csvTemplate = `research_activity,category,area,focus,step,subcomponent,hint,general_description,goal,hypothesis,alternatives,uncertainties,developmental_process,primary_goal,expected_outcome_type,cpt_codes,cdt_codes,alternative_paths
"Advanced MRI Analysis","Medical Technology","Diagnostic Imaging","MRI Enhancement","Algorithm Development","Pattern Recognition Module","Focus on edge detection and noise reduction","Creating innovative approaches to enhance MRI imaging quality and diagnostic accuracy","Improve diagnostic precision through enhanced imaging","We hypothesize that machine learning algorithms can significantly improve MRI image clarity","Alternative approaches include CT enhancement or ultrasound improvements","Uncertain about FDA approval timeline and computational requirements","Following iterative development with clinical validation phases","Primary goal is to achieve 95% diagnostic accuracy improvement","Improved diagnostic imaging software platform","70553, 70551, 70552","","Machine learning integration, cloud-based processing, hybrid imaging approaches"
"Robotic Surgery Platform","Medical Technology","Surgical Robotics","Precision Surgery","Instrument Control","Haptic Feedback System","Implement force feedback with sub-newton precision","Creating precise robotic systems for minimally invasive surgical procedures","Enhance surgical precision and reduce patient recovery time","We believe robotic assistance will reduce surgical complications by 40%","Manual laparoscopic techniques, traditional open surgery","Regulatory approval complexity and surgeon training requirements","Multi-phase development with prototype testing and clinical trials","Achieve sub-millimeter surgical precision with haptic feedback","FDA-approved surgical robotic system","64568, 64569, 64570","D7210, D7220","AI-assisted guidance, modular instrument design, real-time imaging integration"`;

  const requiredColumns = [
    'research_activity', 'category', 'area', 'focus', 'step', 'subcomponent'
  ];

  const optionalColumns = [
    'hint', 'general_description', 'goal', 'hypothesis', 'alternatives', 
    'uncertainties', 'developmental_process', 'primary_goal', 'expected_outcome_type', 
    'cpt_codes', 'cdt_codes', 'alternative_paths'
  ];

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research_subcomponents_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parsing (handles quoted fields)
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: any = { _rowNumber: i + 1 };
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const validateRow = (row: any): string | null => {
    for (const col of requiredColumns) {
      if (!row[col] || !row[col].trim()) {
        return `Missing required field: ${col}`;
      }
    }
    return null;
  };

  const findOrCreateFilterEntries = async (row: any) => {
    // Find or create category
    let category = await supabase
      .from('rd_research_categories')
      .select('id')
      .ilike('name', row.category.trim())
      .single();

    if (category.error) {
      const newCategory = await supabase
        .from('rd_research_categories')
        .insert({ name: row.category.trim() })
        .select('id')
        .single();
      
      if (newCategory.error) throw newCategory.error;
      category = newCategory;
    }

    // Find or create area
    let area = await supabase
      .from('rd_areas')
      .select('id')
      .ilike('name', row.area.trim())
      .eq('category_id', category.data.id)
      .single();

    if (area.error) {
      const newArea = await supabase
        .from('rd_areas')
        .insert({ 
          name: row.area.trim(), 
          category_id: category.data.id 
        })
        .select('id')
        .single();
      
      if (newArea.error) throw newArea.error;
      area = newArea;
    }

    // Find or create focus
    let focus = await supabase
      .from('rd_focuses')
      .select('id')
      .ilike('name', row.focus.trim())
      .eq('area_id', area.data.id)
      .single();

    if (focus.error) {
      const newFocus = await supabase
        .from('rd_focuses')
        .insert({ 
          name: row.focus.trim(), 
          area_id: area.data.id 
        })
        .select('id')
        .single();
      
      if (newFocus.error) throw newFocus.error;
      focus = newFocus;
    }

    return focus.data.id;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('No data found in CSV file');
      }

      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const row of rows) {
        try {
          const validationError = validateRow(row);
          if (validationError) {
            result.failed++;
            result.errors.push({
              row: row._rowNumber,
              error: validationError,
              data: row
            });
            continue;
          }

          const focusId = await findOrCreateFilterEntries(row);

          // Find or create the research activity
          let { data: existingActivity, error: activityFindError } = await supabase
            .from('rd_research_activities')
            .select('id')
            .eq('title', row.research_activity.trim())
            .eq('focus_id', focusId)
            .single();

          let activityId;
          if (activityFindError || !existingActivity) {
            // Create new research activity
            const activityData = {
              title: row.research_activity.trim(),
              focus_id: focusId,
              is_active: true,
              default_roles: {},
              default_steps: {},
              ...(businessId && { business_id: businessId })
            };

            const { data: newActivity, error: activityError } = await supabase
              .from('rd_research_activities')
              .insert(activityData)
              .select('id')
              .single();

            if (activityError) throw activityError;
            activityId = newActivity.id;
          } else {
            activityId = existingActivity.id;
          }

          // Find or create the step
          if (row.step && row.subcomponent) {
            // Check if step already exists for this activity
            let { data: existingStep, error: stepFindError } = await supabase
              .from('rd_research_steps')
              .select('id')
              .eq('research_activity_id', activityId)
              .eq('name', row.step.trim())
              .single();

            let stepId;
            if (stepFindError || !existingStep) {
              // Get the current max step order for this activity
              const { data: maxOrderStep } = await supabase
                .from('rd_research_steps')
                .select('step_order')
                .eq('research_activity_id', activityId)
                .order('step_order', { ascending: false })
                .limit(1)
                .single();

              const nextOrder = (maxOrderStep?.step_order || 0) + 1;

              // Create new step
              const stepData = {
                research_activity_id: activityId,
                name: row.step.trim(),
                description: row.general_description || '',
                step_order: nextOrder,
                is_active: true
              };

              const { data: newStep, error: stepError } = await supabase
                .from('rd_research_steps')
                .insert(stepData)
                .select('id')
                .single();

              if (stepError) throw stepError;
              stepId = newStep.id;
            } else {
              stepId = existingStep.id;
            }

            // Get the current max subcomponent order for this step
            const { data: maxOrderSubcomponent } = await supabase
              .from('rd_research_subcomponents')
              .select('subcomponent_order')
              .eq('step_id', stepId)
              .order('subcomponent_order', { ascending: false })
              .limit(1)
              .single();

            const nextSubOrder = (maxOrderSubcomponent?.subcomponent_order || 0) + 1;

            // Create subcomponent with detailed data
            const subcomponentData = {
              step_id: stepId,
              name: row.subcomponent.trim(),
              description: row.general_description || '',
              subcomponent_order: nextSubOrder,
              is_active: true,
              hint: row.hint || '',
              general_description: row.general_description || '',
              goal: row.goal || '',
              hypothesis: row.hypothesis || '',
              alternatives: row.alternatives || '',
              uncertainties: row.uncertainties || '',
              developmental_process: row.developmental_process || '',
              primary_goal: row.primary_goal || '',
              expected_outcome_type: row.expected_outcome_type || '',
              cpt_codes: row.cpt_codes || '',
              cdt_codes: row.cdt_codes || '',
              alternative_paths: row.alternative_paths || ''
            };

            await supabase
              .from('rd_research_subcomponents')
              .insert(subcomponentData);
          }

          result.success++;
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            row: row._rowNumber,
            error: error.message || 'Unknown error',
            data: row
          });
        }
      }

      setResult(result);

      if (result.success > 0) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setResult({
        success: 0,
        failed: 1,
        errors: [{ row: 0, error: error.message || 'Failed to process file' }]
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setShowInstructions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Import Research Activities</h2>
          </div>
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {!result ? (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-blue-900">CSV Format Requirements</h3>
                      <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        {showInstructions ? 'Hide' : 'Show'} Details
                      </button>
                    </div>
                    
                    {showInstructions && (
                      <div className="mt-3 text-sm text-blue-800">
                        <p className="mb-2"><strong>Required Columns:</strong></p>
                        <ul className="list-disc list-inside mb-3 space-y-1">
                          {requiredColumns.map(col => (
                            <li key={col}><code className="bg-blue-100 px-1 rounded">{col}</code></li>
                          ))}
                        </ul>
                        
                        <p className="mb-2"><strong>Optional Columns:</strong></p>
                        <div className="grid grid-cols-2 gap-1 mb-3">
                          {optionalColumns.map(col => (
                            <div key={col} className="text-xs">
                              <code className="bg-blue-100 px-1 rounded">{col}</code>
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-xs">
                          <strong>Note:</strong> Categories, areas, and focuses will be created automatically if they don't exist.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="text-center">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template CSV</span>
                </button>
                <p className="text-xs text-gray-600 mt-2">
                  Download a sample CSV file with the correct format and example data
                </p>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Select a CSV file to import research activities
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose CSV File</span>
                </button>
                
                {file && (
                  <div className="mt-3 text-sm text-gray-600">
                    Selected: <span className="font-medium">{file.name}</span>
                  </div>
                )}
              </div>

              {/* Import Button */}
              {file && (
                <div className="text-center">
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{importing ? 'Importing...' : 'Import Activities'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Results */
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">{result.success} Successful</span>
                  </div>
                  {result.failed > 0 && (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-600 font-medium">{result.failed} Failed</span>
                    </div>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-900 mb-2">Import Errors:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-800">
                        <strong>Row {error.row}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={resetModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Import More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal; 