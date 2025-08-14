export interface Segment {
  id: string;
  name: string;
  value: number;
}

export interface ActivityNode {
  id: string;
  title: string;
  practicePercent?: number;
  stepIds: string[];
  steps: { id: string; name: string; timePercent?: number }[];
  subcomponentsByStep: Record<string, { id: string; name: string; freqPercent?: number }[]>;
}

export interface EffectiveDataResult {
  activities: ActivityNode[];
  segments: Segment[];
}

export async function fetchEffectiveData(client: any, businessYearId: string): Promise<EffectiveDataResult> {
  // Try client-effective views; gracefully fall back to selected_* tables when views are not present
  let actEff: Array<{ activity_id: string; practice_percent: number }>|null = null;
  let stepEff: Array<{ step_id: string; time_percentage: number }>|null = null;
  let subEff: Array<{ subcomponent_id: string; frequency_percentage: number }>|null = null;

  try {
    const { data: a } = await client
      .from('rd_client_effective_activities')
      .select('activity_id, practice_percent')
      .eq('business_year_id', businessYearId);
    actEff = a || [];
  } catch { /* view not found, fallback below */ }

  try {
    const { data: s } = await client
      .from('rd_client_effective_steps')
      .select('step_id, time_percentage')
      .eq('business_year_id', businessYearId);
    stepEff = s || [];
  } catch { /* view not found, fallback */ }

  try {
    const { data: sc } = await client
      .from('rd_client_effective_subcomponents')
      .select('subcomponent_id, frequency_percentage')
      .eq('business_year_id', businessYearId);
    subEff = sc || [];
  } catch { /* view not found, fallback */ }

  if (!actEff) {
    const { data } = await client
      .from('rd_selected_activities')
      .select('activity_id, practice_percent')
      .eq('business_year_id', businessYearId);
    actEff = data || [];
  }

  if (!stepEff) {
    const { data } = await client
      .from('rd_selected_steps')
      .select('step_id, time_percentage')
      .eq('business_year_id', businessYearId);
    stepEff = data || [];
  }

  if (!subEff) {
    const { data } = await client
      .from('rd_selected_subcomponents')
      .select('subcomponent_id, frequency_percentage')
      .eq('business_year_id', businessYearId);
    subEff = data || [];
  }

  const activityIds = Array.from(new Set((actEff || []).map((r: any) => r.activity_id).filter(Boolean)));
  const { data: actRows } = activityIds.length > 0
    ? await client.from('rd_research_activities').select('id,title').in('id', activityIds)
    : { data: [] } as any;

  const stepIds = Array.from(new Set((stepEff || []).map((r: any) => r.step_id).filter(Boolean)));
  const { data: stepRows } = stepIds.length > 0
    ? await client.from('rd_research_steps').select('id,name,research_activity_id').in('id', stepIds)
    : { data: [] } as any;

  const timeByStepId: Record<string, number> = {};
  (stepEff || []).forEach((st: any) => { timeByStepId[st.step_id] = Number(st.time_percentage || 0); });
  const stepsByActivity: Record<string, { id: string; name: string; timePercent?: number }[]> = {};
  (stepRows || []).forEach((s: any) => {
    if (!stepsByActivity[s.research_activity_id]) stepsByActivity[s.research_activity_id] = [];
    stepsByActivity[s.research_activity_id].push({ id: s.id, name: s.name, timePercent: timeByStepId[s.id] });
  });

  const freqBySubId: Record<string, number> = {};
  (subEff || []).forEach((v: any) => { freqBySubId[v.subcomponent_id] = Number(v.frequency_percentage || 0); });
  const subRowsIds = Object.keys(freqBySubId);
  const { data: subRows } = subRowsIds.length > 0
    ? await client.from('rd_research_subcomponents').select('id,name,step_id').in('id', subRowsIds)
    : { data: [] } as any;
  const subsByStep: Record<string, { id: string; name: string; freqPercent?: number }[]> = {};
  (subRows || []).forEach((sc: any) => {
    if (!subsByStep[sc.step_id]) subsByStep[sc.step_id] = [];
    subsByStep[sc.step_id].push({ id: sc.id, name: sc.name, freqPercent: freqBySubId[sc.id] });
  });

  const practiceByActivity: Record<string, number> = {};
  (actEff || []).forEach((a: any) => { practiceByActivity[a.activity_id] = Number(a.practice_percent || 0); });

  const activities: ActivityNode[] = (actRows || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    practicePercent: practiceByActivity[a.id] || 0,
    stepIds: (stepsByActivity[a.id] || []).map(s => s.id),
    steps: stepsByActivity[a.id] || [],
    subcomponentsByStep: Object.fromEntries((stepsByActivity[a.id] || []).map(s => [s.id, subsByStep[s.id] || []]))
  }));

  const segments: Segment[] = activities.map(n => ({ id: n.id, name: n.title, value: n.practicePercent || 0 }));
  return { activities, segments };
}


