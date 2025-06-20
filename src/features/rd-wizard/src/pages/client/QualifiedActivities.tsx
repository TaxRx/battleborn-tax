import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PercentageSlider from '../../components/forms/PercentageSlider';
import Modal from '../../components/common/Modal';
import { FileUpload } from '../../components/forms/FileUpload';
import { 
  ArrowRightIcon, 
  ArrowLeftIcon,
  PlusCircleIcon,
  TrashIcon,
  ClockIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import useActivitiesStore from '../../store/activitiesStore';
import useBusinessStore from '../../store/businessStore';
import useStaffStore from '../../store/staffStore';
import { mockCategories } from '../../services/mockData';
import { 
  Category, 
  Area, 
  Focus, 
  ResearchActivity, 
  ResearchSubcomponent,
  SelectedActivity,
  SelectedSubcomponent,
  Month,
  ChangelogEntry
} from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import { getBusinessesForUser } from '../../services/businessService';
import { getActivitiesForBusiness, createActivity, updateActivity, deleteActivity } from '../../services/activityService';
import { createChangelogEntry } from '../../services/changelogService';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="font-['DM_Serif_Display'] text-2xl text-gray-900 mb-6">{children}</h2>
);

const months: Month[] = [
  { value: 1, label: 'January', percentage: 1.0 },
  { value: 2, label: 'February', percentage: 0.92 },
  { value: 3, label: 'March', percentage: 0.83 },
  { value: 4, label: 'April', percentage: 0.75 },
  { value: 5, label: 'May', percentage: 0.67 },
  { value: 6, label: 'June', percentage: 0.58 },
  { value: 7, label: 'July', percentage: 0.5 },
  { value: 8, label: 'August', percentage: 0.42 },
  { value: 9, label: 'September', percentage: 0.33 },
  { value: 10, label: 'October', percentage: 0.25 },
  { value: 11, label: 'November', percentage: 0.17 },
  { value: 12, label: 'December', percentage: 0.08 }
];

const QualifiedActivities: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { clientId } = useImpersonation();
  const [business, setBusiness] = useState<{ id: string } | null>(null);
  const [activities, setActivities] = useState<ResearchActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showResearchDescriptionModal, setShowResearchDescriptionModal] = useState(false);
  const [showSubcomponentSelectionModal, setShowSubcomponentSelectionModal] = useState(false);
  const [showActivitySelectionModal, setShowActivitySelectionModal] = useState(false);
  const [showApplyToPreviousYearsModal, setShowApplyToPreviousYearsModal] = useState(false);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [pendingApplyToPreviousYears, setPendingApplyToPreviousYears] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Initialize modal states
  const [selectedSubcomponentForModal, setSelectedSubcomponentForModal] = useState<{
    activityId: string;
    subcomponentId: string;
  } | null>(null);
  const [selectedSubcomponents, setSelectedSubcomponents] = useState<string[]>([]);
  const [selectedActivitiesForModal, setSelectedActivitiesForModal] = useState<string[]>([]);
  const [subcomponentStartMonths, setSubcomponentStartMonths] = useState<Record<string, number>>({});
  
  // Local state for activity selection
  const [selectedActivity, setSelectedActivity] = useState<ResearchActivity | null>(null);
  const [practicePercentage, setPracticePercentage] = useState(20);

  // Get business info
  const { yearStarted, availableYears: storeAvailableYears, generateAvailableYears } = useBusinessStore();
  
  // Get state and actions from the store
  const {
    categories,
    selectedCategoryId,
    selectedAreaIds,
    selectedFocusIds,
    selectedActivities,
    setCategories,
    selectCategory,
    toggleAreaSelection,
    toggleFocusSelection,
    getAvailableAreas,
    getAvailableFocuses,
    getAvailableActivities,
    addSelectedActivity,
    removeSelectedActivity,
    updateActivityPracticePercentage,
    updateSubcomponentFrequencyPercentage,
    updateSubcomponentTimePercentage,
    updateSubcomponentYearPercentage,
    toggleSubcomponentSelection,
    updateSubcomponentDescription,
    addSubcomponentDocument,
    removeSubcomponentDocument,
    copyActivitiesToPreviousYears,
    setAvailableActivities,
    updateQualifiedExpenses,
    calculateAppliedPercentage
  } = useActivitiesStore();
  
  // Use the store's available years
  const availableYears = storeAvailableYears.length > 0 
    ? storeAvailableYears 
    : [new Date().getFullYear()];
  
  // Initialize available years if empty
  useEffect(() => {
    if (storeAvailableYears.length === 0) {
      generateAvailableYears();
    }
  }, [storeAvailableYears.length, generateAvailableYears]);
  
  // Load mock data on component mount
  useEffect(() => {
    if (categories.length === 0) {
      setCategories(mockCategories);
      
      // Auto-select the first category if none is selected
      if (mockCategories.length > 0 && !selectedCategoryId) {
        selectCategory(mockCategories[0].id);
      }
    }
  }, [categories.length, selectedCategoryId, setCategories, selectCategory]);
  
  // Get available data based on current selections
  const availableAreas = getAvailableAreas();
  const availableFocuses = getAvailableFocuses();
  const availableActivities = getAvailableActivities();
  
  // Filter selected activities by year
  const filteredActivities = selectedActivities.filter(activity => 
    activity.year === selectedYear
  );
  
  // Calculate total practice percentage
  const totalPracticePercentage = filteredActivities.reduce(
    (total: number, activity: SelectedActivity) => total + activity.practicePercentage,
    0
  );
  
  // Add state for subcomponent modal queue
  const [subcomponentQueue, setSubcomponentQueue] = useState<ResearchActivity[]>([]);

  // Fetch business and activities
  useEffect(() => {
    const fetchBusinessAndActivities = async () => {
      if (!user?.id && !clientId) return;

      try {
        const userId = clientId || user?.id || '';
        const businessesResponse = await getBusinessesForUser(userId);
        if (businessesResponse?.data?.[0]) {
          setBusiness(businessesResponse.data[0]);
          const activitiesResponse = await getActivitiesForBusiness(businessesResponse.data[0].id);
          if (activitiesResponse?.data) {
            setActivities(activitiesResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching business and activities:', error);
        toast.error('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessAndActivities();
  }, [user?.id, clientId]);

  // CRUD handlers
  const handleCreateActivity = async (activity: ResearchActivity) => {
    if (!business?.id) return;

    try {
      const activityWithBusinessId = {
        ...activity,
        business_id: business.id
      };
      const response = await createActivity(activityWithBusinessId);
      if (response?.data) {
        setActivities(prev => [...prev, response.data]);
        await createChangelogEntry({
          actor_id: user?.id || '',
          target_user_id: clientId || user?.id || '',
          action: 'create',
          details: `Created activity: ${response.data.name}`,
          metadata: { business_id: business.id }
        });
        toast.success('Activity created successfully');
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
    }
  };

  const handleUpdateActivity = async (id: string, updates: Partial<ResearchActivity>) => {
    try {
      const response = await updateActivity(id, updates);
      if (response?.data) {
        setActivities(prev => prev.map(activity => 
          activity.id === id ? { ...activity, ...response.data } : activity
        ));
        await createChangelogEntry({
          actor_id: user?.id || '',
          target_user_id: clientId || user?.id || '',
          action: 'update',
          details: `Updated activity: ${updates.name || 'activity'}`,
          metadata: { activity_id: id }
        });
        toast.success('Activity updated successfully');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      const response = await deleteActivity(id);
      if (response?.data) {
        setActivities(prev => prev.filter(activity => activity.id !== id));
        await createChangelogEntry({
          actor_id: user?.id || '',
          target_user_id: clientId || user?.id || '',
          action: 'delete',
          details: 'Deleted activity',
          metadata: { activity_id: id }
        });
        toast.success('Activity deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  // Handle activity selection
  const handleActivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const activityId = e.target.value;
    if (!activityId) {
      setSelectedActivity(null);
      return;
    }
    
    const activity = availableActivities.find(a => a.id === activityId);
    if (activity) {
      setSelectedActivity(activity);
      setShowActivitySelectionModal(true);
    }
  };
  
  // Handle adding a selected activity
  const handleAddActivity = () => {
    if (selectedActivity) {
      setSelectedSubcomponents([]);
      setShowSubcomponentSelectionModal(true);
    }
  };

  // Update handleActivitySelectionConfirm to queue activities
  const handleActivitySelectionConfirm = () => {
    const selectedActs = selectedActivitiesForModal.map(actId => 
      availableActivities.find(a => a.id === actId)
    ).filter((a): a is ResearchActivity => a !== undefined);

    if (selectedActs.length > 0) {
      setSubcomponentQueue(selectedActs);
      setSelectedActivity(selectedActs[0]);
      setShowActivitySelectionModal(false);
      setShowSubcomponentSelectionModal(true);
      setSelectedSubcomponents([]);
    }
  };

  // Update handleSubcomponentSelectionConfirm to walk the queue
  const handleSubcomponentSelectionConfirm = () => {
    if (selectedActivity) {
      // Calculate total available percentage based on practice percentage
      const practicePercentageLimit = practicePercentage;
      const selectedCount = selectedSubcomponents.length;
      const averageAllowedPercentage = practicePercentageLimit / selectedCount;
      const filteredSubcomponents = selectedActivity.subcomponents
        .filter(sub => selectedSubcomponents.includes(sub.id))
        .map(sub => {
          // Generate random percentages within specified ranges
          const baseFrequencyPercentage = Math.floor(Math.random() * (50 - 20 + 1)) + 20; // 20-50%
          const baseTimePercentage = Math.floor(Math.random() * (10 - 4 + 1)) + 4;       // 4-10%
          // Scale percentages to ensure they don't exceed practice percentage
          const scaleFactor = averageAllowedPercentage / 100;
          const frequencyPercentage = Math.round(baseFrequencyPercentage * scaleFactor);
          const timePercentage = Math.round(baseTimePercentage * scaleFactor);
          return {
            ...sub,
            isSelected: true,
            generalDescription: sub.generalDescription || '',
            hypothesis: sub.hypothesis || '',
            methodology: sub.methodology || '',
            documents: [],
            frequencyPercentage,
            timePercentage,
            yearPercentage: 100,
            appliedPercentage: Math.min((frequencyPercentage * timePercentage * 100) / 10000, practicePercentageLimit)
          };
        });
      const newActivity: SelectedActivity = {
        ...selectedActivity,
        subcomponents: filteredSubcomponents,
        practicePercentage,
        year: selectedYear
      };
      addSelectedActivity(newActivity, practicePercentage, selectedYear);
      // Remove the selected activity from available activities
      const updatedActivities = availableActivities.filter(a => a.id !== selectedActivity.id);
      setAvailableActivities(updatedActivities);
      setPracticePercentage(20);
      setSelectedSubcomponents([]);
      // If more in the queue, show next
      if (subcomponentQueue.length > 1) {
        const [, ...rest] = subcomponentQueue;
        setSubcomponentQueue(rest);
        setSelectedActivity(rest[0]);
        setShowSubcomponentSelectionModal(true);
      } else {
        setShowSubcomponentSelectionModal(false);
        setSelectedActivity(null);
        setSubcomponentQueue([]);
      }
      updateWagesForActivityChange();
    }
  };

  // Get staff store
  const staffStore = useStaffStore();
  
  // Update the updateWagesForActivityChange function
  const updateWagesForActivityChange = () => {
    // First recalculate all applied percentages
    selectedActivities.forEach(activity => {
      activity.subcomponents.forEach(subcomponent => {
        if (subcomponent.isSelected) {
          calculateAppliedPercentage(activity.id, subcomponent.id);
        }
      });
    });

    // Then trigger staff store update
    if (staffStore.recalculateWages) {
      staffStore.recalculateWages();
    }
  };

  // Handle subcomponent start month change
  const handleSubcomponentStartMonthChange = (
    activityId: string,
    subcomponentId: string,
    monthValue: number
  ) => {
    const yearPercentage = months.find(m => m.value === monthValue)?.percentage || 1.0;
    updateSubcomponentYearPercentage(activityId, subcomponentId, yearPercentage * 100);
    setSubcomponentStartMonths(prev => ({
      ...prev,
      [`${activityId}-${subcomponentId}`]: monthValue
    }));
  };

  // Open research description modal
  const handleOpenResearchDescriptionModal = (activityId: string, subcomponentId: string) => {
    setSelectedSubcomponentForModal({ activityId, subcomponentId });
    setShowResearchDescriptionModal(true);
  };

  // Get selected subcomponent for modal
  const getSelectedSubcomponentForModal = () => {
    if (!selectedSubcomponentForModal) return null;
    
    const activity = selectedActivities.find(a => a.id === selectedSubcomponentForModal.activityId);
    if (!activity) return null;
    
    const subcomponent = activity.subcomponents.find(s => s.id === selectedSubcomponentForModal.subcomponentId);
    return { activity, subcomponent };
  };

  // Handle file upload for a subcomponent
  const handleFileUpload = (activityId: string, subcomponentId: string, files: File[]) => {
    files.forEach(file => {
      addSubcomponentDocument(activityId, subcomponentId, file);
    });
  };

  // Update handleContinue to ensure correct modal logic
  const handleContinue = () => {
    updateQualifiedExpenses(); // Always update before modal logic or navigation
    // Only consider activities for the selected year
    const hasActivitiesForCurrentYear = selectedActivities.some(
      activity => activity.year === selectedYear && activity.subcomponents.some(sub => sub.isSelected)
    );
    const previousYearsAvailable = yearStarted < selectedYear;
    if (hasActivitiesForCurrentYear && previousYearsAvailable) {
      setShowApplyToPreviousYearsModal(true);
    } else {
      navigate('/client/qualified-expenses');
    }
  };

  // Handle apply to previous years decision
  const handleApplyToPreviousYears = (apply: boolean) => {
    if (apply) {
      // Get years to apply to (between business start year and current year)
      const yearsToApply = Array.from(
        { length: Math.min(4, selectedYear - yearStarted) },
        (_, i) => selectedYear - (i + 1)
      ).filter(year => year >= yearStarted);

      // Copy activities to previous years with adjusted percentages
      copyActivitiesToPreviousYears(selectedYear, yearsToApply);
    }
    
    // Update qualified expenses before navigating
    updateQualifiedExpenses();
    
    // Close modal and navigate
    setShowApplyToPreviousYearsModal(false);
    navigate('/client/qualified-expenses');
  };

  // Update wages when activity percentages change
  useEffect(() => {
    const hasChanges = selectedActivities.some(activity => 
      activity.subcomponents.some(sub => 
        sub.isSelected && (
          sub.frequencyPercentage > 0 ||
          sub.timePercentage > 0 ||
          sub.yearPercentage > 0
        )
      )
    );
    
    if (hasChanges) {
      updateQualifiedExpenses();
    }
  }, [selectedActivities.map(a => 
    a.subcomponents
      .filter(s => s.isSelected)
      .map(s => `${s.frequencyPercentage}-${s.timePercentage}-${s.yearPercentage}`)
      .join('|')
  ).join('|')]);

  // Update the subcomponent description update handler
  const handleSubcomponentDescriptionUpdate = (
    activityId: string,
    subcomponentId: string,
    field: 'generalDescription' | 'hypothesis' | 'methodology',
    value: string
  ) => {
    updateSubcomponentDescription(activityId, subcomponentId, field, value);
  };
  
  // Replace the activity selection dropdown with a button
  const ActivitySelectionSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Research Activities</h3>
        <Button
          variant="primary"
          onClick={() => setShowActivitySelectionModal(true)}
          icon={<PlusCircleIcon className="h-5 w-5" />}
        >
          Add Research Activities
        </Button>
      </div>
      
      {availableActivities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No activities available. Please select a category, area, and focus first.</p>
        </div>
      )}
    </div>
  );

  // Add the Activity Selection Modal
  const ActivitySelectionModal = () => (
    <Modal
      isOpen={showActivitySelectionModal}
      onClose={() => setShowActivitySelectionModal(false)}
      title="Select Research Activities"
      maxWidth="2xl"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowActivitySelectionModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleActivitySelectionConfirm}
            disabled={selectedActivitiesForModal.length === 0}
          >
            Continue to Subcomponents
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Available Research Activities
          </h3>
          <p className="text-sm text-gray-500">
            Select the research activities you want to add.
          </p>
        </div>
        
        <div className="space-y-4">
          {availableActivities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
            >
              <input
                type="checkbox"
                id={`modal-activity-${activity.id}`}
                checked={selectedActivitiesForModal.includes(activity.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedActivitiesForModal([...selectedActivitiesForModal, activity.id]);
                  } else {
                    setSelectedActivitiesForModal(selectedActivitiesForModal.filter(id => id !== activity.id));
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <div>
                <label 
                  htmlFor={`modal-activity-${activity.id}`}
                  className="block text-sm font-medium text-gray-900"
                >
                  {activity.name}
                </label>
                {activity.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {activity.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );

  // Add the Apply to Previous Years Modal
  const ApplyToPreviousYearsModal = () => (
    <Modal
      isOpen={showApplyToPreviousYearsModal}
      onClose={() => setShowApplyToPreviousYearsModal(false)}
      title="Apply to Previous Years"
      maxWidth="2xl"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => handleApplyToPreviousYears(false)}
          >
            No, Skip
          </Button>
          <Button
            variant="primary"
            onClick={() => { setShowApplyToPreviousYearsModal(false); setShowOverwriteWarning(true); setPendingApplyToPreviousYears(true); }}
          >
            Yes, Apply
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start">
          <QuestionMarkCircleIcon className="h-6 w-6 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-gray-700">
              Would you like to apply these research activities to previous years?
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This will copy your current research activities to previous years with slightly reduced percentages to account for growth over time.
            </p>
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> This will apply to years {(() => {
                  // Get all available years between current year and business start year
                  const yearsToApply = Array.from(
                    { length: Math.min(4, selectedYear - yearStarted) },
                    (_, i) => selectedYear - (i + 1)
                  )
                  .filter(year => year >= yearStarted)
                  .sort((a, b) => a - b);
                  
                  if (yearsToApply.length === 0) {
                    return "No previous years available";
                  }
                  return yearsToApply.join(', ');
                })()}.
              </p>
              <p className="mt-2 text-sm text-blue-700">
                <strong>Business Start Year:</strong> {yearStarted}
              </p>
              {yearStarted >= selectedYear && (
                <p className="mt-2 text-sm text-red-600">
                  <strong>Note:</strong> Cannot apply to previous years as the business start year is the same as or after the selected year.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );

  // Add a new Modal for the warning
  const OverwriteWarningModal = () => (
    <Modal
      isOpen={showOverwriteWarning}
      onClose={() => { setShowOverwriteWarning(false); setPendingApplyToPreviousYears(false); }}
      title="Warning: Overwrite Previous Years"
      maxWidth="md"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => { setShowOverwriteWarning(false); setPendingApplyToPreviousYears(false); }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => { setShowOverwriteWarning(false); setPendingApplyToPreviousYears(false); handleApplyToPreviousYears(true); }}
          >
            Yes, Overwrite
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-red-700 font-semibold">This will overwrite any previous year's data. Are you sure you want to continue?</p>
      </div>
    </Modal>
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Recalculate activities
      updateQualifiedExpenses();
      // Update credit calculation
      staffStore.calculateTotalQualifiedWages();
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      // Show success toast
      toast.success('Calculations refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh calculations');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
      {/* Qualified Research Activities title and year selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-['DM_Serif_Display'] text-3xl text-gray-900">Qualified Research Activities</h1>
            <p className="mt-2 text-sm text-gray-600">
              Select and configure your research activities and their subcomponents.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Year
              </label>
              <select
                id="year-select"
                className="block w-36 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/client/qualified-expenses')}
              icon={<ArrowRightIcon className="h-5 w-5" />}
              iconPosition="right"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Activity Selection Card */}
      <Card className="mb-8">
        <SectionTitle>Activity Selection</SectionTitle>
        <p className="text-gray-500 mb-4">Configure your research activities</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Research Category and Areas */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Research Category</label>
              <select value={selectedCategoryId || ''} onChange={e => selectCategory(e.target.value)} className="block w-full rounded-lg border-2 focus:ring-blue-500 focus:border-blue-600 text-lg font-medium h-12 bg-white text-gray-700 border-gray-300 focus:text-blue-600 focus:border-blue-600">
                <option value="" disabled>Select a category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Research Areas</label>
              <div className="flex flex-wrap gap-2">
                {availableAreas.map(area => (
                  <button key={area.id} type="button" onClick={() => toggleAreaSelection(area.id)} className={cn('px-3 py-1 rounded-lg border-2 transition-colors', selectedAreaIds.includes(area.id) ? 'text-blue-600 border-blue-600 bg-white' : 'text-gray-700 border-gray-300 bg-white')}>{area.name}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Right: Focus Areas */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Focus Areas</label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {availableFocuses.map(focus => (
                  <button key={focus.id} type="button" onClick={() => toggleFocusSelection(focus.id)} className={cn('px-3 py-1 rounded-lg border-2 transition-colors', selectedFocusIds.includes(focus.id) ? 'text-blue-600 border-blue-600 bg-white' : 'text-gray-700 border-gray-300 bg-white')}>{focus.name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="primary" onClick={() => setShowActivitySelectionModal(true)}>
            Research Activities
          </Button>
        </div>
      </Card>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-0 w-full max-w-6xl mx-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <SectionTitle>Research Activities</SectionTitle>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApplyToPreviousYearsModal(true)}
                  title="Update Previous Years"
                >
                  <ClockIcon className="h-5 w-5 text-blue-600" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="relative"
                >
                  <ArrowPathIcon className={cn(
                    "h-5 w-5 mr-2",
                    isRefreshing && "animate-spin"
                  )} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <span className="text-sm font-medium text-gray-700">Total Practice Percentage:</span>
                <span className={`text-lg font-bold ${totalPracticePercentage > 100 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalPracticePercentage}%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Selected Activities */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Selected Research Activities</h2>
                        <p className="text-sm text-gray-500 mt-1">Activities configured for {selectedYear}</p>
                      </div>
                    </div>
                    
                    {filteredActivities.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                          <PlusCircleIcon className="h-12 w-12" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Selected</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                          Select a category, area, focus, and activity from the panel on the left to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <AnimatePresence>
                          {filteredActivities.map((activity) => (
                            <motion.div 
                              key={activity.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => {
                                      setSelectedActivity(activity);
                                      setSelectedSubcomponents(activity.subcomponents.filter(sub => sub.isSelected !== false).map(sub => sub.id));
                                      setShowSubcomponentSelectionModal(true);
                                      setSubcomponentQueue([]);
                                    }}>
                                      {activity.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Practice Percentage</p>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <PercentageSlider
                                      label=""
                                      value={activity.practicePercentage}
                                      onChange={(value) => updateActivityPracticePercentage(activity.id, value)}
                                      min={1}
                                      max={100}
                                      className="w-48"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeSelectedActivity(activity.id)}
                                      icon={<TrashIcon className="h-4 w-4" />}
                                      className="text-gray-500 hover:text-red-600 transition-colors"
                                      aria-label="Remove activity"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-sm font-medium text-gray-700">Subcomponents</h4>
                                </div>
                                <div className="space-y-4">
                                  {activity.subcomponents.map((subcomponent) => (
                                    <div 
                                      key={subcomponent.id} 
                                      className={cn(
                                        "bg-gray-50 p-4 rounded-lg border transition-colors",
                                        subcomponent.isSelected !== false 
                                          ? "border-blue-200 bg-blue-50" 
                                          : "border-gray-200"
                                      )}
                                    >
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start">
                                          <input
                                            type="checkbox"
                                            id={`subcomponent-${subcomponent.id}`}
                                            checked={subcomponent.isSelected !== false}
                                            onChange={() => toggleSubcomponentSelection(activity.id, subcomponent.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                                          />
                                          <label htmlFor={`subcomponent-${subcomponent.id}`} className="ml-2">
                                            <h5 className="text-sm font-medium text-gray-900">{subcomponent.name}</h5>
                                            {subcomponent.description && (
                                              <p className="text-sm text-gray-500 mt-1">{subcomponent.description}</p>
                                            )}
                                          </label>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleOpenResearchDescriptionModal(activity.id, subcomponent.id)}
                                          icon={<DocumentTextIcon className="h-4 w-4" />}
                                          className="text-gray-500 hover:text-blue-600 transition-colors"
                                          aria-label="View research description"
                                        />
                                      </div>
                                      
                                      {subcomponent.isSelected !== false && (
                                        <div className="ml-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {showAdvanced && (
                                              <>
                                                <PercentageSlider
                                                  label="Frequency %"
                                                  value={subcomponent.frequencyPercentage}
                                                  onChange={(value) => {
                                                    updateSubcomponentFrequencyPercentage(activity.id, subcomponent.id, value);
                                                    calculateAppliedPercentage(activity.id, subcomponent.id);
                                                  }}
                                                  min={1}
                                                  max={100}
                                                  step={0.01}
                                                />
                                                
                                                <PercentageSlider
                                                  label="Time %"
                                                  value={subcomponent.timePercentage}
                                                  onChange={(value) => {
                                                    updateSubcomponentTimePercentage(activity.id, subcomponent.id, value);
                                                    calculateAppliedPercentage(activity.id, subcomponent.id);
                                                  }}
                                                  min={1}
                                                  max={100}
                                                  step={0.01}
                                                />

                                                <div className="md:col-span-2">
                                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Implementation Period
                                                    <span className="ml-1 text-sm text-gray-500">
                                                      (When did you start using this subcomponent?)
                                                    </span>
                                                  </label>
                                                  <select
                                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                                    value={subcomponentStartMonths[`${activity.id}-${subcomponent.id}`] || 1}
                                                    onChange={(e) => handleSubcomponentStartMonthChange(
                                                      activity.id,
                                                      subcomponent.id,
                                                      parseInt(e.target.value)
                                                    )}
                                                  >
                                                    {months.map((month) => (
                                                      <option key={month.value} value={month.value}>
                                                        {month.label} ({(month.percentage * 100).toFixed(0)}% of year)
                                                      </option>
                                                    ))}
                                                  </select>
                                                </div>
                                              </>
                                            )}
                                            
                                            <div className="md:col-span-2">
                                              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center">
                                                    <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                                                    <span className="text-sm font-medium text-gray-900">Applied Percentage</span>
                                                  </div>
                                                  <span className="text-lg font-bold text-blue-600">{subcomponent.appliedPercentage.toFixed(2)}%</span>
                                                </div>
                                                
                                                {showAdvanced && (
                                                  <div className="mt-2 text-sm text-gray-500">
                                                    <p>Calculation: {activity.practicePercentage.toFixed(2)}% (Practice) × {subcomponent.frequencyPercentage.toFixed(2)}% (Frequency) × {subcomponent.timePercentage.toFixed(2)}% (Time) × {subcomponent.yearPercentage.toFixed(2)}% (Year) ÷ 1,000,000</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {showAdvanced && (
                                              <div className="md:col-span-2 mt-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  Supporting Documentation
                                                  <span className="ml-1 text-sm text-gray-500">
                                                    (Upload PDFs that will be attached to the final report)
                                                  </span>
                                                </label>
                                                <FileUpload
                                                  accept={{ 'application/pdf': ['.pdf'] }}
                                                  maxFiles={5}
                                                  onFilesSelected={(files) => handleFileUpload(activity.id, subcomponent.id, files)}
                                                  initialFiles={subcomponent.documents || []}
                                                  helperText="Upload supporting documentation for this subcomponent"
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </Card>
                </motion.div>
                
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/client/document-upload')}
                    icon={<ArrowLeftIcon className="h-5 w-5" />}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleContinue}
                    disabled={selectedActivities.length === 0}
                    icon={<ArrowRightIcon className="h-5 w-5" />}
                    iconPosition="right"
                  >
                    Continue to Qualified Expenses
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Research Description Modal */}
        <Modal
          isOpen={showResearchDescriptionModal}
          onClose={() => setShowResearchDescriptionModal(false)}
          title="Research Description"
          maxWidth="2xl"
          footer={
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setShowResearchDescriptionModal(false)}
              >
                Save & Close
              </Button>
            </div>
          }
        >
          {selectedSubcomponentForModal && getSelectedSubcomponentForModal() && (
            <div className="space-y-6">
              {(() => {
                const { activity, subcomponent } = getSelectedSubcomponentForModal()!;
                return (
                  <>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {activity.name} - {subcomponent?.name}
                      </h3>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            General Description
                            <span className="ml-1 text-xs text-gray-500">
                              (Describe the research activity and its purpose)
                            </span>
                          </label>
                          <textarea
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={8}
                            value={subcomponent?.generalDescription || activity.description || ''}
                            onChange={(e) => handleSubcomponentDescriptionUpdate(
                              activity.id,
                              subcomponent!.id,
                              'generalDescription',
                              e.target.value
                            )}
                            placeholder="Describe the general purpose and process of this research activity..."
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Research Hypothesis
                            <span className="ml-1 text-xs text-gray-500">
                              (What are you trying to prove or discover?)
                            </span>
                          </label>
                          <textarea
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={4}
                            value={subcomponent?.hypothesis || activity.hypothesis || ''}
                            onChange={(e) => handleSubcomponentDescriptionUpdate(
                              activity.id,
                              subcomponent!.id,
                              'hypothesis',
                              e.target.value
                            )}
                            placeholder="Describe your research hypothesis..."
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Methodology
                            <span className="ml-1 text-xs text-gray-500">
                              (How will you conduct this research?)
                            </span>
                          </label>
                          <textarea
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={6}
                            value={subcomponent?.methodology || ''}
                            onChange={(e) => handleSubcomponentDescriptionUpdate(
                              activity.id,
                              subcomponent!.id,
                              'methodology',
                              e.target.value
                            )}
                            placeholder="Describe your research methodology..."
                          />
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </Modal>

        {/* Subcomponent Selection Modal */}
        <Modal
          isOpen={showSubcomponentSelectionModal}
          onClose={() => setShowSubcomponentSelectionModal(false)}
          title="Select Subcomponents"
          maxWidth="2xl"
          footer={
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSubcomponentSelectionModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubcomponentSelectionConfirm}
                disabled={selectedSubcomponents.length === 0}
              >
                Add Activity
              </Button>
            </div>
          }
        >
          {selectedActivity && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedActivity.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Select the subcomponents you want to include in this activity.
                </p>
              </div>
              
              <div className="space-y-4">
                {selectedActivity.subcomponents.map((subcomponent) => (
                  <div 
                    key={subcomponent.id}
                    className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`modal-subcomponent-${subcomponent.id}`}
                      checked={selectedSubcomponents.includes(subcomponent.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubcomponents([...selectedSubcomponents, subcomponent.id]);
                        } else {
                          setSelectedSubcomponents(selectedSubcomponents.filter(id => id !== subcomponent.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <label 
                        htmlFor={`modal-subcomponent-${subcomponent.id}`}
                        className="block text-sm font-medium text-gray-900"
                      >
                        {subcomponent.name}
                      </label>
                      {subcomponent.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {subcomponent.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>

        {/* Activity Selection Modal */}
        <ActivitySelectionModal />
        <ApplyToPreviousYearsModal />
        <OverwriteWarningModal />
      </div>
    </motion.div>
  );
};

export default QualifiedActivities;