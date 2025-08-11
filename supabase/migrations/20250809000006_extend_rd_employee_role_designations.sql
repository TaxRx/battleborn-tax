

-- public.rd_employee_role_designations definition

-- Drop table

-- DROP TABLE public.rd_employee_role_designations;

CREATE TABLE IF NOT EXISTS public.rd_employee_role_designations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NOT NULL,
	business_year_id uuid NOT NULL,
	employee_id uuid NULL,
	first_name text NOT NULL,
	last_name text NOT NULL,
	annual_wage numeric(15, 2) DEFAULT 0 NOT NULL,
	role_id uuid NULL,
	role_name text NULL,
	applied_percent numeric(5, 2) NULL,
	activity_allocations jsonb DEFAULT '{}'::jsonb NOT NULL,
	status text DEFAULT 'draft'::text NOT NULL,
	client_visible bool DEFAULT false NOT NULL,
	requested_at timestamptz NULL,
	requested_by uuid NULL,
	applied_at timestamptz NULL,
	applied_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	client_completed_at timestamptz NULL,
	actualization bool NULL,
	admin_acknowledged_at timestamptz NULL,
	last_notified_at timestamptz NULL,
	CONSTRAINT rd_employee_role_designations_pkey PRIMARY KEY (id),
	CONSTRAINT rd_employee_role_designations_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'requested'::text, 'client_updated'::text, 'applied'::text])))
);
CREATE INDEX IF NOT EXISTS idx_rd_erd_business ON public.rd_employee_role_designations USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_rd_erd_business_year ON public.rd_employee_role_designations USING btree (business_year_id, status);
CREATE INDEX IF NOT EXISTS idx_rd_erd_status_visibility ON public.rd_employee_role_designations USING btree (business_year_id, client_visible, status);

-- Table Triggers

create trigger if not exists update_rd_erd_updated_at before
update
    on
    public.rd_employee_role_designations for each row execute function update_updated_at_column();


-- public.rd_employee_role_designations foreign keys

ALTER TABLE public.rd_employee_role_designations ADD CONSTRAINT rd_employee_role_designations_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.rd_employee_role_designations ADD CONSTRAINT rd_employee_role_designations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;
ALTER TABLE public.rd_employee_role_designations ADD CONSTRAINT rd_employee_role_designations_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
ALTER TABLE public.rd_employee_role_designations ADD CONSTRAINT rd_employee_role_designations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE SET NULL;
ALTER TABLE public.rd_employee_role_designations ADD CONSTRAINT rd_employee_role_designations_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.rd_employee_role_designations ADD CONSTRAINT rd_employee_role_designations_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rd_roles(id) ON DELETE SET NULL;


-- Extend staging table with fields for client completion and actualization snapshot
alter table if exists public.rd_employee_role_designations
  add column if not exists client_completed_at timestamptz null,
  add column if not exists actualization boolean null;

-- Helpful index for admin dashboards
create index if not exists idx_rd_erd_status_visibility on public.rd_employee_role_designations (business_year_id, client_visible, status);


