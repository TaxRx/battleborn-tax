import React, { useState } from 'react';
import { RDTWizardTypes } from './rdtWizardStore';
import { v4 as uuidv4 } from 'uuid';

interface EmployeeFormProps {
  initialData?: RDTWizardTypes.Employee;
  onSave: (employee: RDTWizardTypes.Employee) => void;
  onCancel: () => void;
}

export default function EmployeeForm({ initialData, onSave, onCancel }: EmployeeFormProps) {
  const [employee, setEmployee] = useState<RDTWizardTypes.Employee>(
    initialData || {
      id: uuidv4(),
      name: '',
      role: '',
      salary: 0
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(employee);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={employee.name}
          onChange={e => setEmployee({ ...employee, name: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Role</label>
        <input
          type="text"
          value={employee.role}
          onChange={e => setEmployee({ ...employee, role: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Salary</label>
        <input
          type="number"
          value={employee.salary}
          onChange={e => setEmployee({ ...employee, salary: Number(e.target.value) || 0 })}
          className="w-full border rounded px-3 py-2"
          required
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