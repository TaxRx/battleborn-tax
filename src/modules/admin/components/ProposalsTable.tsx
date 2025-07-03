import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  User, 
  DollarSign, 
  Calendar, 
  FileText, 
  UserCheck,
  ChevronDown,
  ArrowUpDown,
  Plus,
  Download,
  ChevronUp
} from 'lucide-react';
import { TaxProposal, ProposalStatus } from '../types/proposal';

interface ProposalsTableProps {
  proposals: TaxProposal[];
  loading?: boolean;
  onViewProposal: (id: string) => void;
  onApproveProposal: (id: string) => void;
  onRejectProposal: (id: string) => void;
}

const ProposalsTable: React.FC<ProposalsTableProps> = ({ 
  proposals, 
  loading = false, 
  onViewProposal, 
  onApproveProposal, 
  onRejectProposal 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [sortField, setSortField] = useState<'submittedAt' | 'projectedRevenue' | 'affiliateName'>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Mock affiliate data - in real app this would come from API
  const getAffiliateInfo = (affiliateId?: string) => {
    const affiliates = {
      'affiliate-001': { name: 'Tax Solutions Pro', email: 'contact@taxsolutionspro.com' },
      'affiliate-002': { name: 'Strategic Tax Group', email: 'info@strategictax.com' },
      'affiliate-003': { name: 'Elite Tax Partners', email: 'partners@elitetax.com' },
    };
    return affiliates[affiliateId as keyof typeof affiliates] || { name: 'Unknown Affiliate', email: '' };
  };

  const filteredAndSortedProposals = useMemo(() => {
    let filtered = proposals;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(proposal => 
        (proposal.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAffiliateInfo(proposal.affiliateId).name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proposal.clientId || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'submittedAt':
          aValue = new Date(a.submittedAt || a.createdAt).getTime();
          bValue = new Date(b.submittedAt || b.createdAt).getTime();
          break;
        case 'projectedRevenue':
          aValue = a.projectedRevenue || 0;
          bValue = b.projectedRevenue || 0;
          break;
        case 'affiliateName':
          aValue = getAffiliateInfo(a.affiliateId).name;
          bValue = getAffiliateInfo(b.affiliateId).name;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [proposals, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (status: ProposalStatus) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      in_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Review' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      finalized: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Finalized' },
      implemented: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Implemented' }
    };

    const config = statusConfig[status] || statusConfig.submitted;
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Proposals</h1>
          <p className="text-sm text-gray-600">
            Manage and track all affiliate submissions ({filteredAndSortedProposals.length} of {proposals.length})
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="h-4 w-4 mr-2 inline" />
            Export
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Filter className="h-4 w-4 mr-2 inline" />
            Filters
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by proposal ID, affiliate name, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProposalStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-auto min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="finalized">Finalized</option>
              <option value="implemented">Implemented</option>
            </select>
          </div>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('submittedAt')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Submitted</span>
                    <SortIcon field="submittedAt" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('affiliateName')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Affiliate</span>
                    <SortIcon field="affiliateName" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('projectedRevenue')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Projected Revenue</span>
                    <SortIcon field="projectedRevenue" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedProposals.map((proposal) => {
                const affiliate = getAffiliateInfo(proposal.affiliateId);
                return (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{proposal.id}</div>
                        <div className="text-gray-500">
                          {new Date(proposal.submittedAt || proposal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                          <div className="text-sm text-gray-500">{affiliate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {proposal.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                        ${(proposal.projectedRevenue || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(proposal.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewProposal(proposal.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {proposal.status === 'submitted' && (
                          <>
                            <button
                              onClick={() => onApproveProposal(proposal.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onRejectProposal(proposal.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedProposals.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new proposal.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProposalsTable; 