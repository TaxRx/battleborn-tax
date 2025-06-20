import React, { useState } from 'react';
import { RDTWizardTypes } from './rdtWizardStore';
import { Plus, Trash2 } from 'lucide-react';

interface QRAFormProps {
  initialData?: RDTWizardTypes.QRAEntry;
  onSave: (data: RDTWizardTypes.QRAEntry) => void;
  onBack: () => void;
}

export default function QRAForm({ initialData, onSave, onBack }: QRAFormProps) {
  const [qra, setQRA] = useState<RDTWizardTypes.QRAEntry>(
    initialData || {
      Category: '',
      Area: '',
      Focus: '',
      ResearchActivity: '',
      Subcomponent: '',
      Phase: '',
      Hint: '',
      GeneralDescription: '',
      Goal: '',
      Hypothesis: '',
      Alternatives: '',
      Uncertainties: '',
      DevelopmentProcess: '',
      ResearchLeaderRole: '',
      ClinicianRole: '',
      MidlevelRole: '',
      ClinicalAssistantRole: '',
      InclusionCriteriaAge: '',
      InclusionCriteriaSex: '',
      InclusionCriteriaConsent: '',
      InclusionOther: '',
      ExclusionCriteria1: '',
      ExclusionCriteria2: '',
      ExclusionCriteria3: '',
      OutcomeMeasure1: '',
      OutcomeMeasure2: '',
      StudyType: '',
      Allocation: '',
      PrimaryPurpose: '',
      Enrollment: '',
      TechnicalCategory: '',
      TimePercent: ''
    }
  );

  const handleFieldChange = (field: keyof RDTWizardTypes.QRAEntry, value: string) => {
    setQRA(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(qra);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <input
          type="text"
          value={qra.Category}
          onChange={(e) => handleFieldChange('Category', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          placeholder="Enter category"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Area
        </label>
        <input
          type="text"
          value={qra.Area}
          onChange={(e) => handleFieldChange('Area', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          placeholder="Enter area"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Focus
        </label>
        <input
          type="text"
          value={qra.Focus}
          onChange={(e) => handleFieldChange('Focus', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          placeholder="Enter focus"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Research Activity
        </label>
        <input
          type="text"
          value={qra.ResearchActivity}
          onChange={(e) => handleFieldChange('ResearchActivity', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          placeholder="Enter research activity"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subcomponent
        </label>
        <input
          type="text"
          value={qra.Subcomponent}
          onChange={(e) => handleFieldChange('Subcomponent', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          placeholder="Enter subcomponent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          General Description
        </label>
        <textarea
          value={qra.GeneralDescription}
          onChange={(e) => handleFieldChange('GeneralDescription', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          placeholder="Enter general description"
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Goal
        </label>
        <textarea
          value={qra.Goal}
          onChange={(e) => handleFieldChange('Goal', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          placeholder="Enter goal"
          rows={4}
          required
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Save & Continue
        </button>
      </div>
    </form>
  );
} 