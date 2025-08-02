-- Sync Remote Database Structure
-- Purpose: Align local database structure with remote database
-- Date: 2025-07-31
-- Includes: Table changes, policies, triggers, indexes

BEGIN;

-- TABLE CHANGES
-- Based on comparison analysis, updating tables to match remote structure

-- 1. rd_state_credit_configs: Restructure columns completely
ALTER TABLE public.rd_state_credit_configs DROP COLUMN IF EXISTS tax_year;
ALTER TABLE public.rd_state_credit_configs DROP COLUMN IF EXISTS credit_rate;
ALTER TABLE public.rd_state_credit_configs DROP COLUMN IF EXISTS minimum_threshold;
ALTER TABLE public.rd_state_credit_configs DROP COLUMN IF EXISTS maximum_credit;
ALTER TABLE public.rd_state_credit_configs DROP COLUMN IF EXISTS carryforward_years;
ALTER TABLE public.rd_state_credit_configs DROP COLUMN IF EXISTS special_rules;
ALTER TABLE public.rd_state_credit_configs DROP COLUMN IF EXISTS is_active;
ALTER TABLE public.rd_state_credit_configs DROP COLUMN IF EXISTS config;

-- Change state_code type and add new columns
ALTER TABLE public.rd_state_credit_configs ALTER COLUMN state_code TYPE character varying(2);
ALTER TABLE public.rd_state_credit_configs ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.rd_state_credit_configs ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_state_credit_configs ALTER COLUMN updated_at TYPE timestamp without time zone;

-- 2. rd_state_proforma_lines: Major restructure
ALTER TABLE public.rd_state_proforma_lines DROP COLUMN IF EXISTS proforma_data_id;
ALTER TABLE public.rd_state_proforma_lines DROP COLUMN IF EXISTS line_description;
ALTER TABLE public.rd_state_proforma_lines DROP COLUMN IF EXISTS line_value;
ALTER TABLE public.rd_state_proforma_lines DROP COLUMN IF EXISTS calculation_formula;
ALTER TABLE public.rd_state_proforma_lines DROP COLUMN IF EXISTS is_calculated;

-- Add new columns and rename existing ones
ALTER TABLE public.rd_state_proforma_lines ADD COLUMN IF NOT EXISTS state_proforma_id uuid NOT NULL;
ALTER TABLE public.rd_state_proforma_lines ALTER COLUMN line_number TYPE character varying(10);
ALTER TABLE public.rd_state_proforma_lines ADD COLUMN IF NOT EXISTS description text NOT NULL;
ALTER TABLE public.rd_state_proforma_lines ADD COLUMN IF NOT EXISTS amount numeric(15,2) DEFAULT 0;
ALTER TABLE public.rd_state_proforma_lines ADD COLUMN IF NOT EXISTS is_editable boolean DEFAULT true;
ALTER TABLE public.rd_state_proforma_lines ADD COLUMN IF NOT EXISTS calculation_formula text;
ALTER TABLE public.rd_state_proforma_lines ADD COLUMN IF NOT EXISTS line_type character varying(50);
ALTER TABLE public.rd_state_proforma_lines ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL;
ALTER TABLE public.rd_state_proforma_lines ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_state_proforma_lines ALTER COLUMN updated_at TYPE timestamp without time zone;

-- 3. rd_procedure_research_links: Complete restructure
ALTER TABLE public.rd_procedure_research_links DROP COLUMN IF EXISTS relevance_score;
ALTER TABLE public.rd_procedure_research_links DROP COLUMN IF EXISTS link_type;
ALTER TABLE public.rd_procedure_research_links DROP COLUMN IF EXISTS notes;

-- Convert existing text columns to proper types and add new columns
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN subcomponent_id TYPE uuid USING subcomponent_id::uuid;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN allocation_percentage TYPE numeric(5,2) USING CASE WHEN allocation_percentage ~ '^[0-9]+\.?[0-9]*$' THEN allocation_percentage::numeric(5,2) ELSE NULL END;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN allocation_percentage SET NOT NULL;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN estimated_research_time_hours TYPE numeric(10,2) USING CASE WHEN estimated_research_time_hours ~ '^[0-9]+\.?[0-9]*$' THEN estimated_research_time_hours::numeric(10,2) ELSE NULL END;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN ai_confidence_score TYPE numeric(3,2) USING CASE WHEN ai_confidence_score ~ '^[0-9]+\.?[0-9]*$' THEN ai_confidence_score::numeric(3,2) ELSE NULL END;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN status SET DEFAULT 'pending'::text;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN manual_override TYPE boolean USING CASE WHEN manual_override = 'true' THEN true WHEN manual_override = 'false' THEN false ELSE false END;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN manual_override SET DEFAULT false;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN approved_by TYPE uuid USING approved_by::uuid;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_procedure_research_links ALTER COLUMN updated_at TYPE timestamp without time zone;

-- Add constraints after column type conversions
ALTER TABLE public.rd_procedure_research_links ADD CONSTRAINT rd_procedure_research_links_ai_confidence_score_check CHECK (((ai_confidence_score >= (0)::numeric) AND (ai_confidence_score <= (1)::numeric)));
ALTER TABLE public.rd_procedure_research_links ADD CONSTRAINT rd_procedure_research_links_allocation_percentage_check CHECK (((allocation_percentage > (0)::numeric) AND (allocation_percentage <= (100)::numeric)));
ALTER TABLE public.rd_procedure_research_links ADD CONSTRAINT rd_procedure_research_links_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'modified'::text])));

-- 4. rd_research_steps: Update column types and add new fields
ALTER TABLE public.rd_research_steps ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.rd_research_steps ALTER COLUMN deactivated_at TYPE timestamp without time zone USING CASE 
    WHEN deactivated_at IS NULL OR deactivated_at = '' THEN NULL
    WHEN deactivated_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN deactivated_at::timestamp without time zone
    ELSE NULL
END;
ALTER TABLE public.rd_research_steps ADD COLUMN IF NOT EXISTS deactivation_reason text;
ALTER TABLE public.rd_research_steps ALTER COLUMN business_id TYPE uuid USING business_id::uuid;

-- 5. rd_state_calculations_full: Major restructure
ALTER TABLE public.rd_state_calculations_full DROP COLUMN IF EXISTS base_calculation_id;
ALTER TABLE public.rd_state_calculations_full DROP COLUMN IF EXISTS state_code;
ALTER TABLE public.rd_state_calculations_full DROP COLUMN IF EXISTS detailed_breakdown;
ALTER TABLE public.rd_state_calculations_full DROP COLUMN IF EXISTS calculation_notes;
ALTER TABLE public.rd_state_calculations_full DROP COLUMN IF EXISTS override_values;
ALTER TABLE public.rd_state_calculations_full DROP COLUMN IF EXISTS final_amount;
ALTER TABLE public.rd_state_calculations_full DROP COLUMN IF EXISTS is_final;

-- Add new columns
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS state character varying(2) NOT NULL;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS calculation_method text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS refundable text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS carryforward text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS eligible_entities text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS special_notes text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS start_year text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS formula_correct text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS standard_credit_formula text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS alternate_credit_formula text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS additional_credit_formula text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS end_year text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS standard_info text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS alternative_info text;
ALTER TABLE public.rd_state_calculations_full ADD COLUMN IF NOT EXISTS other_info text;

-- 6. rd_research_subcomponents: Update column types
ALTER TABLE public.rd_research_subcomponents ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.rd_research_subcomponents ALTER COLUMN deactivated_at TYPE timestamp without time zone USING CASE 
    WHEN deactivated_at IS NULL OR deactivated_at = '' THEN NULL
    WHEN deactivated_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN deactivated_at::timestamp without time zone
    ELSE NULL
END;
ALTER TABLE public.rd_research_subcomponents ADD COLUMN IF NOT EXISTS deactivation_reason text;
ALTER TABLE public.rd_research_subcomponents ALTER COLUMN business_id TYPE uuid USING business_id::uuid;

-- 7. rd_support_documents: Major restructure
ALTER TABLE public.rd_support_documents DROP COLUMN IF EXISTS document_category;
ALTER TABLE public.rd_support_documents DROP COLUMN IF EXISTS document_title;
ALTER TABLE public.rd_support_documents DROP COLUMN IF EXISTS document_path;
ALTER TABLE public.rd_support_documents DROP COLUMN IF EXISTS document_size;
ALTER TABLE public.rd_support_documents DROP COLUMN IF EXISTS document_hash;
ALTER TABLE public.rd_support_documents DROP COLUMN IF EXISTS upload_status;
ALTER TABLE public.rd_support_documents DROP COLUMN IF EXISTS reviewed_by;
ALTER TABLE public.rd_support_documents DROP COLUMN IF EXISTS review_status;
ALTER TABLE public.rd_support_documents DROP COLUMN IF EXISTS review_notes;

-- Add new columns
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS document_type text NOT NULL;
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS file_name text NOT NULL;
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS file_path text NOT NULL;
ALTER TABLE public.rd_support_documents ALTER COLUMN file_size TYPE bigint USING CASE WHEN file_size ~ '^[0-9]+$' THEN file_size::bigint ELSE NULL END;
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS upload_date timestamp without time zone DEFAULT now();
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS uploaded_by uuid;
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending'::text;
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS ai_analysis jsonb;
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE public.rd_support_documents ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.rd_support_documents ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_support_documents ALTER COLUMN updated_at TYPE timestamp without time zone;

-- Add constraints
ALTER TABLE public.rd_support_documents ADD CONSTRAINT rd_support_documents_document_type_check CHECK ((document_type = ANY (ARRAY['invoice'::text, '1099'::text, 'procedure_report'::text])));
ALTER TABLE public.rd_support_documents ADD CONSTRAINT rd_support_documents_processing_status_check CHECK ((processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'manual_review'::text])));

-- 8. rd_billable_time_summary: Major restructure
ALTER TABLE public.rd_billable_time_summary DROP COLUMN IF EXISTS employee_id;
ALTER TABLE public.rd_billable_time_summary DROP COLUMN IF EXISTS contractor_id;
ALTER TABLE public.rd_billable_time_summary DROP COLUMN IF EXISTS total_hours;
ALTER TABLE public.rd_billable_time_summary DROP COLUMN IF EXISTS billable_hours;
ALTER TABLE public.rd_billable_time_summary DROP COLUMN IF EXISTS billable_percentage;
ALTER TABLE public.rd_billable_time_summary DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE public.rd_billable_time_summary DROP COLUMN IF EXISTS total_cost;

-- Add/update columns
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS research_activity_id uuid NOT NULL;
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS subcomponent_id uuid;
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS total_procedures_count integer DEFAULT 0;
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS total_billed_units integer DEFAULT 0;
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS total_billed_amount numeric(15,2) DEFAULT 0;
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS estimated_total_time_hours numeric(10,2) DEFAULT 0;
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS current_practice_percentage numeric(5,2);
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS calculated_billable_percentage numeric(5,2);
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS recommended_percentage numeric(5,2);
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS percentage_variance numeric(5,2);
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS last_calculated timestamp without time zone DEFAULT now();
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS calculation_source text DEFAULT 'ai_analysis'::text;
ALTER TABLE public.rd_billable_time_summary ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.rd_billable_time_summary ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_billable_time_summary ALTER COLUMN updated_at TYPE timestamp without time zone;

-- 9. rd_businesses: Update column constraints and types
ALTER TABLE public.rd_businesses ALTER COLUMN ein DROP NOT NULL;
ALTER TABLE public.rd_businesses ALTER COLUMN entity_type SET DEFAULT 'OTHER'::public.entity_type;
ALTER TABLE public.rd_businesses ALTER COLUMN naics TYPE character varying(10);

-- 10. rd_selected_activities: Fix column type
ALTER TABLE public.rd_selected_activities ALTER COLUMN is_enabled TYPE boolean USING CASE WHEN is_enabled = 'true' THEN true WHEN is_enabled = 'false' THEN false ELSE true END;
ALTER TABLE public.rd_selected_activities ALTER COLUMN is_enabled SET DEFAULT true;
ALTER TABLE public.rd_selected_activities ALTER COLUMN is_enabled SET NOT NULL;

-- 11. rd_business_years: Add new completion tracking columns
ALTER TABLE public.rd_business_years ALTER COLUMN qc_status TYPE character varying(50);
ALTER TABLE public.rd_business_years ALTER COLUMN qc_approved_at TYPE timestamp without time zone;
ALTER TABLE public.rd_business_years ALTER COLUMN payment_received_at TYPE timestamp without time zone;
ALTER TABLE public.rd_business_years ALTER COLUMN documents_released_at TYPE timestamp without time zone;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS business_setup_completed boolean DEFAULT false;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS business_setup_completed_at timestamp with time zone;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS business_setup_completed_by uuid;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS research_activities_completed boolean DEFAULT false;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS research_activities_completed_at timestamp with time zone;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS research_activities_completed_by uuid;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS research_design_completed boolean DEFAULT false;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS research_design_completed_at timestamp with time zone;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS research_design_completed_by uuid;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS calculations_completed boolean DEFAULT false;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS calculations_completed_at timestamp with time zone;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS calculations_completed_by uuid;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS overall_completion_percentage integer DEFAULT 0;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS last_step_completed text;
ALTER TABLE public.rd_business_years ADD COLUMN IF NOT EXISTS completion_updated_at timestamp with time zone DEFAULT now();

-- Drop old constraint if exists
ALTER TABLE public.rd_business_years DROP CONSTRAINT IF EXISTS rd_business_years_qc_status_check;

-- 12. rd_document_links: Complete restructure
-- First drop the dependent policy
DROP POLICY IF EXISTS "Admin and client users can access R&D documents" ON public.rd_document_links;
ALTER TABLE public.rd_document_links DROP COLUMN IF EXISTS business_year_id;
ALTER TABLE public.rd_document_links DROP COLUMN IF EXISTS document_type;
ALTER TABLE public.rd_document_links DROP COLUMN IF EXISTS document_url;
ALTER TABLE public.rd_document_links DROP COLUMN IF EXISTS document_name;
ALTER TABLE public.rd_document_links DROP COLUMN IF EXISTS file_size;
ALTER TABLE public.rd_document_links DROP COLUMN IF EXISTS mime_type;
ALTER TABLE public.rd_document_links DROP COLUMN IF EXISTS is_active;

-- Add new columns
ALTER TABLE public.rd_document_links ADD COLUMN IF NOT EXISTS document_id uuid NOT NULL;
ALTER TABLE public.rd_document_links ADD COLUMN IF NOT EXISTS link_type text NOT NULL;
ALTER TABLE public.rd_document_links ADD COLUMN IF NOT EXISTS supply_id uuid;
ALTER TABLE public.rd_document_links ADD COLUMN IF NOT EXISTS contractor_id uuid;
ALTER TABLE public.rd_document_links ADD COLUMN IF NOT EXISTS amount_allocated numeric(15,2);
ALTER TABLE public.rd_document_links ADD COLUMN IF NOT EXISTS allocation_percentage numeric(5,2);
ALTER TABLE public.rd_document_links ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.rd_document_links ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_document_links ALTER COLUMN updated_at TYPE timestamp without time zone;

-- Add constraints
ALTER TABLE public.rd_document_links ADD CONSTRAINT rd_document_links_link_type_check CHECK ((link_type = ANY (ARRAY['supply'::text, 'contractor'::text])));
ALTER TABLE public.rd_document_links ADD CONSTRAINT valid_link CHECK ((((link_type = 'supply'::text) AND (supply_id IS NOT NULL) AND (contractor_id IS NULL)) OR ((link_type = 'contractor'::text) AND (contractor_id IS NOT NULL) AND (supply_id IS NULL))));

-- 13. rd_signature_records: Complete restructure
ALTER TABLE public.rd_signature_records DROP COLUMN IF EXISTS document_type;
ALTER TABLE public.rd_signature_records DROP COLUMN IF EXISTS signer_title;
ALTER TABLE public.rd_signature_records DROP COLUMN IF EXISTS signature_type;
ALTER TABLE public.rd_signature_records DROP COLUMN IF EXISTS signature_data;
ALTER TABLE public.rd_signature_records DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.rd_signature_records DROP COLUMN IF EXISTS is_valid;
ALTER TABLE public.rd_signature_records DROP COLUMN IF EXISTS signer_email;

-- Add new columns
ALTER TABLE public.rd_signature_records ADD COLUMN IF NOT EXISTS signature_image text NOT NULL;
ALTER TABLE public.rd_signature_records ADD COLUMN IF NOT EXISTS ip_address text NOT NULL;
ALTER TABLE public.rd_signature_records ADD COLUMN IF NOT EXISTS jurat_text text NOT NULL;
ALTER TABLE public.rd_signature_records ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.rd_signature_records ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE public.rd_signature_records ADD COLUMN IF NOT EXISTS signer_title text;
ALTER TABLE public.rd_signature_records ADD COLUMN IF NOT EXISTS signer_email text;

-- 14. rd_procedure_analysis: Major restructure
ALTER TABLE public.rd_procedure_analysis DROP COLUMN IF EXISTS business_year_id;
ALTER TABLE public.rd_procedure_analysis DROP COLUMN IF EXISTS procedure_name;
ALTER TABLE public.rd_procedure_analysis DROP COLUMN IF EXISTS analysis_type;
ALTER TABLE public.rd_procedure_analysis DROP COLUMN IF EXISTS analysis_result;
ALTER TABLE public.rd_procedure_analysis DROP COLUMN IF EXISTS confidence_score;
ALTER TABLE public.rd_procedure_analysis DROP COLUMN IF EXISTS reviewer_notes;
ALTER TABLE public.rd_procedure_analysis DROP COLUMN IF EXISTS is_approved;
ALTER TABLE public.rd_procedure_analysis DROP COLUMN IF EXISTS approved_by;
ALTER TABLE public.rd_procedure_analysis DROP COLUMN IF EXISTS approved_at;

-- Add new columns
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS document_id uuid NOT NULL;
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS procedure_code text NOT NULL;
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS procedure_description text;
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS procedure_category text;
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS billed_units integer DEFAULT 0;
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS billed_amount numeric(15,2) DEFAULT 0;
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS frequency_annual integer;
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS ai_confidence_score numeric(3,2);
-- Convert existing ai_confidence_score column from text to numeric if it exists
ALTER TABLE public.rd_procedure_analysis ALTER COLUMN ai_confidence_score TYPE numeric(3,2) USING CASE WHEN ai_confidence_score ~ '^[0-9]+\.?[0-9]*$' THEN ai_confidence_score::numeric(3,2) ELSE NULL END;
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS extraction_method text DEFAULT 'ai'::text;
ALTER TABLE public.rd_procedure_analysis ADD COLUMN IF NOT EXISTS raw_data jsonb;
ALTER TABLE public.rd_procedure_analysis ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_procedure_analysis ALTER COLUMN updated_at TYPE timestamp without time zone;

-- Add constraints
ALTER TABLE public.rd_procedure_analysis ADD CONSTRAINT rd_procedure_analysis_ai_confidence_score_check CHECK (((ai_confidence_score >= (0)::numeric) AND (ai_confidence_score <= (1)::numeric)));
ALTER TABLE public.rd_procedure_analysis ADD CONSTRAINT rd_procedure_analysis_extraction_method_check CHECK ((extraction_method = ANY (ARRAY['ai'::text, 'manual'::text])));

-- 15. rd_signatures: Complete restructure
ALTER TABLE public.rd_signatures DROP COLUMN IF EXISTS signature_record_id;
ALTER TABLE public.rd_signatures DROP COLUMN IF EXISTS signature_hash;
ALTER TABLE public.rd_signatures DROP COLUMN IF EXISTS verification_status;
ALTER TABLE public.rd_signatures DROP COLUMN IF EXISTS verification_data;
ALTER TABLE public.rd_signatures DROP COLUMN IF EXISTS is_archived;

-- Update existing columns
ALTER TABLE public.rd_signatures ALTER COLUMN business_year_id DROP NOT NULL;
ALTER TABLE public.rd_signatures ADD COLUMN IF NOT EXISTS signature_type character varying(50);
ALTER TABLE public.rd_signatures ADD COLUMN IF NOT EXISTS signed_by character varying(255);
ALTER TABLE public.rd_signatures ALTER COLUMN signed_at TYPE timestamp without time zone USING CASE 
    WHEN signed_at IS NULL OR signed_at = '' THEN NULL
    WHEN signed_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN signed_at::timestamp without time zone
    ELSE NULL
END;
ALTER TABLE public.rd_signatures ADD COLUMN IF NOT EXISTS signature_data jsonb;
ALTER TABLE public.rd_signatures ALTER COLUMN ip_address TYPE inet USING CASE WHEN ip_address ~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' THEN ip_address::inet ELSE NULL END;
ALTER TABLE public.rd_signatures ALTER COLUMN created_at TYPE timestamp without time zone;

-- 16. rd_client_portal_tokens: Fix column constraints
ALTER TABLE public.rd_client_portal_tokens ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE public.rd_client_portal_tokens ALTER COLUMN token DROP NOT NULL;
ALTER TABLE public.rd_client_portal_tokens ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE public.rd_client_portal_tokens ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_client_portal_tokens ALTER COLUMN updated_at TYPE timestamp without time zone;
ALTER TABLE public.rd_client_portal_tokens ALTER COLUMN last_accessed_at TYPE timestamp without time zone;
ALTER TABLE public.rd_client_portal_tokens ALTER COLUMN last_accessed_ip TYPE inet USING CASE WHEN last_accessed_ip ~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' THEN last_accessed_ip::inet ELSE NULL END;

-- 17. rd_selected_subcomponents: Fix column types
-- Convert practice_percent from text to numeric if it exists as text
ALTER TABLE public.rd_selected_subcomponents ALTER COLUMN practice_percent TYPE numeric(5,2) USING CASE WHEN practice_percent ~ '^[0-9]+\.?[0-9]*$' THEN practice_percent::numeric(5,2) ELSE 0 END;
ALTER TABLE public.rd_selected_subcomponents ALTER COLUMN practice_percent SET DEFAULT 0;
-- Drop the old practice_percentage column if it exists (keeping the new practice_percent)
ALTER TABLE public.rd_selected_subcomponents DROP COLUMN IF EXISTS practice_percentage;
ALTER TABLE public.rd_selected_subcomponents ADD COLUMN IF NOT EXISTS step_name_snapshot text;

-- 18. rd_research_activities: Update column types
ALTER TABLE public.rd_research_activities ALTER COLUMN deactivated_at TYPE timestamp without time zone USING CASE 
    WHEN deactivated_at IS NULL OR deactivated_at = '' THEN NULL
    WHEN deactivated_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN deactivated_at::timestamp without time zone
    ELSE NULL
END;
ALTER TABLE public.rd_research_activities ADD COLUMN IF NOT EXISTS deactivation_reason text;
ALTER TABLE public.rd_research_activities ALTER COLUMN business_id TYPE uuid USING business_id::uuid;

-- 19. rd_employees: Make role_id nullable
ALTER TABLE public.rd_employees ALTER COLUMN role_id DROP NOT NULL;

-- 20. rd_federal_credit: Major restructure for new format
ALTER TABLE public.rd_federal_credit DROP COLUMN IF EXISTS base_amount;
ALTER TABLE public.rd_federal_credit DROP COLUMN IF EXISTS qualified_research_expenses;
ALTER TABLE public.rd_federal_credit DROP COLUMN IF EXISTS credit_rate;
ALTER TABLE public.rd_federal_credit DROP COLUMN IF EXISTS calculated_credit;
ALTER TABLE public.rd_federal_credit DROP COLUMN IF EXISTS carryforward_available;
ALTER TABLE public.rd_federal_credit DROP COLUMN IF EXISTS carryforward_used;
ALTER TABLE public.rd_federal_credit DROP COLUMN IF EXISTS final_credit_amount;
ALTER TABLE public.rd_federal_credit DROP COLUMN IF EXISTS calculation_method;
ALTER TABLE public.rd_federal_credit DROP COLUMN IF EXISTS is_final;

-- Add new columns
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS client_id uuid NOT NULL;
-- Convert client_id from text to uuid if it exists as text
ALTER TABLE public.rd_federal_credit ALTER COLUMN client_id TYPE uuid USING CASE WHEN client_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN client_id::uuid ELSE gen_random_uuid() END;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS research_activity_id uuid;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS research_activity_name text;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS direct_research_wages numeric(15,2) DEFAULT 0;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS supplies_expenses numeric(15,2) DEFAULT 0;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS contractor_expenses numeric(15,2) DEFAULT 0;
-- Convert existing numeric columns from text to numeric if they exist as text
ALTER TABLE public.rd_federal_credit ALTER COLUMN direct_research_wages TYPE numeric(15,2) USING CASE WHEN direct_research_wages::text ~ '^[0-9]+\.?[0-9]*$' THEN direct_research_wages::numeric(15,2) ELSE 0 END;
ALTER TABLE public.rd_federal_credit ALTER COLUMN supplies_expenses TYPE numeric(15,2) USING CASE WHEN supplies_expenses::text ~ '^[0-9]+\.?[0-9]*$' THEN supplies_expenses::numeric(15,2) ELSE 0 END;
ALTER TABLE public.rd_federal_credit ALTER COLUMN contractor_expenses TYPE numeric(15,2) USING CASE WHEN contractor_expenses::text ~ '^[0-9]+\.?[0-9]*$' THEN contractor_expenses::numeric(15,2) ELSE 0 END;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS total_qre numeric(15,2) DEFAULT 0;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS subcomponent_count integer DEFAULT 0;
-- Convert subcomponent_count from text to integer if it exists as text
ALTER TABLE public.rd_federal_credit ALTER COLUMN subcomponent_count TYPE integer USING CASE WHEN subcomponent_count::text ~ '^[0-9]+$' THEN subcomponent_count::integer ELSE 0 END;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS subcomponent_groups text;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS applied_percent numeric(5,2) DEFAULT 0;
-- Convert applied_percent from text to numeric if it exists as text
ALTER TABLE public.rd_federal_credit ALTER COLUMN applied_percent TYPE numeric(5,2) USING CASE WHEN applied_percent::text ~ '^[0-9]+\.?[0-9]*$' THEN applied_percent::numeric(5,2) ELSE 0 END;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS line_49f_description text;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS ai_generation_timestamp timestamp without time zone;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS ai_prompt_used text;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS ai_response_raw text;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS federal_credit_amount numeric(15,2) DEFAULT 0;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS federal_credit_percentage numeric(5,2) DEFAULT 0;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS calculation_method text;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS industry_type text;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS focus_area text;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS general_description text;
ALTER TABLE public.rd_federal_credit ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_federal_credit ALTER COLUMN updated_at TYPE timestamp without time zone;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS is_latest boolean DEFAULT true;
-- Convert is_latest from text to boolean if it exists as text
ALTER TABLE public.rd_federal_credit ALTER COLUMN is_latest TYPE boolean USING CASE WHEN is_latest = 'true' THEN true WHEN is_latest = 'false' THEN false ELSE true END;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS previous_version_id uuid;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS calculation_timestamp timestamp without time zone DEFAULT now();
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS data_snapshot jsonb;
ALTER TABLE public.rd_federal_credit ADD COLUMN IF NOT EXISTS notes text;

-- Add constraints
ALTER TABLE public.rd_federal_credit ADD CONSTRAINT valid_amounts CHECK (((direct_research_wages >= (0)::numeric) AND (supplies_expenses >= (0)::numeric) AND (contractor_expenses >= (0)::numeric)));
ALTER TABLE public.rd_federal_credit ADD CONSTRAINT valid_percentages CHECK (((applied_percent >= (0)::numeric) AND (applied_percent <= (100)::numeric)));
ALTER TABLE public.rd_federal_credit ADD CONSTRAINT valid_subcomponent_count CHECK ((subcomponent_count >= 0));

-- 21. rd_state_proforma_data: Restructure columns
ALTER TABLE public.rd_state_proforma_data ALTER COLUMN state_code TYPE character varying(2);
ALTER TABLE public.rd_state_proforma_data DROP COLUMN IF EXISTS proforma_type;
ALTER TABLE public.rd_state_proforma_data DROP COLUMN IF EXISTS data_values;
ALTER TABLE public.rd_state_proforma_data DROP COLUMN IF EXISTS calculation_date;
ALTER TABLE public.rd_state_proforma_data DROP COLUMN IF EXISTS is_approved;

-- Add new columns
ALTER TABLE public.rd_state_proforma_data ADD COLUMN IF NOT EXISTS method character varying(20) NOT NULL;
ALTER TABLE public.rd_state_proforma_data ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Add constraint
ALTER TABLE public.rd_state_proforma_data ADD CONSTRAINT rd_state_proforma_data_method_check CHECK (((method)::text = ANY ((ARRAY['standard'::character varying, 'alternative'::character varying])::text[])));

-- 22. rd_qc_document_controls: Major restructure
ALTER TABLE public.rd_qc_document_controls ALTER COLUMN document_type TYPE character varying(50);
ALTER TABLE public.rd_qc_document_controls DROP COLUMN IF EXISTS control_type;
ALTER TABLE public.rd_qc_document_controls DROP COLUMN IF EXISTS status;
ALTER TABLE public.rd_qc_document_controls DROP COLUMN IF EXISTS reviewer_id;
ALTER TABLE public.rd_qc_document_controls DROP COLUMN IF EXISTS review_notes;
ALTER TABLE public.rd_qc_document_controls DROP COLUMN IF EXISTS reviewed_at;
ALTER TABLE public.rd_qc_document_controls DROP COLUMN IF EXISTS is_approved;

-- Add/convert columns
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS is_released boolean DEFAULT false;
ALTER TABLE public.rd_qc_document_controls ALTER COLUMN released_at TYPE timestamp without time zone USING CASE 
    WHEN released_at IS NULL OR released_at = '' THEN NULL
    WHEN released_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN released_at::timestamp without time zone
    ELSE NULL
END;
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS released_by uuid;
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS release_notes text;
ALTER TABLE public.rd_qc_document_controls ALTER COLUMN requires_jurat TYPE boolean USING CASE 
    WHEN requires_jurat = 'true' THEN true 
    WHEN requires_jurat = 'false' THEN false 
    ELSE false 
END;
ALTER TABLE public.rd_qc_document_controls ALTER COLUMN requires_jurat SET DEFAULT false;
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS requires_payment boolean DEFAULT false;
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS qc_reviewer uuid;
ALTER TABLE public.rd_qc_document_controls ALTER COLUMN qc_reviewed_at TYPE timestamp without time zone USING CASE 
    WHEN qc_reviewed_at IS NULL OR qc_reviewed_at = '' THEN NULL
    WHEN qc_reviewed_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN qc_reviewed_at::timestamp without time zone
    ELSE NULL
END;
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS qc_review_notes text;
ALTER TABLE public.rd_qc_document_controls ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_qc_document_controls ALTER COLUMN updated_at TYPE timestamp without time zone;
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS qc_approver_name text;
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS qc_approver_credentials text;
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS qc_approved_date timestamp with time zone;
ALTER TABLE public.rd_qc_document_controls ADD COLUMN IF NOT EXISTS qc_approver_ip_address text;

-- 23. rd_selected_steps: Add constraint for non_rd_percentage
ALTER TABLE public.rd_selected_steps ALTER COLUMN non_rd_percentage TYPE numeric(5,2) USING CASE WHEN non_rd_percentage ~ '^[0-9]+\.?[0-9]*$' THEN non_rd_percentage::numeric(5,2) ELSE 0 END;
ALTER TABLE public.rd_selected_steps ALTER COLUMN non_rd_percentage SET DEFAULT 0;
ALTER TABLE public.rd_selected_steps ADD CONSTRAINT rd_selected_steps_non_rd_percentage_check CHECK (((non_rd_percentage >= (0)::numeric) AND (non_rd_percentage <= (100)::numeric)));

-- 24. rd_state_proformas: Restructure columns
ALTER TABLE public.rd_state_proformas ALTER COLUMN state_code TYPE character varying(2);
ALTER TABLE public.rd_state_proformas DROP COLUMN IF EXISTS proforma_name;
ALTER TABLE public.rd_state_proformas DROP COLUMN IF EXISTS total_amount;
ALTER TABLE public.rd_state_proformas DROP COLUMN IF EXISTS status;
ALTER TABLE public.rd_state_proformas DROP COLUMN IF EXISTS generated_at;
ALTER TABLE public.rd_state_proformas DROP COLUMN IF EXISTS approved_by;
ALTER TABLE public.rd_state_proformas DROP COLUMN IF EXISTS approved_at;

-- Add new columns
ALTER TABLE public.rd_state_proformas ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.rd_state_proformas ADD COLUMN IF NOT EXISTS total_credit numeric(15,2) DEFAULT 0;
ALTER TABLE public.rd_state_proformas ALTER COLUMN created_at TYPE timestamp without time zone;
ALTER TABLE public.rd_state_proformas ALTER COLUMN updated_at TYPE timestamp without time zone;

-- 25. rd_reports: Update state_gross_receipts column type and qc_approved_by
ALTER TABLE public.rd_reports ALTER COLUMN state_gross_receipts TYPE jsonb USING CASE 
    WHEN state_gross_receipts IS NULL THEN '{}'::jsonb
    ELSE jsonb_build_object('amount', state_gross_receipts)
END;
ALTER TABLE public.rd_reports ALTER COLUMN state_gross_receipts SET DEFAULT '{}'::jsonb;
ALTER TABLE public.rd_reports ALTER COLUMN qc_approved_by TYPE text;

-- NOTE: Triggers moved to functions migration to ensure proper dependency order

-- MISSING RLS POLICIES
CREATE POLICY "Admin can manage all signature records" ON public.rd_signature_records USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));;
CREATE POLICY "Allow authenticated users to create signatures" ON public.rd_signature_records FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));;
CREATE POLICY "Allow authenticated users to view signatures" ON public.rd_signature_records FOR SELECT USING ((auth.role() = 'authenticated'::text));;
CREATE POLICY "Anyone can create signatures via portal" ON public.rd_signatures FOR INSERT WITH CHECK (true);;
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_reports FOR DELETE USING ((auth.role() = 'authenticated'::text));;
CREATE POLICY "Enable delete for authenticated users" ON public.rd_research_steps FOR DELETE USING ((auth.uid() IS NOT NULL));;
CREATE POLICY "Enable delete for authenticated users" ON public.rd_research_subcomponents FOR DELETE USING (true);;
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_reports FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));;
CREATE POLICY "Enable insert for authenticated users" ON public.rd_research_steps FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));;
CREATE POLICY "Enable insert for authenticated users" ON public.rd_research_subcomponents FOR INSERT WITH CHECK (true);;
CREATE POLICY "Enable read access for all users" ON public.rd_research_steps FOR SELECT USING (true);;
CREATE POLICY "Enable read access for all users" ON public.rd_research_subcomponents FOR SELECT USING (true);;
CREATE POLICY "Enable read access for authenticated users" ON public.rd_reports FOR SELECT USING ((auth.role() = 'authenticated'::text));;
CREATE POLICY "Enable update access for authenticated users" ON public.rd_reports FOR UPDATE USING ((auth.role() = 'authenticated'::text));;
CREATE POLICY "Enable update for authenticated users" ON public.rd_research_steps FOR UPDATE USING ((auth.uid() IS NOT NULL));;
CREATE POLICY "Enable update for authenticated users" ON public.rd_research_subcomponents FOR UPDATE USING (true);;
CREATE POLICY "Users can delete their own state pro forma data" ON public.rd_state_proforma_data FOR DELETE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));;
CREATE POLICY "Users can insert own rd_federal_credit" ON public.rd_federal_credit FOR INSERT WITH CHECK ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));;
CREATE POLICY "Users can insert their own state pro forma data" ON public.rd_state_proforma_data FOR INSERT WITH CHECK ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));;
CREATE POLICY "Users can update own rd_federal_credit" ON public.rd_federal_credit FOR UPDATE USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));;
CREATE POLICY "Users can update their own state pro forma data" ON public.rd_state_proforma_data FOR UPDATE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));;
CREATE POLICY "Users can view own rd_federal_credit" ON public.rd_federal_credit FOR SELECT USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));;
CREATE POLICY "Users can view their own state pro forma data" ON public.rd_state_proforma_data FOR SELECT USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));;

-- MISSING INDEXES
CREATE INDEX idx_billable_summary_activity ON public.rd_billable_time_summary USING btree (research_activity_id);;
CREATE INDEX idx_billable_summary_business_year ON public.rd_billable_time_summary USING btree (business_year_id);;
CREATE INDEX idx_document_links_contractor ON public.rd_document_links USING btree (contractor_id);;
CREATE INDEX idx_document_links_doc ON public.rd_document_links USING btree (document_id);;
CREATE INDEX idx_document_links_supply ON public.rd_document_links USING btree (supply_id);;
CREATE INDEX idx_procedure_analysis_code ON public.rd_procedure_analysis USING btree (procedure_code);;
CREATE INDEX idx_procedure_analysis_doc ON public.rd_procedure_analysis USING btree (document_id);;
CREATE INDEX idx_procedure_links_activity ON public.rd_procedure_research_links USING btree (research_activity_id);;
CREATE INDEX idx_procedure_links_status ON public.rd_procedure_research_links USING btree (status);;
CREATE INDEX idx_rd_business_years_business_setup_completed ON public.rd_business_years USING btree (business_setup_completed) WHERE (business_setup_completed = true);;
CREATE INDEX idx_rd_business_years_calculations_completed ON public.rd_business_years USING btree (calculations_completed) WHERE (calculations_completed = true);;
CREATE INDEX idx_rd_business_years_completion_percentage ON public.rd_business_years USING btree (overall_completion_percentage);;
CREATE INDEX idx_rd_business_years_credits_locked ON public.rd_business_years USING btree (credits_locked) WHERE (credits_locked = true);;
CREATE INDEX idx_rd_business_years_research_activities_completed ON public.rd_business_years USING btree (research_activities_completed) WHERE (research_activities_completed = true);;
CREATE INDEX idx_rd_business_years_research_design_completed ON public.rd_business_years USING btree (research_design_completed) WHERE (research_design_completed = true);;
CREATE INDEX idx_rd_businesses_category_id ON public.rd_businesses USING btree (category_id);;
CREATE INDEX idx_rd_businesses_ein ON public.rd_businesses USING btree (ein) WHERE (ein IS NOT NULL);;
CREATE INDEX idx_rd_businesses_github_token_exists ON public.rd_businesses USING btree (github_token) WHERE (github_token IS NOT NULL);;
CREATE INDEX idx_rd_client_portal_tokens_active ON public.rd_client_portal_tokens USING btree (business_id, is_active, expires_at) WHERE (is_active = true);;
CREATE INDEX idx_rd_client_portal_tokens_business ON public.rd_client_portal_tokens USING btree (business_id);;
CREATE INDEX idx_rd_client_portal_tokens_business_id ON public.rd_client_portal_tokens USING btree (business_id);;
CREATE INDEX idx_rd_client_portal_tokens_token ON public.rd_client_portal_tokens USING btree (token);;
CREATE INDEX idx_rd_federal_credit_activity ON public.rd_federal_credit USING btree (research_activity_id);;
CREATE INDEX idx_rd_federal_credit_business_year ON public.rd_federal_credit USING btree (business_year_id);;
CREATE INDEX idx_rd_federal_credit_client ON public.rd_federal_credit USING btree (client_id);;
CREATE INDEX idx_rd_federal_credit_created_at ON public.rd_federal_credit USING btree (created_at);;
CREATE INDEX idx_rd_federal_credit_latest ON public.rd_federal_credit USING btree (is_latest) WHERE (is_latest = true);;
CREATE INDEX idx_rd_qc_document_controls_business_year ON public.rd_qc_document_controls USING btree (business_year_id);;
CREATE INDEX idx_rd_qc_document_controls_qc_approved_date ON public.rd_qc_document_controls USING btree (qc_approved_date) WHERE (qc_approved_date IS NOT NULL);;
CREATE INDEX idx_rd_qc_document_controls_released ON public.rd_qc_document_controls USING btree (is_released);;
CREATE INDEX idx_rd_qc_document_controls_type ON public.rd_qc_document_controls USING btree (document_type);;
CREATE INDEX idx_rd_reports_html_not_null ON public.rd_reports USING btree (business_year_id, type) WHERE (generated_html IS NOT NULL);;
CREATE INDEX idx_rd_reports_qc_approved_at ON public.rd_reports USING btree (qc_approved_at) WHERE (qc_approved_at IS NOT NULL);;
CREATE INDEX idx_rd_reports_state_gross_receipts ON public.rd_reports USING gin (state_gross_receipts);;
CREATE INDEX idx_rd_research_activities_business_id ON public.rd_research_activities USING btree (business_id);;
CREATE INDEX idx_rd_research_activities_global ON public.rd_research_activities USING btree (id) WHERE (business_id IS NULL);;
CREATE INDEX idx_rd_research_steps_activity_step_order ON public.rd_research_steps USING btree (research_activity_id, step_order);;
CREATE INDEX idx_rd_research_steps_business_id ON public.rd_research_steps USING btree (business_id);;
CREATE INDEX idx_rd_research_subcomponents_business_id ON public.rd_research_subcomponents USING btree (business_id);;
CREATE INDEX idx_rd_roles_type ON public.rd_roles USING btree (type);;
CREATE INDEX idx_rd_signature_records_business_year_id ON public.rd_signature_records USING btree (business_year_id);;
CREATE INDEX idx_rd_signature_records_signed_at ON public.rd_signature_records USING btree (signed_at);;
CREATE INDEX idx_rd_signatures_business_year ON public.rd_signatures USING btree (business_year_id);;
CREATE INDEX idx_rd_signatures_signed_at ON public.rd_signatures USING btree (signed_at);;
CREATE INDEX idx_rd_signatures_type ON public.rd_signatures USING btree (signature_type);;
CREATE INDEX idx_rd_state_proforma_data_lookup ON public.rd_state_proforma_data USING btree (business_year_id, state_code, method);;
CREATE INDEX idx_state_credit_configs_state_code ON public.rd_state_credit_configs USING btree (state_code);;
CREATE INDEX idx_state_proforma_lines_state_proforma_id ON public.rd_state_proforma_lines USING btree (state_proforma_id);;
CREATE INDEX idx_state_proformas_business_year ON public.rd_state_proformas USING btree (business_year_id);;
CREATE INDEX idx_support_docs_business_year ON public.rd_support_documents USING btree (business_year_id);;
CREATE INDEX idx_support_docs_status ON public.rd_support_documents USING btree (processing_status);;
CREATE INDEX idx_support_docs_type ON public.rd_support_documents USING btree (document_type);;
CREATE UNIQUE INDEX idx_unique_procedure_research_link ON public.rd_procedure_research_links USING btree (procedure_analysis_id, research_activity_id, subcomponent_id);;

COMMIT;
