import React from 'react';
import { Edit3 } from 'lucide-react';

interface EditableSelectableChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  color: 'blue' | 'green' | 'purple' | 'gray';
  count?: number;
  showEdit?: boolean;
}

const EditableSelectableChip: React.FC<EditableSelectableChipProps> = ({
  label,
  selected,
  onToggle,
  onEdit,
  color,
  count,
  showEdit = false
}) => {
  const colorClasses = {
    blue: {
      selected: 'bg-blue-100 text-blue-800 border-blue-300',
      unselected: 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
    },
    green: {
      selected: 'bg-green-100 text-green-800 border-green-300',
      unselected: 'bg-white text-green-600 border-green-200 hover:bg-green-50'
    },
    purple: {
      selected: 'bg-purple-100 text-purple-800 border-purple-300',
      unselected: 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
    },
    gray: {
      selected: 'bg-gray-100 text-gray-800 border-gray-300',
      unselected: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
    }
  };

  const currentColorClass = selected ? colorClasses[color].selected : colorClasses[color].unselected;

  return (
    <div className="flex items-center">
      <button
        onClick={onToggle}
        className={`
          inline-flex items-center px-3 py-1 text-xs font-medium border rounded-full transition-colors
          ${currentColorClass}
          ${showEdit ? 'rounded-r-none border-r-0' : ''}
        `}
      >
        <span>{label}</span>
        {count !== undefined && (
          <span className="ml-1 opacity-75">({count})</span>
        )}
      </button>
      {showEdit && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={`
            inline-flex items-center px-2 py-1 text-xs border rounded-r-full transition-colors
            ${selected ? colorClasses[color].selected : colorClasses[color].unselected}
            hover:opacity-80
          `}
          title="Edit focus"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default EditableSelectableChip; 