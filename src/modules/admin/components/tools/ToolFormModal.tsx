// Tool Form Modal Component
// File: ToolFormModal.tsx
// Purpose: Simple modal for creating and editing tools

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  TagIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import AdminToolService, { Tool, ToolData, ToolUpdate } from '../../services/adminToolService';

interface ToolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool?: Tool | null; // null = create mode, Tool = edit mode
  onToolSaved?: (tool: Tool) => void;
  title?: string;
}

interface FormData {
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
}

interface FormErrors {
  [key: string]: string;
}

const adminToolService = AdminToolService.getInstance();

// Predefined categories
const toolCategories = [
  'Analytics',
  'Communication',
  'CRM', 
  'Documentation',
  'Finance',
  'Marketing',
  'Project Management',
  'Reporting',
  'Sales',
  'Security',
  'Other'
];

export const ToolFormModal: React.FC<ToolFormModalProps> = ({
  isOpen,
  onClose,
  tool = null,
  onToolSaved,
  title
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    category: '',
    description: '',
    icon: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const isEditMode = tool !== null;
  const modalTitle = title || (isEditMode ? 'Edit Tool' : 'Create New Tool');

  // Reset form when modal opens/closes or tool changes
  useEffect(() => {
    if (isOpen) {
      if (tool) {
        // Edit mode - populate with existing tool data
        setFormData({
          name: tool.name || '',
          slug: tool.slug || '',
          category: tool.category || '',
          description: tool.description || '',
          icon: tool.icon || ''
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          slug: '',
          category: '',
          description: '',
          icon: ''
        });
      }
      setErrors({});
      setSubmitError('');
      setSuccess(false);
    }
  }, [isOpen, tool]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditMode && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, isEditMode]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Tool name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tool name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tool name must be less than 100 characters';
    }

    // Slug validation
    if (!formData.slug.trim()) {
      newErrors.slug = 'Tool slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    } else if (formData.slug.length < 2) {
      newErrors.slug = 'Slug must be at least 2 characters';
    } else if (formData.slug.length > 50) {
      newErrors.slug = 'Slug must be less than 50 characters';
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Icon validation (optional but if provided, should be valid)
    if (formData.icon && !/^[\w-]+$/.test(formData.icon)) {
      newErrors.icon = 'Icon should be a valid icon name (letters, numbers, hyphens only)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      let result: Tool;

      if (isEditMode && tool) {
        // Update existing tool
        const updateData: ToolUpdate = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category.trim(),
          icon: formData.icon.trim() || undefined
        };

        result = await adminToolService.updateTool(tool.id, updateData);
      } else {
        // Create new tool
        const toolData: ToolData = {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          category: formData.category.trim(),
          description: formData.description.trim(),
          icon: formData.icon.trim() || undefined
        };

        result = await adminToolService.createTool(toolData);
      }

      setSuccess(true);
      onToolSaved?.(result);
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      console.error('Error saving tool:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save tool');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      category: '',
      description: '',
      icon: ''
    });
    setErrors({});
    setSubmitError('');
    setSuccess(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CogIcon className="h-5 w-5 mr-2 text-blue-600" />
              {modalTitle}
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-green-800 font-medium">
                  Tool {isEditMode ? 'updated' : 'created'} successfully!
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-800">{submitError}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tool Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Tool Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter tool name"
                disabled={isSubmitting}
                maxLength={100}
              />
              {errors.name && (
                <div className="mt-1 text-sm text-red-600">{errors.name}</div>
              )}
            </div>

            {/* Tool Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                <TagIcon className="h-4 w-4 inline mr-1" />
                Slug * {!isEditMode && <span className="text-xs text-gray-500">(auto-generated from name)</span>}
              </label>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.slug ? 'border-red-300' : 'border-gray-300'
                } ${isEditMode ? 'bg-gray-100' : ''}`}
                placeholder="tool-slug"
                disabled={isSubmitting || isEditMode}
                maxLength={50}
              />
              {errors.slug && (
                <div className="mt-1 text-sm text-red-600">{errors.slug}</div>
              )}
              {isEditMode && (
                <div className="mt-1 text-xs text-gray-500">Slug cannot be changed after creation</div>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select a category</option>
                {toolCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <div className="mt-1 text-sm text-red-600">{errors.category}</div>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe what this tool does..."
                disabled={isSubmitting}
                maxLength={500}
              />
              <div className="mt-1 flex justify-between items-center">
                {errors.description ? (
                  <div className="text-sm text-red-600">{errors.description}</div>
                ) : (
                  <div className="text-xs text-gray-500">
                    {formData.description.length}/500 characters
                  </div>
                )}
              </div>
            </div>

            {/* Icon (Optional) */}
            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                <PhotoIcon className="h-4 w-4 inline mr-1" />
                Icon (Optional)
              </label>
              <input
                type="text"
                id="icon"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.icon ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="icon-name (e.g., cog, chart-bar)"
                disabled={isSubmitting}
              />
              {errors.icon && (
                <div className="mt-1 text-sm text-red-600">{errors.icon}</div>
              )}
              <div className="mt-1 text-xs text-gray-500">
                Icon name for UI display (Heroicons format recommended)
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || success}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <CogIcon className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Tool' : 'Create Tool'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ToolFormModal;