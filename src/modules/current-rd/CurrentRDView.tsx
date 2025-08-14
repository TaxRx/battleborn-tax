import React, { useEffect, useMemo, useState } from 'react';
import { fetchEffectiveData } from './services/currentRDService';
import FrequencyEditor, { SubFreq } from './components/FrequencyEditor';
import PracticeEditor, { PracticeSeg } from './components/PracticeEditor';
import { upsertSubFrequency, upsertActivityPractice } from './services/overrideService';

interface CurrentRDViewProps {
	getSupabaseClient: () => any;
	portalData: { business_id: string } | null;
	businessYearId?: string | null;
	yearLabel?: number | string;
}

interface ActivityNode {
	id: string;
	title: string;
	practicePercent?: number;
	stepIds: string[];
	steps: { id: string; name: string; timePercent?: number }[];
	subcomponentsByStep: Record<string, { id: string; name: string; freqPercent?: number }[]>;
}

export const CurrentRDView: React.FC<CurrentRDViewProps> = ({ getSupabaseClient, portalData, businessYearId, yearLabel }) => {
	const [loading, setLoading] = useState<boolean>(false);
	const [activities, setActivities] = useState<ActivityNode[]>([]);
	const [expandedActivity, setExpandedActivity] = useState<Record<string, boolean>>({});
	const [expandedStep, setExpandedStep] = useState<Record<string, boolean>>({});
	const [modalSubcomponent, setModalSubcomponent] = useState<{ id: string; name: string } | null>(null);
	const [practiceSegments, setPracticeSegments] = useState<Array<{ id: string; name: string; value: number }>>([]);

	useEffect(() => {
		const load = async () => {
			if (!portalData?.business_id && !businessYearId) return;
			setLoading(true);
			const client = getSupabaseClient();
			try {
				if (businessYearId) {
					const result = await fetchEffectiveData(client, businessYearId);
					setActivities(result.activities);
					setPracticeSegments(result.segments);
					return;
				}
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [portalData?.business_id, getSupabaseClient]);

	const toggleActivity = (id: string) => setExpandedActivity(prev => ({ ...prev, [id]: !prev[id] }));
	const toggleStep = (id: string) => setExpandedStep(prev => ({ ...prev, [id]: !prev[id] }));

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Current R&D</h1>
					<p className="text-gray-600">Activities, steps, and selected subcomponents</p>
				</div>
			</div>

			{(yearLabel || businessYearId) && (
				<div className="rounded-xl border bg-blue-50 text-blue-800 px-4 py-3">
					Data reflects Tax Year <span className="font-semibold">{String(yearLabel || '')}</span>
				</div>
			)}

			{/* Intro section */}
			<div className="rounded-xl border p-5 bg-white text-sm text-gray-700">
				<p className="mb-2 font-medium text-gray-900">Welcome to your Current R&D overview.</p>
				<ul className="list-disc pl-5 space-y-1">
					<li><span className="font-semibold">Business Time Percentage</span>: how your overall time is allocated across research activities. Drag the colored bars to adjust each activity. Non‑R&D time is kept at a minimum of 10%.</li>
					<li><span className="font-semibold">Frequency %</span>: how often each subcomponent occurs within a step relative to other subcomponents. Use the step editor to drag segments; totals always remain at 100%.</li>
					<li><span className="font-semibold">How to edit</span>: click and drag a segment to increase/decrease it. Other segments automatically rebalance. Your changes are saved and can be reviewed and merged by your advisor.</li>
				</ul>
			</div>

			{practiceSegments.length > 0 && (
				<div className="rounded-xl border p-4 bg-white">
					<div className="flex items-center justify-between mb-2">
						<div className="text-lg font-semibold text-gray-900">Practice Time Percentage</div>
						<div className="text-sm text-gray-600">Total: 100%</div>
					</div>
					{(() => {
						const total = practiceSegments.reduce((s, p) => s + (p.value || 0), 0);
						const nonRd = Math.max(10, 100 - total);
						const segments = [...practiceSegments, { id: 'non-rd', name: 'Non‑R&D', value: nonRd }];
						return (
							<PracticeEditor
								segments={segments as any}
								onChange={(next) => {
									setPracticeSegments(next.filter(s => s.id !== 'non-rd') as any);
								}}
								onCommit={async (changedId, newValue) => {
									if (!businessYearId) return;
									const client = getSupabaseClient();
									await upsertActivityPractice(client, businessYearId, changedId, newValue);
								}}
							/>
						);
					})()}
				</div>
			)}

			{loading ? (
				<div className="rounded-xl border p-6 bg-white">Loading…</div>
			) : (
				<div className="space-y-3">
					{activities.map((act) => (
						<div key={act.id} className="rounded-xl border bg-white">
							<button onClick={() => toggleActivity(act.id)} className="w-full flex items-center justify-between px-5 py-3">
								<div className="flex items-center gap-3">
									<span className="font-semibold text-gray-900">{act.title}</span>
									{typeof act.practicePercent === 'number' && (
										<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">Business Time {(act.practicePercent || 0).toFixed(1)}%</span>
									)}
								</div>
								<span className="text-sm text-gray-500">{(act.stepIds || []).length} steps</span>
							</button>
							{expandedActivity[act.id] && (
								<div className="px-5 pb-4">
									{act.steps.map((s) => (
										<div key={s.id} className="mt-2 rounded-lg border">
											<button onClick={() => toggleStep(s.id)} className="w-full text-left px-4 py-2 bg-gray-50">
												<div className="flex items-center justify-between w-full">
													<div className="font-medium text-gray-800">{s.name}</div>
													<div className="flex items-center gap-2">
														<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">Time {(s.timePercent || 0).toFixed(1)}%</span>
														<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">Research Variables {(act.subcomponentsByStep[s.id] || []).length}</span>
													</div>
												</div>
											</button>
									{expandedStep[s.id] && (
										<div className="p-4 space-y-3">
											<FrequencyEditor
												subcomponents={(act.subcomponentsByStep[s.id] || []).map(sc => ({ id: sc.id, name: sc.name, value: Number(sc.freqPercent || 0) }))}
												onChange={(next: SubFreq[]) => {
													// Update local display percentages immediately
													act.subcomponentsByStep[s.id] = next.map(n => ({ id: n.id, name: n.name, freqPercent: n.value }));
													setActivities(prev => [...prev]);
												}}
												onCommit={async (changedId, newValue) => {
													if (!businessYearId) return;
													const client = getSupabaseClient();
													await upsertSubFrequency(client, businessYearId, changedId, newValue);
												}}
											/>
											<ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
												{(act.subcomponentsByStep[s.id] || []).map((sc) => (
													<li key={sc.id}>
														<button onClick={() => setModalSubcomponent(sc)} className="w-full text-left px-3 py-2 rounded border hover:bg-gray-50">
															<div className="flex flex-col">
																<span className="text-sm text-gray-900 break-words">{sc.name}</span>
																<span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 w-max">Freq {(sc.freqPercent || 0).toFixed(1)}%</span>
															</div>
														</button>
													</li>
												))}
											</ul>
										</div>
									)}
										</div>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{modalSubcomponent && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalSubcomponent(null)}>
					<div className="bg-white rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
						<h3 className="text-lg font-semibold mb-2">{modalSubcomponent.name}</h3>
						<p className="text-gray-600">Placeholder modal. Detailed design to follow.</p>
						<div className="mt-4 text-right">
							<button className="px-4 py-2 rounded border" onClick={() => setModalSubcomponent(null)}>Close</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CurrentRDView;

