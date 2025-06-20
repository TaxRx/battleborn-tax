import React, { useState } from 'react';

export interface Owner {
  name: string;
  percent: string;
}

export interface BusinessInfo {
  name: string;
  ein: string;
  entityType: string;
  yearStarted: string;
  category: string;
  focuses: string[];
  owners: Owner[];
  pastQREs: { [year: string]: string };
  pastReceipts: { [year: string]: string };
  address: string;
  contactName: string;
  contactEmail: string;
}

const ENTITY_TYPE_OPTIONS = [
  'C-Corp', 'S-Corp', 'Partnership', 'Sole Proprietorship', 'LLC', 'Other'
];

// Mock API data for categories and focuses
const CATEGORY_OPTIONS = [
  'Healthcare',
  'Technology',
  'Manufacturing',
  'Pharmaceutical',
  'Other',
];
const FOCUS_OPTIONS: { [category: string]: string[] } = {
  Healthcare: ['Aesthetics', 'Primary Care', 'Surgery', 'Other'],
  Technology: ['Software', 'AI', 'Hardware', 'Other'],
  Manufacturing: ['Medical Devices', 'Consumer Goods', 'Other'],
  Pharmaceutical: ['Drug Development', 'Clinical Trials', 'Other'],
  Other: ['General', 'Other'],
};

const getRecentYears = (yearStarted: string) => {
  const now = new Date().getFullYear();
  const start = Math.max(now - 7, parseInt(yearStarted) || now - 7);
  return Array.from({ length: now - start + 1 }, (_, i) => start + i);
};

interface BusinessInfoModalProps {
  initialData?: BusinessInfo;
  open: boolean;
  onClose: () => void;
  onSave: (data: BusinessInfo) => void;
}

export default function BusinessInfoModal({ initialData, open, onClose, onSave }: BusinessInfoModalProps) {
  const [tab, setTab] = useState<'info' | 'history'>('info');
  const [form, setForm] = useState<BusinessInfo>(
    initialData || {
      name: '',
      ein: '',
      entityType: '',
      yearStarted: '',
      category: '',
      focuses: [],
      owners: [{ name: '', percent: '' }],
      pastQREs: {},
      pastReceipts: {},
      address: '',
      contactName: '',
      contactEmail: '',
    }
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Focus options for selected category
  const focusOptions = form.category ? FOCUS_OPTIONS[form.category] || [] : [];
  // Years for history tab
  const years = getRecentYears(form.yearStarted);

  // Ownership validation
  const totalOwnership = form.owners.reduce((sum, o) => sum + (parseFloat(o.percent) || 0), 0);

  if (!open) return null;

  const validateInfo = () => {
    const errs: { [key: string]: string } = {};
    if (!form.name) errs.name = 'Business name is required';
    if (!form.ein) errs.ein = 'EIN is required';
    else if (!/^\d{2}-\d{7}$/.test(form.ein)) errs.ein = 'EIN must be in format 12-3456789';
    if (!form.entityType) errs.entityType = 'Entity type is required';
    if (!form.yearStarted) errs.yearStarted = 'Year started is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.focuses.length) errs.focuses = 'At least one focus is required';
    if (!form.owners.length) errs.owners = 'At least one owner is required';
    form.owners.forEach((o, i) => {
      if (!o.name) errs[`owner_name_${i}`] = 'Owner name is required';
      if (!o.percent) errs[`owner_percent_${i}`] = 'Owner percent is required';
    });
    if (totalOwnership !== 100) errs.owners_total = 'Total ownership must equal 100%';
    if (!form.address) errs.address = 'Address is required';
    if (!form.contactName) errs.contactName = 'Contact name is required';
    if (!form.contactEmail) errs.contactEmail = 'Contact email is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateHistory = () => {
    const errs: { [key: string]: string } = {};
    const now = new Date().getFullYear();
    years.forEach((y, idx) => {
      // Past gross receipts required for 3 most recent years
      if (idx >= years.length - 3 && !form.pastReceipts[y]) {
        errs[`receipt_${y}`] = `Gross receipts for ${y} is required`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: keyof BusinessInfo, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'category') {
      setForm(prev => ({ ...prev, focuses: [] }));
    }
  };

  const handleOwnerChange = (idx: number, field: keyof Owner, value: string) => {
    setForm(prev => ({
      ...prev,
      owners: prev.owners.map((o, i) => i === idx ? { ...o, [field]: value } : o)
    }));
  };
  const addOwner = () => {
    setForm(prev => ({ ...prev, owners: [...prev.owners, { name: '', percent: '' }] }));
  };
  const removeOwner = (idx: number) => {
    setForm(prev => ({ ...prev, owners: prev.owners.filter((_, i) => i !== idx) }));
  };

  const handleQREChange = (year: number, value: string) => {
    setForm(prev => ({ ...prev, pastQREs: { ...prev.pastQREs, [year]: value } }));
  };
  const handleReceiptChange = (year: number, value: string) => {
    setForm(prev => ({ ...prev, pastReceipts: { ...prev.pastReceipts, [year]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'info' && validateInfo()) {
      setTab('history');
    } else if (tab === 'history' && validateHistory()) {
      onSave(form);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 font-medium ${tab === 'info' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}
            onClick={() => setTab('info')}
            type="button"
          >
            Business Info
          </button>
          <button
            className={`px-4 py-2 font-medium ${tab === 'history' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}
            onClick={() => setTab('history')}
            type="button"
          >
            History
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'info' && (
            <>
              <div>
                <label className="block text-sm font-medium">Business Name</label>
                <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} className="w-full border rounded px-3 py-2" />
                {errors.name && <div className="text-red-500 text-xs">{errors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">EIN</label>
                <input type="text" value={form.ein} onChange={e => handleChange('ein', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="12-3456789" />
                {errors.ein && <div className="text-red-500 text-xs">{errors.ein}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">Entity Type</label>
                <select value={form.entityType} onChange={e => handleChange('entityType', e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select entity type</option>
                  {ENTITY_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {errors.entityType && <div className="text-red-500 text-xs">{errors.entityType}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">Year Started</label>
                <input type="number" value={form.yearStarted} onChange={e => handleChange('yearStarted', e.target.value)} className="w-full border rounded px-3 py-2" />
                {errors.yearStarted && <div className="text-red-500 text-xs">{errors.yearStarted}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">Business Category</label>
                <select value={form.category} onChange={e => handleChange('category', e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select category</option>
                  {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {errors.category && <div className="text-red-500 text-xs">{errors.category}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">Business Focus</label>
                <select multiple value={form.focuses} onChange={e => handleChange('focuses', Array.from(e.target.selectedOptions, o => o.value))} className="w-full border rounded px-3 py-2 h-24">
                  {focusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {errors.focuses && <div className="text-red-500 text-xs">{errors.focuses}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">Ownership Info</label>
                <div className="space-y-2">
                  {form.owners.map((owner, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input type="text" value={owner.name} onChange={e => handleOwnerChange(idx, 'name', e.target.value)} placeholder="Owner Name" className="border rounded px-2 py-1 flex-1" />
                      <input type="number" value={owner.percent} onChange={e => handleOwnerChange(idx, 'percent', e.target.value)} placeholder="%" className="border rounded px-2 py-1 w-20" />
                      <button type="button" onClick={() => removeOwner(idx)} className="text-red-500 px-2">Remove</button>
                      {errors[`owner_name_${idx}`] && <div className="text-red-500 text-xs">{errors[`owner_name_${idx}`]}</div>}
                      {errors[`owner_percent_${idx}`] && <div className="text-red-500 text-xs">{errors[`owner_percent_${idx}`]}</div>}
                    </div>
                  ))}
                  <button type="button" onClick={addOwner} className="px-2 py-1 border rounded">Add Owner</button>
                  {errors.owners && <div className="text-red-500 text-xs">{errors.owners}</div>}
                  {errors.owners_total && <div className="text-red-500 text-xs">{errors.owners_total}</div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Address</label>
                <input type="text" value={form.address} onChange={e => handleChange('address', e.target.value)} className="w-full border rounded px-3 py-2" />
                {errors.address && <div className="text-red-500 text-xs">{errors.address}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">Contact Name</label>
                <input type="text" value={form.contactName} onChange={e => handleChange('contactName', e.target.value)} className="w-full border rounded px-3 py-2" />
                {errors.contactName && <div className="text-red-500 text-xs">{errors.contactName}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">Contact Email</label>
                <input type="email" value={form.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} className="w-full border rounded px-3 py-2" />
                {errors.contactEmail && <div className="text-red-500 text-xs">{errors.contactEmail}</div>}
              </div>
            </>
          )}
          {tab === 'history' && (
            <>
              <div>
                <label className="block text-sm font-medium">Past Qualified Research Expenses (QREs)</label>
                <div className="grid grid-cols-1 gap-2">
                  {years.map(y => (
                    <div key={y} className="flex items-center space-x-2">
                      <span className="w-20">{y}</span>
                      <input type="number" value={form.pastQREs[y] || ''} onChange={e => handleQREChange(y, e.target.value)} className="flex-1 border rounded px-3 py-2" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Past Gross Receipts</label>
                <div className="grid grid-cols-1 gap-2">
                  {years.map((y, idx) => (
                    <div key={y} className="flex items-center space-x-2">
                      <span className="w-20">{y}</span>
                      <input type="number" value={form.pastReceipts[y] || ''} onChange={e => handleReceiptChange(y, e.target.value)} className="flex-1 border rounded px-3 py-2" />
                      {errors[`receipt_${y}`] && <div className="text-red-500 text-xs">{errors[`receipt_${y}`]}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="flex justify-between pt-4">
            {tab === 'history' && (
              <button type="button" onClick={() => setTab('info')} className="px-4 py-2 border rounded">Back</button>
            )}
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">
              {tab === 'info' ? 'Next' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
} 