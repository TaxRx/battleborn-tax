import React, { useState } from 'react';
import { RDTWizardTypes } from './rdtWizardStore';
import { v4 as uuidv4 } from 'uuid';

interface SupplyFormProps {
  initialData?: RDTWizardTypes.Supply;
  qras: RDTWizardTypes.QRAEntry[];
  onSave: (data: RDTWizardTypes.Supply) => void;
  onBack: () => void;
}

export default function SupplyForm({
  initialData,
  qras,
  onSave,
  onBack
}: SupplyFormProps) {
  const [supply, setSupply] = useState<RDTWizardTypes.Supply>(
    initialData || {
      id: uuidv4(),
      item: '',
      amount: 0,
      description: ''
    }
  );

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupply(prev => ({
      ...prev,
      item: e.target.value
    }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupply(prev => ({
      ...prev,
      amount: Number(e.target.value) || 0
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSupply(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(supply);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Item Name
        </label>
        <input
          type="text"
          value={supply.item}
          onChange={handleItemChange}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          placeholder="Enter item name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            value={supply.amount}
            onChange={handleAmountChange}
            className="w-full pl-7 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={supply.description}
          onChange={handleDescriptionChange}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          placeholder="Enter description"
          rows={4}
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