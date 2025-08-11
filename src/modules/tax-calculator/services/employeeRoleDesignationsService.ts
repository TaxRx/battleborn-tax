import Papa from 'papaparse';
import { supabase } from '../../../lib/supabase';

export interface EmployeeRoleDesignationRow {
  id?: string;
  business_id: string;
  business_year_id: string;
  employee_id?: string | null;
  first_name: string;
  last_name: string;
  annual_wage: number;
  role_id?: string | null;
  role_name?: string | null;
  applied_percent?: number | null;
  activity_allocations?: Record<string, number>;
  status?: 'draft' | 'requested' | 'client_updated' | 'applied';
  client_visible?: boolean;
  requested_at?: string | null;
  client_completed_at?: string | null;
  actualization?: boolean | null;
}

export const employeeRoleDesignationsService = {
  async listForYear(businessYearId: string) {
    const { data, error } = await supabase
      .from('rd_employee_role_designations')
      .select('*')
      .eq('business_year_id', businessYearId)
      .order('last_name', { ascending: true });
    if (error) throw error;
    return data as EmployeeRoleDesignationRow[];
  },

  async listVisibleForYear(businessYearId: string) {
    const { data, error } = await supabase
      .from('rd_employee_role_designations_portal')
      .select('*')
      .eq('business_year_id', businessYearId)
      .order('last_name', { ascending: true });
    if (error) throw error;
    return data as EmployeeRoleDesignationRow[];
  },

  async listRolesForYear(businessId: string, businessYearId: string) {
    // Prefer roles scoped to this business year; include global/business defaults (null business_year_id)
    const { data, error } = await supabase
      .from('rd_roles')
      .select('id,name,baseline_applied_percent,business_year_id')
      .eq('business_id', businessId)
      .or(`business_year_id.is.null,business_year_id.eq.${businessYearId}`)
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async parseCSV(file: File) {
    return new Promise<Record<string, string>[]>((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
      });
    });
  },

  async upsertFromCSV(rows: Record<string, string>[], businessId: string) {
    // Map Year -> business_year_id
    const years = Array.from(new Set(rows.map(r => (r['Year'] || r['year'] || '').trim()).filter(Boolean))).map(y => parseInt(y, 10)).filter(y => !Number.isNaN(y));
    if (years.length === 0) return { inserted: 0 };
    const { data: bys, error: byErr } = await supabase
      .from('rd_business_years')
      .select('id, year')
      .eq('business_id', businessId)
      .in('year', years);
    if (byErr) throw byErr;
    const yearToId = new Map<number, string>((bys || []).map(r => [r.year as number, r.id as string]));

    // Preload roles for matching by name (case-insensitive), prefer year-scoped
    const byIds = Array.from(new Set((bys || []).map(b => b.id)));
    const { data: rolesAll } = await supabase
      .from('rd_roles')
      .select('id,name,baseline_applied_percent,business_year_id')
      .eq('business_id', businessId);
    const roleIndex = (rolesAll || []).reduce((map, r: any) => {
      const key = (r.name || '').toLowerCase();
      if (!map[key]) map[key] = [] as any[];
      map[key].push(r);
      return map;
    }, {} as Record<string, any[]>);

    const payload: EmployeeRoleDesignationRow[] = [];
    for (const r of rows) {
      const firstName = (r['First Name'] || r['first_name'] || r['firstName'] || '').trim();
      const lastName = (r['Last Name'] || r['last_name'] || r['lastName'] || '').trim();
      const wageStr = (r['Wage'] || r['wage'] || '').replace(/[^0-9.\-]/g, '');
      const roleName = (r['Role'] || r['role'] || '').trim() || null;
      const yearStr = (r['Year'] || r['year'] || '').trim();
      const yearNum = parseInt(yearStr, 10);
      if (!firstName || !lastName || !yearNum || !yearToId.get(yearNum)) continue;
      const annualWage = parseFloat(wageStr || '0') || 0;
      // Attempt role match by name
      let role_id: string | null | undefined = null;
      let applied_percent: number | undefined;
      if (roleName) {
        const candidates = roleIndex[(roleName || '').toLowerCase()] || [];
        let match = candidates.find((c: any) => c.business_year_id === yearToId.get(yearNum));
        if (!match) match = candidates.find((c: any) => !c.business_year_id);
        if (match) {
          role_id = match.id;
          applied_percent = typeof match.baseline_applied_percent === 'number' ? match.baseline_applied_percent : undefined;
        }
      }

      payload.push({
        business_id: businessId,
        business_year_id: yearToId.get(yearNum)!,
        first_name: firstName,
        last_name: lastName,
        annual_wage: annualWage,
        role_name: roleName,
        role_id,
        applied_percent,
        status: 'draft',
        client_visible: false,
        activity_allocations: {},
      });
    }
    if (payload.length === 0) return { inserted: 0 };

    const { data, error } = await supabase
      .from('rd_employee_role_designations')
      .insert(payload)
      .select('id');
    if (error) throw error;
    return { inserted: data?.length || 0 };
  },

  async updateRow(id: string, updates: Partial<EmployeeRoleDesignationRow>) {
    const { data, error } = await supabase
      .from('rd_employee_role_designations')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as EmployeeRoleDesignationRow;
  },

  async requestDetails(businessYearId: string, userId?: string) {
    const { error } = await supabase
      .from('rd_employee_role_designations')
      .update({ client_visible: true, status: 'requested', requested_at: new Date().toISOString(), requested_by: userId || null })
      .eq('business_year_id', businessYearId)
      .in('status', ['draft', 'client_updated']);
    if (error) throw error;
    // Mirror to rd_client_requests (roles)
    await this.upsertClientRequest(businessYearId, 'roles', 'requested');
  },

  async clientMarkComplete(businessYearId: string) {
    const { error } = await supabase
      .from('rd_employee_role_designations')
      .update({ client_completed_at: new Date().toISOString(), status: 'client_updated' })
      .eq('business_year_id', businessYearId)
      .eq('client_visible', true);
    if (error) throw error;
    await this.upsertClientRequest(businessYearId, 'roles', 'client_completed');
  },

  async markClientInProgress(businessYearId: string) {
    await this.upsertClientRequest(businessYearId, 'roles', 'client_in_progress');
  },

  async markAdminAcknowledged(businessYearId: string) {
    // Mark admin acknowledged on staging rows
    await supabase
      .from('rd_employee_role_designations')
      .update({ admin_acknowledged_at: new Date().toISOString() })
      .eq('business_year_id', businessYearId)
      .eq('client_visible', true);
    await this.upsertClientRequest(businessYearId, 'roles', 'admin_acknowledged');
  },

  async upsertClientRequest(businessYearId: string, type: 'roles' | 'subcomponents', status: 'requested' | 'client_in_progress' | 'client_completed' | 'admin_acknowledged') {
    // Try to find existing
    const { data: existing } = await supabase
      .from('rd_client_requests')
      .select('id, status')
      .eq('business_year_id', businessYearId)
      .eq('type', type)
      .maybeSingle();

    if (existing?.id) {
      const changes: any = { status };
      if (status === 'client_completed') changes.client_completed_at = new Date().toISOString();
      if (status === 'admin_acknowledged') changes.admin_acknowledged_at = new Date().toISOString();
      await supabase.from('rd_client_requests').update(changes).eq('id', existing.id);
    } else {
      const payload: any = { business_year_id: businessYearId, type, status };
      if (status === 'client_completed') payload.client_completed_at = new Date().toISOString();
      if (status === 'admin_acknowledged') payload.admin_acknowledged_at = new Date().toISOString();
      await supabase.from('rd_client_requests').insert(payload);
    }
  },

  async apply(businessId: string, businessYearId: string) {
    // Fetch rows to apply
    const { data: rows, error } = await supabase
      .from('rd_employee_role_designations')
      .select('*')
      .eq('business_id', businessId)
      .eq('business_year_id', businessYearId)
      .in('status', ['requested', 'client_updated', 'applied']);
    if (error) throw error;
    if (!rows || rows.length === 0) return { applied: 0 };

    let applied = 0;
    for (const row of rows) {
      // Find or create employee
      let employeeId = row.employee_id as string | undefined;
      if (!employeeId) {
        const { data: existing } = await supabase
          .from('rd_employees')
          .select('id')
          .eq('business_id', businessId)
          .eq('first_name', row.first_name)
          .eq('last_name', row.last_name)
          .maybeSingle();
        if (existing?.id) {
          employeeId = existing.id;
        } else {
          const { data: created, error: createErr } = await supabase
            .from('rd_employees')
            .insert({
              business_id: businessId,
              first_name: row.first_name,
              last_name: row.last_name,
              annual_wage: row.annual_wage,
              role_id: row.role_id || null,
              is_owner: false,
            })
            .select('id')
            .single();
          if (createErr) throw createErr;
          employeeId = created.id;
        }
      }

      // Upsert employee year data (respect actualization flag -> if actualization is false, we use baseline applied_percent; if true, use client's applied_percent)
      if (employeeId) {
        // Check if exists
        const { data: existingYear } = await supabase
          .from('rd_employee_year_data')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('business_year_id', businessYearId)
          .maybeSingle();
        const appliedPercentValue = row.actualization ? (row.applied_percent ?? 0) : (row.applied_percent ?? 0);
        if (existingYear?.id) {
          await supabase
            .from('rd_employee_year_data')
            .update({
              applied_percent: appliedPercentValue,
              calculated_qre: 0,
              activity_roles: row.activity_allocations || {},
            })
            .eq('id', existingYear.id);
        } else {
          await supabase
            .from('rd_employee_year_data')
            .insert({
              employee_id: employeeId,
              business_year_id: businessYearId,
              applied_percent: appliedPercentValue,
              calculated_qre: 0,
              activity_roles: row.activity_allocations || {},
            });
        }
      }

      // Seed rd_employee_subcomponents so Allocation views show data
      try {
        if (employeeId) {
          // Clear existing baseline entries for this BY
          await supabase
            .from('rd_employee_subcomponents')
            .delete()
            .eq('employee_id', employeeId)
            .eq('business_year_id', businessYearId);

          // Load selected subcomponents for this BY
          const { data: selectedSubs } = await supabase
            .from('rd_selected_subcomponents')
            .select('subcomponent_id, research_activity_id')
            .eq('business_year_id', businessYearId);

          const alloc = (row.activity_allocations || {}) as Record<string, number>;
          let allocationMap: Record<string, number> = {};
          if (alloc && Object.keys(alloc).length > 0) allocationMap = alloc;
          // If no per-activity allocations, distribute evenly across activities
          if (Object.keys(allocationMap).length === 0) {
            const activityIds = Array.from(new Set((selectedSubs || []).map(s => s.research_activity_id).filter(Boolean)));
            const per = activityIds.length > 0 ? (row.applied_percent || 0) / activityIds.length : 0;
            activityIds.forEach(aid => { allocationMap[aid] = per; });
          }

          // Group subcomponents by activity
          const activityToSubs = (selectedSubs || []).reduce((m: Record<string, string[]>, s: any) => {
            const key = s.research_activity_id;
            if (!key) return m;
            if (!m[key]) m[key] = [];
            m[key].push(s.subcomponent_id);
            return m;
          }, {});

          const inserts: any[] = [];
          for (const [activityId, percent] of Object.entries(allocationMap)) {
            const subs = activityToSubs[activityId] || [];
            if (subs.length === 0) continue;
            const each = percent / subs.length;
            subs.forEach(subId => {
              inserts.push({
                employee_id: employeeId,
                business_year_id: businessYearId,
                subcomponent_id: subId,
                applied_percentage: each,
                is_included: true,
              });
            });
          }

          if (inserts.length > 0) {
            await supabase.from('rd_employee_subcomponents').insert(inserts);
          }
        }
      } catch (seedErr) {
        console.warn('rd_employee_subcomponents seeding skipped due to error', seedErr);
      }

      // Mark applied
      await supabase
        .from('rd_employee_role_designations')
        .update({ status: 'applied', employee_id: employeeId || null, applied_at: new Date().toISOString() })
        .eq('id', row.id);

      applied += 1;
    }

    return { applied };
  },
};


