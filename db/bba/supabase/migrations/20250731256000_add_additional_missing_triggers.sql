-- Add additional missing triggers for rd_* tables
-- Based on comprehensive trigger audit from remote database
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: Missing trigger functions (skip - all already exist)
-- =============================================================================

-- Note: All required functions already exist locally:
-- - safe_update_selected_subcomponent_practice_percent()
-- - update_selected_subcomponent_step_name()
-- - update_total_qre()
-- - update_credits_calculated_at()
-- Skipping function creation - proceeding directly to triggers

-- =============================================================================
-- SECTION 2: Missing triggers for rd_* tables (17 triggers total)
-- =============================================================================

-- rd_business_years (2 triggers)
DROP TRIGGER IF EXISTS trigger_update_total_qre ON public.rd_business_years;
CREATE TRIGGER trigger_update_total_qre 
    BEFORE INSERT OR UPDATE OF employee_qre, contractor_qre, supply_qre 
    ON public.rd_business_years 
    FOR EACH ROW EXECUTE FUNCTION public.update_total_qre();

DROP TRIGGER IF EXISTS update_rd_business_years_credits_calculated_at ON public.rd_business_years;
CREATE TRIGGER update_rd_business_years_credits_calculated_at 
    BEFORE UPDATE OF federal_credit, state_credit 
    ON public.rd_business_years 
    FOR EACH ROW EXECUTE FUNCTION public.update_credits_calculated_at();

-- rd_contractor_subcomponents (1 trigger)
DROP TRIGGER IF EXISTS handle_rd_contractor_subcomponents_updated_at ON public.rd_contractor_subcomponents;
CREATE TRIGGER handle_rd_contractor_subcomponents_updated_at 
    BEFORE UPDATE ON public.rd_contractor_subcomponents 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_contractor_year_data (1 trigger)
DROP TRIGGER IF EXISTS handle_rd_contractor_year_data_updated_at ON public.rd_contractor_year_data;
CREATE TRIGGER handle_rd_contractor_year_data_updated_at 
    BEFORE UPDATE ON public.rd_contractor_year_data 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_federal_credit_results (1 trigger)
DROP TRIGGER IF EXISTS handle_rd_federal_credit_results_updated_at ON public.rd_federal_credit_results;
CREATE TRIGGER handle_rd_federal_credit_results_updated_at 
    BEFORE UPDATE ON public.rd_federal_credit_results 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_reports (1 trigger)
DROP TRIGGER IF EXISTS update_rd_reports_updated_at ON public.rd_reports;
CREATE TRIGGER update_rd_reports_updated_at 
    BEFORE UPDATE ON public.rd_reports 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_roles (1 trigger)
DROP TRIGGER IF EXISTS update_rd_roles_updated_at ON public.rd_roles;
CREATE TRIGGER update_rd_roles_updated_at 
    BEFORE UPDATE ON public.rd_roles 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_selected_subcomponents (2 triggers)
DROP TRIGGER IF EXISTS trigger_safe_update_practice_percent ON public.rd_selected_subcomponents;
CREATE TRIGGER trigger_safe_update_practice_percent 
    AFTER INSERT ON public.rd_selected_subcomponents 
    FOR EACH ROW EXECUTE FUNCTION public.safe_update_selected_subcomponent_practice_percent();

DROP TRIGGER IF EXISTS trigger_update_step_name ON public.rd_selected_subcomponents;
CREATE TRIGGER trigger_update_step_name 
    AFTER INSERT ON public.rd_selected_subcomponents 
    FOR EACH ROW EXECUTE FUNCTION public.update_selected_subcomponent_step_name();

-- rd_state_calculations (1 trigger)
DROP TRIGGER IF EXISTS update_rd_state_calculations_updated_at ON public.rd_state_calculations;
CREATE TRIGGER update_rd_state_calculations_updated_at 
    BEFORE UPDATE ON public.rd_state_calculations 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rd_supplies (1 trigger)
DROP TRIGGER IF EXISTS set_updated_at_rd_supplies ON public.rd_supplies;
CREATE TRIGGER set_updated_at_rd_supplies 
    BEFORE UPDATE ON public.rd_supplies 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- rd_supply_subcomponents (2 triggers)
DROP TRIGGER IF EXISTS handle_rd_supply_subcomponents_updated_at ON public.rd_supply_subcomponents;
CREATE TRIGGER handle_rd_supply_subcomponents_updated_at 
    BEFORE UPDATE ON public.rd_supply_subcomponents 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_rd_supply_subcomponents ON public.rd_supply_subcomponents;
CREATE TRIGGER set_updated_at_rd_supply_subcomponents 
    BEFORE UPDATE ON public.rd_supply_subcomponents 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- rd_supply_year_data (2 triggers)
DROP TRIGGER IF EXISTS handle_rd_supply_year_data_updated_at ON public.rd_supply_year_data;
CREATE TRIGGER handle_rd_supply_year_data_updated_at 
    BEFORE UPDATE ON public.rd_supply_year_data 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_rd_supply_year_data ON public.rd_supply_year_data;
CREATE TRIGGER set_updated_at_rd_supply_year_data 
    BEFORE UPDATE ON public.rd_supply_year_data 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();