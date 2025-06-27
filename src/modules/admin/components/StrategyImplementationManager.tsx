import React, { useState } from 'react';
import { 
  StrategyImplementation, 
  ExpertReferral, 
  Commission, 
  StrategyStatus, 
  ReferralStatus, 
  CommissionStatus,
  StrategyNote 
} from '../../shared/types';
import { adminService } from '../services/adminService';

interface StrategyImplementationManagerProps {
  proposalId: string;
  strategyImplementations: StrategyImplementation[];
  onUpdate: (updatedImplementations: StrategyImplementation[]) => void;
}

export const StrategyImplementationManager: React.FC<StrategyImplementationManagerProps> = ({
  proposalId,
  strategyImplementations,
  onUpdate
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyImplementation | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'referral' | 'progress' | 'completion' | 'cancellation'>('general');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const handleStatusUpdate = async (implementationId: string, newStatus: StrategyStatus, transactionValue?: number) => {
    try {
      const updatedImplementation = await adminService.updateStrategyStatus(
        implementationId, 
        newStatus, 
        transactionValue
      );

      const updatedImplementations = strategyImplementations.map(impl => 
        impl.id === implementationId 
          ? { ...impl, ...updatedImplementation }
          : impl
      );

      onUpdate(updatedImplementations);
    } catch (error) {
      console.error('Error updating strategy status:', error);
    }
  };

  const handleCreateReferral = async (
    strategyImplementationId: string,
    expertData: {
      expertId: string;
      expertName: string;
      expertEmail: string;
      expertSpecialties: string[];
      commissionRate: number;
      estimatedCommission: number;
    }
  ) => {
    try {
      const referral = await adminService.createExpertReferral(
        strategyImplementationId,
        expertData.expertId,
        expertData.expertName,
        expertData.expertEmail,
        expertData.expertSpecialties,
        expertData.commissionRate,
        expertData.estimatedCommission
      );

      const updatedImplementations = strategyImplementations.map(impl => 
        impl.id === strategyImplementationId 
          ? { ...impl, expert_referral: referral }
          : impl
      );

      onUpdate(updatedImplementations);
      setShowReferralModal(false);
    } catch (error) {
      console.error('Error creating expert referral:', error);
    }
  };

  const handleAddNote = async (strategyImplementationId: string) => {
    if (!noteText.trim()) return;

    try {
      const note = await adminService.addStrategyNote(
        strategyImplementationId,
        'admin-123', // In real app, get from auth context
        'Admin User', // In real app, get from auth context
        noteText,
        noteType,
        isInternalNote
      );

      const updatedImplementations = strategyImplementations.map(impl => 
        impl.id === strategyImplementationId 
          ? { ...impl, admin_notes: [...impl.admin_notes, note] }
          : impl
      );

      onUpdate(updatedImplementations);
      setNoteText('');
      setShowNoteModal(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const getStatusColor = (status: StrategyStatus) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'referred': return 'bg-blue-100 text-blue-800';
      case 'engaged': return 'bg-yellow-100 text-yellow-800';
      case 'in_process': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReferralStatusColor = (status: ReferralStatus) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Strategy Implementation Tracking
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Track the progress of each strategy implementation and manage expert referrals
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {strategyImplementations.map((implementation) => (
            <div key={implementation.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      {implementation.strategy_name}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(implementation.status)}`}>
                      {implementation.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Estimated Savings:</span>
                      <span className="ml-2 font-medium text-green-600">
                        ${implementation.estimated_savings.toLocaleString()}
                      </span>
                    </div>
                    {implementation.transaction_value && (
                      <div>
                        <span className="text-gray-500">Transaction Value:</span>
                        <span className="ml-2 font-medium text-blue-600">
                          ${implementation.transaction_value.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {implementation.commission_amount && (
                      <div>
                        <span className="text-gray-500">Commission:</span>
                        <span className="ml-2 font-medium text-purple-600">
                          ${implementation.commission_amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expert Referral Section */}
                  {implementation.expert_referral && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            Expert: {implementation.expert_referral.expert_name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {implementation.expert_referral.expert_email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Specialties: {implementation.expert_referral.expert_specialties.join(', ')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReferralStatusColor(implementation.expert_referral.status)}`}>
                          {implementation.expert_referral.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {implementation.admin_notes.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Admin Notes</h5>
                      <div className="space-y-2">
                        {implementation.admin_notes.map((note) => (
                          <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {note.admin_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{note.note}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                note.is_internal ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {note.is_internal ? 'Internal' : 'External'}
                              </span>
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                {note.note_type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  {/* Status Update Dropdown */}
                  <select
                    value={implementation.status}
                    onChange={(e) => handleStatusUpdate(implementation.id, e.target.value as StrategyStatus)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="referred">Referred</option>
                    <option value="engaged">Engaged</option>
                    <option value="in_process">In Process</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedStrategy(implementation);
                        setShowReferralModal(true);
                      }}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Refer Expert
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStrategy(implementation);
                        setShowNoteModal(true);
                      }}
                      className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Modal */}
      {showReferralModal && selectedStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Expert Referral</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateReferral(selectedStrategy.id, {
                expertId: formData.get('expertId') as string,
                expertName: formData.get('expertName') as string,
                expertEmail: formData.get('expertEmail') as string,
                expertSpecialties: (formData.get('expertSpecialties') as string).split(',').map(s => s.trim()),
                commissionRate: parseFloat(formData.get('commissionRate') as string),
                estimatedCommission: parseFloat(formData.get('estimatedCommission') as string)
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expert Name</label>
                  <input
                    type="text"
                    name="expertName"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expert Email</label>
                  <input
                    type="email"
                    name="expertEmail"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialties (comma-separated)</label>
                  <input
                    type="text"
                    name="expertSpecialties"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commission Rate (%)</label>
                  <input
                    type="number"
                    name="commissionRate"
                    step="0.1"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Commission ($)</label>
                  <input
                    type="number"
                    name="estimatedCommission"
                    step="0.01"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Referral
                </button>
                <button
                  type="button"
                  onClick={() => setShowReferralModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && selectedStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Admin Note</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddNote(selectedStrategy.id);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Note Type</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="referral">Referral</option>
                    <option value="progress">Progress</option>
                    <option value="completion">Completion</option>
                    <option value="cancellation">Cancellation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Note</label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    required
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="internalNote"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="internalNote" className="ml-2 block text-sm text-gray-900">
                    Internal note (admin only)
                  </label>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Note
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 