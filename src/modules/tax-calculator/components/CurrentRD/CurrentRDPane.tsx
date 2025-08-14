import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

type Props = {
  businessId: string | undefined;
};

type Activity = {
  id: string;
  title: string;
};

type Step = { id: string; name: string };
type Subcomponent = { id: string; name: string };

export default function CurrentRDPane({ businessId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [byActivitySteps, setByActivitySteps] = useState<Record<string, Step[]>>({});
  const [byStepSubcomponents, setByStepSubcomponents] = useState<Record<string, Subcomponent[]>>({});
  const [openActivityId, setOpenActivityId] = useState<string | null>(null);
  const [openStepId, setOpenStepId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!businessId) return;
      setLoading(true);
      setError(null);
      try {
        // 1) Find the most recent approved Research Design for this business
        const { data: design } = await supabase
          .from('rd_research_designs')
          .select('id, approved_at')
          .eq('business_id', businessId)
          .eq('status', 'approved')
          .order('approved_at', { ascending: false })
          .limit(1)
          .single();

        if (!design?.id) {
          setActivities([]);
          return;
        }

        // 2) Activities under that design
        const { data: acts } = await supabase
          .from('rd_research_activities')
          .select('id, title')
          .eq('business_id', businessId)
          .eq('design_id', design.id)
          .order('title');

        setActivities(acts || []);

        // 3) Steps and subcomponents for each activity
        const stepsMap: Record<string, Step[]> = {};
        const subMap: Record<string, Subcomponent[]> = {};
        for (const act of acts || []) {
          const { data: steps } = await supabase
            .from('rd_research_steps')
            .select('id, name')
            .eq('research_activity_id', act.id)
            .order('step_order', { ascending: true });
          stepsMap[act.id] = steps || [];
          for (const st of steps || []) {
            const { data: subs } = await supabase
              .from('rd_research_subcomponents')
              .select('id, name')
              .eq('step_id', st.id)
              .order('subcomponent_order', { ascending: true });
            subMap[st.id] = subs || [];
          }
        }
        setByActivitySteps(stepsMap);
        setByStepSubcomponents(subMap);
      } catch (e: any) {
        setError(e?.message || 'Failed to load Current R&D');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId]);

  if (loading) return <div className="lg:col-span-3">Loading Current R&D…</div>;
  if (error) return <div className="lg:col-span-3 text-rose-600">{error}</div>;

  return (
    <div className="space-y-4">
      {activities.map(act => (
        <div key={act.id} className="rounded-xl border bg-white">
          <button
            className="w-full text-left px-5 py-3 font-semibold hover:bg-gray-50"
            onClick={() => setOpenActivityId(prev => (prev === act.id ? null : act.id))}
          >
            {act.title}
          </button>
          {openActivityId === act.id && (
            <div className="px-5 pb-4 space-y-3">
              {(byActivitySteps[act.id] || []).map(st => (
                <div key={st.id} className="rounded-lg border">
                  <button
                    className="w-full text-left px-4 py-2 font-medium bg-gray-50 hover:bg-gray-100"
                    onClick={() => setOpenStepId(prev => (prev === st.id ? null : st.id))}
                  >
                    {st.name}
                  </button>
                  {openStepId === st.id && (
                    <div className="px-4 py-3 space-y-1">
                      {(byStepSubcomponents[st.id] || []).map(sub => (
                        <button
                          key={sub.id}
                          className="block w-full text-left px-3 py-2 rounded hover:bg-indigo-50"
                          onClick={() => {
                            // placeholder for modal open handler to be implemented next
                            const event = new CustomEvent('current-rd:open-sub', { detail: { subcomponentId: sub.id } });
                            window.dispatchEvent(event);
                          }}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {activities.length === 0 && (
        <div className="rounded-xl border bg-white p-6 text-gray-600">No approved research design found.</div>
      )}
    </div>
  );
}


