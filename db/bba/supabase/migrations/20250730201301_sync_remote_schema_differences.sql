-- Sync Remote Schema Differences
-- Purpose: Add missing tables and columns found in remote database
-- Date: 2025-07-30

BEGIN;

-- Add missing columns:



-- Add missing columns to rd_billable_time_summary
ALTER TABLE public.rd_billable_time_summary
ADD COLUMN IF NOT EXISTS research_activity_id TEXT,
ADD COLUMN IF NOT EXISTS total_billed_units TEXT,
ADD COLUMN IF NOT EXISTS percentage_variance TEXT,
ADD COLUMN IF NOT EXISTS recommended_percentage TEXT,
ADD COLUMN IF NOT EXISTS last_calculated TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS current_practice_percentage TEXT,
ADD COLUMN IF NOT EXISTS calculated_billable_percentage TEXT,
ADD COLUMN IF NOT EXISTS calculation_source TEXT,
ADD COLUMN IF NOT EXISTS subcomponent_id TEXT,
ADD COLUMN IF NOT EXISTS total_billed_amount TEXT,
ADD COLUMN IF NOT EXISTS total_procedures_count TEXT,
ADD COLUMN IF NOT EXISTS estimated_total_time_hours TEXT;


-- Add missing columns to rd_document_links
ALTER TABLE public.rd_document_links
ADD COLUMN IF NOT EXISTS allocation_percentage TEXT,
ADD COLUMN IF NOT EXISTS contractor_id TEXT,
ADD COLUMN IF NOT EXISTS link_type TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS document_id TEXT,
ADD COLUMN IF NOT EXISTS amount_allocated TEXT,
ADD COLUMN IF NOT EXISTS supply_id TEXT;


-- Add missing columns to rd_federal_credit
ALTER TABLE public.rd_federal_credit
ADD COLUMN IF NOT EXISTS supplies_expenses TEXT,
ADD COLUMN IF NOT EXISTS research_activity_id TEXT,
ADD COLUMN IF NOT EXISTS direct_research_wages TEXT,
ADD COLUMN IF NOT EXISTS federal_credit_percentage TEXT,
ADD COLUMN IF NOT EXISTS contractor_expenses TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS ai_generation_timestamp TEXT,
ADD COLUMN IF NOT EXISTS applied_percent TEXT,
ADD COLUMN IF NOT EXISTS focus_area TEXT,
ADD COLUMN IF NOT EXISTS federal_credit_amount TEXT,
ADD COLUMN IF NOT EXISTS line_49f_description TEXT,
ADD COLUMN IF NOT EXISTS is_latest TEXT,
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS total_qre TEXT,
ADD COLUMN IF NOT EXISTS calculation_timestamp TEXT,
ADD COLUMN IF NOT EXISTS subcomponent_groups TEXT,
ADD COLUMN IF NOT EXISTS version TEXT,
ADD COLUMN IF NOT EXISTS subcomponent_count TEXT,
ADD COLUMN IF NOT EXISTS ai_prompt_used TEXT,
ADD COLUMN IF NOT EXISTS general_description TEXT,
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS updated_by TEXT,
ADD COLUMN IF NOT EXISTS research_activity_name TEXT,
ADD COLUMN IF NOT EXISTS data_snapshot TEXT,
ADD COLUMN IF NOT EXISTS previous_version_id TEXT,
ADD COLUMN IF NOT EXISTS ai_response_raw TEXT,
ADD COLUMN IF NOT EXISTS industry_type TEXT;


-- Add missing columns to rd_procedure_analysis
ALTER TABLE public.rd_procedure_analysis
ADD COLUMN IF NOT EXISTS frequency_annual TEXT,
ADD COLUMN IF NOT EXISTS raw_data TEXT,
ADD COLUMN IF NOT EXISTS procedure_category TEXT,
ADD COLUMN IF NOT EXISTS document_id TEXT,
ADD COLUMN IF NOT EXISTS billed_amount TEXT,
ADD COLUMN IF NOT EXISTS procedure_code TEXT,
ADD COLUMN IF NOT EXISTS extraction_method TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score TEXT,
ADD COLUMN IF NOT EXISTS billed_units TEXT,
ADD COLUMN IF NOT EXISTS procedure_description TEXT;


-- Add missing columns to rd_procedure_research_links
ALTER TABLE public.rd_procedure_research_links
ADD COLUMN IF NOT EXISTS allocation_percentage TEXT,
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS manual_override TEXT,
ADD COLUMN IF NOT EXISTS estimated_research_time_hours TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS subcomponent_id TEXT,
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score TEXT,
ADD COLUMN IF NOT EXISTS approved_by TEXT;


-- Add missing columns to rd_signatures
ALTER TABLE public.rd_signatures
ADD COLUMN IF NOT EXISTS business_year_id TEXT,
ADD COLUMN IF NOT EXISTS signature_type TEXT,
ADD COLUMN IF NOT EXISTS signature_data TEXT,
ADD COLUMN IF NOT EXISTS signed_at TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS signed_by TEXT;


-- Add missing columns to rd_state_credit_configs
ALTER TABLE public.rd_state_credit_configs
ADD COLUMN IF NOT EXISTS config TEXT;


-- Add missing columns to rd_state_proforma_data
ALTER TABLE public.rd_state_proforma_data
ADD COLUMN IF NOT EXISTS method TEXT,
ADD COLUMN IF NOT EXISTS data TEXT;


-- Add missing columns to rd_state_proforma_lines
ALTER TABLE public.rd_state_proforma_lines
ADD COLUMN IF NOT EXISTS state_proforma_id TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS line_type TEXT,
ADD COLUMN IF NOT EXISTS is_editable TEXT,
ADD COLUMN IF NOT EXISTS sort_order TEXT,
ADD COLUMN IF NOT EXISTS amount TEXT;


-- Add missing columns to rd_state_proformas
ALTER TABLE public.rd_state_proformas
ADD COLUMN IF NOT EXISTS total_credit TEXT,
ADD COLUMN IF NOT EXISTS config TEXT;


-- Add missing columns to rd_support_documents
ALTER TABLE public.rd_support_documents
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS upload_date TEXT,
ADD COLUMN IF NOT EXISTS processing_status TEXT,
ADD COLUMN IF NOT EXISTS metadata TEXT,
ADD COLUMN IF NOT EXISTS file_size TEXT;

COMMIT;
