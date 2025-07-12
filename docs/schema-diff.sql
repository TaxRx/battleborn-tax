-- SQL Diff: Full Migration from database-schema.sql to new-db-schema.sql
-- This script contains the SQL statements necessary to transform the old schema into the new schema.
-- Review carefully before running in production. Test on a staging environment first.

-- =========================
-- 1. CREATE NEW TABLES
-- =========================

-- Add all tables present in new-db-schema.sql but not in database-schema.sql
-- (Partial list, add all as needed)

CREATE TABLE IF NOT EXISTS public.admin_client_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid,
  admin_id uuid,
  affiliate_id uuid,
  status text DEFAULT 'active'::text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  tax_profile_data jsonb,
  last_calculation_date timestamp without time zone,
  projected_savings numeric,
  archived boolean DEFAULT false,
  archived_at timestamp with time zone,
  business_id uuid,
  ordinary_k1_income numeric DEFAULT 0,
  guaranteed_k1_income numeric DEFAULT 0,
  household_income numeric DEFAULT 0,
  business_annual_revenue numeric DEFAULT 0,
  email text,
  full_name text,
  phone text,
  filing_status text,
  dependents numeric,
  home_address text,
  state text,
  wages_income numeric,
  passive_income numeric,
  unearned_income numeric,
  capital_gains numeric,
  custom_deduction numeric,
  business_owner boolean,
  business_name text,
  entity_type text,
  business_address text,
  standard_deduction boolean,
  CONSTRAINT admin_client_files_pkey PRIMARY KEY (id),
  CONSTRAINT admin_client_files_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.profiles(id),
  CONSTRAINT admin_client_files_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id),
  CONSTRAINT admin_client_files_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);

-- Repeat CREATE TABLE IF NOT EXISTS for all new tables in new-db-schema.sql not in database-schema.sql

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

-- =========================
-- 7. CREATE ALL NEW TABLES FROM NEW SCHEMA
-- =========================

-- The following tables are present in new-db-schema.sql but not in database-schema.sql.
-- Each table is created with CREATE TABLE IF NOT EXISTS to ensure idempotency.

-- admin_client_files
CREATE TABLE IF NOT EXISTS public.admin_client_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid,
  admin_id uuid,
  affiliate_id uuid,
  status text DEFAULT 'active'::text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  tax_profile_data jsonb,
  last_calculation_date timestamp without time zone,
  projected_savings numeric,
  archived boolean DEFAULT false,
  archived_at timestamp with time zone,
  business_id uuid,
  ordinary_k1_income numeric DEFAULT 0,
  guaranteed_k1_income numeric DEFAULT 0,
  household_income numeric DEFAULT 0,
  business_annual_revenue numeric DEFAULT 0,
  email text,
  full_name text,
  phone text,
  filing_status text,
  dependents numeric,
  home_address text,
  state text,
  wages_income numeric,
  passive_income numeric,
  unearned_income numeric,
  capital_gains numeric,
  custom_deduction numeric,
  business_owner boolean,
  business_name text,
  entity_type text,
  business_address text,
  standard_deduction boolean,
  CONSTRAINT admin_client_files_pkey PRIMARY KEY (id),
  CONSTRAINT admin_client_files_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.profiles(id),
  CONSTRAINT admin_client_files_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id),
  CONSTRAINT admin_client_files_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);

-- augusta_rule_details
CREATE TABLE IF NOT EXISTS public.augusta_rule_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  strategy_detail_id uuid NOT NULL,
  days_rented integer NOT NULL DEFAULT 14,
  daily_rate numeric NOT NULL DEFAULT 1500,
  total_rent numeric NOT NULL DEFAULT 21000,
  state_benefit numeric NOT NULL DEFAULT 0,
  federal_benefit numeric NOT NULL DEFAULT 0,
  fica_benefit numeric NOT NULL DEFAULT 0,
  total_benefit numeric NOT NULL DEFAULT 0,
  rental_dates jsonb,
  parties_info jsonb,
  rental_info jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT augusta_rule_details_pkey PRIMARY KEY (id),
  CONSTRAINT augusta_rule_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id)
);

-- business_years
CREATE TABLE IF NOT EXISTS public.business_years (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  year integer NOT NULL,
  is_active boolean DEFAULT true,
  ordinary_k1_income numeric DEFAULT 0,
  guaranteed_k1_income numeric DEFAULT 0,
  annual_revenue numeric DEFAULT 0,
  employee_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_years_pkey PRIMARY KEY (id),
  CONSTRAINT business_years_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);

-- centralized_businesses
CREATE TABLE IF NOT EXISTS public.centralized_businesses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['LLC'::text, 'S-Corp'::text, 'C-Corp'::text, 'Partnership'::text, 'Sole Proprietorship'::text, 'Other'::text])),
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

-- charitable_donation_details
CREATE TABLE IF NOT EXISTS public.charitable_donation_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  strategy_detail_id uuid NOT NULL,
  donation_amount numeric NOT NULL DEFAULT 0,
  fmv_multiplier numeric NOT NULL DEFAULT 5.0,
  agi_limit numeric NOT NULL DEFAULT 0.6,
  deduction_value numeric NOT NULL DEFAULT 0,
  federal_savings numeric NOT NULL DEFAULT 0,
  state_savings numeric NOT NULL DEFAULT 0,
  total_benefit numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT charitable_donation_details_pkey PRIMARY KEY (id),
  CONSTRAINT charitable_donation_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id)
);

-- commission_transactions
CREATE TABLE IF NOT EXISTS public.commission_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  proposal_id uuid NOT NULL,
  affiliate_id uuid,
  expert_id uuid,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['expert_payment_received'::text, 'affiliate_payment_due'::text, 'affiliate_payment_sent'::text, 'admin_commission'::text])),
  amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  transaction_date timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  payment_method text,
  reference_number text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT commission_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT commission_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT commission_transactions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.profiles(id),
  CONSTRAINT commission_transactions_expert_id_fkey FOREIGN KEY (expert_id) REFERENCES public.experts(id)
);

-- contractor_expenses
CREATE TABLE IF NOT EXISTS public.contractor_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  contractor_name text,
  amount numeric,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT contractor_expenses_pkey PRIMARY KEY (id)
);

-- convertible_tax_bonds_details
CREATE TABLE IF NOT EXISTS public.convertible_tax_bonds_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  strategy_detail_id uuid NOT NULL,
  ctb_payment numeric NOT NULL DEFAULT 0,
  ctb_tax_offset numeric NOT NULL DEFAULT 0,
  net_savings numeric NOT NULL DEFAULT 0,
  remaining_tax_after_ctb numeric NOT NULL DEFAULT 0,
  reduction_ratio numeric NOT NULL DEFAULT 0.75,
  total_benefit numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT convertible_tax_bonds_details_pkey PRIMARY KEY (id),
  CONSTRAINT convertible_tax_bonds_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id)
);

-- cost_segregation_details
CREATE TABLE IF NOT EXISTS public.cost_segregation_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  strategy_detail_id uuid NOT NULL,
  property_value numeric NOT NULL DEFAULT 0,
  land_value numeric NOT NULL DEFAULT 0,
  improvement_value numeric NOT NULL DEFAULT 0,
  bonus_depreciation_rate numeric NOT NULL DEFAULT 0.8,
  year_acquired integer NOT NULL DEFAULT 2024,
  current_year_deduction numeric NOT NULL DEFAULT 0,
  years_2_to_5_annual numeric NOT NULL DEFAULT 0,
  total_savings numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cost_segregation_details_pkey PRIMARY KEY (id),
  CONSTRAINT cost_segregation_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id)
);

-- employees
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  name text,
  role text,
  salary numeric,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT employees_pkey PRIMARY KEY (id)
);

-- family_management_company_details
CREATE TABLE IF NOT EXISTS public.family_management_company_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  strategy_detail_id uuid NOT NULL,
  members jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_salaries numeric NOT NULL DEFAULT 0,
  state_benefit numeric NOT NULL DEFAULT 0,
  federal_benefit numeric NOT NULL DEFAULT 0,
  fica_benefit numeric NOT NULL DEFAULT 0,
  total_benefit numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT family_management_company_details_pkey PRIMARY KEY (id),
  CONSTRAINT family_management_company_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id)
);

-- hire_children_details
CREATE TABLE IF NOT EXISTS public.hire_children_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  strategy_detail_id uuid NOT NULL,
  children jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_salaries numeric NOT NULL DEFAULT 0,
  state_benefit numeric NOT NULL DEFAULT 0,
  federal_benefit numeric NOT NULL DEFAULT 0,
  fica_benefit numeric NOT NULL DEFAULT 0,
  total_benefit numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hire_children_details_pkey PRIMARY KEY (id),
  CONSTRAINT hire_children_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id)
);

-- leads
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  status text DEFAULT 'new'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- personal_years
CREATE TABLE IF NOT EXISTS public.personal_years (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL,
  year integer NOT NULL,
  wages_income numeric DEFAULT 0,
  passive_income numeric DEFAULT 0,
  unearned_income numeric DEFAULT 0,
  capital_gains numeric DEFAULT 0,
  long_term_capital_gains numeric DEFAULT 0,
  household_income numeric DEFAULT 0,
  ordinary_income numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT personal_years_pkey PRIMARY KEY (id),
  CONSTRAINT personal_years_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

-- proposal_assignments
CREATE TABLE IF NOT EXISTS public.proposal_assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  proposal_id uuid NOT NULL,
  expert_id uuid,
  assigned_by uuid,
  assigned_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_to_expert_at timestamp with time zone,
  expert_response_at timestamp with time zone,
  expert_status text DEFAULT 'assigned'::text CHECK (expert_status = ANY (ARRAY['assigned'::text, 'contacted'::text, 'in_progress'::text, 'completed'::text, 'declined'::text])),
  notes text,
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT proposal_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT proposal_assignments_expert_id_fkey FOREIGN KEY (expert_id) REFERENCES public.experts(id),
  CONSTRAINT proposal_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
);

-- proposal_timeline
CREATE TABLE IF NOT EXISTS public.proposal_timeline (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  proposal_id uuid NOT NULL,
  status_from text,
  status_to text NOT NULL,
  changed_by uuid,
  changed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT proposal_timeline_pkey PRIMARY KEY (id),
  CONSTRAINT proposal_timeline_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id)
);

-- rd_areas
CREATE TABLE IF NOT EXISTS public.rd_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_areas_pkey PRIMARY KEY (id),
  CONSTRAINT rd_areas_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.rd_research_categories(id)
);

-- rd_business_years
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

-- rd_businesses
CREATE TABLE IF NOT EXISTS public.rd_businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  name text NOT NULL,
  ein text NOT NULL,
  entity_type USER-DEFINED NOT NULL,
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

-- rd_contractor_subcomponents
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

-- rd_contractor_year_data
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

-- rd_contractors
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

-- rd_employee_subcomponents
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

-- rd_employee_year_data
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

-- rd_employees
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

-- rd_expenses
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

-- rd_federal_credit_results
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

-- rd_focuses
CREATE TABLE IF NOT EXISTS public.rd_focuses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_focuses_pkey PRIMARY KEY (id),
  CONSTRAINT rd_focuses_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.rd_areas(id)
);

-- rd_research_activities
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

-- rd_research_categories
CREATE TABLE IF NOT EXISTS public.rd_research_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_research_categories_pkey PRIMARY KEY (id)
);

-- rd_research_raw
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

-- rd_research_steps
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

-- rd_research_subcomponents
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

-- rd_roles
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

-- rd_selected_activities
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

-- rd_selected_filter
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

-- rd_selected_steps
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

-- rd_selected_subcomponents
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

-- rd_subcomponents
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

-- rd_supplies
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

-- rd_supply_subcomponents
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

-- rd_supply_year_data
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

-- reinsurance_details
CREATE TABLE IF NOT EXISTS public.reinsurance_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  strategy_detail_id uuid NOT NULL,
  user_contribution numeric NOT NULL DEFAULT 0,
  agi_reduction numeric NOT NULL DEFAULT 0,
  federal_tax_benefit numeric NOT NULL DEFAULT 0,
  state_tax_benefit numeric NOT NULL DEFAULT 0,
  total_tax_savings numeric NOT NULL DEFAULT 0,
  net_year1_cost numeric NOT NULL DEFAULT 0,
  breakeven_years numeric NOT NULL DEFAULT 0,
  future_value numeric NOT NULL DEFAULT 0,
  capital_gains_tax numeric NOT NULL DEFAULT 0,
  setup_admin_cost numeric NOT NULL DEFAULT 0,
  total_benefit numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reinsurance_details_pkey PRIMARY KEY (id),
  CONSTRAINT reinsurance_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id)
);

-- research_activities
CREATE TABLE IF NOT EXISTS public.research_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  name text,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT research_activities_pkey PRIMARY KEY (id)
);

-- strategy_commission_rates
CREATE TABLE IF NOT EXISTS public.strategy_commission_rates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  affiliate_id uuid,
  strategy_name text NOT NULL,
  affiliate_rate numeric NOT NULL,
  admin_rate numeric NOT NULL,
  expert_fee_percentage numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT strategy_commission_rates_pkey PRIMARY KEY (id),
  CONSTRAINT strategy_commission_rates_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.profiles(id)
);

-- strategy_details
CREATE TABLE IF NOT EXISTS public.strategy_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  strategy_id text NOT NULL,
  strategy_name text NOT NULL,
  strategy_category text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_savings numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT strategy_details_pkey PRIMARY KEY (id),
  CONSTRAINT strategy_details_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.tax_proposals(id)
);

-- supply_expenses
CREATE TABLE IF NOT EXISTS public.supply_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  item_name text,
  amount numeric,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT supply_expenses_pkey PRIMARY KEY (id)
);

-- tax_calculations
CREATE TABLE IF NOT EXISTS public.tax_calculations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year integer NOT NULL,
  tax_info jsonb NOT NULL,
  breakdown jsonb NOT NULL,
  strategies jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tax_calculations_pkey PRIMARY KEY (id),
  CONSTRAINT tax_calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- tax_estimates
CREATE TABLE IF NOT EXISTS public.tax_estimates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tax_estimates_pkey PRIMARY KEY (id),
  CONSTRAINT tax_estimates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- tax_profiles
CREATE TABLE IF NOT EXISTS public.tax_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  standard_deduction boolean DEFAULT false,
  business_owner boolean DEFAULT false,
  full_name text,
  email text,
  filing_status text,
  dependents integer DEFAULT 0,
  home_address text,
  state text,
  wages_income numeric DEFAULT 0,
  passive_income numeric DEFAULT 0,
  unearned_income numeric DEFAULT 0,
  capital_gains numeric DEFAULT 0,
  custom_deduction numeric DEFAULT 0,
  charitable_deduction numeric DEFAULT 0,
  business_name text,
  entity_type text,
  ordinary_k1_income numeric DEFAULT 0,
  guaranteed_k1_income numeric DEFAULT 0,
  business_address text,
  deduction_limit_reached boolean DEFAULT false,
  household_income numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone text,
  CONSTRAINT tax_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT tax_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- tax_proposals
CREATE TABLE IF NOT EXISTS public.tax_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  affiliate_id text,
  client_id text,
  client_name text,
  year integer NOT NULL,
  tax_info jsonb NOT NULL,
  proposed_strategies jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_savings numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'proposed'::text, 'accepted'::text, 'rejected'::text, 'implemented'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tax_proposals_pkey PRIMARY KEY (id),
  CONSTRAINT tax_proposals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- tool_enrollments
CREATE TABLE IF NOT EXISTS public.tool_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_file_id uuid NOT NULL,
  business_id uuid NOT NULL,
  tool_slug text NOT NULL CHECK (tool_slug = ANY (ARRAY['rd'::text, 'augusta'::text, 'hire_children'::text, 'cost_segregation'::text, 'convertible_bonds'::text, 'tax_planning'::text])),
  enrolled_by uuid,
  enrolled_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text, 'cancelled'::text])),
  notes text,
  CONSTRAINT tool_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT tool_enrollments_client_file_id_fkey FOREIGN KEY (client_file_id) REFERENCES public.admin_client_files(id),
  CONSTRAINT tool_enrollments_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES public.profiles(id)
);

-- user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  theme text DEFAULT 'light'::text,
  notifications_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role_type USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
); 