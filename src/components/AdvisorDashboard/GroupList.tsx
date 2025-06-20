import React, { useState, useEffect } from 'react';
import { Group } from '../../types/user';
import { advisorService } from '../../services/advisorService';
import GroupDetail from './GroupDetail';

export default function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Get advisorId from auth context
      const advisorId = 'advisor1';
      const fetchedGroups = await advisorService.getGroups(advisorId);
      setGroups(fetchedGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroup = async (group: Group) => {
    try {
      setError(null);
      const updatedGroup = await advisorService.updateGroup(group.id, group);
      setGroups(groups.map(g => g.id === group.id ? updatedGroup : g));
      setSelectedGroup(null);
    } catch (error) {
      console.error('Failed to save group:', error);
      setError('Failed to save group. Please try again.');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this group?')) {
      return;
    }

    try {
      setError(null);
      await advisorService.deleteGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Failed to delete group:', error);
      setError('Failed to delete group. Please try again.');
    }
  };

  const handleAddGroup = async () => {
    try {
      setError(null);
      // TODO: Get advisorId from auth context
      const advisorId = 'advisor1';
      const newGroup = await advisorService.createGroup({
        name: 'New Group',
        advisorId,
        clientIds: [],
        kpis: []
      });
      setGroups([...groups, newGroup]);
      setSelectedGroup(newGroup);
    } catch (error) {
      console.error('Failed to create group:', error);
      setError('Failed to create group. Please try again.');
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalCredits = (group: Group) => {
    return group.kpis.reduce((sum, kpi) => sum + kpi.totalCredits, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Groups & KPIs</h2>
        <button
          onClick={handleAddGroup}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Group
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{group.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{group.clientIds.length} clients</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        ${calculateTotalCredits(group).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {group.kpis.reduce((sum, kpi) => sum + kpi.totalDocuments, 0)} documents
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
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
        )}
      </div>

      {selectedGroup && (
        <GroupDetail
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onSave={handleSaveGroup}
        />
      )}
    </div>
  );
} 