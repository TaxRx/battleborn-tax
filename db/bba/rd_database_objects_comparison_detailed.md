# RD_* Database Objects Comparison Report

Generated on: 2025-07-31 09:05:06

## Summary

| Object Type | Total | Same | Different | Remote Only | Local Only | Issues |
|-------------|-------|------|-----------|-------------|------------|--------|
| ❌ Tables | 43 | 18 | 25 | 0 | 0 | 25 |
| ✅ Functions | 0 | 0 | 0 | 0 | 0 | 0 |
| ❌ Triggers | 19 | 9 | 0 | 10 | 0 | 10 |
| ❌ Policies | 55 | 36 | 3 | 14 | 2 | 19 |
| ❌ Indexes | 99 | 43 | 0 | 53 | 3 | 56 |

**Total Issues: 110**

## Priority Actions

### 🔴 High Priority
- **10 triggers** missing locally - need to create
- **14 policies** missing locally - need to create
- **53 indexes** missing locally - need to create

### 🟡 Medium Priority
- **25 tables** have differences - need to review and sync
- **3 policies** have differences - need to review and sync
- **2 policies** exist only locally - may need to remove or keep
- **3 indexes** exist only locally - may need to remove or keep


## Tables

### ✅ Identical (18)

- `rd_areas`
- `rd_contractor_subcomponents`
- `rd_contractor_year_data`
- `rd_contractors`
- `rd_employee_subcomponents`
- `rd_employee_year_data`
- `rd_expenses`
- `rd_federal_credit_results`
- `rd_focuses`
- `rd_research_categories`
- `rd_research_raw`
- `rd_roles`
- `rd_selected_filter`
- `rd_state_calculations`
- `rd_subcomponents`
- `rd_supplies`
- `rd_supply_subcomponents`
- `rd_supply_year_data`

### 🔄 Different (25)

#### `rd_state_credit_configs`

**Difference:**
```diff
  CREATE TABLE public.rd_state_credit_configs (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
-     state_code character(2) NOT NULL,
+     state_code character varying(2) NOT NULL,
-     tax_year integer NOT NULL,
+     config jsonb DEFAULT '{}'::jsonb NOT NULL,
-     credit_rate numeric(5,4) NOT NULL,
+     created_at timestamp without time zone DEFAULT now(),
-     minimum_threshold numeric(15,2) DEFAULT 0,
+     updated_at timestamp without time zone DEFAULT now()
-     maximum_credit numeric(15,2),
+ );
-     carryforward_years integer DEFAULT 0,
-     special_rules jsonb DEFAULT '{}'::jsonb,
-     is_active boolean DEFAULT true,
-     created_at timestamp with time zone DEFAULT now(),
-     updated_at timestamp with time zone DEFAULT now(),
-     config text
- );
```

#### `rd_state_proforma_lines`

**Difference:**
```diff
  CREATE TABLE public.rd_state_proforma_lines (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
-     proforma_data_id uuid NOT NULL,
+     state_proforma_id uuid NOT NULL,
-     line_number integer NOT NULL,
+     line_number character varying(10) NOT NULL,
-     line_description text NOT NULL,
+     description text NOT NULL,
-     line_value numeric(15,2) DEFAULT 0,
+     amount numeric(15,2) DEFAULT 0,
-     calculation_formula text,
+     is_editable boolean DEFAULT true,
      is_calculated boolean DEFAULT false,
-     created_at timestamp with time zone DEFAULT now(),
+     calculation_formula text,
-     updated_at timestamp with time zone DEFAULT now(),
+     line_type character varying(50),
-     state_proforma_id text,
+     sort_order integer NOT NULL,
-     description text,
+     created_at timestamp without time zone DEFAULT now(),
-     line_type text,
+     updated_at timestamp without time zone DEFAULT now()
-     is_editable text,
+ );
-     sort_order text,
-     amount text
- );
```

#### `rd_procedure_research_links`

**Difference:**
```diff
  CREATE TABLE public.rd_procedure_research_links (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      procedure_analysis_id uuid NOT NULL,
      research_activity_id uuid NOT NULL,
-     relevance_score numeric(3,2) DEFAULT 0,
+     subcomponent_id uuid,
-     link_type character varying(50) DEFAULT 'direct'::character varying,
+     allocation_percentage numeric(5,2) NOT NULL,
-     notes text,
+     estimated_research_time_hours numeric(10,2),
-     created_at timestamp with time zone DEFAULT now(),
+     ai_reasoning text,
-     updated_at timestamp with time zone DEFAULT now(),
+     ai_confidence_score numeric(3,2),
-     allocation_percentage text,
+     status text DEFAULT 'pending'::text,
-     approval_notes text,
+     manual_override boolean DEFAULT false,
-     manual_override text,
+     approved_by uuid,
-     estimated_research_time_hours text,
+     approval_notes text,
-     status text,
+     created_at timestamp without time zone DEFAULT now(),
-     subcomponent_id text,
+     updated_at timestamp without time zone DEFAULT now(),
-     ai_reasoning text,
+     CONSTRAINT rd_procedure_research_links_ai_confidence_score_check CHECK (((ai_confidence_score >= (0)::numeric) AND (ai_confidence_score <= (1)::numeric))),
-     ai_confidence_score text,
+     CONSTRAINT rd_procedure_research_links_allocation_percentage_check CHECK (((allocation_percentage > (0)::numeric) AND (allocation_percentage <= (100)::numeric))),
-     approved_by text
+     CONSTRAINT rd_procedure_research_links_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'modified'::text])))
  );
```

#### `rd_research_steps`

**Difference:**
```diff
  CREATE TABLE public.rd_research_steps (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      research_activity_id uuid NOT NULL,
      name character varying(255) NOT NULL,
      description text,
      step_order integer NOT NULL,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
-     business_id text,
+     is_active boolean DEFAULT true,
-     deactivated_at text,
+     deactivated_at timestamp without time zone,
-     is_active text,
+     deactivation_reason text,
-     deactivation_reason text
+     business_id uuid
  );
```

#### `rd_state_calculations_full`

**Difference:**
```diff
  CREATE TABLE public.rd_state_calculations_full (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
-     base_calculation_id uuid NOT NULL,
+     state character varying(2) NOT NULL,
-     state_code character(2) NOT NULL,
+     calculation_method text,
-     detailed_breakdown jsonb DEFAULT '{}'::jsonb,
+     refundable text,
-     calculation_notes text,
+     carryforward text,
-     override_values jsonb DEFAULT '{}'::jsonb,
+     eligible_entities text,
-     final_amount numeric(15,2) DEFAULT 0,
+     special_notes text,
-     is_final boolean DEFAULT false,
+     start_year text,
-     created_at timestamp with time zone DEFAULT now(),
+     formula_correct text,
-     updated_at timestamp with time zone DEFAULT now(),
+     standard_credit_formula text,
-     refundable text,
+     alternate_credit_formula text,
-     state text,
+     additional_credit_formula text,
-     additional_credit_formula text,
+     end_year text,
-     end_year text,
+     standard_info text,
-     eligible_entities text,
+     alternative_info text,
-     carryforward text,
+     other_info text,
-     calculation_method text,
+     created_at timestamp with time zone DEFAULT now(),
-     alternative_info text,
+     updated_at timestamp with time zone DEFAULT now()
-     formula_correct text,
+ );
-     standard_info text,
-     start_year text,
-     alternate_credit_formula text,
-     other_info text,
-     special_notes text,
-     standard_credit_formula text
- );
```

#### `rd_research_subcomponents`

**Difference:**
```diff
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
-     business_id text,
+     is_active boolean DEFAULT true,
-     deactivated_at text,
+     deactivated_at timestamp without time zone,
-     is_active text,
+     deactivation_reason text,
-     deactivation_reason text
+     business_id uuid
  );
```

#### `rd_support_documents`

**Difference:**
```diff
  CREATE TABLE public.rd_support_documents (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_year_id uuid NOT NULL,
-     document_category character varying(100) NOT NULL,
+     document_type text NOT NULL,
-     document_title text NOT NULL,
+     file_name text NOT NULL,
-     document_path text,
+     file_path text NOT NULL,
-     document_size integer,
+     file_size bigint,
-     document_hash text,
+     mime_type text,
-     upload_status character varying(50) DEFAULT 'pending'::character varying,
+     upload_date timestamp without time zone DEFAULT now(),
-     reviewed_by uuid,
+     uploaded_by uuid,
-     review_status character varying(50) DEFAULT 'pending'::character varying,
+     processing_status text DEFAULT 'pending'::text,
-     review_notes text,
+     ai_analysis jsonb,
-     created_at timestamp with time zone DEFAULT now(),
+     metadata jsonb,
-     updated_at timestamp with time zone DEFAULT now(),
+     notes text,
-     document_type text,
+     created_at timestamp without time zone DEFAULT now(),
-     uploaded_by text,
+     updated_at timestamp without time zone DEFAULT now(),
-     file_name text,
+     CONSTRAINT rd_support_documents_document_type_check CHECK ((document_type = ANY (ARRAY['invoice'::text, '1099'::text, 'procedure_report'::text]))),
-     file_path text,
+     CONSTRAINT rd_support_documents_processing_status_check CHECK ((processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'manual_review'::text])))
-     notes text,
+ );
-     ai_analysis text,
-     mime_type text,
-     upload_date text,
-     processing_status text,
-     metadata text,
-     file_size text
- );
```

#### `rd_billable_time_summary`

**Difference:**
```diff
  CREATE TABLE public.rd_billable_time_summary (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_year_id uuid NOT NULL,
-     employee_id uuid,
+     research_activity_id uuid NOT NULL,
-     contractor_id uuid,
+     subcomponent_id uuid,
-     total_hours numeric(10,2) DEFAULT 0,
+     total_procedures_count integer DEFAULT 0,
-     billable_hours numeric(10,2) DEFAULT 0,
+     total_billed_units integer DEFAULT 0,
-     billable_percentage numeric(5,2) DEFAULT 0,
+     total_billed_amount numeric(15,2) DEFAULT 0,
-     hourly_rate numeric(10,2) DEFAULT 0,
+     estimated_total_time_hours numeric(10,2) DEFAULT 0,
-     total_cost numeric(12,2) DEFAULT 0,
+     current_practice_percentage numeric(5,2),
-     created_at timestamp with time zone DEFAULT now(),
+     calculated_billable_percentage numeric(5,2),
-     updated_at timestamp with time zone DEFAULT now(),
+     recommended_percentage numeric(5,2),
-     research_activity_id text,
+     percentage_variance numeric(5,2),
-     total_billed_units text,
+     last_calculated timestamp without time zone DEFAULT now(),
-     percentage_variance text,
+     calculation_source text DEFAULT 'ai_analysis'::text,
-     recommended_percentage text,
+     notes text,
-     last_calculated text,
+     created_at timestamp without time zone DEFAULT now(),
-     notes text,
+     updated_at timestamp without time zone DEFAULT now()
-     current_practice_percentage text,
+ );
-     calculated_billable_percentage text,
-     calculation_source text,
-     subcomponent_id text,
-     total_billed_amount text,
-     total_procedures_count text,
-     estimated_total_time_hours text
- );
```

#### `rd_businesses`

**Difference:**
```diff
  CREATE TABLE public.rd_businesses (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid NOT NULL,
      name text NOT NULL,
-     ein text NOT NULL,
+     ein text,
-     entity_type public.entity_type NOT NULL,
+     start_year integer NOT NULL,
-     start_year integer NOT NULL,
+     domicile_state text NOT NULL,
-     domicile_state text NOT NULL,
+     contact_info jsonb NOT NULL,
-     contact_info jsonb NOT NULL,
+     is_controlled_grp boolean DEFAULT false,
-     is_controlled_grp boolean DEFAULT false,
+     created_at timestamp with time zone DEFAULT now(),
-     created_at timestamp with time zone DEFAULT now(),
+     updated_at timestamp with time zone DEFAULT now(),
-     updated_at timestamp with time zone DEFAULT now(),
+     historical_data jsonb DEFAULT '[]'::jsonb NOT NULL,
-     historical_data jsonb DEFAULT '[]'::jsonb NOT NULL,
+     website text,
-     website text,
+     image_path text,
-     image_path text,
+     entity_type public.entity_type DEFAULT 'OTHER'::public.entity_type NOT NULL,
-     naics text,
+     naics character varying(10),
      category_id uuid,
      github_token text,
      portal_email text,
      CONSTRAINT check_historical_data_structure CHECK (public.validate_historical_data(historical_data))
  );
```

#### `rd_selected_activities`

**Difference:**
```diff
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
-     is_enabled text,
+     is_enabled boolean DEFAULT true NOT NULL,
      activity_title_snapshot text,
      activity_category_snapshot text
  );
```

#### `rd_business_years`

**Difference:**
```diff
  CREATE TABLE public.rd_business_years (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_id uuid NOT NULL,
      year integer NOT NULL,
      gross_receipts numeric(15,2) NOT NULL,
      total_qre numeric(15,2) DEFAULT 0,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
-     qc_status text DEFAULT 'pending'::text,
+     qc_status character varying(50) DEFAULT 'pending'::character varying,
      qc_approved_by uuid,
-     qc_approved_at timestamp with time zone,
+     qc_approved_at timestamp without time zone,
-     qc_notes text,
+     payment_received boolean DEFAULT false,
-     payment_received boolean DEFAULT false,
+     payment_received_at timestamp without time zone,
-     payment_received_at timestamp with time zone,
+     qc_notes text,
      payment_amount numeric(15,2),
      documents_released boolean DEFAULT false,
-     documents_released_at timestamp with time zone,
+     documents_released_at timestamp without time zone,
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
-     CONSTRAINT rd_business_years_qc_status_check CHECK ((qc_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'in_review'::text, 'ready_for_review'::text])))
+     business_setup_completed boolean DEFAULT false,
- );
+     business_setup_completed_at timestamp with time zone,
+     business_setup_completed_by uuid,
+     research_activities_completed boolean DEFAULT false,
+     research_activities_completed_at timestamp with time zone,
+     research_activities_completed_by uuid,
+     research_design_completed boolean DEFAULT false,
+     research_design_completed_at timestamp with time zone,
+     research_design_completed_by uuid,
+     calculations_completed boolean DEFAULT false,
+     calculations_completed_at timestamp with time zone,
+     calculations_completed_by uuid,
+     overall_completion_percentage integer DEFAULT 0,
+     last_step_completed text,
+     completion_updated_at timestamp with time zone DEFAULT now()
+ );
```

#### `rd_document_links`

**Difference:**
```diff
  CREATE TABLE public.rd_document_links (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
-     business_year_id uuid NOT NULL,
+     document_id uuid NOT NULL,
-     document_type character varying(100) NOT NULL,
+     link_type text NOT NULL,
-     document_url text NOT NULL,
+     supply_id uuid,
-     document_name text,
+     contractor_id uuid,
-     file_size integer,
+     amount_allocated numeric(15,2),
-     mime_type character varying(100),
+     allocation_percentage numeric(5,2),
-     is_active boolean DEFAULT true,
+     notes text,
-     created_at timestamp with time zone DEFAULT now(),
+     created_at timestamp without time zone DEFAULT now(),
-     updated_at timestamp with time zone DEFAULT now(),
+     updated_at timestamp without time zone DEFAULT now(),
-     allocation_percentage text,
+     CONSTRAINT rd_document_links_link_type_check CHECK ((link_type = ANY (ARRAY['supply'::text, 'contractor'::text]))),
-     contractor_id text,
+     CONSTRAINT valid_link CHECK ((((link_type = 'supply'::text) AND (supply_id IS NOT NULL) AND (contractor_id IS NULL)) OR ((link_type = 'contractor'::text) AND (contractor_id IS NOT NULL) AND (supply_id IS NULL))))
-     link_type text,
+ );
-     notes text,
-     document_id text,
-     amount_allocated text,
-     supply_id text
- );
```

#### `rd_signature_records`

**Difference:**
```diff
  CREATE TABLE public.rd_signature_records (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_year_id uuid NOT NULL,
-     document_type character varying(100) NOT NULL,
+     signer_name text NOT NULL,
-     signer_name text NOT NULL,
+     signature_image text NOT NULL,
-     signer_title text,
+     ip_address text NOT NULL,
-     signature_type character varying(50) DEFAULT 'digital'::character varying,
+     signed_at timestamp with time zone NOT NULL,
-     signature_data text,
+     jurat_text text NOT NULL,
-     signed_at timestamp with time zone NOT NULL,
+     created_at timestamp with time zone DEFAULT now() NOT NULL,
-     ip_address inet,
+     updated_at timestamp with time zone DEFAULT now() NOT NULL,
-     is_valid boolean DEFAULT true,
+     signer_title text,
-     created_at timestamp with time zone DEFAULT now(),
+     signer_email text
-     updated_at timestamp with time zone DEFAULT now(),
+ );
-     signer_email text,
-     signature_image text,
-     jurat_text text
- );
```

#### `rd_procedure_analysis`

**Difference:**
```diff
  CREATE TABLE public.rd_procedure_analysis (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
-     business_year_id uuid NOT NULL,
+     document_id uuid NOT NULL,
-     procedure_name text NOT NULL,
+     procedure_code text NOT NULL,
-     analysis_type character varying(50) NOT NULL,
+     procedure_description text,
-     analysis_result jsonb DEFAULT '{}'::jsonb,
+     procedure_category text,
-     confidence_score numeric(3,2) DEFAULT 0,
+     billed_units integer DEFAULT 0,
-     reviewer_notes text,
+     billed_amount numeric(15,2) DEFAULT 0,
-     is_approved boolean DEFAULT false,
+     frequency_annual integer,
-     approved_by uuid,
+     ai_confidence_score numeric(3,2),
-     approved_at timestamp with time zone,
+     extraction_method text DEFAULT 'ai'::text,
-     created_at timestamp with time zone DEFAULT now(),
+     raw_data jsonb,
-     updated_at timestamp with time zone DEFAULT now(),
+     created_at timestamp without time zone DEFAULT now(),
-     frequency_annual text,
+     updated_at timestamp without time zone DEFAULT now(),
-     raw_data text,
+     CONSTRAINT rd_procedure_analysis_ai_confidence_score_check CHECK (((ai_confidence_score >= (0)::numeric) AND (ai_confidence_score <= (1)::numeric))),
-     procedure_category text,
+     CONSTRAINT rd_procedure_analysis_extraction_method_check CHECK ((extraction_method = ANY (ARRAY['ai'::text, 'manual'::text])))
-     document_id text,
+ );
-     billed_amount text,
-     procedure_code text,
-     extraction_method text,
-     ai_confidence_score text,
-     billed_units text,
-     procedure_description text
- );
```

#### `rd_signatures`

**Difference:**
```diff
  CREATE TABLE public.rd_signatures (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
-     signature_record_id uuid NOT NULL,
+     business_year_id uuid,
-     signature_hash text NOT NULL,
+     signature_type character varying(50),
-     verification_status character varying(50) DEFAULT 'pending'::character varying,
+     signed_by character varying(255),
-     verification_data jsonb DEFAULT '{}'::jsonb,
+     signed_at timestamp without time zone,
-     is_archived boolean DEFAULT false,
+     signature_data jsonb,
-     created_at timestamp with time zone DEFAULT now(),
+     ip_address inet,
-     updated_at timestamp with time zone DEFAULT now(),
+     created_at timestamp without time zone DEFAULT now()
-     business_year_id text,
+ );
-     signature_type text,
-     signature_data text,
-     signed_at text,
-     ip_address text,
-     signed_by text
- );
```

#### `rd_client_portal_tokens`

**Difference:**
```diff
  CREATE TABLE public.rd_client_portal_tokens (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
-     business_id uuid NOT NULL,
+     business_id uuid,
-     token character varying(255) NOT NULL,
+     token character varying(255),
-     expires_at timestamp without time zone NOT NULL,
+     expires_at timestamp without time zone,
-     is_active boolean DEFAULT true,
+     created_by uuid,
-     created_at timestamp with time zone DEFAULT now(),
+     created_at timestamp without time zone DEFAULT now(),
-     updated_at timestamp with time zone DEFAULT now(),
+     is_active boolean DEFAULT true,
-     created_by uuid,
+     updated_at timestamp without time zone DEFAULT now(),
      access_count integer DEFAULT 0,
-     last_accessed_at timestamp with time zone,
+     last_accessed_at timestamp without time zone,
-     last_accessed_ip text
+     last_accessed_ip inet
  );
```

#### `rd_selected_subcomponents`

**Difference:**
```diff
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
-     practice_percentage numeric,
+     practice_percent numeric(5,2) DEFAULT 0,
      subcomponent_name_snapshot text,
-     practice_percent text,
+     step_name_snapshot text
-     step_name_snapshot text
+ );
- );
```

#### `rd_research_activities`

**Difference:**
```diff
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
-     business_id text,
+     deactivated_at timestamp without time zone,
-     deactivated_at text,
+     deactivation_reason text,
-     deactivation_reason text
+     business_id uuid
  );
```

#### `rd_employees`

**Difference:**
```diff
  CREATE TABLE public.rd_employees (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_id uuid NOT NULL,
      first_name text NOT NULL,
-     role_id uuid NOT NULL,
+     role_id uuid,
      is_owner boolean DEFAULT false,
      annual_wage numeric(15,2) NOT NULL,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      last_name text,
      user_id uuid
  );
```

#### `rd_federal_credit`

**Difference:**
```diff
  CREATE TABLE public.rd_federal_credit (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_year_id uuid NOT NULL,
-     base_amount numeric(15,2) DEFAULT 0,
+     client_id uuid NOT NULL,
-     qualified_research_expenses numeric(15,2) DEFAULT 0,
+     research_activity_id uuid,
-     credit_rate numeric(5,4) DEFAULT 0.20,
+     research_activity_name text,
-     calculated_credit numeric(15,2) DEFAULT 0,
+     direct_research_wages numeric(15,2) DEFAULT 0,
-     carryforward_available numeric(15,2) DEFAULT 0,
+     supplies_expenses numeric(15,2) DEFAULT 0,
-     carryforward_used numeric(15,2) DEFAULT 0,
+     contractor_expenses numeric(15,2) DEFAULT 0,
-     final_credit_amount numeric(15,2) DEFAULT 0,
+     total_qre numeric(15,2) DEFAULT 0,
-     calculation_method character varying(50) DEFAULT 'regular'::character varying,
+     subcomponent_count integer DEFAULT 0,
-     is_final boolean DEFAULT false,
+     subcomponent_groups text,
-     created_at timestamp with time zone DEFAULT now(),
+     applied_percent numeric(5,2) DEFAULT 0,
-     updated_at timestamp with time zone DEFAULT now(),
+     line_49f_description text,
-     supplies_expenses text,
+     ai_generation_timestamp timestamp without time zone,
-     research_activity_id text,
+     ai_prompt_used text,
-     direct_research_wages text,
+     ai_response_raw text,
-     federal_credit_percentage text,
+     federal_credit_amount numeric(15,2) DEFAULT 0,
-     contractor_expenses text,
+     federal_credit_percentage numeric(5,2) DEFAULT 0,
-     notes text,
+     calculation_method text,
-     ai_generation_timestamp text,
+     industry_type text,
-     applied_percent text,
+     focus_area text,
-     focus_area text,
+     general_description text,
-     federal_credit_amount text,
+     created_at timestamp without time zone DEFAULT now(),
-     line_49f_description text,
+     updated_at timestamp without time zone DEFAULT now(),
-     is_latest text,
+     created_by uuid,
-     client_id text,
+     updated_by uuid,
-     total_qre text,
+     version integer DEFAULT 1,
-     calculation_timestamp text,
+     is_latest boolean DEFAULT true,
-     subcomponent_groups text,
+     previous_version_id uuid,
-     version text,
+     calculation_timestamp timestamp without time zone DEFAULT now(),
-     subcomponent_count text,
+     data_snapshot jsonb,
-     ai_prompt_used text,
+     notes text,
-     general_description text,
+     CONSTRAINT valid_amounts CHECK (((direct_research_wages >= (0)::numeric) AND (supplies_expenses >= (0)::numeric) AND (contractor_expenses >= (0)::numeric))),
-     created_by text,
+     CONSTRAINT valid_percentages CHECK (((applied_percent >= (0)::numeric) AND (applied_percent <= (100)::numeric))),
-     updated_by text,
+     CONSTRAINT valid_subcomponent_count CHECK ((subcomponent_count >= 0))
-     research_activity_name text,
+ );
-     data_snapshot text,
-     previous_version_id text,
-     ai_response_raw text,
-     industry_type text
- );
```

#### `rd_state_proforma_data`

**Difference:**
```diff
  CREATE TABLE public.rd_state_proforma_data (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_year_id uuid NOT NULL,
-     state_code character(2) NOT NULL,
+     state_code character varying(2) NOT NULL,
-     proforma_type character varying(50) NOT NULL,
+     method character varying(20) NOT NULL,
-     data_values jsonb DEFAULT '{}'::jsonb,
+     data jsonb DEFAULT '{}'::jsonb NOT NULL,
-     calculation_date timestamp with time zone DEFAULT now(),
+     created_at timestamp with time zone DEFAULT now(),
-     is_approved boolean DEFAULT false,
+     updated_at timestamp with time zone DEFAULT now(),
-     created_at timestamp with time zone DEFAULT now(),
+     CONSTRAINT rd_state_proforma_data_method_check CHECK (((method)::text = ANY ((ARRAY['standard'::character varying, 'alternative'::character varying])::text[])))
-     updated_at timestamp with time zone DEFAULT now(),
+ );
-     method text,
-     data text
- );
```

#### `rd_qc_document_controls`

**Difference:**
```diff
  CREATE TABLE public.rd_qc_document_controls (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_year_id uuid NOT NULL,
-     document_type character varying(100) NOT NULL,
+     document_type character varying(50) NOT NULL,
-     control_type character varying(50) NOT NULL,
+     is_released boolean DEFAULT false,
-     status character varying(50) DEFAULT 'pending'::character varying,
+     released_at timestamp without time zone,
-     reviewer_id uuid,
+     released_by uuid,
-     review_notes text,
+     release_notes text,
-     reviewed_at timestamp with time zone,
+     requires_jurat boolean DEFAULT false,
-     is_approved boolean DEFAULT false,
+     requires_payment boolean DEFAULT false,
-     created_at timestamp with time zone DEFAULT now(),
+     qc_reviewer uuid,
-     updated_at timestamp with time zone DEFAULT now(),
+     qc_reviewed_at timestamp without time zone,
-     qc_reviewer text,
+     qc_review_notes text,
-     is_released text,
+     created_at timestamp without time zone DEFAULT now(),
-     released_by text,
+     updated_at timestamp without time zone DEFAULT now(),
      qc_approver_name text,
-     released_at text,
+     qc_approver_credentials text,
-     qc_review_notes text,
+     qc_approved_date timestamp with time zone,
-     qc_approver_credentials text,
+     qc_approver_ip_address text
-     qc_reviewed_at text,
+ );
-     release_notes text,
-     qc_approver_ip_address text,
-     qc_approved_date text,
-     requires_payment text,
-     requires_jurat text
- );
```

#### `rd_selected_steps`

**Difference:**
```diff
  CREATE TABLE public.rd_selected_steps (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_year_id uuid NOT NULL,
      research_activity_id uuid NOT NULL,
      step_id uuid NOT NULL,
      time_percentage numeric(5,2) DEFAULT 0 NOT NULL,
      applied_percentage numeric(5,2) DEFAULT 0 NOT NULL,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
-     non_rd_percentage text
+     non_rd_percentage numeric(5,2) DEFAULT 0,
- );
+     CONSTRAINT rd_selected_steps_non_rd_percentage_check CHECK (((non_rd_percentage >= (0)::numeric) AND (non_rd_percentage <= (100)::numeric)))
+ );
```

#### `rd_state_proformas`

**Difference:**
```diff
  CREATE TABLE public.rd_state_proformas (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      business_year_id uuid NOT NULL,
-     state_code character(2) NOT NULL,
+     state_code character varying(2) NOT NULL,
-     proforma_name text NOT NULL,
+     config jsonb DEFAULT '{}'::jsonb NOT NULL,
-     total_amount numeric(15,2) DEFAULT 0,
+     total_credit numeric(15,2) DEFAULT 0,
-     status character varying(50) DEFAULT 'draft'::character varying,
+     created_at timestamp without time zone DEFAULT now(),
-     generated_at timestamp with time zone DEFAULT now(),
+     updated_at timestamp without time zone DEFAULT now()
-     approved_by uuid,
+ );
-     approved_at timestamp with time zone,
-     created_at timestamp with time zone DEFAULT now(),
-     updated_at timestamp with time zone DEFAULT now(),
-     total_credit text,
-     config text
- );
```

#### `rd_reports`

**Difference:**
```diff
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
-     state_gross_receipts numeric(15,2),
+     state_gross_receipts jsonb DEFAULT '{}'::jsonb,
-     qc_approved_by uuid,
+     qc_approved_by text,
      qc_approved_at timestamp with time zone,
      qc_approver_ip text
  );
```


## Triggers

### ✅ Identical (9)

- `handle_rd_contractor_subcomponents_updated_at`
- `handle_rd_contractor_year_data_updated_at`
- `handle_rd_federal_credit_results_updated_at`
- `handle_rd_supply_subcomponents_updated_at`
- `handle_rd_supply_year_data_updated_at`
- `set_updated_at_rd_supplies`
- `set_updated_at_rd_supply_subcomponents`
- `set_updated_at_rd_supply_year_data`
- `update_rd_state_calculations_updated_at`

### ➕ Missing Locally (10)

#### `trigger_update_rd_state_proforma_data_updated_at`

```sql
CREATE TRIGGER trigger_update_rd_state_proforma_data_updated_at BEFORE UPDATE ON public.rd_state_proforma_data FOR EACH ROW EXECUTE FUNCTION public.update_rd_state_proforma_data_updated_at();
```

#### `update_rd_business_years_credits_calculated_at`

```sql
CREATE TRIGGER update_rd_business_years_credits_calculated_at BEFORE UPDATE OF federal_credit, state_credit ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_credits_calculated_at();
```

#### `trigger_update_rd_federal_credit_updated_at`

```sql
CREATE TRIGGER trigger_update_rd_federal_credit_updated_at BEFORE UPDATE ON public.rd_federal_credit FOR EACH ROW EXECUTE FUNCTION public.update_rd_federal_credit_updated_at();
```

#### `trigger_archive_rd_federal_credit_version`

```sql
CREATE TRIGGER trigger_archive_rd_federal_credit_version AFTER INSERT ON public.rd_federal_credit FOR EACH ROW EXECUTE FUNCTION public.archive_rd_federal_credit_version();
```

#### `trigger_update_total_qre`

```sql
CREATE TRIGGER trigger_update_total_qre BEFORE INSERT OR UPDATE OF employee_qre, contractor_qre, supply_qre ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_total_qre();
```

#### `trigger_update_completion_percentage`

```sql
CREATE TRIGGER trigger_update_completion_percentage BEFORE UPDATE OF business_setup_completed, research_activities_completed, research_design_completed, calculations_completed ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_completion_percentage();
```

#### `update_rd_reports_updated_at`

```sql
CREATE TRIGGER update_rd_reports_updated_at BEFORE UPDATE ON public.rd_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

#### `update_rd_roles_updated_at`

```sql
CREATE TRIGGER update_rd_roles_updated_at BEFORE UPDATE ON public.rd_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

#### `trigger_update_step_name`

```sql
CREATE TRIGGER trigger_update_step_name AFTER INSERT ON public.rd_selected_subcomponents FOR EACH ROW EXECUTE FUNCTION public.update_selected_subcomponent_step_name();
```

#### `trigger_safe_update_practice_percent`

```sql
CREATE TRIGGER trigger_safe_update_practice_percent AFTER INSERT ON public.rd_selected_subcomponents FOR EACH ROW EXECUTE FUNCTION public.safe_update_selected_subcomponent_practice_percent();
```


## Policies

### ✅ Identical (36)

- `Allow all for authenticated`
- `Allow all for dev`
- `Allow read access to rd_research_steps`
- `Allow read access to rd_research_subcomponents`
- `Enable delete access for authenticated users`
- `Enable delete for authenticated users only`
- `Enable insert access for authenticated users`
- `Enable insert for authenticated users only`
- `Enable read access for all users`
- `Enable read access for authenticated users`
- `Enable update access for authenticated users`
- `Enable update for authenticated users only`
- `Users can delete their own contractor subcomponents`
- `Users can delete their own contractor year data`
- `Users can delete their own federal credit results`
- `Users can delete their own supplies`
- `Users can delete their own supply subcomponents`
- `Users can delete their own supply year data`
- `Users can insert their own contractor subcomponents`
- `Users can insert their own contractor year data`
- `Users can insert their own federal credit results`
- `Users can insert their own supplies`
- `Users can insert their own supply subcomponents`
- `Users can insert their own supply year data`
- `Users can update their own contractor subcomponents`
- `Users can update their own contractor year data`
- `Users can update their own federal credit results`
- `Users can update their own supplies`
- `Users can update their own supply subcomponents`
- `Users can update their own supply year data`
- `Users can view their own contractor subcomponents`
- `Users can view their own contractor year data`
- `Users can view their own federal credit results`
- `Users can view their own supplies`
- `Users can view their own supply subcomponents`
- `Users can view their own supply year data`

### 🔄 Different (3)

#### `Admin can manage QC controls`

**Difference:**
```diff
- CREATE POLICY "Admin can manage QC controls" ON public.rd_qc_document_controls USING (public.user_is_admin(auth.uid()));
+ CREATE POLICY "Admin can manage QC controls" ON public.rd_qc_document_controls USING ((EXISTS ( SELECT 1
+    FROM public.profiles
+   WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));
```

#### `Admin can view all signatures`

**Difference:**
```diff
- CREATE POLICY "Admin can view all signatures" ON public.rd_signatures FOR SELECT USING (public.user_is_admin(auth.uid()));
+ CREATE POLICY "Admin can view all signatures" ON public.rd_signatures FOR SELECT USING ((EXISTS ( SELECT 1
+    FROM public.profiles
+   WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));
```

#### `Admin can manage portal tokens`

**Difference:**
```diff
- CREATE POLICY "Admin can manage portal tokens" ON public.rd_client_portal_tokens USING (public.user_is_admin(auth.uid()));
+ CREATE POLICY "Admin can manage portal tokens" ON public.rd_client_portal_tokens USING ((EXISTS ( SELECT 1
+    FROM public.profiles
+   WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));
```

### ➕ Missing Locally (14)

#### `Enable update for authenticated users`

```sql
CREATE POLICY "Enable update for authenticated users" ON public.rd_research_subcomponents FOR UPDATE USING (true);
```

#### `Users can insert own rd_federal_credit`

```sql
CREATE POLICY "Users can insert own rd_federal_credit" ON public.rd_federal_credit FOR INSERT WITH CHECK ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));
```

#### `Users can view their own state pro forma data`

```sql
CREATE POLICY "Users can view their own state pro forma data" ON public.rd_state_proforma_data FOR SELECT USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
```

#### `Users can delete their own state pro forma data`

```sql
CREATE POLICY "Users can delete their own state pro forma data" ON public.rd_state_proforma_data FOR DELETE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
```

#### `Users can view own rd_federal_credit`

```sql
CREATE POLICY "Users can view own rd_federal_credit" ON public.rd_federal_credit FOR SELECT USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));
```

#### `Allow authenticated users to view signatures`

```sql
CREATE POLICY "Allow authenticated users to view signatures" ON public.rd_signature_records FOR SELECT USING ((auth.role() = 'authenticated'::text));
```

#### `Enable delete for authenticated users`

```sql
CREATE POLICY "Enable delete for authenticated users" ON public.rd_research_subcomponents FOR DELETE USING (true);
```

#### `Users can update own rd_federal_credit`

```sql
CREATE POLICY "Users can update own rd_federal_credit" ON public.rd_federal_credit FOR UPDATE USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));
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

#### `Allow authenticated users to create signatures`

```sql
CREATE POLICY "Allow authenticated users to create signatures" ON public.rd_signature_records FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
```

#### `Users can update their own state pro forma data`

```sql
CREATE POLICY "Users can update their own state pro forma data" ON public.rd_state_proforma_data FOR UPDATE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
```

#### `Admin can manage all signature records`

```sql
CREATE POLICY "Admin can manage all signature records" ON public.rd_signature_records USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
```

#### `Anyone can create signatures via portal`

```sql
CREATE POLICY "Anyone can create signatures via portal" ON public.rd_signatures FOR INSERT WITH CHECK (true);
```

### ➖ Local Only (2)

#### `Admin and client users can access R&D documents`

```sql
CREATE POLICY "Admin and client users can access R&D documents" ON public.rd_document_links USING ((public.user_is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public.rd_business_years rby
     JOIN public.rd_businesses rb ON ((rby.business_id = rb.id)))
  WHERE ((rby.id = rd_document_links.business_year_id) AND public.user_has_client_access(auth.uid(), rb.client_id))))));
```

#### `Admin and client users can access R&D data`

```sql
CREATE POLICY "Admin and client users can access R&D data" ON public.rd_billable_time_summary USING ((public.user_is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public.rd_business_years rby
     JOIN public.rd_businesses rb ON ((rby.business_id = rb.id)))
  WHERE ((rby.id = rd_billable_time_summary.business_year_id) AND public.user_has_client_access(auth.uid(), rb.client_id))))));
```


## Indexes

### ✅ Identical (43)

- `idx_rd_business_years_business_year`
- `idx_rd_businesses_historical_data`
- `idx_rd_contractor_subcomponents_business_year_id`
- `idx_rd_contractor_subcomponents_contractor_id`
- `idx_rd_contractor_subcomponents_subcomponent_id`
- `idx_rd_contractor_subcomponents_user_id`
- `idx_rd_contractor_year_data_business_year_id`
- `idx_rd_contractor_year_data_contractor_id`
- `idx_rd_contractor_year_data_user_id`
- `idx_rd_contractors_business_id`
- `idx_rd_contractors_role_id`
- `idx_rd_contractors_user_id`
- `idx_rd_employee_subcomponents_employee_id`
- `idx_rd_employee_subcomponents_subcomponent_id`
- `idx_rd_employee_subcomponents_user_id`
- `idx_rd_employee_year_data_employee_year`
- `idx_rd_employee_year_data_user_id`
- `idx_rd_employees_user_id`
- `idx_rd_expenses_business_year_id`
- `idx_rd_expenses_category`
- `idx_rd_expenses_employee_id`
- `idx_rd_federal_credit_results_business_year_id`
- `idx_rd_federal_credit_results_calculation_date`
- `idx_rd_reports_business_year_type`
- `idx_rd_research_steps_activity_id`
- `idx_rd_research_subcomponents_step_id`
- `idx_rd_roles_business_year_id`
- `idx_rd_roles_is_default`
- `idx_rd_roles_unique_default_per_year`
- `idx_rd_selected_activities_business_year_activity`
- `idx_rd_selected_steps_activity`
- `idx_rd_selected_steps_business_year`
- `idx_rd_selected_subcomponents_activity`
- `idx_rd_selected_subcomponents_business_year`
- `idx_rd_selected_subcomponents_step`
- `idx_rd_supplies_business_id`
- `idx_rd_supply_subcomponents_business_year_id`
- `idx_rd_supply_subcomponents_subcomponent_id`
- `idx_rd_supply_subcomponents_supply_id`
- `idx_state_calculations_active`
- `idx_state_calculations_state`
- `idx_state_calculations_unique`
- `idx_state_calculations_year`

### ➕ Missing Locally (53)

#### `idx_rd_signature_records_signed_at`

```sql
CREATE INDEX idx_rd_signature_records_signed_at ON public.rd_signature_records USING btree (signed_at);
```

#### `idx_state_proformas_business_year`

```sql
CREATE INDEX idx_state_proformas_business_year ON public.rd_state_proformas USING btree (business_year_id);
```

#### `idx_rd_client_portal_tokens_active`

```sql
CREATE INDEX idx_rd_client_portal_tokens_active ON public.rd_client_portal_tokens USING btree (business_id, is_active, expires_at) WHERE (is_active = true);
```

#### `idx_billable_summary_activity`

```sql
CREATE INDEX idx_billable_summary_activity ON public.rd_billable_time_summary USING btree (research_activity_id);
```

#### `idx_rd_reports_qc_approved_at`

```sql
CREATE INDEX idx_rd_reports_qc_approved_at ON public.rd_reports USING btree (qc_approved_at) WHERE (qc_approved_at IS NOT NULL);
```

#### `idx_rd_research_steps_activity_step_order`

```sql
CREATE INDEX idx_rd_research_steps_activity_step_order ON public.rd_research_steps USING btree (research_activity_id, step_order);
```

#### `idx_rd_signatures_signed_at`

```sql
CREATE INDEX idx_rd_signatures_signed_at ON public.rd_signatures USING btree (signed_at);
```

#### `idx_rd_roles_type`

```sql
CREATE INDEX idx_rd_roles_type ON public.rd_roles USING btree (type);
```

#### `idx_rd_reports_state_gross_receipts`

```sql
CREATE INDEX idx_rd_reports_state_gross_receipts ON public.rd_reports USING gin (state_gross_receipts);
```

#### `idx_rd_client_portal_tokens_business`

```sql
CREATE INDEX idx_rd_client_portal_tokens_business ON public.rd_client_portal_tokens USING btree (business_id);
```

#### `idx_rd_businesses_ein`

```sql
CREATE INDEX idx_rd_businesses_ein ON public.rd_businesses USING btree (ein) WHERE (ein IS NOT NULL);
```

#### `idx_rd_business_years_credits_locked`

```sql
CREATE INDEX idx_rd_business_years_credits_locked ON public.rd_business_years USING btree (credits_locked) WHERE (credits_locked = true);
```

#### `idx_rd_federal_credit_client`

```sql
CREATE INDEX idx_rd_federal_credit_client ON public.rd_federal_credit USING btree (client_id);
```

#### `idx_rd_research_activities_business_id`

```sql
CREATE INDEX idx_rd_research_activities_business_id ON public.rd_research_activities USING btree (business_id);
```

#### `idx_procedure_links_activity`

```sql
CREATE INDEX idx_procedure_links_activity ON public.rd_procedure_research_links USING btree (research_activity_id);
```

#### `idx_rd_client_portal_tokens_token`

```sql
CREATE INDEX idx_rd_client_portal_tokens_token ON public.rd_client_portal_tokens USING btree (token);
```

#### `idx_support_docs_status`

```sql
CREATE INDEX idx_support_docs_status ON public.rd_support_documents USING btree (processing_status);
```

#### `idx_state_credit_configs_state_code`

```sql
CREATE INDEX idx_state_credit_configs_state_code ON public.rd_state_credit_configs USING btree (state_code);
```

#### `idx_rd_client_portal_tokens_business_id`

```sql
CREATE INDEX idx_rd_client_portal_tokens_business_id ON public.rd_client_portal_tokens USING btree (business_id);
```

#### `idx_rd_business_years_research_activities_completed`

```sql
CREATE INDEX idx_rd_business_years_research_activities_completed ON public.rd_business_years USING btree (research_activities_completed) WHERE (research_activities_completed = true);
```

#### `idx_document_links_supply`

```sql
CREATE INDEX idx_document_links_supply ON public.rd_document_links USING btree (supply_id);
```

#### `idx_rd_reports_html_not_null`

```sql
CREATE INDEX idx_rd_reports_html_not_null ON public.rd_reports USING btree (business_year_id, type) WHERE (generated_html IS NOT NULL);
```

#### `idx_support_docs_type`

```sql
CREATE INDEX idx_support_docs_type ON public.rd_support_documents USING btree (document_type);
```

#### `idx_rd_business_years_completion_percentage`

```sql
CREATE INDEX idx_rd_business_years_completion_percentage ON public.rd_business_years USING btree (overall_completion_percentage);
```

#### `idx_rd_federal_credit_latest`

```sql
CREATE INDEX idx_rd_federal_credit_latest ON public.rd_federal_credit USING btree (is_latest) WHERE (is_latest = true);
```

#### `idx_rd_signatures_type`

```sql
CREATE INDEX idx_rd_signatures_type ON public.rd_signatures USING btree (signature_type);
```

#### `idx_procedure_links_status`

```sql
CREATE INDEX idx_procedure_links_status ON public.rd_procedure_research_links USING btree (status);
```

#### `idx_unique_procedure_research_link`

```sql
CREATE UNIQUE INDEX idx_unique_procedure_research_link ON public.rd_procedure_research_links USING btree (procedure_analysis_id, research_activity_id, subcomponent_id);
```

#### `idx_rd_federal_credit_created_at`

```sql
CREATE INDEX idx_rd_federal_credit_created_at ON public.rd_federal_credit USING btree (created_at);
```

#### `idx_rd_business_years_research_design_completed`

```sql
CREATE INDEX idx_rd_business_years_research_design_completed ON public.rd_business_years USING btree (research_design_completed) WHERE (research_design_completed = true);
```

#### `idx_billable_summary_business_year`

```sql
CREATE INDEX idx_billable_summary_business_year ON public.rd_billable_time_summary USING btree (business_year_id);
```

#### `idx_rd_research_subcomponents_business_id`

```sql
CREATE INDEX idx_rd_research_subcomponents_business_id ON public.rd_research_subcomponents USING btree (business_id);
```

#### `idx_rd_business_years_calculations_completed`

```sql
CREATE INDEX idx_rd_business_years_calculations_completed ON public.rd_business_years USING btree (calculations_completed) WHERE (calculations_completed = true);
```

#### `idx_rd_signature_records_business_year_id`

```sql
CREATE INDEX idx_rd_signature_records_business_year_id ON public.rd_signature_records USING btree (business_year_id);
```

#### `idx_rd_signatures_business_year`

```sql
CREATE INDEX idx_rd_signatures_business_year ON public.rd_signatures USING btree (business_year_id);
```

#### `idx_document_links_contractor`

```sql
CREATE INDEX idx_document_links_contractor ON public.rd_document_links USING btree (contractor_id);
```

#### `idx_rd_business_years_business_setup_completed`

```sql
CREATE INDEX idx_rd_business_years_business_setup_completed ON public.rd_business_years USING btree (business_setup_completed) WHERE (business_setup_completed = true);
```

#### `idx_rd_research_steps_business_id`

```sql
CREATE INDEX idx_rd_research_steps_business_id ON public.rd_research_steps USING btree (business_id);
```

#### `idx_rd_businesses_category_id`

```sql
CREATE INDEX idx_rd_businesses_category_id ON public.rd_businesses USING btree (category_id);
```

#### `idx_rd_federal_credit_activity`

```sql
CREATE INDEX idx_rd_federal_credit_activity ON public.rd_federal_credit USING btree (research_activity_id);
```

#### `idx_rd_qc_document_controls_business_year`

```sql
CREATE INDEX idx_rd_qc_document_controls_business_year ON public.rd_qc_document_controls USING btree (business_year_id);
```

#### `idx_state_proforma_lines_state_proforma_id`

```sql
CREATE INDEX idx_state_proforma_lines_state_proforma_id ON public.rd_state_proforma_lines USING btree (state_proforma_id);
```

#### `idx_rd_state_proforma_data_lookup`

```sql
CREATE INDEX idx_rd_state_proforma_data_lookup ON public.rd_state_proforma_data USING btree (business_year_id, state_code, method);
```

#### `idx_support_docs_business_year`

```sql
CREATE INDEX idx_support_docs_business_year ON public.rd_support_documents USING btree (business_year_id);
```

#### `idx_rd_businesses_github_token_exists`

```sql
CREATE INDEX idx_rd_businesses_github_token_exists ON public.rd_businesses USING btree (github_token) WHERE (github_token IS NOT NULL);
```

#### `idx_procedure_analysis_doc`

```sql
CREATE INDEX idx_procedure_analysis_doc ON public.rd_procedure_analysis USING btree (document_id);
```

#### `idx_procedure_analysis_code`

```sql
CREATE INDEX idx_procedure_analysis_code ON public.rd_procedure_analysis USING btree (procedure_code);
```

#### `idx_document_links_doc`

```sql
CREATE INDEX idx_document_links_doc ON public.rd_document_links USING btree (document_id);
```

#### `idx_rd_federal_credit_business_year`

```sql
CREATE INDEX idx_rd_federal_credit_business_year ON public.rd_federal_credit USING btree (business_year_id);
```

#### `idx_rd_qc_document_controls_type`

```sql
CREATE INDEX idx_rd_qc_document_controls_type ON public.rd_qc_document_controls USING btree (document_type);
```

#### `idx_rd_qc_document_controls_qc_approved_date`

```sql
CREATE INDEX idx_rd_qc_document_controls_qc_approved_date ON public.rd_qc_document_controls USING btree (qc_approved_date) WHERE (qc_approved_date IS NOT NULL);
```

#### `idx_rd_qc_document_controls_released`

```sql
CREATE INDEX idx_rd_qc_document_controls_released ON public.rd_qc_document_controls USING btree (is_released);
```

#### `idx_rd_research_activities_global`

```sql
CREATE INDEX idx_rd_research_activities_global ON public.rd_research_activities USING btree (id) WHERE (business_id IS NULL);
```

### ➖ Local Only (3)

#### `idx_rd_billable_time_summary_business_year`

```sql
CREATE INDEX idx_rd_billable_time_summary_business_year ON public.rd_billable_time_summary USING btree (business_year_id);
```

#### `idx_rd_client_portal_tokens_business_active`

```sql
CREATE INDEX idx_rd_client_portal_tokens_business_active ON public.rd_client_portal_tokens USING btree (business_id, is_active);
```

#### `idx_rd_signature_records_business_type`

```sql
CREATE INDEX idx_rd_signature_records_business_type ON public.rd_signature_records USING btree (business_year_id, document_type);
```

