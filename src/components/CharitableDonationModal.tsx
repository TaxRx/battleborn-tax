import React, { useState, useEffect } from 'react';
import { createCharitableDonation, updateCharitableDonation } from '../services/advisorService';
import type { Client, Advisor, CharitableDonation } from '../types/user';

interface CharitableDonationModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  advisor: Advisor;
  year: number;
  existingDonation?: CharitableDonation;
  onSave: (donation: CharitableDonation) => void;
}

export const CharitableDonationModal: React.FC<CharitableDonationModalProps> = ({
  open,
  onClose,
  client,
  advisor,
  year,
  existingDonation,
  onSave
}) => {
  const [name, setName] = useState(client.fullName);
  const [email, setEmail] = useState(client.email);
  const [amount, setAmount] = useState(existingDonation?.initialAmount ? existingDonation.initialAmount.toLocaleString() : '');
  const [dueDiligence, setDueDiligence] = useState(existingDonation?.dueDiligenceRequested || false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(client.fullName);
    setEmail(client.email);
    setAmount(existingDonation?.initialAmount ? existingDonation.initialAmount.toLocaleString() : '');
    setDueDiligence(existingDonation?.dueDiligenceRequested || false);
    setError(null);
  }, [client, existingDonation, open]);

  const formatAmount = (val: string) => {
    // Remove non-digits, format as $xx,xxx
    const num = parseInt(val.replace(/[^\d]/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(formatAmount(val));
  };

  const validate = () => {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return false;
    }
    const num = parseInt(amount.replace(/[^\d]/g, ''), 10);
    if (isNaN(num) || num < 25000 || num % 1000 !== 0) {
      setError('Amount must be at least $25,000 and in whole thousands.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const num = parseInt(amount.replace(/[^\d]/g, ''), 10);
      let donation: CharitableDonation;
      if (existingDonation) {
        donation = await updateCharitableDonation(existingDonation.id, {
          clientId: client.id,
          advisorId: advisor.id,
          year,
          initialAmount: num,
          dueDiligenceRequested: dueDiligence,
        }) as CharitableDonation;
      } else {
        donation = await createCharitableDonation({
          clientId: client.id,
          advisorId: advisor.id,
          year,
          initialAmount: num,
          status: 'Invited',
          dueDiligenceRequested: dueDiligence,
        });
      }
      onSave(donation);
      onClose();
    } catch (err) {
      setError('Failed to save Charitable Donation.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[350px] max-w-full">
        <h2 className="text-xl font-bold mb-4">Charitable Donation Onboarding</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Client Name</label>
          <input type="text" className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Client Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Amount ($xx,xxx, whole thousands, min $25,000)</label>
          <input type="text" className="w-full border rounded px-3 py-2" value={amount} onChange={handleAmountChange} placeholder="$25,000" />
        </div>
        <div className="mb-4 flex items-center">
          <input type="checkbox" id="dueDiligence" checked={dueDiligence} onChange={e => setDueDiligence(e.target.checked)} className="mr-2" />
          <label htmlFor="dueDiligence" className="text-sm">Would your client like a due diligence review with our team?</label>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}; 