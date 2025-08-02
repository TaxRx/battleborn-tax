-- Complete and accurate CREATE migration for all rd_* tables
-- Generated from remote schema dump to ensure 100% accuracy
-- This replaces the incomplete migration

-- Create required enum types used by rd_* tables and related functionality
-- Note: entity_type may already exist for other tables, so use IF NOT EXISTS
DO $$ BEGIN
    CREATE TYPE public.entity_type AS ENUM (
        'LLC',
        'SCORP',
        'CCORP',
        'PARTNERSHIP',
        'SOLEPROP',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.rd_report_type AS ENUM (
        'RESEARCH_DESIGN',
        'RESEARCH_SUMMARY',
        'FILING_GUIDE'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.qc_status_enum AS ENUM (
        'pending',
        'in_review',
        'ready_for_review',
        'approved',
        'requires_changes',
        'complete'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Table 1/43
CREATE TABLE public.rd_areas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text
);

-- Table 2/43
CREATE TABLE public.rd_focuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    area_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text
);

-- Table 3/43
CREATE TABLE public.rd_research_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    deactivated_at timestamp without time zone,
    deactivation_reason text,
    business_id uuid
);

-- Table 4/43
CREATE TABLE public.rd_research_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text
);

-- Table 5/43
CREATE TABLE public.rd_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    alternative_paths text
);

-- Table 6/43
CREATE TABLE public.rd_billable_time_summary (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    subcomponent_id uuid,
    total_procedures_count integer DEFAULT 0,
    total_billed_units integer DEFAULT 0,
    total_billed_amount numeric(15,2) DEFAULT 0,
    estimated_total_time_hours numeric(10,2) DEFAULT 0,
    current_practice_percentage numeric(5,2),
    calculated_billable_percentage numeric(5,2),
    recommended_percentage numeric(5,2),
    percentage_variance numeric(5,2),
    last_calculated timestamp without time zone DEFAULT now(),
    calculation_source text DEFAULT 'ai_analysis'::text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Table 7/43
CREATE TABLE public.rd_business_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    year integer NOT NULL,
    gross_receipts numeric(15,2) NOT NULL,
    total_qre numeric(15,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    qc_status character varying(50) DEFAULT 'pending'::character varying,
    qc_approved_by uuid,
    qc_approved_at timestamp without time zone,
    payment_received boolean DEFAULT false,
    payment_received_at timestamp without time zone,
    qc_notes text,
    payment_amount numeric(15,2),
    documents_released boolean DEFAULT false,
    documents_released_at timestamp without time zone,
    documents_released_by uuid,
    employee_qre numeric(15,2) DEFAULT 0,
    contractor_qre numeric(15,2) DEFAULT 0,
    supply_qre numeric(15,2) DEFAULT 0,
    qre_locked boolean DEFAULT false,
    federal_credit numeric(15,2) DEFAULT 0,
    state_credit numeric(15,2) DEFAULT 0,
    credits_locked boolean DEFAULT false,
    credits_calculated_at timestamp with time zone,
    credits_locked_by uuid,
    credits_locked_at timestamp with time zone,
    business_setup_completed boolean DEFAULT false,
    business_setup_completed_at timestamp with time zone,
    business_setup_completed_by uuid,
    research_activities_completed boolean DEFAULT false,
    research_activities_completed_at timestamp with time zone,
    research_activities_completed_by uuid,
    research_design_completed boolean DEFAULT false,
    research_design_completed_at timestamp with time zone,
    research_design_completed_by uuid,
    calculations_completed boolean DEFAULT false,
    calculations_completed_at timestamp with time zone,
    calculations_completed_by uuid,
    overall_completion_percentage integer DEFAULT 0,
    last_step_completed text,
    completion_updated_at timestamp with time zone DEFAULT now()
);

-- Table 8/43
CREATE TABLE public.rd_businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    ein text,
    start_year integer NOT NULL,
    domicile_state text NOT NULL,
    contact_info jsonb NOT NULL,
    is_controlled_grp boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    historical_data jsonb DEFAULT '[]'::jsonb NOT NULL,
    website text,
    image_path text,
    entity_type public.entity_type DEFAULT 'OTHER'::public.entity_type NOT NULL,
    naics character varying(10),
    category_id uuid,
    github_token text,
    portal_email text,
    CONSTRAINT check_historical_data_structure CHECK (public.validate_historical_data(historical_data))
);

-- Table 9/43
CREATE TABLE public.rd_client_portal_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    token character varying(255),
    expires_at timestamp without time zone,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now(),
    access_count integer DEFAULT 0,
    last_accessed_at timestamp without time zone,
    last_accessed_ip inet
);

-- Table 10/43
CREATE TABLE public.rd_contractor_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contractor_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    time_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    applied_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    baseline_applied_percent numeric(5,2) DEFAULT 0 NOT NULL,
    practice_percentage numeric(5,2),
    year_percentage numeric(5,2),
    frequency_percentage numeric(5,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    baseline_practice_percentage numeric,
    baseline_time_percentage numeric
);

-- Table 11/43
CREATE TABLE public.rd_contractor_year_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    name text NOT NULL,
    cost_amount numeric(15,2) NOT NULL,
    applied_percent numeric(5,2) NOT NULL,
    activity_link jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    contractor_id uuid,
    user_id uuid,
    activity_roles jsonb,
    calculated_qre numeric
);

-- Table 12/43
CREATE TABLE public.rd_contractors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    role text,
    annual_cost numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    first_name text,
    last_name text,
    role_id uuid,
    is_owner boolean DEFAULT false,
    amount numeric(15,2),
    calculated_qre numeric(15,2)
);

-- Table 13/43
CREATE TABLE public.rd_document_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    link_type text NOT NULL,
    supply_id uuid,
    contractor_id uuid,
    amount_allocated numeric(15,2),
    allocation_percentage numeric(5,2),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rd_document_links_link_type_check CHECK ((link_type = ANY (ARRAY['supply'::text, 'contractor'::text]))),
    CONSTRAINT valid_link CHECK ((((link_type = 'supply'::text) AND (supply_id IS NOT NULL) AND (contractor_id IS NULL)) OR ((link_type = 'contractor'::text) AND (contractor_id IS NOT NULL) AND (supply_id IS NULL))))
);

-- Table 14/43
CREATE TABLE public.rd_employee_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    time_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    applied_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    baseline_applied_percent numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    practice_percentage numeric,
    year_percentage numeric,
    frequency_percentage numeric,
    baseline_practice_percentage numeric,
    baseline_time_percentage numeric,
    user_id uuid
);

-- Table 15/43
CREATE TABLE public.rd_employee_year_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    applied_percent numeric(5,2) NOT NULL,
    calculated_qre numeric(15,2) NOT NULL,
    activity_roles jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    type text
);

-- Table 16/43
CREATE TABLE public.rd_employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    first_name text NOT NULL,
    role_id uuid,
    is_owner boolean DEFAULT false,
    annual_wage numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_name text,
    user_id uuid
);

-- Table 17/43
CREATE TABLE public.rd_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    step_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    employee_id uuid,
    contractor_id uuid,
    supply_id uuid,
    category text NOT NULL,
    first_name text,
    last_name text,
    role_name text,
    supply_name text,
    research_activity_title text NOT NULL,
    research_activity_practice_percent numeric(5,2) NOT NULL,
    step_name text NOT NULL,
    subcomponent_title text NOT NULL,
    subcomponent_year_percent numeric(5,2) NOT NULL,
    subcomponent_frequency_percent numeric(5,2) NOT NULL,
    subcomponent_time_percent numeric(5,2) NOT NULL,
    total_cost numeric(10,2) NOT NULL,
    applied_percent numeric(5,2) NOT NULL,
    baseline_applied_percent numeric(5,2) NOT NULL,
    employee_practice_percent numeric(5,2),
    employee_time_percent numeric(5,2),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rd_expenses_category_check CHECK ((category = ANY (ARRAY['Employee'::text, 'Contractor'::text, 'Supply'::text])))
);

-- Table 18/43
CREATE TABLE public.rd_federal_credit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    client_id uuid NOT NULL,
    research_activity_id uuid,
    research_activity_name text,
    direct_research_wages numeric(15,2) DEFAULT 0,
    supplies_expenses numeric(15,2) DEFAULT 0,
    contractor_expenses numeric(15,2) DEFAULT 0,
    total_qre numeric(15,2) DEFAULT 0,
    subcomponent_count integer DEFAULT 0,
    subcomponent_groups text,
    applied_percent numeric(5,2) DEFAULT 0,
    line_49f_description text,
    ai_generation_timestamp timestamp without time zone,
    ai_prompt_used text,
    ai_response_raw text,
    federal_credit_amount numeric(15,2) DEFAULT 0,
    federal_credit_percentage numeric(5,2) DEFAULT 0,
    calculation_method text,
    industry_type text,
    focus_area text,
    general_description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    version integer DEFAULT 1,
    is_latest boolean DEFAULT true,
    previous_version_id uuid,
    calculation_timestamp timestamp without time zone DEFAULT now(),
    data_snapshot jsonb,
    notes text,
    CONSTRAINT valid_amounts CHECK (((direct_research_wages >= (0)::numeric) AND (supplies_expenses >= (0)::numeric) AND (contractor_expenses >= (0)::numeric))),
    CONSTRAINT valid_percentages CHECK (((applied_percent >= (0)::numeric) AND (applied_percent <= (100)::numeric))),
    CONSTRAINT valid_subcomponent_count CHECK ((subcomponent_count >= 0))
);

-- Table 19/43
CREATE TABLE public.rd_federal_credit_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    standard_credit numeric(15,2),
    standard_adjusted_credit numeric(15,2),
    standard_base_percentage numeric(5,4),
    standard_fixed_base_amount numeric(15,2),
    standard_incremental_qre numeric(15,2),
    standard_is_eligible boolean DEFAULT false,
    standard_missing_data jsonb,
    asc_credit numeric(15,2),
    asc_adjusted_credit numeric(15,2),
    asc_avg_prior_qre numeric(15,2),
    asc_incremental_qre numeric(15,2),
    asc_is_startup boolean DEFAULT false,
    asc_missing_data jsonb,
    selected_method text,
    use_280c boolean DEFAULT false,
    corporate_tax_rate numeric(5,4) DEFAULT 0.21,
    total_federal_credit numeric(15,2),
    total_state_credits numeric(15,2),
    total_credits numeric(15,2),
    calculation_date timestamp with time zone DEFAULT now(),
    qre_breakdown jsonb,
    historical_data jsonb,
    state_credits jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rd_federal_credit_results_selected_method_check CHECK ((selected_method = ANY (ARRAY['standard'::text, 'asc'::text])))
);

-- Table 20/43
CREATE TABLE public.rd_procedure_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    procedure_code text NOT NULL,
    procedure_description text,
    procedure_category text,
    billed_units integer DEFAULT 0,
    billed_amount numeric(15,2) DEFAULT 0,
    frequency_annual integer,
    ai_confidence_score numeric(3,2),
    extraction_method text DEFAULT 'ai'::text,
    raw_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rd_procedure_analysis_ai_confidence_score_check CHECK (((ai_confidence_score >= (0)::numeric) AND (ai_confidence_score <= (1)::numeric))),
    CONSTRAINT rd_procedure_analysis_extraction_method_check CHECK ((extraction_method = ANY (ARRAY['ai'::text, 'manual'::text])))
);

-- Table 21/43
CREATE TABLE public.rd_procedure_research_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    procedure_analysis_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    subcomponent_id uuid,
    allocation_percentage numeric(5,2) NOT NULL,
    estimated_research_time_hours numeric(10,2),
    ai_reasoning text,
    ai_confidence_score numeric(3,2),
    status text DEFAULT 'pending'::text,
    manual_override boolean DEFAULT false,
    approved_by uuid,
    approval_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rd_procedure_research_links_ai_confidence_score_check CHECK (((ai_confidence_score >= (0)::numeric) AND (ai_confidence_score <= (1)::numeric))),
    CONSTRAINT rd_procedure_research_links_allocation_percentage_check CHECK (((allocation_percentage > (0)::numeric) AND (allocation_percentage <= (100)::numeric))),
    CONSTRAINT rd_procedure_research_links_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'modified'::text])))
);

-- Table 22/43
CREATE TABLE public.rd_qc_document_controls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    document_type character varying(50) NOT NULL,
    is_released boolean DEFAULT false,
    released_at timestamp without time zone,
    released_by uuid,
    release_notes text,
    requires_jurat boolean DEFAULT false,
    requires_payment boolean DEFAULT false,
    qc_reviewer uuid,
    qc_reviewed_at timestamp without time zone,
    qc_review_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    qc_approver_name text,
    qc_approver_credentials text,
    qc_approved_date timestamp with time zone,
    qc_approver_ip_address text
);

-- Table 23/43
CREATE TABLE public.rd_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    business_year_id uuid,
    type public.rd_report_type NOT NULL,
    generated_text text NOT NULL,
    editable_text text,
    ai_version text NOT NULL,
    locked boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    generated_html text,
    filing_guide text,
    state_gross_receipts jsonb DEFAULT '{}'::jsonb,
    qc_approved_by text,
    qc_approved_at timestamp with time zone,
    qc_approver_ip text
);

-- Table 24/43
CREATE TABLE public.rd_research_raw (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    uploaded_at timestamp with time zone DEFAULT now()
);

-- Table 25/43
CREATE TABLE public.rd_research_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    research_activity_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    step_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    deactivated_at timestamp without time zone,
    deactivation_reason text,
    business_id uuid
);

-- Table 26/43
CREATE TABLE public.rd_research_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    step_id uuid NOT NULL,
    name character varying(255) NOT NULL,
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
    is_active boolean DEFAULT true,
    deactivated_at timestamp without time zone,
    deactivation_reason text,
    business_id uuid
);

-- Table 27/43
CREATE TABLE public.rd_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    parent_id uuid,
    is_default boolean DEFAULT false,
    business_year_id uuid,
    baseline_applied_percent numeric,
    type text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table 28/43
CREATE TABLE public.rd_selected_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    practice_percent numeric(5,2) NOT NULL,
    selected_roles jsonb NOT NULL,
    config jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    research_guidelines jsonb,
    is_enabled boolean DEFAULT true NOT NULL,
    activity_title_snapshot text,
    activity_category_snapshot text
);

-- Table 29/43
CREATE TABLE public.rd_selected_filter (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    selected_categories text[] DEFAULT '{}'::text[],
    selected_areas text[] DEFAULT '{}'::text[],
    selected_focuses text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table 30/43
CREATE TABLE public.rd_selected_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    step_id uuid NOT NULL,
    time_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    applied_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    non_rd_percentage numeric(5,2) DEFAULT 0,
    CONSTRAINT rd_selected_steps_non_rd_percentage_check CHECK (((non_rd_percentage >= (0)::numeric) AND (non_rd_percentage <= (100)::numeric)))
);

-- Table 31/43
CREATE TABLE public.rd_selected_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    step_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    frequency_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    year_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    start_month integer DEFAULT 1 NOT NULL,
    start_year integer NOT NULL,
    selected_roles jsonb DEFAULT '[]'::jsonb NOT NULL,
    non_rd_percentage numeric(5,2) DEFAULT 0 NOT NULL,
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
    practice_percent numeric(5,2) DEFAULT 0,
    subcomponent_name_snapshot text,
    step_name_snapshot text
);

-- Table 32/43
CREATE TABLE public.rd_signature_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    signer_name text NOT NULL,
    signature_image text NOT NULL,
    ip_address text NOT NULL,
    signed_at timestamp with time zone NOT NULL,
    jurat_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    signer_title text,
    signer_email text
);

-- Table 33/43
CREATE TABLE public.rd_signatures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid,
    signature_type character varying(50),
    signed_by character varying(255),
    signed_at timestamp without time zone,
    signature_data jsonb,
    ip_address inet,
    created_at timestamp without time zone DEFAULT now()
);

-- Table 34/43
CREATE TABLE public.rd_state_calculations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state character varying(2) NOT NULL,
    calculation_method text NOT NULL,
    refundable text,
    carryforward text,
    eligible_entities text[],
    calculation_formula text NOT NULL,
    special_notes text,
    start_year numeric NOT NULL,
    end_year numeric,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    formula_correct text
);

-- Table 35/43
CREATE TABLE public.rd_state_calculations_full (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state character varying(2) NOT NULL,
    calculation_method text,
    refundable text,
    carryforward text,
    eligible_entities text,
    special_notes text,
    start_year text,
    formula_correct text,
    standard_credit_formula text,
    alternate_credit_formula text,
    additional_credit_formula text,
    end_year text,
    standard_info text,
    alternative_info text,
    other_info text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table 36/43
CREATE TABLE public.rd_state_credit_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_code character varying(2) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Table 37/43
CREATE TABLE public.rd_state_proforma_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    state_code character varying(2) NOT NULL,
    method character varying(20) NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rd_state_proforma_data_method_check CHECK (((method)::text = ANY ((ARRAY['standard'::character varying, 'alternative'::character varying])::text[])))
);

-- Table 38/43
CREATE TABLE public.rd_state_proforma_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_proforma_id uuid NOT NULL,
    line_number character varying(10) NOT NULL,
    description text NOT NULL,
    amount numeric(15,2) DEFAULT 0,
    is_editable boolean DEFAULT true,
    is_calculated boolean DEFAULT false,
    calculation_formula text,
    line_type character varying(50),
    sort_order integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Table 39/43
CREATE TABLE public.rd_state_proformas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    state_code character varying(2) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    total_credit numeric(15,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Table 40/43
CREATE TABLE public.rd_supplies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    annual_cost numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table 41/43
CREATE TABLE public.rd_supply_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supply_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    applied_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    amount_applied numeric
);

-- Table 42/43
CREATE TABLE public.rd_supply_year_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    name text NOT NULL,
    cost_amount numeric(15,2) NOT NULL,
    applied_percent numeric(5,2) NOT NULL,
    activity_link jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    supply_id uuid,
    calculated_qre numeric(15,2)
);

-- Table 43/43
CREATE TABLE public.rd_support_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    document_type text NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    mime_type text,
    upload_date timestamp without time zone DEFAULT now(),
    uploaded_by uuid,
    processing_status text DEFAULT 'pending'::text,
    ai_analysis jsonb,
    metadata jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rd_support_documents_document_type_check CHECK ((document_type = ANY (ARRAY['invoice'::text, '1099'::text, 'procedure_report'::text]))),
    CONSTRAINT rd_support_documents_processing_status_check CHECK ((processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'manual_review'::text])))
);


-- Add primary key constraints for all rd_* tables
-- These are required for foreign key relationships

ALTER TABLE ONLY public.rd_areas ADD CONSTRAINT rd_areas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_billable_time_summary ADD CONSTRAINT rd_billable_time_summary_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_business_years ADD CONSTRAINT rd_business_years_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_businesses ADD CONSTRAINT rd_businesses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_client_portal_tokens ADD CONSTRAINT rd_client_portal_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_contractor_subcomponents ADD CONSTRAINT rd_contractor_subcomponents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_contractor_year_data ADD CONSTRAINT rd_contractor_year_data_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_contractors ADD CONSTRAINT rd_contractors_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_document_links ADD CONSTRAINT rd_document_links_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_employee_subcomponents ADD CONSTRAINT rd_employee_subcomponents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_employee_year_data ADD CONSTRAINT rd_employee_year_data_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_employees ADD CONSTRAINT rd_employees_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_expenses ADD CONSTRAINT rd_expenses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_federal_credit ADD CONSTRAINT rd_federal_credit_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_federal_credit_results ADD CONSTRAINT rd_federal_credit_results_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_focuses ADD CONSTRAINT rd_focuses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_procedure_analysis ADD CONSTRAINT rd_procedure_analysis_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_procedure_research_links ADD CONSTRAINT rd_procedure_research_links_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_qc_document_controls ADD CONSTRAINT rd_qc_document_controls_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_reports ADD CONSTRAINT rd_reports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_research_activities ADD CONSTRAINT rd_research_activities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_research_categories ADD CONSTRAINT rd_research_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_research_raw ADD CONSTRAINT rd_research_raw_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_research_steps ADD CONSTRAINT rd_research_steps_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_research_subcomponents ADD CONSTRAINT rd_research_subcomponents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_roles ADD CONSTRAINT rd_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_selected_activities ADD CONSTRAINT rd_selected_activities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_selected_filter ADD CONSTRAINT rd_selected_filter_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_selected_steps ADD CONSTRAINT rd_selected_steps_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_selected_subcomponents ADD CONSTRAINT rd_selected_subcomponents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_signature_records ADD CONSTRAINT rd_signature_records_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_signatures ADD CONSTRAINT rd_signatures_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_state_calculations ADD CONSTRAINT rd_state_calculations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_state_calculations_full ADD CONSTRAINT rd_state_calculations_full_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_state_credit_configs ADD CONSTRAINT rd_state_credit_configs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_state_proforma_data ADD CONSTRAINT rd_state_proforma_data_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_state_proforma_lines ADD CONSTRAINT rd_state_proforma_lines_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_state_proformas ADD CONSTRAINT rd_state_proformas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_subcomponents ADD CONSTRAINT rd_subcomponents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_supplies ADD CONSTRAINT rd_supplies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_supply_subcomponents ADD CONSTRAINT rd_supply_subcomponents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_supply_year_data ADD CONSTRAINT rd_supply_year_data_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rd_support_documents ADD CONSTRAINT rd_support_documents_pkey PRIMARY KEY (id);
