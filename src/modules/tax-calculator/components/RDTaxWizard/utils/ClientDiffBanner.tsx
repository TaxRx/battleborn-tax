import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../../lib/supabase';

interface Props {
  businessYearId: string;
}

const ClientDiffBanner: React.FC<Props> = ({ businessYearId }) => {
  const [hasDiff, setHasDiff] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.rpc('rd_client_diff_summary', { p_business_year_id: businessYearId });
        if (!mounted) return;
        // Filter out entries with null client_value
        const filtered = data ? {
          activities: (data.activities || []).filter((x: any) => x.client_value !== null && x.client_value !== undefined && x.client_value !== x.admin_value),
          steps: (data.steps || []).filter((x: any) => x.client_value !== null && x.client_value !== undefined && x.client_value !== x.admin_value),
          subs: (data.subs || []).filter((x: any) => x.client_value !== null && x.client_value !== undefined && x.client_value !== x.admin_value),
        } : { activities: [], steps: [], subs: [] };
        setSummary(filtered);
        const has = !!(filtered.activities.length || filtered.steps.length || filtered.subs.length);
        setHasDiff(has);
        setShow(has);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [businessYearId]);

  if (!show || loading) return null;

  return (
    <>
    <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-3 mb-4 flex items-center justify-between">
      <div className="text-sm">Client has proposed changes for this year. Review before merging into the Research Design.</div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpenPreview(true)}
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-white"
        >
          Preview
        </button>
        <button
          onClick={async () => {
            await supabase.rpc('rd_client_merge_overrides', { p_business_year_id: businessYearId, p_actor: null });
            setShow(false);
            alert('Client changes merged.');
          }}
          className="px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700"
        >
          Merge
        </button>
      </div>
    </div>

    {openPreview && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpenPreview(false)}>
        <div className="bg-white rounded-xl w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Client Proposed Changes</h3>
            <button className="text-gray-600" onClick={() => setOpenPreview(false)}>✕</button>
          </div>
          <div className="space-y-6 max-h-[70vh] overflow-auto">
            <section>
              <h4 className="font-semibold mb-2">Activities</h4>
              {summary?.activities?.length ? (
                <ul className="space-y-1 text-sm">
                  {summary.activities.map((a: any, i: number) => (
                    <li key={`a-${i}`} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <span className="text-gray-700">{a.activity_name || a.activity_id}</span>
                      <span className="text-gray-900">{a.admin_value}% → <span className="text-emerald-700 font-medium">{a.client_value}%</span></span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-500">No activity changes.</p>}
            </section>
            <section>
              <h4 className="font-semibold mb-2">Steps</h4>
              {summary?.steps?.length ? (
                <ul className="space-y-1 text-sm">
                  {summary.steps.map((s: any, i: number) => (
                    <li key={`s-${i}`} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <span className="text-gray-700">{s.step_name || s.step_id}</span>
                      <span className="text-gray-900">{s.admin_value}% → <span className="text-emerald-700 font-medium">{s.client_value}%</span></span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-500">No step changes.</p>}
            </section>
            <section>
              <h4 className="font-semibold mb-2">Subcomponents</h4>
              {summary?.subs?.length ? (
                <ul className="space-y-1 text-sm">
                  {summary.subs.map((sc: any, i: number) => (
                    <li key={`sc-${i}`} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <span className="text-gray-700">{sc.subcomponent_name || sc.subcomponent_id}</span>
                      <span className="text-gray-900">{sc.admin_value}% → <span className="text-emerald-700 font-medium">{sc.client_value}%</span></span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-500">No subcomponent changes.</p>}
            </section>
          </div>
          <div className="mt-4 text-right">
            <button className="px-4 py-2 border rounded-md" onClick={() => setOpenPreview(false)}>Close</button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default ClientDiffBanner;


