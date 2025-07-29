import React, { useState } from 'react';
import { Lock, Unlock, Shield, AlertTriangle, Clock } from 'lucide-react';
import useLockStore from '../../store/lockStore';

interface LockBannerProps {
  section: 'research-activities' | 'expense-management' | 'research-design';
  title: string;
  description?: string;
}

const LockBanner: React.FC<LockBannerProps> = ({ section, title, description }) => {
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  
  const {
    isResearchActivitiesLocked,
    isExpenseManagementLocked,
    isResearchDesignLocked,
    lockedBy,
    lockedAt,
    lockReason,
    lockResearchActivities,
    unlockResearchActivities,
    lockExpenseManagement,
    unlockExpenseManagement,
    lockResearchDesign,
    unlockResearchDesign,
    lockAll,
    unlockAll
  } = useLockStore();

  // Get the current lock state for this section
  const isLocked = section === 'research-activities' ? isResearchActivitiesLocked :
                   section === 'expense-management' ? isExpenseManagementLocked :
                   isResearchDesignLocked;

  // Get the appropriate lock/unlock functions
  const lockFunction = section === 'research-activities' ? lockResearchActivities :
                       section === 'expense-management' ? lockExpenseManagement :
                       lockResearchDesign;

  const unlockFunction = section === 'research-activities' ? unlockResearchActivities :
                         section === 'expense-management' ? unlockExpenseManagement :
                         unlockResearchDesign;

  const handleLock = () => {
    const reason = `Protecting ${title} data from accidental modifications`;
    lockFunction(reason);
  };

  const handleUnlockConfirm = () => {
    unlockFunction();
    setShowUnlockConfirm(false);
    setUnlockReason('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLocked) {
    return (
      <>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Lock className="h-6 w-6 text-red-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-red-900">
                    🔒 {title} - LOCKED
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Protected
                  </span>
                </div>
                
                <div className="text-sm text-red-700 space-y-1">
                  <p className="font-medium">
                    This section is locked to prevent accidental data modifications.
                  </p>
                  {description && (
                    <p className="text-red-600">{description}</p>
                  )}
                  
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Locked by:</span>
                      <span>{lockedBy || 'Admin'}</span>
                    </div>
                    {lockedAt && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(lockedAt)}</span>
                      </div>
                    )}
                    {lockReason && (
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Reason:</span>
                        <span>{lockReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowUnlockConfirm(true)}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Unlock className="w-4 h-4 mr-1" />
                Unlock
              </button>
            </div>
          </div>
        </div>

        {/* Unlock Confirmation Modal */}
        {showUnlockConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-amber-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Unlock</h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Are you sure you want to unlock <strong>{title}</strong>? 
                  This will allow modifications to research data.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for unlocking (optional):
                  </label>
                  <input
                    type="text"
                    value={unlockReason}
                    onChange={(e) => setUnlockReason(e.target.value)}
                    placeholder="e.g., Data correction needed"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => setShowUnlockConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnlockConfirm}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    <Unlock className="w-4 h-4 mr-1 inline" />
                    Unlock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Unlocked state - show option to lock
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Unlock className="h-6 w-6 text-green-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-green-900">
                🔓 {title} - UNLOCKED
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Editable
              </span>
            </div>
            
            <div className="text-sm text-green-700">
              <p>This section is currently unlocked and can be modified.</p>
              {description && (
                <p className="text-green-600 mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleLock}
            className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Lock className="w-4 h-4 mr-1" />
            Lock for Protection
          </button>
          
          <button
            onClick={() => lockAll('Bulk protection of all R&D data sections')}
            className="inline-flex items-center px-3 py-2 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <Shield className="w-4 h-4 mr-1" />
            Lock All Sections
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockBanner; 