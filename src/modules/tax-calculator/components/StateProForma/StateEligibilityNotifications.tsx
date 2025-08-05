import React from 'react';
import { AlertTriangle, Info, FileText, Shield } from 'lucide-react';

export interface StateEligibilityNotificationsProps {
  businessEntityType: string;
  notifications: {
    applicationRequired: string[];
    preapprovalRequired: string[];
    entityRestricted: string[];
  };
}

export const StateEligibilityNotifications: React.FC<StateEligibilityNotificationsProps> = ({
  businessEntityType,
  notifications
}) => {
  const hasNotifications = 
    notifications.applicationRequired.length > 0 ||
    notifications.preapprovalRequired.length > 0 ||
    notifications.entityRestricted.length > 0;

  if (!hasNotifications) {
    return null;
  }

  return (
    <div className="state-eligibility-notifications bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
        <h4 className="text-lg font-semibold text-yellow-800">
          State Credit Eligibility Notice
        </h4>
      </div>

      {/* Entity Type Restrictions */}
      {notifications.entityRestricted.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Shield className="w-4 h-4 text-red-600 mr-2" />
            <h5 className="font-medium text-red-800">Entity Type Restrictions</h5>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-700 mb-2">
              <strong>Your entity type ({businessEntityType}) is not eligible for the following state credits:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {notifications.entityRestricted.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Preapproval Required */}
      {notifications.preapprovalRequired.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <FileText className="w-4 h-4 text-orange-600 mr-2" />
            <h5 className="font-medium text-orange-800">Preapproval Required</h5>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded p-3">
            <p className="text-sm text-orange-700 mb-2">
              <strong>The following states require preapproval/certification before you can claim their R&D credit:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
              {notifications.preapprovalRequired.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
            <p className="text-xs text-orange-600 mt-2 font-medium">
              ⚠️ These states are disabled by default until you obtain the required certifications.
            </p>
          </div>
        </div>
      )}

      {/* Application Required */}
      {notifications.applicationRequired.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center mb-2">
            <Info className="w-4 h-4 text-blue-600 mr-2" />
            <h5 className="font-medium text-blue-800">Application Required</h5>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-700 mb-2">
              <strong>The following states require a separate application (credit is not automatically calculated):</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              {notifications.applicationRequired.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              ℹ️ These states are disabled by default since they require separate applications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};