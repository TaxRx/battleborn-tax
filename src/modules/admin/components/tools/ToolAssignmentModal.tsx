// Epic 3 Sprint 2 Day 3: Enhanced Tool Assignment Modal Component
// File: ToolAssignmentModal.tsx
// Purpose: Comprehensive individual tool assignment with subscription management and renewal workflows

import React, { useState, useEffect, useCallback } from 'react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CogIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BellIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
  InformationCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import AdminToolService, { 
  ToolAssignmentData, 
  ToolAssignmentUpdate, 
  ToolAssignment,
  Account,
  Tool
} from '../../services/adminToolService';

interface ToolAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  toolId?: string;
  existingAssignment?: ToolAssignment;
  onAssignmentComplete?: (assignment: ToolAssignment) => void;
  mode?: 'create' | 'edit';
  showRenewalOptions?: boolean;
  onRenewal?: (assignmentId: string, newExpirationDate: string) => void;
}

const subscriptionLevels = [
  { 
    value: 'basic', 
    label: 'Basic', 
    color: 'bg-gray-100 text-gray-700',
    description: 'Essential features with standard support',
    features: ['Core functionality', 'Email support', 'Basic reports']
  },
  { 
    value: 'premium', 
    label: 'Premium', 
    color: 'bg-blue-100 text-blue-700',
    description: 'Enhanced features with priority support',
    features: ['All Basic features', 'Advanced reporting', 'Priority support', 'Data export']
  },
  { 
    value: 'enterprise', 
    label: 'Enterprise', 
    color: 'bg-purple-100 text-purple-700',
    description: 'Full feature set with dedicated support',
    features: ['All Premium features', 'API access', 'Custom integrations', 'Dedicated support']
  },
  { 
    value: 'trial', 
    label: 'Trial', 
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Time-limited access to premium features',
    features: ['All Premium features', 'Limited time access', 'Trial support']
  },
  { 
    value: 'custom', 
    label: 'Custom', 
    color: 'bg-green-100 text-green-700',
    description: 'Tailored package with custom features',
    features: ['Customized feature set', 'Flexible terms', 'Custom support']
  }
] as const;

const accessLevels = [
  { value: 'read', label: 'Read Only', description: 'View data and reports only' },
  { value: 'write', label: 'Read/Write', description: 'Create and modify data' },
  { value: 'admin', label: 'Admin Access', description: 'Full access including settings' }
] as const;

export const ToolAssignmentModal: React.FC<ToolAssignmentModalProps> = ({
  isOpen,
  onClose,
  accountId,
  toolId,
  existingAssignment,
  onAssignmentComplete,
  mode = 'create'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');
  const [selectedToolId, setSelectedToolId] = useState(toolId || '');
  const [subscriptionLevel, setSubscriptionLevel] = useState<'basic' | 'premium' | 'enterprise' | 'trial' | 'custom'>('basic');
  const [accessLevel, setAccessLevel] = useState('read');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [featuresEnabled, setFeaturesEnabled] = useState<Record<string, boolean>>({});
  const [usageLimits, setUsageLimits] = useState<Record<string, number>>({});
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({});
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [renewalPeriod, setRenewalPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Data state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const adminToolService = AdminToolService.getInstance();

  // Initialize form with existing assignment data
  useEffect(() => {
    if (existingAssignment && mode === 'edit') {
      setSelectedAccountId(existingAssignment.account_id);
      setSelectedToolId(existingAssignment.tool_id);
      setSubscriptionLevel(existingAssignment.subscription_level);
      setAccessLevel(existingAssignment.access_level);
      setExpiresAt(existingAssignment.expires_at ? existingAssignment.expires_at.split('T')[0] : '');
      setNotes(existingAssignment.notes || '');
      setFeaturesEnabled(existingAssignment.features_enabled || {});
      setUsageLimits(existingAssignment.usage_limits || {});
      
      // Initialize new fields with defaults or existing values
      setNotificationSettings(existingAssignment.notification_settings || {
        expires_soon: true,
        usage_limit_reached: true,
        feature_updates: false
      });
      setAutoRenewal(existingAssignment.auto_renewal || false);
      setRenewalPeriod(existingAssignment.renewal_period || 'monthly');
    }
  }, [existingAssignment, mode]);

  // Load accounts and tools when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Update selected tool when toolId changes
  useEffect(() => {
    if (selectedToolId && tools.length > 0) {
      const tool = tools.find(t => t.id === selectedToolId);
      setSelectedTool(tool || null);
    }
  }, [selectedToolId, tools]);

  const loadData = async () => {
    try {
      const [accountsData, toolsData] = await Promise.all([
        adminToolService.getAccountsForMatrix(),
        adminToolService.getAllTools()
      ]);
      setAccounts(accountsData);
      setTools(toolsData);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  // Enhanced validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!selectedAccountId) {
      errors.account = 'Please select an account';
    }
    if (!selectedToolId) {
      errors.tool = 'Please select a tool';
    }
    if (expiresAt) {
      const expireDate = new Date(expiresAt);
      const today = new Date();
      if (expireDate <= today) {
        errors.expires = 'Expiration date must be in the future';
      }
      if (subscriptionLevel === 'trial' && expireDate > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        errors.expires = 'Trial subscriptions cannot exceed 30 days';
      }
    }
    if (subscriptionLevel === 'trial' && !expiresAt) {
      errors.expires = 'Trial subscriptions must have an expiration date';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedAccountId, selectedToolId, expiresAt, subscriptionLevel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result: ToolAssignment;

      if (mode === 'create') {
        const assignmentData: ToolAssignmentData = {
          accountId: selectedAccountId,
          toolId: selectedToolId,
          subscriptionLevel,
          accessLevel,
          expiresAt: expiresAt || undefined,
          notes: notes || undefined,
          featuresEnabled,
          usageLimits,
          notificationSettings,
          autoRenewal,
          renewalPeriod: autoRenewal ? renewalPeriod : undefined
        };

        result = await adminToolService.assignTool(assignmentData);
      } else {
        const updateData: ToolAssignmentUpdate = {
          subscriptionLevel,
          accessLevel,
          expiresAt: expiresAt || null,
          notes: notes || undefined,
          featuresEnabled,
          usageLimits,
          notificationSettings,
          autoRenewal,
          renewalPeriod: autoRenewal ? renewalPeriod : undefined
        };

        result = await adminToolService.updateAssignment(selectedAccountId, selectedToolId, updateData);
      }

      setSuccess(true);
      onAssignmentComplete?.(result);
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAccountId(accountId || '');
    setSelectedToolId(toolId || '');
    setSubscriptionLevel('basic');
    setAccessLevel('read');
    setExpiresAt('');
    setNotes('');
    setFeaturesEnabled({});
    setUsageLimits({});
    setNotificationSettings({
      expires_soon: true,
      usage_limit_reached: true,
      feature_updates: false
    });
    setAutoRenewal(false);
    setRenewalPeriod('monthly');
    setValidationErrors({});
    setShowAdvancedOptions(false);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleFeatureToggle = (feature: string, enabled: boolean) => {
    setFeaturesEnabled(prev => ({
      ...prev,
      [feature]: enabled
    }));
  };

  const handleUsageLimitChange = (limit: string, value: number) => {
    setUsageLimits(prev => ({
      ...prev,
      [limit]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <CogIcon className="h-6 w-6 mr-2" />
            {mode === 'create' ? 'Assign Tool' : 'Edit Tool Assignment'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-800 font-medium">
                Tool assignment {mode === 'create' ? 'created' : 'updated'} successfully!
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Account and Tool Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={mode === 'edit'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                required
              >
                <option value="">Select an account...</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CogIcon className="h-4 w-4 inline mr-1" />
                Tool
              </label>
              <select
                value={selectedToolId}
                onChange={(e) => setSelectedToolId(e.target.value)}
                disabled={mode === 'edit'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                required
              >
                <option value="">Select a tool...</option>
                {tools.map(tool => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name} ({tool.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tool Description */}
          {selectedTool && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{selectedTool.name}</h4>
              <p className="text-sm text-gray-600">{selectedTool.description}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                {selectedTool.category}
              </span>
            </div>
          )}

          {/* Subscription Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subscription Level
            </label>
            <div className="space-y-3">
              {subscriptionLevels.map(level => (
                <div key={level.value}>
                  <button
                    type="button"
                    onClick={() => setSubscriptionLevel(level.value)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                      subscriptionLevel === level.value
                        ? `${level.color} border-current`
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm opacity-75">{level.description}</div>
                      </div>
                      <InformationCircleIcon className="h-5 w-5 opacity-50" />
                    </div>
                  </button>
                  {subscriptionLevel === level.value && (
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <div className="text-sm text-gray-600">
                        <div className="font-medium mb-1">Included features:</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {level.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {validationErrors.subscription && (
                <div className="text-red-600 text-sm">{validationErrors.subscription}</div>
              )}
            </div>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Level
            </label>
            <div className="space-y-2">
              {accessLevels.map(level => (
                <label key={level.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="accessLevel"
                    value={level.value}
                    checked={accessLevel === level.value}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{level.label}</div>
                    <div className="text-sm text-gray-500">{level.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Expiration Date and Renewal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Expiration Date {subscriptionLevel === 'trial' && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-3">
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.expires ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.expires && (
                <div className="text-red-600 text-sm">{validationErrors.expires}</div>
              )}
              
              {/* Auto-renewal options */}
              {expiresAt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRenewal}
                      onChange={(e) => setAutoRenewal(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center">
                      <ArrowPathIcon className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-sm font-medium text-blue-800">Enable auto-renewal</span>
                    </div>
                  </label>
                  
                  {autoRenewal && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        Renewal Period
                      </label>
                      <select
                        value={renewalPeriod}
                        onChange={(e) => setRenewalPeriod(e.target.value as any)}
                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                {subscriptionLevel === 'trial' 
                  ? 'Trial subscriptions require an expiration date (max 30 days)'
                  : 'Leave empty for permanent access'
                }
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="h-4 w-4 inline mr-1" />
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about this assignment..."
            />
          </div>

          {/* Advanced Options Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <CogIcon className="h-4 w-4" />
              <span>Advanced Options</span>
              {showAdvancedOptions ? 
                <ChevronUpIcon className="h-4 w-4" /> : 
                <ChevronDownIcon className="h-4 w-4" />
              }
            </button>
          </div>

          {/* Advanced Options Panel */}
          {showAdvancedOptions && (
            <div className="space-y-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              {/* Feature Controls for Premium+ */}
              {subscriptionLevel !== 'basic' && selectedTool && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
                    Feature Access
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'advanced_reporting', label: 'Advanced Reporting', description: 'Access to detailed analytics and custom reports' },
                      { key: 'data_export', label: 'Data Export', description: 'Export data in various formats (CSV, Excel, PDF)' },
                      { key: 'api_access', label: 'API Access', description: 'Programmatic access to tool functionality' },
                      { key: 'bulk_operations', label: 'Bulk Operations', description: 'Process multiple items simultaneously' },
                      { key: 'white_labeling', label: 'White Labeling', description: 'Custom branding and white-label options' }
                    ].map(feature => (
                      <label key={feature.key} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-white rounded">
                        <input
                          type="checkbox"
                          checked={featuresEnabled[feature.key] || false}
                          onChange={(e) => handleFeatureToggle(feature.key, e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-700">{feature.label}</div>
                          <div className="text-xs text-gray-500">{feature.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BellIcon className="h-4 w-4 inline mr-1" />
                  Notification Settings
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'expires_soon', label: 'Expiration Warnings', description: 'Notify when access is about to expire' },
                    { key: 'usage_limit_reached', label: 'Usage Limit Alerts', description: 'Notify when approaching usage limits' },
                    { key: 'feature_updates', label: 'Feature Updates', description: 'Notify about new features and improvements' },
                    { key: 'security_alerts', label: 'Security Alerts', description: 'Notify about security-related events' }
                  ].map(setting => (
                    <label key={setting.key} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-white rounded">
                      <input
                        type="checkbox"
                        checked={notificationSettings[setting.key] || false}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700">{setting.label}</div>
                        <div className="text-xs text-gray-500">{setting.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

              {/* Usage Limits for Enterprise */}
              {(subscriptionLevel === 'enterprise' || subscriptionLevel === 'custom') && showAdvancedOptions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ChartBarIcon className="h-4 w-4 inline mr-1" />
                    Usage Limits & Quotas
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'api_calls_per_month', label: 'API Calls per Month', unit: 'calls' },
                      { key: 'exports_per_month', label: 'Exports per Month', unit: 'exports' },
                      { key: 'storage_gb', label: 'Storage Limit', unit: 'GB' },
                      { key: 'concurrent_users', label: 'Concurrent Users', unit: 'users' },
                      { key: 'reports_per_month', label: 'Reports per Month', unit: 'reports' },
                      { key: 'integrations_limit', label: 'Active Integrations', unit: 'integrations' }
                    ].map(limit => (
                      <div key={limit.key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {limit.label}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={usageLimits[limit.key] || ''}
                            onChange={(e) => handleUsageLimitChange(limit.key, parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="Unlimited"
                            min="0"
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                            {limit.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Leave empty for unlimited usage. Limits reset monthly.
                  </div>
                </div>
              )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>Changes are applied immediately</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success || Object.keys(validationErrors).length > 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {mode === 'create' ? 'Assigning...' : 'Updating...'}
                  </div>
                ) : (
                  mode === 'create' ? 'Assign Tool' : 'Update Assignment'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ToolAssignmentModal;