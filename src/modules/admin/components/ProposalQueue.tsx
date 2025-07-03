import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, User, DollarSign, Calendar, AlertCircle, FileText, UserCheck, Plus, Clock } from 'lucide-react';
import { TaxProposal, ProposalStatus } from '../../shared/types';

interface ProposalQueueProps {
  proposals: TaxProposal[];
  loading?: boolean;
  onViewProposal: (id: string) => void;
  onApproveProposal: (id: string) => void;
  onRejectProposal: (id: string) => void;
}

// Helper functions moved outside component
const getPriorityLevel = (proposal: TaxProposal) => {
  const savings = proposal.projected_savings?.annual_savings || 0;
  if (savings > 50000) return 'high';
  if (savings > 25000) return 'medium';
  return 'low';
};

const getPriorityIcon = (priority: string) => {
  const config = {
    high: { color: 'bg-red-500', icon: '🔥' },
    medium: { color: 'bg-yellow-500', icon: '⚡' },
    low: { color: 'bg-green-500', icon: '✓' }
  };
  const { color, icon } = config[priority as keyof typeof config] || config.low;
  return (
    <div className={`w-5 h-5 ${color} rounded-full flex items-center justify-center text-white text-xs`}>
      {icon}
    </div>
  );
};

const ProposalQueue: React.FC<ProposalQueueProps> = ({
  proposals,
  loading = false,
  onViewProposal,
  onApproveProposal,
  onRejectProposal
}) => {
  const [filter, setFilter] = useState<ProposalStatus | 'all'>('all');

  // Mock affiliate data - in real app this would come from API
  const getAffiliateInfo = (affiliateId: string) => {
    const affiliates = {
      'affiliate-001': { name: 'Tax Solutions Pro', email: 'contact@taxsolutionspro.com' },
      'affiliate-002': { name: 'Strategic Tax Group', email: 'info@strategictax.com' },
      'affiliate-003': { name: 'Elite Tax Partners', email: 'partners@elitetax.com' },
    };
    return affiliates[affiliateId as keyof typeof affiliates] || { name: 'Unknown Affiliate', email: '' };
  };

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });

  const pendingProposals = proposals.filter(p => 
    p.status === 'submitted' || p.status === 'in_review'
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      in_review: { color: 'bg-yellow-100 text-yellow-800', label: 'In Review' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pendingProposals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Proposal Queue
        </h3>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No pending proposals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Submissions</h2>
            <p className="text-sm text-gray-600">Latest proposals requiring immediate attention</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ProposalStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Recent</option>
              <option value="submitted">Needs Review</option>
              <option value="in_review">In Review</option>
              <option value="approved">Ready for Assignment</option>
            </select>
            <button 
              onClick={() => window.location.href = '/admin/proposals'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Proposals
            </button>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {filteredProposals.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No proposals found</h3>
            <p className="text-sm text-gray-500">Proposals will appear here once affiliates submit them</p>
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              affiliateInfo={getAffiliateInfo(proposal.affiliate_id)}
              onView={() => onViewProposal(proposal.id)}
              onApprove={() => onApproveProposal(proposal.id)}
              onReject={() => onRejectProposal(proposal.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface ProposalCardProps {
  proposal: TaxProposal;
  affiliateInfo: { name: string; email: string };
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  affiliateInfo,
  onView,
  onApprove,
  onReject
}) => {
  const priority = getPriorityLevel(proposal);
  const canApprove = proposal.status === 'submitted' || proposal.status === 'in_review';

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Priority Indicator & Icon */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="absolute -top-1 -right-1">
              {getPriorityIcon(priority)}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Proposal #{proposal.id.slice(-6)}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>{affiliateInfo.name}</span>
                </div>
                <div className="flex items-center">
                  <span>{affiliateInfo.email}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(proposal.status)}
            </div>
          </div>
          
          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(proposal.submitted_at || proposal.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Potential Savings</p>
                <p className="text-sm font-medium text-green-600">
                  ${proposal.projected_savings?.annual_savings?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Strategies</p>
                <p className="text-sm font-medium text-gray-700">
                  {proposal.proposed_strategies.length} proposed
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <p className="text-sm font-medium text-gray-700">
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <button
                onClick={onView}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2 inline" />
                View Details
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {canApprove && (
                <>
                  <button
                    onClick={onReject}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2 inline" />
                    Reject
                  </button>
                  <button
                    onClick={onApprove}
                    className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 inline" />
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalQueue; 