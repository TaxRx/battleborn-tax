import React from 'react';
import { ClientProfile } from '../../shared/types';

interface ClientListProps {
  clients: ClientProfile[];
  onClientSelect: (client: ClientProfile) => void;
  onRefresh: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onClientSelect, onRefresh }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Client List (Coming Soon)
      </h2>
      <p className="text-gray-600">
        This component will display and manage your client list.
      </p>
    </div>
  );
};

export default ClientList; 