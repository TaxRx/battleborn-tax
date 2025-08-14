import React, { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabaseSingleton';

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
interface CreditRow { id: string; referral_id: string; amount: number; applied_at?: string | null; applied_to_business_year_id?: string | null; }

const statusOptions: Array<{ value: 'referred' | 'engaged'; label: string }> = [
	{ value: 'referred', label: 'Referred' },
	{ value: 'engaged', label: 'Engaged' },
];

const AdminReferralsList: React.FC = () => {
	const supabase = useMemo(() => getSupabaseClient(), []);
	const [rows, setRows] = useState<AdminReferralRow[]>([]);
	const [open, setOpen] = useState<Record<string, boolean>>({});
  const [overrideByClient, setOverrideByClient] = useState<Record<string, number>>({});
  const [defaultBonus, setDefaultBonus] = useState<number>(0);

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

		// load overrides
		const { data: overrides } = await supabase.from('rd_referral_client_overrides').select('*');
		const map: Record<string, number> = {};
		(overrides || []).forEach((o: any) => { map[o.client_id] = Number(o.bonus_amount); });
		setOverrideByClient(map);

		// load default
		const { data: settings } = await supabase.from('rd_referral_settings').select('default_bonus_amount').eq('id', 1).maybeSingle();
		setDefaultBonus(Number((settings as any)?.default_bonus_amount || 0));
	};

	useEffect(() => { load(); }, []);

	const updateStatus = async (id: string, next: 'referred' | 'engaged') => {
		await supabase.rpc('rd_update_referral_status_and_award', { p_referral_id: id, p_status: next });
		await load();
	};

  const setClientOverride = async (clientId: string, value: number) => {
    await supabase.from('rd_referral_client_overrides').upsert({ client_id: clientId, bonus_amount: value });
    await load();
  };

	return (
		<div className="space-y-4">
			{/* Global default bonus editor */}
			<div className="border rounded-lg p-3 bg-purple-50 border-purple-200 flex items-center justify-between">
				<div>
					<div className="text-sm font-medium text-purple-900">Universal Referral Bonus</div>
					<div className="text-xs text-purple-700">This amount is used unless a specific client override is set.</div>
				</div>
				<div className="flex items-center space-x-2">
					<input type="number" step="1" min="0" defaultValue={defaultBonus} onBlur={async (e) => {
						const val = Number(e.target.value || 0);
						await supabase.from('rd_referral_settings').upsert({ id: 1, default_bonus_amount: val });
						setDefaultBonus(val);
					}} className="border rounded-md px-2 py-1 text-sm w-28" />
					<span className="text-sm text-purple-800">USD</span>
				</div>
			</div>

					{rows.map(r => {
				const isOpen = !!open[r.id];
						const override = overrideByClient[r.referrer_client_id];
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
										<div className="pt-2 flex items-center space-x-2">
											<label className="text-sm text-gray-600">Bonus override for referrer</label>
											<input type="number" step="1" min="0" defaultValue={override ?? ''} onBlur={(e) => setClientOverride(r.referrer_client_id, Number(e.target.value || 0))} className="border rounded-md px-2 py-1 text-sm w-28" />
											<span className="text-xs text-gray-500">Leave blank to use default</span>
										</div>
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


