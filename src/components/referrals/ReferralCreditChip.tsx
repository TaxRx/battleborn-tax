import React, { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabaseSingleton';

const ReferralCreditChip: React.FC<{ clientId: string }> = ({ clientId }) => {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [total, setTotal] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState<Array<{ id: string; amount: number; applied_at: string | null; applied_to_business_year_id: string | null }>>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('rd_client_referral_credits_summary')
        .select('unapplied_total')
        .eq('client_id', clientId)
        .maybeSingle();
      setTotal(Number((data as any)?.unapplied_total || 0));
      const { data: list } = await supabase
        .from('rd_referral_credits')
        .select('id, amount, applied_at, applied_to_business_year_id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      setCredits((list as any) || []);
    };
    load();
  }, [clientId, supabase]);

  if (!total || total <= 0) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        Referral Credits: ${total.toLocaleString()}
      </button>
      {open && (
        <div className="absolute z-10 mt-2 bg-white border rounded-md shadow-lg p-3 w-72">
          <div className="text-sm font-medium text-gray-900 mb-2">Apply Credits</div>
          <div className="space-y-2 max-h-56 overflow-auto">
            {credits.filter(c => !c.applied_at).length === 0 ? (
              <div className="text-sm text-gray-600">No unapplied credits.</div>
            ) : credits.filter(c => !c.applied_at).map(c => (
              <CreditRow key={c.id} creditId={c.id} amount={c.amount} onApplied={() => { setOpen(false); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CreditRow: React.FC<{ creditId: string; amount: number; onApplied: () => void }> = ({ creditId, amount, onApplied }) => {
  const supabase = getSupabaseClient();
  const [byList, setByList] = useState<Array<{ id: string; year: number }>>([]);
  const [sel, setSel] = useState<string>('');

  useEffect(() => {
    const loadYears = async () => {
      const { data } = await supabase.from('rd_business_years').select('id, year').order('year', { ascending: false });
      setByList((data as any || []).map((r: any) => ({ id: r.id, year: r.year })));
    };
    loadYears();
  }, [supabase]);

  const apply = async () => {
    if (!sel) return;
    await supabase.rpc('rd_apply_referral_credit', { p_credit_id: creditId, p_business_year_id: sel });
    onApplied();
  };

  return (
    <div className="flex items-center justify-between border rounded p-2">
      <div className="text-sm text-gray-800">${amount.toLocaleString()}</div>
      <div className="flex items-center space-x-2">
        <select value={sel} onChange={(e) => setSel(e.target.value)} className="border rounded px-2 py-1 text-xs">
          <option value="">Select year</option>
          {byList.map(by => <option key={by.id} value={by.id}>{by.year}</option>)}
        </select>
        <button onClick={apply} disabled={!sel} className="text-xs px-2 py-1 rounded bg-purple-600 text-white disabled:opacity-50">Apply</button>
      </div>
    </div>
  );
};

export default ReferralCreditChip;


