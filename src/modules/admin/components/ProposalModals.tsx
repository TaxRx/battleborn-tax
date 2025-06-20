import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// Approval Modal
interface ApprovalModalProps {
  onClose: () => void;
  onApprove: () => void;
  approvalNote: string;
  setApprovalNote: (note: string) => void;
  loading: boolean;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  onClose,
  onApprove,
  approvalNote,
  setApprovalNote,
  loading
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Approve Proposal</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to approve this proposal? This action will notify the affiliate and client.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Note (Optional)
            </label>
            <textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Add any notes about the approval..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            disabled={loading}
            className="btn-success flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Approving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Approve Proposal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Rejection Modal
interface RejectionModalProps {
  onClose: () => void;
  onReject: () => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  loading: boolean;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
  onClose,
  onReject,
  rejectionReason,
  setRejectionReason,
  loading
}) => {
  const commonReasons = [
    'Insufficient documentation provided',
    'Strategy not suitable for client profile',
    'Compliance concerns identified',
    'Requires additional expert review',
    'Client income threshold not met',
    'Missing required eligibility criteria'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Reject Proposal</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-3 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Important</p>
              <p className="text-sm text-yellow-700">
                Rejecting this proposal will notify the affiliate. Please provide a clear reason.
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a detailed reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Common Reasons (Click to use)
            </label>
            <div className="space-y-2">
              {commonReasons.map((reason, index) => (
                <button
                  key={index}
                  onClick={() => setRejectionReason(reason)}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onReject}
            disabled={loading || !rejectionReason.trim()}
            className="btn-danger flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Rejecting...</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <span>Reject Proposal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Expert Assignment Modal
interface ExpertAssignmentModalProps {
  onClose: () => void;
  onAssign: () => void;
  experts: Array<{
    id: string;
    name: string;
    email: string;
    specialties: string[];
    current_workload: number;
    max_capacity: number;
  }>;
  selectedExpert: string;
  setSelectedExpert: (expertId: string) => void;
  loading: boolean;
}

export const ExpertAssignmentModal: React.FC<ExpertAssignmentModalProps> = ({
  onClose,
  onAssign,
  experts,
  selectedExpert,
  setSelectedExpert,
  loading
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Assign Expert</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Select an expert to review and manage this proposal.
          </p>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {experts.map((expert) => (
              <div
                key={expert.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedExpert === expert.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedExpert(expert.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{expert.name}</h4>
                    <p className="text-sm text-gray-600">{expert.email}</p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Specialties:</p>
                      <div className="flex flex-wrap gap-1">
                        {expert.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="text-gray-600">Workload:</span>
                      <span className={`ml-1 font-medium ${
                        expert.current_workload >= expert.max_capacity 
                          ? 'text-red-600' 
                          : expert.current_workload >= expert.max_capacity * 0.8
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {expert.current_workload}/{expert.max_capacity}
                      </span>
                    </div>
                    {expert.current_workload >= expert.max_capacity && (
                      <span className="text-xs text-red-600">At Capacity</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={loading || !selectedExpert}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Assigning...</span>
              </>
            ) : (
              <span>Assign Expert</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 