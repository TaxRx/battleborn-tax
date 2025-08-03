import { 
  ResearchActivity, 
  ResearchStep, 
  ResearchSubcomponent 
} from '../../modules/tax-calculator/services/researchActivitiesService';

export interface ActivityWithSteps extends ResearchActivity {
  steps: StepWithSubcomponents[];
  expanded?: boolean;
}

export interface StepWithSubcomponents extends ResearchStep {
  subcomponents: ResearchSubcomponent[];
  expanded?: boolean;
}

export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current?: {
        type: 'subcomponent';
        subcomponent: ResearchSubcomponent;
        stepId: string;
      };
    };
  };
  over: {
    id: string;
    data: {
      current?: {
        type: 'step' | 'subcomponent';
        stepId?: string;
      };
    };
  } | null;
}

export interface ResearchActivityManagerProps {
  businessId?: string;
}

export interface ActivityCardProps {
  activity: ActivityWithSteps;
  businessId?: string;
  dragDisabled?: boolean;
  onToggleExpanded: (activityId: string) => void;
  onEdit: (activity: ResearchActivity) => void;
  onDeactivate: (activity: ResearchActivity) => void;
  onRefresh: () => void;
  onEditStep?: (step: ResearchStep, activityId: string) => void;
  onAddStep?: (activityId: string) => void;
  onEditSubcomponent?: (subcomponent: ResearchSubcomponent) => void;
  onMoveSubcomponent?: (subcomponentId: string, fromStepId: string) => void;
  onUpdateStepPercentages?: (activityId: string, stepUpdates: { stepId: string; newPercentage: number }[]) => void;
  onMoveStepUp?: (stepId: string, activityId: string) => void;
  onMoveStepDown?: (stepId: string, activityId: string) => void;
}

export interface StepCardProps {
  step: StepWithSubcomponents;
  activityId: string;
  businessId?: string;
  activityTimePercentageLocked?: boolean;
  activitySteps?: ResearchStep[];
  stepNumber?: number; // Display number calculated from position
  onToggleExpanded: (stepId: string) => void;
  onEdit: (step: ResearchStep) => void;
  onDeactivate: (step: ResearchStep) => void;
  onDeleteStep?: (step: ResearchStep) => void;
  onAddSubcomponent: (stepId: string) => void;
  onEditSubcomponent: (subcomponent: ResearchSubcomponent) => void;
  onMoveSubcomponent: (subcomponentId: string, fromStepId: string) => void;
  onTimePercentageChange?: (stepId: string, percentage: number) => void;
  onMoveStepUp?: (stepId: string, activityId: string) => void;
  onMoveStepDown?: (stepId: string, activityId: string) => void;
  onRefresh: () => void;
}

export interface SubcomponentCardProps {
  subcomponent: ResearchSubcomponent;
  stepId: string;
  onEdit: (subcomponent: ResearchSubcomponent) => void;
  onMove: (subcomponentId: string, fromStepId: string) => void;
  onDeactivate: (subcomponent: ResearchSubcomponent) => void;
  onRefresh: () => void;
}

export interface SubcomponentModalProps {
  isOpen: boolean;
  subcomponent: ResearchSubcomponent | null;
  stepId: string;
  steps: ResearchStep[];
  onClose: () => void;
  onSave: (subcomponent: Omit<ResearchSubcomponent, 'id' | 'created_at' | 'updated_at'>) => void;
}

export interface MoveSubcomponentModalProps {
  isOpen: boolean;
  subcomponentId: string;
  currentStepId: string;
  availableSteps: ResearchStep[];
  onClose: () => void;
  onMove: (targetStepId: string) => void;
} 