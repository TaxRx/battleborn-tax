import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const initialForm: Partial<Client> = {
  full_name: '',
  email: '',
  phone: '',
  company_name: '',
  status: 'active',
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<Client>>(initialForm);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setClients(data || []);
    setLoading(false);
  }

  function openAddModal() {
    setForm(initialForm);
    setModalMode('add');
    setShowModal(true);
  }

  function openEditModal(client: Client) {
    setForm(client);
    setModalMode('edit');
    setShowModal(true);
  }

  async function handleSave() {
    if (modalMode === 'add') {
      const { error } = await supabase.from('clients').insert([{ ...form }]);
      if (error) setError(error.message);
      else {
        setShowModal(false);
        fetchClients();
      }
    } else if (modalMode === 'edit' && form.id) {
      const { error } = await supabase.from('clients').update({ ...form }).eq('id', form.id);
      if (error) setError(error.message);
      else {
        setShowModal(false);
        fetchClients();
      }
    }
  }

  function openDeleteConfirm(client: Client) {
    setSelectedClient(client);
    setShowDeleteConfirm(true);
  }

  async function handleDelete() {
    if (!selectedClient) return;
    const { error } = await supabase.from('clients').delete().eq('id', selectedClient.id);
    if (error) setError(error.message);
    else {
      setShowDeleteConfirm(false);
      setSelectedClient(null);
      fetchClients();
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Client</button>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Company</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No clients found.</td></tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{client.full_name}</td>
                  <td className="px-4 py-2 border">{client.email}</td>
                  <td className="px-4 py-2 border">{client.phone}</td>
                  <td className="px-4 py-2 border">{client.company_name}</td>
                  <td className="px-4 py-2 border">{client.status}</td>
                  <td className="px-4 py-2 border space-x-2">
                    <button onClick={() => openEditModal(client)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => openDeleteConfirm(client)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{modalMode === 'add' ? 'Add Client' : 'Edit Client'}</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" className="w-full border px-3 py-2 rounded" value={form.full_name || ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              <input type="email" placeholder="Email" className="w-full border px-3 py-2 rounded" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <input type="text" placeholder="Phone" className="w-full border px-3 py-2 rounded" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <input type="text" placeholder="Company Name" className="w-full border px-3 py-2 rounded" value={form.company_name || ''} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
              <select className="w-full border px-3 py-2 rounded" value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Delete Client</h2>
            <p>Are you sure you want to delete <span className="font-semibold">{selectedClient?.full_name}</span>?</p>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 