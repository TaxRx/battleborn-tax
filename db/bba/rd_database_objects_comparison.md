# RD_* Database Objects Comparison Report

Generated on: 2025-07-31 09:04:07

## Summary

| Object Type | Total | Same | Different | Remote Only | Local Only |
|-------------|-------|------|-----------|-------------|------------|
| Tables | 43 | 0 | 0 | 43 | 0 |
| Functions | 1 | 0 | 0 | 0 | 1 |
| Triggers | 19 | 0 | 9 | 10 | 0 |
| Policies | 53 | 0 | 0 | 53 | 0 |
| Indexes | 157 | 0 | 43 | 53 | 61 |
| Views | 3 | 0 | 0 | 3 | 0 |
| Sequences | 0 | 0 | 0 | 0 | 0 |

## Tables

### ➕ Remote Only (43)

#### `rd_selected_activities`

```sql
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
```

#### `rd_subcomponents`

```sql
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
```

#### `rd_research_subcomponents`

```sql
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
```

#### `rd_supply_year_data`

```sql
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
```

#### `rd_client_portal_tokens`

```sql
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
```

#### `rd_federal_credit_results`

```sql
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
```

#### `rd_state_proforma_data`

```sql
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
```

#### `rd_selected_filter`

```sql
CREATE TABLE public.rd_selected_filter (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    selected_categories text[] DEFAULT '{}'::text[],
    selected_areas text[] DEFAULT '{}'::text[],
    selected_focuses text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### `rd_supply_subcomponents`

```sql
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
```

#### `rd_support_documents`

```sql
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
```

#### `rd_state_proforma_lines`

```sql
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
```

#### `rd_signatures`

```sql
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
```

#### `rd_procedure_analysis`

```sql
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
```

#### `rd_contractor_subcomponents`

```sql
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
```

#### `rd_businesses`

```sql
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
```

#### `rd_contractors`

```sql
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
```

#### `rd_employee_year_data`

```sql
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
```

#### `rd_research_categories`

```sql
CREATE TABLE public.rd_research_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text
);
```

#### `rd_supplies`

```sql
CREATE TABLE public.rd_supplies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    annual_cost numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### `rd_procedure_research_links`

```sql
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
```

#### `rd_selected_steps`

```sql
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
```

#### `rd_state_calculations`

```sql
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
```

#### `rd_research_activities`

```sql
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
```

#### `rd_focuses`

```sql
CREATE TABLE public.rd_focuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    area_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text
);
```

#### `rd_business_years`

```sql
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
```

#### `rd_areas`

```sql
CREATE TABLE public.rd_areas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text
);
```

#### `rd_federal_credit`

```sql
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
```

#### `rd_document_links`

```sql
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
```

#### `rd_research_steps`

```sql
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
```

#### `rd_signature_records`

```sql
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
```

#### `rd_roles`

```sql
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
```

#### `rd_billable_time_summary`

```sql
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
```

#### `rd_state_proformas`

```sql
CREATE TABLE public.rd_state_proformas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    state_code character varying(2) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    total_credit numeric(15,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
```

#### `rd_qc_document_controls`

```sql
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
```

#### `rd_reports`

```sql
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
```

#### `rd_contractor_year_data`

```sql
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
```

#### `rd_employee_subcomponents`

```sql
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
```

#### `rd_state_credit_configs`

```sql
CREATE TABLE public.rd_state_credit_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_code character varying(2) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
```

#### `rd_selected_subcomponents`

```sql
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
```

#### `rd_state_calculations_full`

```sql
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
```

#### `rd_expenses`

```sql
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
```

#### `rd_research_raw`

```sql
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
```

#### `rd_employees`

```sql
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
```


## Functions

### ➖ Local Only (1)

#### `calculate_dashboard_metrics`

```sql
CREATE OR REPLACE FUNCTION public.calculate_dashboard_metrics(p_client_id uuid)                        +
```


## Triggers

### 🔄 Different (9)

#### `set_updated_at_rd_supplies`

**Remote:**
```sql
CREATE TRIGGER set_updated_at_rd_supplies BEFORE UPDATE ON public.rd_supplies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**Local:**
```sql
CREATE TRIGGER set_updated_at_rd_supplies BEFORE UPDATE ON public.rd_supplies FOR EACH ROW EXECUTE FUNCTION set_updated_at()
```

#### `handle_rd_contractor_subcomponents_updated_at`

**Remote:**
```sql
CREATE TRIGGER handle_rd_contractor_subcomponents_updated_at BEFORE UPDATE ON public.rd_contractor_subcomponents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

**Local:**
```sql
CREATE TRIGGER handle_rd_contractor_subcomponents_updated_at BEFORE UPDATE ON public.rd_contractor_subcomponents FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
```

#### `handle_rd_federal_credit_results_updated_at`

**Remote:**
```sql
CREATE TRIGGER handle_rd_federal_credit_results_updated_at BEFORE UPDATE ON public.rd_federal_credit_results FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

**Local:**
```sql
CREATE TRIGGER handle_rd_federal_credit_results_updated_at BEFORE UPDATE ON public.rd_federal_credit_results FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
```

#### `handle_rd_contractor_year_data_updated_at`

**Remote:**
```sql
CREATE TRIGGER handle_rd_contractor_year_data_updated_at BEFORE UPDATE ON public.rd_contractor_year_data FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

**Local:**
```sql
CREATE TRIGGER handle_rd_contractor_year_data_updated_at BEFORE UPDATE ON public.rd_contractor_year_data FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
```

#### `handle_rd_supply_subcomponents_updated_at`

**Remote:**
```sql
CREATE TRIGGER handle_rd_supply_subcomponents_updated_at BEFORE UPDATE ON public.rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

**Local:**
```sql
CREATE TRIGGER handle_rd_supply_subcomponents_updated_at BEFORE UPDATE ON public.rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
```

#### `set_updated_at_rd_supply_subcomponents`

**Remote:**
```sql
CREATE TRIGGER set_updated_at_rd_supply_subcomponents BEFORE UPDATE ON public.rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**Local:**
```sql
CREATE TRIGGER set_updated_at_rd_supply_subcomponents BEFORE UPDATE ON public.rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION set_updated_at()
```

#### `set_updated_at_rd_supply_year_data`

**Remote:**
```sql
CREATE TRIGGER set_updated_at_rd_supply_year_data BEFORE UPDATE ON public.rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**Local:**
```sql
CREATE TRIGGER set_updated_at_rd_supply_year_data BEFORE UPDATE ON public.rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION set_updated_at()
```

#### `handle_rd_supply_year_data_updated_at`

**Remote:**
```sql
CREATE TRIGGER handle_rd_supply_year_data_updated_at BEFORE UPDATE ON public.rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

**Local:**
```sql
CREATE TRIGGER handle_rd_supply_year_data_updated_at BEFORE UPDATE ON public.rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
```

#### `update_rd_state_calculations_updated_at`

**Remote:**
```sql
CREATE TRIGGER update_rd_state_calculations_updated_at BEFORE UPDATE ON public.rd_state_calculations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**Local:**
```sql
CREATE TRIGGER update_rd_state_calculations_updated_at BEFORE UPDATE ON public.rd_state_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
```

### ➕ Remote Only (10)

#### `trigger_update_step_name`

```sql
CREATE TRIGGER trigger_update_step_name AFTER INSERT ON public.rd_selected_subcomponents FOR EACH ROW EXECUTE FUNCTION public.update_selected_subcomponent_step_name();
```

#### `trigger_update_rd_state_proforma_data_updated_at`

```sql
CREATE TRIGGER trigger_update_rd_state_proforma_data_updated_at BEFORE UPDATE ON public.rd_state_proforma_data FOR EACH ROW EXECUTE FUNCTION public.update_rd_state_proforma_data_updated_at();
```

#### `trigger_update_total_qre`

```sql
CREATE TRIGGER trigger_update_total_qre BEFORE INSERT OR UPDATE OF employee_qre, contractor_qre, supply_qre ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_total_qre();
```

#### `trigger_update_completion_percentage`

```sql
CREATE TRIGGER trigger_update_completion_percentage BEFORE UPDATE OF business_setup_completed, research_activities_completed, research_design_completed, calculations_completed ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_completion_percentage();
```

#### `trigger_update_rd_federal_credit_updated_at`

```sql
CREATE TRIGGER trigger_update_rd_federal_credit_updated_at BEFORE UPDATE ON public.rd_federal_credit FOR EACH ROW EXECUTE FUNCTION public.update_rd_federal_credit_updated_at();
```

#### `update_rd_roles_updated_at`

```sql
CREATE TRIGGER update_rd_roles_updated_at BEFORE UPDATE ON public.rd_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

#### `update_rd_reports_updated_at`

```sql
CREATE TRIGGER update_rd_reports_updated_at BEFORE UPDATE ON public.rd_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

#### `trigger_archive_rd_federal_credit_version`

```sql
CREATE TRIGGER trigger_archive_rd_federal_credit_version AFTER INSERT ON public.rd_federal_credit FOR EACH ROW EXECUTE FUNCTION public.archive_rd_federal_credit_version();
```

#### `trigger_safe_update_practice_percent`

```sql
CREATE TRIGGER trigger_safe_update_practice_percent AFTER INSERT ON public.rd_selected_subcomponents FOR EACH ROW EXECUTE FUNCTION public.safe_update_selected_subcomponent_practice_percent();
```

#### `update_rd_business_years_credits_calculated_at`

```sql
CREATE TRIGGER update_rd_business_years_credits_calculated_at BEFORE UPDATE OF federal_credit, state_credit ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_credits_calculated_at();
```


## Policies

### ➕ Remote Only (53)

#### `Enable update for authenticated users`

```sql
CREATE POLICY "Enable update for authenticated users" ON public.rd_research_subcomponents FOR UPDATE USING (true);
```

#### `Users can view own rd_federal_credit`

```sql
CREATE POLICY "Users can view own rd_federal_credit" ON public.rd_federal_credit FOR SELECT USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));
```

#### `Admin can manage all signature records`

```sql
CREATE POLICY "Admin can manage all signature records" ON public.rd_signature_records USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
```

#### `Users can insert their own supplies`

```sql
CREATE POLICY "Users can insert their own supplies" ON public.rd_supplies FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));
```

#### `Allow all for dev`

```sql
CREATE POLICY "Allow all for dev" ON public.rd_contractor_year_data USING (true) WITH CHECK (true);
```

#### `Allow authenticated users to create signatures`

```sql
CREATE POLICY "Allow authenticated users to create signatures" ON public.rd_signature_records FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
```

#### `Admin can manage QC controls`

```sql
CREATE POLICY "Admin can manage QC controls" ON public.rd_qc_document_controls USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));
```

#### `Users can delete their own contractor subcomponents`

```sql
CREATE POLICY "Users can delete their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR DELETE USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));
```

#### `Enable delete for authenticated users`

```sql
CREATE POLICY "Enable delete for authenticated users" ON public.rd_research_subcomponents FOR DELETE USING (true);
```

#### `Users can insert own rd_federal_credit`

```sql
CREATE POLICY "Users can insert own rd_federal_credit" ON public.rd_federal_credit FOR INSERT WITH CHECK ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));
```

#### `Users can update their own supply year data`

```sql
CREATE POLICY "Users can update their own supply year data" ON public.rd_supply_year_data FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));
```

#### `Enable delete access for authenticated users`

```sql
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_supplies FOR DELETE USING ((auth.role() = 'authenticated'::text));
```

#### `Users can view their own supply subcomponents`

```sql
CREATE POLICY "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));
```

#### `Allow all for authenticated`

```sql
CREATE POLICY "Allow all for authenticated" ON public.rd_selected_filter USING ((auth.uid() IS NOT NULL));
```

#### `Admin can view all signatures`

```sql
CREATE POLICY "Admin can view all signatures" ON public.rd_signatures FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));
```

#### `Enable read access for authenticated users`

```sql
CREATE POLICY "Enable read access for authenticated users" ON public.rd_supplies FOR SELECT USING ((auth.role() = 'authenticated'::text));
```

#### `Users can insert their own contractor subcomponents`

```sql
CREATE POLICY "Users can insert their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));
```

#### `Users can insert their own supply subcomponents`

```sql
CREATE POLICY "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));
```

#### `Enable read access for all users`

```sql
CREATE POLICY "Enable read access for all users" ON public.rd_selected_steps FOR SELECT USING (true);
```

#### `Enable insert for authenticated users only`

```sql
CREATE POLICY "Enable insert for authenticated users only" ON public.rd_selected_steps FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));
```

#### `Users can delete their own supply subcomponents`

```sql
CREATE POLICY "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));
```

#### `Users can update their own state pro forma data`

```sql
CREATE POLICY "Users can update their own state pro forma data" ON public.rd_state_proforma_data FOR UPDATE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
```

#### `Enable delete for authenticated users only`

```sql
CREATE POLICY "Enable delete for authenticated users only" ON public.rd_selected_steps FOR DELETE USING ((auth.uid() IS NOT NULL));
```

#### `Enable insert for authenticated users`

```sql
CREATE POLICY "Enable insert for authenticated users" ON public.rd_research_subcomponents FOR INSERT WITH CHECK (true);
```

#### `Users can insert their own state pro forma data`

```sql
CREATE POLICY "Users can insert their own state pro forma data" ON public.rd_state_proforma_data FOR INSERT WITH CHECK ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
```

#### `Users can insert their own supply year data`

```sql
CREATE POLICY "Users can insert their own supply year data" ON public.rd_supply_year_data FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));
```

#### `Users can update own rd_federal_credit`

```sql
CREATE POLICY "Users can update own rd_federal_credit" ON public.rd_federal_credit FOR UPDATE USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));
```

#### `Enable update access for authenticated users`

```sql
CREATE POLICY "Enable update access for authenticated users" ON public.rd_supplies FOR UPDATE USING ((auth.role() = 'authenticated'::text));
```

#### `Allow read access to rd_research_subcomponents`

```sql
CREATE POLICY "Allow read access to rd_research_subcomponents" ON public.rd_research_subcomponents FOR SELECT USING ((auth.role() = 'authenticated'::text));
```

#### `Admin can manage portal tokens`

```sql
CREATE POLICY "Admin can manage portal tokens" ON public.rd_client_portal_tokens USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));
```

#### `Allow read access to rd_research_steps`

```sql
CREATE POLICY "Allow read access to rd_research_steps" ON public.rd_research_steps FOR SELECT USING ((auth.role() = 'authenticated'::text));
```

#### `Users can view their own state pro forma data`

```sql
CREATE POLICY "Users can view their own state pro forma data" ON public.rd_state_proforma_data FOR SELECT USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
```

#### `Users can view their own contractor subcomponents`

```sql
CREATE POLICY "Users can view their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR SELECT USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));
```

#### `Users can delete their own federal credit results`

```sql
CREATE POLICY "Users can delete their own federal credit results" ON public.rd_federal_credit_results FOR DELETE USING ((auth.uid() IS NOT NULL));
```

#### `Allow authenticated users to view signatures`

```sql
CREATE POLICY "Allow authenticated users to view signatures" ON public.rd_signature_records FOR SELECT USING ((auth.role() = 'authenticated'::text));
```

#### `Enable update for authenticated users only`

```sql
CREATE POLICY "Enable update for authenticated users only" ON public.rd_selected_steps FOR UPDATE USING ((auth.uid() IS NOT NULL));
```

#### `Users can insert their own contractor year data`

```sql
CREATE POLICY "Users can insert their own contractor year data" ON public.rd_contractor_year_data FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));
```

#### `Users can insert their own federal credit results`

```sql
CREATE POLICY "Users can insert their own federal credit results" ON public.rd_federal_credit_results FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));
```

#### `Users can update their own contractor subcomponents`

```sql
CREATE POLICY "Users can update their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR UPDATE USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));
```

#### `Users can update their own contractor year data`

```sql
CREATE POLICY "Users can update their own contractor year data" ON public.rd_contractor_year_data FOR UPDATE USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));
```

#### `Users can view their own supplies`

```sql
CREATE POLICY "Users can view their own supplies" ON public.rd_supplies FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));
```

#### `Anyone can create signatures via portal`

```sql
CREATE POLICY "Anyone can create signatures via portal" ON public.rd_signatures FOR INSERT WITH CHECK (true);
```

#### `Users can update their own federal credit results`

```sql
CREATE POLICY "Users can update their own federal credit results" ON public.rd_federal_credit_results FOR UPDATE USING ((auth.uid() IS NOT NULL));
```

#### `Users can delete their own state pro forma data`

```sql
CREATE POLICY "Users can delete their own state pro forma data" ON public.rd_state_proforma_data FOR DELETE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
```

#### `Users can view their own contractor year data`

```sql
CREATE POLICY "Users can view their own contractor year data" ON public.rd_contractor_year_data FOR SELECT USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));
```

#### `Users can update their own supply subcomponents`

```sql
CREATE POLICY "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));
```

#### `Users can delete their own supplies`

```sql
CREATE POLICY "Users can delete their own supplies" ON public.rd_supplies FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));
```

#### `Users can delete their own supply year data`

```sql
CREATE POLICY "Users can delete their own supply year data" ON public.rd_supply_year_data FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));
```

#### `Enable insert access for authenticated users`

```sql
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_supplies FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
```

#### `Users can view their own federal credit results`

```sql
CREATE POLICY "Users can view their own federal credit results" ON public.rd_federal_credit_results FOR SELECT USING ((auth.uid() IS NOT NULL));
```

#### `Users can update their own supplies`

```sql
CREATE POLICY "Users can update their own supplies" ON public.rd_supplies FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));
```

#### `Users can view their own supply year data`

```sql
CREATE POLICY "Users can view their own supply year data" ON public.rd_supply_year_data FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));
```

#### `Users can delete their own contractor year data`

```sql
CREATE POLICY "Users can delete their own contractor year data" ON public.rd_contractor_year_data FOR DELETE USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));
```


## Indexes

### 🔄 Different (43)

#### `idx_rd_roles_is_default`

**Remote:**
```sql
CREATE INDEX idx_rd_roles_is_default ON public.rd_roles USING btree (is_default);
```

**Local:**
```sql
CREATE INDEX idx_rd_roles_is_default ON public.rd_roles USING btree (is_default)
```

#### `idx_rd_employee_subcomponents_employee_id`

**Remote:**
```sql
CREATE INDEX idx_rd_employee_subcomponents_employee_id ON public.rd_employee_subcomponents USING btree (employee_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_employee_subcomponents_employee_id ON public.rd_employee_subcomponents USING btree (employee_id)
```

#### `idx_state_calculations_year`

**Remote:**
```sql
CREATE INDEX idx_state_calculations_year ON public.rd_state_calculations USING btree (start_year, end_year);
```

**Local:**
```sql
CREATE INDEX idx_state_calculations_year ON public.rd_state_calculations USING btree (start_year, end_year)
```

#### `idx_rd_contractors_user_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractors_user_id ON public.rd_contractors USING btree (user_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractors_user_id ON public.rd_contractors USING btree (user_id)
```

#### `idx_rd_selected_subcomponents_step`

**Remote:**
```sql
CREATE INDEX idx_rd_selected_subcomponents_step ON public.rd_selected_subcomponents USING btree (step_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_selected_subcomponents_step ON public.rd_selected_subcomponents USING btree (step_id)
```

#### `idx_rd_federal_credit_results_business_year_id`

**Remote:**
```sql
CREATE INDEX idx_rd_federal_credit_results_business_year_id ON public.rd_federal_credit_results USING btree (business_year_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_federal_credit_results_business_year_id ON public.rd_federal_credit_results USING btree (business_year_id)
```

#### `idx_rd_contractor_year_data_business_year_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractor_year_data_business_year_id ON public.rd_contractor_year_data USING btree (business_year_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractor_year_data_business_year_id ON public.rd_contractor_year_data USING btree (business_year_id)
```

#### `idx_rd_reports_business_year_type`

**Remote:**
```sql
CREATE INDEX idx_rd_reports_business_year_type ON public.rd_reports USING btree (business_year_id, type);
```

**Local:**
```sql
CREATE INDEX idx_rd_reports_business_year_type ON public.rd_reports USING btree (business_year_id, type)
```

#### `idx_rd_business_years_business_year`

**Remote:**
```sql
CREATE INDEX idx_rd_business_years_business_year ON public.rd_business_years USING btree (business_id, year);
```

**Local:**
```sql
CREATE INDEX idx_rd_business_years_business_year ON public.rd_business_years USING btree (business_id, year)
```

#### `idx_state_calculations_active`

**Remote:**
```sql
CREATE INDEX idx_state_calculations_active ON public.rd_state_calculations USING btree (is_active);
```

**Local:**
```sql
CREATE INDEX idx_state_calculations_active ON public.rd_state_calculations USING btree (is_active)
```

#### `idx_rd_selected_subcomponents_business_year`

**Remote:**
```sql
CREATE INDEX idx_rd_selected_subcomponents_business_year ON public.rd_selected_subcomponents USING btree (business_year_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_selected_subcomponents_business_year ON public.rd_selected_subcomponents USING btree (business_year_id)
```

#### `idx_state_calculations_state`

**Remote:**
```sql
CREATE INDEX idx_state_calculations_state ON public.rd_state_calculations USING btree (state);
```

**Local:**
```sql
CREATE INDEX idx_state_calculations_state ON public.rd_state_calculations USING btree (state)
```

#### `idx_rd_employee_year_data_user_id`

**Remote:**
```sql
CREATE INDEX idx_rd_employee_year_data_user_id ON public.rd_employee_year_data USING btree (user_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_employee_year_data_user_id ON public.rd_employee_year_data USING btree (user_id)
```

#### `idx_rd_supply_subcomponents_subcomponent_id`

**Remote:**
```sql
CREATE INDEX idx_rd_supply_subcomponents_subcomponent_id ON public.rd_supply_subcomponents USING btree (subcomponent_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_supply_subcomponents_subcomponent_id ON public.rd_supply_subcomponents USING btree (subcomponent_id)
```

#### `idx_rd_federal_credit_results_calculation_date`

**Remote:**
```sql
CREATE INDEX idx_rd_federal_credit_results_calculation_date ON public.rd_federal_credit_results USING btree (calculation_date);
```

**Local:**
```sql
CREATE INDEX idx_rd_federal_credit_results_calculation_date ON public.rd_federal_credit_results USING btree (calculation_date)
```

#### `idx_rd_expenses_employee_id`

**Remote:**
```sql
CREATE INDEX idx_rd_expenses_employee_id ON public.rd_expenses USING btree (employee_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_expenses_employee_id ON public.rd_expenses USING btree (employee_id)
```

#### `idx_rd_employee_subcomponents_subcomponent_id`

**Remote:**
```sql
CREATE INDEX idx_rd_employee_subcomponents_subcomponent_id ON public.rd_employee_subcomponents USING btree (subcomponent_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_employee_subcomponents_subcomponent_id ON public.rd_employee_subcomponents USING btree (subcomponent_id)
```

#### `idx_rd_supplies_business_id`

**Remote:**
```sql
CREATE INDEX idx_rd_supplies_business_id ON public.rd_supplies USING btree (business_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_supplies_business_id ON public.rd_supplies USING btree (business_id)
```

#### `idx_rd_contractor_subcomponents_business_year_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractor_subcomponents_business_year_id ON public.rd_contractor_subcomponents USING btree (business_year_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractor_subcomponents_business_year_id ON public.rd_contractor_subcomponents USING btree (business_year_id)
```

#### `idx_rd_supply_subcomponents_supply_id`

**Remote:**
```sql
CREATE INDEX idx_rd_supply_subcomponents_supply_id ON public.rd_supply_subcomponents USING btree (supply_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_supply_subcomponents_supply_id ON public.rd_supply_subcomponents USING btree (supply_id)
```

#### `idx_rd_contractor_year_data_contractor_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractor_year_data_contractor_id ON public.rd_contractor_year_data USING btree (contractor_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractor_year_data_contractor_id ON public.rd_contractor_year_data USING btree (contractor_id)
```

#### `idx_rd_expenses_category`

**Remote:**
```sql
CREATE INDEX idx_rd_expenses_category ON public.rd_expenses USING btree (category);
```

**Local:**
```sql
CREATE INDEX idx_rd_expenses_category ON public.rd_expenses USING btree (category)
```

#### `idx_rd_employee_subcomponents_user_id`

**Remote:**
```sql
CREATE INDEX idx_rd_employee_subcomponents_user_id ON public.rd_employee_subcomponents USING btree (user_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_employee_subcomponents_user_id ON public.rd_employee_subcomponents USING btree (user_id)
```

#### `idx_rd_businesses_historical_data`

**Remote:**
```sql
CREATE INDEX idx_rd_businesses_historical_data ON public.rd_businesses USING gin (historical_data);
```

**Local:**
```sql
CREATE INDEX idx_rd_businesses_historical_data ON public.rd_businesses USING gin (historical_data)
```

#### `idx_rd_contractor_subcomponents_user_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractor_subcomponents_user_id ON public.rd_contractor_subcomponents USING btree (user_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractor_subcomponents_user_id ON public.rd_contractor_subcomponents USING btree (user_id)
```

#### `idx_rd_supply_subcomponents_business_year_id`

**Remote:**
```sql
CREATE INDEX idx_rd_supply_subcomponents_business_year_id ON public.rd_supply_subcomponents USING btree (business_year_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_supply_subcomponents_business_year_id ON public.rd_supply_subcomponents USING btree (business_year_id)
```

#### `idx_rd_contractors_business_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractors_business_id ON public.rd_contractors USING btree (business_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractors_business_id ON public.rd_contractors USING btree (business_id)
```

#### `idx_rd_contractor_subcomponents_subcomponent_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractor_subcomponents_subcomponent_id ON public.rd_contractor_subcomponents USING btree (subcomponent_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractor_subcomponents_subcomponent_id ON public.rd_contractor_subcomponents USING btree (subcomponent_id)
```

#### `idx_rd_research_steps_activity_id`

**Remote:**
```sql
CREATE INDEX idx_rd_research_steps_activity_id ON public.rd_research_steps USING btree (research_activity_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_research_steps_activity_id ON public.rd_research_steps USING btree (research_activity_id)
```

#### `idx_rd_expenses_business_year_id`

**Remote:**
```sql
CREATE INDEX idx_rd_expenses_business_year_id ON public.rd_expenses USING btree (business_year_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_expenses_business_year_id ON public.rd_expenses USING btree (business_year_id)
```

#### `idx_rd_research_subcomponents_step_id`

**Remote:**
```sql
CREATE INDEX idx_rd_research_subcomponents_step_id ON public.rd_research_subcomponents USING btree (step_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_research_subcomponents_step_id ON public.rd_research_subcomponents USING btree (step_id)
```

#### `idx_rd_contractors_role_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractors_role_id ON public.rd_contractors USING btree (role_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractors_role_id ON public.rd_contractors USING btree (role_id)
```

#### `idx_rd_selected_subcomponents_activity`

**Remote:**
```sql
CREATE INDEX idx_rd_selected_subcomponents_activity ON public.rd_selected_subcomponents USING btree (research_activity_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_selected_subcomponents_activity ON public.rd_selected_subcomponents USING btree (research_activity_id)
```

#### `idx_rd_employee_year_data_employee_year`

**Remote:**
```sql
CREATE INDEX idx_rd_employee_year_data_employee_year ON public.rd_employee_year_data USING btree (employee_id, business_year_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_employee_year_data_employee_year ON public.rd_employee_year_data USING btree (employee_id, business_year_id)
```

#### `idx_rd_selected_steps_business_year`

**Remote:**
```sql
CREATE INDEX idx_rd_selected_steps_business_year ON public.rd_selected_steps USING btree (business_year_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_selected_steps_business_year ON public.rd_selected_steps USING btree (business_year_id)
```

#### `idx_rd_employees_user_id`

**Remote:**
```sql
CREATE INDEX idx_rd_employees_user_id ON public.rd_employees USING btree (user_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_employees_user_id ON public.rd_employees USING btree (user_id)
```

#### `idx_rd_roles_business_year_id`

**Remote:**
```sql
CREATE INDEX idx_rd_roles_business_year_id ON public.rd_roles USING btree (business_year_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_roles_business_year_id ON public.rd_roles USING btree (business_year_id)
```

#### `idx_rd_selected_activities_business_year_activity`

**Remote:**
```sql
CREATE INDEX idx_rd_selected_activities_business_year_activity ON public.rd_selected_activities USING btree (business_year_id, activity_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_selected_activities_business_year_activity ON public.rd_selected_activities USING btree (business_year_id, activity_id)
```

#### `idx_rd_selected_steps_activity`

**Remote:**
```sql
CREATE INDEX idx_rd_selected_steps_activity ON public.rd_selected_steps USING btree (research_activity_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_selected_steps_activity ON public.rd_selected_steps USING btree (research_activity_id)
```

#### `idx_state_calculations_unique`

**Remote:**
```sql
CREATE UNIQUE INDEX idx_state_calculations_unique ON public.rd_state_calculations USING btree (state, start_year) WHERE (is_active = true);
```

**Local:**
```sql
CREATE UNIQUE INDEX idx_state_calculations_unique ON public.rd_state_calculations USING btree (state, start_year) WHERE (is_active = true)
```

#### `idx_rd_roles_unique_default_per_year`

**Remote:**
```sql
CREATE UNIQUE INDEX idx_rd_roles_unique_default_per_year ON public.rd_roles USING btree (business_year_id, is_default) WHERE (is_default = true);
```

**Local:**
```sql
CREATE UNIQUE INDEX idx_rd_roles_unique_default_per_year ON public.rd_roles USING btree (business_year_id, is_default) WHERE (is_default = true)
```

#### `idx_rd_contractor_year_data_user_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractor_year_data_user_id ON public.rd_contractor_year_data USING btree (user_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractor_year_data_user_id ON public.rd_contractor_year_data USING btree (user_id)
```

#### `idx_rd_contractor_subcomponents_contractor_id`

**Remote:**
```sql
CREATE INDEX idx_rd_contractor_subcomponents_contractor_id ON public.rd_contractor_subcomponents USING btree (contractor_id);
```

**Local:**
```sql
CREATE INDEX idx_rd_contractor_subcomponents_contractor_id ON public.rd_contractor_subcomponents USING btree (contractor_id)
```

### ➕ Remote Only (53)

#### `idx_rd_client_portal_tokens_token`

```sql
CREATE INDEX idx_rd_client_portal_tokens_token ON public.rd_client_portal_tokens USING btree (token);
```

#### `idx_rd_qc_document_controls_business_year`

```sql
CREATE INDEX idx_rd_qc_document_controls_business_year ON public.rd_qc_document_controls USING btree (business_year_id);
```

#### `idx_document_links_contractor`

```sql
CREATE INDEX idx_document_links_contractor ON public.rd_document_links USING btree (contractor_id);
```

#### `idx_state_proforma_lines_state_proforma_id`

```sql
CREATE INDEX idx_state_proforma_lines_state_proforma_id ON public.rd_state_proforma_lines USING btree (state_proforma_id);
```

#### `idx_procedure_links_status`

```sql
CREATE INDEX idx_procedure_links_status ON public.rd_procedure_research_links USING btree (status);
```

#### `idx_billable_summary_business_year`

```sql
CREATE INDEX idx_billable_summary_business_year ON public.rd_billable_time_summary USING btree (business_year_id);
```

#### `idx_rd_business_years_research_activities_completed`

```sql
CREATE INDEX idx_rd_business_years_research_activities_completed ON public.rd_business_years USING btree (research_activities_completed) WHERE (research_activities_completed = true);
```

#### `idx_state_credit_configs_state_code`

```sql
CREATE INDEX idx_state_credit_configs_state_code ON public.rd_state_credit_configs USING btree (state_code);
```

#### `idx_unique_procedure_research_link`

```sql
CREATE UNIQUE INDEX idx_unique_procedure_research_link ON public.rd_procedure_research_links USING btree (procedure_analysis_id, research_activity_id, subcomponent_id);
```

#### `idx_rd_businesses_github_token_exists`

```sql
CREATE INDEX idx_rd_businesses_github_token_exists ON public.rd_businesses USING btree (github_token) WHERE (github_token IS NOT NULL);
```

#### `idx_rd_state_proforma_data_lookup`

```sql
CREATE INDEX idx_rd_state_proforma_data_lookup ON public.rd_state_proforma_data USING btree (business_year_id, state_code, method);
```

#### `idx_rd_signature_records_business_year_id`

```sql
CREATE INDEX idx_rd_signature_records_business_year_id ON public.rd_signature_records USING btree (business_year_id);
```

#### `idx_rd_client_portal_tokens_business`

```sql
CREATE INDEX idx_rd_client_portal_tokens_business ON public.rd_client_portal_tokens USING btree (business_id);
```

#### `idx_procedure_analysis_code`

```sql
CREATE INDEX idx_procedure_analysis_code ON public.rd_procedure_analysis USING btree (procedure_code);
```

#### `idx_procedure_analysis_doc`

```sql
CREATE INDEX idx_procedure_analysis_doc ON public.rd_procedure_analysis USING btree (document_id);
```

#### `idx_document_links_doc`

```sql
CREATE INDEX idx_document_links_doc ON public.rd_document_links USING btree (document_id);
```

#### `idx_rd_federal_credit_client`

```sql
CREATE INDEX idx_rd_federal_credit_client ON public.rd_federal_credit USING btree (client_id);
```

#### `idx_rd_business_years_calculations_completed`

```sql
CREATE INDEX idx_rd_business_years_calculations_completed ON public.rd_business_years USING btree (calculations_completed) WHERE (calculations_completed = true);
```

#### `idx_rd_signatures_signed_at`

```sql
CREATE INDEX idx_rd_signatures_signed_at ON public.rd_signatures USING btree (signed_at);
```

#### `idx_rd_qc_document_controls_qc_approved_date`

```sql
CREATE INDEX idx_rd_qc_document_controls_qc_approved_date ON public.rd_qc_document_controls USING btree (qc_approved_date) WHERE (qc_approved_date IS NOT NULL);
```

#### `idx_rd_signature_records_signed_at`

```sql
CREATE INDEX idx_rd_signature_records_signed_at ON public.rd_signature_records USING btree (signed_at);
```

#### `idx_rd_reports_html_not_null`

```sql
CREATE INDEX idx_rd_reports_html_not_null ON public.rd_reports USING btree (business_year_id, type) WHERE (generated_html IS NOT NULL);
```

#### `idx_state_proformas_business_year`

```sql
CREATE INDEX idx_state_proformas_business_year ON public.rd_state_proformas USING btree (business_year_id);
```

#### `idx_billable_summary_activity`

```sql
CREATE INDEX idx_billable_summary_activity ON public.rd_billable_time_summary USING btree (research_activity_id);
```

#### `idx_rd_research_activities_global`

```sql
CREATE INDEX idx_rd_research_activities_global ON public.rd_research_activities USING btree (id) WHERE (business_id IS NULL);
```

#### `idx_support_docs_status`

```sql
CREATE INDEX idx_support_docs_status ON public.rd_support_documents USING btree (processing_status);
```

#### `idx_rd_research_activities_business_id`

```sql
CREATE INDEX idx_rd_research_activities_business_id ON public.rd_research_activities USING btree (business_id);
```

#### `idx_rd_business_years_research_design_completed`

```sql
CREATE INDEX idx_rd_business_years_research_design_completed ON public.rd_business_years USING btree (research_design_completed) WHERE (research_design_completed = true);
```

#### `idx_rd_client_portal_tokens_active`

```sql
CREATE INDEX idx_rd_client_portal_tokens_active ON public.rd_client_portal_tokens USING btree (business_id, is_active, expires_at) WHERE (is_active = true);
```

#### `idx_support_docs_business_year`

```sql
CREATE INDEX idx_support_docs_business_year ON public.rd_support_documents USING btree (business_year_id);
```

#### `idx_document_links_supply`

```sql
CREATE INDEX idx_document_links_supply ON public.rd_document_links USING btree (supply_id);
```

#### `idx_rd_businesses_ein`

```sql
CREATE INDEX idx_rd_businesses_ein ON public.rd_businesses USING btree (ein) WHERE (ein IS NOT NULL);
```

#### `idx_rd_federal_credit_latest`

```sql
CREATE INDEX idx_rd_federal_credit_latest ON public.rd_federal_credit USING btree (is_latest) WHERE (is_latest = true);
```

#### `idx_rd_business_years_business_setup_completed`

```sql
CREATE INDEX idx_rd_business_years_business_setup_completed ON public.rd_business_years USING btree (business_setup_completed) WHERE (business_setup_completed = true);
```

#### `idx_rd_client_portal_tokens_business_id`

```sql
CREATE INDEX idx_rd_client_portal_tokens_business_id ON public.rd_client_portal_tokens USING btree (business_id);
```

#### `idx_support_docs_type`

```sql
CREATE INDEX idx_support_docs_type ON public.rd_support_documents USING btree (document_type);
```

#### `idx_rd_federal_credit_created_at`

```sql
CREATE INDEX idx_rd_federal_credit_created_at ON public.rd_federal_credit USING btree (created_at);
```

#### `idx_rd_federal_credit_business_year`

```sql
CREATE INDEX idx_rd_federal_credit_business_year ON public.rd_federal_credit USING btree (business_year_id);
```

#### `idx_rd_research_steps_activity_step_order`

```sql
CREATE INDEX idx_rd_research_steps_activity_step_order ON public.rd_research_steps USING btree (research_activity_id, step_order);
```

#### `idx_rd_research_steps_business_id`

```sql
CREATE INDEX idx_rd_research_steps_business_id ON public.rd_research_steps USING btree (business_id);
```

#### `idx_rd_signatures_business_year`

```sql
CREATE INDEX idx_rd_signatures_business_year ON public.rd_signatures USING btree (business_year_id);
```

#### `idx_rd_roles_type`

```sql
CREATE INDEX idx_rd_roles_type ON public.rd_roles USING btree (type);
```

#### `idx_rd_reports_qc_approved_at`

```sql
CREATE INDEX idx_rd_reports_qc_approved_at ON public.rd_reports USING btree (qc_approved_at) WHERE (qc_approved_at IS NOT NULL);
```

#### `idx_rd_qc_document_controls_released`

```sql
CREATE INDEX idx_rd_qc_document_controls_released ON public.rd_qc_document_controls USING btree (is_released);
```

#### `idx_rd_qc_document_controls_type`

```sql
CREATE INDEX idx_rd_qc_document_controls_type ON public.rd_qc_document_controls USING btree (document_type);
```

#### `idx_rd_reports_state_gross_receipts`

```sql
CREATE INDEX idx_rd_reports_state_gross_receipts ON public.rd_reports USING gin (state_gross_receipts);
```

#### `idx_rd_research_subcomponents_business_id`

```sql
CREATE INDEX idx_rd_research_subcomponents_business_id ON public.rd_research_subcomponents USING btree (business_id);
```

#### `idx_rd_business_years_completion_percentage`

```sql
CREATE INDEX idx_rd_business_years_completion_percentage ON public.rd_business_years USING btree (overall_completion_percentage);
```

#### `idx_procedure_links_activity`

```sql
CREATE INDEX idx_procedure_links_activity ON public.rd_procedure_research_links USING btree (research_activity_id);
```

#### `idx_rd_business_years_credits_locked`

```sql
CREATE INDEX idx_rd_business_years_credits_locked ON public.rd_business_years USING btree (credits_locked) WHERE (credits_locked = true);
```

#### `idx_rd_federal_credit_activity`

```sql
CREATE INDEX idx_rd_federal_credit_activity ON public.rd_federal_credit USING btree (research_activity_id);
```

#### `idx_rd_signatures_type`

```sql
CREATE INDEX idx_rd_signatures_type ON public.rd_signatures USING btree (signature_type);
```

#### `idx_rd_businesses_category_id`

```sql
CREATE INDEX idx_rd_businesses_category_id ON public.rd_businesses USING btree (category_id);
```

### ➖ Local Only (61)

#### `rd_research_steps_pkey`

```sql
CREATE UNIQUE INDEX rd_research_steps_pkey ON public.rd_research_steps USING btree (id)
```

#### `rd_selected_steps_business_year_id_step_id_key`

```sql
CREATE UNIQUE INDEX rd_selected_steps_business_year_id_step_id_key ON public.rd_selected_steps USING btree (business_year_id, step_id)
```

#### `rd_document_links_pkey`

```sql
CREATE UNIQUE INDEX rd_document_links_pkey ON public.rd_document_links USING btree (id)
```

#### `rd_selected_filter_business_year_id_key`

```sql
CREATE UNIQUE INDEX rd_selected_filter_business_year_id_key ON public.rd_selected_filter USING btree (business_year_id)
```

#### `rd_selected_activities_pkey`

```sql
CREATE UNIQUE INDEX rd_selected_activities_pkey ON public.rd_selected_activities USING btree (id)
```

#### `rd_state_credit_configs_pkey`

```sql
CREATE UNIQUE INDEX rd_state_credit_configs_pkey ON public.rd_state_credit_configs USING btree (id)
```

#### `rd_billable_time_summary_pkey`

```sql
CREATE UNIQUE INDEX rd_billable_time_summary_pkey ON public.rd_billable_time_summary USING btree (id)
```

#### `rd_federal_credit_pkey`

```sql
CREATE UNIQUE INDEX rd_federal_credit_pkey ON public.rd_federal_credit USING btree (id)
```

#### `rd_employee_year_data_pkey`

```sql
CREATE UNIQUE INDEX rd_employee_year_data_pkey ON public.rd_employee_year_data USING btree (id)
```

#### `rd_expenses_pkey`

```sql
CREATE UNIQUE INDEX rd_expenses_pkey ON public.rd_expenses USING btree (id)
```

#### `rd_signature_records_pkey`

```sql
CREATE UNIQUE INDEX rd_signature_records_pkey ON public.rd_signature_records USING btree (id)
```

#### `rd_reports_pkey`

```sql
CREATE UNIQUE INDEX rd_reports_pkey ON public.rd_reports USING btree (id)
```

#### `rd_supply_subcomponents_unique`

```sql
CREATE UNIQUE INDEX rd_supply_subcomponents_unique ON public.rd_supply_subcomponents USING btree (supply_id, subcomponent_id, business_year_id)
```

#### `rd_state_calculations_full_pkey`

```sql
CREATE UNIQUE INDEX rd_state_calculations_full_pkey ON public.rd_state_calculations_full USING btree (id)
```

#### `rd_signatures_pkey`

```sql
CREATE UNIQUE INDEX rd_signatures_pkey ON public.rd_signatures USING btree (id)
```

#### `idx_rd_signature_records_business_type`

```sql
CREATE INDEX idx_rd_signature_records_business_type ON public.rd_signature_records USING btree (business_year_id, document_type)
```

#### `rd_contractor_year_data_pkey`

```sql
CREATE UNIQUE INDEX rd_contractor_year_data_pkey ON public.rd_contractor_year_data USING btree (id)
```

#### `rd_selected_filter_pkey`

```sql
CREATE UNIQUE INDEX rd_selected_filter_pkey ON public.rd_selected_filter USING btree (id)
```

#### `rd_signatures_signature_hash_key`

```sql
CREATE UNIQUE INDEX rd_signatures_signature_hash_key ON public.rd_signatures USING btree (signature_hash)
```

#### `rd_business_years_pkey`

```sql
CREATE UNIQUE INDEX rd_business_years_pkey ON public.rd_business_years USING btree (id)
```

#### `rd_federal_credit_results_unique`

```sql
CREATE UNIQUE INDEX rd_federal_credit_results_unique ON public.rd_federal_credit_results USING btree (business_year_id)
```

#### `rd_research_raw_pkey`

```sql
CREATE UNIQUE INDEX rd_research_raw_pkey ON public.rd_research_raw USING btree (id)
```

#### `rd_businesses_pkey`

```sql
CREATE UNIQUE INDEX rd_businesses_pkey ON public.rd_businesses USING btree (id)
```

#### `unique_category_name`

```sql
CREATE UNIQUE INDEX unique_category_name ON public.rd_research_categories USING btree (name)
```

#### `rd_selected_steps_pkey`

```sql
CREATE UNIQUE INDEX rd_selected_steps_pkey ON public.rd_selected_steps USING btree (id)
```

#### `rd_contractor_subcomponents_unique`

```sql
CREATE UNIQUE INDEX rd_contractor_subcomponents_unique ON public.rd_contractor_subcomponents USING btree (contractor_id, subcomponent_id, business_year_id)
```

#### `rd_employees_pkey`

```sql
CREATE UNIQUE INDEX rd_employees_pkey ON public.rd_employees USING btree (id)
```

#### `rd_procedure_research_links_pkey`

```sql
CREATE UNIQUE INDEX rd_procedure_research_links_pkey ON public.rd_procedure_research_links USING btree (id)
```

#### `rd_state_proforma_lines_pkey`

```sql
CREATE UNIQUE INDEX rd_state_proforma_lines_pkey ON public.rd_state_proforma_lines USING btree (id)
```

#### `rd_state_proformas_pkey`

```sql
CREATE UNIQUE INDEX rd_state_proformas_pkey ON public.rd_state_proformas USING btree (id)
```

#### `rd_supply_subcomponents_pkey`

```sql
CREATE UNIQUE INDEX rd_supply_subcomponents_pkey ON public.rd_supply_subcomponents USING btree (id)
```

#### `rd_supply_year_data_pkey`

```sql
CREATE UNIQUE INDEX rd_supply_year_data_pkey ON public.rd_supply_year_data USING btree (id)
```

#### `rd_employee_subcomponents_pkey`

```sql
CREATE UNIQUE INDEX rd_employee_subcomponents_pkey ON public.rd_employee_subcomponents USING btree (id)
```

#### `rd_focuses_pkey`

```sql
CREATE UNIQUE INDEX rd_focuses_pkey ON public.rd_focuses USING btree (id)
```

#### `rd_qc_document_controls_pkey`

```sql
CREATE UNIQUE INDEX rd_qc_document_controls_pkey ON public.rd_qc_document_controls USING btree (id)
```

#### `rd_roles_pkey`

```sql
CREATE UNIQUE INDEX rd_roles_pkey ON public.rd_roles USING btree (id)
```

#### `idx_rd_client_portal_tokens_business_active`

```sql
CREATE INDEX idx_rd_client_portal_tokens_business_active ON public.rd_client_portal_tokens USING btree (business_id, is_active)
```

#### `rd_federal_credit_results_pkey`

```sql
CREATE UNIQUE INDEX rd_federal_credit_results_pkey ON public.rd_federal_credit_results USING btree (id)
```

#### `rd_research_categories_name_key`

```sql
CREATE UNIQUE INDEX rd_research_categories_name_key ON public.rd_research_categories USING btree (name)
```

#### `unique_focus_name_per_area`

```sql
CREATE UNIQUE INDEX unique_focus_name_per_area ON public.rd_focuses USING btree (name, area_id)
```

#### `rd_client_portal_tokens_token_key`

```sql
CREATE UNIQUE INDEX rd_client_portal_tokens_token_key ON public.rd_client_portal_tokens USING btree (token)
```

#### `rd_state_calculations_pkey`

```sql
CREATE UNIQUE INDEX rd_state_calculations_pkey ON public.rd_state_calculations USING btree (id)
```

#### `idx_rd_billable_time_summary_business_year`

```sql
CREATE INDEX idx_rd_billable_time_summary_business_year ON public.rd_billable_time_summary USING btree (business_year_id)
```

#### `rd_subcomponents_pkey`

```sql
CREATE UNIQUE INDEX rd_subcomponents_pkey ON public.rd_subcomponents USING btree (id)
```

#### `rd_procedure_analysis_pkey`

```sql
CREATE UNIQUE INDEX rd_procedure_analysis_pkey ON public.rd_procedure_analysis USING btree (id)
```

#### `rd_selected_subcomponents_pkey`

```sql
CREATE UNIQUE INDEX rd_selected_subcomponents_pkey ON public.rd_selected_subcomponents USING btree (id)
```

#### `rd_state_credit_configs_state_year_key`

```sql
CREATE UNIQUE INDEX rd_state_credit_configs_state_year_key ON public.rd_state_credit_configs USING btree (state_code, tax_year)
```

#### `unique_area_name_per_category`

```sql
CREATE UNIQUE INDEX unique_area_name_per_category ON public.rd_areas USING btree (name, category_id)
```

#### `rd_supplies_pkey`

```sql
CREATE UNIQUE INDEX rd_supplies_pkey ON public.rd_supplies USING btree (id)
```

#### `unique_activity_per_focus`

```sql
CREATE UNIQUE INDEX unique_activity_per_focus ON public.rd_research_activities USING btree (title, focus_id)
```

#### `rd_state_proforma_data_pkey`

```sql
CREATE UNIQUE INDEX rd_state_proforma_data_pkey ON public.rd_state_proforma_data USING btree (id)
```

#### `rd_areas_pkey`

```sql
CREATE UNIQUE INDEX rd_areas_pkey ON public.rd_areas USING btree (id)
```

#### `rd_research_categories_pkey`

```sql
CREATE UNIQUE INDEX rd_research_categories_pkey ON public.rd_research_categories USING btree (id)
```

#### `rd_client_portal_tokens_pkey`

```sql
CREATE UNIQUE INDEX rd_client_portal_tokens_pkey ON public.rd_client_portal_tokens USING btree (id)
```

#### `rd_contractors_pkey`

```sql
CREATE UNIQUE INDEX rd_contractors_pkey ON public.rd_contractors USING btree (id)
```

#### `rd_employee_subcomponents_unique`

```sql
CREATE UNIQUE INDEX rd_employee_subcomponents_unique ON public.rd_employee_subcomponents USING btree (employee_id, subcomponent_id, business_year_id)
```

#### `rd_support_documents_pkey`

```sql
CREATE UNIQUE INDEX rd_support_documents_pkey ON public.rd_support_documents USING btree (id)
```

#### `rd_research_activities_pkey`

```sql
CREATE UNIQUE INDEX rd_research_activities_pkey ON public.rd_research_activities USING btree (id)
```

#### `rd_contractor_subcomponents_pkey`

```sql
CREATE UNIQUE INDEX rd_contractor_subcomponents_pkey ON public.rd_contractor_subcomponents USING btree (id)
```

#### `rd_research_subcomponents_pkey`

```sql
CREATE UNIQUE INDEX rd_research_subcomponents_pkey ON public.rd_research_subcomponents USING btree (id)
```

#### `rd_selected_subcomponents_business_year_id_subcomponent_id_key`

```sql
CREATE UNIQUE INDEX rd_selected_subcomponents_business_year_id_subcomponent_id_key ON public.rd_selected_subcomponents USING btree (business_year_id, subcomponent_id)
```


## Views

### ➕ Remote Only (3)

#### `rd_client_progress_summary`

```sql
CREATE VIEW public.rd_client_progress_summary AS
 SELECT cb.id AS business_id,
    cb.name AS business_name,
    cb.client_id,
    p.full_name AS client_name,
    p.email AS client_email,
    tp.business_name AS tax_profile_business_name,
    by.year,
    by.business_setup_completed,
    by.research_activities_completed,
    by.research_design_completed,
    by.calculations_completed,
    by.qre_locked AS qres_completed,
    by.overall_completion_percentage,
    by.last_step_completed,
    by.completion_updated_at,
    by.qc_status
   FROM (((public.rd_businesses cb
     JOIN public.tax_profiles tp ON ((cb.client_id = tp.id)))
     LEFT JOIN public.profiles p ON ((tp.user_id = p.id)))
     LEFT JOIN public.rd_business_years by ON ((cb.id = by.business_id)))
  WHERE (by.year IS NOT NULL)
  ORDER BY p.full_name, cb.name, by.year DESC;
```

#### `rd_activity_hierarchy`

```sql
CREATE VIEW public.rd_activity_hierarchy AS
 SELECT cat.name AS category,
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
   FROM ((((public.rd_research_categories cat
     JOIN public.rd_areas area ON ((area.category_id = cat.id)))
     JOIN public.rd_focuses focus ON ((focus.area_id = area.id)))
     JOIN public.rd_research_activities act ON ((act.focus_id = focus.id)))
     JOIN public.rd_subcomponents sub ON ((sub.activity_id = act.id)))
  ORDER BY cat.name, area.name, focus.name, act.title, sub.step;
```

#### `rd_federal_credit_latest`

```sql
CREATE VIEW public.rd_federal_credit_latest AS
 SELECT rd_federal_credit.id,
    rd_federal_credit.business_year_id,
    rd_federal_credit.client_id,
    rd_federal_credit.research_activity_id,
    rd_federal_credit.research_activity_name,
    rd_federal_credit.direct_research_wages,
    rd_federal_credit.supplies_expenses,
    rd_federal_credit.contractor_expenses,
    rd_federal_credit.total_qre,
    rd_federal_credit.subcomponent_count,
    rd_federal_credit.subcomponent_groups,
    rd_federal_credit.applied_percent,
    rd_federal_credit.line_49f_description,
    rd_federal_credit.ai_generation_timestamp,
    rd_federal_credit.ai_prompt_used,
    rd_federal_credit.ai_response_raw,
    rd_federal_credit.federal_credit_amount,
    rd_federal_credit.federal_credit_percentage,
    rd_federal_credit.calculation_method,
    rd_federal_credit.industry_type,
    rd_federal_credit.focus_area,
    rd_federal_credit.general_description,
    rd_federal_credit.created_at,
    rd_federal_credit.updated_at,
    rd_federal_credit.created_by,
    rd_federal_credit.updated_by,
    rd_federal_credit.version,
    rd_federal_credit.is_latest,
    rd_federal_credit.previous_version_id,
    rd_federal_credit.calculation_timestamp,
    rd_federal_credit.data_snapshot,
    rd_federal_credit.notes
   FROM public.rd_federal_credit
  WHERE (rd_federal_credit.is_latest = true);
```

