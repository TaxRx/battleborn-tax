import React, { useState } from 'react';
import { ContractorExpense } from '../../types/index';
import Input from '../common/Input';
import Button from '../common/Button';
import useExpenseStore from '../../store/expenseStore';

interface ContractorExpenseFormProps {
  expense?: ContractorExpense;
  onClose: () => void;
  onSubmit?: (data: Omit<ContractorExpense, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
}

const ContractorExpenseForm: React.FC<ContractorExpenseFormProps> = ({ expense, onClose, onSubmit }) => {
  const addContractorExpense = useExpenseStore((state) => state.addContractorExpense);
  const updateContractorExpense = useExpenseStore((state) => state.updateContractorExpense);

  const [formData, setFormData] = useState<Omit<ContractorExpense, 'id' | 'createdAt' | 'updatedAt'>>({
    year: expense?.year || new Date().getFullYear(),
    contractorName: expense?.contractorName || '',
    role: expense?.role || '',
    amount: expense?.amount || 0,
    contractorType: expense?.contractorType || 'individual',
    taxId: expense?.taxId || '',
    startDate: expense?.startDate || '',
    endDate: expense?.endDate || '',
    subcomponentId: expense?.subcomponentId || '',
    researchPercentage: expense?.researchPercentage || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(formData);
    } else {
      if (expense) {
        updateContractorExpense(expense.id, formData);
      } else {
        addContractorExpense(formData);
      }
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Year"
        type="number"
        value={formData.year}
        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
        required
      />
      <Input
        label="Contractor Name"
        value={formData.contractorName}
        onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
        required
      />
      <Input
        label="Role"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        required
      />
      <Input
        label="Amount"
        type="number"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
        required
      />
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Contractor Type</label>
        <select
          value={formData.contractorType}
          onChange={(e) => setFormData({ ...formData, contractorType: e.target.value as 'individual' | 'company' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="individual">Individual</option>
          <option value="company">Company</option>
        </select>
      </div>
      <Input
        label="Tax ID"
        value={formData.taxId}
        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
        required
      />
      <Input
        label="Start Date"
        type="date"
        value={formData.startDate}
        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        required
      />
      <Input
        label="End Date"
        type="date"
        value={formData.endDate}
        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        required
      />
      <Input
        label="Subcomponent ID"
        value={formData.subcomponentId}
        onChange={(e) => setFormData({ ...formData, subcomponentId: e.target.value })}
        required
      />
      <Input
        label="Research Percentage"
        type="number"
        min="0"
        max="100"
        value={formData.researchPercentage}
        onChange={(e) => setFormData({ ...formData, researchPercentage: parseFloat(e.target.value) })}
        required
      />
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {expense ? 'Update' : 'Add'} Expense
        </Button>
      </div>
    </form>
  );
};

export default ContractorExpenseForm; 