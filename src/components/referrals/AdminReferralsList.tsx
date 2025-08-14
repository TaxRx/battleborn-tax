import React, { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

interface AdminReferralRow {
	id: string;
	name: string;
	email: string;
	phone?: string | null;
	practice_name?: string | null;
	notes?: string | null;
	status: 'referred' | 'engaged';
	referrer_client_id: string;
	referrer_email?: string | null;
	referrer_name?: string | null;
	created_at: string;
}

const statusOptions: Array<{ value: 'referred' | 'engaged'; label: string }> = [
	{ value: 'referred', label: 'Referred' },
	{ value: 'engaged', label: 'Engaged' },
];

const AdminReferralsList: React.FC = () => {
	const supabase = useMemo(() => getSupabase(), []);
	const [rows, setRows] = useState<AdminReferralRow[]>([]);
	const [open, setOpen] = useState<Record<string, boolean>>({});

	const load = async () => {
		const { data, error } = await supabase
			.from('rd_referrals_view')
			.select('*')
			.order('created_at', { ascending: false });
		if (error) {
			// eslint-disable-next-line no-console
			console.error('[AdminReferrals] load error', error);
			return;
		}
		setRows(data || []);
	};

	useEffect(() => { load(); }, []);

	const updateStatus = async (id: string, next: 'referred' | 'engaged') => {
		await supabase.from('rd_referrals').update({ status: next }).eq('id', id);
		await load();
	};

	return (
		<div className="space-y-3">
			{rows.map(r => {
				const isOpen = !!open[r.id];
				return (
					<div key={r.id} className="border rounded-lg">
						<button onClick={() => setOpen(prev => ({ ...prev, [r.id]: !prev[r.id] }))} className="w-full flex items-center justify-between p-3">
							<div className="text-left">
								<div className="font-medium text-gray-900">{r.name} <span className="text-gray-500">• {r.email}</span></div>
								<div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
							</div>
							<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${r.status === 'engaged' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{r.status === 'engaged' ? 'Engaged' : 'Referred'}</span>
						</button>
						{isOpen && (
							<div className="px-4 pb-4 space-y-2">
								<div className="text-sm text-gray-700">Referrer: {r.referrer_name || '(client)'} {r.referrer_email && <span className="text-gray-500">• {r.referrer_email}</span>}</div>
								{r.phone && <div className="text-sm text-gray-700">Phone: {r.phone}</div>}
								{r.practice_name && <div className="text-sm text-gray-700">Practice: {r.practice_name}</div>}
								{r.notes && <div className="text-sm text-gray-700">Notes: {r.notes}</div>}
								<div className="pt-2">
									<label className="text-sm text-gray-600 mr-2">Status</label>
									<select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value as any)} className="border rounded-md px-2 py-1 text-sm">
										{statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
									</select>
								</div>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default AdminReferralsList;


