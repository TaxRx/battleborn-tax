import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent as DndKitDragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { 
  Building, 
  Plus, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Search,
  Filter,
  X,
  Upload
} from 'lucide-react';
import { 
  ResearchActivitiesService, 
  ResearchActivity, 
  ResearchStep, 
  ResearchSubcomponent 
} from '../../modules/tax-calculator/services/researchActivitiesService';
import { supabase } from '../../lib/supabase';
import { 
  ResearchActivityManagerProps, 
  ActivityWithSteps, 
  DragEndEvent 
} from './types';
import ActivityCard from './ActivityCard';
import SubcomponentCard from './SubcomponentCard';
import SubcomponentModal from './SubcomponentModal';
import MoveSubcomponentModal from './MoveSubcomponentModal';
import AddFilterEntryModal from './AddFilterEntryModal';
import EditActivityModal from './EditActivityModal';
import EditStepModal from './EditStepModal';
import CSVImportModal from './CSVImportModal';
import EditableSelectableChip from './EditableSelectableChip';
import EditFocusModal from './EditFocusModal';

// Filter data interfaces
interface ResearchCategory {
  id: string;
  name: string;
  description?: string;
}

interface ResearchArea {
  id: string;
  name: string;
  category_id: string;
  description?: string;
}

interface ResearchFocus {
  id: string;
  name: string;
  area_id: string;
  description?: string;
}

// Selectable chip component
interface SelectableChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  color: 'blue' | 'green' | 'purple';
  count?: number;
}

const SelectableChip: React.FC<SelectableChipProps> = ({ label, selected, onToggle, color, count }) => {
  const colorClasses = {
    blue: selected 
      ? 'bg-blue-600 text-white border-blue-600' 
      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    green: selected 
      ? 'bg-green-600 text-white border-green-600' 
      : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    purple: selected 
      ? 'bg-purple-600 text-white border-purple-600' 
      : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
  };

  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${colorClasses[color]}`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 text-xs ${selected ? 'text-blue-200' : 'text-gray-500'}`}>
          ({count})
        </span>
      )}
    </button>
  );
};

const ModularResearchActivityManager: React.FC<ResearchActivityManagerProps> = ({ 
  businessId 
}) => {
  const [activities, setActivities] = useState<ActivityWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filter data states
  const [categories, setCategories] = useState<ResearchCategory[]>([]);
  const [areas, setAreas] = useState<ResearchArea[]>([]);
  const [focuses, setFocuses] = useState<ResearchFocus[]>([]);
  
  // Selected filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedFocuses, setSelectedFocuses] = useState<string[]>([]);

  // Modal states
  const [showSubcomponentModal, setShowSubcomponentModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [editingSubcomponent, setEditingSubcomponent] = useState<ResearchSubcomponent | null>(null);
  const [selectedStepId, setSelectedStepId] = useState('');
  const [moveSubcomponentId, setMoveSubcomponentId] = useState('');
  const [moveFromStepId, setMoveFromStepId] = useState('');

  // Add new filter entry states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddFocusModal, setShowAddFocusModal] = useState(false);
  
  // Edit activity modal state
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ResearchActivity | null>(null);

  // Edit step modal state
  const [showEditStepModal, setShowEditStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<ResearchStep | null>(null);
  const [editingStepActivityId, setEditingStepActivityId] = useState<string>('');

  // CSV import modal state
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);

  // Edit focus modal state
  const [showEditFocusModal, setShowEditFocusModal] = useState(false);
  const [editingFocus, setEditingFocus] = useState<ResearchFocus | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load filter data
  const loadFilterData = async () => {
    try {
      const [categoriesResult, areasResult, focusesResult] = await Promise.all([
        supabase.from('rd_research_categories').select('*').order('name'),
        supabase.from('rd_areas').select('*').order('name'),
        supabase.from('rd_focuses').select('*').order('name')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (areasResult.error) throw areasResult.error;
      if (focusesResult.error) throw focusesResult.error;

      setCategories(categoriesResult.data || []);
      setAreas(areasResult.data || []);
      setFocuses(focusesResult.data || []);
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  // Filter toggle handlers
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
    // Clear dependent selections
    setSelectedAreas([]);
    setSelectedFocuses([]);
  };

  const handleAreaToggle = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
    // Clear dependent selections
    setSelectedFocuses([]);
  };

  const handleFocusToggle = (focusId: string) => {
    setSelectedFocuses(prev => 
      prev.includes(focusId) 
        ? prev.filter(id => id !== focusId)
        : [...prev, focusId]
    );
  };

  // Filter helper functions
  const getAvailableAreas = () => {
    if (selectedCategories.length === 0) return areas;
    return areas.filter(area => selectedCategories.includes(area.category_id));
  };

  const getAvailableFocuses = () => {
    const availableAreas = getAvailableAreas();
    if (selectedAreas.length === 0) {
      return focuses.filter(focus => availableAreas.some(area => area.id === focus.area_id));
    }
    return focuses.filter(focus => selectedAreas.includes(focus.area_id));
  };

  // Get activity count for filters
  const getActivityCountForCategory = (categoryId: string) => {
    const categoryAreas = areas.filter(a => a.category_id === categoryId);
    const categoryFocuses = focuses.filter(f => categoryAreas.some(a => a.id === f.area_id));
    return activities.filter(activity => 
      categoryFocuses.some(f => f.id === activity.focus_id)
    ).length;
  };

  const getActivityCountForArea = (areaId: string) => {
    const areaFocuses = focuses.filter(f => f.area_id === areaId);
    return activities.filter(activity => 
      areaFocuses.some(f => f.id === activity.focus_id)
    ).length;
  };

  const getActivityCountForFocus = (focusId: string) => {
    return activities.filter(activity => activity.focus_id === focusId).length;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedAreas([]);
    setSelectedFocuses([]);
  };

  // Handle edit focus
  const handleEditFocus = (focus: ResearchFocus) => {
    setEditingFocus(focus);
    setShowEditFocusModal(true);
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading research activities...');
      
      // Load activities with their steps and subcomponents
      const loadedActivities = businessId 
        ? await ResearchActivitiesService.getAllResearchActivities(businessId)
        : await ResearchActivitiesService.getAllResearchActivities();

      // Fetch steps and subcomponents for each activity
      const activitiesWithSteps: ActivityWithSteps[] = await Promise.all(
        loadedActivities.map(async (activity) => {
          try {
            const steps = await ResearchActivitiesService.getResearchSteps(activity.id, !showInactive);
            
            // Fetch subcomponents for each step
            const stepsWithSubcomponents = await Promise.all(
              steps.map(async (step) => {
                try {
                  const subcomponents = await ResearchActivitiesService.getResearchSubcomponents(step.id, !showInactive);
                  return {
                    ...step,
                    subcomponents: subcomponents || [],
                    expanded: false
                  };
                } catch (error) {
                  console.error(`Error loading subcomponents for step ${step.id}:`, error);
                  return {
                    ...step,
                    subcomponents: [],
                    expanded: false
                  };
                }
              })
            );

            return {
              ...activity,
              steps: stepsWithSubcomponents,
              expanded: false
            };
          } catch (error) {
            console.error(`Error loading steps for activity ${activity.id}:`, error);
            return {
              ...activity,
              steps: [],
              expanded: false
            };
          }
        })
      );

      setActivities(activitiesWithSteps);
      console.log('✅ Loaded activities with hierarchical structure:', activitiesWithSteps);
    } catch (error) {
      console.error('❌ Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
    loadActivities();
  }, [businessId, showInactive]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DndKitDragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle step reordering
    if (activeData?.type === 'step' && overData?.type === 'step') {
      const activeStepId = active.id as string;
      const overStepId = over.id as string;

      if (activeStepId !== overStepId) {
        try {
          // Find the activity that contains both steps
          const activity = activities.find(act => 
            act.steps.some(step => step.id === activeStepId) && 
            act.steps.some(step => step.id === overStepId)
          );

          if (activity) {
            const steps = activity.steps.filter(step => step.is_active);
            const oldIndex = steps.findIndex(step => step.id === activeStepId);
            const newIndex = steps.findIndex(step => step.id === overStepId);

            // Create new order array
            const reorderedSteps = arrayMove(steps, oldIndex, newIndex);
            
            // Update step_order in database
            const updatePromises = reorderedSteps.map((step, index) => 
              ResearchActivitiesService.updateResearchStep(step.id, { 
                ...step, 
                step_order: index + 1 
              })
            );

            await Promise.all(updatePromises);
            loadActivities(); // Refresh data
          }
        } catch (error) {
          console.error('Error reordering steps:', error);
        }
      }
    }

    // Handle subcomponent movement between steps
    if (activeData?.type === 'subcomponent' && overData?.type === 'step') {
      const subcomponent = activeData.subcomponent;
      const fromStepId = activeData.stepId;
      const toStepId = overData.stepId;

      if (fromStepId !== toStepId) {
        try {
          await ResearchActivitiesService.moveSubcomponentToStep(
            subcomponent.id,
            toStepId,
            'Moved via drag and drop'
          );
          loadActivities(); // Refresh data
        } catch (error) {
          console.error('Error moving subcomponent:', error);
        }
      }
    }

    // Handle reordering within the same step
    if (activeData?.type === 'subcomponent' && overData?.type === 'subcomponent') {
      const fromStepId = activeData.stepId;
      const toStepId = overData.stepId;

      if (fromStepId === toStepId) {
        // Reorder within the same step
        setActivities(prevActivities => {
          return prevActivities.map(activity => ({
            ...activity,
            steps: activity.steps.map(step => {
              if (step.id === fromStepId) {
                const oldIndex = step.subcomponents.findIndex(sub => sub.id === active.id);
                const newIndex = step.subcomponents.findIndex(sub => sub.id === over.id);
                
                return {
                  ...step,
                  subcomponents: arrayMove(step.subcomponents, oldIndex, newIndex)
                };
              }
              return step;
            })
          }));
        });

        // TODO: Update the order in the backend
        console.log('Reordered subcomponents within step:', fromStepId);
      }
    }
  };

  const handleToggleActivityExpanded = (activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, expanded: !activity.expanded }
        : activity
    ));
  };

  const handleEditActivity = (activity: ResearchActivity) => {
    setEditingActivity(activity);
    setShowEditActivityModal(true);
  };

  const handleEditStep = (step: ResearchStep, activityId: string) => {
    setEditingStep(step);
    setEditingStepActivityId(activityId);
    setShowEditStepModal(true);
  };

  const handleAddStep = (activityId: string) => {
    setEditingStep(null);
    setEditingStepActivityId(activityId);
    setShowEditStepModal(true);
  };

  const handleDuplicateActivity = async (activity: ResearchActivity) => {
    try {
      await ResearchActivitiesService.duplicateResearchActivity(activity.id, businessId);
      loadActivities();
    } catch (error) {
      console.error('Error duplicating activity:', error);
    }
  };

  const handleDeactivateActivity = async (activity: ResearchActivity) => {
    try {
      await ResearchActivitiesService.deactivateResearchActivity(activity.id, 'Deactivated via UI');
      loadActivities();
    } catch (error) {
      console.error('Error deactivating activity:', error);
    }
  };

  const handleAddSubcomponent = (stepId: string) => {
    setSelectedStepId(stepId);
    setEditingSubcomponent(null);
    setShowSubcomponentModal(true);
  };

  const handleEditSubcomponent = (subcomponent: ResearchSubcomponent) => {
    setEditingSubcomponent(subcomponent);
    setSelectedStepId(subcomponent.step_id);
    setShowSubcomponentModal(true);
  };

  const handleMoveSubcomponent = (subcomponentId: string, fromStepId: string) => {
    setMoveSubcomponentId(subcomponentId);
    setMoveFromStepId(fromStepId);
    setShowMoveModal(true);
  };

  const handleSaveSubcomponent = async (subcomponentData: Omit<ResearchSubcomponent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingSubcomponent) {
        await ResearchActivitiesService.updateResearchSubcomponent(editingSubcomponent.id, subcomponentData);
      } else {
        await ResearchActivitiesService.createResearchSubcomponent(subcomponentData);
      }
      loadActivities();
    } catch (error) {
      console.error('Error saving subcomponent:', error);
      throw error;
    }
  };

  const handleMoveSubcomponentToStep = async (targetStepId: string) => {
    try {
      await ResearchActivitiesService.moveSubcomponentToStep(
        moveSubcomponentId,
        targetStepId,
        'Moved via move modal'
      );
      loadActivities();
    } catch (error) {
      console.error('Error moving subcomponent:', error);
      throw error;
    }
  };

  // Get all steps for modals
  const allSteps = activities.flatMap(activity => activity.steps);

  // Filter activities based on search and filter selections
  const filteredActivities = activities.filter(activity => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = activity.title.toLowerCase().includes(searchLower) ||
             activity.category?.toLowerCase().includes(searchLower) ||
             activity.focus?.toLowerCase().includes(searchLower);
      if (!searchMatch) return false;
    }

    // Category/Area/Focus filter
    if (selectedFocuses.length > 0) {
      return selectedFocuses.includes(activity.focus_id);
    }
    
    if (selectedAreas.length > 0) {
      const focus = focuses.find(f => f.id === activity.focus_id);
      return focus && selectedAreas.includes(focus.area_id);
    }
    
    if (selectedCategories.length > 0) {
      const focus = focuses.find(f => f.id === activity.focus_id);
      const area = focus ? areas.find(a => a.id === focus.area_id) : null;
      return area && selectedCategories.includes(area.category_id);
    }

    return true;
  });

  // Get the dragging subcomponent for overlay
  const draggingSubcomponent = activeId 
    ? activities
        .flatMap(a => a.steps)
        .flatMap(s => s.subcomponents)
        .find(sub => sub.id === activeId)
    : null;

  const draggingStepId = draggingSubcomponent 
    ? activities
        .flatMap(a => a.steps)
        .find(s => s.subcomponents.some(sub => sub.id === activeId))?.id
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading research activities...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Research Activities Management
              </h2>
              <p className="text-sm text-gray-600">
                {businessId ? 'Business-specific activities' : 'Global activities'} - Drag and drop to reorganize
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  showInactive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showInactive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showInactive ? 'Hide' : 'Show'} Inactive</span>
              </button>
              <button
                onClick={loadActivities}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowCSVImportModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter System */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter Research Activities</h3>
            </div>
            {(selectedCategories.length > 0 || selectedAreas.length > 0 || selectedFocuses.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear filters</span>
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Categories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Categories</label>
                <button
                  onClick={() => setShowAddCategoryModal(true)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add New</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <SelectableChip
                    key={category.id}
                    label={category.name}
                    selected={selectedCategories.includes(category.id)}
                    onToggle={() => handleCategoryToggle(category.id)}
                    color="blue"
                    count={getActivityCountForCategory(category.id)}
                  />
                ))}
              </div>
            </div>

            {/* Areas - Only show when categories are selected */}
            {selectedCategories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Areas</label>
                  <button
                    onClick={() => setShowAddAreaModal(true)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-green-600 hover:text-green-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getAvailableAreas().map(area => (
                    <SelectableChip
                      key={area.id}
                      label={area.name}
                      selected={selectedAreas.includes(area.id)}
                      onToggle={() => handleAreaToggle(area.id)}
                      color="green"
                      count={getActivityCountForArea(area.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Focuses - Only show when areas are selected */}
            {selectedAreas.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Focuses</label>
                  <button
                    onClick={() => setShowAddFocusModal(true)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getAvailableFocuses().map(focus => (
                    <EditableSelectableChip
                      key={focus.id}
                      label={focus.name}
                      selected={selectedFocuses.includes(focus.id)}
                      onToggle={() => handleFocusToggle(focus.id)}
                      onEdit={() => handleEditFocus(focus)}
                      color="purple"
                      count={getActivityCountForFocus(focus.id)}
                      showEdit={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Instruction message when no categories selected */}
            {selectedCategories.length === 0 && (
              <div className="text-center py-6">
                <div className="mx-auto h-10 w-10 text-gray-400 mb-3">
                  <Filter className="w-full h-full" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Start by selecting categories</h4>
                <p className="text-xs text-gray-600">Choose one or more categories above to see available research areas.</p>
              </div>
            )}
          </div>
        </div>

        {/* Activities List */}
        <div>
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                businessId={businessId}
                onToggleExpanded={handleToggleActivityExpanded}
                onEdit={handleEditActivity}
                onDuplicate={handleDuplicateActivity}
                onDeactivate={handleDeactivateActivity}
                onRefresh={loadActivities}
                onEditStep={handleEditStep}
                onAddStep={handleAddStep}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No activities found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first research activity to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggingSubcomponent && draggingStepId && (
            <div className="transform rotate-2">
              <SubcomponentCard
                subcomponent={draggingSubcomponent}
                stepId={draggingStepId}
                onEdit={() => {}}
                onMove={() => {}}
                onDeactivate={() => {}}
              />
            </div>
          )}
        </DragOverlay>

        {/* Modals */}
        <SubcomponentModal
          isOpen={showSubcomponentModal}
          subcomponent={editingSubcomponent}
          stepId={selectedStepId}
          steps={allSteps}
          onClose={() => {
            setShowSubcomponentModal(false);
            setEditingSubcomponent(null);
            setSelectedStepId('');
          }}
          onSave={handleSaveSubcomponent}
        />

        <MoveSubcomponentModal
          isOpen={showMoveModal}
          subcomponentId={moveSubcomponentId}
          currentStepId={moveFromStepId}
          availableSteps={allSteps}
          onClose={() => {
            setShowMoveModal(false);
            setMoveSubcomponentId('');
            setMoveFromStepId('');
          }}
          onMove={handleMoveSubcomponentToStep}
        />

        {/* Add Category Modal */}
        <AddFilterEntryModal
          isOpen={showAddCategoryModal}
          title="Add New Category"
          placeholder="Enter category name..."
          onClose={() => setShowAddCategoryModal(false)}
          onSave={async (name, description) => {
            const { data, error } = await supabase
              .from('rd_research_categories')
              .insert({ name, description })
              .select()
              .single();
            
            if (error) throw error;
            setCategories(prev => [...prev, data]);
            return data;
          }}
        />

        {/* Add Area Modal */}
        <AddFilterEntryModal
          isOpen={showAddAreaModal}
          title="Add New Area"
          placeholder="Enter area name..."
          onClose={() => setShowAddAreaModal(false)}
          requiresParent={true}
          parentLabel="Category"
          parentOptions={selectedCategories.length > 0 
            ? categories.filter(c => selectedCategories.includes(c.id))
            : categories
          }
          onSave={async (name, description, parentId) => {
            const { data, error } = await supabase
              .from('rd_areas')
              .insert({ name, description, category_id: parentId })
              .select()
              .single();
            
            if (error) throw error;
            setAreas(prev => [...prev, data]);
            return data;
          }}
        />

        {/* Add Focus Modal */}
        <AddFilterEntryModal
          isOpen={showAddFocusModal}
          title="Add New Focus"
          placeholder="Enter focus name..."
          onClose={() => setShowAddFocusModal(false)}
          requiresParent={true}
          parentLabel="Area"
          parentOptions={selectedAreas.length > 0 
            ? areas.filter(a => selectedAreas.includes(a.id))
            : getAvailableAreas()
          }
          onSave={async (name, description, parentId) => {
            const { data, error } = await supabase
              .from('rd_focuses')
              .insert({ name, description, area_id: parentId })
              .select()
              .single();
            
            if (error) throw error;
            setFocuses(prev => [...prev, data]);
            return data;
          }}
        />

        {/* Edit Activity Modal */}
        <EditActivityModal
          isOpen={showEditActivityModal}
          activity={editingActivity}
          onClose={() => {
            setShowEditActivityModal(false);
            setEditingActivity(null);
          }}
          onSave={loadActivities}
          categories={categories}
          areas={areas}
          focuses={focuses}
        />

        {/* Edit Step Modal */}
        <EditStepModal
          isOpen={showEditStepModal}
          step={editingStep}
          activityId={editingStepActivityId}
          onClose={() => {
            setShowEditStepModal(false);
            setEditingStep(null);
            setEditingStepActivityId('');
          }}
          onSuccess={() => {
            loadActivities();
            setShowEditStepModal(false);
            setEditingStep(null);
            setEditingStepActivityId('');
          }}
        />

        {/* CSV Import Modal */}
        <CSVImportModal
          isOpen={showCSVImportModal}
          onClose={() => setShowCSVImportModal(false)}
          onSuccess={() => {
            loadActivities();
            loadFilterData();
          }}
          businessId={businessId}
        />

        {/* Edit Focus Modal */}
        <EditFocusModal
          isOpen={showEditFocusModal}
          focus={editingFocus}
          onClose={() => {
            setShowEditFocusModal(false);
            setEditingFocus(null);
          }}
          onSave={() => {
            loadFilterData();
            loadActivities(); // Reload activities as focus changes may affect categorization
            setShowEditFocusModal(false);
            setEditingFocus(null);
          }}
          categories={categories}
          areas={areas}
        />
      </div>
    </DndContext>
  );
};

export default ModularResearchActivityManager; 