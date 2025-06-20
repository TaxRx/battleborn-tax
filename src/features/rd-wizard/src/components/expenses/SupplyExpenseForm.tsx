import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SupplyExpense, ResearchSubcomponent } from '../../types';
import useExpenseStore from '../../store/expenseStore';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

interface Option {
  value: string;
  label: string;
}

const categories: Option[] = [
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'software', label: 'Software' },
  { value: 'other', label: 'Other' },
];

const schema = z.object({
  year: z.number().min(2000, 'Year must be valid'),
  supplierName: z.string().min(1, 'Supplier name is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  amount: z.number().min(0, 'Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  researchPercentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  subcomponentId: z.string().min(1, 'Subcomponent is required'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  expense?: SupplyExpense;
  onClose: () => void;
  subcomponents: ResearchSubcomponent[];
  onSubmit?: (data: any) => void | Promise<void>;
}

export const SupplyExpenseForm: React.FC<Props> = ({ expense, onClose, subcomponents, onSubmit }) => {
  const { addSupplyExpense, updateSupplyExpense } = useExpenseStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: expense || {
      year: new Date().getFullYear(),
      category: 'materials',
      researchPercentage: 0,
      quantity: 1,
      amount: 0,
    },
  });

  const onFormSubmit = async (data: FormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else if (expense) {
        await updateSupplyExpense(expense.id, data);
      } else {
        await addSupplyExpense(data);
        reset();
      }
      onClose();
    } catch (error) {
      console.error('Error submitting supply expense:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <Input
        type="number"
        label="Year"
        {...register('year', { valueAsNumber: true })}
        error={errors.year?.message}
      />

      <Input
        label="Supplier Name"
        {...register('supplierName')}
        error={errors.supplierName?.message}
      />

      <Input
        label="Vendor"
        {...register('vendor')}
        error={errors.vendor?.message}
      />

      <Input
        type="number"
        label="Quantity"
        {...register('quantity', { valueAsNumber: true })}
        error={errors.quantity?.message}
      />

      <Input
        type="number"
        label="Amount"
        {...register('amount', { valueAsNumber: true })}
        error={errors.amount?.message}
      />

      <Select
        label="Category"
        options={categories}
        {...register('category')}
        error={errors.category?.message}
      />

      <Input
        type="number"
        label="Research Percentage"
        {...register('researchPercentage', { valueAsNumber: true })}
        error={errors.researchPercentage?.message}
      />

      <Select
        label="Subcomponent"
        options={subcomponents.map(sc => ({ value: sc.id, label: sc.name }))}
        {...register('subcomponentId')}
        error={errors.subcomponentId?.message}
      />

      <div className="flex gap-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          fullWidth
        >
          {expense ? 'Update' : 'Add'} Supply Expense
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          fullWidth
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}; 