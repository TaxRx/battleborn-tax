import React, { useEffect, useMemo, useState } from 'react';
import { Upload, FileSpreadsheet, Users, Send, CheckCircle2 } from 'lucide-react';
import { employeeRoleDesignationsService as svc } from '../../../../services/employeeRoleDesignationsService';

type Props = {
  businessId: string;
  businessYearId: string;
  userId?: string;
};

export default function EmployeeRoleDesignationsCard({ businessId, businessYearId, userId }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [r, roleList] = await Promise.all([
        svc.listForYear(businessYearId),
        svc.listRolesForYear(businessId, businessYearId),
      ]);
      // Backfill: map roles by id and by lowercase name
      const byId: Record<string, any> = {};
      const byName: Record<string, any> = {};
      (roleList || []).forEach((role: any) => {
        if (role?.id) byId[String(role.id)] = role;
        if (role?.name) {
          const key = String(role.name).toLowerCase();
          // prefer year-scoped; replace only if not present
          if (!byName[key] || (role.business_year_id && !byName[key].business_year_id)) {
            byName[key] = role;
          }
        }
      });

      // Auto-resolve role_id / applied_percent when missing
      const fixed: any[] = [];
      for (const row of r) {
        let needsUpdate = false;
        const updates: any = {};
        let role = row.role_id ? byId[String(row.role_id)] : undefined;
        if (!role && row.role_name) role = byName[String(row.role_name).toLowerCase()];
        if (role && !row.role_id) {
          updates.role_id = role.id;
          updates.role_name = role.name;
          needsUpdate = true;
        }
        if (role && (row.applied_percent === null || row.applied_percent === undefined)) {
          if (typeof role.baseline_applied_percent === 'number') {
            updates.applied_percent = role.baseline_applied_percent;
            needsUpdate = true;
          }
        }
        if (needsUpdate) {
          const updated = await svc.updateRow(row.id, updates);
          fixed.push(updated);
        } else {
          fixed.push(row);
        }
      }

      setRows(fixed);
      setRoles(roleList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId && businessYearId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, businessYearId]);

  const roleOptions = useMemo(() => [{ id: null, name: '— None —', baseline_applied_percent: 0 }, ...roles], [roles]);

  const onUploadCSV = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await svc.parseCSV(file);
      await svc.upsertFromCSV(data, businessId);
      await load();
      setFile(null);
    } catch (e) {
      console.error(e);
      alert('Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  const onUpdateCell = async (id: string, updates: any) => {
    // When applied_percent or activity_allocations changes, reflect in local UI immediately
    const updated = await svc.updateRow(id, updates);
    setRows(prev => prev.map(r => (r.id === id ? updated : r)));
  };

  const onRequestDetails = async () => {
    try {
      await svc.requestDetails(businessYearId, userId);
      await load();
      alert('Request sent. This table is now visible to the client.');
    } catch (e) {
      console.error(e);
      alert('Failed to request details');
    }
  };

  const onApply = async () => {
    const res = await svc.apply(businessId, businessYearId);
    await load();
    alert(`Applied ${res.applied} employees to roster`);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
      <div className="flex items-center mb-4">
        <div className="p-3 bg-indigo-100 rounded-lg mr-3">
          <Users className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Employee Role Designations</h4>
          <p className="text-sm text-gray-600">Import employee CSV, request client details, and apply to roster.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="inline-flex items-center px-3 py-2 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
          <Upload className="w-4 h-4 mr-2" />
          Choose CSV
          <input type="file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
        </label>
        <button onClick={onUploadCSV} disabled={!file || loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
          <FileSpreadsheet className="w-4 h-4 inline mr-2" /> Import
        </button>
        <div className="ml-auto flex gap-2">
          {rows.some(r => r.client_visible && r.status === 'requested' && r.requested_at) ? (
            <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              Requested {new Date(rows.find(r => r.requested_at)?.requested_at).toLocaleDateString()}
            </div>
          ) : (
            <button onClick={onRequestDetails} className="px-3 py-2 bg-blue-600 text-white rounded-lg">
              <Send className="w-4 h-4 inline mr-2" /> Request Details
            </button>
          )}
          <button onClick={onApply} className="px-3 py-2 bg-emerald-600 text-white rounded-lg">
            <CheckCircle2 className="w-4 h-4 inline mr-2" /> Apply
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">First Name</th>
              <th className="px-3 py-2 text-left">Last Name</th>
              <th className="px-3 py-2 text-right">Wage</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-right">Applied %</th>
              <th className="px-3 py-2 text-left">Actualization</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  <input className="border rounded px-2 py-1 w-40" value={r.first_name || ''} onChange={e => onUpdateCell(r.id, { first_name: e.target.value })} />
                </td>
                <td className="px-3 py-2">
                  <input className="border rounded px-2 py-1 w-40" value={r.last_name || ''} onChange={e => onUpdateCell(r.id, { last_name: e.target.value })} />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    className="border rounded px-2 py-1 w-40 text-right"
                    value={typeof r.annual_wage === 'number' ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(r.annual_wage)) : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      const val = raw ? parseInt(raw, 10) : 0;
                      onUpdateCell(r.id, { annual_wage: val });
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={r.role_id || ''}
                    onChange={async e => {
                      const opt = roleOptions.find(o => String(o.id) === String(e.target.value));
                      const baseline = opt ? (opt.baseline_applied_percent ?? 0) : 0;
                      await onUpdateCell(r.id, { role_id: opt?.id || null, role_name: opt?.name || null, applied_percent: baseline });
                    }}
                  >
                    {roleOptions.map(opt => (
                      <option key={String(opt.id)} value={opt.id || ''}>
                        {opt.name}{typeof opt.baseline_applied_percent === 'number' ? ` (${Number(opt.baseline_applied_percent).toFixed(2)}%)` : ''}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <input className="border rounded px-2 py-1 w-24 text-right" value={r.applied_percent ?? ''} onChange={e => onUpdateCell(r.id, { applied_percent: e.target.value ? parseFloat(e.target.value) : null })} />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!r.actualization}
                    onChange={e => onUpdateCell(r.id, { actualization: e.target.checked })}
                  />
                </td>
                <td className="px-3 py-2">{r.status}{r.requested_at ? ` — ${new Date(r.requested_at).toLocaleDateString()}` : ''}{r.client_completed_at ? ` — Completed ${new Date(r.client_completed_at).toLocaleDateString()}` : ''}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>{loading ? 'Loading…' : 'No rows yet. Import a CSV to begin.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


