-- Create state pro forma tables
-- Migration: 20241220000000_create_state_proforma_tables.sql

-- Create rd_state_proformas table
create table public.rd_state_proformas (
  id uuid not null default gen_random_uuid (),
  business_year_id uuid not null,
  state_code character varying(2) not null,
  config jsonb not null default '{}'::jsonb,
  total_credit numeric(15, 2) null default 0,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint rd_state_proformas_pkey primary key (id),
  constraint rd_state_proformas_business_year_id_state_code_key unique (business_year_id, state_code)
) TABLESPACE pg_default;

-- Create index for business_year_id
create index IF not exists idx_state_proformas_business_year on public.rd_state_proformas using btree (business_year_id) TABLESPACE pg_default;

-- Create rd_state_proforma_lines table
create table public.rd_state_proforma_lines (
  id uuid not null default gen_random_uuid (),
  state_proforma_id uuid not null,
  line_number character varying(10) not null,
  description text not null,
  amount numeric(15, 2) null default 0,
  is_editable boolean null default true,
  is_calculated boolean null default false,
  calculation_formula text null,
  line_type character varying(50) null,
  sort_order integer not null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint rd_state_proforma_lines_pkey primary key (id),
  constraint rd_state_proforma_lines_state_proforma_id_fkey foreign KEY (state_proforma_id) references rd_state_proformas (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create index for state_proforma_id
create index IF not exists idx_state_proforma_lines_state_proforma_id on public.rd_state_proforma_lines using btree (state_proforma_id) TABLESPACE pg_default;

-- Add RLS policies
alter table public.rd_state_proformas enable row level security;
alter table public.rd_state_proforma_lines enable row level security;

-- RLS policies for rd_state_proformas
create policy "Users can view their own state proformas" on public.rd_state_proformas
  for select using (
    business_year_id in (
      select id from public.business_years 
      where business_id in (
        select id from public.businesses 
        where client_id in (
          select id from public.clients 
          where user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can insert their own state proformas" on public.rd_state_proformas
  for insert with check (
    business_year_id in (
      select id from public.business_years 
      where business_id in (
        select id from public.businesses 
        where client_id in (
          select id from public.clients 
          where user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can update their own state proformas" on public.rd_state_proformas
  for update using (
    business_year_id in (
      select id from public.business_years 
      where business_id in (
        select id from public.businesses 
        where client_id in (
          select id from public.clients 
          where user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can delete their own state proformas" on public.rd_state_proformas
  for delete using (
    business_year_id in (
      select id from public.business_years 
      where business_id in (
        select id from public.businesses 
        where client_id in (
          select id from public.clients 
          where user_id = auth.uid()
        )
      )
    )
  );

-- RLS policies for rd_state_proforma_lines
create policy "Users can view their own state proforma lines" on public.rd_state_proforma_lines
  for select using (
    state_proforma_id in (
      select id from public.rd_state_proformas 
      where business_year_id in (
        select id from public.business_years 
        where business_id in (
          select id from public.businesses 
          where client_id in (
            select id from public.clients 
            where user_id = auth.uid()
          )
        )
      )
    )
  );

create policy "Users can insert their own state proforma lines" on public.rd_state_proforma_lines
  for insert with check (
    state_proforma_id in (
      select id from public.rd_state_proformas 
      where business_year_id in (
        select id from public.business_years 
        where business_id in (
          select id from public.businesses 
          where client_id in (
            select id from public.clients 
            where user_id = auth.uid()
          )
        )
      )
    )
  );

create policy "Users can update their own state proforma lines" on public.rd_state_proforma_lines
  for update using (
    state_proforma_id in (
      select id from public.rd_state_proformas 
      where business_year_id in (
        select id from public.business_years 
        where business_id in (
          select id from public.businesses 
          where client_id in (
            select id from public.clients 
            where user_id = auth.uid()
          )
        )
      )
    )
  );

create policy "Users can delete their own state proforma lines" on public.rd_state_proforma_lines
  for delete using (
    state_proforma_id in (
      select id from public.rd_state_proformas 
      where business_year_id in (
        select id from public.business_years 
        where business_id in (
          select id from public.businesses 
          where client_id in (
            select id from public.clients 
            where user_id = auth.uid()
          )
        )
      )
    )
  ); 