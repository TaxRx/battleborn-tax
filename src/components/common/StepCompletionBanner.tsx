import React, { useState, useEffect } from 'react';
import { CheckCircle, Lock, Unlock, AlertTriangle, Clock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useLockStore from '../../store/lockStore';

interface StepCompletionBannerProps {
  stepName: 'businessSetup' | 'researchActivities' | 'researchDesign' | 'calculations' | 'qres';
  stepDisplayName: string;
  businessYearId: string;
  onCompletionChange?: (completed: boolean) => void;
  disabled?: boolean;
  description?: string;
}

interface CompletionData {
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  completedByName?: string;
}

const StepCompletionBanner: React.FC<StepCompletionBannerProps> = ({
  stepName,
  stepDisplayName,
  businessYearId,
  onCompletionChange,
  disabled = false,
  description
}) => {
  const [completionData, setCompletionData] = useState<CompletionData>({
    completed: false,
    completedAt: null,
    completedBy: null
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'complete' | 'unlock'>('complete');

  const { getStepCompletion, setStepCompletion } = useLockStore();

  useEffect(() => {
    loadCompletionData();
  }, [businessYearId, stepName]);

  const loadCompletionData = async () => {
    try {
      setLoading(true);
      
      // Get column names based on step
      const columnMap = {
        businessSetup: 'business_setup_completed',
        researchActivities: 'research_activities_completed', 
        researchDesign: 'research_design_completed',
        calculations: 'calculations_completed',
        qres: 'qre_locked'
      };

      const completedAtColumn = stepName === 'qres' ? 'updated_at' : `${columnMap[stepName].replace('_completed', '_completed_at')}`;
      const completedByColumn = stepName === 'qres' ? 'updated_by' : `${columnMap[stepName].replace('_completed', '_completed_by')}`;

      const { data: businessYear, error } = await supabase
        .from('rd_business_years')
        .select(`
          ${columnMap[stepName]},
          ${completedAtColumn},
          ${completedByColumn},
          profile:${completedByColumn}(full_name)
        `)
        .eq('id', businessYearId)
        .single();

      if (error) {
        console.error('Error loading completion data:', error);
        return;
      }

      const completed = businessYear?.[columnMap[stepName]] || false;
      const completedAt = businessYear?.[completedAtColumn] || null;
      const completedBy = businessYear?.[completedByColumn] || null;
      const profile = businessYear?.profile;

      setCompletionData({
        completed,
        completedAt,
        completedBy,
        completedByName: profile ? profile.full_name : null
      });

      // Update store
      setStepCompletion(businessYearId, stepName, completed);

    } catch (error) {
      console.error('Error loading completion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async () => {
    if (disabled) return;

    try {
      setLoading(true);
      
      const newCompletedState = !completionData.completed;
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      // Get column names based on step
      const columnMap = {
        businessSetup: 'business_setup_completed',
        researchActivities: 'research_activities_completed',
        researchDesign: 'research_design_completed', 
        calculations: 'calculations_completed',
        qres: 'qre_locked'
      };

      const updateData: any = {
        [columnMap[stepName]]: newCompletedState,
        updated_at: new Date().toISOString()
      };

      if (newCompletedState) {
        // Completing step
        if (stepName !== 'qres') {
          updateData[`${columnMap[stepName].replace('_completed', '_completed_at')}`] = new Date().toISOString();
          updateData[`${columnMap[stepName].replace('_completed', '_completed_by')}`] = currentUser?.id;
        }
      } else {
        // Unlocking step
        if (stepName !== 'qres') {
          updateData[`${columnMap[stepName].replace('_completed', '_completed_at')}`] = null;
          updateData[`${columnMap[stepName].replace('_completed', '_completed_by')}`] = null;
        }
      }

      const { error } = await supabase
        .from('rd_business_years')
        .update(updateData)
        .eq('id', businessYearId);

      if (error) {
        console.error('Error updating completion status:', error);
        throw error;
      }

      // Update local state and store
      setCompletionData(prev => ({
        ...prev,
        completed: newCompletedState,
        completedAt: newCompletedState ? new Date().toISOString() : null,
        completedBy: newCompletedState ? currentUser?.id || null : null
      }));

      setStepCompletion(businessYearId, stepName, newCompletedState);
      
      // Notify parent component
      onCompletionChange?.(newCompletedState);

      console.log(`✅ Step ${stepDisplayName} ${newCompletedState ? 'completed' : 'unlocked'} successfully`);

    } catch (error) {
      console.error('Error toggling completion:', error);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const openConfirmModal = (action: 'complete' | 'unlock') => {
    setActionType(action);
    setShowConfirmModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && !completionData.completed) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-gray-400 mr-3 animate-pulse" />
          <span className="text-gray-600">Loading completion status...</span>
        </div>
      </div>
    );
  }

  if (completionData.completed) {
    return (
      <>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <h4 className="font-semibold text-green-800">
                  🔒 {stepDisplayName} Completed & Locked
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  This step is completed and protected from accidental changes.
                  {description && ` ${description}`}
                </p>
                {completionData.completedAt && (
                  <div className="text-xs text-green-600 mt-2 flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    Completed {formatDate(completionData.completedAt)}
                    {completionData.completedByName && ` by ${completionData.completedByName}`}
                  </div>
                )}
              </div>
            </div>
            {!disabled && (
              <button
                onClick={() => openConfirmModal('unlock')}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                disabled={loading}
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock</span>
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Unlock {stepDisplayName}?
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700">
                      Are you sure you want to unlock the <strong>{stepDisplayName}</strong> step? 
                      This will allow modifications to completed data.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Unlocking will remove data protection for this step.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleCompletion}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{loading ? 'Unlocking...' : 'Unlock Step'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Step not completed
  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lock className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <h4 className="font-semibold text-blue-800">
                {stepDisplayName} Ready for Completion
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Complete this step to lock and protect your data from accidental changes.
                {description && ` ${description}`}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              onClick={() => openConfirmModal('complete')}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete & Lock</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && actionType === 'complete' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Complete {stepDisplayName}?
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    Are you sure you want to mark the <strong>{stepDisplayName}</strong> step as completed? 
                    This will lock the step and prevent accidental modifications.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    You can unlock it later if needed, but this provides data protection.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleCompletion}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Completing...' : 'Complete & Lock'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StepCompletionBanner;