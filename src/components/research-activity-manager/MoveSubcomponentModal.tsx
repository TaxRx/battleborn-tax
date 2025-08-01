import React, { useState } from 'react';
import { X, Move, ArrowRight } from 'lucide-react';
import { MoveSubcomponentModalProps } from './types';

const MoveSubcomponentModal: React.FC<MoveSubcomponentModalProps> = ({
  isOpen,
  subcomponentId,
  currentStepId,
  availableSteps,
  onClose,
  onMove
}) => {
  const [selectedStepId, setSelectedStepId] = useState('');
  const [moving, setMoving] = useState(false);

  const handleMove = async () => {
    if (!selectedStepId || selectedStepId === currentStepId) return;

    setMoving(true);
    try {
      await onMove(selectedStepId);
      onClose();
    } catch (error) {
      console.error('Error moving subcomponent:', error);
    } finally {
      setMoving(false);
    }
  };

  const currentStep = availableSteps.find(step => step.id === currentStepId);
  const targetStep = availableSteps.find(step => step.id === selectedStepId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Move Subcomponent
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <p className="text-gray-600">
              Select the target step where you want to move this subcomponent.
            </p>

            {/* Current Step */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-blue-600 mb-1">
                <Move className="w-4 h-4" />
                <span>Current Step</span>
              </div>
              <p className="font-medium text-blue-900">
                {currentStep?.name || 'Unknown Step'}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>

            {/* Target Step Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Step
              </label>
              <select
                value={selectedStepId}
                onChange={(e) => setSelectedStepId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a step...</option>
                {availableSteps
                  .filter(step => step.id !== currentStepId && step.is_active)
                  .map(step => (
                    <option key={step.id} value={step.id}>
                      {step.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Target Step Preview */}
            {targetStep && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-green-600 mb-1">
                  <Move className="w-4 h-4" />
                  <span>Target Step</span>
                </div>
                <p className="font-medium text-green-900">
                  {targetStep.name}
                </p>
                {targetStep.description && (
                  <p className="text-sm text-green-700 mt-1">
                    {targetStep.description}
                  </p>
                )}
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Moving this subcomponent will:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Deactivate the current subcomponent</li>
                    <li>Create a new version in the target step</li>
                    <li>Preserve historical associations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={!selectedStepId || selectedStepId === currentStepId || moving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Move className="w-4 h-4" />
              <span>{moving ? 'Moving...' : 'Move Subcomponent'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveSubcomponentModal; 