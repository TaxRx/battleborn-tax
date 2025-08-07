// ========================================
// STEP COMPLETION INTEGRATION EXAMPLE
// ========================================
// This file shows how to integrate the StepCompletionBanner into wizard steps

import React, { useState, useEffect } from 'react';
import StepCompletionBanner from '../components/common/StepCompletionBanner';
import StepCompletionService from '../services/stepCompletionService';

// Example: Business Setup Step Integration
const BusinessSetupStepExample: React.FC<{ businessYearId: string }> = ({ businessYearId }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [businessData, setBusinessData] = useState({
    businessName: '',
    ein: '',
    entityType: ''
  });

  useEffect(() => {
    // Load step completion status
    const loadStepStatus = async () => {
      const completionData = await StepCompletionService.loadStepCompletion(businessYearId);
      setIsLocked(completionData.businessSetup);
    };
    
    loadStepStatus();
  }, [businessYearId]);

  const handleCompletionChange = (completed: boolean) => {
    setIsLocked(completed);
    
    if (completed) {
      // When step is completed, disable all form fields
      console.log('Business Setup step locked - forms disabled');
    } else {
      // When step is unlocked, enable form fields
      console.log('Business Setup step unlocked - forms enabled');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Completion Banner */}
      <StepCompletionBanner
        stepName="businessSetup"
        stepDisplayName="Business Setup"
        businessYearId={businessYearId}
        onCompletionChange={handleCompletionChange}
        description="Complete business information and entity details."
      />

      {/* Form Content - Disabled when locked */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Business Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={businessData.businessName}
              onChange={(e) => setBusinessData(prev => ({ ...prev, businessName: e.target.value }))}
              disabled={isLocked}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="Enter business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              EIN
            </label>
            <input
              type="text"
              value={businessData.ein}
              onChange={(e) => setBusinessData(prev => ({ ...prev, ein: e.target.value }))}
              disabled={isLocked}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="XX-XXXXXXX"
            />
          </div>
        </div>

        {isLocked && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-700">
              🔒 This step is locked. Unlock it above to make changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Example: Research Activities Step Integration
const ResearchActivitiesStepExample: React.FC<{ businessYearId: string }> = ({ businessYearId }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const handleCompletionChange = (completed: boolean) => {
    setIsLocked(completed);
  };

  const handleActivityToggle = (activityId: string) => {
    if (isLocked) return; // Prevent changes when locked

    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Completion Banner */}
      <StepCompletionBanner
        stepName="researchActivities"
        stepDisplayName="Research Activities"
        businessYearId={businessYearId}
        onCompletionChange={handleCompletionChange}
        description="Select and configure research activities for this tax year."
      />

      {/* Activities List - Disabled when locked */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Select Research Activities</h3>
        
        <div className="space-y-3">
          {['Software Development', 'Process Improvement', 'Product Testing'].map((activity) => (
            <label
              key={activity}
              className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                isLocked ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={selectedActivities.includes(activity)}
                onChange={() => handleActivityToggle(activity)}
                disabled={isLocked}
                className="mr-3"
              />
              <span className="text-sm font-medium">{activity}</span>
            </label>
          ))}
        </div>

        {isLocked && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-700">
              🔒 Research activities are locked. Unlock above to modify selections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Example: Research Design Step Integration  
const ResearchDesignStepExample: React.FC<{ businessYearId: string }> = ({ businessYearId }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [designData, setDesignData] = useState({
    hypothesis: '',
    methodology: '',
    objectives: ''
  });

  const handleCompletionChange = (completed: boolean) => {
    setIsLocked(completed);
  };

  return (
    <div className="space-y-6">
      {/* Step Completion Banner */}
      <StepCompletionBanner
        stepName="researchDesign"
        stepDisplayName="Research Design"
        businessYearId={businessYearId}
        onCompletionChange={handleCompletionChange}
        description="Define research methodology and design parameters."
      />

      {/* Design Form - Disabled when locked */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Research Design Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Hypothesis
            </label>
            <textarea
              value={designData.hypothesis}
              onChange={(e) => setDesignData(prev => ({ ...prev, hypothesis: e.target.value }))}
              disabled={isLocked}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              rows={3}
              placeholder="Describe your research hypothesis..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Methodology
            </label>
            <textarea
              value={designData.methodology}
              onChange={(e) => setDesignData(prev => ({ ...prev, methodology: e.target.value }))}
              disabled={isLocked}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              rows={3}
              placeholder="Describe your research methodology..."
            />
          </div>
        </div>

        {isLocked && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-700">
              🔒 Research design is locked and cannot be modified.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Example: Calculations Step Integration
const CalculationsStepExample: React.FC<{ businessYearId: string }> = ({ businessYearId }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [creditValues, setCreditValues] = useState({
    federalCredit: 0,
    stateCredit: 0
  });

  const handleCompletionChange = (completed: boolean) => {
    setIsLocked(completed);
  };

  return (
    <div className="space-y-6">
      {/* Step Completion Banner */}
      <StepCompletionBanner
        stepName="calculations"
        stepDisplayName="Tax Credit Calculations"
        businessYearId={businessYearId}
        onCompletionChange={handleCompletionChange}
        description="Finalize federal and state R&D tax credit calculations."
      />

      {/* Calculations Form - Disabled when locked */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Tax Credit Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Federal Credit
            </label>
            <input
              type="number"
              value={creditValues.federalCredit}
              onChange={(e) => setCreditValues(prev => ({ ...prev, federalCredit: parseFloat(e.target.value) || 0 }))}
              disabled={isLocked}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State Credit
            </label>
            <input
              type="number"
              value={creditValues.stateCredit}
              onChange={(e) => setCreditValues(prev => ({ ...prev, stateCredit: parseFloat(e.target.value) || 0 }))}
              disabled={isLocked}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="0.00"
            />
          </div>
        </div>

        {isLocked && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">
              ✅ Tax credit calculations are locked and finalized.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export {
  BusinessSetupStepExample,
  ResearchActivitiesStepExample,
  ResearchDesignStepExample,
  CalculationsStepExample
};