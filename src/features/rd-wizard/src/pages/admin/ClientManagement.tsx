import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../../services/userService';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import { User } from '../../types';
import { useUser } from '../../context/UserContext';
import { toast } from 'react-hot-toast';
import { createChangelogEntry } from '../../services/changelogService';
import { Search, User as UserIcon, Building2 } from 'lucide-react';

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const { user } = useUser();

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const response = await getAllUsers();
        if (response?.data) {
          setClients(response.data.filter(u => u.role === 'client'));
        }
      } catch (error) {
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Client Accounts</h1>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {search ? 'Try adjusting your search terms' : 'No clients have been added yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/clients/${client.id}`)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      if (user?.id) {
                        startImpersonation(user.id, client.id);
                        await createChangelogEntry({
                          actor_id: user.id,
                          target_user_id: client.id,
                          action: 'impersonation',
                          details: `Admin impersonated ${client.email}`,
                          metadata: { clientName: client.name, clientEmail: client.email }
                        });
                        toast.success(`Now impersonating ${client.name || client.email}`);
                        navigate('/client');
                      }
                    }}
                  >
                    Impersonate
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>
                    {client.businesses && client.businesses.length > 0
                      ? client.businesses.map((b: any) => b.name).join(', ')
                      : 'No businesses'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientManagement;