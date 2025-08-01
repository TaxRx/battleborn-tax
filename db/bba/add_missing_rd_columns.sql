-- Add Missing Columns to rd_* Tables for Remote Data Import Compatibility
-- Purpose: Add columns found in remote INSERT statements but missing locally
-- Date: 2025-07-30
-- Note: All columns added as TEXT type - adjust types as needed

BEGIN;

-- Add missing columns to rd_qc_document_controls
ALTER TABLE public.rd_qc_document_controls
ADD COLUMN IF NOT EXISTS qc_reviewer TEXT,
ADD COLUMN IF NOT EXISTS is_released TEXT,
ADD COLUMN IF NOT EXISTS released_by TEXT,
ADD COLUMN IF NOT EXISTS qc_approver_name TEXT,
ADD COLUMN IF NOT EXISTS released_at TEXT,
ADD COLUMN IF NOT EXISTS qc_review_notes TEXT,
ADD COLUMN IF NOT EXISTS qc_approver_credentials TEXT,
ADD COLUMN IF NOT EXISTS qc_reviewed_at TEXT,
ADD COLUMN IF NOT EXISTS release_notes TEXT,
ADD COLUMN IF NOT EXISTS qc_approver_ip_address TEXT,
ADD COLUMN IF NOT EXISTS qc_approved_date TEXT,
ADD COLUMN IF NOT EXISTS requires_payment TEXT,
ADD COLUMN IF NOT EXISTS requires_jurat TEXT;

-- Add missing columns to rd_research_activities
ALTER TABLE public.rd_research_activities
ADD COLUMN IF NOT EXISTS business_id TEXT,
ADD COLUMN IF NOT EXISTS deactivated_at TEXT,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Add missing columns to rd_research_steps
ALTER TABLE public.rd_research_steps
ADD COLUMN IF NOT EXISTS business_id TEXT,
ADD COLUMN IF NOT EXISTS deactivated_at TEXT,
ADD COLUMN IF NOT EXISTS is_active TEXT,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Add missing columns to rd_research_subcomponents
ALTER TABLE public.rd_research_subcomponents
ADD COLUMN IF NOT EXISTS business_id TEXT,
ADD COLUMN IF NOT EXISTS deactivated_at TEXT,
ADD COLUMN IF NOT EXISTS is_active TEXT,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Add missing columns to rd_selected_activities
ALTER TABLE public.rd_selected_activities
ADD COLUMN IF NOT EXISTS is_enabled TEXT,
ADD COLUMN IF NOT EXISTS activity_title_snapshot TEXT,
ADD COLUMN IF NOT EXISTS activity_category_snapshot TEXT;

-- Add missing columns to rd_selected_steps
ALTER TABLE public.rd_selected_steps
ADD COLUMN IF NOT EXISTS non_rd_percentage TEXT;

-- Add missing columns to rd_selected_subcomponents
ALTER TABLE public.rd_selected_subcomponents
ADD COLUMN IF NOT EXISTS subcomponent_name_snapshot TEXT,
ADD COLUMN IF NOT EXISTS practice_percent TEXT,
ADD COLUMN IF NOT EXISTS step_name_snapshot TEXT;

-- Add missing columns to rd_signature_records
ALTER TABLE public.rd_signature_records
ADD COLUMN IF NOT EXISTS signer_email TEXT,
ADD COLUMN IF NOT EXISTS signature_image TEXT,
ADD COLUMN IF NOT EXISTS jurat_text TEXT;

-- Add missing columns to rd_state_calculations_full
ALTER TABLE public.rd_state_calculations_full
ADD COLUMN IF NOT EXISTS refundable TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS additional_credit_formula TEXT,
ADD COLUMN IF NOT EXISTS end_year TEXT,
ADD COLUMN IF NOT EXISTS eligible_entities TEXT,
ADD COLUMN IF NOT EXISTS carryforward TEXT,
ADD COLUMN IF NOT EXISTS calculation_method TEXT,
ADD COLUMN IF NOT EXISTS alternative_info TEXT,
ADD COLUMN IF NOT EXISTS formula_correct TEXT,
ADD COLUMN IF NOT EXISTS standard_info TEXT,
ADD COLUMN IF NOT EXISTS start_year TEXT,
ADD COLUMN IF NOT EXISTS alternate_credit_formula TEXT,
ADD COLUMN IF NOT EXISTS other_info TEXT,
ADD COLUMN IF NOT EXISTS special_notes TEXT,
ADD COLUMN IF NOT EXISTS standard_credit_formula TEXT;

COMMIT;
