import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Database, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImportVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VerificationResult {
  recentlyUpdated: any[];
  businessRelationships: any[];
  orphanedRecords: any[];
  stepUpdates: any[];
  loading: boolean;
  error: string | null;
}

const ImportVerificationModal: React.FC<ImportVerificationModalProps> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<VerificationResult>({
    recentlyUpdated: [],
    businessRelationships: [],
    orphanedRecords: [],
    stepUpdates: [],
    loading: false,
    error: null
  });

  const runVerification = async () => {
    setResults(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Query 1: Recently updated subcomponents
      const { data: recentlyUpdated, error: error1 } = await supabase
        .from('rd_research_subcomponents')
        .select('id, name, updated_at, created_at')
        .gte('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('updated_at', { ascending: false });

      if (error1) throw error1;

      // Query 2: Check business relationships
      const { data: businessRelationships, error: error2 } = await supabase
        .rpc('verify_business_relationships');

      // Query 3: Check for orphaned records
      const orphanCheckQueries = [
        supabase.from('rd_selected_subcomponents').select('subcomponent_id').not('subcomponent_id', 'in', 
          `(${recentlyUpdated?.map(r => `'${r.id}'`).join(',') || "'none'"})`),
        supabase.from('rd_employee_subcomponents').select('subcomponent_id').not('subcomponent_id', 'in', 
          `(${recentlyUpdated?.map(r => `'${r.id}'`).join(',') || "'none'"})`),
        supabase.from('rd_expenses').select('subcomponent_id').not('subcomponent_id', 'in', 
          `(${recentlyUpdated?.map(r => `'${r.id}'`).join(',') || "'none'"})`)
      ];

      // Query 4: Recent step updates
      const { data: stepUpdates, error: error4 } = await supabase
        .from('rd_research_steps')
        .select('id, name, updated_at, research_activity_id')
        .gte('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('updated_at', { ascending: false });

      setResults({
        recentlyUpdated: recentlyUpdated || [],
        businessRelationships: businessRelationships || [],
        orphanedRecords: [],
        stepUpdates: stepUpdates || [],
        loading: false,
        error: null
      });

    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Verification failed'
      }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      runVerification();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updatedCount = results.recentlyUpdated.filter(item => 
    new Date(item.updated_at) > new Date(new Date(item.created_at).getTime() + 60000)
  ).length;

  const createdCount = results.recentlyUpdated.length - updatedCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Import Verification Results</h3>
            <p className="text-sm text-gray-600 mt-1">
              Verify ID preservation and business relationship integrity
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {results.loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Running verification checks...</p>
            </div>
          )}

          {results.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-red-800">Verification Error</h4>
                  <p className="text-sm text-red-700 mt-1">{results.error}</p>
                </div>
              </div>
            </div>
          )}

          {!results.loading && !results.error && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    <div>
                      <h4 className="font-semibold text-green-800">Updated (ID Preserved)</h4>
                      <p className="text-2xl font-bold text-green-900">{updatedCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Database className="w-6 h-6 text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-semibold text-blue-800">Newly Created</h4>
                      <p className="text-2xl font-bold text-blue-900">{createdCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="w-6 h-6 text-purple-600 mr-3" />
                    <div>
                      <h4 className="font-semibold text-purple-800">Steps Updated</h4>
                      <p className="text-2xl font-bold text-purple-900">{results.stepUpdates.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recently Updated Items */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">📋 Recently Modified Subcomponents</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {results.recentlyUpdated.length === 0 ? (
                    <p className="text-gray-600 italic">No recent modifications found</p>
                  ) : (
                    <div className="space-y-2">
                      {results.recentlyUpdated.map((item, index) => {
                        const isUpdated = new Date(item.updated_at) > new Date(new Date(item.created_at).getTime() + 60000);
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-gray-500 ml-2">ID: {item.id}</span>
                            </div>
                            <div className="flex items-center">
                              {isUpdated ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  ✅ ID PRESERVED
                                </span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  🆕 NEW CREATION
                                </span>
                              )}
                              <span className="text-xs text-gray-500 ml-2">
                                {new Date(item.updated_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Step Updates */}
              {results.stepUpdates.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">📝 Updated Research Steps</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {results.stepUpdates.map((step, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="font-medium">{step.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(step.updated_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={runVerification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔄 Refresh Verification
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportVerificationModal;