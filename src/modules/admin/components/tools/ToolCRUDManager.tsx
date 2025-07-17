// Epic 3 Sprint 2 Day 4: Tool CRUD Manager Component
// File: ToolCRUDManager.tsx  
// Purpose: Comprehensive tool creation, editing, and lifecycle management interface

import React, { useState, useEffect, useCallback } from 'react';
import AdminToolService, {
  Tool,
  ToolData,
  ToolUpdate,
  ToolFeature,
  ToolPricing
} from '../../services/adminToolService';

interface ToolCRUDManagerProps {
  className?: string;
  onToolCreated?: (tool: Tool) => void;
  onToolUpdated?: (tool: Tool) => void;
  onToolDeleted?: (toolId: string) => void;
}

interface FormData {
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'beta' | 'deprecated';
  version: string;
  config: Record<string, any>;
  features: ToolFeature[];
  pricing: ToolPricing;
  metadata: Record<string, any>;
}

export const ToolCRUDManager: React.FC<ToolCRUDManagerProps> = ({
  className = '',
  onToolCreated,
  onToolUpdated,
  onToolDeleted
}) => {
  // State management
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const toolService = AdminToolService.getInstance();

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [toolsData, categoriesData] = await Promise.all([
        toolService.getAllTools(),
        toolService.getToolCategories()
      ]);

      setTools(toolsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading tool data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [toolService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form handling
  function getInitialFormData(): FormData {
    return {
      name: '',
      slug: '',
      category: '',
      description: '',
      icon: '',
      status: 'inactive',
      version: '1.0.0',
      config: {},
      features: [],
      pricing: {
        basic: {
          price: 0,
          features: [],
          limits: {}
        },
        premium: {
          price: 0,
          features: [],
          limits: {}
        },
        enterprise: {
          price: 0,
          features: [],
          limits: {}
        }
      },
      metadata: {}
    };
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Auto-generate slug from name
    if (field === 'name' && !isEditing) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Tool name is required';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Tool slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      errors.slug = 'Slug must be lowercase with hyphens only';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.version.trim()) {
      errors.version = 'Version is required';
    } else if (!/^\d+\.\d+\.\d+$/.test(formData.version)) {
      errors.version = 'Version must follow semantic versioning (e.g., 1.0.0)';
    }

    // Validate pricing
    const pricingTiers = ['basic', 'premium', 'enterprise'] as const;
    pricingTiers.forEach(tier => {
      if (formData.pricing[tier].price < 0) {
        errors[`pricing_${tier}`] = `${tier} price cannot be negative`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditing && selectedTool) {
        // Update existing tool
        const updates: ToolUpdate = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          icon: formData.icon,
          status: formData.status,
          version: formData.version,
          config: formData.config,
          features: formData.features,
          pricing: formData.pricing,
          metadata: formData.metadata
        };

        const updatedTool = await toolService.updateTool(selectedTool.id, updates);
        
        setTools(prev => prev.map(t => t.id === selectedTool.id ? updatedTool : t));
        onToolUpdated?.(updatedTool);
        
        setIsEditing(false);
        setSelectedTool(null);
      } else {
        // Create new tool
        const toolData: ToolData = {
          name: formData.name,
          slug: formData.slug,
          category: formData.category,
          description: formData.description,
          icon: formData.icon,
          status: formData.status,
          version: formData.version,
          config: formData.config,
          features: formData.features,
          pricing: formData.pricing,
          metadata: formData.metadata
        };

        const newTool = await toolService.createTool(toolData);
        
        setTools(prev => [newTool, ...prev]);
        onToolCreated?.(newTool);
        
        setShowCreateForm(false);
      }

      // Reset form
      setFormData(getInitialFormData());
      setFormErrors({});

      // Reload categories in case a new one was added
      const updatedCategories = await toolService.getToolCategories();
      setCategories(updatedCategories);

    } catch (err) {
      console.error('Error saving tool:', err);
      setError(err instanceof Error ? err.message : 'Failed to save tool');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tool: Tool) => {
    setSelectedTool(tool);
    setFormData({
      name: tool.name,
      slug: tool.slug,
      category: tool.category,
      description: tool.description,
      icon: tool.icon || '',
      status: tool.status,
      version: tool.version || '1.0.0',
      config: tool.config || {},
      features: tool.features || [],
      pricing: tool.pricing || getInitialFormData().pricing,
      metadata: tool.metadata || {}
    });
    setIsEditing(true);
    setShowCreateForm(true);
  };

  const handleDelete = async (tool: Tool) => {
    if (!confirm(`Are you sure you want to delete "${tool.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await toolService.deleteTool(tool.id);
      
      setTools(prev => prev.filter(t => t.id !== tool.id));
      onToolDeleted?.(tool.id);
      
      if (selectedTool?.id === tool.id) {
        setSelectedTool(null);
        setIsEditing(false);
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error('Error deleting tool:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete tool');
    }
  };

  const handleDeactivate = async (tool: Tool, reason?: string) => {
    try {
      setError(null);
      const updatedTool = await toolService.deactivateTool(tool.id, reason);
      setTools(prev => prev.map(t => t.id === tool.id ? updatedTool : t));
    } catch (err) {
      console.error('Error deactivating tool:', err);
      setError(err instanceof Error ? err.message : 'Failed to deactivate tool');
    }
  };

  const handleDuplicate = async (tool: Tool) => {
    const newName = prompt(`Enter name for duplicate of "${tool.name}":`, `${tool.name} (Copy)`);
    if (!newName) return;

    const newSlug = newName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    try {
      setError(null);
      const duplicatedTool = await toolService.duplicateTool(tool.id, newName, newSlug);
      setTools(prev => [duplicatedTool, ...prev]);
      onToolCreated?.(duplicatedTool);
    } catch (err) {
      console.error('Error duplicating tool:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate tool');
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setIsEditing(false);
    setSelectedTool(null);
    setFormData(getInitialFormData());
    setFormErrors({});
  };

  const addFeature = () => {
    const newFeature: ToolFeature = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      enabled: true,
      subscription_levels: ['basic', 'premium', 'enterprise'],
      config: {}
    };
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));
  };

  const updateFeature = (index: number, field: keyof ToolFeature, value: any) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature
      )
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tool Management</h2>
            <p className="text-gray-500 mt-1">Create and manage platform tools</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Tool
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? `Edit Tool: ${selectedTool?.name}` : 'Create New Tool'}
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter tool name"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  disabled={isEditing}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    formErrors.slug ? 'border-red-300' : 'border-gray-300'
                  } ${isEditing ? 'bg-gray-100' : ''}`}
                  placeholder="tool-slug"
                />
                {formErrors.slug && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    formErrors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="__new__">+ Add New Category</option>
                </select>
                {formData.category === '__new__' && (
                  <input
                    type="text"
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-2"
                    placeholder="Enter new category name"
                  />
                )}
                {formErrors.category && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                  <option value="beta">Beta</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version *
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    formErrors.version ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="1.0.0"
                />
                {formErrors.version && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.version}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon URL
                </label>
                <input
                  type="url"
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="https://example.com/icon.svg"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  formErrors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe what this tool does and its main features"
              />
              {formErrors.description && (
                <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
              )}
            </div>

            {/* Features Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Features
                </label>
                <button
                  type="button"
                  onClick={addFeature}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                >
                  Add Feature
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.features.map((feature, index) => (
                  <div key={feature.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Feature {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Feature Name
                        </label>
                        <input
                          type="text"
                          value={feature.name}
                          onChange={(e) => updateFeature(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Feature name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Enabled
                        </label>
                        <select
                          value={feature.enabled ? 'true' : 'false'}
                          onChange={(e) => updateFeature(index, 'enabled', e.target.value === 'true')}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={feature.description}
                        onChange={(e) => updateFeature(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Feature description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isEditing ? 'Update Tool' : 'Create Tool'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tools List */}
      {!showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Tools ({tools.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {tool.icon && (
                          <img
                            src={tool.icon}
                            alt=""
                            className="w-8 h-8 rounded mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tool.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tool.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {tool.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tool.status === 'active' ? 'bg-green-100 text-green-800' :
                        tool.status === 'beta' ? 'bg-yellow-100 text-yellow-800' :
                        tool.status === 'deprecated' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tool.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tool.version || '1.0.0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tool.features?.length || 0} features
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(tool)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit tool"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleDuplicate(tool)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Duplicate tool"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>

                        {tool.status === 'active' && (
                          <button
                            onClick={() => handleDeactivate(tool)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
                            title="Deactivate tool"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(tool)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete tool"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tools.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first tool.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Tool
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolCRUDManager;