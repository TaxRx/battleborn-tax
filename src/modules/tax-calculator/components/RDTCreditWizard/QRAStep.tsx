import React, { useState } from 'react';
import QRAFormModal from './QRAFormModal';
import { RDTWizardTypes } from './rdtWizardStore';

type QRAEntry = RDTWizardTypes.QRAEntry;

interface QRAStepProps {
  qras: QRAEntry[];
  setQRAs: (qras: QRAEntry[]) => void;
  onNext: () => void;
  onBack: () => void;
  businessCategory: string;
  businessFocus: string;
}

export default function QRAStep({ qras, setQRAs, onNext, onBack, businessCategory, businessFocus }: QRAStepProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQRA, setEditingQRA] = useState<QRAEntry | null>(null);

  // Example: Filter/suggest QRAs based on businessCategory/businessFocus (protocol-specific logic)
  // For now, just display all QRAs, but you can add filtering logic here if needed.

  const handleAdd = () => {
    setEditingQRA(null);
    setModalOpen(true);
  };

  const handleEdit = (qra: QRAEntry) => {
    setEditingQRA(qra);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setQRAs(qras.filter(q => q.id !== id));
  };

  const handleSave = (qra: QRAEntry) => {
    if (editingQRA) {
      setQRAs(qras.map(q => (q.id === qra.id ? qra : q)));
    } else {
      setQRAs([...qras, qra]);
    }
    setModalOpen(false);
  };

  // Calculation summary (if protocol requires)
  // Example: Count of QRAs, or other summary logic
  const qraCount = qras.length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium mb-4">Qualified Research Activities</h3>
      <div className="mb-2 text-sm text-gray-600">
        <b>Business Category:</b> {businessCategory || 'N/A'}<br />
        <b>Business Focus:</b> {businessFocus || 'N/A'}
      </div>
      <button className="mb-4 px-4 py-2 bg-emerald-600 text-white rounded" onClick={handleAdd}>
        Add QRA
      </button>
      <div className="space-y-4">
        {qras.length === 0 && <div className="text-gray-500">No QRAs added yet.</div>}
        {qras.map(qra => (
          <div key={qra.id} className="border rounded p-4 flex flex-col space-y-2">
            <div className="font-bold text-lg">{qra.ResearchActivity}</div>
            <div className="text-sm text-gray-600">{qra.Category} / {qra.Area} / {qra.Focus} / {qra.Subcomponent}</div>
            <div className="text-xs text-gray-500">{qra.GeneralDescription}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><b>Goal:</b> {qra.Goal}</div>
              <div><b>Hypothesis:</b> {qra.Hypothesis}</div>
              <div><b>Alternatives:</b> {qra.Alternatives}</div>
              <div><b>Uncertainties:</b> {qra.Uncertainties}</div>
              <div><b>Development Process:</b> {qra.DevelopmentProcess}</div>
              <div><b>Phase:</b> {qra.Phase}</div>
              <div><b>Hint:</b> {qra.Hint}</div>
              <div><b>Research Leader Role:</b> {qra.ResearchLeaderRole}</div>
              <div><b>Clinician Role:</b> {qra.ClinicianRole}</div>
              <div><b>Midlevel Role:</b> {qra.MidlevelRole}</div>
              <div><b>Clinical Assistant Role:</b> {qra.ClinicalAssistantRole}</div>
              <div><b>Inclusion Criteria Age:</b> {qra.InclusionCriteriaAge}</div>
              <div><b>Inclusion Criteria Sex:</b> {qra.InclusionCriteriaSex}</div>
              <div><b>Inclusion Criteria Consent:</b> {qra.InclusionCriteriaConsent}</div>
              <div><b>Inclusion Other:</b> {qra.InclusionOther}</div>
              <div><b>Exclusion Criteria 1:</b> {qra.ExclusionCriteria1}</div>
              <div><b>Exclusion Criteria 2:</b> {qra.ExclusionCriteria2}</div>
              <div><b>Exclusion Criteria 3:</b> {qra.ExclusionCriteria3}</div>
              <div><b>Outcome Measure 1:</b> {qra.OutcomeMeasure1}</div>
              <div><b>Outcome Measure 2:</b> {qra.OutcomeMeasure2}</div>
              <div><b>Study Type:</b> {qra.StudyType}</div>
              <div><b>Allocation:</b> {qra.Allocation}</div>
              <div><b>Primary Purpose:</b> {qra.PrimaryPurpose}</div>
              <div><b>Enrollment:</b> {qra.Enrollment}</div>
              <div><b>Technical Category:</b> {qra.TechnicalCategory}</div>
              <div><b>Time Percent:</b> {qra.TimePercent}</div>
            </div>
            <div className="flex space-x-2 mt-2">
              <button className="px-3 py-1 border rounded" onClick={() => handleEdit(qra)}>Edit</button>
              <button className="px-3 py-1 border rounded text-red-600" onClick={() => handleDelete(qra.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <QRAFormModal
        open={modalOpen}
        initialData={editingQRA || undefined}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
      <div className="flex justify-between pt-4">
        <button
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          onClick={onNext}
          disabled={qras.length === 0}
        >
          Next
        </button>
      </div>
      <div className="pt-4 text-xs text-gray-500">Total QRAs: {qraCount}</div>
    </div>
  );
} 