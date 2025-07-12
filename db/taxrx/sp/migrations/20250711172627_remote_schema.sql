create type "public"."entity_type" as enum ('LLC', 'SCORP', 'CCORP', 'PARTNERSHIP', 'SOLEPROP', 'OTHER', 's_corp', 'llc', 'c_corp', 'partnership', 'sole_prop', 'other');

create type "public"."rd_report_type" as enum ('RESEARCH_DESIGN', 'RESEARCH_SUMMARY', 'FILING_GUIDE');

create type "public"."role_type" as enum ('ADMIN', 'CLIENT', 'STAFF');

drop policy "Admins can view all calculations" on "public"."tax_calculations";

drop policy "Admins can view all profiles" on "public"."user_profiles";

drop policy "Users can insert own profile" on "public"."user_profiles";

drop policy "Users can update own profile" on "public"."user_profiles";

drop policy "Users can view own profile" on "public"."user_profiles";

revoke delete on table "public"."user_profiles" from "anon";

revoke insert on table "public"."user_profiles" from "anon";

revoke references on table "public"."user_profiles" from "anon";

revoke select on table "public"."user_profiles" from "anon";

revoke trigger on table "public"."user_profiles" from "anon";

revoke truncate on table "public"."user_profiles" from "anon";

revoke update on table "public"."user_profiles" from "anon";

revoke delete on table "public"."user_profiles" from "authenticated";

revoke insert on table "public"."user_profiles" from "authenticated";

revoke references on table "public"."user_profiles" from "authenticated";

revoke select on table "public"."user_profiles" from "authenticated";

revoke trigger on table "public"."user_profiles" from "authenticated";

revoke truncate on table "public"."user_profiles" from "authenticated";

revoke update on table "public"."user_profiles" from "authenticated";

revoke delete on table "public"."user_profiles" from "service_role";

revoke insert on table "public"."user_profiles" from "service_role";

revoke references on table "public"."user_profiles" from "service_role";

revoke select on table "public"."user_profiles" from "service_role";

revoke trigger on table "public"."user_profiles" from "service_role";

revoke truncate on table "public"."user_profiles" from "service_role";

revoke update on table "public"."user_profiles" from "service_role";

alter table "public"."user_profiles" drop constraint "user_profiles_user_id_fkey";

alter table "public"."user_profiles" drop constraint "user_profiles_user_id_key";

alter table "public"."user_profiles" drop constraint "user_profiles_pkey";

drop index if exists "public"."user_profiles_pkey";

drop index if exists "public"."user_profiles_user_id_key";

drop table "public"."user_profiles";

create table "public"."admin_client_files" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid,
    "admin_id" uuid,
    "affiliate_id" uuid,
    "status" text default 'active'::text,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "tax_profile_data" jsonb,
    "last_calculation_date" timestamp without time zone,
    "projected_savings" numeric(10,2),
    "archived" boolean default false,
    "archived_at" timestamp with time zone,
    "business_id" uuid,
    "ordinary_k1_income" numeric(15,2) default 0,
    "guaranteed_k1_income" numeric(15,2) default 0,
    "household_income" numeric(15,2) default 0,
    "business_annual_revenue" numeric(15,2) default 0,
    "email" text,
    "full_name" text,
    "phone" text,
    "filing_status" text,
    "dependents" numeric,
    "home_address" text,
    "state" text,
    "wages_income" numeric,
    "passive_income" numeric,
    "unearned_income" numeric,
    "capital_gains" numeric,
    "custom_deduction" numeric,
    "business_owner" boolean,
    "business_name" text,
    "entity_type" text,
    "business_address" text,
    "standard_deduction" boolean
);


alter table "public"."admin_client_files" enable row level security;

create table "public"."augusta_rule_details" (
    "id" uuid not null default gen_random_uuid(),
    "strategy_detail_id" uuid not null,
    "days_rented" integer not null default 14,
    "daily_rate" numeric(10,2) not null default 1500,
    "total_rent" numeric(12,2) not null default 21000,
    "state_benefit" numeric(12,2) not null default 0,
    "federal_benefit" numeric(12,2) not null default 0,
    "fica_benefit" numeric(12,2) not null default 0,
    "total_benefit" numeric(12,2) not null default 0,
    "rental_dates" jsonb,
    "parties_info" jsonb,
    "rental_info" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."augusta_rule_details" enable row level security;

create table "public"."business_years" (
    "id" uuid not null default uuid_generate_v4(),
    "business_id" uuid not null,
    "year" integer not null,
    "is_active" boolean default true,
    "ordinary_k1_income" numeric(12,2) default 0,
    "guaranteed_k1_income" numeric(12,2) default 0,
    "annual_revenue" numeric(15,2) default 0,
    "employee_count" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."business_years" enable row level security;

create table "public"."businesses" (
    "id" uuid not null default uuid_generate_v4(),
    "client_id" uuid not null,
    "business_name" character varying(255) not null,
    "entity_type" character varying(50) not null default 'LLC'::character varying,
    "ein" character varying(20),
    "business_address" text,
    "business_city" character varying(100),
    "business_state" character varying(2),
    "business_zip" character varying(10),
    "business_phone" character varying(50),
    "business_email" character varying(255),
    "industry" character varying(100),
    "year_established" integer,
    "annual_revenue" numeric(15,2) default 0,
    "employee_count" integer default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."businesses" enable row level security;

create table "public"."calculations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "year" integer not null,
    "date" timestamp with time zone not null default timezone('utc'::text, now()),
    "tax_info" jsonb not null,
    "breakdown" jsonb not null,
    "strategies" jsonb[],
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."calculations" enable row level security;

create table "public"."centralized_businesses" (
    "id" uuid not null default uuid_generate_v4(),
    "business_name" text not null,
    "entity_type" text not null,
    "ein" text,
    "business_address" text,
    "business_city" text,
    "business_state" text,
    "business_zip" text,
    "business_phone" text,
    "business_email" text,
    "industry" text,
    "year_established" integer,
    "annual_revenue" numeric(15,2),
    "employee_count" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."centralized_businesses" enable row level security;

create table "public"."charitable_donation_details" (
    "id" uuid not null default gen_random_uuid(),
    "strategy_detail_id" uuid not null,
    "donation_amount" numeric(12,2) not null default 0,
    "fmv_multiplier" numeric(5,2) not null default 5.0,
    "agi_limit" numeric(3,2) not null default 0.6,
    "deduction_value" numeric(12,2) not null default 0,
    "federal_savings" numeric(12,2) not null default 0,
    "state_savings" numeric(12,2) not null default 0,
    "total_benefit" numeric(12,2) not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."charitable_donation_details" enable row level security;

create table "public"."clients" (
    "id" uuid not null default uuid_generate_v4(),
    "full_name" character varying(255) not null,
    "email" character varying(255) not null,
    "phone" character varying(50),
    "filing_status" character varying(50) not null default 'single'::character varying,
    "home_address" text,
    "state" character varying(2),
    "dependents" integer default 0,
    "standard_deduction" boolean default true,
    "custom_deduction" numeric(12,2) default 0,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "archived" boolean default false,
    "archived_at" timestamp with time zone,
    "city" text,
    "zip_code" text
);


alter table "public"."clients" enable row level security;

create table "public"."commission_transactions" (
    "id" uuid not null default uuid_generate_v4(),
    "proposal_id" uuid not null,
    "affiliate_id" uuid,
    "expert_id" uuid,
    "transaction_type" text not null,
    "amount" numeric(12,2) not null,
    "currency" text default 'USD'::text,
    "transaction_date" timestamp with time zone not null default timezone('utc'::text, now()),
    "payment_method" text,
    "reference_number" text,
    "status" text default 'pending'::text,
    "notes" text,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."contractor_expenses" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid,
    "contractor_name" text,
    "amount" numeric,
    "description" text,
    "created_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."contractor_expenses" enable row level security;

create table "public"."convertible_tax_bonds_details" (
    "id" uuid not null default gen_random_uuid(),
    "strategy_detail_id" uuid not null,
    "ctb_payment" numeric(12,2) not null default 0,
    "ctb_tax_offset" numeric(12,2) not null default 0,
    "net_savings" numeric(12,2) not null default 0,
    "remaining_tax_after_ctb" numeric(12,2) not null default 0,
    "reduction_ratio" numeric(5,4) not null default 0.75,
    "total_benefit" numeric(12,2) not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."convertible_tax_bonds_details" enable row level security;

create table "public"."cost_segregation_details" (
    "id" uuid not null default gen_random_uuid(),
    "strategy_detail_id" uuid not null,
    "property_value" numeric(12,2) not null default 0,
    "land_value" numeric(12,2) not null default 0,
    "improvement_value" numeric(12,2) not null default 0,
    "bonus_depreciation_rate" numeric(5,4) not null default 0.8,
    "year_acquired" integer not null default 2024,
    "current_year_deduction" numeric(12,2) not null default 0,
    "years_2_to_5_annual" numeric(12,2) not null default 0,
    "total_savings" numeric(12,2) not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."cost_segregation_details" enable row level security;

create table "public"."employees" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid,
    "name" text,
    "role" text,
    "salary" numeric,
    "created_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."employees" enable row level security;

create table "public"."experts" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "email" text not null,
    "phone" text,
    "company" text,
    "specialties" text[] default '{}'::text[],
    "current_workload" integer default 0,
    "max_capacity" integer default 10,
    "commission_rate" numeric(5,4) default 0.10,
    "is_active" boolean default true,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."family_management_company_details" (
    "id" uuid not null default gen_random_uuid(),
    "strategy_detail_id" uuid not null,
    "members" jsonb not null default '[]'::jsonb,
    "total_salaries" numeric(12,2) not null default 0,
    "state_benefit" numeric(12,2) not null default 0,
    "federal_benefit" numeric(12,2) not null default 0,
    "fica_benefit" numeric(12,2) not null default 0,
    "total_benefit" numeric(12,2) not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."family_management_company_details" enable row level security;

create table "public"."hire_children_details" (
    "id" uuid not null default gen_random_uuid(),
    "strategy_detail_id" uuid not null,
    "children" jsonb not null default '[]'::jsonb,
    "total_salaries" numeric(12,2) not null default 0,
    "state_benefit" numeric(12,2) not null default 0,
    "federal_benefit" numeric(12,2) not null default 0,
    "fica_benefit" numeric(12,2) not null default 0,
    "total_benefit" numeric(12,2) not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."hire_children_details" enable row level security;

create table "public"."leads" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "name" text not null,
    "email" text,
    "phone" text,
    "status" text default 'new'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."personal_years" (
    "id" uuid not null default uuid_generate_v4(),
    "client_id" uuid not null,
    "year" integer not null,
    "wages_income" numeric(12,2) default 0,
    "passive_income" numeric(12,2) default 0,
    "unearned_income" numeric(12,2) default 0,
    "capital_gains" numeric(12,2) default 0,
    "long_term_capital_gains" numeric(12,2) default 0,
    "household_income" numeric(12,2) default 0,
    "ordinary_income" numeric(12,2) default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."personal_years" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "role" text default 'user'::text,
    "is_admin" boolean default false,
    "has_completed_tax_profile" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."profiles" enable row level security;

create table "public"."proposal_assignments" (
    "id" uuid not null default uuid_generate_v4(),
    "proposal_id" uuid not null,
    "expert_id" uuid,
    "assigned_by" uuid,
    "assigned_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "submitted_to_expert_at" timestamp with time zone,
    "expert_response_at" timestamp with time zone,
    "expert_status" text default 'assigned'::text,
    "notes" text,
    "priority" text default 'medium'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."proposal_timeline" (
    "id" uuid not null default uuid_generate_v4(),
    "proposal_id" uuid not null,
    "status_from" text,
    "status_to" text not null,
    "changed_by" uuid,
    "changed_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "notes" text,
    "metadata" jsonb default '{}'::jsonb
);


create table "public"."rd_areas" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "category_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."rd_business_years" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "year" integer not null,
    "gross_receipts" numeric(15,2) not null,
    "total_qre" numeric(15,2) default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."rd_businesses" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "name" text not null,
    "ein" text not null,
    "entity_type" entity_type not null,
    "start_year" integer not null,
    "domicile_state" text not null,
    "contact_info" jsonb not null,
    "is_controlled_grp" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "historical_data" jsonb not null default '[]'::jsonb
);


create table "public"."rd_contractor_subcomponents" (
    "id" uuid not null default gen_random_uuid(),
    "contractor_id" uuid not null,
    "subcomponent_id" uuid not null,
    "business_year_id" uuid not null,
    "time_percentage" numeric(5,2) not null default 0,
    "applied_percentage" numeric(5,2) not null default 0,
    "is_included" boolean not null default true,
    "baseline_applied_percent" numeric(5,2) not null default 0,
    "practice_percentage" numeric(5,2),
    "year_percentage" numeric(5,2),
    "frequency_percentage" numeric(5,2),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid,
    "baseline_practice_percentage" numeric,
    "baseline_time_percentage" numeric
);


create table "public"."rd_contractor_year_data" (
    "id" uuid not null default gen_random_uuid(),
    "business_year_id" uuid not null,
    "name" text not null,
    "cost_amount" numeric(15,2) not null,
    "applied_percent" numeric(5,2) not null,
    "activity_link" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "contractor_id" uuid,
    "user_id" uuid,
    "activity_roles" jsonb,
    "calculated_qre" numeric
);


alter table "public"."rd_contractor_year_data" enable row level security;

create table "public"."rd_contractors" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "name" text not null,
    "role" text,
    "annual_cost" numeric(10,2) not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid,
    "first_name" text,
    "last_name" text,
    "role_id" uuid,
    "is_owner" boolean default false,
    "amount" numeric(15,2),
    "calculated_qre" numeric(15,2)
);


alter table "public"."rd_contractors" enable row level security;

create table "public"."rd_employee_subcomponents" (
    "id" uuid not null default gen_random_uuid(),
    "employee_id" uuid not null,
    "subcomponent_id" uuid not null,
    "business_year_id" uuid not null,
    "time_percentage" numeric(5,2) not null default 0,
    "applied_percentage" numeric(5,2) not null default 0,
    "is_included" boolean not null default true,
    "baseline_applied_percent" numeric(5,2) not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "practice_percentage" numeric,
    "year_percentage" numeric,
    "frequency_percentage" numeric,
    "baseline_practice_percentage" numeric,
    "baseline_time_percentage" numeric,
    "user_id" uuid
);


alter table "public"."rd_employee_subcomponents" enable row level security;

create table "public"."rd_employee_year_data" (
    "id" uuid not null default gen_random_uuid(),
    "employee_id" uuid not null,
    "business_year_id" uuid not null,
    "applied_percent" numeric(5,2) not null,
    "calculated_qre" numeric(15,2) not null,
    "activity_roles" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid
);


create table "public"."rd_employees" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "first_name" text not null,
    "role_id" uuid not null,
    "is_owner" boolean default false,
    "annual_wage" numeric(15,2) not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "last_name" text,
    "user_id" uuid
);


create table "public"."rd_expenses" (
    "id" uuid not null default gen_random_uuid(),
    "business_year_id" uuid not null,
    "research_activity_id" uuid not null,
    "step_id" uuid not null,
    "subcomponent_id" uuid not null,
    "employee_id" uuid,
    "contractor_id" uuid,
    "supply_id" uuid,
    "category" text not null,
    "first_name" text,
    "last_name" text,
    "role_name" text,
    "supply_name" text,
    "research_activity_title" text not null,
    "research_activity_practice_percent" numeric(5,2) not null,
    "step_name" text not null,
    "subcomponent_title" text not null,
    "subcomponent_year_percent" numeric(5,2) not null,
    "subcomponent_frequency_percent" numeric(5,2) not null,
    "subcomponent_time_percent" numeric(5,2) not null,
    "total_cost" numeric(10,2) not null,
    "applied_percent" numeric(5,2) not null,
    "baseline_applied_percent" numeric(5,2) not null,
    "employee_practice_percent" numeric(5,2),
    "employee_time_percent" numeric(5,2),
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."rd_expenses" enable row level security;

create table "public"."rd_federal_credit_results" (
    "id" uuid not null default gen_random_uuid(),
    "business_year_id" uuid not null,
    "standard_credit" numeric(15,2),
    "standard_adjusted_credit" numeric(15,2),
    "standard_base_percentage" numeric(5,4),
    "standard_fixed_base_amount" numeric(15,2),
    "standard_incremental_qre" numeric(15,2),
    "standard_is_eligible" boolean default false,
    "standard_missing_data" jsonb,
    "asc_credit" numeric(15,2),
    "asc_adjusted_credit" numeric(15,2),
    "asc_avg_prior_qre" numeric(15,2),
    "asc_incremental_qre" numeric(15,2),
    "asc_is_startup" boolean default false,
    "asc_missing_data" jsonb,
    "selected_method" text,
    "use_280c" boolean default false,
    "corporate_tax_rate" numeric(5,4) default 0.21,
    "total_federal_credit" numeric(15,2),
    "total_state_credits" numeric(15,2),
    "total_credits" numeric(15,2),
    "calculation_date" timestamp with time zone default now(),
    "qre_breakdown" jsonb,
    "historical_data" jsonb,
    "state_credits" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."rd_federal_credit_results" enable row level security;

create table "public"."rd_focuses" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "area_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."rd_reports" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid,
    "business_year_id" uuid,
    "type" rd_report_type not null,
    "generated_text" text not null,
    "editable_text" text,
    "ai_version" text not null,
    "locked" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."rd_research_activities" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "focus_id" uuid not null,
    "is_active" boolean default true,
    "default_roles" jsonb not null,
    "default_steps" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "focus" text,
    "category" text,
    "area" text,
    "research_activity" text,
    "subcomponent" text,
    "phase" text,
    "step" text
);


create table "public"."rd_research_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."rd_research_raw" (
    "id" uuid not null default gen_random_uuid(),
    "category" text,
    "area" text,
    "focus" text,
    "research_activity" text,
    "subcomponent" text,
    "phase" text,
    "step" text,
    "hint" text,
    "general_description" text,
    "goal" text,
    "hypothesis" text,
    "alternatives" text,
    "uncertainties" text,
    "developmental_process" text,
    "primary_goal" text,
    "expected_outcome_type" text,
    "cpt_codes" text,
    "cdt_codes" text,
    "alternative_paths" text,
    "uploaded_at" timestamp with time zone default now()
);


create table "public"."rd_research_steps" (
    "id" uuid not null default gen_random_uuid(),
    "research_activity_id" uuid not null,
    "name" character varying(255) not null,
    "description" text,
    "step_order" integer not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."rd_research_steps" enable row level security;

create table "public"."rd_research_subcomponents" (
    "id" uuid not null default gen_random_uuid(),
    "step_id" uuid not null,
    "name" character varying(255) not null,
    "description" text,
    "subcomponent_order" integer not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "hint" text,
    "general_description" text,
    "goal" text,
    "hypothesis" text,
    "alternatives" text,
    "uncertainties" text,
    "developmental_process" text,
    "primary_goal" text,
    "expected_outcome_type" text,
    "cpt_codes" text,
    "cdt_codes" text,
    "alternative_paths" text
);


alter table "public"."rd_research_subcomponents" enable row level security;

create table "public"."rd_roles" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "name" text not null,
    "parent_id" uuid,
    "is_default" boolean default false,
    "business_year_id" uuid,
    "baseline_applied_percent" numeric
);


create table "public"."rd_selected_activities" (
    "id" uuid not null default gen_random_uuid(),
    "business_year_id" uuid not null,
    "activity_id" uuid not null,
    "practice_percent" numeric(5,2) not null,
    "selected_roles" jsonb not null,
    "config" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "research_guidelines" jsonb
);


create table "public"."rd_selected_filter" (
    "id" uuid not null default gen_random_uuid(),
    "business_year_id" uuid not null,
    "selected_categories" text[] default '{}'::text[],
    "selected_areas" text[] default '{}'::text[],
    "selected_focuses" text[] default '{}'::text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."rd_selected_filter" enable row level security;

create table "public"."rd_selected_steps" (
    "id" uuid not null default gen_random_uuid(),
    "business_year_id" uuid not null,
    "research_activity_id" uuid not null,
    "step_id" uuid not null,
    "time_percentage" numeric(5,2) not null default 0,
    "applied_percentage" numeric(5,2) not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."rd_selected_steps" enable row level security;

create table "public"."rd_selected_subcomponents" (
    "id" uuid not null default gen_random_uuid(),
    "business_year_id" uuid not null,
    "research_activity_id" uuid not null,
    "step_id" uuid not null,
    "subcomponent_id" uuid not null,
    "frequency_percentage" numeric(5,2) not null default 0,
    "year_percentage" numeric(5,2) not null default 0,
    "start_month" integer not null default 1,
    "start_year" integer not null,
    "selected_roles" jsonb not null default '[]'::jsonb,
    "non_rd_percentage" numeric(5,2) not null default 0,
    "approval_data" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "hint" text,
    "general_description" text,
    "goal" text,
    "hypothesis" text,
    "alternatives" text,
    "uncertainties" text,
    "developmental_process" text,
    "primary_goal" text,
    "expected_outcome_type" text,
    "cpt_codes" text,
    "cdt_codes" text,
    "alternative_paths" text,
    "applied_percentage" numeric,
    "time_percentage" numeric,
    "user_notes" text,
    "step_name" text,
    "practice_percentage" numeric
);


create table "public"."rd_state_calculations" (
    "id" uuid not null default gen_random_uuid(),
    "state" character varying(2) not null,
    "calculation_method" text not null,
    "refundable" text,
    "carryforward" text,
    "eligible_entities" text[],
    "calculation_formula" text not null,
    "special_notes" text,
    "start_year" numeric not null,
    "end_year" numeric,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "formula_correct" text
);


create table "public"."rd_subcomponents" (
    "id" uuid not null default gen_random_uuid(),
    "activity_id" uuid not null,
    "title" text not null,
    "phase" text not null,
    "step" text,
    "hint" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "general_description" text,
    "goal" text,
    "hypothesis" text,
    "alternatives" text,
    "uncertainties" text,
    "developmental_process" text,
    "primary_goal" text,
    "expected_outcome_type" text,
    "cpt_codes" text,
    "cdt_codes" text,
    "alternative_paths" text
);


create table "public"."rd_supplies" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "name" text not null,
    "description" text,
    "annual_cost" numeric(10,2) not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."rd_supplies" enable row level security;

create table "public"."rd_supply_subcomponents" (
    "id" uuid not null default gen_random_uuid(),
    "supply_id" uuid not null,
    "subcomponent_id" uuid not null,
    "business_year_id" uuid not null,
    "applied_percentage" numeric(5,2) not null default 0,
    "is_included" boolean not null default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "amount_applied" numeric
);


create table "public"."rd_supply_year_data" (
    "id" uuid not null default gen_random_uuid(),
    "business_year_id" uuid not null,
    "name" text not null,
    "cost_amount" numeric(15,2) not null,
    "applied_percent" numeric(5,2) not null,
    "activity_link" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "supply_id" uuid,
    "calculated_qre" numeric(15,2)
);


create table "public"."reinsurance_details" (
    "id" uuid not null default gen_random_uuid(),
    "strategy_detail_id" uuid not null,
    "user_contribution" numeric(12,2) not null default 0,
    "agi_reduction" numeric(12,2) not null default 0,
    "federal_tax_benefit" numeric(12,2) not null default 0,
    "state_tax_benefit" numeric(12,2) not null default 0,
    "total_tax_savings" numeric(12,2) not null default 0,
    "net_year1_cost" numeric(12,2) not null default 0,
    "breakeven_years" numeric(5,2) not null default 0,
    "future_value" numeric(12,2) not null default 0,
    "capital_gains_tax" numeric(12,2) not null default 0,
    "setup_admin_cost" numeric(12,2) not null default 0,
    "total_benefit" numeric(12,2) not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."reinsurance_details" enable row level security;

create table "public"."research_activities" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid,
    "name" text,
    "description" text,
    "created_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."research_activities" enable row level security;

create table "public"."strategy_commission_rates" (
    "id" uuid not null default uuid_generate_v4(),
    "affiliate_id" uuid,
    "strategy_name" text not null,
    "affiliate_rate" numeric(5,4) not null,
    "admin_rate" numeric(5,4) not null,
    "expert_fee_percentage" numeric(5,4),
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."strategy_details" (
    "id" uuid not null default gen_random_uuid(),
    "proposal_id" uuid not null,
    "strategy_id" text not null,
    "strategy_name" text not null,
    "strategy_category" text not null,
    "details" jsonb not null default '{}'::jsonb,
    "estimated_savings" numeric(12,2) not null default 0,
    "enabled" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."strategy_details" enable row level security;

create table "public"."supply_expenses" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid,
    "item_name" text,
    "amount" numeric,
    "description" text,
    "created_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."supply_expenses" enable row level security;

create table "public"."tax_estimates" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "data" jsonb not null,
    "updated_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


create table "public"."tax_profiles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "standard_deduction" boolean default false,
    "business_owner" boolean default false,
    "full_name" text,
    "email" text,
    "filing_status" text,
    "dependents" integer default 0,
    "home_address" text,
    "state" text,
    "wages_income" numeric default 0,
    "passive_income" numeric default 0,
    "unearned_income" numeric default 0,
    "capital_gains" numeric default 0,
    "custom_deduction" numeric default 0,
    "charitable_deduction" numeric default 0,
    "business_name" text,
    "entity_type" text,
    "ordinary_k1_income" numeric default 0,
    "guaranteed_k1_income" numeric default 0,
    "business_address" text,
    "deduction_limit_reached" boolean default false,
    "household_income" numeric default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "phone" text
);


alter table "public"."tax_profiles" enable row level security;

create table "public"."tax_proposals" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "affiliate_id" text,
    "client_id" text,
    "client_name" text,
    "year" integer not null,
    "tax_info" jsonb not null,
    "proposed_strategies" jsonb not null default '[]'::jsonb,
    "total_savings" numeric(12,2) not null default 0,
    "status" text not null default 'draft'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."tool_enrollments" (
    "id" uuid not null default gen_random_uuid(),
    "client_file_id" uuid not null,
    "business_id" uuid not null,
    "tool_slug" text not null,
    "enrolled_by" uuid,
    "enrolled_at" timestamp with time zone default now(),
    "status" text default 'active'::text,
    "notes" text
);


alter table "public"."tool_enrollments" enable row level security;

create table "public"."user_preferences" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "theme" text default 'light'::text,
    "notifications_enabled" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "name" text not null,
    "role_type" role_type not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX admin_client_files_pkey ON public.admin_client_files USING btree (id);

CREATE UNIQUE INDEX augusta_rule_details_pkey ON public.augusta_rule_details USING btree (id);

CREATE UNIQUE INDEX business_years_business_id_year_key ON public.business_years USING btree (business_id, year);

CREATE UNIQUE INDEX business_years_pkey ON public.business_years USING btree (id);

CREATE UNIQUE INDEX businesses_pkey ON public.businesses USING btree (id);

CREATE UNIQUE INDEX calculations_pkey ON public.calculations USING btree (id);

CREATE UNIQUE INDEX centralized_businesses_pkey ON public.centralized_businesses USING btree (id);

CREATE UNIQUE INDEX charitable_donation_details_pkey ON public.charitable_donation_details USING btree (id);

CREATE UNIQUE INDEX clients_email_key ON public.clients USING btree (email);

CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (id);

CREATE UNIQUE INDEX commission_transactions_pkey ON public.commission_transactions USING btree (id);

CREATE UNIQUE INDEX contractor_expenses_pkey ON public.contractor_expenses USING btree (id);

CREATE UNIQUE INDEX convertible_tax_bonds_details_pkey ON public.convertible_tax_bonds_details USING btree (id);

CREATE UNIQUE INDEX cost_segregation_details_pkey ON public.cost_segregation_details USING btree (id);

CREATE UNIQUE INDEX employees_pkey ON public.employees USING btree (id);

CREATE UNIQUE INDEX experts_email_key ON public.experts USING btree (email);

CREATE UNIQUE INDEX experts_pkey ON public.experts USING btree (id);

CREATE UNIQUE INDEX family_management_company_details_pkey ON public.family_management_company_details USING btree (id);

CREATE UNIQUE INDEX hire_children_details_pkey ON public.hire_children_details USING btree (id);

CREATE INDEX idx_admin_client_files_admin_id ON public.admin_client_files USING btree (admin_id);

CREATE INDEX idx_admin_client_files_affiliate_id ON public.admin_client_files USING btree (affiliate_id);

CREATE INDEX idx_admin_client_files_archived ON public.admin_client_files USING btree (archived);

CREATE INDEX idx_admin_client_files_business_id ON public.admin_client_files USING btree (business_id);

CREATE INDEX idx_admin_client_files_created_at ON public.admin_client_files USING btree (created_at);

CREATE INDEX idx_admin_client_files_email ON public.admin_client_files USING btree (email);

CREATE INDEX idx_augusta_rule_details_strategy_detail_id ON public.augusta_rule_details USING btree (strategy_detail_id);

CREATE INDEX idx_business_years_business_id ON public.business_years USING btree (business_id);

CREATE INDEX idx_business_years_year ON public.business_years USING btree (year);

CREATE INDEX idx_businesses_client_id ON public.businesses USING btree (client_id);

CREATE INDEX idx_businesses_entity_type ON public.businesses USING btree (entity_type);

CREATE INDEX idx_businesses_is_active ON public.businesses USING btree (is_active);

CREATE INDEX idx_centralized_businesses_created_at ON public.centralized_businesses USING btree (created_at);

CREATE INDEX idx_charitable_donation_details_strategy_detail_id ON public.charitable_donation_details USING btree (strategy_detail_id);

CREATE INDEX idx_clients_archived ON public.clients USING btree (archived);

CREATE INDEX idx_clients_city ON public.clients USING btree (city);

CREATE INDEX idx_clients_created_at ON public.clients USING btree (created_at);

CREATE INDEX idx_clients_created_by ON public.clients USING btree (created_by);

CREATE INDEX idx_clients_email ON public.clients USING btree (email);

CREATE INDEX idx_clients_zip_code ON public.clients USING btree (zip_code);

CREATE INDEX idx_convertible_tax_bonds_details_strategy_detail_id ON public.convertible_tax_bonds_details USING btree (strategy_detail_id);

CREATE INDEX idx_cost_segregation_details_strategy_detail_id ON public.cost_segregation_details USING btree (strategy_detail_id);

CREATE INDEX idx_family_management_company_details_strategy_detail_id ON public.family_management_company_details USING btree (strategy_detail_id);

CREATE INDEX idx_hire_children_details_strategy_detail_id ON public.hire_children_details USING btree (strategy_detail_id);

CREATE INDEX idx_personal_years_client_id ON public.personal_years USING btree (client_id);

CREATE INDEX idx_personal_years_year ON public.personal_years USING btree (year);

CREATE INDEX idx_rd_business_years_business_year ON public.rd_business_years USING btree (business_id, year);

CREATE INDEX idx_rd_businesses_historical_data ON public.rd_businesses USING gin (historical_data);

CREATE INDEX idx_rd_contractor_subcomponents_business_year_id ON public.rd_contractor_subcomponents USING btree (business_year_id);

CREATE INDEX idx_rd_contractor_subcomponents_contractor_id ON public.rd_contractor_subcomponents USING btree (contractor_id);

CREATE INDEX idx_rd_contractor_subcomponents_subcomponent_id ON public.rd_contractor_subcomponents USING btree (subcomponent_id);

CREATE INDEX idx_rd_contractor_subcomponents_user_id ON public.rd_contractor_subcomponents USING btree (user_id);

CREATE INDEX idx_rd_contractor_year_data_business_year_id ON public.rd_contractor_year_data USING btree (business_year_id);

CREATE INDEX idx_rd_contractor_year_data_contractor_id ON public.rd_contractor_year_data USING btree (contractor_id);

CREATE INDEX idx_rd_contractor_year_data_user_id ON public.rd_contractor_year_data USING btree (user_id);

CREATE INDEX idx_rd_contractors_business_id ON public.rd_contractors USING btree (business_id);

CREATE INDEX idx_rd_contractors_role_id ON public.rd_contractors USING btree (role_id);

CREATE INDEX idx_rd_contractors_user_id ON public.rd_contractors USING btree (user_id);

CREATE INDEX idx_rd_employee_subcomponents_employee_id ON public.rd_employee_subcomponents USING btree (employee_id);

CREATE INDEX idx_rd_employee_subcomponents_subcomponent_id ON public.rd_employee_subcomponents USING btree (subcomponent_id);

CREATE INDEX idx_rd_employee_subcomponents_user_id ON public.rd_employee_subcomponents USING btree (user_id);

CREATE INDEX idx_rd_employee_year_data_employee_year ON public.rd_employee_year_data USING btree (employee_id, business_year_id);

CREATE INDEX idx_rd_employee_year_data_user_id ON public.rd_employee_year_data USING btree (user_id);

CREATE INDEX idx_rd_employees_user_id ON public.rd_employees USING btree (user_id);

CREATE INDEX idx_rd_expenses_business_year_id ON public.rd_expenses USING btree (business_year_id);

CREATE INDEX idx_rd_expenses_category ON public.rd_expenses USING btree (category);

CREATE INDEX idx_rd_expenses_employee_id ON public.rd_expenses USING btree (employee_id);

CREATE INDEX idx_rd_federal_credit_results_business_year_id ON public.rd_federal_credit_results USING btree (business_year_id);

CREATE INDEX idx_rd_federal_credit_results_calculation_date ON public.rd_federal_credit_results USING btree (calculation_date);

CREATE INDEX idx_rd_reports_business_year_type ON public.rd_reports USING btree (business_year_id, type);

CREATE INDEX idx_rd_research_steps_activity_id ON public.rd_research_steps USING btree (research_activity_id);

CREATE INDEX idx_rd_research_subcomponents_step_id ON public.rd_research_subcomponents USING btree (step_id);

CREATE INDEX idx_rd_roles_business_year_id ON public.rd_roles USING btree (business_year_id);

CREATE INDEX idx_rd_roles_is_default ON public.rd_roles USING btree (is_default);

CREATE UNIQUE INDEX idx_rd_roles_unique_default_per_year ON public.rd_roles USING btree (business_year_id, is_default) WHERE (is_default = true);

CREATE INDEX idx_rd_selected_activities_business_year_activity ON public.rd_selected_activities USING btree (business_year_id, activity_id);

CREATE INDEX idx_rd_selected_steps_activity ON public.rd_selected_steps USING btree (research_activity_id);

CREATE INDEX idx_rd_selected_steps_business_year ON public.rd_selected_steps USING btree (business_year_id);

CREATE INDEX idx_rd_selected_subcomponents_activity ON public.rd_selected_subcomponents USING btree (research_activity_id);

CREATE INDEX idx_rd_selected_subcomponents_business_year ON public.rd_selected_subcomponents USING btree (business_year_id);

CREATE INDEX idx_rd_selected_subcomponents_step ON public.rd_selected_subcomponents USING btree (step_id);

CREATE INDEX idx_rd_supplies_business_id ON public.rd_supplies USING btree (business_id);

CREATE INDEX idx_rd_supply_subcomponents_business_year_id ON public.rd_supply_subcomponents USING btree (business_year_id);

CREATE INDEX idx_rd_supply_subcomponents_subcomponent_id ON public.rd_supply_subcomponents USING btree (subcomponent_id);

CREATE INDEX idx_rd_supply_subcomponents_supply_id ON public.rd_supply_subcomponents USING btree (supply_id);

CREATE INDEX idx_reinsurance_details_strategy_detail_id ON public.reinsurance_details USING btree (strategy_detail_id);

CREATE INDEX idx_state_calculations_active ON public.rd_state_calculations USING btree (is_active);

CREATE INDEX idx_state_calculations_state ON public.rd_state_calculations USING btree (state);

CREATE UNIQUE INDEX idx_state_calculations_unique ON public.rd_state_calculations USING btree (state, start_year) WHERE (is_active = true);

CREATE INDEX idx_state_calculations_year ON public.rd_state_calculations USING btree (start_year, end_year);

CREATE INDEX idx_strategy_details_proposal_id ON public.strategy_details USING btree (proposal_id);

CREATE INDEX idx_strategy_details_strategy_id ON public.strategy_details USING btree (strategy_id);

CREATE INDEX idx_tax_proposals_affiliate_id ON public.tax_proposals USING btree (affiliate_id);

CREATE INDEX idx_tax_proposals_status ON public.tax_proposals USING btree (status);

CREATE INDEX idx_tax_proposals_user_id ON public.tax_proposals USING btree (user_id);

CREATE INDEX idx_tool_enrollments_business_id ON public.tool_enrollments USING btree (business_id);

CREATE INDEX idx_tool_enrollments_client_file_id ON public.tool_enrollments USING btree (client_file_id);

CREATE INDEX idx_tool_enrollments_status ON public.tool_enrollments USING btree (status);

CREATE INDEX idx_tool_enrollments_tool_slug ON public.tool_enrollments USING btree (tool_slug);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

CREATE INDEX leads_user_id_idx ON public.leads USING btree (user_id);

CREATE UNIQUE INDEX personal_years_client_id_year_key ON public.personal_years USING btree (client_id, year);

CREATE UNIQUE INDEX personal_years_pkey ON public.personal_years USING btree (id);

CREATE INDEX profiles_created_at_idx ON public.profiles USING btree (created_at);

CREATE INDEX profiles_email_idx ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX profiles_updated_at_idx ON public.profiles USING btree (updated_at);

CREATE UNIQUE INDEX proposal_assignments_pkey ON public.proposal_assignments USING btree (id);

CREATE UNIQUE INDEX proposal_timeline_pkey ON public.proposal_timeline USING btree (id);

CREATE UNIQUE INDEX rd_areas_pkey ON public.rd_areas USING btree (id);

CREATE UNIQUE INDEX rd_business_years_pkey ON public.rd_business_years USING btree (id);

CREATE UNIQUE INDEX rd_businesses_pkey ON public.rd_businesses USING btree (id);

CREATE UNIQUE INDEX rd_contractor_subcomponents_pkey ON public.rd_contractor_subcomponents USING btree (id);

CREATE UNIQUE INDEX rd_contractor_subcomponents_unique ON public.rd_contractor_subcomponents USING btree (contractor_id, subcomponent_id, business_year_id);

CREATE UNIQUE INDEX rd_contractor_year_data_pkey ON public.rd_contractor_year_data USING btree (id);

CREATE UNIQUE INDEX rd_contractors_pkey ON public.rd_contractors USING btree (id);

CREATE UNIQUE INDEX rd_employee_subcomponents_pkey ON public.rd_employee_subcomponents USING btree (id);

CREATE UNIQUE INDEX rd_employee_subcomponents_unique ON public.rd_employee_subcomponents USING btree (employee_id, subcomponent_id, business_year_id);

CREATE UNIQUE INDEX rd_employee_year_data_pkey ON public.rd_employee_year_data USING btree (id);

CREATE UNIQUE INDEX rd_employees_pkey ON public.rd_employees USING btree (id);

CREATE UNIQUE INDEX rd_expenses_pkey ON public.rd_expenses USING btree (id);

CREATE UNIQUE INDEX rd_federal_credit_results_pkey ON public.rd_federal_credit_results USING btree (id);

CREATE UNIQUE INDEX rd_federal_credit_results_unique ON public.rd_federal_credit_results USING btree (business_year_id);

CREATE UNIQUE INDEX rd_focuses_pkey ON public.rd_focuses USING btree (id);

CREATE UNIQUE INDEX rd_reports_pkey ON public.rd_reports USING btree (id);

CREATE UNIQUE INDEX rd_research_activities_pkey ON public.rd_research_activities USING btree (id);

CREATE UNIQUE INDEX rd_research_categories_name_key ON public.rd_research_categories USING btree (name);

CREATE UNIQUE INDEX rd_research_categories_pkey ON public.rd_research_categories USING btree (id);

CREATE UNIQUE INDEX rd_research_raw_pkey ON public.rd_research_raw USING btree (id);

CREATE UNIQUE INDEX rd_research_steps_pkey ON public.rd_research_steps USING btree (id);

CREATE UNIQUE INDEX rd_research_subcomponents_pkey ON public.rd_research_subcomponents USING btree (id);

CREATE UNIQUE INDEX rd_roles_pkey ON public.rd_roles USING btree (id);

CREATE UNIQUE INDEX rd_selected_activities_pkey ON public.rd_selected_activities USING btree (id);

CREATE UNIQUE INDEX rd_selected_filter_business_year_id_key ON public.rd_selected_filter USING btree (business_year_id);

CREATE UNIQUE INDEX rd_selected_filter_pkey ON public.rd_selected_filter USING btree (id);

CREATE UNIQUE INDEX rd_selected_steps_business_year_id_step_id_key ON public.rd_selected_steps USING btree (business_year_id, step_id);

CREATE UNIQUE INDEX rd_selected_steps_pkey ON public.rd_selected_steps USING btree (id);

CREATE UNIQUE INDEX rd_selected_subcomponents_business_year_id_subcomponent_id_key ON public.rd_selected_subcomponents USING btree (business_year_id, subcomponent_id);

CREATE UNIQUE INDEX rd_selected_subcomponents_pkey ON public.rd_selected_subcomponents USING btree (id);

CREATE UNIQUE INDEX rd_state_calculations_pkey ON public.rd_state_calculations USING btree (id);

CREATE UNIQUE INDEX rd_subcomponents_pkey ON public.rd_subcomponents USING btree (id);

CREATE UNIQUE INDEX rd_supplies_pkey ON public.rd_supplies USING btree (id);

CREATE UNIQUE INDEX rd_supply_subcomponents_pkey ON public.rd_supply_subcomponents USING btree (id);

CREATE UNIQUE INDEX rd_supply_subcomponents_unique ON public.rd_supply_subcomponents USING btree (supply_id, subcomponent_id, business_year_id);

CREATE UNIQUE INDEX rd_supply_year_data_pkey ON public.rd_supply_year_data USING btree (id);

CREATE UNIQUE INDEX reinsurance_details_pkey ON public.reinsurance_details USING btree (id);

CREATE UNIQUE INDEX research_activities_pkey ON public.research_activities USING btree (id);

CREATE UNIQUE INDEX strategy_commission_rates_pkey ON public.strategy_commission_rates USING btree (id);

CREATE UNIQUE INDEX strategy_details_pkey ON public.strategy_details USING btree (id);

CREATE UNIQUE INDEX strategy_details_proposal_id_strategy_id_key ON public.strategy_details USING btree (proposal_id, strategy_id);

CREATE UNIQUE INDEX supply_expenses_pkey ON public.supply_expenses USING btree (id);

CREATE INDEX tax_calculations_user_id_idx ON public.tax_calculations USING btree (user_id);

CREATE INDEX tax_calculations_year_idx ON public.tax_calculations USING btree (year);

CREATE UNIQUE INDEX tax_estimates_pkey ON public.tax_estimates USING btree (id);

CREATE UNIQUE INDEX tax_profiles_pkey ON public.tax_profiles USING btree (user_id);

CREATE INDEX tax_profiles_user_id_idx ON public.tax_profiles USING btree (user_id);

CREATE UNIQUE INDEX tax_proposals_pkey ON public.tax_proposals USING btree (id);

CREATE UNIQUE INDEX tool_enrollments_client_file_id_business_id_tool_slug_key ON public.tool_enrollments USING btree (client_file_id, business_id, tool_slug);

CREATE UNIQUE INDEX tool_enrollments_pkey ON public.tool_enrollments USING btree (id);

CREATE UNIQUE INDEX unique_activity_per_focus ON public.rd_research_activities USING btree (title, focus_id);

CREATE UNIQUE INDEX unique_area_name_per_category ON public.rd_areas USING btree (name, category_id);

CREATE UNIQUE INDEX unique_category_name ON public.rd_research_categories USING btree (name);

CREATE UNIQUE INDEX unique_focus_name_per_area ON public.rd_focuses USING btree (name, area_id);

CREATE UNIQUE INDEX unique_tax_estimate_per_user ON public.tax_estimates USING btree (user_id);

CREATE UNIQUE INDEX unique_user_id ON public.tax_profiles USING btree (user_id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE INDEX user_preferences_user_id_idx ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_business_year(p_business_id uuid, p_year integer, p_is_active boolean DEFAULT true, p_ordinary_k1_income numeric DEFAULT 0, p_guaranteed_k1_income numeric DEFAULT 0, p_annual_revenue numeric DEFAULT 0, p_employee_count integer DEFAULT 0)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_year_id UUID;
BEGIN
  INSERT INTO business_years (
    business_id,
    year,
    is_active,
    ordinary_k1_income,
    guaranteed_k1_income,
    annual_revenue,
    employee_count
  ) VALUES (
    p_business_id,
    p_year,
    p_is_active,
    p_ordinary_k1_income,
    p_guaranteed_k1_income,
    p_annual_revenue,
    p_employee_count
  ) RETURNING id INTO v_year_id;
  
  RETURN v_year_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.archive_client(p_client_id uuid, p_archive boolean)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE clients 
    SET 
        archived = p_archive,
        archived_at = CASE WHEN p_archive THEN NOW() ELSE NULL END
    WHERE id = p_client_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_base_amount(business_id uuid, tax_year integer)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  business_record RECORD;
  base_period_years INTEGER[];
  total_gross_receipts NUMERIC := 0;
  total_qre NUMERIC := 0;
  year_count INTEGER := 0;
  year INTEGER;
  historical_item JSONB;
BEGIN
  -- Get business record
  SELECT * INTO business_record 
  FROM rd_businesses 
  WHERE id = business_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Get base period years
  base_period_years := get_base_period_years(business_record.start_year, tax_year);
  
  -- Calculate averages from historical data
  FOREACH year IN ARRAY base_period_years LOOP
    -- Find historical data for this year
    FOR historical_item IN SELECT jsonb_array_elements(business_record.historical_data) LOOP
      IF (historical_item->>'year')::INTEGER = year THEN
        total_gross_receipts := total_gross_receipts + (historical_item->>'gross_receipts')::NUMERIC;
        total_qre := total_qre + (historical_item->>'qre')::NUMERIC;
        year_count := year_count + 1;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Return average QRE if we have data, otherwise 0
  IF year_count > 0 THEN
    RETURN total_qre / year_count;
  ELSE
    RETURN 0;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_household_income(p_user_id uuid, p_year integer)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    personal_total DECIMAL(12,2) := 0;
    business_total DECIMAL(12,2) := 0;
BEGIN
    -- Get personal income for the year
    SELECT COALESCE(total_income, 0) INTO personal_total
    FROM personal_years
    WHERE user_id = p_user_id AND year = p_year;
    
    -- Get business income for the year
    SELECT COALESCE(total_business_income, 0) INTO business_total
    FROM business_years
    WHERE user_id = p_user_id AND year = p_year;
    
    RETURN COALESCE(personal_total, 0) + COALESCE(business_total, 0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_business_with_enrollment(p_business_name text, p_entity_type text, p_client_file_id uuid, p_tool_slug text, p_ein text DEFAULT NULL::text, p_business_address text DEFAULT NULL::text, p_business_city text DEFAULT NULL::text, p_business_state text DEFAULT NULL::text, p_business_zip text DEFAULT NULL::text, p_business_phone text DEFAULT NULL::text, p_business_email text DEFAULT NULL::text, p_industry text DEFAULT NULL::text, p_year_established integer DEFAULT NULL::integer, p_annual_revenue numeric DEFAULT NULL::numeric, p_employee_count integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_business_id UUID;
BEGIN
    -- Insert business
    INSERT INTO public.centralized_businesses (
        business_name,
        entity_type,
        ein,
        business_address,
        business_city,
        business_state,
        business_zip,
        business_phone,
        business_email,
        industry,
        year_established,
        annual_revenue,
        employee_count,
        created_by
    ) VALUES (
        p_business_name,
        p_entity_type,
        p_ein,
        p_business_address,
        p_business_city,
        p_business_state,
        p_business_zip,
        p_business_phone,
        p_business_email,
        p_industry,
        p_year_established,
        p_annual_revenue,
        p_employee_count,
        auth.uid()
    ) RETURNING id INTO v_business_id;

    -- Create tool enrollment
    INSERT INTO public.tool_enrollments (
        client_file_id,
        business_id,
        tool_slug,
        enrolled_by
    ) VALUES (
        p_client_file_id,
        v_business_id,
        p_tool_slug,
        auth.uid()
    );

    RETURN v_business_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_client_with_business(p_full_name text, p_email text, p_phone text DEFAULT NULL::text, p_filing_status text DEFAULT 'single'::text, p_dependents integer DEFAULT 0, p_home_address text DEFAULT NULL::text, p_state text DEFAULT 'NV'::text, p_wages_income numeric DEFAULT 0, p_passive_income numeric DEFAULT 0, p_unearned_income numeric DEFAULT 0, p_capital_gains numeric DEFAULT 0, p_household_income numeric DEFAULT 0, p_standard_deduction boolean DEFAULT true, p_custom_deduction numeric DEFAULT 0, p_business_owner boolean DEFAULT false, p_business_name text DEFAULT NULL::text, p_entity_type text DEFAULT NULL::text, p_business_address text DEFAULT NULL::text, p_ordinary_k1_income numeric DEFAULT 0, p_guaranteed_k1_income numeric DEFAULT 0, p_business_annual_revenue numeric DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_client_file_id UUID;
  v_business_id UUID;
  v_admin_id UUID;
  v_affiliate_id UUID;
  v_tax_profile_data JSONB;
BEGIN
  -- Get current user info
  v_admin_id := auth.uid();
  
  -- Create tax profile data
  v_tax_profile_data := jsonb_build_object(
    'fullName', p_full_name,
    'email', p_email,
    'phone', p_phone,
    'filingStatus', p_filing_status,
    'dependents', p_dependents,
    'homeAddress', p_home_address,
    'state', p_state,
    'wagesIncome', p_wages_income,
    'passiveIncome', p_passive_income,
    'unearnedIncome', p_unearned_income,
    'capitalGains', p_capital_gains,
    'householdIncome', p_household_income,
    'standardDeduction', p_standard_deduction,
    'customDeduction', p_custom_deduction,
    'businessOwner', p_business_owner,
    'businessName', p_business_name,
    'entityType', p_entity_type,
    'businessAddress', p_business_address,
    'ordinaryK1Income', p_ordinary_k1_income,
    'guaranteedK1Income', p_guaranteed_k1_income,
    'businessAnnualRevenue', p_business_annual_revenue
  );

  -- Insert into admin_client_files
  INSERT INTO admin_client_files (
    admin_id,
    affiliate_id,
    full_name,
    email,
    phone,
    filing_status,
    dependents,
    home_address,
    state,
    wages_income,
    passive_income,
    unearned_income,
    capital_gains,
    household_income,
    standard_deduction,
    custom_deduction,
    business_owner,
    business_name,
    entity_type,
    business_address,
    ordinary_k1_income,
    guaranteed_k1_income,
    business_annual_revenue,
    tax_profile_data,
    archived
  ) VALUES (
    v_admin_id,
    v_affiliate_id,
    p_full_name,
    p_email,
    p_phone,
    p_filing_status,
    p_dependents,
    p_home_address,
    p_state,
    p_wages_income,
    p_passive_income,
    p_unearned_income,
    p_capital_gains,
    p_household_income,
    p_standard_deduction,
    p_custom_deduction,
    p_business_owner,
    p_business_name,
    p_entity_type,
    p_business_address,
    p_ordinary_k1_income,
    p_guaranteed_k1_income,
    p_business_annual_revenue,
    v_tax_profile_data,
    FALSE
  ) RETURNING id INTO v_client_file_id;

  -- If business owner and business name provided, create business
  IF p_business_owner AND p_business_name IS NOT NULL AND p_business_name != '' THEN
    INSERT INTO centralized_businesses (
      business_name,
      entity_type,
      business_address,
      ordinary_k1_income,
      guaranteed_k1_income,
      annual_revenue,
      created_by,
      archived
    ) VALUES (
      p_business_name,
      COALESCE(p_entity_type, 'Other')::centralized_businesses.entity_type%TYPE,
      p_business_address,
      p_ordinary_k1_income,
      p_guaranteed_k1_income,
      p_business_annual_revenue,
      v_admin_id,
      FALSE
    ) RETURNING id INTO v_business_id;

    -- Create initial business year record
    INSERT INTO business_years (
      business_id,
      year,
      is_active,
      ordinary_k1_income,
      guaranteed_k1_income,
      annual_revenue
    ) VALUES (
      v_business_id,
      EXTRACT(YEAR FROM NOW()),
      TRUE,
      p_ordinary_k1_income,
      p_guaranteed_k1_income,
      p_business_annual_revenue
    );
  END IF;

  -- Return the created IDs
  RETURN json_build_object(
    'client_file_id', v_client_file_id,
    'business_id', v_business_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_strategy_details_for_proposal()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- This function will be called when a proposal is created
  -- It will parse the proposed_strategies JSON and create corresponding strategy_details records
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, p_tool_slug text, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_enrollment_id UUID;
BEGIN
    INSERT INTO public.tool_enrollments (
        client_file_id,
        business_id,
        tool_slug,
        enrolled_by,
        notes
    ) VALUES (
        p_client_file_id,
        p_business_id,
        p_tool_slug,
        auth.uid(),
        p_notes
    ) ON CONFLICT (client_file_id, business_id, tool_slug) 
    DO UPDATE SET 
        status = 'active',
        notes = COALESCE(p_notes, tool_enrollments.notes),
        enrolled_at = NOW()
    RETURNING id INTO v_enrollment_id;
    
    RETURN v_enrollment_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_base_period_years(business_start_year integer, tax_year integer)
 RETURNS integer[]
 LANGUAGE plpgsql
AS $function$
DECLARE
  start_from_year INTEGER;
  years INTEGER[] := ARRAY[]::INTEGER[];
  year INTEGER;
BEGIN
  -- Start from 8 years ago or business start year, whichever is later
  start_from_year := GREATEST(business_start_year, tax_year - 8);
  
  -- Generate array of years from start_from_year to tax_year - 1
  FOR year IN start_from_year..(tax_year - 1) LOOP
    years := array_append(years, year);
  END LOOP;
  
  RETURN years;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_tools(p_client_file_id uuid, p_business_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(tool_slug text, tool_name text, status text, enrolled_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        te.tool_slug,
        CASE te.tool_slug
            WHEN 'rd' THEN 'R&D Tax Calculator'
            WHEN 'augusta' THEN 'Augusta Rule Estimator'
            WHEN 'hire_children' THEN 'Hire Children Calculator'
            WHEN 'cost_segregation' THEN 'Cost Segregation Calculator'
            WHEN 'convertible_bonds' THEN 'Convertible Tax Bonds Calculator'
            WHEN 'tax_planning' THEN 'Tax Planning'
            ELSE te.tool_slug
        END AS tool_name,
        te.status,
        te.enrolled_at
    FROM public.tool_enrollments te
    WHERE te.client_file_id = p_client_file_id
    AND (p_business_id IS NULL OR te.business_id = p_business_id)
    ORDER BY te.enrolled_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_with_data(client_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'client', c,
        'personal_years', COALESCE(py_data, '[]'::json),
        'businesses', COALESCE(b_data, '[]'::json)
    ) INTO result
    FROM clients c
    LEFT JOIN (
        SELECT 
            client_id,
            json_agg(py.*) as py_data
        FROM personal_years py
        WHERE py.client_id = client_uuid
        GROUP BY client_id
    ) py ON c.id = py.client_id
    LEFT JOIN (
        SELECT 
            b.client_id,
            json_agg(
                json_build_object(
                    'business', b,
                    'business_years', COALESCE(by_data, '[]'::json)
                )
            ) as b_data
        FROM businesses b
        LEFT JOIN (
            SELECT 
                business_id,
                json_agg(by.*) as by_data
            FROM business_years by
            WHERE by.business_id IN (SELECT id FROM businesses WHERE client_id = client_uuid)
            GROUP BY business_id
        ) by ON b.id = by.business_id
        WHERE b.client_id = client_uuid
        GROUP BY b.client_id
    ) b ON c.id = b.client_id
    WHERE c.id = client_uuid;
    
    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unified_client_list(p_tool_filter text DEFAULT NULL::text, p_admin_id uuid DEFAULT NULL::uuid, p_affiliate_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(client_file_id uuid, business_id uuid, admin_id uuid, affiliate_id uuid, archived boolean, created_at timestamp with time zone, full_name text, email text, business_name text, entity_type text, tool_slug text, tool_status text, total_income numeric, filing_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        acf.id AS client_file_id,
        acf.business_id,
        acf.admin_id,
        acf.affiliate_id,
        acf.archived,
        acf.created_at,
        acf.full_name,
        acf.email,
        cb.business_name,
        cb.entity_type,
        te.tool_slug,
        te.status AS tool_status,
        COALESCE(
            (SELECT (wages_income + passive_income + unearned_income + capital_gains) 
             FROM personal_years py 
             WHERE py.client_id = acf.id 
             ORDER BY py.year DESC 
             LIMIT 1),
            (acf.wages_income + acf.passive_income + acf.unearned_income + acf.capital_gains)
        ) AS total_income,
        acf.filing_status
    FROM public.admin_client_files acf
    LEFT JOIN public.centralized_businesses cb ON acf.business_id = cb.id
    LEFT JOIN public.tool_enrollments te ON te.business_id = cb.id
    WHERE acf.archived IS NOT TRUE
    AND (p_tool_filter IS NULL OR te.tool_slug = p_tool_filter)
    AND (p_admin_id IS NULL OR acf.admin_id = p_admin_id)
    AND (p_affiliate_id IS NULL OR acf.affiliate_id = p_affiliate_id)
    ORDER BY acf.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$function$
;

create or replace view "public"."rd_activity_hierarchy" as  SELECT cat.name AS category,
    area.name AS area,
    focus.name AS focus,
    act.title AS activity_title,
    sub.title AS subcomponent_title,
    sub.phase,
    sub.step,
    sub.hint,
    sub.general_description,
    sub.goal,
    sub.hypothesis,
    sub.alternatives,
    sub.uncertainties,
    sub.developmental_process,
    sub.primary_goal,
    sub.expected_outcome_type,
    sub.cpt_codes,
    sub.cdt_codes,
    sub.alternative_paths
   FROM ((((rd_research_categories cat
     JOIN rd_areas area ON ((area.category_id = cat.id)))
     JOIN rd_focuses focus ON ((focus.area_id = area.id)))
     JOIN rd_research_activities act ON ((act.focus_id = focus.id)))
     JOIN rd_subcomponents sub ON ((sub.activity_id = act.id)))
  ORDER BY cat.name, area.name, focus.name, act.title, sub.step;


CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_business_year(p_year_id uuid, p_is_active boolean DEFAULT NULL::boolean, p_ordinary_k1_income numeric DEFAULT NULL::numeric, p_guaranteed_k1_income numeric DEFAULT NULL::numeric, p_annual_revenue numeric DEFAULT NULL::numeric, p_employee_count integer DEFAULT NULL::integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE business_years SET
    is_active = COALESCE(p_is_active, is_active),
    ordinary_k1_income = COALESCE(p_ordinary_k1_income, ordinary_k1_income),
    guaranteed_k1_income = COALESCE(p_guaranteed_k1_income, guaranteed_k1_income),
    annual_revenue = COALESCE(p_annual_revenue, annual_revenue),
    employee_count = COALESCE(p_employee_count, employee_count),
    updated_at = NOW()
  WHERE id = p_year_id;
  
  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_business_years_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_historical_data(data jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check if it's an array
  IF jsonb_typeof(data) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check each object in the array
  FOR i IN 0..jsonb_array_length(data) - 1 LOOP
    DECLARE
      item JSONB := data->i;
    BEGIN
      -- Check required fields exist and are numbers
      IF NOT (item ? 'year' AND item ? 'gross_receipts' AND item ? 'qre') THEN
        RETURN FALSE;
      END IF;
      
      -- Check year is reasonable
      IF (item->>'year')::INTEGER < 1900 OR (item->>'year')::INTEGER > EXTRACT(YEAR FROM CURRENT_DATE) + 1 THEN
        RETURN FALSE;
      END IF;
      
      -- Check amounts are non-negative
      IF (item->>'gross_receipts')::NUMERIC < 0 OR (item->>'qre')::NUMERIC < 0 THEN
        RETURN FALSE;
      END IF;
    END;
  END LOOP;
  
  RETURN TRUE;
END;
$function$
;


alter table "public"."admin_client_files" add constraint "admin_client_files_pkey" PRIMARY KEY using index "admin_client_files_pkey";

alter table "public"."augusta_rule_details" add constraint "augusta_rule_details_pkey" PRIMARY KEY using index "augusta_rule_details_pkey";

alter table "public"."business_years" add constraint "business_years_pkey" PRIMARY KEY using index "business_years_pkey";

alter table "public"."businesses" add constraint "businesses_pkey" PRIMARY KEY using index "businesses_pkey";

alter table "public"."calculations" add constraint "calculations_pkey" PRIMARY KEY using index "calculations_pkey";

alter table "public"."centralized_businesses" add constraint "centralized_businesses_pkey" PRIMARY KEY using index "centralized_businesses_pkey";

alter table "public"."charitable_donation_details" add constraint "charitable_donation_details_pkey" PRIMARY KEY using index "charitable_donation_details_pkey";

alter table "public"."clients" add constraint "clients_pkey" PRIMARY KEY using index "clients_pkey";

alter table "public"."commission_transactions" add constraint "commission_transactions_pkey" PRIMARY KEY using index "commission_transactions_pkey";

alter table "public"."contractor_expenses" add constraint "contractor_expenses_pkey" PRIMARY KEY using index "contractor_expenses_pkey";

alter table "public"."convertible_tax_bonds_details" add constraint "convertible_tax_bonds_details_pkey" PRIMARY KEY using index "convertible_tax_bonds_details_pkey";

alter table "public"."cost_segregation_details" add constraint "cost_segregation_details_pkey" PRIMARY KEY using index "cost_segregation_details_pkey";

alter table "public"."employees" add constraint "employees_pkey" PRIMARY KEY using index "employees_pkey";

alter table "public"."experts" add constraint "experts_pkey" PRIMARY KEY using index "experts_pkey";

alter table "public"."family_management_company_details" add constraint "family_management_company_details_pkey" PRIMARY KEY using index "family_management_company_details_pkey";

alter table "public"."hire_children_details" add constraint "hire_children_details_pkey" PRIMARY KEY using index "hire_children_details_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."personal_years" add constraint "personal_years_pkey" PRIMARY KEY using index "personal_years_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."proposal_assignments" add constraint "proposal_assignments_pkey" PRIMARY KEY using index "proposal_assignments_pkey";

alter table "public"."proposal_timeline" add constraint "proposal_timeline_pkey" PRIMARY KEY using index "proposal_timeline_pkey";

alter table "public"."rd_areas" add constraint "rd_areas_pkey" PRIMARY KEY using index "rd_areas_pkey";

alter table "public"."rd_business_years" add constraint "rd_business_years_pkey" PRIMARY KEY using index "rd_business_years_pkey";

alter table "public"."rd_businesses" add constraint "rd_businesses_pkey" PRIMARY KEY using index "rd_businesses_pkey";

alter table "public"."rd_contractor_subcomponents" add constraint "rd_contractor_subcomponents_pkey" PRIMARY KEY using index "rd_contractor_subcomponents_pkey";

alter table "public"."rd_contractor_year_data" add constraint "rd_contractor_year_data_pkey" PRIMARY KEY using index "rd_contractor_year_data_pkey";

alter table "public"."rd_contractors" add constraint "rd_contractors_pkey" PRIMARY KEY using index "rd_contractors_pkey";

alter table "public"."rd_employee_subcomponents" add constraint "rd_employee_subcomponents_pkey" PRIMARY KEY using index "rd_employee_subcomponents_pkey";

alter table "public"."rd_employee_year_data" add constraint "rd_employee_year_data_pkey" PRIMARY KEY using index "rd_employee_year_data_pkey";

alter table "public"."rd_employees" add constraint "rd_employees_pkey" PRIMARY KEY using index "rd_employees_pkey";

alter table "public"."rd_expenses" add constraint "rd_expenses_pkey" PRIMARY KEY using index "rd_expenses_pkey";

alter table "public"."rd_federal_credit_results" add constraint "rd_federal_credit_results_pkey" PRIMARY KEY using index "rd_federal_credit_results_pkey";

alter table "public"."rd_focuses" add constraint "rd_focuses_pkey" PRIMARY KEY using index "rd_focuses_pkey";

alter table "public"."rd_reports" add constraint "rd_reports_pkey" PRIMARY KEY using index "rd_reports_pkey";

alter table "public"."rd_research_activities" add constraint "rd_research_activities_pkey" PRIMARY KEY using index "rd_research_activities_pkey";

alter table "public"."rd_research_categories" add constraint "rd_research_categories_pkey" PRIMARY KEY using index "rd_research_categories_pkey";

alter table "public"."rd_research_raw" add constraint "rd_research_raw_pkey" PRIMARY KEY using index "rd_research_raw_pkey";

alter table "public"."rd_research_steps" add constraint "rd_research_steps_pkey" PRIMARY KEY using index "rd_research_steps_pkey";

alter table "public"."rd_research_subcomponents" add constraint "rd_research_subcomponents_pkey" PRIMARY KEY using index "rd_research_subcomponents_pkey";

alter table "public"."rd_roles" add constraint "rd_roles_pkey" PRIMARY KEY using index "rd_roles_pkey";

alter table "public"."rd_selected_activities" add constraint "rd_selected_activities_pkey" PRIMARY KEY using index "rd_selected_activities_pkey";

alter table "public"."rd_selected_filter" add constraint "rd_selected_filter_pkey" PRIMARY KEY using index "rd_selected_filter_pkey";

alter table "public"."rd_selected_steps" add constraint "rd_selected_steps_pkey" PRIMARY KEY using index "rd_selected_steps_pkey";

alter table "public"."rd_selected_subcomponents" add constraint "rd_selected_subcomponents_pkey" PRIMARY KEY using index "rd_selected_subcomponents_pkey";

alter table "public"."rd_state_calculations" add constraint "rd_state_calculations_pkey" PRIMARY KEY using index "rd_state_calculations_pkey";

alter table "public"."rd_subcomponents" add constraint "rd_subcomponents_pkey" PRIMARY KEY using index "rd_subcomponents_pkey";

alter table "public"."rd_supplies" add constraint "rd_supplies_pkey" PRIMARY KEY using index "rd_supplies_pkey";

alter table "public"."rd_supply_subcomponents" add constraint "rd_supply_subcomponents_pkey" PRIMARY KEY using index "rd_supply_subcomponents_pkey";

alter table "public"."rd_supply_year_data" add constraint "rd_supply_year_data_pkey" PRIMARY KEY using index "rd_supply_year_data_pkey";

alter table "public"."reinsurance_details" add constraint "reinsurance_details_pkey" PRIMARY KEY using index "reinsurance_details_pkey";

alter table "public"."research_activities" add constraint "research_activities_pkey" PRIMARY KEY using index "research_activities_pkey";

alter table "public"."strategy_commission_rates" add constraint "strategy_commission_rates_pkey" PRIMARY KEY using index "strategy_commission_rates_pkey";

alter table "public"."strategy_details" add constraint "strategy_details_pkey" PRIMARY KEY using index "strategy_details_pkey";

alter table "public"."supply_expenses" add constraint "supply_expenses_pkey" PRIMARY KEY using index "supply_expenses_pkey";

alter table "public"."tax_estimates" add constraint "tax_estimates_pkey" PRIMARY KEY using index "tax_estimates_pkey";

alter table "public"."tax_profiles" add constraint "tax_profiles_pkey" PRIMARY KEY using index "tax_profiles_pkey";

alter table "public"."tax_proposals" add constraint "tax_proposals_pkey" PRIMARY KEY using index "tax_proposals_pkey";

alter table "public"."tool_enrollments" add constraint "tool_enrollments_pkey" PRIMARY KEY using index "tool_enrollments_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."admin_client_files" add constraint "admin_client_files_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES profiles(id) not valid;

alter table "public"."admin_client_files" validate constraint "admin_client_files_admin_id_fkey";

alter table "public"."admin_client_files" add constraint "admin_client_files_affiliate_id_fkey" FOREIGN KEY (affiliate_id) REFERENCES profiles(id) not valid;

alter table "public"."admin_client_files" validate constraint "admin_client_files_affiliate_id_fkey";

alter table "public"."admin_client_files" add constraint "admin_client_files_client_id_fkey" FOREIGN KEY (client_id) REFERENCES profiles(id) not valid;

alter table "public"."admin_client_files" validate constraint "admin_client_files_client_id_fkey";

alter table "public"."augusta_rule_details" add constraint "augusta_rule_details_strategy_detail_id_fkey" FOREIGN KEY (strategy_detail_id) REFERENCES strategy_details(id) ON DELETE CASCADE not valid;

alter table "public"."augusta_rule_details" validate constraint "augusta_rule_details_strategy_detail_id_fkey";

alter table "public"."business_years" add constraint "business_years_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE not valid;

alter table "public"."business_years" validate constraint "business_years_business_id_fkey";

alter table "public"."business_years" add constraint "business_years_business_id_year_key" UNIQUE using index "business_years_business_id_year_key";

alter table "public"."businesses" add constraint "businesses_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE not valid;

alter table "public"."businesses" validate constraint "businesses_client_id_fkey";

alter table "public"."calculations" add constraint "calculations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."calculations" validate constraint "calculations_user_id_fkey";

alter table "public"."centralized_businesses" add constraint "centralized_businesses_entity_type_check" CHECK ((entity_type = ANY (ARRAY['LLC'::text, 'S-Corp'::text, 'C-Corp'::text, 'Partnership'::text, 'Sole Proprietorship'::text, 'Other'::text]))) not valid;

alter table "public"."centralized_businesses" validate constraint "centralized_businesses_entity_type_check";

alter table "public"."charitable_donation_details" add constraint "charitable_donation_details_strategy_detail_id_fkey" FOREIGN KEY (strategy_detail_id) REFERENCES strategy_details(id) ON DELETE CASCADE not valid;

alter table "public"."charitable_donation_details" validate constraint "charitable_donation_details_strategy_detail_id_fkey";

alter table "public"."clients" add constraint "clients_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."clients" validate constraint "clients_created_by_fkey";

alter table "public"."clients" add constraint "clients_email_key" UNIQUE using index "clients_email_key";

alter table "public"."commission_transactions" add constraint "commission_transactions_affiliate_id_fkey" FOREIGN KEY (affiliate_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."commission_transactions" validate constraint "commission_transactions_affiliate_id_fkey";

alter table "public"."commission_transactions" add constraint "commission_transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."commission_transactions" validate constraint "commission_transactions_created_by_fkey";

alter table "public"."commission_transactions" add constraint "commission_transactions_expert_id_fkey" FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE not valid;

alter table "public"."commission_transactions" validate constraint "commission_transactions_expert_id_fkey";

alter table "public"."commission_transactions" add constraint "commission_transactions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."commission_transactions" validate constraint "commission_transactions_status_check";

alter table "public"."commission_transactions" add constraint "commission_transactions_transaction_type_check" CHECK ((transaction_type = ANY (ARRAY['expert_payment_received'::text, 'affiliate_payment_due'::text, 'affiliate_payment_sent'::text, 'admin_commission'::text]))) not valid;

alter table "public"."commission_transactions" validate constraint "commission_transactions_transaction_type_check";

alter table "public"."convertible_tax_bonds_details" add constraint "convertible_tax_bonds_details_strategy_detail_id_fkey" FOREIGN KEY (strategy_detail_id) REFERENCES strategy_details(id) ON DELETE CASCADE not valid;

alter table "public"."convertible_tax_bonds_details" validate constraint "convertible_tax_bonds_details_strategy_detail_id_fkey";

alter table "public"."cost_segregation_details" add constraint "cost_segregation_details_strategy_detail_id_fkey" FOREIGN KEY (strategy_detail_id) REFERENCES strategy_details(id) ON DELETE CASCADE not valid;

alter table "public"."cost_segregation_details" validate constraint "cost_segregation_details_strategy_detail_id_fkey";

alter table "public"."experts" add constraint "experts_email_key" UNIQUE using index "experts_email_key";

alter table "public"."family_management_company_details" add constraint "family_management_company_details_strategy_detail_id_fkey" FOREIGN KEY (strategy_detail_id) REFERENCES strategy_details(id) ON DELETE CASCADE not valid;

alter table "public"."family_management_company_details" validate constraint "family_management_company_details_strategy_detail_id_fkey";

alter table "public"."hire_children_details" add constraint "hire_children_details_strategy_detail_id_fkey" FOREIGN KEY (strategy_detail_id) REFERENCES strategy_details(id) ON DELETE CASCADE not valid;

alter table "public"."hire_children_details" validate constraint "hire_children_details_strategy_detail_id_fkey";

alter table "public"."leads" add constraint "leads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."leads" validate constraint "leads_user_id_fkey";

alter table "public"."personal_years" add constraint "personal_years_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE not valid;

alter table "public"."personal_years" validate constraint "personal_years_client_id_fkey";

alter table "public"."personal_years" add constraint "personal_years_client_id_year_key" UNIQUE using index "personal_years_client_id_year_key";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."proposal_assignments" add constraint "proposal_assignments_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES profiles(id) not valid;

alter table "public"."proposal_assignments" validate constraint "proposal_assignments_assigned_by_fkey";

alter table "public"."proposal_assignments" add constraint "proposal_assignments_expert_id_fkey" FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE not valid;

alter table "public"."proposal_assignments" validate constraint "proposal_assignments_expert_id_fkey";

alter table "public"."proposal_assignments" add constraint "proposal_assignments_expert_status_check" CHECK ((expert_status = ANY (ARRAY['assigned'::text, 'contacted'::text, 'in_progress'::text, 'completed'::text, 'declined'::text]))) not valid;

alter table "public"."proposal_assignments" validate constraint "proposal_assignments_expert_status_check";

alter table "public"."proposal_assignments" add constraint "proposal_assignments_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."proposal_assignments" validate constraint "proposal_assignments_priority_check";

alter table "public"."proposal_timeline" add constraint "proposal_timeline_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES profiles(id) not valid;

alter table "public"."proposal_timeline" validate constraint "proposal_timeline_changed_by_fkey";

alter table "public"."rd_areas" add constraint "rd_areas_category_id_fkey" FOREIGN KEY (category_id) REFERENCES rd_research_categories(id) ON DELETE CASCADE not valid;

alter table "public"."rd_areas" validate constraint "rd_areas_category_id_fkey";

alter table "public"."rd_areas" add constraint "unique_area_name_per_category" UNIQUE using index "unique_area_name_per_category";

alter table "public"."rd_business_years" add constraint "rd_business_years_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE not valid;

alter table "public"."rd_business_years" validate constraint "rd_business_years_business_id_fkey";

alter table "public"."rd_businesses" add constraint "check_historical_data_structure" CHECK (validate_historical_data(historical_data)) not valid;

alter table "public"."rd_businesses" validate constraint "check_historical_data_structure";

alter table "public"."rd_businesses" add constraint "rd_businesses_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE not valid;

alter table "public"."rd_businesses" validate constraint "rd_businesses_client_id_fkey";

alter table "public"."rd_contractor_subcomponents" add constraint "rd_contractor_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_contractor_subcomponents" validate constraint "rd_contractor_subcomponents_business_year_id_fkey";

alter table "public"."rd_contractor_subcomponents" add constraint "rd_contractor_subcomponents_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES rd_contractors(id) ON DELETE CASCADE not valid;

alter table "public"."rd_contractor_subcomponents" validate constraint "rd_contractor_subcomponents_contractor_id_fkey";

alter table "public"."rd_contractor_subcomponents" add constraint "rd_contractor_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE not valid;

alter table "public"."rd_contractor_subcomponents" validate constraint "rd_contractor_subcomponents_subcomponent_id_fkey";

alter table "public"."rd_contractor_subcomponents" add constraint "rd_contractor_subcomponents_unique" UNIQUE using index "rd_contractor_subcomponents_unique";

alter table "public"."rd_contractor_year_data" add constraint "rd_contractor_year_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_contractor_year_data" validate constraint "rd_contractor_year_data_business_year_id_fkey";

alter table "public"."rd_contractor_year_data" add constraint "rd_contractor_year_data_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES rd_contractors(id) not valid;

alter table "public"."rd_contractor_year_data" validate constraint "rd_contractor_year_data_contractor_id_fkey";

alter table "public"."rd_contractors" add constraint "rd_contractors_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE not valid;

alter table "public"."rd_contractors" validate constraint "rd_contractors_business_id_fkey";

alter table "public"."rd_contractors" add constraint "rd_contractors_role_id_fkey" FOREIGN KEY (role_id) REFERENCES rd_roles(id) ON DELETE SET NULL not valid;

alter table "public"."rd_contractors" validate constraint "rd_contractors_role_id_fkey";

alter table "public"."rd_contractors" add constraint "rd_contractors_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."rd_contractors" validate constraint "rd_contractors_user_id_fkey";

alter table "public"."rd_employee_subcomponents" add constraint "rd_employee_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_employee_subcomponents" validate constraint "rd_employee_subcomponents_business_year_id_fkey";

alter table "public"."rd_employee_subcomponents" add constraint "rd_employee_subcomponents_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES rd_employees(id) ON DELETE CASCADE not valid;

alter table "public"."rd_employee_subcomponents" validate constraint "rd_employee_subcomponents_employee_id_fkey";

alter table "public"."rd_employee_subcomponents" add constraint "rd_employee_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE not valid;

alter table "public"."rd_employee_subcomponents" validate constraint "rd_employee_subcomponents_subcomponent_id_fkey";

alter table "public"."rd_employee_subcomponents" add constraint "rd_employee_subcomponents_unique" UNIQUE using index "rd_employee_subcomponents_unique";

alter table "public"."rd_employee_year_data" add constraint "rd_employee_year_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_employee_year_data" validate constraint "rd_employee_year_data_business_year_id_fkey";

alter table "public"."rd_employee_year_data" add constraint "rd_employee_year_data_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES rd_employees(id) ON DELETE CASCADE not valid;

alter table "public"."rd_employee_year_data" validate constraint "rd_employee_year_data_employee_id_fkey";

alter table "public"."rd_employees" add constraint "rd_employees_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE not valid;

alter table "public"."rd_employees" validate constraint "rd_employees_business_id_fkey";

alter table "public"."rd_employees" add constraint "rd_employees_role_id_fkey" FOREIGN KEY (role_id) REFERENCES rd_roles(id) ON DELETE CASCADE not valid;

alter table "public"."rd_employees" validate constraint "rd_employees_role_id_fkey";

alter table "public"."rd_employees" add constraint "rd_employees_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."rd_employees" validate constraint "rd_employees_user_id_fkey";

alter table "public"."rd_expenses" add constraint "rd_expenses_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_expenses" validate constraint "rd_expenses_business_year_id_fkey";

alter table "public"."rd_expenses" add constraint "rd_expenses_category_check" CHECK ((category = ANY (ARRAY['Employee'::text, 'Contractor'::text, 'Supply'::text]))) not valid;

alter table "public"."rd_expenses" validate constraint "rd_expenses_category_check";

alter table "public"."rd_expenses" add constraint "rd_expenses_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES rd_employees(id) ON DELETE CASCADE not valid;

alter table "public"."rd_expenses" validate constraint "rd_expenses_employee_id_fkey";

alter table "public"."rd_expenses" add constraint "rd_expenses_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE not valid;

alter table "public"."rd_expenses" validate constraint "rd_expenses_research_activity_id_fkey";

alter table "public"."rd_expenses" add constraint "rd_expenses_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE not valid;

alter table "public"."rd_expenses" validate constraint "rd_expenses_step_id_fkey";

alter table "public"."rd_expenses" add constraint "rd_expenses_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE not valid;

alter table "public"."rd_expenses" validate constraint "rd_expenses_subcomponent_id_fkey";

alter table "public"."rd_federal_credit_results" add constraint "rd_federal_credit_results_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_federal_credit_results" validate constraint "rd_federal_credit_results_business_year_id_fkey";

alter table "public"."rd_federal_credit_results" add constraint "rd_federal_credit_results_selected_method_check" CHECK ((selected_method = ANY (ARRAY['standard'::text, 'asc'::text]))) not valid;

alter table "public"."rd_federal_credit_results" validate constraint "rd_federal_credit_results_selected_method_check";

alter table "public"."rd_federal_credit_results" add constraint "rd_federal_credit_results_unique" UNIQUE using index "rd_federal_credit_results_unique";

alter table "public"."rd_focuses" add constraint "rd_focuses_area_id_fkey" FOREIGN KEY (area_id) REFERENCES rd_areas(id) ON DELETE CASCADE not valid;

alter table "public"."rd_focuses" validate constraint "rd_focuses_area_id_fkey";

alter table "public"."rd_focuses" add constraint "unique_focus_name_per_area" UNIQUE using index "unique_focus_name_per_area";

alter table "public"."rd_reports" add constraint "rd_reports_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE SET NULL not valid;

alter table "public"."rd_reports" validate constraint "rd_reports_business_id_fkey";

alter table "public"."rd_reports" add constraint "rd_reports_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE SET NULL not valid;

alter table "public"."rd_reports" validate constraint "rd_reports_business_year_id_fkey";

alter table "public"."rd_research_activities" add constraint "rd_research_activities_focus_id_fkey" FOREIGN KEY (focus_id) REFERENCES rd_focuses(id) ON DELETE CASCADE not valid;

alter table "public"."rd_research_activities" validate constraint "rd_research_activities_focus_id_fkey";

alter table "public"."rd_research_activities" add constraint "unique_activity_per_focus" UNIQUE using index "unique_activity_per_focus";

alter table "public"."rd_research_categories" add constraint "rd_research_categories_name_key" UNIQUE using index "rd_research_categories_name_key";

alter table "public"."rd_research_categories" add constraint "unique_category_name" UNIQUE using index "unique_category_name";

alter table "public"."rd_research_steps" add constraint "rd_research_steps_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE not valid;

alter table "public"."rd_research_steps" validate constraint "rd_research_steps_research_activity_id_fkey";

alter table "public"."rd_research_subcomponents" add constraint "rd_research_subcomponents_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE not valid;

alter table "public"."rd_research_subcomponents" validate constraint "rd_research_subcomponents_step_id_fkey";

alter table "public"."rd_roles" add constraint "rd_roles_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE not valid;

alter table "public"."rd_roles" validate constraint "rd_roles_business_id_fkey";

alter table "public"."rd_roles" add constraint "rd_roles_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_roles" validate constraint "rd_roles_business_year_id_fkey";

alter table "public"."rd_roles" add constraint "rd_roles_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES rd_roles(id) ON DELETE SET NULL not valid;

alter table "public"."rd_roles" validate constraint "rd_roles_parent_id_fkey";

alter table "public"."rd_selected_activities" add constraint "rd_selected_activities_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_activities" validate constraint "rd_selected_activities_activity_id_fkey";

alter table "public"."rd_selected_activities" add constraint "rd_selected_activities_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_activities" validate constraint "rd_selected_activities_business_year_id_fkey";

alter table "public"."rd_selected_filter" add constraint "rd_selected_filter_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_filter" validate constraint "rd_selected_filter_business_year_id_fkey";

alter table "public"."rd_selected_filter" add constraint "rd_selected_filter_business_year_id_key" UNIQUE using index "rd_selected_filter_business_year_id_key";

alter table "public"."rd_selected_steps" add constraint "rd_selected_steps_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_steps" validate constraint "rd_selected_steps_business_year_id_fkey";

alter table "public"."rd_selected_steps" add constraint "rd_selected_steps_business_year_id_step_id_key" UNIQUE using index "rd_selected_steps_business_year_id_step_id_key";

alter table "public"."rd_selected_steps" add constraint "rd_selected_steps_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_steps" validate constraint "rd_selected_steps_research_activity_id_fkey";

alter table "public"."rd_selected_steps" add constraint "rd_selected_steps_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_steps" validate constraint "rd_selected_steps_step_id_fkey";

alter table "public"."rd_selected_subcomponents" add constraint "rd_selected_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_subcomponents" validate constraint "rd_selected_subcomponents_business_year_id_fkey";

alter table "public"."rd_selected_subcomponents" add constraint "rd_selected_subcomponents_business_year_id_subcomponent_id_key" UNIQUE using index "rd_selected_subcomponents_business_year_id_subcomponent_id_key";

alter table "public"."rd_selected_subcomponents" add constraint "rd_selected_subcomponents_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_subcomponents" validate constraint "rd_selected_subcomponents_research_activity_id_fkey";

alter table "public"."rd_selected_subcomponents" add constraint "rd_selected_subcomponents_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_subcomponents" validate constraint "rd_selected_subcomponents_step_id_fkey";

alter table "public"."rd_selected_subcomponents" add constraint "rd_selected_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE not valid;

alter table "public"."rd_selected_subcomponents" validate constraint "rd_selected_subcomponents_subcomponent_id_fkey";

alter table "public"."rd_subcomponents" add constraint "rd_subcomponents_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE not valid;

alter table "public"."rd_subcomponents" validate constraint "rd_subcomponents_activity_id_fkey";

alter table "public"."rd_supplies" add constraint "rd_supplies_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE not valid;

alter table "public"."rd_supplies" validate constraint "rd_supplies_business_id_fkey";

alter table "public"."rd_supply_subcomponents" add constraint "rd_supply_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_supply_subcomponents" validate constraint "rd_supply_subcomponents_business_year_id_fkey";

alter table "public"."rd_supply_subcomponents" add constraint "rd_supply_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE not valid;

alter table "public"."rd_supply_subcomponents" validate constraint "rd_supply_subcomponents_subcomponent_id_fkey";

alter table "public"."rd_supply_subcomponents" add constraint "rd_supply_subcomponents_supply_id_fkey" FOREIGN KEY (supply_id) REFERENCES rd_supplies(id) ON DELETE CASCADE not valid;

alter table "public"."rd_supply_subcomponents" validate constraint "rd_supply_subcomponents_supply_id_fkey";

alter table "public"."rd_supply_subcomponents" add constraint "rd_supply_subcomponents_unique" UNIQUE using index "rd_supply_subcomponents_unique";

alter table "public"."rd_supply_year_data" add constraint "rd_supply_year_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE not valid;

alter table "public"."rd_supply_year_data" validate constraint "rd_supply_year_data_business_year_id_fkey";

alter table "public"."rd_supply_year_data" add constraint "rd_supply_year_data_supply_id_fkey" FOREIGN KEY (supply_id) REFERENCES rd_supplies(id) ON DELETE CASCADE not valid;

alter table "public"."rd_supply_year_data" validate constraint "rd_supply_year_data_supply_id_fkey";

alter table "public"."reinsurance_details" add constraint "reinsurance_details_strategy_detail_id_fkey" FOREIGN KEY (strategy_detail_id) REFERENCES strategy_details(id) ON DELETE CASCADE not valid;

alter table "public"."reinsurance_details" validate constraint "reinsurance_details_strategy_detail_id_fkey";

alter table "public"."strategy_commission_rates" add constraint "rates_sum_check" CHECK (((affiliate_rate + admin_rate) <= 1.0)) not valid;

alter table "public"."strategy_commission_rates" validate constraint "rates_sum_check";

alter table "public"."strategy_commission_rates" add constraint "strategy_commission_rates_affiliate_id_fkey" FOREIGN KEY (affiliate_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."strategy_commission_rates" validate constraint "strategy_commission_rates_affiliate_id_fkey";

alter table "public"."strategy_details" add constraint "strategy_details_proposal_id_fkey" FOREIGN KEY (proposal_id) REFERENCES tax_proposals(id) ON DELETE CASCADE not valid;

alter table "public"."strategy_details" validate constraint "strategy_details_proposal_id_fkey";

alter table "public"."strategy_details" add constraint "strategy_details_proposal_id_strategy_id_key" UNIQUE using index "strategy_details_proposal_id_strategy_id_key";

alter table "public"."tax_estimates" add constraint "tax_estimates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tax_estimates" validate constraint "tax_estimates_user_id_fkey";

alter table "public"."tax_profiles" add constraint "tax_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."tax_profiles" validate constraint "tax_profiles_user_id_fkey";

alter table "public"."tax_profiles" add constraint "unique_user_id" UNIQUE using index "unique_user_id";

alter table "public"."tax_proposals" add constraint "tax_proposals_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'proposed'::text, 'accepted'::text, 'rejected'::text, 'implemented'::text]))) not valid;

alter table "public"."tax_proposals" validate constraint "tax_proposals_status_check";

alter table "public"."tax_proposals" add constraint "tax_proposals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tax_proposals" validate constraint "tax_proposals_user_id_fkey";

alter table "public"."tool_enrollments" add constraint "tool_enrollments_client_file_id_business_id_tool_slug_key" UNIQUE using index "tool_enrollments_client_file_id_business_id_tool_slug_key";

alter table "public"."tool_enrollments" add constraint "tool_enrollments_client_file_id_fkey" FOREIGN KEY (client_file_id) REFERENCES admin_client_files(id) ON DELETE CASCADE not valid;

alter table "public"."tool_enrollments" validate constraint "tool_enrollments_client_file_id_fkey";

alter table "public"."tool_enrollments" add constraint "tool_enrollments_enrolled_by_fkey" FOREIGN KEY (enrolled_by) REFERENCES profiles(id) not valid;

alter table "public"."tool_enrollments" validate constraint "tool_enrollments_enrolled_by_fkey";

alter table "public"."tool_enrollments" add constraint "tool_enrollments_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."tool_enrollments" validate constraint "tool_enrollments_status_check";

alter table "public"."tool_enrollments" add constraint "tool_enrollments_tool_slug_check" CHECK ((tool_slug = ANY (ARRAY['rd'::text, 'augusta'::text, 'hire_children'::text, 'cost_segregation'::text, 'convertible_bonds'::text, 'tax_planning'::text]))) not valid;

alter table "public"."tool_enrollments" validate constraint "tool_enrollments_tool_slug_check";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";


grant delete on table "public"."admin_client_files" to "anon";

grant insert on table "public"."admin_client_files" to "anon";

grant references on table "public"."admin_client_files" to "anon";

grant select on table "public"."admin_client_files" to "anon";

grant trigger on table "public"."admin_client_files" to "anon";

grant truncate on table "public"."admin_client_files" to "anon";

grant update on table "public"."admin_client_files" to "anon";

grant delete on table "public"."admin_client_files" to "authenticated";

grant insert on table "public"."admin_client_files" to "authenticated";

grant references on table "public"."admin_client_files" to "authenticated";

grant select on table "public"."admin_client_files" to "authenticated";

grant trigger on table "public"."admin_client_files" to "authenticated";

grant truncate on table "public"."admin_client_files" to "authenticated";

grant update on table "public"."admin_client_files" to "authenticated";

grant delete on table "public"."admin_client_files" to "service_role";

grant insert on table "public"."admin_client_files" to "service_role";

grant references on table "public"."admin_client_files" to "service_role";

grant select on table "public"."admin_client_files" to "service_role";

grant trigger on table "public"."admin_client_files" to "service_role";

grant truncate on table "public"."admin_client_files" to "service_role";

grant update on table "public"."admin_client_files" to "service_role";

grant delete on table "public"."augusta_rule_details" to "anon";

grant insert on table "public"."augusta_rule_details" to "anon";

grant references on table "public"."augusta_rule_details" to "anon";

grant select on table "public"."augusta_rule_details" to "anon";

grant trigger on table "public"."augusta_rule_details" to "anon";

grant truncate on table "public"."augusta_rule_details" to "anon";

grant update on table "public"."augusta_rule_details" to "anon";

grant delete on table "public"."augusta_rule_details" to "authenticated";

grant insert on table "public"."augusta_rule_details" to "authenticated";

grant references on table "public"."augusta_rule_details" to "authenticated";

grant select on table "public"."augusta_rule_details" to "authenticated";

grant trigger on table "public"."augusta_rule_details" to "authenticated";

grant truncate on table "public"."augusta_rule_details" to "authenticated";

grant update on table "public"."augusta_rule_details" to "authenticated";

grant delete on table "public"."augusta_rule_details" to "service_role";

grant insert on table "public"."augusta_rule_details" to "service_role";

grant references on table "public"."augusta_rule_details" to "service_role";

grant select on table "public"."augusta_rule_details" to "service_role";

grant trigger on table "public"."augusta_rule_details" to "service_role";

grant truncate on table "public"."augusta_rule_details" to "service_role";

grant update on table "public"."augusta_rule_details" to "service_role";

grant delete on table "public"."business_years" to "anon";

grant insert on table "public"."business_years" to "anon";

grant references on table "public"."business_years" to "anon";

grant select on table "public"."business_years" to "anon";

grant trigger on table "public"."business_years" to "anon";

grant truncate on table "public"."business_years" to "anon";

grant update on table "public"."business_years" to "anon";

grant delete on table "public"."business_years" to "authenticated";

grant insert on table "public"."business_years" to "authenticated";

grant references on table "public"."business_years" to "authenticated";

grant select on table "public"."business_years" to "authenticated";

grant trigger on table "public"."business_years" to "authenticated";

grant truncate on table "public"."business_years" to "authenticated";

grant update on table "public"."business_years" to "authenticated";

grant delete on table "public"."business_years" to "service_role";

grant insert on table "public"."business_years" to "service_role";

grant references on table "public"."business_years" to "service_role";

grant select on table "public"."business_years" to "service_role";

grant trigger on table "public"."business_years" to "service_role";

grant truncate on table "public"."business_years" to "service_role";

grant update on table "public"."business_years" to "service_role";

grant delete on table "public"."businesses" to "anon";

grant insert on table "public"."businesses" to "anon";

grant references on table "public"."businesses" to "anon";

grant select on table "public"."businesses" to "anon";

grant trigger on table "public"."businesses" to "anon";

grant truncate on table "public"."businesses" to "anon";

grant update on table "public"."businesses" to "anon";

grant delete on table "public"."businesses" to "authenticated";

grant insert on table "public"."businesses" to "authenticated";

grant references on table "public"."businesses" to "authenticated";

grant select on table "public"."businesses" to "authenticated";

grant trigger on table "public"."businesses" to "authenticated";

grant truncate on table "public"."businesses" to "authenticated";

grant update on table "public"."businesses" to "authenticated";

grant delete on table "public"."businesses" to "service_role";

grant insert on table "public"."businesses" to "service_role";

grant references on table "public"."businesses" to "service_role";

grant select on table "public"."businesses" to "service_role";

grant trigger on table "public"."businesses" to "service_role";

grant truncate on table "public"."businesses" to "service_role";

grant update on table "public"."businesses" to "service_role";

grant delete on table "public"."calculations" to "anon";

grant insert on table "public"."calculations" to "anon";

grant references on table "public"."calculations" to "anon";

grant select on table "public"."calculations" to "anon";

grant trigger on table "public"."calculations" to "anon";

grant truncate on table "public"."calculations" to "anon";

grant update on table "public"."calculations" to "anon";

grant delete on table "public"."calculations" to "authenticated";

grant insert on table "public"."calculations" to "authenticated";

grant references on table "public"."calculations" to "authenticated";

grant select on table "public"."calculations" to "authenticated";

grant trigger on table "public"."calculations" to "authenticated";

grant truncate on table "public"."calculations" to "authenticated";

grant update on table "public"."calculations" to "authenticated";

grant delete on table "public"."calculations" to "service_role";

grant insert on table "public"."calculations" to "service_role";

grant references on table "public"."calculations" to "service_role";

grant select on table "public"."calculations" to "service_role";

grant trigger on table "public"."calculations" to "service_role";

grant truncate on table "public"."calculations" to "service_role";

grant update on table "public"."calculations" to "service_role";

grant delete on table "public"."centralized_businesses" to "anon";

grant insert on table "public"."centralized_businesses" to "anon";

grant references on table "public"."centralized_businesses" to "anon";

grant select on table "public"."centralized_businesses" to "anon";

grant trigger on table "public"."centralized_businesses" to "anon";

grant truncate on table "public"."centralized_businesses" to "anon";

grant update on table "public"."centralized_businesses" to "anon";

grant delete on table "public"."centralized_businesses" to "authenticated";

grant insert on table "public"."centralized_businesses" to "authenticated";

grant references on table "public"."centralized_businesses" to "authenticated";

grant select on table "public"."centralized_businesses" to "authenticated";

grant trigger on table "public"."centralized_businesses" to "authenticated";

grant truncate on table "public"."centralized_businesses" to "authenticated";

grant update on table "public"."centralized_businesses" to "authenticated";

grant delete on table "public"."centralized_businesses" to "service_role";

grant insert on table "public"."centralized_businesses" to "service_role";

grant references on table "public"."centralized_businesses" to "service_role";

grant select on table "public"."centralized_businesses" to "service_role";

grant trigger on table "public"."centralized_businesses" to "service_role";

grant truncate on table "public"."centralized_businesses" to "service_role";

grant update on table "public"."centralized_businesses" to "service_role";

grant delete on table "public"."charitable_donation_details" to "anon";

grant insert on table "public"."charitable_donation_details" to "anon";

grant references on table "public"."charitable_donation_details" to "anon";

grant select on table "public"."charitable_donation_details" to "anon";

grant trigger on table "public"."charitable_donation_details" to "anon";

grant truncate on table "public"."charitable_donation_details" to "anon";

grant update on table "public"."charitable_donation_details" to "anon";

grant delete on table "public"."charitable_donation_details" to "authenticated";

grant insert on table "public"."charitable_donation_details" to "authenticated";

grant references on table "public"."charitable_donation_details" to "authenticated";

grant select on table "public"."charitable_donation_details" to "authenticated";

grant trigger on table "public"."charitable_donation_details" to "authenticated";

grant truncate on table "public"."charitable_donation_details" to "authenticated";

grant update on table "public"."charitable_donation_details" to "authenticated";

grant delete on table "public"."charitable_donation_details" to "service_role";

grant insert on table "public"."charitable_donation_details" to "service_role";

grant references on table "public"."charitable_donation_details" to "service_role";

grant select on table "public"."charitable_donation_details" to "service_role";

grant trigger on table "public"."charitable_donation_details" to "service_role";

grant truncate on table "public"."charitable_donation_details" to "service_role";

grant update on table "public"."charitable_donation_details" to "service_role";

grant delete on table "public"."clients" to "anon";

grant insert on table "public"."clients" to "anon";

grant references on table "public"."clients" to "anon";

grant select on table "public"."clients" to "anon";

grant trigger on table "public"."clients" to "anon";

grant truncate on table "public"."clients" to "anon";

grant update on table "public"."clients" to "anon";

grant delete on table "public"."clients" to "authenticated";

grant insert on table "public"."clients" to "authenticated";

grant references on table "public"."clients" to "authenticated";

grant select on table "public"."clients" to "authenticated";

grant trigger on table "public"."clients" to "authenticated";

grant truncate on table "public"."clients" to "authenticated";

grant update on table "public"."clients" to "authenticated";

grant delete on table "public"."clients" to "service_role";

grant insert on table "public"."clients" to "service_role";

grant references on table "public"."clients" to "service_role";

grant select on table "public"."clients" to "service_role";

grant trigger on table "public"."clients" to "service_role";

grant truncate on table "public"."clients" to "service_role";

grant update on table "public"."clients" to "service_role";

grant delete on table "public"."commission_transactions" to "anon";

grant insert on table "public"."commission_transactions" to "anon";

grant references on table "public"."commission_transactions" to "anon";

grant select on table "public"."commission_transactions" to "anon";

grant trigger on table "public"."commission_transactions" to "anon";

grant truncate on table "public"."commission_transactions" to "anon";

grant update on table "public"."commission_transactions" to "anon";

grant delete on table "public"."commission_transactions" to "authenticated";

grant insert on table "public"."commission_transactions" to "authenticated";

grant references on table "public"."commission_transactions" to "authenticated";

grant select on table "public"."commission_transactions" to "authenticated";

grant trigger on table "public"."commission_transactions" to "authenticated";

grant truncate on table "public"."commission_transactions" to "authenticated";

grant update on table "public"."commission_transactions" to "authenticated";

grant delete on table "public"."commission_transactions" to "service_role";

grant insert on table "public"."commission_transactions" to "service_role";

grant references on table "public"."commission_transactions" to "service_role";

grant select on table "public"."commission_transactions" to "service_role";

grant trigger on table "public"."commission_transactions" to "service_role";

grant truncate on table "public"."commission_transactions" to "service_role";

grant update on table "public"."commission_transactions" to "service_role";

grant delete on table "public"."contractor_expenses" to "anon";

grant insert on table "public"."contractor_expenses" to "anon";

grant references on table "public"."contractor_expenses" to "anon";

grant select on table "public"."contractor_expenses" to "anon";

grant trigger on table "public"."contractor_expenses" to "anon";

grant truncate on table "public"."contractor_expenses" to "anon";

grant update on table "public"."contractor_expenses" to "anon";

grant delete on table "public"."contractor_expenses" to "authenticated";

grant insert on table "public"."contractor_expenses" to "authenticated";

grant references on table "public"."contractor_expenses" to "authenticated";

grant select on table "public"."contractor_expenses" to "authenticated";

grant trigger on table "public"."contractor_expenses" to "authenticated";

grant truncate on table "public"."contractor_expenses" to "authenticated";

grant update on table "public"."contractor_expenses" to "authenticated";

grant delete on table "public"."contractor_expenses" to "service_role";

grant insert on table "public"."contractor_expenses" to "service_role";

grant references on table "public"."contractor_expenses" to "service_role";

grant select on table "public"."contractor_expenses" to "service_role";

grant trigger on table "public"."contractor_expenses" to "service_role";

grant truncate on table "public"."contractor_expenses" to "service_role";

grant update on table "public"."contractor_expenses" to "service_role";

grant delete on table "public"."convertible_tax_bonds_details" to "anon";

grant insert on table "public"."convertible_tax_bonds_details" to "anon";

grant references on table "public"."convertible_tax_bonds_details" to "anon";

grant select on table "public"."convertible_tax_bonds_details" to "anon";

grant trigger on table "public"."convertible_tax_bonds_details" to "anon";

grant truncate on table "public"."convertible_tax_bonds_details" to "anon";

grant update on table "public"."convertible_tax_bonds_details" to "anon";

grant delete on table "public"."convertible_tax_bonds_details" to "authenticated";

grant insert on table "public"."convertible_tax_bonds_details" to "authenticated";

grant references on table "public"."convertible_tax_bonds_details" to "authenticated";

grant select on table "public"."convertible_tax_bonds_details" to "authenticated";

grant trigger on table "public"."convertible_tax_bonds_details" to "authenticated";

grant truncate on table "public"."convertible_tax_bonds_details" to "authenticated";

grant update on table "public"."convertible_tax_bonds_details" to "authenticated";

grant delete on table "public"."convertible_tax_bonds_details" to "service_role";

grant insert on table "public"."convertible_tax_bonds_details" to "service_role";

grant references on table "public"."convertible_tax_bonds_details" to "service_role";

grant select on table "public"."convertible_tax_bonds_details" to "service_role";

grant trigger on table "public"."convertible_tax_bonds_details" to "service_role";

grant truncate on table "public"."convertible_tax_bonds_details" to "service_role";

grant update on table "public"."convertible_tax_bonds_details" to "service_role";

grant delete on table "public"."cost_segregation_details" to "anon";

grant insert on table "public"."cost_segregation_details" to "anon";

grant references on table "public"."cost_segregation_details" to "anon";

grant select on table "public"."cost_segregation_details" to "anon";

grant trigger on table "public"."cost_segregation_details" to "anon";

grant truncate on table "public"."cost_segregation_details" to "anon";

grant update on table "public"."cost_segregation_details" to "anon";

grant delete on table "public"."cost_segregation_details" to "authenticated";

grant insert on table "public"."cost_segregation_details" to "authenticated";

grant references on table "public"."cost_segregation_details" to "authenticated";

grant select on table "public"."cost_segregation_details" to "authenticated";

grant trigger on table "public"."cost_segregation_details" to "authenticated";

grant truncate on table "public"."cost_segregation_details" to "authenticated";

grant update on table "public"."cost_segregation_details" to "authenticated";

grant delete on table "public"."cost_segregation_details" to "service_role";

grant insert on table "public"."cost_segregation_details" to "service_role";

grant references on table "public"."cost_segregation_details" to "service_role";

grant select on table "public"."cost_segregation_details" to "service_role";

grant trigger on table "public"."cost_segregation_details" to "service_role";

grant truncate on table "public"."cost_segregation_details" to "service_role";

grant update on table "public"."cost_segregation_details" to "service_role";

grant delete on table "public"."employees" to "anon";

grant insert on table "public"."employees" to "anon";

grant references on table "public"."employees" to "anon";

grant select on table "public"."employees" to "anon";

grant trigger on table "public"."employees" to "anon";

grant truncate on table "public"."employees" to "anon";

grant update on table "public"."employees" to "anon";

grant delete on table "public"."employees" to "authenticated";

grant insert on table "public"."employees" to "authenticated";

grant references on table "public"."employees" to "authenticated";

grant select on table "public"."employees" to "authenticated";

grant trigger on table "public"."employees" to "authenticated";

grant truncate on table "public"."employees" to "authenticated";

grant update on table "public"."employees" to "authenticated";

grant delete on table "public"."employees" to "service_role";

grant insert on table "public"."employees" to "service_role";

grant references on table "public"."employees" to "service_role";

grant select on table "public"."employees" to "service_role";

grant trigger on table "public"."employees" to "service_role";

grant truncate on table "public"."employees" to "service_role";

grant update on table "public"."employees" to "service_role";

grant delete on table "public"."experts" to "anon";

grant insert on table "public"."experts" to "anon";

grant references on table "public"."experts" to "anon";

grant select on table "public"."experts" to "anon";

grant trigger on table "public"."experts" to "anon";

grant truncate on table "public"."experts" to "anon";

grant update on table "public"."experts" to "anon";

grant delete on table "public"."experts" to "authenticated";

grant insert on table "public"."experts" to "authenticated";

grant references on table "public"."experts" to "authenticated";

grant select on table "public"."experts" to "authenticated";

grant trigger on table "public"."experts" to "authenticated";

grant truncate on table "public"."experts" to "authenticated";

grant update on table "public"."experts" to "authenticated";

grant delete on table "public"."experts" to "service_role";

grant insert on table "public"."experts" to "service_role";

grant references on table "public"."experts" to "service_role";

grant select on table "public"."experts" to "service_role";

grant trigger on table "public"."experts" to "service_role";

grant truncate on table "public"."experts" to "service_role";

grant update on table "public"."experts" to "service_role";

grant delete on table "public"."family_management_company_details" to "anon";

grant insert on table "public"."family_management_company_details" to "anon";

grant references on table "public"."family_management_company_details" to "anon";

grant select on table "public"."family_management_company_details" to "anon";

grant trigger on table "public"."family_management_company_details" to "anon";

grant truncate on table "public"."family_management_company_details" to "anon";

grant update on table "public"."family_management_company_details" to "anon";

grant delete on table "public"."family_management_company_details" to "authenticated";

grant insert on table "public"."family_management_company_details" to "authenticated";

grant references on table "public"."family_management_company_details" to "authenticated";

grant select on table "public"."family_management_company_details" to "authenticated";

grant trigger on table "public"."family_management_company_details" to "authenticated";

grant truncate on table "public"."family_management_company_details" to "authenticated";

grant update on table "public"."family_management_company_details" to "authenticated";

grant delete on table "public"."family_management_company_details" to "service_role";

grant insert on table "public"."family_management_company_details" to "service_role";

grant references on table "public"."family_management_company_details" to "service_role";

grant select on table "public"."family_management_company_details" to "service_role";

grant trigger on table "public"."family_management_company_details" to "service_role";

grant truncate on table "public"."family_management_company_details" to "service_role";

grant update on table "public"."family_management_company_details" to "service_role";

grant delete on table "public"."hire_children_details" to "anon";

grant insert on table "public"."hire_children_details" to "anon";

grant references on table "public"."hire_children_details" to "anon";

grant select on table "public"."hire_children_details" to "anon";

grant trigger on table "public"."hire_children_details" to "anon";

grant truncate on table "public"."hire_children_details" to "anon";

grant update on table "public"."hire_children_details" to "anon";

grant delete on table "public"."hire_children_details" to "authenticated";

grant insert on table "public"."hire_children_details" to "authenticated";

grant references on table "public"."hire_children_details" to "authenticated";

grant select on table "public"."hire_children_details" to "authenticated";

grant trigger on table "public"."hire_children_details" to "authenticated";

grant truncate on table "public"."hire_children_details" to "authenticated";

grant update on table "public"."hire_children_details" to "authenticated";

grant delete on table "public"."hire_children_details" to "service_role";

grant insert on table "public"."hire_children_details" to "service_role";

grant references on table "public"."hire_children_details" to "service_role";

grant select on table "public"."hire_children_details" to "service_role";

grant trigger on table "public"."hire_children_details" to "service_role";

grant truncate on table "public"."hire_children_details" to "service_role";

grant update on table "public"."hire_children_details" to "service_role";

grant delete on table "public"."leads" to "anon";

grant insert on table "public"."leads" to "anon";

grant references on table "public"."leads" to "anon";

grant select on table "public"."leads" to "anon";

grant trigger on table "public"."leads" to "anon";

grant truncate on table "public"."leads" to "anon";

grant update on table "public"."leads" to "anon";

grant delete on table "public"."leads" to "authenticated";

grant insert on table "public"."leads" to "authenticated";

grant references on table "public"."leads" to "authenticated";

grant select on table "public"."leads" to "authenticated";

grant trigger on table "public"."leads" to "authenticated";

grant truncate on table "public"."leads" to "authenticated";

grant update on table "public"."leads" to "authenticated";

grant delete on table "public"."leads" to "service_role";

grant insert on table "public"."leads" to "service_role";

grant references on table "public"."leads" to "service_role";

grant select on table "public"."leads" to "service_role";

grant trigger on table "public"."leads" to "service_role";

grant truncate on table "public"."leads" to "service_role";

grant update on table "public"."leads" to "service_role";

grant delete on table "public"."personal_years" to "anon";

grant insert on table "public"."personal_years" to "anon";

grant references on table "public"."personal_years" to "anon";

grant select on table "public"."personal_years" to "anon";

grant trigger on table "public"."personal_years" to "anon";

grant truncate on table "public"."personal_years" to "anon";

grant update on table "public"."personal_years" to "anon";

grant delete on table "public"."personal_years" to "authenticated";

grant insert on table "public"."personal_years" to "authenticated";

grant references on table "public"."personal_years" to "authenticated";

grant select on table "public"."personal_years" to "authenticated";

grant trigger on table "public"."personal_years" to "authenticated";

grant truncate on table "public"."personal_years" to "authenticated";

grant update on table "public"."personal_years" to "authenticated";

grant delete on table "public"."personal_years" to "service_role";

grant insert on table "public"."personal_years" to "service_role";

grant references on table "public"."personal_years" to "service_role";

grant select on table "public"."personal_years" to "service_role";

grant trigger on table "public"."personal_years" to "service_role";

grant truncate on table "public"."personal_years" to "service_role";

grant update on table "public"."personal_years" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."proposal_assignments" to "anon";

grant insert on table "public"."proposal_assignments" to "anon";

grant references on table "public"."proposal_assignments" to "anon";

grant select on table "public"."proposal_assignments" to "anon";

grant trigger on table "public"."proposal_assignments" to "anon";

grant truncate on table "public"."proposal_assignments" to "anon";

grant update on table "public"."proposal_assignments" to "anon";

grant delete on table "public"."proposal_assignments" to "authenticated";

grant insert on table "public"."proposal_assignments" to "authenticated";

grant references on table "public"."proposal_assignments" to "authenticated";

grant select on table "public"."proposal_assignments" to "authenticated";

grant trigger on table "public"."proposal_assignments" to "authenticated";

grant truncate on table "public"."proposal_assignments" to "authenticated";

grant update on table "public"."proposal_assignments" to "authenticated";

grant delete on table "public"."proposal_assignments" to "service_role";

grant insert on table "public"."proposal_assignments" to "service_role";

grant references on table "public"."proposal_assignments" to "service_role";

grant select on table "public"."proposal_assignments" to "service_role";

grant trigger on table "public"."proposal_assignments" to "service_role";

grant truncate on table "public"."proposal_assignments" to "service_role";

grant update on table "public"."proposal_assignments" to "service_role";

grant delete on table "public"."proposal_timeline" to "anon";

grant insert on table "public"."proposal_timeline" to "anon";

grant references on table "public"."proposal_timeline" to "anon";

grant select on table "public"."proposal_timeline" to "anon";

grant trigger on table "public"."proposal_timeline" to "anon";

grant truncate on table "public"."proposal_timeline" to "anon";

grant update on table "public"."proposal_timeline" to "anon";

grant delete on table "public"."proposal_timeline" to "authenticated";

grant insert on table "public"."proposal_timeline" to "authenticated";

grant references on table "public"."proposal_timeline" to "authenticated";

grant select on table "public"."proposal_timeline" to "authenticated";

grant trigger on table "public"."proposal_timeline" to "authenticated";

grant truncate on table "public"."proposal_timeline" to "authenticated";

grant update on table "public"."proposal_timeline" to "authenticated";

grant delete on table "public"."proposal_timeline" to "service_role";

grant insert on table "public"."proposal_timeline" to "service_role";

grant references on table "public"."proposal_timeline" to "service_role";

grant select on table "public"."proposal_timeline" to "service_role";

grant trigger on table "public"."proposal_timeline" to "service_role";

grant truncate on table "public"."proposal_timeline" to "service_role";

grant update on table "public"."proposal_timeline" to "service_role";

grant delete on table "public"."rd_areas" to "anon";

grant insert on table "public"."rd_areas" to "anon";

grant references on table "public"."rd_areas" to "anon";

grant select on table "public"."rd_areas" to "anon";

grant trigger on table "public"."rd_areas" to "anon";

grant truncate on table "public"."rd_areas" to "anon";

grant update on table "public"."rd_areas" to "anon";

grant delete on table "public"."rd_areas" to "authenticated";

grant insert on table "public"."rd_areas" to "authenticated";

grant references on table "public"."rd_areas" to "authenticated";

grant select on table "public"."rd_areas" to "authenticated";

grant trigger on table "public"."rd_areas" to "authenticated";

grant truncate on table "public"."rd_areas" to "authenticated";

grant update on table "public"."rd_areas" to "authenticated";

grant delete on table "public"."rd_areas" to "service_role";

grant insert on table "public"."rd_areas" to "service_role";

grant references on table "public"."rd_areas" to "service_role";

grant select on table "public"."rd_areas" to "service_role";

grant trigger on table "public"."rd_areas" to "service_role";

grant truncate on table "public"."rd_areas" to "service_role";

grant update on table "public"."rd_areas" to "service_role";

grant delete on table "public"."rd_business_years" to "anon";

grant insert on table "public"."rd_business_years" to "anon";

grant references on table "public"."rd_business_years" to "anon";

grant select on table "public"."rd_business_years" to "anon";

grant trigger on table "public"."rd_business_years" to "anon";

grant truncate on table "public"."rd_business_years" to "anon";

grant update on table "public"."rd_business_years" to "anon";

grant delete on table "public"."rd_business_years" to "authenticated";

grant insert on table "public"."rd_business_years" to "authenticated";

grant references on table "public"."rd_business_years" to "authenticated";

grant select on table "public"."rd_business_years" to "authenticated";

grant trigger on table "public"."rd_business_years" to "authenticated";

grant truncate on table "public"."rd_business_years" to "authenticated";

grant update on table "public"."rd_business_years" to "authenticated";

grant delete on table "public"."rd_business_years" to "service_role";

grant insert on table "public"."rd_business_years" to "service_role";

grant references on table "public"."rd_business_years" to "service_role";

grant select on table "public"."rd_business_years" to "service_role";

grant trigger on table "public"."rd_business_years" to "service_role";

grant truncate on table "public"."rd_business_years" to "service_role";

grant update on table "public"."rd_business_years" to "service_role";

grant delete on table "public"."rd_businesses" to "anon";

grant insert on table "public"."rd_businesses" to "anon";

grant references on table "public"."rd_businesses" to "anon";

grant select on table "public"."rd_businesses" to "anon";

grant trigger on table "public"."rd_businesses" to "anon";

grant truncate on table "public"."rd_businesses" to "anon";

grant update on table "public"."rd_businesses" to "anon";

grant delete on table "public"."rd_businesses" to "authenticated";

grant insert on table "public"."rd_businesses" to "authenticated";

grant references on table "public"."rd_businesses" to "authenticated";

grant select on table "public"."rd_businesses" to "authenticated";

grant trigger on table "public"."rd_businesses" to "authenticated";

grant truncate on table "public"."rd_businesses" to "authenticated";

grant update on table "public"."rd_businesses" to "authenticated";

grant delete on table "public"."rd_businesses" to "service_role";

grant insert on table "public"."rd_businesses" to "service_role";

grant references on table "public"."rd_businesses" to "service_role";

grant select on table "public"."rd_businesses" to "service_role";

grant trigger on table "public"."rd_businesses" to "service_role";

grant truncate on table "public"."rd_businesses" to "service_role";

grant update on table "public"."rd_businesses" to "service_role";

grant delete on table "public"."rd_contractor_subcomponents" to "anon";

grant insert on table "public"."rd_contractor_subcomponents" to "anon";

grant references on table "public"."rd_contractor_subcomponents" to "anon";

grant select on table "public"."rd_contractor_subcomponents" to "anon";

grant trigger on table "public"."rd_contractor_subcomponents" to "anon";

grant truncate on table "public"."rd_contractor_subcomponents" to "anon";

grant update on table "public"."rd_contractor_subcomponents" to "anon";

grant delete on table "public"."rd_contractor_subcomponents" to "authenticated";

grant insert on table "public"."rd_contractor_subcomponents" to "authenticated";

grant references on table "public"."rd_contractor_subcomponents" to "authenticated";

grant select on table "public"."rd_contractor_subcomponents" to "authenticated";

grant trigger on table "public"."rd_contractor_subcomponents" to "authenticated";

grant truncate on table "public"."rd_contractor_subcomponents" to "authenticated";

grant update on table "public"."rd_contractor_subcomponents" to "authenticated";

grant delete on table "public"."rd_contractor_subcomponents" to "service_role";

grant insert on table "public"."rd_contractor_subcomponents" to "service_role";

grant references on table "public"."rd_contractor_subcomponents" to "service_role";

grant select on table "public"."rd_contractor_subcomponents" to "service_role";

grant trigger on table "public"."rd_contractor_subcomponents" to "service_role";

grant truncate on table "public"."rd_contractor_subcomponents" to "service_role";

grant update on table "public"."rd_contractor_subcomponents" to "service_role";

grant delete on table "public"."rd_contractor_year_data" to "anon";

grant insert on table "public"."rd_contractor_year_data" to "anon";

grant references on table "public"."rd_contractor_year_data" to "anon";

grant select on table "public"."rd_contractor_year_data" to "anon";

grant trigger on table "public"."rd_contractor_year_data" to "anon";

grant truncate on table "public"."rd_contractor_year_data" to "anon";

grant update on table "public"."rd_contractor_year_data" to "anon";

grant delete on table "public"."rd_contractor_year_data" to "authenticated";

grant insert on table "public"."rd_contractor_year_data" to "authenticated";

grant references on table "public"."rd_contractor_year_data" to "authenticated";

grant select on table "public"."rd_contractor_year_data" to "authenticated";

grant trigger on table "public"."rd_contractor_year_data" to "authenticated";

grant truncate on table "public"."rd_contractor_year_data" to "authenticated";

grant update on table "public"."rd_contractor_year_data" to "authenticated";

grant delete on table "public"."rd_contractor_year_data" to "service_role";

grant insert on table "public"."rd_contractor_year_data" to "service_role";

grant references on table "public"."rd_contractor_year_data" to "service_role";

grant select on table "public"."rd_contractor_year_data" to "service_role";

grant trigger on table "public"."rd_contractor_year_data" to "service_role";

grant truncate on table "public"."rd_contractor_year_data" to "service_role";

grant update on table "public"."rd_contractor_year_data" to "service_role";

grant delete on table "public"."rd_contractors" to "anon";

grant insert on table "public"."rd_contractors" to "anon";

grant references on table "public"."rd_contractors" to "anon";

grant select on table "public"."rd_contractors" to "anon";

grant trigger on table "public"."rd_contractors" to "anon";

grant truncate on table "public"."rd_contractors" to "anon";

grant update on table "public"."rd_contractors" to "anon";

grant delete on table "public"."rd_contractors" to "authenticated";

grant insert on table "public"."rd_contractors" to "authenticated";

grant references on table "public"."rd_contractors" to "authenticated";

grant select on table "public"."rd_contractors" to "authenticated";

grant trigger on table "public"."rd_contractors" to "authenticated";

grant truncate on table "public"."rd_contractors" to "authenticated";

grant update on table "public"."rd_contractors" to "authenticated";

grant delete on table "public"."rd_contractors" to "service_role";

grant insert on table "public"."rd_contractors" to "service_role";

grant references on table "public"."rd_contractors" to "service_role";

grant select on table "public"."rd_contractors" to "service_role";

grant trigger on table "public"."rd_contractors" to "service_role";

grant truncate on table "public"."rd_contractors" to "service_role";

grant update on table "public"."rd_contractors" to "service_role";

grant delete on table "public"."rd_employee_subcomponents" to "anon";

grant insert on table "public"."rd_employee_subcomponents" to "anon";

grant references on table "public"."rd_employee_subcomponents" to "anon";

grant select on table "public"."rd_employee_subcomponents" to "anon";

grant trigger on table "public"."rd_employee_subcomponents" to "anon";

grant truncate on table "public"."rd_employee_subcomponents" to "anon";

grant update on table "public"."rd_employee_subcomponents" to "anon";

grant delete on table "public"."rd_employee_subcomponents" to "authenticated";

grant insert on table "public"."rd_employee_subcomponents" to "authenticated";

grant references on table "public"."rd_employee_subcomponents" to "authenticated";

grant select on table "public"."rd_employee_subcomponents" to "authenticated";

grant trigger on table "public"."rd_employee_subcomponents" to "authenticated";

grant truncate on table "public"."rd_employee_subcomponents" to "authenticated";

grant update on table "public"."rd_employee_subcomponents" to "authenticated";

grant delete on table "public"."rd_employee_subcomponents" to "service_role";

grant insert on table "public"."rd_employee_subcomponents" to "service_role";

grant references on table "public"."rd_employee_subcomponents" to "service_role";

grant select on table "public"."rd_employee_subcomponents" to "service_role";

grant trigger on table "public"."rd_employee_subcomponents" to "service_role";

grant truncate on table "public"."rd_employee_subcomponents" to "service_role";

grant update on table "public"."rd_employee_subcomponents" to "service_role";

grant delete on table "public"."rd_employee_year_data" to "anon";

grant insert on table "public"."rd_employee_year_data" to "anon";

grant references on table "public"."rd_employee_year_data" to "anon";

grant select on table "public"."rd_employee_year_data" to "anon";

grant trigger on table "public"."rd_employee_year_data" to "anon";

grant truncate on table "public"."rd_employee_year_data" to "anon";

grant update on table "public"."rd_employee_year_data" to "anon";

grant delete on table "public"."rd_employee_year_data" to "authenticated";

grant insert on table "public"."rd_employee_year_data" to "authenticated";

grant references on table "public"."rd_employee_year_data" to "authenticated";

grant select on table "public"."rd_employee_year_data" to "authenticated";

grant trigger on table "public"."rd_employee_year_data" to "authenticated";

grant truncate on table "public"."rd_employee_year_data" to "authenticated";

grant update on table "public"."rd_employee_year_data" to "authenticated";

grant delete on table "public"."rd_employee_year_data" to "service_role";

grant insert on table "public"."rd_employee_year_data" to "service_role";

grant references on table "public"."rd_employee_year_data" to "service_role";

grant select on table "public"."rd_employee_year_data" to "service_role";

grant trigger on table "public"."rd_employee_year_data" to "service_role";

grant truncate on table "public"."rd_employee_year_data" to "service_role";

grant update on table "public"."rd_employee_year_data" to "service_role";

grant delete on table "public"."rd_employees" to "anon";

grant insert on table "public"."rd_employees" to "anon";

grant references on table "public"."rd_employees" to "anon";

grant select on table "public"."rd_employees" to "anon";

grant trigger on table "public"."rd_employees" to "anon";

grant truncate on table "public"."rd_employees" to "anon";

grant update on table "public"."rd_employees" to "anon";

grant delete on table "public"."rd_employees" to "authenticated";

grant insert on table "public"."rd_employees" to "authenticated";

grant references on table "public"."rd_employees" to "authenticated";

grant select on table "public"."rd_employees" to "authenticated";

grant trigger on table "public"."rd_employees" to "authenticated";

grant truncate on table "public"."rd_employees" to "authenticated";

grant update on table "public"."rd_employees" to "authenticated";

grant delete on table "public"."rd_employees" to "service_role";

grant insert on table "public"."rd_employees" to "service_role";

grant references on table "public"."rd_employees" to "service_role";

grant select on table "public"."rd_employees" to "service_role";

grant trigger on table "public"."rd_employees" to "service_role";

grant truncate on table "public"."rd_employees" to "service_role";

grant update on table "public"."rd_employees" to "service_role";

grant delete on table "public"."rd_expenses" to "anon";

grant insert on table "public"."rd_expenses" to "anon";

grant references on table "public"."rd_expenses" to "anon";

grant select on table "public"."rd_expenses" to "anon";

grant trigger on table "public"."rd_expenses" to "anon";

grant truncate on table "public"."rd_expenses" to "anon";

grant update on table "public"."rd_expenses" to "anon";

grant delete on table "public"."rd_expenses" to "authenticated";

grant insert on table "public"."rd_expenses" to "authenticated";

grant references on table "public"."rd_expenses" to "authenticated";

grant select on table "public"."rd_expenses" to "authenticated";

grant trigger on table "public"."rd_expenses" to "authenticated";

grant truncate on table "public"."rd_expenses" to "authenticated";

grant update on table "public"."rd_expenses" to "authenticated";

grant delete on table "public"."rd_expenses" to "service_role";

grant insert on table "public"."rd_expenses" to "service_role";

grant references on table "public"."rd_expenses" to "service_role";

grant select on table "public"."rd_expenses" to "service_role";

grant trigger on table "public"."rd_expenses" to "service_role";

grant truncate on table "public"."rd_expenses" to "service_role";

grant update on table "public"."rd_expenses" to "service_role";

grant delete on table "public"."rd_federal_credit_results" to "anon";

grant insert on table "public"."rd_federal_credit_results" to "anon";

grant references on table "public"."rd_federal_credit_results" to "anon";

grant select on table "public"."rd_federal_credit_results" to "anon";

grant trigger on table "public"."rd_federal_credit_results" to "anon";

grant truncate on table "public"."rd_federal_credit_results" to "anon";

grant update on table "public"."rd_federal_credit_results" to "anon";

grant delete on table "public"."rd_federal_credit_results" to "authenticated";

grant insert on table "public"."rd_federal_credit_results" to "authenticated";

grant references on table "public"."rd_federal_credit_results" to "authenticated";

grant select on table "public"."rd_federal_credit_results" to "authenticated";

grant trigger on table "public"."rd_federal_credit_results" to "authenticated";

grant truncate on table "public"."rd_federal_credit_results" to "authenticated";

grant update on table "public"."rd_federal_credit_results" to "authenticated";

grant delete on table "public"."rd_federal_credit_results" to "service_role";

grant insert on table "public"."rd_federal_credit_results" to "service_role";

grant references on table "public"."rd_federal_credit_results" to "service_role";

grant select on table "public"."rd_federal_credit_results" to "service_role";

grant trigger on table "public"."rd_federal_credit_results" to "service_role";

grant truncate on table "public"."rd_federal_credit_results" to "service_role";

grant update on table "public"."rd_federal_credit_results" to "service_role";

grant delete on table "public"."rd_focuses" to "anon";

grant insert on table "public"."rd_focuses" to "anon";

grant references on table "public"."rd_focuses" to "anon";

grant select on table "public"."rd_focuses" to "anon";

grant trigger on table "public"."rd_focuses" to "anon";

grant truncate on table "public"."rd_focuses" to "anon";

grant update on table "public"."rd_focuses" to "anon";

grant delete on table "public"."rd_focuses" to "authenticated";

grant insert on table "public"."rd_focuses" to "authenticated";

grant references on table "public"."rd_focuses" to "authenticated";

grant select on table "public"."rd_focuses" to "authenticated";

grant trigger on table "public"."rd_focuses" to "authenticated";

grant truncate on table "public"."rd_focuses" to "authenticated";

grant update on table "public"."rd_focuses" to "authenticated";

grant delete on table "public"."rd_focuses" to "service_role";

grant insert on table "public"."rd_focuses" to "service_role";

grant references on table "public"."rd_focuses" to "service_role";

grant select on table "public"."rd_focuses" to "service_role";

grant trigger on table "public"."rd_focuses" to "service_role";

grant truncate on table "public"."rd_focuses" to "service_role";

grant update on table "public"."rd_focuses" to "service_role";

grant delete on table "public"."rd_reports" to "anon";

grant insert on table "public"."rd_reports" to "anon";

grant references on table "public"."rd_reports" to "anon";

grant select on table "public"."rd_reports" to "anon";

grant trigger on table "public"."rd_reports" to "anon";

grant truncate on table "public"."rd_reports" to "anon";

grant update on table "public"."rd_reports" to "anon";

grant delete on table "public"."rd_reports" to "authenticated";

grant insert on table "public"."rd_reports" to "authenticated";

grant references on table "public"."rd_reports" to "authenticated";

grant select on table "public"."rd_reports" to "authenticated";

grant trigger on table "public"."rd_reports" to "authenticated";

grant truncate on table "public"."rd_reports" to "authenticated";

grant update on table "public"."rd_reports" to "authenticated";

grant delete on table "public"."rd_reports" to "service_role";

grant insert on table "public"."rd_reports" to "service_role";

grant references on table "public"."rd_reports" to "service_role";

grant select on table "public"."rd_reports" to "service_role";

grant trigger on table "public"."rd_reports" to "service_role";

grant truncate on table "public"."rd_reports" to "service_role";

grant update on table "public"."rd_reports" to "service_role";

grant delete on table "public"."rd_research_activities" to "anon";

grant insert on table "public"."rd_research_activities" to "anon";

grant references on table "public"."rd_research_activities" to "anon";

grant select on table "public"."rd_research_activities" to "anon";

grant trigger on table "public"."rd_research_activities" to "anon";

grant truncate on table "public"."rd_research_activities" to "anon";

grant update on table "public"."rd_research_activities" to "anon";

grant delete on table "public"."rd_research_activities" to "authenticated";

grant insert on table "public"."rd_research_activities" to "authenticated";

grant references on table "public"."rd_research_activities" to "authenticated";

grant select on table "public"."rd_research_activities" to "authenticated";

grant trigger on table "public"."rd_research_activities" to "authenticated";

grant truncate on table "public"."rd_research_activities" to "authenticated";

grant update on table "public"."rd_research_activities" to "authenticated";

grant delete on table "public"."rd_research_activities" to "service_role";

grant insert on table "public"."rd_research_activities" to "service_role";

grant references on table "public"."rd_research_activities" to "service_role";

grant select on table "public"."rd_research_activities" to "service_role";

grant trigger on table "public"."rd_research_activities" to "service_role";

grant truncate on table "public"."rd_research_activities" to "service_role";

grant update on table "public"."rd_research_activities" to "service_role";

grant delete on table "public"."rd_research_categories" to "anon";

grant insert on table "public"."rd_research_categories" to "anon";

grant references on table "public"."rd_research_categories" to "anon";

grant select on table "public"."rd_research_categories" to "anon";

grant trigger on table "public"."rd_research_categories" to "anon";

grant truncate on table "public"."rd_research_categories" to "anon";

grant update on table "public"."rd_research_categories" to "anon";

grant delete on table "public"."rd_research_categories" to "authenticated";

grant insert on table "public"."rd_research_categories" to "authenticated";

grant references on table "public"."rd_research_categories" to "authenticated";

grant select on table "public"."rd_research_categories" to "authenticated";

grant trigger on table "public"."rd_research_categories" to "authenticated";

grant truncate on table "public"."rd_research_categories" to "authenticated";

grant update on table "public"."rd_research_categories" to "authenticated";

grant delete on table "public"."rd_research_categories" to "service_role";

grant insert on table "public"."rd_research_categories" to "service_role";

grant references on table "public"."rd_research_categories" to "service_role";

grant select on table "public"."rd_research_categories" to "service_role";

grant trigger on table "public"."rd_research_categories" to "service_role";

grant truncate on table "public"."rd_research_categories" to "service_role";

grant update on table "public"."rd_research_categories" to "service_role";

grant delete on table "public"."rd_research_raw" to "anon";

grant insert on table "public"."rd_research_raw" to "anon";

grant references on table "public"."rd_research_raw" to "anon";

grant select on table "public"."rd_research_raw" to "anon";

grant trigger on table "public"."rd_research_raw" to "anon";

grant truncate on table "public"."rd_research_raw" to "anon";

grant update on table "public"."rd_research_raw" to "anon";

grant delete on table "public"."rd_research_raw" to "authenticated";

grant insert on table "public"."rd_research_raw" to "authenticated";

grant references on table "public"."rd_research_raw" to "authenticated";

grant select on table "public"."rd_research_raw" to "authenticated";

grant trigger on table "public"."rd_research_raw" to "authenticated";

grant truncate on table "public"."rd_research_raw" to "authenticated";

grant update on table "public"."rd_research_raw" to "authenticated";

grant delete on table "public"."rd_research_raw" to "service_role";

grant insert on table "public"."rd_research_raw" to "service_role";

grant references on table "public"."rd_research_raw" to "service_role";

grant select on table "public"."rd_research_raw" to "service_role";

grant trigger on table "public"."rd_research_raw" to "service_role";

grant truncate on table "public"."rd_research_raw" to "service_role";

grant update on table "public"."rd_research_raw" to "service_role";

grant delete on table "public"."rd_research_steps" to "anon";

grant insert on table "public"."rd_research_steps" to "anon";

grant references on table "public"."rd_research_steps" to "anon";

grant select on table "public"."rd_research_steps" to "anon";

grant trigger on table "public"."rd_research_steps" to "anon";

grant truncate on table "public"."rd_research_steps" to "anon";

grant update on table "public"."rd_research_steps" to "anon";

grant delete on table "public"."rd_research_steps" to "authenticated";

grant insert on table "public"."rd_research_steps" to "authenticated";

grant references on table "public"."rd_research_steps" to "authenticated";

grant select on table "public"."rd_research_steps" to "authenticated";

grant trigger on table "public"."rd_research_steps" to "authenticated";

grant truncate on table "public"."rd_research_steps" to "authenticated";

grant update on table "public"."rd_research_steps" to "authenticated";

grant delete on table "public"."rd_research_steps" to "service_role";

grant insert on table "public"."rd_research_steps" to "service_role";

grant references on table "public"."rd_research_steps" to "service_role";

grant select on table "public"."rd_research_steps" to "service_role";

grant trigger on table "public"."rd_research_steps" to "service_role";

grant truncate on table "public"."rd_research_steps" to "service_role";

grant update on table "public"."rd_research_steps" to "service_role";

grant delete on table "public"."rd_research_subcomponents" to "anon";

grant insert on table "public"."rd_research_subcomponents" to "anon";

grant references on table "public"."rd_research_subcomponents" to "anon";

grant select on table "public"."rd_research_subcomponents" to "anon";

grant trigger on table "public"."rd_research_subcomponents" to "anon";

grant truncate on table "public"."rd_research_subcomponents" to "anon";

grant update on table "public"."rd_research_subcomponents" to "anon";

grant delete on table "public"."rd_research_subcomponents" to "authenticated";

grant insert on table "public"."rd_research_subcomponents" to "authenticated";

grant references on table "public"."rd_research_subcomponents" to "authenticated";

grant select on table "public"."rd_research_subcomponents" to "authenticated";

grant trigger on table "public"."rd_research_subcomponents" to "authenticated";

grant truncate on table "public"."rd_research_subcomponents" to "authenticated";

grant update on table "public"."rd_research_subcomponents" to "authenticated";

grant delete on table "public"."rd_research_subcomponents" to "service_role";

grant insert on table "public"."rd_research_subcomponents" to "service_role";

grant references on table "public"."rd_research_subcomponents" to "service_role";

grant select on table "public"."rd_research_subcomponents" to "service_role";

grant trigger on table "public"."rd_research_subcomponents" to "service_role";

grant truncate on table "public"."rd_research_subcomponents" to "service_role";

grant update on table "public"."rd_research_subcomponents" to "service_role";

grant delete on table "public"."rd_roles" to "anon";

grant insert on table "public"."rd_roles" to "anon";

grant references on table "public"."rd_roles" to "anon";

grant select on table "public"."rd_roles" to "anon";

grant trigger on table "public"."rd_roles" to "anon";

grant truncate on table "public"."rd_roles" to "anon";

grant update on table "public"."rd_roles" to "anon";

grant delete on table "public"."rd_roles" to "authenticated";

grant insert on table "public"."rd_roles" to "authenticated";

grant references on table "public"."rd_roles" to "authenticated";

grant select on table "public"."rd_roles" to "authenticated";

grant trigger on table "public"."rd_roles" to "authenticated";

grant truncate on table "public"."rd_roles" to "authenticated";

grant update on table "public"."rd_roles" to "authenticated";

grant delete on table "public"."rd_roles" to "service_role";

grant insert on table "public"."rd_roles" to "service_role";

grant references on table "public"."rd_roles" to "service_role";

grant select on table "public"."rd_roles" to "service_role";

grant trigger on table "public"."rd_roles" to "service_role";

grant truncate on table "public"."rd_roles" to "service_role";

grant update on table "public"."rd_roles" to "service_role";

grant delete on table "public"."rd_selected_activities" to "anon";

grant insert on table "public"."rd_selected_activities" to "anon";

grant references on table "public"."rd_selected_activities" to "anon";

grant select on table "public"."rd_selected_activities" to "anon";

grant trigger on table "public"."rd_selected_activities" to "anon";

grant truncate on table "public"."rd_selected_activities" to "anon";

grant update on table "public"."rd_selected_activities" to "anon";

grant delete on table "public"."rd_selected_activities" to "authenticated";

grant insert on table "public"."rd_selected_activities" to "authenticated";

grant references on table "public"."rd_selected_activities" to "authenticated";

grant select on table "public"."rd_selected_activities" to "authenticated";

grant trigger on table "public"."rd_selected_activities" to "authenticated";

grant truncate on table "public"."rd_selected_activities" to "authenticated";

grant update on table "public"."rd_selected_activities" to "authenticated";

grant delete on table "public"."rd_selected_activities" to "service_role";

grant insert on table "public"."rd_selected_activities" to "service_role";

grant references on table "public"."rd_selected_activities" to "service_role";

grant select on table "public"."rd_selected_activities" to "service_role";

grant trigger on table "public"."rd_selected_activities" to "service_role";

grant truncate on table "public"."rd_selected_activities" to "service_role";

grant update on table "public"."rd_selected_activities" to "service_role";

grant delete on table "public"."rd_selected_filter" to "anon";

grant insert on table "public"."rd_selected_filter" to "anon";

grant references on table "public"."rd_selected_filter" to "anon";

grant select on table "public"."rd_selected_filter" to "anon";

grant trigger on table "public"."rd_selected_filter" to "anon";

grant truncate on table "public"."rd_selected_filter" to "anon";

grant update on table "public"."rd_selected_filter" to "anon";

grant delete on table "public"."rd_selected_filter" to "authenticated";

grant insert on table "public"."rd_selected_filter" to "authenticated";

grant references on table "public"."rd_selected_filter" to "authenticated";

grant select on table "public"."rd_selected_filter" to "authenticated";

grant trigger on table "public"."rd_selected_filter" to "authenticated";

grant truncate on table "public"."rd_selected_filter" to "authenticated";

grant update on table "public"."rd_selected_filter" to "authenticated";

grant delete on table "public"."rd_selected_filter" to "service_role";

grant insert on table "public"."rd_selected_filter" to "service_role";

grant references on table "public"."rd_selected_filter" to "service_role";

grant select on table "public"."rd_selected_filter" to "service_role";

grant trigger on table "public"."rd_selected_filter" to "service_role";

grant truncate on table "public"."rd_selected_filter" to "service_role";

grant update on table "public"."rd_selected_filter" to "service_role";

grant delete on table "public"."rd_selected_steps" to "anon";

grant insert on table "public"."rd_selected_steps" to "anon";

grant references on table "public"."rd_selected_steps" to "anon";

grant select on table "public"."rd_selected_steps" to "anon";

grant trigger on table "public"."rd_selected_steps" to "anon";

grant truncate on table "public"."rd_selected_steps" to "anon";

grant update on table "public"."rd_selected_steps" to "anon";

grant delete on table "public"."rd_selected_steps" to "authenticated";

grant insert on table "public"."rd_selected_steps" to "authenticated";

grant references on table "public"."rd_selected_steps" to "authenticated";

grant select on table "public"."rd_selected_steps" to "authenticated";

grant trigger on table "public"."rd_selected_steps" to "authenticated";

grant truncate on table "public"."rd_selected_steps" to "authenticated";

grant update on table "public"."rd_selected_steps" to "authenticated";

grant delete on table "public"."rd_selected_steps" to "service_role";

grant insert on table "public"."rd_selected_steps" to "service_role";

grant references on table "public"."rd_selected_steps" to "service_role";

grant select on table "public"."rd_selected_steps" to "service_role";

grant trigger on table "public"."rd_selected_steps" to "service_role";

grant truncate on table "public"."rd_selected_steps" to "service_role";

grant update on table "public"."rd_selected_steps" to "service_role";

grant delete on table "public"."rd_selected_subcomponents" to "anon";

grant insert on table "public"."rd_selected_subcomponents" to "anon";

grant references on table "public"."rd_selected_subcomponents" to "anon";

grant select on table "public"."rd_selected_subcomponents" to "anon";

grant trigger on table "public"."rd_selected_subcomponents" to "anon";

grant truncate on table "public"."rd_selected_subcomponents" to "anon";

grant update on table "public"."rd_selected_subcomponents" to "anon";

grant delete on table "public"."rd_selected_subcomponents" to "authenticated";

grant insert on table "public"."rd_selected_subcomponents" to "authenticated";

grant references on table "public"."rd_selected_subcomponents" to "authenticated";

grant select on table "public"."rd_selected_subcomponents" to "authenticated";

grant trigger on table "public"."rd_selected_subcomponents" to "authenticated";

grant truncate on table "public"."rd_selected_subcomponents" to "authenticated";

grant update on table "public"."rd_selected_subcomponents" to "authenticated";

grant delete on table "public"."rd_selected_subcomponents" to "service_role";

grant insert on table "public"."rd_selected_subcomponents" to "service_role";

grant references on table "public"."rd_selected_subcomponents" to "service_role";

grant select on table "public"."rd_selected_subcomponents" to "service_role";

grant trigger on table "public"."rd_selected_subcomponents" to "service_role";

grant truncate on table "public"."rd_selected_subcomponents" to "service_role";

grant update on table "public"."rd_selected_subcomponents" to "service_role";

grant delete on table "public"."rd_state_calculations" to "anon";

grant insert on table "public"."rd_state_calculations" to "anon";

grant references on table "public"."rd_state_calculations" to "anon";

grant select on table "public"."rd_state_calculations" to "anon";

grant trigger on table "public"."rd_state_calculations" to "anon";

grant truncate on table "public"."rd_state_calculations" to "anon";

grant update on table "public"."rd_state_calculations" to "anon";

grant delete on table "public"."rd_state_calculations" to "authenticated";

grant insert on table "public"."rd_state_calculations" to "authenticated";

grant references on table "public"."rd_state_calculations" to "authenticated";

grant select on table "public"."rd_state_calculations" to "authenticated";

grant trigger on table "public"."rd_state_calculations" to "authenticated";

grant truncate on table "public"."rd_state_calculations" to "authenticated";

grant update on table "public"."rd_state_calculations" to "authenticated";

grant delete on table "public"."rd_state_calculations" to "service_role";

grant insert on table "public"."rd_state_calculations" to "service_role";

grant references on table "public"."rd_state_calculations" to "service_role";

grant select on table "public"."rd_state_calculations" to "service_role";

grant trigger on table "public"."rd_state_calculations" to "service_role";

grant truncate on table "public"."rd_state_calculations" to "service_role";

grant update on table "public"."rd_state_calculations" to "service_role";

grant delete on table "public"."rd_subcomponents" to "anon";

grant insert on table "public"."rd_subcomponents" to "anon";

grant references on table "public"."rd_subcomponents" to "anon";

grant select on table "public"."rd_subcomponents" to "anon";

grant trigger on table "public"."rd_subcomponents" to "anon";

grant truncate on table "public"."rd_subcomponents" to "anon";

grant update on table "public"."rd_subcomponents" to "anon";

grant delete on table "public"."rd_subcomponents" to "authenticated";

grant insert on table "public"."rd_subcomponents" to "authenticated";

grant references on table "public"."rd_subcomponents" to "authenticated";

grant select on table "public"."rd_subcomponents" to "authenticated";

grant trigger on table "public"."rd_subcomponents" to "authenticated";

grant truncate on table "public"."rd_subcomponents" to "authenticated";

grant update on table "public"."rd_subcomponents" to "authenticated";

grant delete on table "public"."rd_subcomponents" to "service_role";

grant insert on table "public"."rd_subcomponents" to "service_role";

grant references on table "public"."rd_subcomponents" to "service_role";

grant select on table "public"."rd_subcomponents" to "service_role";

grant trigger on table "public"."rd_subcomponents" to "service_role";

grant truncate on table "public"."rd_subcomponents" to "service_role";

grant update on table "public"."rd_subcomponents" to "service_role";

grant delete on table "public"."rd_supplies" to "anon";

grant insert on table "public"."rd_supplies" to "anon";

grant references on table "public"."rd_supplies" to "anon";

grant select on table "public"."rd_supplies" to "anon";

grant trigger on table "public"."rd_supplies" to "anon";

grant truncate on table "public"."rd_supplies" to "anon";

grant update on table "public"."rd_supplies" to "anon";

grant delete on table "public"."rd_supplies" to "authenticated";

grant insert on table "public"."rd_supplies" to "authenticated";

grant references on table "public"."rd_supplies" to "authenticated";

grant select on table "public"."rd_supplies" to "authenticated";

grant trigger on table "public"."rd_supplies" to "authenticated";

grant truncate on table "public"."rd_supplies" to "authenticated";

grant update on table "public"."rd_supplies" to "authenticated";

grant delete on table "public"."rd_supplies" to "service_role";

grant insert on table "public"."rd_supplies" to "service_role";

grant references on table "public"."rd_supplies" to "service_role";

grant select on table "public"."rd_supplies" to "service_role";

grant trigger on table "public"."rd_supplies" to "service_role";

grant truncate on table "public"."rd_supplies" to "service_role";

grant update on table "public"."rd_supplies" to "service_role";

grant delete on table "public"."rd_supply_subcomponents" to "anon";

grant insert on table "public"."rd_supply_subcomponents" to "anon";

grant references on table "public"."rd_supply_subcomponents" to "anon";

grant select on table "public"."rd_supply_subcomponents" to "anon";

grant trigger on table "public"."rd_supply_subcomponents" to "anon";

grant truncate on table "public"."rd_supply_subcomponents" to "anon";

grant update on table "public"."rd_supply_subcomponents" to "anon";

grant delete on table "public"."rd_supply_subcomponents" to "authenticated";

grant insert on table "public"."rd_supply_subcomponents" to "authenticated";

grant references on table "public"."rd_supply_subcomponents" to "authenticated";

grant select on table "public"."rd_supply_subcomponents" to "authenticated";

grant trigger on table "public"."rd_supply_subcomponents" to "authenticated";

grant truncate on table "public"."rd_supply_subcomponents" to "authenticated";

grant update on table "public"."rd_supply_subcomponents" to "authenticated";

grant delete on table "public"."rd_supply_subcomponents" to "service_role";

grant insert on table "public"."rd_supply_subcomponents" to "service_role";

grant references on table "public"."rd_supply_subcomponents" to "service_role";

grant select on table "public"."rd_supply_subcomponents" to "service_role";

grant trigger on table "public"."rd_supply_subcomponents" to "service_role";

grant truncate on table "public"."rd_supply_subcomponents" to "service_role";

grant update on table "public"."rd_supply_subcomponents" to "service_role";

grant delete on table "public"."rd_supply_year_data" to "anon";

grant insert on table "public"."rd_supply_year_data" to "anon";

grant references on table "public"."rd_supply_year_data" to "anon";

grant select on table "public"."rd_supply_year_data" to "anon";

grant trigger on table "public"."rd_supply_year_data" to "anon";

grant truncate on table "public"."rd_supply_year_data" to "anon";

grant update on table "public"."rd_supply_year_data" to "anon";

grant delete on table "public"."rd_supply_year_data" to "authenticated";

grant insert on table "public"."rd_supply_year_data" to "authenticated";

grant references on table "public"."rd_supply_year_data" to "authenticated";

grant select on table "public"."rd_supply_year_data" to "authenticated";

grant trigger on table "public"."rd_supply_year_data" to "authenticated";

grant truncate on table "public"."rd_supply_year_data" to "authenticated";

grant update on table "public"."rd_supply_year_data" to "authenticated";

grant delete on table "public"."rd_supply_year_data" to "service_role";

grant insert on table "public"."rd_supply_year_data" to "service_role";

grant references on table "public"."rd_supply_year_data" to "service_role";

grant select on table "public"."rd_supply_year_data" to "service_role";

grant trigger on table "public"."rd_supply_year_data" to "service_role";

grant truncate on table "public"."rd_supply_year_data" to "service_role";

grant update on table "public"."rd_supply_year_data" to "service_role";

grant delete on table "public"."reinsurance_details" to "anon";

grant insert on table "public"."reinsurance_details" to "anon";

grant references on table "public"."reinsurance_details" to "anon";

grant select on table "public"."reinsurance_details" to "anon";

grant trigger on table "public"."reinsurance_details" to "anon";

grant truncate on table "public"."reinsurance_details" to "anon";

grant update on table "public"."reinsurance_details" to "anon";

grant delete on table "public"."reinsurance_details" to "authenticated";

grant insert on table "public"."reinsurance_details" to "authenticated";

grant references on table "public"."reinsurance_details" to "authenticated";

grant select on table "public"."reinsurance_details" to "authenticated";

grant trigger on table "public"."reinsurance_details" to "authenticated";

grant truncate on table "public"."reinsurance_details" to "authenticated";

grant update on table "public"."reinsurance_details" to "authenticated";

grant delete on table "public"."reinsurance_details" to "service_role";

grant insert on table "public"."reinsurance_details" to "service_role";

grant references on table "public"."reinsurance_details" to "service_role";

grant select on table "public"."reinsurance_details" to "service_role";

grant trigger on table "public"."reinsurance_details" to "service_role";

grant truncate on table "public"."reinsurance_details" to "service_role";

grant update on table "public"."reinsurance_details" to "service_role";

grant delete on table "public"."research_activities" to "anon";

grant insert on table "public"."research_activities" to "anon";

grant references on table "public"."research_activities" to "anon";

grant select on table "public"."research_activities" to "anon";

grant trigger on table "public"."research_activities" to "anon";

grant truncate on table "public"."research_activities" to "anon";

grant update on table "public"."research_activities" to "anon";

grant delete on table "public"."research_activities" to "authenticated";

grant insert on table "public"."research_activities" to "authenticated";

grant references on table "public"."research_activities" to "authenticated";

grant select on table "public"."research_activities" to "authenticated";

grant trigger on table "public"."research_activities" to "authenticated";

grant truncate on table "public"."research_activities" to "authenticated";

grant update on table "public"."research_activities" to "authenticated";

grant delete on table "public"."research_activities" to "service_role";

grant insert on table "public"."research_activities" to "service_role";

grant references on table "public"."research_activities" to "service_role";

grant select on table "public"."research_activities" to "service_role";

grant trigger on table "public"."research_activities" to "service_role";

grant truncate on table "public"."research_activities" to "service_role";

grant update on table "public"."research_activities" to "service_role";

grant delete on table "public"."strategy_commission_rates" to "anon";

grant insert on table "public"."strategy_commission_rates" to "anon";

grant references on table "public"."strategy_commission_rates" to "anon";

grant select on table "public"."strategy_commission_rates" to "anon";

grant trigger on table "public"."strategy_commission_rates" to "anon";

grant truncate on table "public"."strategy_commission_rates" to "anon";

grant update on table "public"."strategy_commission_rates" to "anon";

grant delete on table "public"."strategy_commission_rates" to "authenticated";

grant insert on table "public"."strategy_commission_rates" to "authenticated";

grant references on table "public"."strategy_commission_rates" to "authenticated";

grant select on table "public"."strategy_commission_rates" to "authenticated";

grant trigger on table "public"."strategy_commission_rates" to "authenticated";

grant truncate on table "public"."strategy_commission_rates" to "authenticated";

grant update on table "public"."strategy_commission_rates" to "authenticated";

grant delete on table "public"."strategy_commission_rates" to "service_role";

grant insert on table "public"."strategy_commission_rates" to "service_role";

grant references on table "public"."strategy_commission_rates" to "service_role";

grant select on table "public"."strategy_commission_rates" to "service_role";

grant trigger on table "public"."strategy_commission_rates" to "service_role";

grant truncate on table "public"."strategy_commission_rates" to "service_role";

grant update on table "public"."strategy_commission_rates" to "service_role";

grant delete on table "public"."strategy_details" to "anon";

grant insert on table "public"."strategy_details" to "anon";

grant references on table "public"."strategy_details" to "anon";

grant select on table "public"."strategy_details" to "anon";

grant trigger on table "public"."strategy_details" to "anon";

grant truncate on table "public"."strategy_details" to "anon";

grant update on table "public"."strategy_details" to "anon";

grant delete on table "public"."strategy_details" to "authenticated";

grant insert on table "public"."strategy_details" to "authenticated";

grant references on table "public"."strategy_details" to "authenticated";

grant select on table "public"."strategy_details" to "authenticated";

grant trigger on table "public"."strategy_details" to "authenticated";

grant truncate on table "public"."strategy_details" to "authenticated";

grant update on table "public"."strategy_details" to "authenticated";

grant delete on table "public"."strategy_details" to "service_role";

grant insert on table "public"."strategy_details" to "service_role";

grant references on table "public"."strategy_details" to "service_role";

grant select on table "public"."strategy_details" to "service_role";

grant trigger on table "public"."strategy_details" to "service_role";

grant truncate on table "public"."strategy_details" to "service_role";

grant update on table "public"."strategy_details" to "service_role";

grant delete on table "public"."supply_expenses" to "anon";

grant insert on table "public"."supply_expenses" to "anon";

grant references on table "public"."supply_expenses" to "anon";

grant select on table "public"."supply_expenses" to "anon";

grant trigger on table "public"."supply_expenses" to "anon";

grant truncate on table "public"."supply_expenses" to "anon";

grant update on table "public"."supply_expenses" to "anon";

grant delete on table "public"."supply_expenses" to "authenticated";

grant insert on table "public"."supply_expenses" to "authenticated";

grant references on table "public"."supply_expenses" to "authenticated";

grant select on table "public"."supply_expenses" to "authenticated";

grant trigger on table "public"."supply_expenses" to "authenticated";

grant truncate on table "public"."supply_expenses" to "authenticated";

grant update on table "public"."supply_expenses" to "authenticated";

grant delete on table "public"."supply_expenses" to "service_role";

grant insert on table "public"."supply_expenses" to "service_role";

grant references on table "public"."supply_expenses" to "service_role";

grant select on table "public"."supply_expenses" to "service_role";

grant trigger on table "public"."supply_expenses" to "service_role";

grant truncate on table "public"."supply_expenses" to "service_role";

grant update on table "public"."supply_expenses" to "service_role";

grant delete on table "public"."tax_estimates" to "anon";

grant insert on table "public"."tax_estimates" to "anon";

grant references on table "public"."tax_estimates" to "anon";

grant select on table "public"."tax_estimates" to "anon";

grant trigger on table "public"."tax_estimates" to "anon";

grant truncate on table "public"."tax_estimates" to "anon";

grant update on table "public"."tax_estimates" to "anon";

grant delete on table "public"."tax_estimates" to "authenticated";

grant insert on table "public"."tax_estimates" to "authenticated";

grant references on table "public"."tax_estimates" to "authenticated";

grant select on table "public"."tax_estimates" to "authenticated";

grant trigger on table "public"."tax_estimates" to "authenticated";

grant truncate on table "public"."tax_estimates" to "authenticated";

grant update on table "public"."tax_estimates" to "authenticated";

grant delete on table "public"."tax_estimates" to "service_role";

grant insert on table "public"."tax_estimates" to "service_role";

grant references on table "public"."tax_estimates" to "service_role";

grant select on table "public"."tax_estimates" to "service_role";

grant trigger on table "public"."tax_estimates" to "service_role";

grant truncate on table "public"."tax_estimates" to "service_role";

grant update on table "public"."tax_estimates" to "service_role";

grant delete on table "public"."tax_profiles" to "anon";

grant insert on table "public"."tax_profiles" to "anon";

grant references on table "public"."tax_profiles" to "anon";

grant select on table "public"."tax_profiles" to "anon";

grant trigger on table "public"."tax_profiles" to "anon";

grant truncate on table "public"."tax_profiles" to "anon";

grant update on table "public"."tax_profiles" to "anon";

grant delete on table "public"."tax_profiles" to "authenticated";

grant insert on table "public"."tax_profiles" to "authenticated";

grant references on table "public"."tax_profiles" to "authenticated";

grant select on table "public"."tax_profiles" to "authenticated";

grant trigger on table "public"."tax_profiles" to "authenticated";

grant truncate on table "public"."tax_profiles" to "authenticated";

grant update on table "public"."tax_profiles" to "authenticated";

grant delete on table "public"."tax_profiles" to "service_role";

grant insert on table "public"."tax_profiles" to "service_role";

grant references on table "public"."tax_profiles" to "service_role";

grant select on table "public"."tax_profiles" to "service_role";

grant trigger on table "public"."tax_profiles" to "service_role";

grant truncate on table "public"."tax_profiles" to "service_role";

grant update on table "public"."tax_profiles" to "service_role";

grant delete on table "public"."tax_proposals" to "anon";

grant insert on table "public"."tax_proposals" to "anon";

grant references on table "public"."tax_proposals" to "anon";

grant select on table "public"."tax_proposals" to "anon";

grant trigger on table "public"."tax_proposals" to "anon";

grant truncate on table "public"."tax_proposals" to "anon";

grant update on table "public"."tax_proposals" to "anon";

grant delete on table "public"."tax_proposals" to "authenticated";

grant insert on table "public"."tax_proposals" to "authenticated";

grant references on table "public"."tax_proposals" to "authenticated";

grant select on table "public"."tax_proposals" to "authenticated";

grant trigger on table "public"."tax_proposals" to "authenticated";

grant truncate on table "public"."tax_proposals" to "authenticated";

grant update on table "public"."tax_proposals" to "authenticated";

grant delete on table "public"."tax_proposals" to "service_role";

grant insert on table "public"."tax_proposals" to "service_role";

grant references on table "public"."tax_proposals" to "service_role";

grant select on table "public"."tax_proposals" to "service_role";

grant trigger on table "public"."tax_proposals" to "service_role";

grant truncate on table "public"."tax_proposals" to "service_role";

grant update on table "public"."tax_proposals" to "service_role";

grant delete on table "public"."tool_enrollments" to "anon";

grant insert on table "public"."tool_enrollments" to "anon";

grant references on table "public"."tool_enrollments" to "anon";

grant select on table "public"."tool_enrollments" to "anon";

grant trigger on table "public"."tool_enrollments" to "anon";

grant truncate on table "public"."tool_enrollments" to "anon";

grant update on table "public"."tool_enrollments" to "anon";

grant delete on table "public"."tool_enrollments" to "authenticated";

grant insert on table "public"."tool_enrollments" to "authenticated";

grant references on table "public"."tool_enrollments" to "authenticated";

grant select on table "public"."tool_enrollments" to "authenticated";

grant trigger on table "public"."tool_enrollments" to "authenticated";

grant truncate on table "public"."tool_enrollments" to "authenticated";

grant update on table "public"."tool_enrollments" to "authenticated";

grant delete on table "public"."tool_enrollments" to "service_role";

grant insert on table "public"."tool_enrollments" to "service_role";

grant references on table "public"."tool_enrollments" to "service_role";

grant select on table "public"."tool_enrollments" to "service_role";

grant trigger on table "public"."tool_enrollments" to "service_role";

grant truncate on table "public"."tool_enrollments" to "service_role";

grant update on table "public"."tool_enrollments" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "Admins can manage all client files"
on "public"."admin_client_files"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Admins can view all client files"
on "public"."admin_client_files"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Users can manage their own client files"
on "public"."admin_client_files"
as permissive
for all
to public
using ((admin_id = auth.uid()));


create policy "Users can view their own client files"
on "public"."admin_client_files"
as permissive
for select
to public
using ((admin_id = auth.uid()));


create policy "Users can insert their own augusta rule details"
on "public"."augusta_rule_details"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = augusta_rule_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can update their own augusta rule details"
on "public"."augusta_rule_details"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = augusta_rule_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can view their own augusta rule details"
on "public"."augusta_rule_details"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = augusta_rule_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can delete business years for their businesses"
on "public"."business_years"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM (businesses
     JOIN clients ON ((businesses.client_id = clients.id)))
  WHERE ((businesses.id = business_years.business_id) AND (clients.created_by = auth.uid())))));


create policy "Users can insert business years for their businesses"
on "public"."business_years"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (businesses
     JOIN clients ON ((businesses.client_id = clients.id)))
  WHERE ((businesses.id = business_years.business_id) AND (clients.created_by = auth.uid())))));


create policy "Users can update business years for their businesses"
on "public"."business_years"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (businesses
     JOIN clients ON ((businesses.client_id = clients.id)))
  WHERE ((businesses.id = business_years.business_id) AND (clients.created_by = auth.uid())))));


create policy "Users can view business years for their businesses"
on "public"."business_years"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (businesses
     JOIN clients ON ((businesses.client_id = clients.id)))
  WHERE ((businesses.id = business_years.business_id) AND (clients.created_by = auth.uid())))));


create policy "Users can delete businesses for their clients"
on "public"."businesses"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = businesses.client_id) AND (clients.created_by = auth.uid())))));


create policy "Users can insert businesses for their clients"
on "public"."businesses"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = businesses.client_id) AND (clients.created_by = auth.uid())))));


create policy "Users can update businesses for their clients"
on "public"."businesses"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = businesses.client_id) AND (clients.created_by = auth.uid())))));


create policy "Users can view businesses for their clients"
on "public"."businesses"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = businesses.client_id) AND (clients.created_by = auth.uid())))));


create policy "Users can delete their own calculations"
on "public"."calculations"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own calculations"
on "public"."calculations"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own calculations"
on "public"."calculations"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own calculations"
on "public"."calculations"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete their own businesses"
on "public"."centralized_businesses"
as permissive
for delete
to public
using ((auth.uid() IS NOT NULL));


create policy "Users can insert their own businesses"
on "public"."centralized_businesses"
as permissive
for insert
to public
with check ((auth.uid() IS NOT NULL));


create policy "Users can update their own businesses"
on "public"."centralized_businesses"
as permissive
for update
to public
using ((auth.uid() IS NOT NULL));


create policy "Users can view their own businesses"
on "public"."centralized_businesses"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Users can insert their own charitable donation details"
on "public"."charitable_donation_details"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = charitable_donation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can update their own charitable donation details"
on "public"."charitable_donation_details"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = charitable_donation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can view their own charitable donation details"
on "public"."charitable_donation_details"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = charitable_donation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can delete their own clients"
on "public"."clients"
as permissive
for delete
to public
using ((auth.uid() = created_by));


create policy "Users can insert their own clients"
on "public"."clients"
as permissive
for insert
to public
with check ((auth.uid() = created_by));


create policy "Users can update their own clients"
on "public"."clients"
as permissive
for update
to public
using ((auth.uid() = created_by));


create policy "Users can view their own clients"
on "public"."clients"
as permissive
for select
to public
using ((auth.uid() = created_by));


create policy "Users can insert their own ctb details"
on "public"."convertible_tax_bonds_details"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = convertible_tax_bonds_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can update their own ctb details"
on "public"."convertible_tax_bonds_details"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = convertible_tax_bonds_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can view their own ctb details"
on "public"."convertible_tax_bonds_details"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = convertible_tax_bonds_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can insert their own cost segregation details"
on "public"."cost_segregation_details"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = cost_segregation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can update their own cost segregation details"
on "public"."cost_segregation_details"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = cost_segregation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can view their own cost segregation details"
on "public"."cost_segregation_details"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = cost_segregation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can insert their own hire children details"
on "public"."hire_children_details"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = hire_children_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can update their own hire children details"
on "public"."hire_children_details"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = hire_children_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Users can view their own hire children details"
on "public"."hire_children_details"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (strategy_details sd
     JOIN tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = hire_children_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


create policy "Admins can view all leads"
on "public"."leads"
as permissive
for select
to public
using (is_admin());


create policy "Users can insert own leads"
on "public"."leads"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own leads"
on "public"."leads"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own leads"
on "public"."leads"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete personal years for their clients"
on "public"."personal_years"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = personal_years.client_id) AND (clients.created_by = auth.uid())))));


create policy "Users can insert personal years for their clients"
on "public"."personal_years"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = personal_years.client_id) AND (clients.created_by = auth.uid())))));


create policy "Users can update personal years for their clients"
on "public"."personal_years"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = personal_years.client_id) AND (clients.created_by = auth.uid())))));


create policy "Users can view personal years for their clients"
on "public"."personal_years"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = personal_years.client_id) AND (clients.created_by = auth.uid())))));


create policy "Admins can view all profiles"
on "public"."profiles"
as permissive
for select
to public
using (is_admin());


create policy "Allow all select"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "Users can insert own profile"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can select their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Users can update own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Enable delete access for authenticated users"
on "public"."rd_contractor_subcomponents"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert access for authenticated users"
on "public"."rd_contractor_subcomponents"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable read access for authenticated users"
on "public"."rd_contractor_subcomponents"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable update access for authenticated users"
on "public"."rd_contractor_subcomponents"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Users can delete their own contractor subcomponents"
on "public"."rd_contractor_subcomponents"
as permissive
for delete
to public
using ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));


create policy "Users can insert their own contractor subcomponents"
on "public"."rd_contractor_subcomponents"
as permissive
for insert
to public
with check ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));


create policy "Users can update their own contractor subcomponents"
on "public"."rd_contractor_subcomponents"
as permissive
for update
to public
using ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));


create policy "Users can view their own contractor subcomponents"
on "public"."rd_contractor_subcomponents"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));


create policy "Allow all for dev"
on "public"."rd_contractor_year_data"
as permissive
for all
to public
using (true)
with check (true);


create policy "Users can delete their own contractor year data"
on "public"."rd_contractor_year_data"
as permissive
for delete
to public
using ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));


create policy "Users can insert their own contractor year data"
on "public"."rd_contractor_year_data"
as permissive
for insert
to public
with check ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));


create policy "Users can update their own contractor year data"
on "public"."rd_contractor_year_data"
as permissive
for update
to public
using ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));


create policy "Users can view their own contractor year data"
on "public"."rd_contractor_year_data"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));


create policy "Enable delete access for authenticated users"
on "public"."rd_contractors"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert access for authenticated users"
on "public"."rd_contractors"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable read access for authenticated users"
on "public"."rd_contractors"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable update access for authenticated users"
on "public"."rd_contractors"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable delete access for authenticated users"
on "public"."rd_employee_subcomponents"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert access for authenticated users"
on "public"."rd_employee_subcomponents"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable read access for authenticated users"
on "public"."rd_employee_subcomponents"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable update access for authenticated users"
on "public"."rd_employee_subcomponents"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable delete access for authenticated users"
on "public"."rd_expenses"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert access for authenticated users"
on "public"."rd_expenses"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable read access for authenticated users"
on "public"."rd_expenses"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable update access for authenticated users"
on "public"."rd_expenses"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Users can delete their own federal credit results"
on "public"."rd_federal_credit_results"
as permissive
for delete
to public
using ((auth.uid() IS NOT NULL));


create policy "Users can insert their own federal credit results"
on "public"."rd_federal_credit_results"
as permissive
for insert
to public
with check ((auth.uid() IS NOT NULL));


create policy "Users can update their own federal credit results"
on "public"."rd_federal_credit_results"
as permissive
for update
to public
using ((auth.uid() IS NOT NULL));


create policy "Users can view their own federal credit results"
on "public"."rd_federal_credit_results"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Allow read access to rd_research_steps"
on "public"."rd_research_steps"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow read access to rd_research_subcomponents"
on "public"."rd_research_subcomponents"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow all for authenticated"
on "public"."rd_selected_filter"
as permissive
for all
to public
using ((auth.uid() IS NOT NULL));


create policy "Enable delete for authenticated users only"
on "public"."rd_selected_steps"
as permissive
for delete
to public
using ((auth.uid() IS NOT NULL));


create policy "Enable insert for authenticated users only"
on "public"."rd_selected_steps"
as permissive
for insert
to public
with check ((auth.uid() IS NOT NULL));


create policy "Enable read access for all users"
on "public"."rd_selected_steps"
as permissive
for select
to public
using (true);


create policy "Enable update for authenticated users only"
on "public"."rd_selected_steps"
as permissive
for update
to public
using ((auth.uid() IS NOT NULL));


create policy "Enable delete access for authenticated users"
on "public"."rd_supplies"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert access for authenticated users"
on "public"."rd_supplies"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable read access for authenticated users"
on "public"."rd_supplies"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable update access for authenticated users"
on "public"."rd_supplies"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Users can delete their own supplies"
on "public"."rd_supplies"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));


create policy "Users can insert their own supplies"
on "public"."rd_supplies"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));


create policy "Users can update their own supplies"
on "public"."rd_supplies"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));


create policy "Users can view their own supplies"
on "public"."rd_supplies"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));


create policy "Users can delete their own supply subcomponents"
on "public"."rd_supply_subcomponents"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM (rd_supplies
     JOIN businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));


create policy "Users can insert their own supply subcomponents"
on "public"."rd_supply_subcomponents"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (rd_supplies
     JOIN businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));


create policy "Users can update their own supply subcomponents"
on "public"."rd_supply_subcomponents"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (rd_supplies
     JOIN businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));


create policy "Users can view their own supply subcomponents"
on "public"."rd_supply_subcomponents"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (rd_supplies
     JOIN businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));


create policy "Users can delete their own supply year data"
on "public"."rd_supply_year_data"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));


create policy "Users can insert their own supply year data"
on "public"."rd_supply_year_data"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));


create policy "Users can update their own supply year data"
on "public"."rd_supply_year_data"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));


create policy "Users can view their own supply year data"
on "public"."rd_supply_year_data"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));


create policy "Admins can insert strategy details"
on "public"."strategy_details"
as permissive
for insert
to public
with check (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "Admins can update strategy details"
on "public"."strategy_details"
as permissive
for update
to public
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "Admins can view all strategy details"
on "public"."strategy_details"
as permissive
for select
to public
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "Users can insert their own strategy details"
on "public"."strategy_details"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM tax_proposals tp
  WHERE ((tp.id = strategy_details.proposal_id) AND (tp.user_id = auth.uid())))));


create policy "Users can update their own strategy details"
on "public"."strategy_details"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM tax_proposals tp
  WHERE ((tp.id = strategy_details.proposal_id) AND (tp.user_id = auth.uid())))));


create policy "Users can view their own strategy details"
on "public"."strategy_details"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM tax_proposals tp
  WHERE ((tp.id = strategy_details.proposal_id) AND (tp.user_id = auth.uid())))));


create policy "Admins can insert tax profiles"
on "public"."tax_profiles"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Admins can view all tax profiles"
on "public"."tax_profiles"
as permissive
for select
to public
using (is_admin());


create policy "Users can delete their own tax profile"
on "public"."tax_profiles"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Users can insert own tax profiles"
on "public"."tax_profiles"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can insert their own tax profile"
on "public"."tax_profiles"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can select their own tax profile"
on "public"."tax_profiles"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can update own tax profiles"
on "public"."tax_profiles"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can update their own tax profile"
on "public"."tax_profiles"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view own tax profiles"
on "public"."tax_profiles"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Admins can view all tax proposals"
on "public"."tax_proposals"
as permissive
for select
to public
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "Allow all delete for dev"
on "public"."tax_proposals"
as permissive
for delete
to public
using (true);


create policy "Allow all insert for dev"
on "public"."tax_proposals"
as permissive
for insert
to public
with check (true);


create policy "Allow all select for debug"
on "public"."tax_proposals"
as permissive
for select
to public
using (true);


create policy "Allow all select for dev"
on "public"."tax_proposals"
as permissive
for select
to public
using (true);


create policy "Allow all update for dev"
on "public"."tax_proposals"
as permissive
for update
to public
using (true);


create policy "Users can insert their own tax proposals"
on "public"."tax_proposals"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own tax proposals"
on "public"."tax_proposals"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own tax proposals"
on "public"."tax_proposals"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Admins can manage all tool enrollments"
on "public"."tool_enrollments"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Admins can view all tool enrollments"
on "public"."tool_enrollments"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Users can manage their own tool enrollments"
on "public"."tool_enrollments"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM admin_client_files acf
  WHERE ((acf.id = tool_enrollments.client_file_id) AND (acf.admin_id = auth.uid())))));


create policy "Users can view their own tool enrollments"
on "public"."tool_enrollments"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM admin_client_files acf
  WHERE ((acf.id = tool_enrollments.client_file_id) AND (acf.admin_id = auth.uid())))));


create policy "Admins can view all user preferences"
on "public"."user_preferences"
as permissive
for select
to public
using (is_admin());


create policy "Users can insert own user preferences"
on "public"."user_preferences"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can insert their own preferences"
on "public"."user_preferences"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own user preferences"
on "public"."user_preferences"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own user preferences"
on "public"."user_preferences"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER handle_rd_contractor_subcomponents_updated_at BEFORE UPDATE ON public.rd_contractor_subcomponents FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_rd_contractor_year_data_updated_at BEFORE UPDATE ON public.rd_contractor_year_data FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_rd_federal_credit_results_updated_at BEFORE UPDATE ON public.rd_federal_credit_results FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_rd_state_calculations_updated_at BEFORE UPDATE ON public.rd_state_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_rd_supplies BEFORE UPDATE ON public.rd_supplies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER handle_rd_supply_subcomponents_updated_at BEFORE UPDATE ON public.rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_rd_supply_subcomponents BEFORE UPDATE ON public.rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER handle_rd_supply_year_data_updated_at BEFORE UPDATE ON public.rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_rd_supply_year_data BEFORE UPDATE ON public.rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_create_strategy_details AFTER INSERT ON public.tax_proposals FOR EACH ROW EXECUTE FUNCTION create_strategy_details_for_proposal();


