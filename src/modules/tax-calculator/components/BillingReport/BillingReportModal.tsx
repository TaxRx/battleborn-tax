import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Download, Calendar, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { RDCalculationsService } from '../../services/rdCalculationsService';
import { getSupabaseClient } from '../../../../lib/supabaseSingleton';

interface BillingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
  selectedYearIds: string[];
  availableYears: Array<{ id: string; year: number }>;
  includeStateCredits?: boolean;
}

type YearCredit = {
  businessYearId: string;
  yearLabel: string;
  federal: number;
  state: number;
  total: number;
};

export const BillingReportModal: React.FC<BillingReportModalProps> = ({
  isOpen,
  onClose,
  businessId,
  selectedYearIds,
  availableYears,
  includeStateCredits = true
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsByYear, setCreditsByYear] = useState<YearCredit[]>([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState<Record<string, number>>({});

  // Billing configuration
  const [baseBillingPercent, setBaseBillingPercent] = useState<number>(23);
  const [plan3Enabled, setPlan3Enabled] = useState<boolean>(false);
  const [plan6Enabled, setPlan6Enabled] = useState<boolean>(false);
  const [plan12Enabled, setPlan12Enabled] = useState<boolean>(false);
  const [plan3Percent, setPlan3Percent] = useState<number>(0);
  const [plan6Percent, setPlan6Percent] = useState<number>(0);
  const [plan12Percent, setPlan12Percent] = useState<number>(0);
  // Per-year inputs
  const [prepayments, setPrepayments] = useState<Record<string, number>>({});
  const [unappliedCredits, setUnappliedCredits] = useState<Array<{ id: string; amount: number }>>([]);
  const [applyCreditSel, setApplyCreditSel] = useState<Record<string, string>>({});

  const reportRef = useRef<HTMLDivElement | null>(null);

  const visible = isOpen;

  const yearLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const y of availableYears) map[y.id] = String(y.year);
    return map;
  }, [availableYears]);

  useEffect(() => {
    const loadCredits = async () => {
      if (!visible) return;
      if (!selectedYearIds?.length) {
        setCreditsByYear([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseClient();
        const results: YearCredit[] = [];
        for (const byId of selectedYearIds) {
          const calc = await RDCalculationsService.calculateCredits(byId);
          const federal = Math.round(calc.totalFederalCredit || 0);
          const state = Math.round((includeStateCredits ? calc.totalStateCredits : 0) || 0);
          results.push({
            businessYearId: byId,
            yearLabel: yearLabelMap[byId] || '',
            federal,
            state,
            total: Math.round(federal + state)
          });
        }
        setCreditsByYear(results);

        // Load applied referral discounts for these BYs
        const { data } = await supabase
          .from('rd_referral_credits')
          .select('applied_to_business_year_id, amount')
          .in('applied_to_business_year_id', selectedYearIds);
        const map: Record<string, number> = {};
        (data as any || []).forEach((r: any) => {
          const k = r.applied_to_business_year_id;
          map[k] = (map[k] || 0) + Number(r.amount || 0);
        });
        setAppliedDiscounts(map);
      } catch (e: any) {
        setError(e?.message || 'Failed to load credits');
      } finally {
        setLoading(false);
      }
    };
    loadCredits();
  }, [visible, selectedYearIds, yearLabelMap]);

  const baseTotals = useMemo(() => {
    const federal = Math.round(creditsByYear.reduce((s, y) => s + y.federal, 0));
    const state = Math.round(creditsByYear.reduce((s, y) => s + y.state, 0));
    const total = Math.round(creditsByYear.reduce((s, y) => s + y.total, 0));
    return { federal, state, total };
  }, [creditsByYear]);

  const formatCurrency = (v: number) => `$${(v || 0).toLocaleString()}`;

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let position = 0;
    if (imgHeight < pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    } else {
      // Split to multiple pages if needed, but design for single page
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);
    }
    pdf.save('Billing_Report.pdf');
  };

  const computeBaseBill = (amount: number) => Math.round((amount * (baseBillingPercent || 0)) / 100);
  const computePlan = (amount: number, pct: number, months: number) => {
    const total = Math.round((amount * (pct || 0)) / 100);
    const monthly = months > 0 ? Math.round(total / months) : 0;
    return { total, monthly };
  };

  if (!visible) return null;

  // Totals with prepayments and discounts
  const totals = useMemo(() => {
    const federal = Math.round(creditsByYear.reduce((s, y) => s + y.federal, 0));
    const state = Math.round(creditsByYear.reduce((s, y) => s + y.state, 0));
    const totalCredits = Math.round(creditsByYear.reduce((s, y) => s + y.total, 0));
    const baseBefore = creditsByYear.reduce((s, y) => s + Math.round((y.total * (baseBillingPercent || 0)) / 100), 0);
    const totalDiscounts = selectedYearIds.reduce((s, id) => s + (appliedDiscounts[id] || 0), 0);
    const totalPrepay = selectedYearIds.reduce((s, id) => s + (prepayments[id] || 0), 0);
    const amountDue = Math.max(0, baseBefore - totalDiscounts - totalPrepay);
    return { federal, state, totalCredits, baseBefore, totalDiscounts, totalPrepay, amountDue };
  }, [creditsByYear, baseBillingPercent, appliedDiscounts, prepayments, selectedYearIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl border">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-700 to-violet-700 text-white">
          <div className="flex items-center space-x-2">
            <DollarSign size={20} />
            <h3 className="text-lg font-semibold">Billing Report</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded">
            <X />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Controls */}
          <div className="lg:border-r p-6 space-y-6 bg-slate-50">
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Billing Percentages</h4>
              <div className="space-y-3">
                <label className="block text-sm text-gray-700">Base Billing %</label>
                <input
                  type="number"
                  value={baseBillingPercent}
                  onChange={e => setBaseBillingPercent(Number(e.target.value || 0))}
                  className="w-full border rounded px-3 py-2"
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Payment Plans</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={plan3Enabled} onChange={e => setPlan3Enabled(e.target.checked)} />
                    <span className="text-sm">3 months</span>
                  </div>
                  <input
                    type="number"
                    value={plan3Percent}
                    onChange={e => setPlan3Percent(Number(e.target.value || 0))}
                    className="w-24 border rounded px-2 py-1 text-sm"
                    placeholder="%"
                    min={0}
                    max={100}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={plan6Enabled} onChange={e => setPlan6Enabled(e.target.checked)} />
                    <span className="text-sm">6 months</span>
                  </div>
                  <input
                    type="number"
                    value={plan6Percent}
                    onChange={e => setPlan6Percent(Number(e.target.value || 0))}
                    className="w-24 border rounded px-2 py-1 text-sm"
                    placeholder="%"
                    min={0}
                    max={100}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={plan12Enabled} onChange={e => setPlan12Enabled(e.target.checked)} />
                    <span className="text-sm">12 months</span>
                  </div>
                  <input
                    type="number"
                    value={plan12Percent}
                    onChange={e => setPlan12Percent(Number(e.target.value || 0))}
                    className="w-24 border rounded px-2 py-1 text-sm"
                    placeholder="%"
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </div>

            {/* Referral Discount and Prepayment Inputs */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Prepayments & Referral Discounts</h4>
              <div className="space-y-2">
                {selectedYearIds.map(byId => (
                  <div key={byId} className="flex items-center justify-between text-sm">
                    <div className="text-gray-700">Year {yearLabelMap[byId] || ''}</div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Prepayment"
                        value={prepayments[byId] ?? ''}
                        onChange={e => setPrepayments(prev => ({ ...prev, [byId]: Number(e.target.value || 0) }))}
                        className="w-28 border rounded px-2 py-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">Use the referral credits chip in Client Management to assign credits to years. Assigned credits appear automatically here and reduce the Base Billing.</div>
            </div>

            <div className="pt-2 border-t">
              <button
                onClick={handleDownloadPdf}
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                <Download className="mr-2" size={16} /> Download PDF
              </button>
            </div>
          </div>

          {/* Report */}
          <div className="lg:col-span-3 overflow-y-auto">
            <div ref={reportRef} className="p-10 bg-white min-h-full bg-gradient-to-b from-white to-slate-50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Billing Report</h2>
                  <p className="text-gray-500 text-sm">Summary of credits and proposed billing across selected years</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center justify-end space-x-2">
                    <Calendar size={14} />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {creditsByYear.map((y) => {
                  const discount = Math.round(appliedDiscounts[y.businessYearId] || 0);
                  const baseBill = Math.max(0, computeBaseBill(y.total) - discount);
                  const p3 = plan3Enabled ? computePlan(y.total, plan3Percent, 3) : { total: 0, monthly: 0 };
                  const p6 = plan6Enabled ? computePlan(y.total, plan6Percent, 6) : { total: 0, monthly: 0 };
                  const p12 = plan12Enabled ? computePlan(y.total, plan12Percent, 12) : { total: 0, monthly: 0 };
                  return (
                    <div key={y.businessYearId} className="rounded-xl border p-5 bg-gradient-to-br from-indigo-50/40 to-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-lg font-semibold text-gray-900">Year {y.yearLabel}</div>
                        <div className="text-sm text-gray-500">Total Credit: <span className="font-semibold text-gray-900">{formatCurrency(y.total)}</span></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border bg-white p-4">
                          <div className="text-xs uppercase tracking-wide text-gray-500">Federal Credit</div>
                          <div className="text-xl font-semibold">{formatCurrency(y.federal)}</div>
                        </div>
                        <div className="rounded-lg border bg-white p-4">
                          <div className="text-xs uppercase tracking-wide text-gray-500">State Credit</div>
                          <div className="text-xl font-semibold">{formatCurrency(y.state)}</div>
                        </div>
                        <div className="rounded-lg border bg-white p-4">
                          <div className="text-xs uppercase tracking-wide text-gray-500">Base Billing ({baseBillingPercent || 0}%)</div>
                          <div className="text-xl font-semibold">{formatCurrency(baseBill)}</div>
                        </div>
                        {discount > 0 && (
                          <div className="rounded-lg border bg-white p-4">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Referral Discount</div>
                            <div className="text-xl font-semibold text-emerald-700">- {formatCurrency(discount)}</div>
                          </div>
                        )}
                      </div>

                      {(plan3Enabled || plan6Enabled || plan12Enabled) && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          {plan3Enabled && (
                            <div className="rounded-lg border bg-white p-4">
                              <div className="text-xs uppercase tracking-wide text-gray-500">3-Month Plan ({plan3Percent || 0}%)</div>
                              <div className="text-sm text-gray-700">Monthly: <span className="font-semibold">{formatCurrency(p3.monthly)}</span></div>
                              <div className="text-sm text-gray-700">Total: <span className="font-semibold">{formatCurrency(p3.total)}</span></div>
                              <div className={`text-xs mt-1 ${p3.total - baseBill >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Diff vs Base: {p3.total - baseBill >= 0 ? '+' : ''}{formatCurrency(p3.total - baseBill)}</div>
                            </div>
                          )}
                          {plan6Enabled && (
                            <div className="rounded-lg border bg-white p-4">
                              <div className="text-xs uppercase tracking-wide text-gray-500">6-Month Plan ({plan6Percent || 0}%)</div>
                              <div className="text-sm text-gray-700">Monthly: <span className="font-semibold">{formatCurrency(p6.monthly)}</span></div>
                              <div className="text-sm text-gray-700">Total: <span className="font-semibold">{formatCurrency(p6.total)}</span></div>
                              <div className={`text-xs mt-1 ${p6.total - baseBill >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Diff vs Base: {p6.total - baseBill >= 0 ? '+' : ''}{formatCurrency(p6.total - baseBill)}</div>
                            </div>
                          )}
                          {plan12Enabled && (
                            <div className="rounded-lg border bg-white p-4">
                              <div className="text-xs uppercase tracking-wide text-gray-500">12-Month Plan ({plan12Percent || 0}%)</div>
                              <div className="text-sm text-gray-700">Monthly: <span className="font-semibold">{formatCurrency(p12.monthly)}</span></div>
                              <div className="text-sm text-gray-700">Total: <span className="font-semibold">{formatCurrency(p12.total)}</span></div>
                              <div className={`text-xs mt-1 ${p12.total - baseBill >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Diff vs Base: {p12.total - baseBill >= 0 ? '+' : ''}{formatCurrency(p12.total - baseBill)}</div>
                            </div>
                          )}
                          <div className="md:col-span-3 text-xs text-gray-500">Installments are split equally by month; the last payment may be adjusted slightly for rounding.</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="mt-6 rounded-xl border p-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Total Federal</div>
                    <div className="text-xl font-semibold">{formatCurrency(baseTotals.federal)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Total State</div>
                    <div className="text-xl font-semibold">{formatCurrency(baseTotals.state)}</div>
                  </div>
                  <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">All Credits Total</div>
                    <div className="text-xl font-semibold">{formatCurrency(totals.totalCredits)}</div>
                  </div>
                  <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Base Billing ({baseBillingPercent || 0}%)</div>
                  <div className="text-xl font-semibold">{formatCurrency(totals.baseBefore)}</div>
                  </div>
                </div>

              <div className="mt-3 flex items-center flex-wrap gap-2">
                {totals.totalDiscounts > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Referral Discounts: -{formatCurrency(totals.totalDiscounts)}</span>
                )}
                {totals.totalPrepay > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Prepayments: -{formatCurrency(totals.totalPrepay)}</span>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Amount Due: {formatCurrency(totals.amountDue)}</span>
              </div>

                {(plan3Enabled || plan6Enabled || plan12Enabled) && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plan3Enabled && (() => {
                      const p = computePlan(totals.total, plan3Percent, 3);
                      return (
                        <div className="rounded-lg border bg-gray-50 p-4">
                          <div className="text-xs uppercase tracking-wide text-gray-500">3-Month Plan Total</div>
                          <div className="text-sm text-gray-700">Monthly: <span className="font-semibold">{formatCurrency(p.monthly)}</span></div>
                          <div className="text-sm text-gray-700">Total: <span className="font-semibold">{formatCurrency(p.total)}</span></div>
                          {(() => {
                            const baseAll = creditsByYear.reduce((s, y) => s + computeBaseBill(y.total), 0);
                            const diff = p.total - baseAll;
                            return <div className={`text-xs mt-1 ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Diff vs Base: {diff >= 0 ? '+' : ''}{formatCurrency(diff)}</div>;
                          })()}
                        </div>
                      );
                    })()}
                    {plan6Enabled && (() => {
                      const p = computePlan(totals.total, plan6Percent, 6);
                      return (
                        <div className="rounded-lg border bg-gray-50 p-4">
                          <div className="text-xs uppercase tracking-wide text-gray-500">6-Month Plan Total</div>
                          <div className="text-sm text-gray-700">Monthly: <span className="font-semibold">{formatCurrency(p.monthly)}</span></div>
                          <div className="text-sm text-gray-700">Total: <span className="font-semibold">{formatCurrency(p.total)}</span></div>
                          {(() => {
                            const baseAll = creditsByYear.reduce((s, y) => s + computeBaseBill(y.total), 0);
                            const diff = p.total - baseAll;
                            return <div className={`text-xs mt-1 ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Diff vs Base: {diff >= 0 ? '+' : ''}{formatCurrency(diff)}</div>;
                          })()}
                        </div>
                      );
                    })()}
                    {plan12Enabled && (() => {
                      const p = computePlan(totals.total, plan12Percent, 12);
                      return (
                        <div className="rounded-lg border bg-gray-50 p-4">
                          <div className="text-xs uppercase tracking-wide text-gray-500">12-Month Plan Total</div>
                          <div className="text-sm text-gray-700">Monthly: <span className="font-semibold">{formatCurrency(p.monthly)}</span></div>
                          <div className="text-sm text-gray-700">Total: <span className="font-semibold">{formatCurrency(p.total)}</span></div>
                          {(() => {
                            const baseAll = creditsByYear.reduce((s, y) => s + computeBaseBill(y.total), 0);
                            const diff = p.total - baseAll;
                            return <div className={`text-xs mt-1 ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Diff vs Base: {diff >= 0 ? '+' : ''}{formatCurrency(diff)}</div>;
                          })()}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="mt-6 text-center text-sm text-gray-500">
                  Thank you for the opportunity to support your R&D tax credit journey.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingReportModal;


