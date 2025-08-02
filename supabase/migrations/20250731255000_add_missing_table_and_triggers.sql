-- Add missing table and triggers
-- Extracted from remote schema dump
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: Missing table - form_6765_overrides (skip if already exists)
-- =============================================================================

-- Note: form_6765_overrides table already exists locally, skipping creation
-- If needed, uncomment and modify the following:
/*
CREATE TABLE IF NOT EXISTS public.form_6765_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    business_year integer NOT NULL,
    section text NOT NULL,
    line_number integer NOT NULL,
    value numeric(15,2) NOT NULL,
    last_modified_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

DO $$ BEGIN
    ALTER TABLE ONLY public.form_6765_overrides ADD CONSTRAINT form_6765_overrides_pkey PRIMARY KEY (id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
*/

-- =============================================================================
-- SECTION 2: Missing trigger functions (skip - all already exist)
-- =============================================================================

-- Note: Both handle_updated_at() and set_updated_at() functions already exist locally
-- Skipping function creation - proceeding directly to triggers

-- =============================================================================
-- SECTION 2.5: Missing constraints and foreign keys for form_6765_overrides
-- =============================================================================

-- Add missing UNIQUE constraint for form_6765_overrides
DO $$ BEGIN
    ALTER TABLE ONLY public.form_6765_overrides 
        ADD CONSTRAINT form_6765_overrides_client_id_business_year_section_line_nu_key 
        UNIQUE (client_id, business_year, section, line_number);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add missing foreign key constraints for form_6765_overrides
DO $$ BEGIN
    ALTER TABLE ONLY public.form_6765_overrides 
        ADD CONSTRAINT form_6765_overrides_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ONLY public.form_6765_overrides 
        ADD CONSTRAINT form_6765_overrides_last_modified_by_fkey 
        FOREIGN KEY (last_modified_by) REFERENCES public.users(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 3: Missing triggers for rd_* tables
-- =============================================================================

-- Note: Using DROP IF EXISTS + CREATE to handle existing triggers safely

-- rd_contractor_subcomponents
DROP TRIGGER IF EXISTS handle_rd_contractor_subcomponents_updated_at ON public.rd_contractor_subcomponents;
CREATE TRIGGER handle_rd_contractor_subcomponents_updated_at 
    BEFORE UPDATE ON public.rd_contractor_subcomponents 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_contractor_year_data
DROP TRIGGER IF EXISTS handle_rd_contractor_year_data_updated_at ON public.rd_contractor_year_data;
CREATE TRIGGER handle_rd_contractor_year_data_updated_at 
    BEFORE UPDATE ON public.rd_contractor_year_data 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_federal_credit_results
DROP TRIGGER IF EXISTS handle_rd_federal_credit_results_updated_at ON public.rd_federal_credit_results;
CREATE TRIGGER handle_rd_federal_credit_results_updated_at 
    BEFORE UPDATE ON public.rd_federal_credit_results 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_reports
DROP TRIGGER IF EXISTS update_rd_reports_updated_at ON public.rd_reports;
CREATE TRIGGER update_rd_reports_updated_at 
    BEFORE UPDATE ON public.rd_reports 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_roles
DROP TRIGGER IF EXISTS update_rd_roles_updated_at ON public.rd_roles;
CREATE TRIGGER update_rd_roles_updated_at 
    BEFORE UPDATE ON public.rd_roles 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_state_calculations
DROP TRIGGER IF EXISTS update_rd_state_calculations_updated_at ON public.rd_state_calculations;
CREATE TRIGGER update_rd_state_calculations_updated_at 
    BEFORE UPDATE ON public.rd_state_calculations 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_supplies
DROP TRIGGER IF EXISTS set_updated_at_rd_supplies ON public.rd_supplies;
CREATE TRIGGER set_updated_at_rd_supplies 
    BEFORE UPDATE ON public.rd_supplies 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- rd_supply_subcomponents
DROP TRIGGER IF EXISTS handle_rd_supply_subcomponents_updated_at ON public.rd_supply_subcomponents;
CREATE TRIGGER handle_rd_supply_subcomponents_updated_at 
    BEFORE UPDATE ON public.rd_supply_subcomponents 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_rd_supply_subcomponents ON public.rd_supply_subcomponents;
CREATE TRIGGER set_updated_at_rd_supply_subcomponents 
    BEFORE UPDATE ON public.rd_supply_subcomponents 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- rd_supply_year_data
DROP TRIGGER IF EXISTS handle_rd_supply_year_data_updated_at ON public.rd_supply_year_data;
CREATE TRIGGER handle_rd_supply_year_data_updated_at 
    BEFORE UPDATE ON public.rd_supply_year_data 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_rd_supply_year_data ON public.rd_supply_year_data;
CREATE TRIGGER set_updated_at_rd_supply_year_data 
    BEFORE UPDATE ON public.rd_supply_year_data 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();