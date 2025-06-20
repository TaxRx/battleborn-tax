import React, { useState } from 'react';
import { RDTWizardTypes } from './rdtWizardStore';
import { v4 as uuidv4 } from 'uuid';

export type QRAEntry = RDTWizardTypes.QRAEntry;

interface QRAFormModalProps {
  initialData?: QRAEntry;
  open: boolean;
  onClose: () => void;
  onSave: (data: QRAEntry) => void;
}

const emptyQRA: QRAEntry = {
  id: '',
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
};

export default function QRAFormModal({ initialData, open, onClose, onSave }: QRAFormModalProps) {
  const [form, setForm] = useState<QRAEntry>(initialData || emptyQRA);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!open) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.Category) errs.Category = 'Category is required';
    if (!form.Area) errs.Area = 'Area is required';
    if (!form.Focus) errs.Focus = 'Focus is required';
    if (!form.ResearchActivity) errs.ResearchActivity = 'Research Activity is required';
    if (!form.Subcomponent) errs.Subcomponent = 'Subcomponent is required';
    if (!form.GeneralDescription) errs.GeneralDescription = 'General Description is required';
    if (!form.Goal) errs.Goal = 'Goal is required';
    // Add more required field checks as needed
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: keyof QRAEntry, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({ ...form, id: form.id || uuidv4() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Qualified Research Activity</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Category</label>
              <input type="text" value={form.Category} onChange={e => handleChange('Category', e.target.value)} className="w-full border rounded px-3 py-2" />
              {errors.Category && <div className="text-red-500 text-xs">{errors.Category}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Area</label>
              <input type="text" value={form.Area} onChange={e => handleChange('Area', e.target.value)} className="w-full border rounded px-3 py-2" />
              {errors.Area && <div className="text-red-500 text-xs">{errors.Area}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Focus</label>
              <input type="text" value={form.Focus} onChange={e => handleChange('Focus', e.target.value)} className="w-full border rounded px-3 py-2" />
              {errors.Focus && <div className="text-red-500 text-xs">{errors.Focus}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Research Activity</label>
              <input type="text" value={form.ResearchActivity} onChange={e => handleChange('ResearchActivity', e.target.value)} className="w-full border rounded px-3 py-2" />
              {errors.ResearchActivity && <div className="text-red-500 text-xs">{errors.ResearchActivity}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Subcomponent</label>
              <input type="text" value={form.Subcomponent} onChange={e => handleChange('Subcomponent', e.target.value)} className="w-full border rounded px-3 py-2" />
              {errors.Subcomponent && <div className="text-red-500 text-xs">{errors.Subcomponent}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Phase</label>
              <input type="text" value={form.Phase} onChange={e => handleChange('Phase', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Hint</label>
              <input type="text" value={form.Hint} onChange={e => handleChange('Hint', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">General Description</label>
              <textarea value={form.GeneralDescription} onChange={e => handleChange('GeneralDescription', e.target.value)} className="w-full border rounded px-3 py-2" rows={2} />
              {errors.GeneralDescription && <div className="text-red-500 text-xs">{errors.GeneralDescription}</div>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Goal</label>
              <textarea value={form.Goal} onChange={e => handleChange('Goal', e.target.value)} className="w-full border rounded px-3 py-2" rows={2} />
              {errors.Goal && <div className="text-red-500 text-xs">{errors.Goal}</div>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Hypothesis</label>
              <textarea value={form.Hypothesis} onChange={e => handleChange('Hypothesis', e.target.value)} className="w-full border rounded px-3 py-2" rows={2} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Alternatives</label>
              <textarea value={form.Alternatives} onChange={e => handleChange('Alternatives', e.target.value)} className="w-full border rounded px-3 py-2" rows={2} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Uncertainties</label>
              <textarea value={form.Uncertainties} onChange={e => handleChange('Uncertainties', e.target.value)} className="w-full border rounded px-3 py-2" rows={2} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Development Process</label>
              <textarea value={form.DevelopmentProcess} onChange={e => handleChange('DevelopmentProcess', e.target.value)} className="w-full border rounded px-3 py-2" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium">Research Leader Role</label>
              <input type="text" value={form.ResearchLeaderRole} onChange={e => handleChange('ResearchLeaderRole', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Clinician Role</label>
              <input type="text" value={form.ClinicianRole} onChange={e => handleChange('ClinicianRole', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Midlevel Role</label>
              <input type="text" value={form.MidlevelRole} onChange={e => handleChange('MidlevelRole', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Clinical Assistant Role</label>
              <input type="text" value={form.ClinicalAssistantRole} onChange={e => handleChange('ClinicalAssistantRole', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Inclusion Criteria: Age</label>
              <input type="text" value={form.InclusionCriteriaAge} onChange={e => handleChange('InclusionCriteriaAge', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Inclusion Criteria: Sex</label>
              <input type="text" value={form.InclusionCriteriaSex} onChange={e => handleChange('InclusionCriteriaSex', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Inclusion Criteria: Consent</label>
              <input type="text" value={form.InclusionCriteriaConsent} onChange={e => handleChange('InclusionCriteriaConsent', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Inclusion Other</label>
              <input type="text" value={form.InclusionOther} onChange={e => handleChange('InclusionOther', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Exclusion Criteria 1</label>
              <input type="text" value={form.ExclusionCriteria1} onChange={e => handleChange('ExclusionCriteria1', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Exclusion Criteria 2</label>
              <input type="text" value={form.ExclusionCriteria2} onChange={e => handleChange('ExclusionCriteria2', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Exclusion Criteria 3</label>
              <input type="text" value={form.ExclusionCriteria3} onChange={e => handleChange('ExclusionCriteria3', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Outcome Measure 1</label>
              <input type="text" value={form.OutcomeMeasure1} onChange={e => handleChange('OutcomeMeasure1', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Outcome Measure 2</label>
              <input type="text" value={form.OutcomeMeasure2} onChange={e => handleChange('OutcomeMeasure2', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Study Type</label>
              <input type="text" value={form.StudyType} onChange={e => handleChange('StudyType', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Allocation</label>
              <input type="text" value={form.Allocation} onChange={e => handleChange('Allocation', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Primary Purpose</label>
              <input type="text" value={form.PrimaryPurpose} onChange={e => handleChange('PrimaryPurpose', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Enrollment</label>
              <input type="text" value={form.Enrollment} onChange={e => handleChange('Enrollment', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Technical Category</label>
              <input type="text" value={form.TechnicalCategory} onChange={e => handleChange('TechnicalCategory', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Time Percent</label>
              <input type="text" value={form.TimePercent} onChange={e => handleChange('TimePercent', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
} 