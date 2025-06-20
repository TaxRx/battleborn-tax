import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusIcon } from 'lucide-react';
import Button from './common/Button';
import Modal from './common/Modal';
import Input from './common/Input';
import { useTodos } from '../hooks/useTodos';

interface CreateTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

type TodoFormData = z.infer<typeof todoSchema>;

const CreateTodoModal: React.FC<CreateTodoModalProps> = ({ isOpen, onClose }) => {
  const { addTodo } = useTodos();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
  });

  const onSubmit = async (data: TodoFormData) => {
    try {
      setIsSubmitting(true);
      await addTodo({
        title: data.title,
        description: data.description || '',
        completed: false,
      });
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Todo"
      contentClassName="space-y-6"
      footer={
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Create Todo
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Input
            label="Title"
            {...register('title')}
            error={errors.title?.message}
            placeholder="Enter todo title"
            autoFocus
          />
          <Input
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Enter todo description (optional)"
            multiline
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateTodoModal; 