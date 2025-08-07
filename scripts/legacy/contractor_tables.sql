-- 1. rd_contractors table
create table public.rd_contractors (
  id uuid not null default gen_random_uuid (),
  business_id uuid not null,
  first_name text not null,
  role_id uuid not null,
  is_owner boolean null default false,
  amount numeric(15, 2) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_name text null,
  constraint rd_contractors_pkey primary key (id),
  constraint rd_contractors_business_id_fkey foreign KEY (business_id) references rd_businesses (id) on delete CASCADE,
  constraint rd_contractors_role_id_fkey foreign KEY (role_id) references rd_roles (id) on delete CASCADE
) TABLESPACE pg_default;

-- 2. rd_contractor_year_data table
create table public.rd_contractor_year_data (
  id uuid not null default gen_random_uuid (),
  contractor_id uuid not null,
  business_year_id uuid not null,
  applied_percent numeric(5, 2) not null,
  calculated_qre numeric(15, 2) not null,
  activity_roles jsonb not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint rd_contractor_year_data_pkey primary key (id),
  constraint rd_contractor_year_data_business_year_id_fkey foreign KEY (business_year_id) references rd_business_years (id) on delete CASCADE,
  constraint rd_contractor_year_data_contractor_id_fkey foreign KEY (contractor_id) references rd_contractors (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_rd_contractor_year_data_contractor_year on public.rd_contractor_year_data using btree (contractor_id, business_year_id) TABLESPACE pg_default;

-- 3. rd_contractor_subcomponents table
create table public.rd_contractor_subcomponents (
  id uuid not null default gen_random_uuid (),
  contractor_id uuid not null,
  subcomponent_id uuid not null,
  business_year_id uuid not null,
  time_percentage numeric(5, 2) not null default 0,
  applied_percentage numeric(5, 2) not null default 0,
  is_included boolean not null default true,
  baseline_applied_percent numeric(5, 2) not null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  practice_percentage numeric null,
  year_percentage numeric null,
  frequency_percentage numeric null,
  baseline_practice_percentage numeric null,
  baseline_time_percentage numeric null,
  constraint rd_contractor_subcomponents_pkey primary key (id),
  constraint rd_contractor_subcomponents_unique unique (contractor_id, subcomponent_id, business_year_id),
  constraint rd_contractor_subcomponents_business_year_id_fkey foreign KEY (business_year_id) references rd_business_years (id) on delete CASCADE,
  constraint rd_contractor_subcomponents_contractor_id_fkey foreign KEY (contractor_id) references rd_contractors (id) on delete CASCADE,
  constraint rd_contractor_subcomponents_subcomponent_id_fkey foreign KEY (subcomponent_id) references rd_research_subcomponents (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_rd_contractor_subcomponents_contractor_id on public.rd_contractor_subcomponents using btree (contractor_id) TABLESPACE pg_default;

create index IF not exists idx_rd_contractor_subcomponents_subcomponent_id on public.rd_contractor_subcomponents using btree (subcomponent_id) TABLESPACE pg_default; 