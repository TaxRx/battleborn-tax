-- ENUM TYPE DEFINITIONS
CREATE TYPE role_type AS ENUM ('ADMIN', 'CLIENT', 'STAFF');
CREATE TYPE entity_type AS ENUM ('LLC', 'SCORP', 'CCORP', 'PARTNERSHIP', 'SOLEPROP', 'OTHER', 's_corp', 'llc', 'c_corp', 'partnership', 'sole_prop', 'other');
CREATE TYPE rd_report_type AS ENUM ('RESEARCH_DESIGN', 'RESEARCH_SUMMARY', 'FILING_GUIDE');

-- COMBINED MIGRATION SCRIPT
-- This file combines all dependency-ordered parts and other SQL statements.

-- === PART 1 ===
-- Foundational Tables
-- (see part1.sql)
-- PART 1: Foundational Tables (no FKs or only reference other foundational tables)

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role_type role_type NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.research_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  name text,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT research_activities_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.rd_research_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_research_categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.rd_research_raw (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text,
  area text,
  focus text,
  research_activity text,
  subcomponent text,
  phase text,
  step text,
  hint text,
  general_description text,
  goal text,
  hypothesis text,
  alternatives text,
  uncertainties text,
  developmental_process text,
  primary_goal text,
  expected_outcome_type text,
  cpt_codes text,
  cdt_codes text,
  alternative_paths text,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_research_raw_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.centralized_businesses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_name text NOT NULL,
  entity_type entity_type NOT NULL,
  ein text,
  business_address text,
  business_city text,
  business_state text,
  business_zip text,
  business_phone text,
  business_email text,
  industry text,
  year_established integer,
  annual_revenue numeric,
  employee_count integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT centralized_businesses_pkey PRIMARY KEY (id)
); 

-- === PART 2 ===
-- Next Layer of Dependencies
-- (see part2.sql)
-- PART 2: Next Layer of Dependencies

CREATE TABLE IF NOT EXISTS public.rd_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_areas_pkey PRIMARY KEY (id),
  CONSTRAINT rd_areas_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.rd_research_categories(id)
);

CREATE TABLE IF NOT EXISTS public.rd_focuses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_focuses_pkey PRIMARY KEY (id),
  CONSTRAINT rd_focuses_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.rd_areas(id)
);

CREATE TABLE IF NOT EXISTS public.rd_research_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  focus_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  default_roles jsonb NOT NULL,
  default_steps jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  focus text,
  category text,
  area text,
  research_activity text,
  subcomponent text,
  phase text,
  step text,
  CONSTRAINT rd_research_activities_pkey PRIMARY KEY (id),
  CONSTRAINT rd_research_activities_focus_id_fkey FOREIGN KEY (focus_id) REFERENCES public.rd_focuses(id)
);

CREATE TABLE IF NOT EXISTS public.rd_research_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  research_activity_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  step_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_research_steps_pkey PRIMARY KEY (id),
  CONSTRAINT rd_research_steps_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id)
);

CREATE TABLE IF NOT EXISTS public.rd_research_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  subcomponent_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  hint text,
  general_description text,
  goal text,
  hypothesis text,
  alternatives text,
  uncertainties text,
  developmental_process text,
  primary_goal text,
  expected_outcome_type text,
  cpt_codes text,
  cdt_codes text,
  alternative_paths text,
  CONSTRAINT rd_research_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_research_subcomponents_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id)
); 

-- === PART 3 ===
-- Business, Subcomponents, Supplies, and Roles Layer
-- (see part3.sql)
-- PART 3: Business, Subcomponents, Supplies, and Roles Layer

CREATE TABLE IF NOT EXISTS public.rd_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL,
  title text NOT NULL,
  phase text NOT NULL,
  step text,
  hint text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  general_description text,
  goal text,
  hypothesis text,
  alternatives text,
  uncertainties text,
  developmental_process text,
  primary_goal text,
  expected_outcome_type text,
  cpt_codes text,
  cdt_codes text,
  alternative_paths text,
  CONSTRAINT rd_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_subcomponents_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.rd_research_activities(id)
);

CREATE TABLE IF NOT EXISTS public.rd_businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  name text NOT NULL,
  ein text NOT NULL,
  entity_type entity_type NOT NULL,
  start_year integer NOT NULL,
  domicile_state text NOT NULL,
  contact_info jsonb NOT NULL,
  is_controlled_grp boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  historical_data jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (validate_historical_data(historical_data)),
  CONSTRAINT rd_businesses_pkey PRIMARY KEY (id),
  CONSTRAINT rd_businesses_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

CREATE TABLE IF NOT EXISTS public.rd_business_years (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  year integer NOT NULL,
  gross_receipts numeric NOT NULL,
  total_qre numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_business_years_pkey PRIMARY KEY (id),
  CONSTRAINT rd_business_years_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id)
);

CREATE TABLE IF NOT EXISTS public.rd_supplies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  annual_cost numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_supplies_pkey PRIMARY KEY (id),
  CONSTRAINT rd_supplies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id)
);

CREATE TABLE IF NOT EXISTS public.rd_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  parent_id uuid,
  is_default boolean DEFAULT false,
  business_year_id uuid,
  baseline_applied_percent numeric,
  CONSTRAINT rd_roles_pkey PRIMARY KEY (id),
  CONSTRAINT rd_roles_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id),
  CONSTRAINT rd_roles_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id),
  CONSTRAINT rd_roles_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.rd_roles(id)
); 

-- === PART 4 ===
-- Employees, Contractors, and Their Year/Subcomponent Data
-- (see part4.sql)
-- PART 4: Employees, Contractors, and Their Year/Subcomponent Data

CREATE TABLE IF NOT EXISTS public.rd_employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  first_name text NOT NULL,
  role_id uuid NOT NULL,
  is_owner boolean DEFAULT false,
  annual_wage numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_name text,
  user_id uuid,
  CONSTRAINT rd_employees_pkey PRIMARY KEY (id),
  CONSTRAINT rd_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT rd_employees_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rd_roles(id),
  CONSTRAINT rd_employees_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id)
);

CREATE TABLE IF NOT EXISTS public.rd_contractors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  role text,
  annual_cost numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  first_name text,
  last_name text,
  role_id uuid,
  is_owner boolean DEFAULT false,
  amount numeric,
  calculated_qre numeric,
  CONSTRAINT rd_contractors_pkey PRIMARY KEY (id),
  CONSTRAINT rd_contractors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT rd_contractors_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rd_roles(id),
  CONSTRAINT rd_contractors_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id)
);

CREATE TABLE IF NOT EXISTS public.rd_employee_year_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  applied_percent numeric NOT NULL,
  calculated_qre numeric NOT NULL,
  activity_roles jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT rd_employee_year_data_pkey PRIMARY KEY (id),
  CONSTRAINT rd_employee_year_data_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id),
  CONSTRAINT rd_employee_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id)
);

CREATE TABLE IF NOT EXISTS public.rd_contractor_year_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL,
  name text NOT NULL,
  cost_amount numeric NOT NULL,
  applied_percent numeric NOT NULL,
  activity_link jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  contractor_id uuid,
  user_id uuid,
  activity_roles jsonb,
  calculated_qre numeric,
  CONSTRAINT rd_contractor_year_data_pkey PRIMARY KEY (id),
  CONSTRAINT rd_contractor_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id),
  CONSTRAINT rd_contractor_year_data_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id)
);

CREATE TABLE IF NOT EXISTS public.rd_employee_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  time_percentage numeric NOT NULL DEFAULT 0,
  applied_percentage numeric NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  baseline_applied_percent numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  practice_percentage numeric,
  year_percentage numeric,
  frequency_percentage numeric,
  baseline_practice_percentage numeric,
  baseline_time_percentage numeric,
  user_id uuid,
  CONSTRAINT rd_employee_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_employee_subcomponents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id),
  CONSTRAINT rd_employee_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id),
  CONSTRAINT rd_employee_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id)
);

CREATE TABLE IF NOT EXISTS public.rd_contractor_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  time_percentage numeric NOT NULL DEFAULT 0,
  applied_percentage numeric NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  baseline_applied_percent numeric NOT NULL DEFAULT 0,
  practice_percentage numeric,
  year_percentage numeric,
  frequency_percentage numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  baseline_practice_percentage numeric,
  baseline_time_percentage numeric,
  CONSTRAINT rd_contractor_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_contractor_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id),
  CONSTRAINT rd_contractor_subcomponents_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id),
  CONSTRAINT rd_contractor_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id)
); 

-- === PART 5 ===
-- Expenses, Federal Credit Results, Focuses, Selected Activities/Steps, Supplies
-- (see part5.sql)
-- PART 5: Expenses, Federal Credit Results, Focuses, Selected Activities/Steps, Supplies

CREATE TABLE IF NOT EXISTS public.rd_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL,
  research_activity_id uuid NOT NULL,
  step_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  employee_id uuid,
  contractor_id uuid,
  supply_id uuid,
  category text NOT NULL CHECK (category = ANY (ARRAY['Employee'::text, 'Contractor'::text, 'Supply'::text])),
  first_name text,
  last_name text,
  role_name text,
  supply_name text,
  research_activity_title text NOT NULL,
  research_activity_practice_percent numeric NOT NULL,
  step_name text NOT NULL,
  subcomponent_title text NOT NULL,
  subcomponent_year_percent numeric NOT NULL,
  subcomponent_frequency_percent numeric NOT NULL,
  subcomponent_time_percent numeric NOT NULL,
  total_cost numeric NOT NULL,
  applied_percent numeric NOT NULL,
  baseline_applied_percent numeric NOT NULL,
  employee_practice_percent numeric,
  employee_time_percent numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT rd_expenses_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id),
  CONSTRAINT rd_expenses_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id),
  CONSTRAINT rd_expenses_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id),
  CONSTRAINT rd_expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id),
  CONSTRAINT rd_expenses_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id)
);

CREATE TABLE IF NOT EXISTS public.rd_federal_credit_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL UNIQUE,
  standard_credit numeric,
  standard_adjusted_credit numeric,
  standard_base_percentage numeric,
  standard_fixed_base_amount numeric,
  standard_incremental_qre numeric,
  standard_is_eligible boolean DEFAULT false,
  standard_missing_data jsonb,
  asc_credit numeric,
  asc_adjusted_credit numeric,
  asc_avg_prior_qre numeric,
  asc_incremental_qre numeric,
  asc_is_startup boolean DEFAULT false,
  asc_missing_data jsonb,
  selected_method text CHECK (selected_method = ANY (ARRAY['standard'::text, 'asc'::text])),
  use_280c boolean DEFAULT false,
  corporate_tax_rate numeric DEFAULT 0.21,
  total_federal_credit numeric,
  total_state_credits numeric,
  total_credits numeric,
  calculation_date timestamp with time zone DEFAULT now(),
  qre_breakdown jsonb,
  historical_data jsonb,
  state_credits jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_federal_credit_results_pkey PRIMARY KEY (id),
  CONSTRAINT rd_federal_credit_results_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id)
);

CREATE TABLE IF NOT EXISTS public.rd_focuses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_focuses_pkey PRIMARY KEY (id),
  CONSTRAINT rd_focuses_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.rd_areas(id)
);

CREATE TABLE IF NOT EXISTS public.rd_selected_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL,
  activity_id uuid NOT NULL,
  practice_percent numeric NOT NULL,
  selected_roles jsonb NOT NULL,
  config jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  research_guidelines jsonb,
  CONSTRAINT rd_selected_activities_pkey PRIMARY KEY (id),
  CONSTRAINT rd_selected_activities_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id),
  CONSTRAINT rd_selected_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.rd_research_activities(id)
);

CREATE TABLE IF NOT EXISTS public.rd_selected_filter (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL UNIQUE,
  selected_categories ARRAY DEFAULT '{}'::text[],
  selected_areas ARRAY DEFAULT '{}'::text[],
  selected_focuses ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_selected_filter_pkey PRIMARY KEY (id),
  CONSTRAINT rd_selected_filter_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id)
);

CREATE TABLE IF NOT EXISTS public.rd_selected_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL,
  research_activity_id uuid NOT NULL,
  step_id uuid NOT NULL,
  time_percentage numeric NOT NULL DEFAULT 0,
  applied_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_selected_steps_pkey PRIMARY KEY (id),
  CONSTRAINT rd_selected_steps_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id),
  CONSTRAINT rd_selected_steps_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id),
  CONSTRAINT rd_selected_steps_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id)
);

CREATE TABLE IF NOT EXISTS public.rd_selected_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL,
  research_activity_id uuid NOT NULL,
  step_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  frequency_percentage numeric NOT NULL DEFAULT 0,
  year_percentage numeric NOT NULL DEFAULT 0,
  start_month integer NOT NULL DEFAULT 1,
  start_year integer NOT NULL,
  selected_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  non_rd_percentage numeric NOT NULL DEFAULT 0,
  approval_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  hint text,
  general_description text,
  goal text,
  hypothesis text,
  alternatives text,
  uncertainties text,
  developmental_process text,
  primary_goal text,
  expected_outcome_type text,
  cpt_codes text,
  cdt_codes text,
  alternative_paths text,
  applied_percentage numeric,
  time_percentage numeric,
  user_notes text,
  step_name text,
  practice_percentage numeric,
  CONSTRAINT rd_selected_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_selected_subcomponents_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id),
  CONSTRAINT rd_selected_subcomponents_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id),
  CONSTRAINT rd_selected_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id),
  CONSTRAINT rd_selected_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id)
);

CREATE TABLE IF NOT EXISTS public.rd_supply_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  supply_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  applied_percentage numeric NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_supply_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_supply_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id),
  CONSTRAINT rd_supply_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id),
  CONSTRAINT rd_supply_subcomponents_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.rd_supplies(id)
);

CREATE TABLE IF NOT EXISTS public.rd_supply_year_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL,
  name text NOT NULL,
  cost_amount numeric NOT NULL,
  applied_percent numeric NOT NULL,
  activity_link jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  supply_id uuid,
  calculated_qre numeric,
  CONSTRAINT rd_supply_year_data_pkey PRIMARY KEY (id),
  CONSTRAINT rd_supply_year_data_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.rd_supplies(id),
  CONSTRAINT rd_supply_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id)
); 

-- === PART 6 ===
-- Remaining Tables (Proposals, Assignments, Details, Misc)
-- (see part6.sql)
-- PART 6: Remaining Tables (Proposals, Assignments, Details, Misc)

-- === PART 7 ===
-- All Other SQL Statements (non-CREATE TABLE)
-- (see part7.sql) 
-- PART 7: All Other SQL Statements (non-CREATE TABLE)

DROP TABLE IF EXISTS public.drf_tmp_test CASCADE;

-- SQL Diff: Full Migration from database-schema.sql to new-db-schema.sql
-- This script contains the SQL statements necessary to transform the old schema into the new schema.
-- Review carefully before running in production. Test on a staging environment first.

-- =========================
-- 2. ALTER EXISTING TABLES
-- =========================

-- Example: Alter clients table to match new schema
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS full_name character varying,
  ADD COLUMN IF NOT EXISTS phone character varying,
  ADD COLUMN IF NOT EXISTS home_address text,
  ADD COLUMN IF NOT EXISTS standard_deduction boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS custom_deduction numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN filing_status TYPE character varying USING filing_status::character varying,
  ALTER COLUMN state TYPE character varying USING state::character varying;

-- Remove columns no longer present in new schema
ALTER TABLE public.clients
  DROP COLUMN IF EXISTS agi,
  DROP COLUMN IF EXISTS additional_deductions,
  DROP COLUMN IF EXISTS capital_gains,
  DROP COLUMN IF EXISTS se_income,
  DROP COLUMN IF EXISTS qbi_eligible,
  DROP COLUMN IF EXISTS tax_year;

-- Update constraints and foreign keys as needed
-- (Add/modify/drop constraints to match new-db-schema.sql)

-- =========================
-- 3. DROP TABLES NO LONGER PRESENT
-- =========================

-- Example: Drop tables not present in new-db-schema.sql
-- (Add DROP TABLE IF EXISTS for each obsolete table)
-- DROP TABLE IF EXISTS public.strategies CASCADE;
-- DROP TABLE IF EXISTS public.proposals CASCADE;

-- =========================
-- 4. ALTER/CREATE OTHER TABLES
-- =========================

-- Repeat ALTER TABLE and CREATE TABLE for all other tables and changes found in new-db-schema.sql
-- (businesses, profiles, experts, etc.)

-- =========================
-- 5. ADD/UPDATE CONSTRAINTS, INDEXES, FKS
-- =========================

-- Add or update constraints, indexes, and foreign keys to match new-db-schema.sql

-- =========================
-- 6. FINAL REVIEW
-- =========================

-- This file is a comprehensive starting point. For a full migration, continue to expand this script to cover every table, column, and constraint difference between the two schemas.
-- Always test thoroughly before applying to production. 