import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, User, DollarSign, Calendar, AlertCircle, FileText, UserCheck, Plus } from 'lucide-react';
import { TaxProposal, ProposalStatus } from '../../shared/types';
import { Expert, ProposalAssignment } from '../../../types/commission';
import { commissionService } from '../../shared/services/commissionService';

interface ProposalQueueProps {
  proposals: TaxProposal[];
  loading?: boolean;
  onViewProposal: (id: string) => void;
  onApproveProposal: (id: string) => void;
  onRejectProposal: (id: string) => void;
}

const ProposalQueue: React.FC<ProposalQueueProps> = ({
  proposals,
  loading = false,
  onViewProposal,
  onApproveProposal,
  onRejectProposal
}) => {
  const [filter, setFilter] = useState<ProposalStatus | 'all'>('all');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [assignments, setAssignments] = useState<ProposalAssignment[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState<string | null>(null);

  useEffect(() => {
    loadExperts();
    loadAssignments();
  }, []);

  const loadExperts = async () => {
    try {
      const data = await commissionService.getExperts();
      setExperts(data);
    } catch (error) {
      console.error('Error loading experts:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const data = await commissionService.getProposalAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const filteredProposals = filter === 'all' 
    ? proposals 
    : proposals.filter(p => p.status === filter);

  const getAssignmentForProposal = (proposalId: string) => {
    return assignments.find(a => a.proposal_id === proposalId);
  };

  const handleAssignExpert = async (proposalId: string, expertId: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    try {
      await commissionService.assignExpert({
        proposal_id: proposalId,
        expert_id: expertId,
        priority,
        notes: ''
      }, 'admin-user-id'); // This would be the actual admin user ID
      
      setShowAssignmentModal(null);
      loadAssignments();
    } catch (error) {
      console.error('Error assigning expert:', error);
    }
  };

  const getPriorityLevel = (proposal: TaxProposal) => {
    if (proposal.projected_savings.annual_savings > 50000) return 'high';
    if (proposal.projected_savings.annual_savings > 20000) return 'medium';
    return 'low';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (priority === 'medium') return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="card-professional">
        <div className="p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-professional">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Proposal Queue</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ProposalStatus | 'all')}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Proposals</option>
            <option value="submitted">Submitted</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredProposals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No proposals found</p>
            </div>
          ) : (
            filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                assignment={getAssignmentForProposal(proposal.id)}
                experts={experts}
                onView={() => onViewProposal(proposal.id)}
                onApprove={() => onApproveProposal(proposal.id)}
                onReject={() => onRejectProposal(proposal.id)}
                onAssignExpert={() => setShowAssignmentModal(proposal.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <AssignmentModal
          proposalId={showAssignmentModal}
          experts={experts}
          onAssign={handleAssignExpert}
          onClose={() => setShowAssignmentModal(null)}
        />
      )}
    </div>
  );
};

interface ProposalCardProps {
  proposal: TaxProposal;
  assignment?: ProposalAssignment;
  experts: Expert[];
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onAssignExpert: () => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  assignment,
  experts,
  onView,
  onApprove,
  onReject,
  onAssignExpert
}) => {
  const priority = getPriorityLevel(proposal);
  const canApprove = proposal.status === 'submitted' || proposal.status === 'in_review';
  const canAssignExpert = proposal.status === 'approved' && !assignment;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-medium text-gray-900">Proposal #{proposal.id.slice(-3)}</h3>
            {getStatusBadge(proposal.status)}
            {getPriorityIcon(priority)}
            {assignment && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <UserCheck className="h-3 w-3 mr-1" />
                Assigned
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              Client {proposal.client_id.slice(-3)}
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              ${proposal.projected_savings.annual_savings.toLocaleString()} savings
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(proposal.submitted_at || proposal.created_at).toLocaleDateString()}
            </div>
            <div className="text-sm">
              {proposal.proposed_strategies.length} strateg{proposal.proposed_strategies.length === 1 ? 'y' : 'ies'}
            </div>
          </div>

          {assignment && (
            <div className="mt-2 p-2 bg-purple-50 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-900">
                    {assignment.expert?.name || 'Expert Assigned'}
                  </span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  assignment.expert_status === 'completed' ? 'bg-green-100 text-green-800' :
                  assignment.expert_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {assignment.expert_status.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          {proposal.proposed_strategies.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">
                Primary Strategy: {proposal.proposed_strategies[0].name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onView}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          {canApprove && (
            <>
              <button
                onClick={onApprove}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                title="Approve"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={onReject}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Reject"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}

          {canAssignExpert && (
            <button
              onClick={onAssignExpert}
              className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
              title="Assign Expert"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Assignment Modal Component
const AssignmentModal: React.FC<{
  proposalId: string;
  experts: Expert[];
  onAssign: (proposalId: string, expertId: string, priority: 'low' | 'medium' | 'high' | 'urgent') => void;
  onClose: () => void;
}> = ({ proposalId, experts, onAssign, onClose }) => {
  const [selectedExpert, setSelectedExpert] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExpert) {
      onAssign(proposalId, selectedExpert, priority);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Assign Expert</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Expert *
            </label>
            <select
              required
              value={selectedExpert}
              onChange={(e) => setSelectedExpert(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an expert...</option>
              {experts.map(expert => (
                <option key={expert.id} value={expert.id}>
                  {expert.name} ({expert.current_workload}/{expert.max_capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Assign Expert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper functions moved outside component
const getStatusBadge = (status: ProposalStatus) => {
  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
    in_review: { color: 'bg-yellow-100 text-yellow-800', label: 'In Review' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    finalized: { color: 'bg-purple-100 text-purple-800', label: 'Finalized' },
    implemented: { color: 'bg-indigo-100 text-indigo-800', label: 'Implemented' }
  };

  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const getPriorityLevel = (proposal: TaxProposal) => {
  if (proposal.projected_savings.annual_savings > 50000) return 'high';
  if (proposal.projected_savings.annual_savings > 20000) return 'medium';
  return 'low';
};

const getPriorityIcon = (priority: string) => {
  if (priority === 'high') return <AlertCircle className="h-4 w-4 text-red-500" />;
  if (priority === 'medium') return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  return <AlertCircle className="h-4 w-4 text-green-500" />;
};

export default ProposalQueue; 