-- Extend staging table with fields for client completion and actualization snapshot
alter table if exists public.rd_employee_role_designations
  add column if not exists client_completed_at timestamptz null,
  add column if not exists actualization boolean null;

-- Helpful index for admin dashboards
create index if not exists idx_rd_erd_status_visibility on public.rd_employee_role_designations (business_year_id, client_visible, status);


