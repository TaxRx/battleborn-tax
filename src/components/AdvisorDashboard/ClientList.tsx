import React, { useState, useEffect } from 'react';
import { Client } from '../../types/user';
import { advisorService } from '../../services/advisorService';
import ClientDetail from './ClientDetail';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'initial_contact', label: 'Initial Contact' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In Progress' },
];

const sortOptions = [
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' },
  { value: 'created', label: 'Newest' },
  { value: 'updated', label: 'Recently Updated' },
];

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('az');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [actionClient, setActionClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const advisorId = 'advisor1';
      const fetchedClients = await advisorService.getClients(advisorId);
      setClients(fetchedClients);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (client: Client) => {
    try {
      setError(null);
      const updatedClient = await advisorService.updateClient(client.id, client);
      setClients(clients.map(c => c.id === client.id ? updatedClient : c));
      setSelectedClient(null);
    } catch (error) {
      console.error('Failed to save client:', error);
      setError('Failed to save client. Please try again.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }
    try {
      setError(null);
      await advisorService.deleteClient(clientId);
      setClients(clients.filter(c => c.id !== clientId));
    } catch (error) {
      console.error('Failed to delete client:', error);
      setError('Failed to delete client. Please try again.');
    }
  };

  const handleAddClient = async () => {
    try {
      setError(null);
      const advisorId = 'advisor1';
      const newClient = await advisorService.createClient({
        advisorId,
        email: '',
        name: '',
        role: 'client'
      });
      setClients([...clients, newClient]);
      setSelectedClient(newClient);
    } catch (error) {
      console.error('Failed to create client:', error);
      setError('Failed to create client. Please try again.');
    }
  };

  // Filtering and sorting
  let filteredClients = clients.filter(client =>
    (client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === '' || client.status === statusFilter)
  );
  if (sortBy === 'az') filteredClients = filteredClients.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'za') filteredClients = filteredClients.sort((a, b) => b.name.localeCompare(a.name));
  if (sortBy === 'created') filteredClients = filteredClients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (sortBy === 'updated') filteredClients = filteredClients.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Clients</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded shadow-sm"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded shadow-sm"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleAddClient}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Client
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Groups</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No clients found.</td></tr>
            ) : filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-blue-50 transition">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{client.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{client.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{client.groupIds.length} groups</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    client.status === 'completed' ? 'bg-green-100 text-green-800' :
                    client.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    client.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    client.status === 'documentation' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {statusOptions.find(opt => opt.value === client.status)?.label || client.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setActionClient(client); setShowLinkModal(true); }}
                    className="text-green-600 hover:text-green-900"
                  >
                    Link
                  </button>
                  <button
                    onClick={() => { setActionClient(client); setShowTransferModal(true); }}
                    className="text-yellow-600 hover:text-yellow-900"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => { setActionClient(client); setShowArchiveModal(true); }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals for Link, Transfer, Archive (placeholders) */}
      {showLinkModal && actionClient && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Link Client</h3>
            <p>Link <span className="font-semibold">{actionClient.name}</span> to another entity (modal placeholder).</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded">Done</button>
            </div>
          </div>
        </div>
      )}
      {showTransferModal && actionClient && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Transfer Client</h3>
            <p>Transfer <span className="font-semibold">{actionClient.name}</span> to another advisor or group (modal placeholder).</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded">Done</button>
            </div>
          </div>
        </div>
      )}
      {showArchiveModal && actionClient && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Archive Client</h3>
            <p>Archive <span className="font-semibold">{actionClient.name}</span> (modal placeholder).</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowArchiveModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={() => setShowArchiveModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded">Done</button>
            </div>
          </div>
        </div>
      )}

      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
} 