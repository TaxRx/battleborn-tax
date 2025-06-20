import React, { useState, useEffect } from 'react';
import { Client } from '../../types/user';
import { CharitableDonationModal } from '../CharitableDonationModal';
import { advisorService } from '../../services/advisorService';
import type { CharitableDonation } from '../../types/user';
import { getCharitableDonationsByClientYear } from '../../services/advisorService';

interface ClientDetailProps {
  client: Client;
  onClose: () => void;
  onSave: (client: Client) => Promise<void>;
}

export default function ClientDetail({ client, onClose, onSave }: ClientDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Client>(client);
  const [isSaving, setIsSaving] = useState(false);
  const [showCDModal, setShowCDModal] = useState(false);
  const [editingDonation, setEditingDonation] = useState<CharitableDonation | undefined>(undefined);
  const [charitableDonation, setCharitableDonation] = useState<CharitableDonation | undefined>(undefined);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Load Charitable Donation for this client/year
    getCharitableDonationsByClientYear(client.id, currentYear).then(setCharitableDonation);
  }, [client.id]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(editedClient);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save client:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Client Details</h3>
          <div className="space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditedClient(client);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editedClient.fullName}
                onChange={(e) => setEditedClient({ ...editedClient, fullName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            ) : (
              <div className="mt-1 text-gray-900">{client.fullName}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={editedClient.email}
                onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            ) : (
              <div className="mt-1 text-gray-900">{client.email}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Groups</label>
            <div className="mt-1">
              {client.groupIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {client.groupIds.map((groupId) => (
                    <span
                      key={groupId}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {groupId}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No groups assigned</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="mt-1">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                client.hasCompletedTaxProfile ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {client.hasCompletedTaxProfile ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Documents</label>
            <div className="mt-1">
              {client.documents.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {client.documents.map((docId) => (
                    <li key={docId} className="py-2">
                      {docId}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">No documents uploaded</div>
              )}
            </div>
          </div>

          {/* Charitable Donation Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Charitable Donation ({currentYear})</label>
            {charitableDonation ? (
              <div className="mb-2">
                <div>Status: <span className="font-semibold">{charitableDonation.status}</span></div>
                <div>Initial Amount: <span className="font-semibold">${charitableDonation.initialAmount.toLocaleString()}</span></div>
                <div>Final Amount: <span className="font-semibold">{charitableDonation.finalAmount ? `$${charitableDonation.finalAmount.toLocaleString()}` : '-'}</span></div>
                <button
                  onClick={() => { setEditingDonation(charitableDonation); setShowCDModal(true); }}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Charitable Donation
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingDonation(undefined); setShowCDModal(true); }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Start Charitable Donation
              </button>
            )}
          </div>
        </div>
        {showCDModal && (
          <CharitableDonationModal
            open={showCDModal}
            onClose={() => setShowCDModal(false)}
            client={client}
            advisor={{ id: client.advisorId, fullName: '', email: '', role: 'advisor', hasCompletedTaxProfile: false, clients: [], groups: [], advisorCode: '', createdAt: '', updatedAt: '' }}
            year={currentYear}
            existingDonation={editingDonation}
            onSave={donation => {
              setCharitableDonation(donation);
              setShowCDModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
} 