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
  const [name, setName] = useState((client as any).full_name || (client as any).fullName || client.name || '');
  const [email, setEmail] = useState(client.email);
  const [amount, setAmount] = useState(existingDonation?.initialAmount ? existingDonation.initialAmount.toLocaleString() : '');
  const [dueDiligence, setDueDiligence] = useState(existingDonation?.dueDiligenceRequested || false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName((client as any).full_name || (client as any).fullName || client.name || '');
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

  // Calculate AGI (Adjusted Gross Income) - using flexible property access
  const calculateAGI = () => {
    const clientAny = client as any;
    return (clientAny.wages_income || clientAny.wagesIncome || 0) + 
           (clientAny.passive_income || clientAny.passiveIncome || 0) + 
           (clientAny.unearned_income || clientAny.unearnedIncome || 0) + 
           (clientAny.business_owner || clientAny.businessOwner ? (clientAny.ordinary_k1_income || clientAny.ordinaryK1Income || 0) + (clientAny.guaranteed_k1_income || clientAny.guaranteedK1Income || 0) : 0);
  };

  // Calculate maximum allowed donation (60% of AGI)
  const calculateMaxDonation = () => {
    const agi = calculateAGI();
    return Math.floor(agi * 0.6); // 60% AGI limit
  };

  const validate = () => {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return false;
    }
    
    const num = parseInt(amount.replace(/[^\d]/g, ''), 10);
    const agi = calculateAGI();
    const maxDonation = calculateMaxDonation();
    
    if (isNaN(num)) {
      setError('Please enter a valid amount.');
      return false;
    }
    
    if (num < 25000) {
      setError('Amount must be at least $25,000.');
      return false;
    }
    
    if (num > maxDonation) {
      setError(`Amount cannot exceed $${maxDonation.toLocaleString()} (60% of AGI).`);
      return false;
    }
    
    if (agi === 0) {
      setError('Unable to calculate AGI. Please ensure client has income information.');
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

  const agi = calculateAGI();
  const maxDonation = calculateMaxDonation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[400px] max-w-full">
        <h2 className="text-xl font-bold mb-4">Charitable Donation Onboarding</h2>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Donation Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Minimum donation: $25,000</li>
            <li>• Maximum donation: ${maxDonation.toLocaleString()} (60% of AGI)</li>
            <li>• AGI: ${agi.toLocaleString()}</li>
            <li>• FMV multiplier: 5x (deduction value = donation × 5)</li>
          </ul>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Client Name</label>
          <input type="text" className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Client Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Donation Amount (${(25000).toLocaleString()} - ${maxDonation.toLocaleString()})
          </label>
          <input 
            type="text" 
            className="w-full border rounded px-3 py-2" 
            value={amount} 
            onChange={handleAmountChange} 
            placeholder="$25,000" 
          />
          <p className="text-xs text-gray-600 mt-1">
            Deduction value will be: ${(parseInt(amount.replace(/[^\d]/g, '') || '0') * 5).toLocaleString()}
          </p>
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