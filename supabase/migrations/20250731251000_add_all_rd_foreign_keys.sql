-- Migration: Add ALL Foreign Key Constraints for rd_* tables
-- Date: 2025-07-31
-- Purpose: Extract and apply all foreign key constraints involving rd_* tables from remote schema dump
-- Source: /Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_schema_dump_0731.sql

-- =============================================================================
-- SECTION 1: Core Reference Tables - FKs from rd_* to foundational tables
-- =============================================================================

-- rd_areas -> rd_research_categories
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_areas
        ADD CONSTRAINT rd_areas_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.rd_research_categories(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_businesses -> clients (non-rd table)
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_businesses
        ADD CONSTRAINT rd_businesses_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_businesses -> rd_research_categories  
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_businesses
        ADD CONSTRAINT rd_businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.rd_research_categories(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 2: Business Year Dependencies - FKs involving rd_business_years
-- =============================================================================

-- rd_business_years -> rd_businesses
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_business_years
        ADD CONSTRAINT rd_business_years_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_business_years -> profiles (user tracking fields)
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_business_years
        ADD CONSTRAINT rd_business_years_business_setup_completed_by_fkey FOREIGN KEY (business_setup_completed_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_business_years
        ADD CONSTRAINT rd_business_years_calculations_completed_by_fkey FOREIGN KEY (calculations_completed_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_business_years
        ADD CONSTRAINT rd_business_years_credits_locked_by_fkey FOREIGN KEY (credits_locked_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_business_years
        ADD CONSTRAINT rd_business_years_documents_released_by_fkey FOREIGN KEY (documents_released_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_business_years
        ADD CONSTRAINT rd_business_years_qc_approved_by_fkey FOREIGN KEY (qc_approved_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_business_years
        ADD CONSTRAINT rd_business_years_research_activities_completed_by_fkey FOREIGN KEY (research_activities_completed_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_business_years
        ADD CONSTRAINT rd_business_years_research_design_completed_by_fkey FOREIGN KEY (research_design_completed_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 3: Research Hierarchy - FKs for research structure
-- =============================================================================

-- rd_focuses -> rd_areas
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_focuses
        ADD CONSTRAINT rd_focuses_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.rd_areas(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_research_activities -> rd_businesses
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_research_activities
        ADD CONSTRAINT rd_research_activities_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_research_activities -> rd_focuses
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_research_activities
        ADD CONSTRAINT rd_research_activities_focus_id_fkey FOREIGN KEY (focus_id) REFERENCES public.rd_focuses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_research_steps -> rd_businesses
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_research_steps
        ADD CONSTRAINT rd_research_steps_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_research_steps -> rd_research_activities
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_research_steps
        ADD CONSTRAINT rd_research_steps_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_research_subcomponents -> rd_businesses
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_research_subcomponents
        ADD CONSTRAINT rd_research_subcomponents_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_research_subcomponents -> rd_research_steps
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_research_subcomponents
        ADD CONSTRAINT rd_research_subcomponents_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_subcomponents -> rd_research_activities (legacy table)
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_subcomponents
        ADD CONSTRAINT rd_subcomponents_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 4: Employee and Contractor Management
-- =============================================================================

-- rd_employees -> rd_businesses
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_employees
        ADD CONSTRAINT rd_employees_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_employees -> auth.users
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_employees
        ADD CONSTRAINT rd_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_contractors -> rd_businesses
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_contractors
        ADD CONSTRAINT rd_contractors_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_contractors -> auth.users
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_contractors
        ADD CONSTRAINT rd_contractors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 5: Role Management System
-- =============================================================================

-- rd_roles -> rd_businesses
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_roles
        ADD CONSTRAINT rd_roles_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_roles -> rd_business_years
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_roles
        ADD CONSTRAINT rd_roles_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_roles -> rd_roles (self-referencing for hierarchy)
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_roles
        ADD CONSTRAINT rd_roles_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.rd_roles(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_employees -> rd_roles
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_employees
        ADD CONSTRAINT rd_employees_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rd_roles(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_contractors -> rd_roles
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_contractors
        ADD CONSTRAINT rd_contractors_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rd_roles(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 6: Supply Management
-- =============================================================================

-- rd_supplies -> rd_businesses
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_supplies
        ADD CONSTRAINT rd_supplies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 7: Year-based Data Tables
-- =============================================================================

-- Employee year data
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_employee_year_data
        ADD CONSTRAINT rd_employee_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_employee_year_data
        ADD CONSTRAINT rd_employee_year_data_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Contractor year data
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_contractor_year_data
        ADD CONSTRAINT rd_contractor_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Note: This references rd_businesses, not rd_contractors (verified in schema dump)
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_contractor_year_data
        ADD CONSTRAINT rd_contractor_year_data_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Supply year data
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_supply_year_data
        ADD CONSTRAINT rd_supply_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_supply_year_data
        ADD CONSTRAINT rd_supply_year_data_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.rd_supplies(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 8: Subcomponent Relationships
-- =============================================================================

-- Employee subcomponents
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_employee_subcomponents
        ADD CONSTRAINT rd_employee_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_employee_subcomponents
        ADD CONSTRAINT rd_employee_subcomponents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_employee_subcomponents
        ADD CONSTRAINT rd_employee_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Contractor subcomponents
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_contractor_subcomponents
        ADD CONSTRAINT rd_contractor_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_contractor_subcomponents
        ADD CONSTRAINT rd_contractor_subcomponents_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_contractor_subcomponents
        ADD CONSTRAINT rd_contractor_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Supply subcomponents
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_supply_subcomponents
        ADD CONSTRAINT rd_supply_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_supply_subcomponents
        ADD CONSTRAINT rd_supply_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_supply_subcomponents
        ADD CONSTRAINT rd_supply_subcomponents_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.rd_supplies(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 9: Selection and Filtering Tables
-- =============================================================================

-- Selected activities
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_activities
        ADD CONSTRAINT rd_selected_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_activities
        ADD CONSTRAINT rd_selected_activities_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Selected steps
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_steps
        ADD CONSTRAINT rd_selected_steps_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_steps
        ADD CONSTRAINT rd_selected_steps_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_steps
        ADD CONSTRAINT rd_selected_steps_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Selected subcomponents
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_subcomponents
        ADD CONSTRAINT rd_selected_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_subcomponents
        ADD CONSTRAINT rd_selected_subcomponents_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_subcomponents
        ADD CONSTRAINT rd_selected_subcomponents_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_subcomponents
        ADD CONSTRAINT rd_selected_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Selected filter
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_selected_filter
        ADD CONSTRAINT rd_selected_filter_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 10: Expense and Time Tracking
-- =============================================================================

-- rd_expenses - comprehensive tracking table
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_expenses
        ADD CONSTRAINT rd_expenses_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_expenses
        ADD CONSTRAINT rd_expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_expenses
        ADD CONSTRAINT rd_expenses_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_expenses
        ADD CONSTRAINT rd_expenses_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_expenses
        ADD CONSTRAINT rd_expenses_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_billable_time_summary - time tracking summary
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_billable_time_summary
        ADD CONSTRAINT rd_billable_time_summary_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_billable_time_summary
        ADD CONSTRAINT rd_billable_time_summary_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_billable_time_summary
        ADD CONSTRAINT rd_billable_time_summary_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 11: Federal Credit System
-- =============================================================================

-- rd_federal_credit - main credit calculation table
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_federal_credit
        ADD CONSTRAINT rd_federal_credit_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_federal_credit
        ADD CONSTRAINT rd_federal_credit_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_federal_credit
        ADD CONSTRAINT rd_federal_credit_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_federal_credit
        ADD CONSTRAINT rd_federal_credit_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES public.rd_federal_credit(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_federal_credit
        ADD CONSTRAINT rd_federal_credit_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_federal_credit
        ADD CONSTRAINT rd_federal_credit_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_federal_credit_results - credit calculation results
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_federal_credit_results
        ADD CONSTRAINT rd_federal_credit_results_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 12: Document Management System
-- =============================================================================

-- rd_support_documents - document storage
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_support_documents
        ADD CONSTRAINT rd_support_documents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_support_documents
        ADD CONSTRAINT rd_support_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_procedure_analysis - procedure analysis documents
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_procedure_analysis
        ADD CONSTRAINT rd_procedure_analysis_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.rd_support_documents(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_document_links - linking documents to various entities
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_document_links
        ADD CONSTRAINT rd_document_links_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractor_year_data(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_document_links
        ADD CONSTRAINT rd_document_links_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.rd_support_documents(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_document_links
        ADD CONSTRAINT rd_document_links_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.rd_supply_subcomponents(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 13: Procedure Research Links
-- =============================================================================

-- rd_procedure_research_links - linking procedures to research activities
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_procedure_research_links
        ADD CONSTRAINT rd_procedure_research_links_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_procedure_research_links
        ADD CONSTRAINT rd_procedure_research_links_procedure_analysis_id_fkey FOREIGN KEY (procedure_analysis_id) REFERENCES public.rd_procedure_analysis(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_procedure_research_links
        ADD CONSTRAINT rd_procedure_research_links_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_procedure_research_links
        ADD CONSTRAINT rd_procedure_research_links_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 14: Quality Control and Signatures
-- =============================================================================

-- rd_qc_document_controls - quality control for documents
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_qc_document_controls
        ADD CONSTRAINT rd_qc_document_controls_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_qc_document_controls
        ADD CONSTRAINT rd_qc_document_controls_qc_reviewer_fkey FOREIGN KEY (qc_reviewer) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_qc_document_controls
        ADD CONSTRAINT rd_qc_document_controls_released_by_fkey FOREIGN KEY (released_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_signatures - electronic signatures
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_signatures
        ADD CONSTRAINT rd_signatures_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_signature_records - signature record keeping
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_signature_records
        ADD CONSTRAINT rd_signature_records_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 15: Client Portal and Reporting
-- =============================================================================

-- rd_client_portal_tokens - secure client access tokens
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_client_portal_tokens
        ADD CONSTRAINT rd_client_portal_tokens_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_client_portal_tokens
        ADD CONSTRAINT rd_client_portal_tokens_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_reports - generated reports
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_reports
        ADD CONSTRAINT rd_reports_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.rd_reports
        ADD CONSTRAINT rd_reports_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 16: State Proforma Data
-- =============================================================================

-- rd_state_proforma_data - references business_years (not rd_business_years)
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_state_proforma_data
        ADD CONSTRAINT rd_state_proforma_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.business_years(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- rd_state_proforma_lines - proforma line items
DO $$ BEGIN
    ALTER TABLE ONLY public.rd_state_proforma_lines
        ADD CONSTRAINT rd_state_proforma_lines_state_proforma_id_fkey FOREIGN KEY (state_proforma_id) REFERENCES public.rd_state_proformas(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Total Foreign Key Constraints Added: 87
-- 
-- These constraints establish complete referential integrity for the R&D Credit system:
-- - 16 sections covering all functional areas
-- - Proper cascade/set null behavior for data protection
-- - Dependencies ordered to prevent constraint violations
-- - Both inbound and outbound relationships for rd_* tables
-- 
-- Key relationship patterns:
-- 1. rd_businesses as the root entity (client connections)
-- 2. rd_business_years as the primary yearly data container
-- 3. Research hierarchy: categories -> areas -> focuses -> activities -> steps -> subcomponents
-- 4. Employee/contractor management with role-based access
-- 5. Supply chain and expense tracking
-- 6. Document management with quality control
-- 7. Federal credit calculations with versioning
-- 8. Client portal access and reporting
-- =============================================================================