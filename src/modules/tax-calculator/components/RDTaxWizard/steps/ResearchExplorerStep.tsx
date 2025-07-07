import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { Plus, ChevronDown, ChevronRight, Edit, Trash2, MoveUp, MoveDown, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResearchExplorerStepProps {
  selectedActivities: any[];
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

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

interface ResearchActivity {
  id: string;
  title: string;
  focus_id: string;
  general_description?: string;
  examples?: string;
}

interface ResearchSubcomponent {
  id: string;
  title: string;
  activity_id: string;
  phase: string;
  goal?: string;
  hypothesis?: string;
  cpt?: string;
  narrative?: string;
}

interface ResearchRole {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  business_id?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SelectedActivity {
  id: string;
  activity_id: string;
  title?: string; // Keep for backward compatibility
  activity_name?: string; // New field from joined data
  activity_category?: string;
  activity_area?: string;
  activity_focus?: string;
  practice_percent: number;
  selected_roles: string[];
  config: any;
  created_at?: string;
  updated_at?: string;
}

interface PracticePercentageConfig {
  nonRndTime: number;
  activities: { [activityId: string]: number };
}

// RoleCard Component
interface RoleCardProps {
  role: ResearchRole;
  allRoles: ResearchRole[];
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  level: number;
  renderChildRole?: (role: ResearchRole, allRoles: ResearchRole[], level: number) => React.ReactNode;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  allRoles,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  canMoveUp,
  canMoveDown,
  level,
  renderChildRole
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const childRoles = allRoles.filter(r => r.parent_id === role.id);

  // Generate a unique color based on role name
  const getRoleColor = (roleName: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600', 
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-red-500 to-red-600'
    ];
    const index = roleName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const roleColor = getRoleColor(role.name);

  return (
    <div className={`${level > 0 ? 'ml-8' : ''} transition-all duration-300`}>
      <div 
        className={`
          relative bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm 
          hover:shadow-lg hover:border-blue-200 transition-all duration-300
          ${isHovered ? 'transform scale-[1.02]' : ''}
          ${level === 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gradient-to-br from-gray-50 to-blue-50'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Connection line for child roles */}
        {childRoles.length > 0 && (
          <div className="absolute left-1/2 bottom-0 w-px h-4 bg-gradient-to-b from-blue-300 to-transparent transform -translate-x-1/2"></div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {childRoles.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            )}
            
            <div className="flex items-center space-x-4">
              {/* Enhanced Role Avatar */}
              <div className={`relative w-12 h-12 bg-gradient-to-r ${roleColor} rounded-xl flex items-center justify-center shadow-lg`}>
                <span className="text-white text-lg font-bold">
                  {role.name.charAt(0).toUpperCase()}
                </span>
                {role.is_default && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-yellow-900 text-xs font-bold">★</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h6 className="text-lg font-bold text-gray-900 mb-1">{role.name}</h6>
                {role.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{role.description}</p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  {role.is_default && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></span>
                      Default Role
                    </span>
                  )}
                  {childRoles.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <UserPlus className="w-3 h-3 mr-1" />
                      {childRoles.length} Subordinate{childRoles.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Action Buttons */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
              <button
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <MoveUp className="h-4 w-4" />
              </button>
              <button
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <MoveDown className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                title="Edit role"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200"
                title="Delete role"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Child Roles */}
      {isExpanded && childRoles.length > 0 && (
        <div className="mt-4 space-y-4 relative">
          {/* Connection lines */}
          <div className="absolute left-6 top-0 w-px h-full bg-gradient-to-b from-blue-300 via-blue-200 to-transparent"></div>
          
          {childRoles.map((childRole, index) => (
            <div key={`child-${childRole.id}`} className="relative">
              {/* Horizontal connection line */}
              <div className="absolute left-6 top-6 w-4 h-px bg-blue-300"></div>
              
              {renderChildRole ? renderChildRole(childRole, allRoles, level + 1) : (
                <div className="ml-12">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {childRole.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-700">{childRole.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Subordinate</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// AddRoleModal Component
interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Omit<ResearchRole, 'id'>) => void;
  existingRoles: ResearchRole[];
}

const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingRoles
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a role name');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      parent_id: parentId || undefined
    });

    // Reset form
    setName('');
    setDescription('');
    setParentId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Add New Role</h3>
                <p className="text-blue-100 text-sm">Define a new research team position</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Role Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
              placeholder="e.g., Research Scientist"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              placeholder="Brief description of responsibilities and qualifications..."
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Reports To
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
            >
              <option value="">No supervisor (top level)</option>
              {existingRoles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 rounded-b-2xl p-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Role</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// EditRoleModal Component
interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleId: string, updates: Partial<ResearchRole>) => void;
  role: ResearchRole | null;
  existingRoles: ResearchRole[];
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  role,
  existingRoles
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');

  // Update form when role changes
  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setDescription(role.description || '');
      setParentId(role.parent_id || '');
    }
  }, [role]);

  const handleSave = () => {
    if (!role || !name.trim()) {
      alert('Please enter a role name');
      return;
    }

    onSave(role.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      parent_id: parentId || undefined
    });

    onClose();
  };

  if (!isOpen || !role) return null;

  // Filter out the current role and its descendants from parent options
  const getAvailableParents = (currentRoleId: string, allRoles: ResearchRole[]): ResearchRole[] => {
    const descendants = new Set<string>();
    
    const addDescendants = (roleId: string) => {
      descendants.add(roleId);
      allRoles.forEach(r => {
        if (r.parent_id === roleId) {
          addDescendants(r.id);
        }
      });
    };
    
    addDescendants(currentRoleId);
    
    return allRoles.filter(r => !descendants.has(r.id));
  };

  const availableParents = getAvailableParents(role.id, existingRoles);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Edit Role</h3>
                <p className="text-purple-100 text-sm">Update role information and hierarchy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Role Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg"
              placeholder="e.g., Research Scientist"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
              placeholder="Brief description of responsibilities and qualifications..."
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Reports To
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg"
            >
              <option value="">No supervisor (top level)</option>
              {availableParents.map(availableRole => (
                <option key={availableRole.id} value={availableRole.id}>
                  {availableRole.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 rounded-b-2xl p-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Changes</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Non-R&D Time Modal Component
interface NonRndModalProps {
  isOpen: boolean;
  onClose: () => void;
  nonRndTime: number;
  onUpdate: (percentage: number) => void;
}

const NonRndModal: React.FC<NonRndModalProps> = ({
  isOpen,
  onClose,
  nonRndTime,
  onUpdate
}) => {
  const [tempValue, setTempValue] = useState(nonRndTime);

  const handleSave = () => {
    onUpdate(tempValue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Configure Non-R&D Time</h3>
                <p className="text-orange-100 text-sm">Set time allocation for non-research activities</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-orange-800">Time Allocation</h4>
                <p className="text-xs text-orange-700">Set the percentage of time for non-research activities</p>
              </div>
            </div>
            <p className="text-sm text-orange-700">
              This includes administrative tasks, meetings, and other non-research work that reduces available R&D time.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Non-R&D Time</label>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-orange-600">
                  {tempValue}%
                </span>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max="50"
                value={tempValue}
                onChange={(e) => setTempValue(parseInt(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-orange-200 to-red-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #fed7aa 0%, #fed7aa ${tempValue * 2}%, #fecaca ${tempValue * 2}%, #fecaca 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-green-800">Available for R&D</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {100 - tempValue}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 rounded-b-2xl p-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Configuration</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Selectable Chip Component
interface SelectableChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  color?: string;
}

const SelectableChip: React.FC<SelectableChipProps> = ({
  label,
  selected,
  onToggle,
  color = "blue"
}) => {
  const colorClasses = {
    blue: selected ? "bg-blue-100 border-blue-300 text-blue-800" : "bg-white border-gray-300 text-gray-700 hover:border-blue-300",
    green: selected ? "bg-green-100 border-green-300 text-green-800" : "bg-white border-gray-300 text-gray-700 hover:border-green-300",
    purple: selected ? "bg-purple-100 border-purple-300 text-purple-800" : "bg-white border-gray-300 text-gray-700 hover:border-purple-300",
    orange: selected ? "bg-orange-100 border-orange-300 text-orange-800" : "bg-white border-gray-300 text-gray-700 hover:border-orange-300",
    pink: selected ? "bg-pink-100 border-pink-300 text-pink-800" : "bg-white border-gray-300 text-gray-700 hover:border-pink-300"
  };

  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
        colorClasses[color as keyof typeof colorClasses]
      } ${selected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
    >
      {selected && (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {label}
    </button>
  );
};

// Activity Card Component
interface ActivityCardProps {
  activity: SelectedActivity;
  allRoles: ResearchRole[];
  onUpdatePercentage: (percentage: number) => void;
  onUpdateRoles: (roles: string[]) => void;
  onRemove: () => void;
  color: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  allRoles,
  onUpdatePercentage,
  onUpdateRoles,
  onRemove,
  color
}) => {
  const colorClasses = {
    blue: "border-l-blue-500 bg-blue-50",
    green: "border-l-green-500 bg-green-50", 
    purple: "border-l-purple-500 bg-purple-50",
    orange: "border-l-orange-500 bg-orange-50",
    pink: "border-l-pink-500 bg-pink-50"
  };

  const handleRoleToggle = (roleId: string) => {
    const newRoles = activity.selected_roles.includes(roleId)
      ? activity.selected_roles.filter(id => id !== roleId)
      : [...activity.selected_roles, roleId];
    onUpdateRoles(newRoles);
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-6 ${colorClasses[color as keyof typeof colorClasses]} border-l-4`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activity.activity_name || activity.title || 'Unknown Activity'}
          </h3>
          
          {/* Activity Details */}
          {(activity.activity_category || activity.activity_area || activity.activity_focus) && (
            <div className="text-sm text-gray-600 mb-3">
              {activity.activity_category && <span className="mr-2">Category: {activity.activity_category}</span>}
              {activity.activity_area && <span className="mr-2">Area: {activity.activity_area}</span>}
              {activity.activity_focus && <span>Focus: {activity.activity_focus}</span>}
            </div>
          )}
          
          {/* Practice Percentage Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Practice Percentage</label>
              <span className="text-sm font-semibold text-blue-600">{activity.practice_percent.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="0.1"
              value={activity.practice_percent}
              onChange={(e) => onUpdatePercentage(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
        
        <button
          onClick={onRemove}
          className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Assigned Roles</label>
        <div className="flex flex-wrap gap-2">
          {allRoles.map(role => (
            <SelectableChip
              key={role.id}
              label={role.name}
              selected={activity.selected_roles.includes(role.id)}
              onToggle={() => handleRoleToggle(role.id)}
              color="blue"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ResearchExplorerStep: React.FC<ResearchExplorerStepProps> = ({
  selectedActivities: selectedActivitiesProp,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'activities' | 'design'>('roles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data from Supabase
  const [categories, setCategories] = useState<ResearchCategory[]>([]);
  const [areas, setAreas] = useState<ResearchArea[]>([]);
  const [focuses, setFocuses] = useState<ResearchFocus[]>([]);
  const [activities, setActivities] = useState<ResearchActivity[]>([]);
  const [subcomponents, setSubcomponents] = useState<ResearchSubcomponent[]>([]);
  
  // Roles states
  const [roles, setRoles] = useState<ResearchRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Selected filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedFocus, setSelectedFocus] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  
  // UI state
  const [showSubcomponents, setShowSubcomponents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<ResearchRole | null>(null);
  
  // New state for redesigned Activities tab
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedFocuses, setSelectedFocuses] = useState<string[]>([]);
  const [selectedActivitiesState, setSelectedActivitiesState] = useState<SelectedActivity[]>([]);

  // Business years state
  const [availableBusinessYears, setAvailableBusinessYears] = useState<Array<{id: string, year: number}>>([]);
  const [selectedBusinessYearId, setSelectedBusinessYearId] = useState<string>('');
  const [currentBusinessId, setCurrentBusinessId] = useState<string>('');
  const [showNonRndModal, setShowNonRndModal] = useState(false);

  // State for copy confirmation modal
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyType, setCopyType] = useState<'roles' | 'activities' | null>(null);
  const [copyTargetYear, setCopyTargetYear] = useState<string | null>(null);

  // Practice percentage configuration
  const [practicePercentageConfig, setPracticePercentageConfig] = useState<PracticePercentageConfig>({
    nonRndTime: 10, // Start at 10% instead of 0
    activities: {}
  });

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load available business years first
        await loadAvailableBusinessYears();
        
        // Then load research data and roles
        await Promise.all([
          loadResearchData(),
          loadRoles()
        ]);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load research data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Reload roles when business year changes
  useEffect(() => {
    if (selectedBusinessYearId) {
      console.log('Business year changed, loading roles for:', selectedBusinessYearId);
      loadRoles();
      // Also load selected activities when business year changes
      loadSelectedActivities();
    }
  }, [selectedBusinessYearId]);

  // Set default business year when available business years are loaded
  useEffect(() => {
    if (availableBusinessYears.length > 0 && !selectedBusinessYearId) {
      const firstYear = availableBusinessYears[0];
      console.log('Setting default business year:', firstYear.year, 'ID:', firstYear.id);
      setSelectedYear(firstYear.year);
      setSelectedBusinessYearId(firstYear.id);
    }
  }, [availableBusinessYears, selectedBusinessYearId]);

  // Load selected activities when year changes
  useEffect(() => {
    if (selectedYear) {
      loadSelectedActivities();
      loadFilterSelections();
    }
  }, [selectedYear]);

  // Reload selected activities when research data is loaded (to get proper activity names)
  useEffect(() => {
    if (selectedYear && categories.length > 0 && areas.length > 0 && focuses.length > 0) {
      loadSelectedActivities();
    }
  }, [selectedYear, categories, areas, focuses]);

  // Save filter selections whenever they change
  useEffect(() => {
    if (selectedYear) {
      saveFilterSelections();
    }
  }, [selectedCategories, selectedAreas, selectedFocuses, selectedYear]);

  const loadResearchData = async () => {
    setLoading(true);
    try {
      // Load all research data from Supabase
      const [categoriesResult, areasResult, focusesResult, activitiesResult, subcomponentsResult] = await Promise.all([
        supabase.from('rd_research_categories').select('*'),
        supabase.from('rd_areas').select('*'),
        supabase.from('rd_focuses').select('*'),
        supabase.from('rd_research_activities').select('*'),
        supabase.from('rd_subcomponents').select('*')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (areasResult.error) throw areasResult.error;
      if (focusesResult.error) throw focusesResult.error;
      if (activitiesResult.error) throw activitiesResult.error;
      if (subcomponentsResult.error) throw subcomponentsResult.error;

      // Set data with fallbacks for empty tables
      setCategories(categoriesResult.data || getDefaultCategories());
      setAreas(areasResult.data || []);
      setFocuses(focusesResult.data || []);
      setActivities(activitiesResult.data || getDefaultActivities());
      setSubcomponents(subcomponentsResult.data || []);
    } catch (err) {
      console.error('Error loading research data:', err);
      setError('Failed to load research data. Please try again.');
      // Set default data on error
      setCategories(getDefaultCategories());
      setActivities(getDefaultActivities());
    } finally {
      setLoading(false);
    }
  };

  // Load available business years for the current business
  const loadAvailableBusinessYears = async () => {
    try {
      console.log('Loading available business years...');
      
      // Get the current business ID from the wizard context or URL params
      // For now, we'll get the first business (this should be passed from the wizard)
      const { data: businesses, error: businessError } = await supabase
        .from('rd_businesses')
        .select('id')
        .limit(1);

      console.log('Businesses query result:', { businesses, businessError });

      if (businessError || !businesses || businesses.length === 0) {
        console.warn('No business found');
        setAvailableBusinessYears([]);
        setSelectedBusinessYearId('');
        setSelectedYear(2025);
        return;
      }

      const businessId = businesses[0].id;
      console.log('Found business ID:', businessId);
      setCurrentBusinessId(businessId); // Add this line to store the business ID

      // First, let's see ALL business years in the database to debug
      const { data: allBusinessYears, error: allYearsError } = await supabase
        .from('rd_business_years')
        .select('id, year, business_id')
        .order('year', { ascending: false });

      console.log('ALL business years in database:', { allBusinessYears, allYearsError });
      
      // Log the business_id values to debug the mismatch
      if (allBusinessYears && allBusinessYears.length > 0) {
        console.log('Business years with their business_id values:');
        allBusinessYears.forEach((year, index) => {
          console.log(`Year ${index + 1}:`, year);
        });
      }

      // Now get business years for this specific business
      const { data: businessYears, error: yearError } = await supabase
        .from('rd_business_years')
        .select('id, year')
        .eq('business_id', businessId)
        .order('year', { ascending: false });

      console.log('Business years query result:', { businessYears, yearError });

      if (yearError) {
        console.error('Error loading business years:', yearError);
        setAvailableBusinessYears([]);
        setSelectedBusinessYearId('');
        setSelectedYear(2025);
        return;
      }

      setAvailableBusinessYears(businessYears || []);
      
      // Don't automatically set the business year here - let the useEffect handle it
      if (businessYears && businessYears.length > 0) {
        console.log('Found business years:', businessYears);
      } else {
        console.warn('No business years found for business:', businessId);
        
        // Create business years for this business if none exist
        await createBusinessYearsForBusiness(businessId);
        
        // Reload business years after creating them
        const { data: newBusinessYears, error: newYearError } = await supabase
          .from('rd_business_years')
          .select('id, year')
          .eq('business_id', businessId)
          .order('year', { ascending: false });
        
        if (newYearError) {
          console.error('Error loading new business years:', newYearError);
        } else {
          console.log('Created and loaded new business years:', newBusinessYears);
          setAvailableBusinessYears(newBusinessYears || []);
        }
      }
    } catch (error) {
      console.error('Error loading business years:', error);
      setAvailableBusinessYears([]);
      setSelectedBusinessYearId('');
      setSelectedYear(2025);
    }
  };

  const loadRoles = async () => {
    try {
      if (!selectedBusinessYearId) {
        console.warn('No business year selected, skipping roles load');
        return;
      }

      console.log('Loading roles for business year:', selectedBusinessYearId);

      const { data: roles, error } = await supabase
        .from('rd_roles')
        .select('*')
        .eq('business_year_id', selectedBusinessYearId)
        .order('name');

      if (error) {
        console.error('Error loading roles:', error);
        setRoles([]);
        return;
      }

      console.log('Loaded roles:', roles);

      if (roles && roles.length > 0) {
        setRoles(roles);
      } else {
        // No roles found for this business year, ask user if they want to copy
        console.log('No roles found for this business year, asking user if they want to copy');
        setCopyType('roles');
        setShowCopyModal(true);
        setRoles([]);
      }
    } catch (err) {
      console.error('Error loading roles:', err);
      setRoles([]);
    }
  };

  // Copy roles from current year to target year
  const copyRolesFromYear = async (sourceBusinessYearId: string) => {
    try {
      console.log('🔄 Starting role copy process...');
      console.log('📅 Available business years:', availableBusinessYears);
      console.log('🎯 Source business year ID:', sourceBusinessYearId);
      console.log('🎯 Current business year ID:', selectedBusinessYearId);
      
      if (!selectedBusinessYearId) {
        console.warn('No current business year selected for copying');
        return;
      }

      if (selectedBusinessYearId === sourceBusinessYearId) {
        console.log('Source year is current year, no copying needed');
        return;
      }

      console.log(`🔄 Copying roles from year ${sourceBusinessYearId} to current year ${selectedBusinessYearId}`);

      // Get all roles from source year
      const { data: sourceRoles, error: sourceError } = await supabase
        .from('rd_roles')
        .select('*')
        .eq('business_year_id', sourceBusinessYearId)
        .order('name');

      if (sourceError) {
        console.error('Error loading source year roles:', sourceError);
        return;
      }

      console.log(`📋 Found ${sourceRoles?.length || 0} roles in source year:`, sourceRoles);

      if (!sourceRoles || sourceRoles.length === 0) {
        console.log('No roles to copy from source year');
        return;
      }

      // Create a mapping from old role IDs to new role IDs
      const roleIdMapping = new Map<string, string>();

      // Create a temporary save function for copying that uses the current year ID
      const saveRoleForCopy = async (role: Omit<ResearchRole, 'id'>, targetYearId: string) => {
        try {
          console.log(`💾 Saving role "${role.name}" to target year ${targetYearId}`);
          
          // Guard against empty business_id
          if (!currentBusinessId) {
            throw new Error('No business ID available. Please ensure business is loaded first.');
          }
          
          // Prepare the role data for the target year
          const roleData: any = {
            name: role.name,
            description: role.description,
            parent_id: undefined, // Will be updated after all roles are copied
            is_default: role.is_default || false,
            business_year_id: targetYearId,
            business_id: currentBusinessId
          };
          
          console.log('📝 Role data to insert:', roleData);
          
          const { data, error } = await supabase
            .from('rd_roles')
            .insert(roleData)
            .select()
            .single();

          if (error) {
            console.error('Database error saving copied role:', error);
            throw error;
          }
          
          console.log(`✅ Successfully saved role "${role.name}" with ID:`, data.id);
          return data;
        } catch (error) {
          console.error('Error saving copied role:', error);
          throw error;
        }
      };

      // First pass: Copy all roles without parent relationships
      const copiedRoles = [];
      for (const role of sourceRoles) {
        try {
          console.log(`🔄 Copying role: ${role.name} (ID: ${role.id})`);
          const newRole = await saveRoleForCopy({
            name: role.name,
            description: role.description,
            parent_id: undefined, // Set to undefined initially
            is_default: role.is_default
          }, selectedBusinessYearId);
          
          // Store the mapping from old ID to new ID
          roleIdMapping.set(role.id, newRole.id);
          copiedRoles.push(newRole);
          console.log(`✅ Successfully copied role "${role.name}" (${role.id} -> ${newRole.id})`);
        } catch (copyError) {
          console.error(`❌ Error copying role ${role.name}:`, copyError);
        }
      }

      // Second pass: Update parent relationships using the new role IDs
      for (const role of sourceRoles) {
        if (role.parent_id && roleIdMapping.has(role.parent_id)) {
          const newRoleId = roleIdMapping.get(role.id);
          const newParentId = roleIdMapping.get(role.parent_id);
          
          if (newRoleId && newParentId) {
            try {
              console.log(`🔄 Updating parent relationship for role ${role.name}: ${newRoleId} -> ${newParentId}`);
              
              const { error: updateError } = await supabase
                .from('rd_roles')
                .update({ parent_id: newParentId })
                .eq('id', newRoleId);
              
              if (updateError) {
                console.error(`❌ Error updating parent relationship for ${role.name}:`, updateError);
              } else {
                console.log(`✅ Successfully updated parent relationship for ${role.name}`);
                // Update the copied role in our array
                const roleIndex: number = copiedRoles.findIndex(r => r.id === newRoleId);
                if (roleIndex !== -1) {
                  copiedRoles[roleIndex] = { ...copiedRoles[roleIndex], parent_id: newParentId };
                }
              }
            } catch (updateError) {
              console.error(`❌ Error updating parent relationship for ${role.name}:`, updateError);
            }
          }
        }
      }

      console.log(`🎉 Successfully copied ${copiedRoles.length} roles to current year`);
      console.log('📋 Copied roles:', copiedRoles);
      console.log('🔄 Role ID mapping:', Object.fromEntries(roleIdMapping));
      
      // Update the roles state with the copied roles
      setRoles(copiedRoles);
    } catch (error) {
      console.error('❌ Error copying roles:', error);
    }
  };

  // Default categories if database is empty
  const getDefaultCategories = (): ResearchCategory[] => [
    {
      id: 'software-dev',
      name: 'Software Development',
      description: 'Research activities related to software development and programming'
    },
    {
      id: 'product-design',
      name: 'Product Design',
      description: 'Research activities related to product design and development'
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      description: 'Research activities related to manufacturing processes'
    }
  ];

  // Default activities if database is empty
  const getDefaultActivities = (): ResearchActivity[] => [
    {
      id: 'software-architecture',
      title: 'Software Architecture Design',
      focus_id: 'software-dev',
      general_description: 'Designing and developing new software architectures',
      examples: 'Creating new database schemas, API designs, system architectures'
    },
    {
      id: 'algorithm-development',
      title: 'Algorithm Development',
      focus_id: 'software-dev',
      general_description: 'Developing new algorithms and computational methods',
      examples: 'Machine learning algorithms, optimization algorithms, data processing algorithms'
    },
    {
      id: 'product-prototyping',
      title: 'Product Prototyping',
      focus_id: 'product-design',
      general_description: 'Creating prototypes and testing new product concepts',
      examples: '3D printing prototypes, user interface mockups, functional prototypes'
    }
  ];

  // Save role to database
  const saveRole = async (role: Omit<ResearchRole, 'id'>) => {
    try {
      if (!selectedBusinessYearId) {
        throw new Error('No business year selected. Please select a year first.');
      }
      
      // Add debugging for business_id
      console.log('saveRole - currentBusinessId:', currentBusinessId);
      console.log('saveRole - selectedBusinessYearId:', selectedBusinessYearId);
      
      // Guard against empty business_id
      if (!currentBusinessId) {
        throw new Error('No business ID available. Please ensure business is loaded first.');
      }
      
      // Validate parent_id if provided
      let validatedParentId: string | null = null;
      if (role.parent_id) {
        // Check if the parent role exists in the database for the same business year
        const { data: parentRole, error: parentError } = await supabase
          .from('rd_roles')
          .select('id')
          .eq('id', role.parent_id)
          .eq('business_year_id', selectedBusinessYearId)
          .single();
        
        if (parentError || !parentRole) {
          console.warn('Parent role not found in database for this business year, setting parent_id to null:', role.parent_id);
          validatedParentId = null;
        } else {
          validatedParentId = role.parent_id;
        }
      }
      
      // Prepare the role data
      const roleData: any = {
        name: role.name,
        parent_id: validatedParentId,
        is_default: role.is_default || false,
        business_year_id: selectedBusinessYearId,
        business_id: currentBusinessId
      };
      
      const { data, error } = await supabase
        .from('rd_roles')
        .insert(roleData)
        .select()
        .single();

      if (error) {
        console.error('Database error saving role:', error);
        throw error;
      }
      
      // Add the new role to local state instead of reloading all roles
      setRoles(prev => [...prev, data]);
      
      return data;
    } catch (error) {
      console.error('Error saving role:', error);
      throw error;
    }
  };

  // Filtered data based on selections
  const filteredAreas = areas.filter(area => 
    !selectedCategory || area.category_id === selectedCategory
  );

  const filteredFocuses = focuses.filter(focus => 
    !selectedArea || focus.area_id === selectedArea
  );

  const filteredActivities = activities.filter(activity => 
    !selectedFocus || activity.focus_id === selectedFocus
  );

  const filteredSubcomponents = subcomponents.filter(subcomponent => 
    !selectedActivity || subcomponent.activity_id === selectedActivity
  );

  // Search filtered activities
  const searchFilteredActivities = filteredActivities.filter(activity =>
    (activity.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (activity.general_description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (activity.examples?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedArea('');
    setSelectedFocus('');
    setSelectedActivity('');
    setShowSubcomponents(false);
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId);
    setSelectedFocus('');
    setSelectedActivity('');
    setShowSubcomponents(false);
  };

  const handleFocusChange = (focusId: string) => {
    setSelectedFocus(focusId);
    setSelectedActivity('');
    setShowSubcomponents(false);
  };

  const handleActivitySelect = (activity: ResearchActivity) => {
    setSelectedActivity(activity.id);
    setShowSubcomponents(true);
  };

  const handleAddActivity = (activity: ResearchActivity, subcomponents: ResearchSubcomponent[]) => {
    const activityWithSubcomponents = {
      ...activity,
      subcomponents,
      selectedSubcomponents: subcomponents.map(sc => sc.id)
    };

    const updatedActivities = [...selectedActivitiesState, activityWithSubcomponents];
    onUpdate({ selectedActivities: updatedActivities });
  };

  const handleRemoveActivity = (activityId: string) => {
    const updatedActivities = selectedActivitiesState.filter(a => a.activity_id !== activityId);
    onUpdate({ selectedActivities: updatedActivities });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown Category';
  };

  const getAreaName = (areaId: string) => {
    return areas.find(a => a.id === areaId)?.name || 'Unknown Area';
  };

  const getFocusName = (focusId: string) => {
    return focuses.find(f => f.id === focusId)?.name || 'Unknown Focus';
  };

  // New functions for redesigned Activities tab
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

  const getFilteredActivities = () => {
    if (selectedFocuses.length === 0) return [];
    
    return activities.filter(activity => selectedFocuses.includes(activity.focus_id));
  };

  const calculateAvailablePercentage = () => {
    const usedPercentage = Object.values(practicePercentageConfig.activities).reduce((sum, percent) => sum + percent, 0);
    return 100 - practicePercentageConfig.nonRndTime - usedPercentage;
  };

  const addActivity = async (activity: ResearchActivity) => {
    const availablePercentage = 100 - practicePercentageConfig.nonRndTime;
    const newTotalActivities = selectedActivitiesState.length + 1;
    const equalShare = Math.round((availablePercentage / newTotalActivities) * 100) / 100;

    // Get default roles from the research activity
    let defaultRoles: string[] = [];
    try {
      const { data: activityData, error } = await supabase
        .from('rd_research_activities')
        .select('default_roles')
        .eq('id', activity.id)
        .single();
      
      if (!error && activityData?.default_roles) {
        defaultRoles = Array.isArray(activityData.default_roles) ? activityData.default_roles : [];
      }
    } catch (error) {
      console.error('Error loading default roles:', error);
    }

    // Build new activities config with equal shares
    const updatedActivities: { [activityId: string]: number } = {};
    selectedActivitiesState.forEach(act => {
      updatedActivities[act.activity_id] = equalShare;
    });
    updatedActivities[activity.id] = equalShare;

    // Update state and save to database
    setPracticePercentageConfig(prev => ({
      ...prev,
      activities: updatedActivities
    }));

    // Update all selected activities' practice_percent
    for (const act of selectedActivitiesState) {
      try {
        const { error } = await supabase
          .from('rd_selected_activities')
          .update({ practice_percent: equalShare })
          .eq('business_year_id', selectedBusinessYearId)
          .eq('activity_id', act.activity_id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating activity percentage:', error);
      }
    }

    // Add activity to selected activities
    const newSelectedActivity: SelectedActivity = {
      id: activity.id,
      activity_id: activity.id,
      title: activity.title,
      activity_name: activity.title,
      activity_category: undefined,
      activity_area: undefined,
      activity_focus: undefined,
      practice_percent: equalShare,
      selected_roles: defaultRoles,
      config: {},
      created_at: undefined,
      updated_at: undefined
    };
    setSelectedActivitiesState(prev => [...prev.map(act => ({ ...act, practice_percent: equalShare })), newSelectedActivity]);

    // Save new activity to database
    try {
      const { error } = await supabase
        .from('rd_selected_activities')
        .insert({
          business_year_id: selectedBusinessYearId,
          activity_id: activity.id,
          practice_percent: equalShare,
          selected_roles: defaultRoles,
          config: {}
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving selected activity:', error);
    }
  };

  const updateActivityPercentage = async (activityId: string, newPercentage: number) => {
    const availablePercentage = 100 - practicePercentageConfig.nonRndTime;
    const currentTotal = selectedActivitiesState.reduce((sum, act) => sum + act.practice_percent, 0);
    const currentActivity = selectedActivitiesState.find(a => a.activity_id === activityId);
    
    if (!currentActivity) return;
    
    const currentPercentage = currentActivity.practice_percent;
    const difference = newPercentage - currentPercentage;
    
    // If the new total would exceed available space, redistribute proportionally
    if (currentTotal + difference > availablePercentage) {
      const otherActivities = selectedActivitiesState.filter(a => a.activity_id !== activityId);
      const otherTotal = otherActivities.reduce((sum, act) => sum + act.practice_percent, 0);
      const remainingPercentage = availablePercentage - newPercentage;
      
      if (remainingPercentage < 0) {
        // New percentage is too high, cap it
        newPercentage = availablePercentage;
      } else {
        // Redistribute remaining percentage proportionally among other activities
        const scaleFactor = remainingPercentage / otherTotal;
        const updatedActivities = selectedActivitiesState.map(act => {
          if (act.activity_id === activityId) {
            return { ...act, practice_percent: newPercentage };
          } else {
            return { ...act, practice_percent: Math.round(act.practice_percent * scaleFactor * 100) / 100 };
          }
        });
        
        setSelectedActivitiesState(updatedActivities);
        
        // Update practice percentage config
        const updatedConfig = { ...practicePercentageConfig.activities };
        updatedActivities.forEach(act => {
          updatedConfig[act.activity_id] = act.practice_percent;
        });
        
        setPracticePercentageConfig(prev => ({
          ...prev,
          activities: updatedConfig
        }));
        
        // Update remaining activities in database
        for (const act of updatedActivities) {
          try {
            const { error } = await supabase
              .from('rd_selected_activities')
              .update({ practice_percent: act.practice_percent })
              .eq('business_year_id', selectedBusinessYearId)
              .eq('activity_id', act.activity_id);
            
            if (error) throw error;
          } catch (error) {
            console.error('Error updating activity percentage:', error);
          }
        }
        
        return;
      }
    }
    
    // Simple update without redistribution
    setSelectedActivitiesState(prev => 
      prev.map(act => 
        act.activity_id === activityId 
          ? { ...act, practice_percent: newPercentage }
          : act
      )
    );
    
    // Update practice percentage config
    setPracticePercentageConfig(prev => ({
      ...prev,
      activities: {
        ...prev.activities,
        [activityId]: newPercentage
      }
    }));
    
    // Update individual activity in database
    try {
      const { error } = await supabase
        .from('rd_selected_activities')
        .update({ practice_percent: newPercentage })
        .eq('business_year_id', selectedBusinessYearId)
        .eq('activity_id', activityId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating activity percentage:', error);
    }
  };

  const removeActivity = async (activityId: string) => {
    const remainingActivities = selectedActivitiesState.filter(a => a.activity_id !== activityId);
    const availablePercentage = 100 - practicePercentageConfig.nonRndTime;
    const newTotal = remainingActivities.length;
    const equalShare = newTotal > 0 ? Math.round((availablePercentage / newTotal) * 100) / 100 : 0;
    const updatedActivities: { [activityId: string]: number } = {};
    remainingActivities.forEach(act => {
      updatedActivities[act.activity_id] = equalShare;
    });

    setPracticePercentageConfig(prev => ({
      ...prev,
      activities: updatedActivities
    }));

    // Update practice percentage config in state only (no separate table needed)

    // Update all remaining activities' practice_percent
    for (const act of remainingActivities) {
      try {
        const { error } = await supabase
          .from('rd_selected_activities')
          .update({ practice_percent: equalShare })
          .eq('business_year_id', selectedBusinessYearId)
          .eq('activity_id', act.activity_id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating activity percentage:', error);
      }
    }

    setSelectedActivitiesState(remainingActivities.map(act => ({ ...act, practice_percent: equalShare })));

    // Delete the removed activity from database
    try {
      const { error } = await supabase
        .from('rd_selected_activities')
        .delete()
        .eq('business_year_id', selectedBusinessYearId)
        .eq('activity_id', activityId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting selected activity:', error);
    }
  };

  const deleteSelectedActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('rd_selected_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting selected activity:', err);
    }
  };

  const updateActivityRoles = async (activityId: string, selectedRoles: string[]) => {
    setSelectedActivitiesState(prev => 
      prev.map(activity => 
        activity.activity_id === activityId 
          ? { ...activity, selected_roles: selectedRoles }
          : activity
      )
    );

    // Update in database
    const activity = selectedActivitiesState.find(a => a.activity_id === activityId);
    if (activity) {
      await updateSelectedActivity(activity.id, { selected_roles: selectedRoles });
    }
  };

  const saveSelectedActivity = async (activity: Omit<SelectedActivity, 'id'>) => {
    try {
      if (!selectedBusinessYearId) {
        throw new Error('No business year selected. Please select a year first.');
      }

      const { data, error } = await supabase
        .from('rd_selected_activities')
        .insert({
          business_year_id: selectedBusinessYearId,
          activity_id: activity.activity_id,
          practice_percent: activity.practice_percent,
          selected_roles: activity.selected_roles,
          config: activity.config
        })
        .select()
        .single();

      if (error) throw error;

      // Return the saved activity with all fields
      return {
        id: data.id,
        activity_id: data.activity_id,
        title: activity.title,
        activity_name: activity.activity_name,
        activity_category: activity.activity_category,
        activity_area: activity.activity_area,
        activity_focus: activity.activity_focus,
        practice_percent: data.practice_percent,
        selected_roles: data.selected_roles,
        config: data.config,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (err) {
      console.error('Error saving selected activity:', err);
      return null;
    }
  };

  const updateSelectedActivity = async (activityId: string, updates: Partial<SelectedActivity>) => {
    try {
      const { error } = await supabase
        .from('rd_selected_activities')
        .update(updates)
        .eq('id', activityId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating selected activity:', err);
    }
  };

  // Copy activities from source year to current year
  const copyActivitiesFromYear = async (sourceBusinessYearId: string) => {
    try {
      console.log('🔄 Starting activity copy process...');
      console.log('📅 Available business years:', availableBusinessYears);
      console.log('🎯 Source business year ID:', sourceBusinessYearId);
      console.log('🎯 Current business year ID:', selectedBusinessYearId);
      
      if (!selectedBusinessYearId) {
        console.warn('No current business year selected for copying');
        return;
      }

      if (selectedBusinessYearId === sourceBusinessYearId) {
        console.log('Source year is current year, no copying needed');
        return;
      }

      console.log(`Copying activities from source year ${sourceBusinessYearId} to current year ${selectedBusinessYearId}`);

      // Get all activities from source year
      const { data: sourceYearActivities, error: fetchError } = await supabase
        .from('rd_selected_activities')
        .select('*')
        .eq('business_year_id', sourceBusinessYearId);

      if (fetchError) {
        console.error('Error fetching source year activities:', fetchError);
        return;
      }

      if (!sourceYearActivities || sourceYearActivities.length === 0) {
        console.log('No activities found in source year to copy');
        return;
      }

      console.log(`Found ${sourceYearActivities.length} activities to copy`);

      // Get all available roles for the current year to pre-select them
      const { data: currentYearRoles, error: rolesError } = await supabase
        .from('rd_roles')
        .select('id')
        .eq('business_year_id', selectedBusinessYearId);

      if (rolesError) {
        console.error('Error fetching current year roles:', rolesError);
        return;
      }

      const allRoleIds = currentYearRoles?.map(role => role.id) || [];

      // Copy each activity to the current year with all roles pre-selected
      for (const activity of sourceYearActivities) {
        try {
          const { data: newActivity, error: insertError } = await supabase
            .from('rd_selected_activities')
            .insert({
              business_year_id: selectedBusinessYearId,
              activity_id: activity.activity_id,
              practice_percent: activity.practice_percent,
              selected_roles: allRoleIds, // Pre-select all roles instead of copying original selection
              config: activity.config
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Error copying activity ${activity.id}:`, insertError);
          } else {
            console.log(`✅ Successfully copied activity ${activity.activity_id} to current year with all roles pre-selected`);
          }
        } catch (copyError) {
          console.error(`Error copying activity ${activity.id}:`, copyError);
        }
      }

      console.log('🔄 Activity copy process completed');
      
      // Reload the activities for the current year
      await loadSelectedActivities();
    } catch (error) {
      console.error('Error in copyActivitiesFromYear:', error);
    }
  };

  const loadSelectedActivities = async () => {
    try {
      if (!selectedBusinessYearId) {
        console.warn('No business year selected, skipping selected activities load');
        return;
      }

      const { data, error } = await supabase
        .from('rd_selected_activities')
        .select(`
          id,
          activity_id,
          practice_percent,
          selected_roles,
          config,
          rd_research_activities (
            id,
            title,
            focus_id
          )
        `)
        .eq('business_year_id', selectedBusinessYearId);

      if (error) {
        console.error('Error loading selected activities:', error);
        return;
      }

      if (data && data.length > 0) {
        const mappedActivities = data.map(activity => {
          // Get the related focus, area, and category names
          const focusObj = (focuses as { id: string; name: string; area_id: string }[]).find((f) => f.id === activity.rd_research_activities?.focus_id);
          const area = focusObj ? (areas as { id: string; name: string; category_id: string }[]).find((a) => a.id === focusObj.area_id) : null;
          const category = area ? (categories as { id: string; name: string }[]).find((c) => c.id === area.category_id) : null;

          return {
            id: activity.id,
            activity_id: activity.activity_id,
            practice_percent: activity.practice_percent,
            selected_roles: Array.isArray(activity.selected_roles) ? activity.selected_roles : [],
            config: activity.config,
            activity_name: activity.rd_research_activities?.title || 'Unknown Activity',
            activity_category: category?.name || '',
            activity_area: area?.name || '',
            activity_focus: focusObj?.name || ''
          };
        });

        setSelectedActivitiesState(mappedActivities);
        
        // Rebuild practice percentage config from loaded activities
        const activitiesConfig: { [activityId: string]: number } = {};
        mappedActivities.forEach(activity => {
          activitiesConfig[activity.activity_id] = activity.practice_percent;
        });
        
        setPracticePercentageConfig(prev => ({
          ...prev,
          activities: activitiesConfig
        }));
        
        // Only update parent component if we have activities from database
        // This prevents overwriting wizard state when no activities exist
        if (mappedActivities.length > 0) {
          onUpdate({ selectedActivities: mappedActivities });
        }
      } else {
        // No activities found for this business year, ask user if they want to copy
        console.log('No activities found for this business year, asking user if they want to copy');
        setCopyType('activities');
        setShowCopyModal(true);
        
        // Set empty state
        setSelectedActivitiesState([]);
        setPracticePercentageConfig(prev => ({
          nonRndTime: 10, // Ensure Non-R&D starts at 10%
          activities: {}
        }));
        
        onUpdate({
          selectedActivities: [],
          practicePercentageConfig: {
            nonRndTime: 10, // Ensure Non-R&D starts at 10%
            activities: {}
          }
        });
      }
    } catch (error) {
      console.error('Error loading selected activities:', error);
    }
  };

  // Load filter selections from database
  const loadFilterSelections = async () => {
    try {
      if (!selectedBusinessYearId) {
        console.warn('[ResearchExplorerStep] No business year selected, skipping filter selections load');
        return;
      }

      const { data, error } = await supabase
        .from('rd_selected_filter')
        .select('*')
        .eq('business_year_id', selectedBusinessYearId)
        .single();

      console.log('[ResearchExplorerStep] loadFilterSelections - query result:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading filter selections:', error);
        return;
      }

      if (data) {
        setSelectedCategories(data.selected_categories || []);
        setSelectedAreas(data.selected_areas || []);
        setSelectedFocuses(data.selected_focuses || []);
      }
    } catch (error) {
      console.error('Error loading filter selections:', error);
    }
  };

  // Save filter selections to database
  const saveFilterSelections = async () => {
    try {
      if (!selectedBusinessYearId) {
        console.warn('No business year selected, skipping filter selections save');
        return;
      }

      const { error } = await supabase
        .from('rd_selected_filter')
        .upsert({
          business_year_id: selectedBusinessYearId,
          selected_categories: selectedCategories,
          selected_areas: selectedAreas,
          selected_focuses: selectedFocuses,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'business_year_id' });

      if (error) {
        console.error('Error saving filter selections:', error);
      }
    } catch (error) {
      console.error('Error saving filter selections:', error);
    }
  };

  const moveRoleUp = useCallback((roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    
    // Find siblings (roles with same parent)
    const siblings = roles.filter(r => r.parent_id === role.parent_id);
    const currentIndex = siblings.findIndex(r => r.id === roleId);
    
    if (currentIndex > 0) {
      const newRoles = [...roles];
      const currentRoleIndex = newRoles.findIndex(r => r.id === roleId);
      const prevRoleIndex = newRoles.findIndex(r => r.id === siblings[currentIndex - 1].id);
      
      // Swap the roles
      [newRoles[currentRoleIndex], newRoles[prevRoleIndex]] = [newRoles[prevRoleIndex], newRoles[currentRoleIndex]];
      setRoles(newRoles);
    }
  }, [roles]);

  const moveRoleDown = useCallback((roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    
    // Find siblings (roles with same parent)
    const siblings = roles.filter(r => r.parent_id === role.parent_id);
    const currentIndex = siblings.findIndex(r => r.id === roleId);
    
    if (currentIndex < siblings.length - 1) {
      const newRoles = [...roles];
      const currentRoleIndex = newRoles.findIndex(r => r.id === roleId);
      const nextRoleIndex = newRoles.findIndex(r => r.id === siblings[currentIndex + 1].id);
      
      // Swap the roles
      [newRoles[currentRoleIndex], newRoles[nextRoleIndex]] = [newRoles[nextRoleIndex], newRoles[currentRoleIndex]];
      setRoles(newRoles);
    }
  }, [roles]);

  const editRole = useCallback(async (role: ResearchRole) => {
    setEditingRole(role);
    setShowEditRoleModal(true);
  }, []);

  const updateRole = useCallback(async (roleId: string, updates: Partial<ResearchRole>) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('rd_roles')
        .update(updates)
        .eq('id', roleId);
      
      if (error) throw error;
      
      // Update local state
      setRoles(prev => prev.map(role => 
        role.id === roleId 
          ? { ...role, ...updates, updated_at: new Date().toISOString() }
          : role
      ));
      
      setShowEditRoleModal(false);
      setEditingRole(null);
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role. Please try again.');
    }
  }, []);

  const deleteRole = useCallback(async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    
    // Check if role has children
    const hasChildren = roles.some(r => r.parent_id === roleId);
    if (hasChildren) {
      alert(`Cannot delete "${role.name}" because it has subordinate roles. Please reassign or delete the subordinate roles first.`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      try {
        // Always try to delete from database, regardless of created_at status
        const { error } = await supabase
          .from('rd_roles')
          .delete()
          .eq('id', roleId);
        
        if (error) {
          console.error('Database error deleting role:', error);
          throw error;
        }
        
        // Remove from local state only after successful database deletion
        setRoles(prev => prev.filter(r => r.id !== roleId));
        console.log(`Successfully deleted role: ${role.name}`);
      } catch (err) {
        console.error('Error deleting role:', err);
        alert('Failed to delete role. Please try again.');
      }
    }
  }, [roles]);

  // Helper function to render RoleCard with proper function bindings
  const renderRoleCard = useCallback((role: ResearchRole, allRoles: ResearchRole[], level: number = 0) => {
    const siblings = allRoles.filter(r => r.parent_id === role.parent_id);
    const currentIndex = siblings.findIndex(r => r.id === role.id);
    
    return (
      <RoleCard
        key={`role-${role.id}`}
        role={role}
        allRoles={allRoles}
        onMoveUp={() => moveRoleUp(role.id)}
        onMoveDown={() => moveRoleDown(role.id)}
        onEdit={() => editRole(role)}
        onDelete={() => deleteRole(role.id)}
        canMoveUp={currentIndex > 0}
        canMoveDown={currentIndex < siblings.length - 1}
        level={level}
      />
    );
  }, [moveRoleUp, moveRoleDown, editRole, deleteRole]);

  // Modal handlers for copy confirmation
  const handleCopyConfirm = async (sourceYearId: string) => {
    if (copyType === 'roles') {
      await copyRolesFromYear(sourceYearId);
    } else if (copyType === 'activities') {
      await copyActivitiesFromYear(sourceYearId);
    }
  };

  const handleCopyModalClose = () => {
    setShowCopyModal(false);
    setCopyType(null);
    setCopyTargetYear(null);
  };

  // Update Non-R&D percentage and redistribute activities to maintain 100% total
  const updateNonRndPercentage = async (newPercentage: number) => {
    const availablePercentage = 100 - newPercentage;
    const currentActivities = selectedActivitiesState;
    
    if (currentActivities.length === 0) {
      // No activities to redistribute
      setPracticePercentageConfig(prev => ({
        ...prev,
        nonRndTime: newPercentage
      }));
      return;
    }
    
    // Redistribute activities proportionally to maintain 100% total
    const totalActivityPercentage = currentActivities.reduce((sum, act) => sum + act.practice_percent, 0);
    const scalingFactor = availablePercentage / totalActivityPercentage;
    
    const updatedActivities = currentActivities.map(activity => ({
      ...activity,
      practice_percent: Math.round(activity.practice_percent * scalingFactor * 100) / 100
    }));
    
    // Final check: ensure total equals exactly 100%
    const finalTotal = updatedActivities.reduce((sum, act) => sum + act.practice_percent, 0) + newPercentage;
    if (Math.abs(finalTotal - 100) > 0.01) {
      // Adjust the first activity to make total exactly equal to 100%
      const adjustment = 100 - finalTotal;
      if (updatedActivities.length > 0) {
        updatedActivities[0].practice_percent = Math.round((updatedActivities[0].practice_percent + adjustment) * 100) / 100;
      }
    }
    
    // Update all activities in database
    for (const updatedActivity of updatedActivities) {
      await updateSelectedActivity(updatedActivity.id, { practice_percent: updatedActivity.practice_percent });
    }
    
    setSelectedActivitiesState(updatedActivities);
    
    // Update practice percentage config
    const activitiesConfig: { [activityId: string]: number } = {};
    updatedActivities.forEach(activity => {
      activitiesConfig[activity.activity_id] = activity.practice_percent;
    });
    
    setPracticePercentageConfig(prev => ({
      nonRndTime: newPercentage,
      activities: activitiesConfig
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading research data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadResearchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Research Explorer
        </h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'roles'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Roles
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'activities'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Activities
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'design'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Research Guidelines
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'roles' && (
          <div className="space-y-6">
            {/* Enhanced Header with Year Selector */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    Research Roles
                  </h4>
                  <p className="text-gray-600 text-lg">Define your research team hierarchy and responsibilities</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <label className="text-sm font-medium text-gray-700">Year:</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => {
                          const year = parseInt(e.target.value);
                          setSelectedYear(year);
                          const businessYear = availableBusinessYears.find(by => by.year === year);
                          if (businessYear) {
                            setSelectedBusinessYearId(businessYear.id);
                          }
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-transparent"
                      >
                        {availableBusinessYears.length > 0 ? (
                          availableBusinessYears.map(businessYear => (
                            <option key={businessYear.id} value={businessYear.year}>
                              {businessYear.year}
                            </option>
                          ))
                        ) : (
                          <option value="">No years available</option>
                        )}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600">Active configuration</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCopyModal(true)}
                    className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy from Year</span>
                  </button>
                  <button
                    onClick={() => setShowAddRoleModal(true)}
                    className="btn-primary-modern flex items-center space-x-2 px-6 py-3"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Role</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Year Baseline Notice */}
            {selectedYear !== 2025 && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-semibold text-amber-800">Year-specific modifications</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Changes made for {selectedYear} will override the baseline configuration from 2025.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Org Chart Visualization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-lg font-semibold text-gray-900">Organization Chart</h5>
                      <p className="text-sm text-gray-600">Visualize your research team structure</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {roles.length} role{roles.length !== 1 ? 's' : ''} defined
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {roles.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No roles defined yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Start building your research team by creating roles that define responsibilities and hierarchy.
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={() => setShowAddRoleModal(true)}
                        className="btn-primary-modern flex items-center space-x-2 px-6 py-3"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Create First Role</span>
                      </button>
                      <button
                        onClick={() => setShowCopyModal(true)}
                        className="px-4 py-3 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy from Another Year</span>
                      </button>
                    </div>
                    
                    {/* Quick Tips */}
                    <div className="mt-12 bg-gray-50 rounded-xl p-6 max-w-2xl mx-auto">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Quick Tips
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-gray-900">Start with leadership roles</span>
                            <p className="text-gray-500 mt-1">Create senior positions first, then add subordinates</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-gray-900">Use clear descriptions</span>
                            <p className="text-gray-500 mt-1">Include responsibilities and qualifications</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-gray-900">Establish hierarchy</span>
                            <p className="text-gray-500 mt-1">Set up reporting relationships between roles</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-gray-900">Mark default roles</span>
                            <p className="text-gray-500 mt-1">Identify roles that are automatically assigned</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Top Level Roles */}
                    {roles.filter(role => !role.parent_id).map((role, index) => (
                      <RoleCard
                        key={`role-${role.id}`}
                        role={role}
                        allRoles={roles}
                        onMoveUp={() => moveRoleUp(role.id)}
                        onMoveDown={() => moveRoleDown(role.id)}
                        onEdit={() => editRole(role)}
                        onDelete={() => deleteRole(role.id)}
                        canMoveUp={index > 0}
                        canMoveDown={index < roles.filter(r => !r.parent_id).length - 1}
                        level={0}
                        renderChildRole={renderRoleCard}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6">
            {/* Practice Percentage Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-gray-900">Practice Percentage</h4>
                  <button
                    onClick={() => setShowNonRndModal(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Total: 100% (Non-R&D: {practicePercentageConfig.nonRndTime}% | Research: {100 - practicePercentageConfig.nonRndTime}%)
                </div>
              </div>
              
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                {/* Non-R&D Time */}
                <div 
                  className="absolute left-0 top-0 h-full bg-gray-400 flex items-center justify-center transition-all duration-500"
                  style={{ width: `${practicePercentageConfig.nonRndTime}%` }}
                  title={`Non-R&D (${practicePercentageConfig.nonRndTime}%)`}
                >
                  <span className="text-xs font-medium text-white px-2">
                    Non-R&D ({practicePercentageConfig.nonRndTime}%)
                  </span>
                </div>
                
                {/* Research Activities - Animated, with tooltips */}
                {selectedActivitiesState.map((activity, index) => {
                  const colors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400'];
                  const color = colors[index % colors.length];
                  const leftPosition = practicePercentageConfig.nonRndTime + 
                    selectedActivitiesState.slice(0, index).reduce((sum, a) => sum + (practicePercentageConfig.activities[a.activity_id] || 0), 0);
                  const activityPercentage = practicePercentageConfig.activities[activity.activity_id] || 0;
                  return (
                    <div
                      key={activity.activity_id}
                      className={`absolute top-0 h-full ${color} flex items-center justify-center transition-all duration-500`}
                      style={{ 
                        left: `${leftPosition}%`,
                        width: `${activityPercentage}%`
                      }}
                      title={`${activity.activity_name || activity.title || 'Unknown Activity'} (${activityPercentage.toFixed(1)}%)`}
                    >
                      <span className="text-xs font-medium text-white px-1 truncate">
                        {activity.activity_name || activity.title || 'Unknown Activity'} ({activityPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              {selectedActivitiesState.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Activity Breakdown:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedActivitiesState.map((activity, index) => {
                      const colors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400'];
                      const color = colors[index % colors.length];
                      const activityPercentage = practicePercentageConfig.activities[activity.activity_id] || 0;
                      
                      return (
                        <div key={activity.activity_id} className="flex items-center space-x-2 text-sm">
                          <div className={`w-3 h-3 ${color} rounded`}></div>
                          <span className="text-gray-700">
                            {activity.activity_name || activity.title || 'Unknown Activity'}
                          </span>
                          <span className="text-gray-500 font-medium">
                            {activityPercentage.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Header with Year Selector for Activities */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Research Activities
                </h4>
                <p className="text-gray-600 mt-1">Select and configure your research activities for {selectedYear}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      setSelectedYear(year);
                      // Find the corresponding business year ID
                      const businessYear = availableBusinessYears.find(by => by.year === year);
                      if (businessYear) {
                        setSelectedBusinessYearId(businessYear.id);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {availableBusinessYears.length > 0 ? (
                      availableBusinessYears.map(businessYear => (
                        <option key={businessYear.id} value={businessYear.year}>
                          {businessYear.year}
                        </option>
                      ))
                    ) : (
                      <option value="">No years available</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Year Baseline Notice for Activities */}
            {selectedYear !== 2025 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      <strong>Year-specific modifications:</strong> Changes made for {selectedYear} will override the baseline configuration.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Select Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Filter Research Activities</h4>
              
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {categories.map(category => (
                      <SelectableChip
                        key={category.id}
                        label={category.name}
                        selected={selectedCategories.includes(category.id)}
                        onToggle={() => handleCategoryToggle(category.id)}
                        color="blue"
                      />
                    ))}
                    {selectedCategories.length > 0 && (
                      <button
                        className="ml-2 px-3 py-1 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors text-xs"
                        onClick={() => setSelectedCategories([])}
                        title="Clear all categories"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Areas - Only show when categories are selected */}
                {selectedCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Areas</label>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableAreas().map(area => (
                        <SelectableChip
                          key={area.id}
                          label={area.name}
                          selected={selectedAreas.includes(area.id)}
                          onToggle={() => handleAreaToggle(area.id)}
                          color="green"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Focuses - Only show when areas are selected */}
                {selectedAreas.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Focuses</label>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableFocuses().map(focus => (
                        <SelectableChip
                          key={focus.id}
                          label={focus.name}
                          selected={selectedFocuses.includes(focus.id)}
                          onToggle={() => handleFocusToggle(focus.id)}
                          color="purple"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Instruction message when no categories selected */}
                {selectedCategories.length === 0 && (
                  <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start by selecting categories</h3>
                    <p className="text-gray-600">Choose one or more categories above to see available research areas.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Research Activities */}
            {selectedFocuses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-900">Available Research Activities</h4>
                  <div className="text-sm text-gray-600">
                    {getFilteredActivities().length} activities available
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {getFilteredActivities().map((activity: ResearchActivity) => {
                    const isSelected = selectedActivitiesState.some(a => a.activity_id === activity.id);
                    const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
                    const color = colors[selectedActivitiesState.length % colors.length];
                    const [expanded, setExpanded] = useState(false);
                    return (
                      <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow relative group bg-white">
                        {isSelected && (
                          <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Added
                          </span>
                        )}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-2">{activity.title}</h5>
                            
                            {activity.general_description && (
                              <p className="text-sm text-gray-600 mb-2">{activity.general_description}</p>
                            )}
                            
                            {expanded && activity.examples && (
                              <div className="text-sm text-gray-500 mb-2">
                                <strong>Examples:</strong> {activity.examples}
                              </div>
                            )}
                            <button
                              className="text-xs text-blue-600 hover:underline focus:outline-none"
                              onClick={() => setExpanded(e => !e)}
                            >
                              {expanded ? 'Hide Details' : 'View Details'}
                            </button>
                          </div>
                          <div className="ml-4">
                            {!isSelected ? (
                              <button
                                onClick={() => addActivity(activity)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                Add Activity
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Activities */}
            {selectedActivitiesState.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6">Selected Research Activities</h4>
                
                <div className="space-y-6">
                  {selectedActivitiesState.map((activity, index) => {
                    const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
                    const color = colors[index % colors.length];
                    return (
                      <motion.div
                        key={activity.activity_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ActivityCard
                          activity={activity}
                          allRoles={roles}
                          onUpdatePercentage={(percentage) => updateActivityPercentage(activity.activity_id, percentage)}
                          onUpdateRoles={(roles) => updateActivityRoles(activity.activity_id, roles)}
                          onRemove={() => removeActivity(activity.activity_id)}
                          color={color}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {selectedFocuses.length === 0 && selectedCategories.length > 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select Focus Areas</h3>
                <p className="text-gray-600">Choose areas and focuses above to see available research activities.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'design' && (
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-gray-900">Research Guidelines</h4>
            
            {selectedActivitiesState.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Selected</h3>
                <p className="text-gray-600 mb-4">
                  Please select research activities from the Activities tab first.
                </p>
                <button
                  onClick={() => setActiveTab('activities')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Activities
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedActivitiesState.map(activity => (
                  <ActivityCard
                    key={activity.activity_id}
                    activity={activity}
                    allRoles={roles}
                    onUpdatePercentage={(percentage) => updateActivityPercentage(activity.activity_id, percentage)}
                    onUpdateRoles={(roles) => updateActivityRoles(activity.activity_id, roles)}
                    onRemove={() => removeActivity(activity.activity_id)}
                    color="blue"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next
        </button>
      </div>

      {/* Add Role Modal */}
      <AddRoleModal
        isOpen={showAddRoleModal}
        onClose={() => setShowAddRoleModal(false)}
        onSave={saveRole}
        existingRoles={roles}
      />

      {/* Edit Role Modal */}
      <EditRoleModal
        isOpen={showEditRoleModal}
        onClose={() => setShowEditRoleModal(false)}
        onSave={updateRole}
        role={editingRole}
        existingRoles={roles}
      />

      {/* Non-R&D Time Modal */}
      <NonRndModal
        isOpen={showNonRndModal}
        onClose={() => setShowNonRndModal(false)}
        nonRndTime={practicePercentageConfig.nonRndTime}
        onUpdate={updateNonRndPercentage}
      />

      {/* Copy Confirmation Modal */}
      <CopyConfirmationModal
        isOpen={showCopyModal}
        onClose={handleCopyModalClose}
        onConfirm={handleCopyConfirm}
        copyType={copyType}
        availableYears={availableBusinessYears}
        currentYear={availableBusinessYears.find(year => year.id === selectedBusinessYearId)}
      />
    </div>
  );
};

// Function to create business years for a business if none exist
const createBusinessYearsForBusiness = async (businessId: string) => {
  try {
    console.log('Creating business years for business:', businessId);
    // Create business years for 2024 and 2025 with required fields
    const businessYearsToCreate = [
      { business_id: businessId, year: 2024, gross_receipts: 0 },
      { business_id: businessId, year: 2025, gross_receipts: 0 }
    ];
    const { data: businessYears, error } = await supabase
      .from('rd_business_years')
      .insert(businessYearsToCreate)
      .select();
    if (error) {
      console.error('Error creating business years:', error);
      throw error;
    }
    console.log('Successfully created business years:', businessYears);

    // Create default Research Leader role for each business year
    if (businessYears && businessYears.length > 0) {
      const defaultRoles = businessYears.map(businessYear => ({
        name: 'Research Leader',
        description: 'Default research leadership role',
        business_id: businessId,
        business_year_id: businessYear.id,
        is_default: true
      }));
      const { data: roles, error: roleError } = await supabase
        .from('rd_roles')
        .insert(defaultRoles)
        .select();
      if (roleError) {
        console.error('Error creating default roles:', roleError);
        // Don't throw here - business years were created successfully
      } else {
        console.log('Successfully created default Research Leader roles:', roles);
      }
    }
    return businessYears;
  } catch (error) {
    console.error('Error in createBusinessYearsForBusiness:', error);
    throw error;
  }
};

// Copy Confirmation Modal
interface CopyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sourceYearId: string) => void;
  copyType: 'roles' | 'activities' | null;
  availableYears: any[];
  currentYear: any;
}

const CopyConfirmationModal: React.FC<CopyConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  copyType,
  availableYears,
  currentYear
}) => {
  const [selectedYearId, setSelectedYearId] = useState<string>('');

  // Add debugging
  console.log('🔍 CopyConfirmationModal Debug:');
  console.log('📅 Available years:', availableYears);
  console.log('🎯 Current year:', currentYear);
  console.log('🎯 Current year ID:', currentYear?.id);
  
  const filteredYears = availableYears.filter(year => year.id !== currentYear?.id);
  console.log('🔍 Filtered years (excluding current):', filteredYears);

  const handleConfirm = () => {
    if (selectedYearId) {
      console.log('✅ User selected year ID for copy:', selectedYearId);
      onConfirm(selectedYearId);
      onClose();
      setSelectedYearId('');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedYearId('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Copy {copyType === 'roles' ? 'Roles' : 'Activities'} from Another Year
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Select which year you'd like to copy the {copyType === 'roles' ? 'roles' : 'activities'} from to {currentYear?.year}:
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Year
          </label>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a year...</option>
            {availableYears
              .filter(year => year.id !== currentYear?.id)
              .map(year => (
                <option key={year.id} value={year.id}>
                  {year.year}
                </option>
              ))}
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedYearId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchExplorerStep; 