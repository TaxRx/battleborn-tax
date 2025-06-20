import React, { useState } from 'react';
import { mockStrategies } from '../data/dashboardMockData';
import { useNavigate } from 'react-router-dom';

type Strategy = typeof mockStrategies[number];

export default function StrategiesAdminPage() {
  const [strategies, setStrategies] = useState<Strategy[]>(mockStrategies);
  const [selected, setSelected] = useState<Strategy | null>(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const filtered: Strategy[] = filter === 'all' ? strategies : strategies.filter(s => s.status === filter);

  const handleStatusChange = (status: 'approved' | 'rejected') => {
    if (!selected) return;
    setStrategies(prev => prev.map(s => s.id === selected.id ? { ...s, status } : s));
    setSelected(null);
  };

  return (
    <div className="p-10 bg-[#F6F8FA] min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8">Submitted Strategies</h1>
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-semibold">Filter:</label>
        <select className="px-3 py-2 border rounded-lg" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="bg-white rounded-2xl shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-sm border-b">
              <th className="py-2">Client</th>
              <th className="py-2">Advisor</th>
              <th className="py-2">Type</th>
              <th className="py-2">Submitted</th>
              <th className="py-2">Value</th>
              <th className="py-2">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b hover:bg-blue-50 cursor-pointer" onClick={() => setSelected(s)}>
                <td className="py-3 font-semibold">{s.clientName}</td>
                <td>{s.advisor}</td>
                <td>{s.type}</td>
                <td>{new Date(s.submittedAt).toLocaleDateString()}</td>
                <td>${s.value.toLocaleString()}</td>
                <td>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{s.status}</span>
                </td>
                <td><button className="text-blue-600 underline">Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Strategy Launch Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Strategy Launch</h2>
        <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-6">
          <div className="flex-1">
            <div className="text-lg font-semibold mb-2">R&D Tax Credit Wizard</div>
            <div className="text-gray-600 mb-4">Launch the full R&D Tax Credit Wizard to simulate or submit a new strategy.</div>
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              onClick={() => navigate('/admin/strategies/rd-wizard')}
            >
              Launch R&D Wizard
            </button>
          </div>
        </div>
      </div>
      {/* Modal for strategy details */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setSelected(null)}>&times;</button>
            <h2 className="text-2xl font-bold mb-2">Strategy Review</h2>
            <div className="mb-4 text-gray-600">Submitted by <span className="font-semibold">{selected.clientName}</span> (Advisor: {selected.advisor})</div>
            <div className="mb-2"><span className="font-semibold">Type:</span> {selected.type}</div>
            <div className="mb-2"><span className="font-semibold">Submitted:</span> {new Date(selected.submittedAt).toLocaleString()}</div>
            <div className="mb-2"><span className="font-semibold">Value:</span> ${selected.value.toLocaleString()}</div>
            <div className="mb-2"><span className="font-semibold">Description:</span> {selected.description}</div>
            <div className="mb-2"><span className="font-semibold">Supporting Docs:</span> {selected.supportingDocs.length ? selected.supportingDocs.map(doc => <a key={doc.name} href={doc.url} className="text-blue-600 underline ml-2">{doc.name}</a>) : <span className="text-gray-400 ml-2">None</span>}</div>
            <div className="mb-4">
              <span className="font-semibold">User Answers:</span>
              <ul className="mt-2 ml-4 list-disc text-gray-700">
                {Object.entries(selected.userAnswers).map(([q, a]) => (
                  <li key={q}><span className="font-semibold">{q}:</span> {a}</li>
                ))}
              </ul>
            </div>
            <div className="flex gap-4 mt-6">
              <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition" onClick={() => handleStatusChange('approved')}>Approve</button>
              <button className="px-6 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition" onClick={() => handleStatusChange('rejected')}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 