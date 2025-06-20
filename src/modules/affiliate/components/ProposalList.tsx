import React from 'react';
import { TaxProposal } from '../../shared/types';

interface ProposalListProps {
  proposals: TaxProposal[];
  onRefresh: () => void;
}

const ProposalList: React.FC<ProposalListProps> = ({ proposals, onRefresh }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Proposal List (Coming Soon)
      </h2>
      <p className="text-gray-600">
        This component will display and manage your tax proposals.
      </p>
    </div>
  );
};

export default ProposalList; 