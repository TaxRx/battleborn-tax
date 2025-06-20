import React, { useState } from 'react';
import { RDTWizardTypes } from './rdtWizardStore';
import { v4 as uuidv4 } from 'uuid';

interface ContractorFormProps {
  initialData?: RDTWizardTypes.Contractor;
  onSave: (contractor: RDTWizardTypes.Contractor) => void;
  onCancel: () => void;
}

export default function ContractorForm({ initialData, onSave, onCancel }: ContractorFormProps) {
  const [contractor, setContractor] = useState<RDTWizardTypes.Contractor>(
    initialData || {
      id: uuidv4(),
      name: '',
      amount: 0,
      description: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(contractor);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={contractor.name}
          onChange={e => setContractor({ ...contractor, name: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Amount</label>
        <input
          type="number"
          value={contractor.amount}
          onChange={e => setContractor({ ...contractor, amount: Number(e.target.value) || 0 })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={contractor.description}
          onChange={e => setContractor({ ...contractor, description: e.target.value })}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Save
        </button>
      </div>
    </form>
  );
} 