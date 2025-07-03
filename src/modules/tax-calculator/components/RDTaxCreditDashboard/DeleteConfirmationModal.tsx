import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  target: {
    type: 'client' | 'business';
    id: string;
    name: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  target,
  onConfirm,
  onCancel
}) => {
  const getTitle = () => {
    return target.type === 'client' ? 'Delete Client' : 'Delete Business';
  };

  const getMessage = () => {
    if (target.type === 'client') {
      return `Are you sure you want to delete the client "${target.name}"? This will also delete all associated businesses and R&D data. This action cannot be undone.`;
    } else {
      return `Are you sure you want to delete the business "${target.name}"? This will also delete all associated R&D calculations, employees, and reports. This action cannot be undone.`;
    }
  };

  const getWarning = () => {
    if (target.type === 'client') {
      return 'This will permanently remove the client and all their businesses from the R&D tax credit system.';
    } else {
      return 'This will permanently remove the business and all associated R&D calculations and data.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">{getMessage()}</p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-900">Warning</h4>
                  <p className="text-sm text-red-800 mt-1">{getWarning()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:border-transparent flex items-center"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {target.type === 'client' ? 'Client' : 'Business'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 