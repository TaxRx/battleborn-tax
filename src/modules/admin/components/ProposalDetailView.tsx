import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  User, 
  DollarSign, 
  Calendar, 
  FileText, 
  MessageSquare,
  AlertCircle,
  Clock,
  UserCheck,
  Send,
  Eye,
  UserPlus,
  Plus
} from 'lucide-react';
import { TaxProposal, Expert, ProposalStatus } from '../../shared/types';
import { adminService } from '../services/adminService';
import { ApprovalModal, RejectionModal, ExpertAssignmentModal } from './ProposalModals';

interface ProposalDetailViewProps {
  onBack?: () => void;
}

const ProposalDetailView: React.FC<ProposalDetailViewProps> = ({ onBack }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<TaxProposal | null>(null);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadProposalData();
    }
  }, [id]);

  const loadProposalData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [proposalData, expertsData] = await Promise.all([
        adminService.getProposal(id),
        adminService.getAllExperts()
      ]);

      setProposal(proposalData);
      setExperts(expertsData);
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/admin');
    }
  };

  const handleApprove = async () => {
    if (!proposal) return;
    
    setActionLoading(true);
    try {
      const result = await adminService.approveProposal(proposal.id, approvalNote);
      if (result.success) {
        setProposal(result.data!);
        setShowApprovalModal(false);
        setApprovalNote('');
      }
    } catch (error) {
      console.error('Error approving proposal:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!proposal || !rejectionReason.trim()) return;
    
    setActionLoading(true);
    try {
      const result = await adminService.rejectProposal(proposal.id, rejectionReason);
      if (result.success) {
        setProposal(result.data!);
        setShowRejectModal(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignExpert = async () => {
    if (!proposal || !selectedExpert) return;
    
    setActionLoading(true);
    try {
      const result = await adminService.assignExpert(proposal.id, selectedExpert);
      if (result.success) {
        setProposal(result.data!);
        setSelectedExpert('');
        setShowExpertModal(false);
      }
    } catch (error) {
      console.error('Error assigning expert:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!proposal || !newNote.trim()) return;
    
    try {
      const result = await adminService.addNote(proposal.id, newNote, isInternalNote);
      if (result.success) {
        // Reload proposal to get updated notes
        await loadProposalData();
        setNewNote('');
        setIsInternalNote(false);
        setShowAddNoteForm(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const getStatusBadge = (status: ProposalStatus) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: FileText },
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted', icon: Clock },
      in_review: { color: 'bg-yellow-100 text-yellow-800', label: 'In Review', icon: Eye },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      finalized: { color: 'bg-purple-100 text-purple-800', label: 'Finalized', icon: UserCheck },
      implemented: { color: 'bg-indigo-100 text-indigo-800', label: 'Implemented', icon: CheckCircle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-8">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-white rounded-lg p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Proposal Not Found</h2>
            <p className="text-gray-600 mb-4">The requested proposal could not be found.</p>
            <button onClick={handleBack} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Proposal #{proposal.id.slice(-6).toUpperCase()}
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  {getStatusBadge(proposal.status)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {(proposal.status === 'submitted' || proposal.status === 'in_review') && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowApprovalModal(true)}
                  disabled={actionLoading}
                  className="btn-success flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="btn-danger flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </button>
                {!proposal.assigned_expert && (
                  <button
                    onClick={() => setShowExpertModal(true)}
                    disabled={actionLoading}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Assign Expert</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Overview */}
            <div className="card-professional">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Client ID</p>
                      <p className="font-medium text-gray-900">{proposal.client_id.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Income</p>
                      <p className="font-medium text-gray-900">${proposal.baseline_calculation.total_income.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submitted</p>
                      <p className="font-medium text-gray-900">
                        {new Date(proposal.submitted_at || proposal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Strategies</p>
                      <p className="font-medium text-gray-900">{proposal.proposed_strategies.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Strategies */}
            <div className="card-professional">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposed Tax Strategies</h2>
                <div className="space-y-4">
                  {proposal.proposed_strategies.map((strategy) => (
                    <div key={strategy.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{strategy.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{strategy.category.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${strategy.estimated_savings.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Annual Savings</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{strategy.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-1 rounded ${
                          strategy.implementation_complexity === 'low' ? 'bg-green-100 text-green-800' :
                          strategy.implementation_complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {strategy.implementation_complexity} complexity
                        </span>
                        {strategy.requires_expert && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            Expert Required
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial Impact */}
            <div className="card-professional">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Impact Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Current Tax Situation</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Federal Tax:</span>
                        <span className="font-medium">${proposal.baseline_calculation.federal_tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">State Tax:</span>
                        <span className="font-medium">${proposal.baseline_calculation.state_tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-900 font-medium">Total Tax:</span>
                        <span className="font-bold">${proposal.baseline_calculation.total_tax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Projected Savings</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual Savings:</span>
                        <span className="font-medium text-green-600">${proposal.projected_savings.annual_savings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">5-Year Value:</span>
                        <span className="font-medium text-green-600">${proposal.projected_savings.five_year_value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-900 font-medium">ROI:</span>
                        <span className="font-bold text-green-600">
                          {((proposal.projected_savings.annual_savings / proposal.baseline_calculation.total_tax) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Expert Assignment */}
            {proposal.assigned_expert && (
              <div className="card-professional">
                <div className="p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Assigned Expert</h3>
                  {(() => {
                    const expert = experts.find(e => e.id === proposal.assigned_expert);
                    return expert ? (
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{expert.name}</p>
                          <p className="text-sm text-gray-600">{expert.email}</p>
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {expert.specialties.slice(0, 2).map((specialty, index) => (
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
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Expert information not available</p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div className="card-professional">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Admin Notes</h3>
                  <button
                    onClick={() => setShowAddNoteForm(!showAddNoteForm)}
                    className="btn-secondary flex items-center space-x-1 text-sm py-1 px-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Note</span>
                  </button>
                </div>

                {/* Add Note Form */}
                {showAddNoteForm && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this proposal..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-gray-600">Internal note (admin only)</span>
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setShowAddNoteForm(false);
                            setNewNote('');
                            setIsInternalNote(false);
                          }}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add Note
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {proposal.admin_notes.length === 0 ? (
                  <p className="text-sm text-gray-500">No notes added yet.</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {proposal.admin_notes.map((note) => (
                      <div 
                        key={note.id} 
                        className={`border-l-4 pl-3 py-2 ${
                          note.is_internal ? 'border-orange-200 bg-orange-50' : 'border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm text-gray-700">{note.note}</p>
                          {note.is_internal && (
                            <span className="text-xs text-orange-600 font-medium ml-2">Internal</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{note.admin_name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showApprovalModal && (
        <ApprovalModal
          onClose={() => setShowApprovalModal(false)}
          onApprove={handleApprove}
          approvalNote={approvalNote}
          setApprovalNote={setApprovalNote}
          loading={actionLoading}
        />
      )}

      {showRejectModal && (
        <RejectionModal
          onClose={() => setShowRejectModal(false)}
          onReject={handleReject}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          loading={actionLoading}
        />
      )}

      {showExpertModal && (
        <ExpertAssignmentModal
          onClose={() => setShowExpertModal(false)}
          onAssign={handleAssignExpert}
          experts={experts}
          selectedExpert={selectedExpert}
          setSelectedExpert={setSelectedExpert}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default ProposalDetailView; 