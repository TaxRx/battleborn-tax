-- Comprehensive DROP migration for all rd_* related objects
-- This migration removes ALL rd_* tables, views, functions, triggers, and related objects
-- Dependencies are handled in proper order to avoid cascade issues

-- =============================================================================
-- STEP 1: DROP VIEWS THAT DEPEND ON rd_* TABLES
-- =============================================================================

-- Drop views that reference rd_* tables (in dependency order)
DROP VIEW IF EXISTS rd_federal_credit_latest CASCADE;
DROP VIEW IF EXISTS rd_client_progress_summary CASCADE;
DROP VIEW IF EXISTS rd_activity_hierarchy CASCADE;

-- Note: client_dashboard_summary view may reference rd_* tables, but since it's not prefixed with rd_
-- we'll leave it unless it causes issues (it will be dropped automatically if it depends on rd_* tables)

-- =============================================================================
-- STEP 2: DROP CUSTOM TRIGGERS ON rd_* TABLES
-- =============================================================================

-- Drop custom named triggers (not foreign key constraint triggers)
DROP TRIGGER IF EXISTS trigger_archive_rd_federal_credit_version ON rd_federal_credit;
DROP TRIGGER IF EXISTS trigger_safe_update_practice_percent ON rd_selected_subcomponents;
DROP TRIGGER IF EXISTS trigger_update_completion_percentage ON rd_business_years;
DROP TRIGGER IF EXISTS trigger_update_rd_federal_credit_updated_at ON rd_federal_credit;
DROP TRIGGER IF EXISTS trigger_update_rd_state_proforma_data_updated_at ON rd_state_proforma_data;
DROP TRIGGER IF EXISTS trigger_update_total_qre ON rd_business_years;
DROP TRIGGER IF EXISTS update_rd_business_years_credits_calculated_at ON rd_business_years;
DROP TRIGGER IF EXISTS trigger_update_step_name ON rd_selected_subcomponents;
DROP TRIGGER IF EXISTS handle_rd_contractor_subcomponents_updated_at ON rd_contractor_subcomponents;
DROP TRIGGER IF EXISTS handle_rd_contractor_year_data_updated_at ON rd_contractor_year_data;
DROP TRIGGER IF EXISTS handle_rd_federal_credit_results_updated_at ON rd_federal_credit_results;
DROP TRIGGER IF EXISTS update_rd_reports_updated_at ON rd_reports;
DROP TRIGGER IF EXISTS update_rd_roles_updated_at ON rd_roles;
DROP TRIGGER IF EXISTS update_rd_state_calculations_updated_at ON rd_state_calculations;
DROP TRIGGER IF EXISTS set_updated_at_rd_supplies ON rd_supplies;
DROP TRIGGER IF EXISTS handle_rd_supply_subcomponents_updated_at ON rd_supply_subcomponents;
DROP TRIGGER IF EXISTS set_updated_at_rd_supply_subcomponents ON rd_supply_subcomponents;
DROP TRIGGER IF EXISTS handle_rd_supply_year_data_updated_at ON rd_supply_year_data;
DROP TRIGGER IF EXISTS set_updated_at_rd_supply_year_data ON rd_supply_year_data;
DROP TRIGGER IF EXISTS trigger_update_step_name ON rd_selected_subcomponents;
DROP TRIGGER IF EXISTS trigger_update_total_qre ON rd_business_years;
DROP TRIGGER IF EXISTS update_rd_business_years_credits_calculated_at ON rd_business_years;
DROP TRIGGER IF EXISTS update_rd_reports_updated_at ON rd_reports;
DROP TRIGGER IF EXISTS update_rd_roles_updated_at ON rd_roles;
DROP TRIGGER IF EXISTS handle_rd_contractor_subcomponents_updated_at ON rd_contractor_subcomponents;
DROP TRIGGER IF EXISTS handle_rd_contractor_year_data_updated_at ON rd_contractor_year_data;
DROP TRIGGER IF EXISTS handle_rd_federal_credit_results_updated_at ON rd_federal_credit_results;
DROP TRIGGER IF EXISTS update_rd_state_calculations_updated_at ON rd_state_calculations;
DROP TRIGGER IF EXISTS set_updated_at_rd_supplies ON rd_supplies;
DROP TRIGGER IF EXISTS handle_rd_supply_subcomponents_updated_at ON rd_supply_subcomponents;
DROP TRIGGER IF EXISTS set_updated_at_rd_supply_subcomponents ON rd_supply_subcomponents;
DROP TRIGGER IF EXISTS handle_rd_supply_year_data_updated_at ON rd_supply_year_data;
DROP TRIGGER IF EXISTS set_updated_at_rd_supply_year_data ON rd_supply_year_data;

-- =============================================================================
-- STEP 3: DROP FUNCTIONS RELATED TO rd_* TABLES
-- =============================================================================

-- Drop trigger functions specifically for rd_* tables
DROP FUNCTION IF EXISTS archive_rd_federal_credit_version() CASCADE;
DROP FUNCTION IF EXISTS update_completion_percentage() CASCADE;
DROP FUNCTION IF EXISTS update_rd_federal_credit_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_rd_state_proforma_data_updated_at() CASCADE;
DROP FUNCTION IF EXISTS safe_update_selected_subcomponent_practice_percent() CASCADE;
DROP FUNCTION IF EXISTS update_selected_subcomponent_step_name() CASCADE;
DROP FUNCTION IF EXISTS update_total_qre() CASCADE;
DROP FUNCTION IF EXISTS update_credits_calculated_at() CASCADE;

-- Note: We're not dropping calculate_dashboard_metrics() or create_client_with_business() 
-- as they may be used by other parts of the application outside of rd_* context

-- =============================================================================
-- STEP 4: DROP ALL rd_* TABLES (IN DEPENDENCY ORDER)
-- =============================================================================

-- Drop tables that depend on other rd_* tables first (leaf tables)
-- These tables reference other rd_* tables via foreign keys

-- Tables that depend on multiple other rd_* tables
DROP TABLE IF EXISTS rd_selected_subcomponents CASCADE;
DROP TABLE IF EXISTS rd_selected_steps CASCADE;
DROP TABLE IF EXISTS rd_selected_activities CASCADE;
DROP TABLE IF EXISTS rd_expenses CASCADE;
DROP TABLE IF EXISTS rd_procedure_research_links CASCADE;

-- Tables that depend on rd_research_subcomponents
DROP TABLE IF EXISTS rd_contractor_subcomponents CASCADE;
DROP TABLE IF EXISTS rd_employee_subcomponents CASCADE;
DROP TABLE IF EXISTS rd_supply_subcomponents CASCADE;

-- Tables that depend on rd_research_steps
DROP TABLE IF EXISTS rd_research_subcomponents CASCADE;

-- Tables that depend on rd_research_activities
DROP TABLE IF EXISTS rd_research_steps CASCADE;
DROP TABLE IF EXISTS rd_subcomponents CASCADE;

-- Tables that depend on rd_focuses
DROP TABLE IF EXISTS rd_research_activities CASCADE;

-- Tables that depend on rd_areas
DROP TABLE IF EXISTS rd_focuses CASCADE;

-- Tables that depend on rd_research_categories
DROP TABLE IF EXISTS rd_areas CASCADE;

-- Tables that depend on rd_business_years
DROP TABLE IF EXISTS rd_contractor_year_data CASCADE;
DROP TABLE IF EXISTS rd_employee_year_data CASCADE;
DROP TABLE IF EXISTS rd_supply_year_data CASCADE;
DROP TABLE IF EXISTS rd_federal_credit_results CASCADE;
DROP TABLE IF EXISTS rd_federal_credit CASCADE;
DROP TABLE IF EXISTS rd_reports CASCADE;
DROP TABLE IF EXISTS rd_roles CASCADE;
DROP TABLE IF EXISTS rd_selected_filter CASCADE;
DROP TABLE IF EXISTS rd_qc_document_controls CASCADE;
DROP TABLE IF EXISTS rd_signature_records CASCADE;
DROP TABLE IF EXISTS rd_signatures CASCADE;
DROP TABLE IF EXISTS rd_state_proforma_data CASCADE;
DROP TABLE IF EXISTS rd_state_proformas CASCADE;
DROP TABLE IF EXISTS rd_support_documents CASCADE;
DROP TABLE IF EXISTS rd_billable_time_summary CASCADE;

-- Tables that depend on rd_businesses
DROP TABLE IF EXISTS rd_business_years CASCADE;
DROP TABLE IF EXISTS rd_contractors CASCADE;
DROP TABLE IF EXISTS rd_employees CASCADE;
DROP TABLE IF EXISTS rd_supplies CASCADE;
DROP TABLE IF EXISTS rd_client_portal_tokens CASCADE;

-- Tables that depend on clients table (from main app)
DROP TABLE IF EXISTS rd_businesses CASCADE;

-- Independent tables (no rd_* dependencies)
DROP TABLE IF EXISTS rd_research_categories CASCADE;
DROP TABLE IF EXISTS rd_research_raw CASCADE;
DROP TABLE IF EXISTS rd_state_calculations CASCADE;
DROP TABLE IF EXISTS rd_state_calculations_full CASCADE;
DROP TABLE IF EXISTS rd_state_credit_configs CASCADE;
DROP TABLE IF EXISTS rd_state_proforma_lines CASCADE;
DROP TABLE IF EXISTS rd_document_links CASCADE;
DROP TABLE IF EXISTS rd_procedure_analysis CASCADE;

-- =============================================================================
-- STEP 5: DROP CUSTOM ENUM TYPES USED ONLY BY rd_* TABLES
-- =============================================================================

-- Drop custom enum types used by rd_* tables
DROP TYPE IF EXISTS rd_report_type CASCADE;
DROP TYPE IF EXISTS qc_status_enum CASCADE;

-- =============================================================================
-- STEP 6: DROP NON-RD TABLES RELATED TO RD FUNCTIONALITY  
-- =============================================================================

-- Note: form_6765_overrides table already exists locally and is not rd_* specific
-- Drop constraints from form_6765_overrides if needed
DO $$ BEGIN
    ALTER TABLE public.form_6765_overrides DROP CONSTRAINT IF EXISTS form_6765_overrides_client_id_business_year_section_line_nu_key;
    ALTER TABLE public.form_6765_overrides DROP CONSTRAINT IF EXISTS form_6765_overrides_client_id_fkey;
    ALTER TABLE public.form_6765_overrides DROP CONSTRAINT IF EXISTS form_6765_overrides_last_modified_by_fkey;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Uncomment below if you want to drop the entire table as well:
-- DROP TABLE IF EXISTS form_6765_overrides CASCADE;

-- =============================================================================
-- STEP 7: DROP ANY REMAINING CUSTOM INDEXES
-- =============================================================================

-- Note: Most indexes will be automatically dropped when tables are dropped
-- Only standalone indexes (if any) need to be explicitly dropped
-- Tax table indexes (if cleanup needed):
-- DROP INDEX IF EXISTS tax_calculations_user_id_idx;
-- DROP INDEX IF EXISTS tax_calculations_year_idx;
-- DROP INDEX IF EXISTS idx_tax_proposals_affiliate_id;
-- DROP INDEX IF EXISTS idx_tax_proposals_status;
-- DROP INDEX IF EXISTS idx_tax_proposals_user_id;

-- =============================================================================
-- STEP 7: VERIFICATION QUERIES (COMMENTED OUT - FOR MANUAL VERIFICATION)
-- =============================================================================

-- Uncomment these queries to verify the cleanup after running the migration:

-- Check for remaining rd_* tables:
-- SELECT tablename FROM pg_tables WHERE tablename LIKE 'rd_%';

-- Check for remaining rd_* views:
-- SELECT viewname FROM pg_views WHERE viewname LIKE 'rd_%';

-- Check for remaining rd_* functions:
-- SELECT proname FROM pg_proc WHERE proname LIKE '%rd_%';

-- Check for remaining rd_* types:
-- SELECT typname FROM pg_type WHERE typname LIKE 'rd_%' OR typname LIKE '%rd_%';

-- Check for remaining rd_* triggers:
-- SELECT tgname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname LIKE 'rd_%';

-- =============================================================================
-- MIGRATION SUMMARY
-- =============================================================================

-- This migration removes:
-- 1. Views: rd_activity_hierarchy
-- 2. Custom triggers: 18 named triggers on rd_* tables
-- 3. Functions: 3 rd_*-specific trigger functions
-- 4. Tables: 43 rd_* tables (dropped in dependency order)
-- 5. Types: 1 custom enum type (rd_report_type)
-- 6. All foreign key constraints involving rd_* tables (automatically dropped with tables)
-- 7. All indexes on rd_* tables (automatically dropped with tables)

-- Note: Foreign key constraint triggers (RI_ConstraintTrigger_*) are automatically
-- dropped when the tables are dropped, so they don't need explicit DROP statements.

-- IMPORTANT: This migration is irreversible. All rd_* data will be permanently lost.
-- Ensure you have proper backups before running this migration.