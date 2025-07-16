-- Fix rd_employee_subcomponents schema to match the actual table structure
-- This migration ensures the table matches the provided schema exactly

-- Drop the table if it exists and recreate with correct schema
DROP TABLE IF EXISTS public.rd_employee_subcomponents CASCADE;

-- Create the table with the exact schema provided
CREATE TABLE public.rd_employee_subcomponents (
  id uuid not null default gen_random_uuid (),
  employee_id uuid not null,
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
  user_id uuid null,
  constraint rd_employee_subcomponents_pkey primary key (id),
  constraint rd_employee_subcomponents_unique unique (employee_id, subcomponent_id, business_year_id),
  constraint rd_employee_subcomponents_business_year_id_fkey foreign KEY (business_year_id) references rd_business_years (id) on delete CASCADE,
  constraint rd_employee_subcomponents_employee_id_fkey foreign KEY (employee_id) references rd_employees (id) on delete CASCADE,
  constraint rd_employee_subcomponents_subcomponent_id_fkey foreign KEY (subcomponent_id) references rd_research_subcomponents (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rd_employee_subcomponents_user_id ON public.rd_employee_subcomponents USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_rd_employee_subcomponents_employee_id ON public.rd_employee_subcomponents USING btree (employee_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_rd_employee_subcomponents_subcomponent_id ON public.rd_employee_subcomponents USING btree (subcomponent_id) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.rd_employee_subcomponents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own employee subcomponents" ON public.rd_employee_subcomponents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own employee subcomponents" ON public.rd_employee_subcomponents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own employee subcomponents" ON public.rd_employee_subcomponents
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own employee subcomponents" ON public.rd_employee_subcomponents
    FOR DELETE USING (user_id = auth.uid()); 