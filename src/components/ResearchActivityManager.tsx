import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Archive, 
  ChevronDown, 
  ChevronRight, 
  Building, 
  Users, 
  FileText,
  AlertTriangle,
  Check,
  X,
  Move,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  ResearchActivitiesService, 
  ResearchActivity, 
  ResearchStep, 
  ResearchSubcomponent 
} from '../modules/tax-calculator/services/researchActivitiesService';

interface ResearchActivityManagerProps {
  businessId?: string; // Optional: for business-specific activities
}

interface ActivityWithSteps extends ResearchActivity {
  steps?: (ResearchStep & { subcomponents?: ResearchSubcomponent[] })[];
  expanded?: boolean;
}

const ResearchActivityManager: React.FC<ResearchActivityManagerProps> = ({ businessId }) => {
  const [activities, setActivities] = useState<ActivityWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ResearchActivity | null>(null);
  const [editingStep, setEditingStep] = useState<ResearchStep | null>(null);
  const [editingSubcomponent, setEditingSubcomponent] = useState<ResearchSubcomponent | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showSubcomponentModal, setShowSubcomponentModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [selectedStepId, setSelectedStepId] = useState<string>('');
  const [moveSubcomponentId, setMoveSubcomponentId] = useState<string>('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [availableSteps, setAvailableSteps] = useState<ResearchStep[]>([]);

  // Form states
  const [activityForm, setActivityForm] = useState<Partial<ResearchActivity>>({});
  const [stepForm, setStepForm] = useState<Partial<ResearchStep>>({});
  const [subcomponentForm, setSubcomponentForm] = useState<Partial<ResearchSubcomponent>>({});

  useEffect(() => {
    loadActivities();
  }, [businessId, showInactive]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const activitiesData = showInactive 
        ? await ResearchActivitiesService.getAllResearchActivities(businessId)
        : await ResearchActivitiesService.getActiveResearchActivities(businessId);

      // Load steps and subcomponents for each activity
      const activitiesWithDetails = await Promise.all(
        activitiesData.map(async (activity) => {
          const steps = await ResearchActivitiesService.getResearchSteps(activity.id, !showInactive);
          const stepsWithSubcomponents = await Promise.all(
            steps.map(async (step) => {
              const subcomponents = await ResearchActivitiesService.getResearchSubcomponents(step.id, !showInactive);
              return { ...step, subcomponents };
            })
          );
          return { ...activity, steps: stepsWithSubcomponents, expanded: false };
        })
      );

      setActivities(activitiesWithDetails);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivityExpanded = (activityId: string) => {
    setActivities(activities.map(activity => 
      activity.id === activityId 
        ? { ...activity, expanded: !activity.expanded }
        : activity
    ));
  };

  const openActivityModal = (activity?: ResearchActivity) => {
    if (activity) {
      setEditingActivity(activity);
      setActivityForm(activity);
    } else {
      setEditingActivity(null);
      setActivityForm({
        title: '',
        focus_id: '',
        business_id: businessId,
        default_roles: {},
        default_steps: {},
        is_active: true
      });
    }
    setShowActivityModal(true);
  };

  const openStepModal = (activityId: string, step?: ResearchStep) => {
    setSelectedActivityId(activityId);
    if (step) {
      setEditingStep(step);
      setStepForm(step);
    } else {
      setEditingStep(null);
      setStepForm({
        activity_id: activityId,
        name: '',
        description: '',
        step_order: 1,
        is_active: true
      });
    }
    setShowStepModal(true);
  };

  const openSubcomponentModal = (stepId: string, subcomponent?: ResearchSubcomponent) => {
    setSelectedStepId(stepId);
    if (subcomponent) {
      setEditingSubcomponent(subcomponent);
      setSubcomponentForm(subcomponent);
    } else {
      setEditingSubcomponent(null);
      setSubcomponentForm({
        step_id: stepId,
        name: '',
        description: '',
        subcomponent_order: 1,
        is_active: true
      });
    }
    setShowSubcomponentModal(true);
  };

  const openMoveModal = async (subcomponentId: string) => {
    setMoveSubcomponentId(subcomponentId);
    // Load all active steps for move options
    const allSteps: ResearchStep[] = [];
    for (const activity of activities) {
      if (activity.steps) {
        allSteps.push(...activity.steps.filter(step => step.is_active));
      }
    }
    setAvailableSteps(allSteps);
    setShowMoveModal(true);
  };

  const handleSaveActivity = async () => {
    try {
      if (editingActivity) {
        await ResearchActivitiesService.updateResearchActivity(editingActivity.id, activityForm);
      } else {
        await ResearchActivitiesService.createResearchActivity(activityForm as Omit<ResearchActivity, 'id' | 'created_at' | 'updated_at'>);
      }
      setShowActivityModal(false);
      loadActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleSaveStep = async () => {
    try {
      if (editingStep) {
        await ResearchActivitiesService.updateResearchStep(editingStep.id, stepForm);
      } else {
        await ResearchActivitiesService.createResearchStep(stepForm as Omit<ResearchStep, 'id' | 'created_at' | 'updated_at'>);
      }
      setShowStepModal(false);
      loadActivities();
    } catch (error) {
      console.error('Error saving step:', error);
    }
  };

  const handleSaveSubcomponent = async () => {
    try {
      if (editingSubcomponent) {
        await ResearchActivitiesService.updateResearchSubcomponent(editingSubcomponent.id, subcomponentForm);
      } else {
        await ResearchActivitiesService.createResearchSubcomponent(subcomponentForm as Omit<ResearchSubcomponent, 'id' | 'created_at' | 'updated_at'>);
      }
      setShowSubcomponentModal(false);
      loadActivities();
    } catch (error) {
      console.error('Error saving subcomponent:', error);
    }
  };

  const handleMoveSubcomponent = async (newStepId: string, reason: string) => {
    try {
      await ResearchActivitiesService.moveSubcomponentToStep(moveSubcomponentId, newStepId, reason);
      setShowMoveModal(false);
      loadActivities();
    } catch (error) {
      console.error('Error moving subcomponent:', error);
    }
  };

  const handleDeactivateActivity = async (activity: ResearchActivity) => {
    const reason = prompt('Please provide a reason for deactivating this activity:');
    if (reason) {
      try {
        await ResearchActivitiesService.deactivateResearchActivity(activity.id, reason);
        loadActivities();
      } catch (error) {
        console.error('Error deactivating activity:', error);
      }
    }
  };

  const handleDuplicateActivity = async (activity: ResearchActivity) => {
    const newTitle = prompt('Enter title for duplicated activity:', `${activity.title} (Copy)`);
    if (newTitle) {
      try {
        await ResearchActivitiesService.duplicateResearchActivity(activity.id, newTitle, businessId);
        loadActivities();
      } catch (error) {
        console.error('Error duplicating activity:', error);
      }
    }
  };

  const ActivityCard = ({ activity }: { activity: ActivityWithSteps }) => (
    <div className="border rounded-lg mb-4 bg-white shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleActivityExpanded(activity.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              {activity.expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            <div>
              <h3 className="font-semibold text-lg">{activity.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Focus: {activity.focus}</span>
                <span>Category: {activity.category}</span>
                {activity.business_id && (
                  <span className="flex items-center space-x-1 text-blue-600">
                    <Building size={14} />
                    <span>Business-Specific</span>
                  </span>
                )}
                {!activity.is_active && (
                  <span className="flex items-center space-x-1 text-red-600">
                    <Archive size={14} />
                    <span>Inactive</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openActivityModal(activity)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit Activity"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDuplicateActivity(activity)}
              className="p-2 text-green-600 hover:bg-green-50 rounded"
              title="Duplicate Activity"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => openStepModal(activity.id)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded"
              title="Add Step"
            >
              <Plus size={16} />
            </button>
            {activity.is_active && (
              <button
                onClick={() => handleDeactivateActivity(activity)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Deactivate Activity"
              >
                <Archive size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {activity.expanded && (
        <div className="p-4">
          {activity.steps && activity.steps.length > 0 ? (
            <div className="space-y-3">
              {activity.steps.map((step) => (
                <StepCard key={step.id} step={step} activityId={activity.id} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No steps defined for this activity</p>
              <button
                onClick={() => openStepModal(activity.id)}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add First Step
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const StepCard = ({ step, activityId }: { step: ResearchStep & { subcomponents?: ResearchSubcomponent[] }, activityId: string }) => (
    <div className="border rounded-lg bg-gray-50 ml-8">
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{step.name}</h4>
            <p className="text-sm text-gray-600">{step.description}</p>
            {!step.is_active && (
              <span className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                <Archive size={12} />
                <span>Inactive</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openStepModal(activityId, step)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit Step"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => openSubcomponentModal(step.id)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Add Subcomponent"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {step.subcomponents && step.subcomponents.length > 0 && (
        <div className="p-3 space-y-2">
          {step.subcomponents.map((subcomponent) => (
            <SubcomponentCard key={subcomponent.id} subcomponent={subcomponent} />
          ))}
        </div>
      )}
    </div>
  );

  const SubcomponentCard = ({ subcomponent }: { subcomponent: ResearchSubcomponent }) => (
    <div className="bg-white border rounded p-3 ml-4">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-medium text-sm">{subcomponent.name}</h5>
          <p className="text-xs text-gray-600">{subcomponent.description}</p>
          {!subcomponent.is_active && (
            <span className="text-xs text-red-600 flex items-center space-x-1 mt-1">
              <Archive size={10} />
              <span>Inactive</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => openSubcomponentModal(subcomponent.step_id, subcomponent)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit Subcomponent"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => openMoveModal(subcomponent.id)}
            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            title="Move to Different Step"
          >
            <Move size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading research activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Research Activity Management</h2>
          <p className="text-gray-600">
            Manage research activities, steps, and subcomponents
            {businessId && " for this business"}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center space-x-2 px-4 py-2 rounded ${
              showInactive 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showInactive ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{showInactive ? 'Hide' : 'Show'} Inactive</span>
          </button>
          <button
            onClick={() => openActivityModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>New Activity</span>
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No research activities found</p>
            <p className="mb-4">
              {showInactive 
                ? "No activities exist yet" 
                : "No active activities found. Try showing inactive activities or create a new one."
              }
            </p>
            <button
              onClick={() => openActivityModal()}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Create First Activity
            </button>
          </div>
        )}
      </div>

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingActivity ? 'Edit Activity' : 'Create New Activity'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={activityForm.title || ''}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter activity title..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus
                  </label>
                  <input
                    type="text"
                    value={activityForm.focus || ''}
                    onChange={(e) => setActivityForm({ ...activityForm, focus: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Research focus..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={activityForm.category || ''}
                    onChange={(e) => setActivityForm({ ...activityForm, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Activity category..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area
                  </label>
                  <input
                    type="text"
                    value={activityForm.area || ''}
                    onChange={(e) => setActivityForm({ ...activityForm, area: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Research area..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phase
                  </label>
                  <input
                    type="text"
                    value={activityForm.phase || ''}
                    onChange={(e) => setActivityForm({ ...activityForm, phase: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Development phase..."
                  />
                </div>
              </div>
              {businessId && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="businessSpecific"
                    checked={activityForm.business_id === businessId}
                    onChange={(e) => setActivityForm({ 
                      ...activityForm, 
                      business_id: e.target.checked ? businessId : undefined 
                    })}
                    className="rounded"
                  />
                  <label htmlFor="businessSpecific" className="text-sm text-gray-700">
                    Make this activity business-specific (IP protection)
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowActivityModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveActivity}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingActivity ? 'Update' : 'Create'} Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Modal */}
      {showStepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-xl font-bold mb-4">
              {editingStep ? 'Edit Step' : 'Create New Step'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Name *
                </label>
                <input
                  type="text"
                  value={stepForm.name || ''}
                  onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter step name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={stepForm.description || ''}
                  onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  placeholder="Describe this step..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={stepForm.step_order || 1}
                  onChange={(e) => setStepForm({ ...stepForm, step_order: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStepModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStep}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingStep ? 'Update' : 'Create'} Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subcomponent Modal */}
      {showSubcomponentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingSubcomponent ? 'Edit Subcomponent' : 'Create New Subcomponent'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={subcomponentForm.name || ''}
                    onChange={(e) => setSubcomponentForm({ ...subcomponentForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Subcomponent name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={subcomponentForm.subcomponent_order || 1}
                    onChange={(e) => setSubcomponentForm({ ...subcomponentForm, subcomponent_order: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={subcomponentForm.description || ''}
                  onChange={(e) => setSubcomponentForm({ ...subcomponentForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="Describe this subcomponent..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal
                  </label>
                  <textarea
                    value={subcomponentForm.goal || ''}
                    onChange={(e) => setSubcomponentForm({ ...subcomponentForm, goal: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-16"
                    placeholder="Research goal..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hypothesis
                  </label>
                  <textarea
                    value={subcomponentForm.hypothesis || ''}
                    onChange={(e) => setSubcomponentForm({ ...subcomponentForm, hypothesis: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-16"
                    placeholder="Research hypothesis..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Outcome Type
                  </label>
                  <input
                    type="text"
                    value={subcomponentForm.expected_outcome_type || ''}
                    onChange={(e) => setSubcomponentForm({ ...subcomponentForm, expected_outcome_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Outcome type..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPT Codes
                  </label>
                  <input
                    type="text"
                    value={subcomponentForm.cpt_codes || ''}
                    onChange={(e) => setSubcomponentForm({ ...subcomponentForm, cpt_codes: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="CPT codes..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSubcomponentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubcomponent}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingSubcomponent ? 'Update' : 'Create'} Subcomponent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Subcomponent Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Move Subcomponent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Move to Step
                </label>
                <select
                  value={selectedStepId}
                  onChange={(e) => setSelectedStepId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select a step...</option>
                  {availableSteps.map((step) => (
                    <option key={step.id} value={step.id}>
                      {step.name} (Activity: {activities.find(a => a.steps?.some(s => s.id === step.id))?.title})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Move
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="Explain why this subcomponent is being moved..."
                  onChange={(e) => {
                    // Store reason in a temporary state for the move operation
                    (window as any).moveReason = e.target.value;
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason = (window as any).moveReason || 'Step association change';
                  handleMoveSubcomponent(selectedStepId, reason);
                }}
                disabled={!selectedStepId}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Move Subcomponent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchActivityManager; 