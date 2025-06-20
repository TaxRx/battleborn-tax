import React, { useState, useEffect } from 'react';
import { Group, Client } from '../../types/user';
import { advisorService } from '../../services/advisorService';

interface GroupDetailProps {
  group: Group;
  onClose: () => void;
  onSave: (group: Group) => void;
}

export default function GroupDetail({ group, onClose, onSave }: GroupDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroup, setEditedGroup] = useState<Group>(group);
  const [clients, setClients] = useState<Client[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      // TODO: Get advisorId from auth context
      const advisorId = 'advisor1';
      const fetchedClients = await advisorService.getClients(advisorId);
      setClients(fetchedClients);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setError('Failed to load clients. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(editedGroup);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save group:', error);
      setError('Failed to save group. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClientToggle = (clientId: string) => {
    setEditedGroup(prev => ({
      ...prev,
      clientIds: prev.clientIds.includes(clientId)
        ? prev.clientIds.filter(id => id !== clientId)
        : [...prev.clientIds, clientId]
    }));
  };

  const calculateTotalCredits = () => {
    return editedGroup.kpis.reduce((sum, kpi) => sum + kpi.totalCredits, 0);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {isEditing ? 'Edit Group' : 'Group Details'}
          </h3>
          <div className="space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editedGroup.name}
                onChange={(e) => setEditedGroup({ ...editedGroup, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            ) : (
              <div className="mt-1 text-sm text-gray-900">{group.name}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Clients</label>
            {isEditing ? (
              <div className="mt-2 space-y-2">
                {clients.map(client => (
                  <label key={client.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editedGroup.clientIds.includes(client.id)}
                      onChange={() => handleClientToggle(client.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{client.fullName}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-1 text-sm text-gray-900">
                {group.clientIds.length} clients
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total Credits</label>
            <div className="mt-1 text-sm font-medium text-green-600">
              ${calculateTotalCredits().toLocaleString()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Documents</label>
            <div className="mt-1 text-sm text-gray-900">
              {editedGroup.kpis.reduce((sum, kpi) => sum + kpi.totalDocuments, 0)} documents
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setEditedGroup(group);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 