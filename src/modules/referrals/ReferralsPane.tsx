import React, { useEffect, useMemo, useState } from 'react';

type SupabaseFactory = () => any;

interface ReferralsPaneProps {
	getSupabaseClient: SupabaseFactory;
	clientId: string;
	businessId?: string;
}

interface ReferralRecord {
	id: string;
	referrer_client_id: string;
	business_id: string | null;
	name: string;
	email: string;
	phone?: string | null;
	practice_name?: string | null;
	notes?: string | null;
	status: 'referred' | 'engaged';
	created_at: string;
	updated_at: string;
}

const inputCls = 'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500';

const ReferralsPane: React.FC<ReferralsPaneProps> = ({ getSupabaseClient, clientId, businessId }) => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [practice, setPractice] = useState('');
	const [notes, setNotes] = useState('');
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [referrals, setReferrals] = useState<ReferralRecord[]>([]);

	const client = useMemo(() => getSupabaseClient(), [getSupabaseClient]);

	const loadReferrals = async () => {
		try {
			const { data, error } = await client
				.from('rd_referrals')
				.select('*')
				.eq('referrer_client_id', clientId)
				.order('created_at', { ascending: false });
			if (error) throw error;
			setReferrals(data || []);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error('[Referrals] load error', e);
		}
	};

	useEffect(() => {
		loadReferrals();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clientId]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSubmitted(false);
		setLoading(true);
		try {
			const payload = {
				referrer_client_id: clientId,
				business_id: businessId || null,
				name: name.trim(),
				email: email.trim(),
				phone: phone.trim() || null,
				practice_name: practice.trim() || null,
				notes: notes.trim() || null,
				status: 'referred' as const,
			};
			const { error } = await client.from('rd_referrals').insert(payload);
			if (error) throw error;
			setSubmitted(true);
			setName(''); setEmail(''); setPhone(''); setPractice(''); setNotes('');
			await loadReferrals();
		} catch (e: any) {
			setError(e?.message || 'Unable to submit referral.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Referrals</h1>
					<p className="text-gray-600">Thank you for helping others discover R&D tax credits. Make a referral and earn discounts when they engage.</p>
				</div>
			</div>

			{/* Form */}
			<div className="bg-white rounded-xl shadow-lg p-6">
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Name</label>
							<input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="Full name" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">Email</label>
							<input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" className={inputCls} placeholder="name@example.com" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
							<input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="(555) 555-5555" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">Practice Name (optional)</label>
							<input value={practice} onChange={(e) => setPractice(e.target.value)} className={inputCls} placeholder="Business or practice" />
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
						<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} placeholder="Anything we should know" />
					</div>
					<div className="flex items-center justify-between">
						{error ? <div className="text-red-600 text-sm">{error}</div> : <div />}
						<button disabled={loading} className="px-4 py-2 rounded-md text-white bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-700 hover:to-purple-800 disabled:opacity-60">
							{loading ? 'Submitting...' : 'Submit Referral'}
						</button>
					</div>
				</form>
				{submitted && (
					<div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">Thank you! Your referral was submitted successfully.</div>
				)}
			</div>

			{/* List */}
			<div className="bg-white rounded-xl shadow-lg p-6">
				<h3 className="text-lg font-semibold mb-4">Your Referrals</h3>
				{referrals.length === 0 ? (
					<div className="text-sm text-gray-600">No referrals yet.</div>
				) : (
					<div className="space-y-3">
						{referrals.map(r => (
							<div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
								<div>
									<div className="font-medium text-gray-900">{r.name} <span className="text-gray-500">• {r.email}</span></div>
									{r.practice_name && <div className="text-sm text-gray-600">{r.practice_name}</div>}
									{r.phone && <div className="text-sm text-gray-600">{r.phone}</div>}
									{r.notes && <div className="text-sm text-gray-600">{r.notes}</div>}
								</div>
								<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${r.status === 'engaged' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
									{r.status === 'engaged' ? 'Engaged — Credit Applied' : 'Referred'}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default ReferralsPane;


