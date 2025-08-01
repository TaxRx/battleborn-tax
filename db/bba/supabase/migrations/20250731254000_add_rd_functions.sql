-- Add missing rd_* related functions and triggers
-- Extracted from remote schema dump
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: CREATE FUNCTION statements for rd_* related functions
-- =============================================================================

-- Function 1/4
CREATE FUNCTION public.archive_rd_federal_credit_version() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Mark previous version as not latest
    UPDATE rd_federal_credit 
    SET is_latest = FALSE 
    WHERE business_year_id = NEW.business_year_id 
    AND research_activity_id = NEW.research_activity_id
    AND id != NEW.id;
    
    -- Set previous version reference
    UPDATE rd_federal_credit 
    SET previous_version_id = (
        SELECT id FROM rd_federal_credit 
        WHERE business_year_id = NEW.business_year_id 
        AND research_activity_id = NEW.research_activity_id
        AND id != NEW.id
        ORDER BY created_at DESC 
        LIMIT 1
    )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Function 2/4
CREATE FUNCTION public.update_completion_percentage() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Calculate completion percentage based on completed steps
    NEW.overall_completion_percentage = (
        (CASE WHEN NEW.business_setup_completed THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.research_activities_completed THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.research_design_completed THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.calculations_completed THEN 25 ELSE 0 END)
    );
    
    -- Update last completed step and timestamp
    IF NEW.business_setup_completed != OLD.business_setup_completed AND NEW.business_setup_completed THEN
        NEW.last_step_completed = 'Business Setup';
        NEW.completion_updated_at = NOW();
    ELSIF NEW.research_activities_completed != OLD.research_activities_completed AND NEW.research_activities_completed THEN
        NEW.last_step_completed = 'Research Activities';
        NEW.completion_updated_at = NOW();
    ELSIF NEW.research_design_completed != OLD.research_design_completed AND NEW.research_design_completed THEN
        NEW.last_step_completed = 'Research Design';
        NEW.completion_updated_at = NOW();
    ELSIF NEW.calculations_completed != OLD.calculations_completed AND NEW.calculations_completed THEN
        NEW.last_step_completed = 'Calculations';
        NEW.completion_updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function 3/4
CREATE FUNCTION public.update_rd_federal_credit_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function 4/4
CREATE FUNCTION public.update_rd_state_proforma_data_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- SECTION 2: CREATE TRIGGER statements for rd_* related triggers
-- =============================================================================

-- Trigger 1/4
CREATE TRIGGER trigger_archive_rd_federal_credit_version AFTER INSERT ON public.rd_federal_credit FOR EACH ROW EXECUTE FUNCTION public.archive_rd_federal_credit_version();

-- Trigger 2/4
CREATE TRIGGER trigger_update_completion_percentage BEFORE UPDATE OF business_setup_completed, research_activities_completed, research_design_completed, calculations_completed ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_completion_percentage();

-- Trigger 3/4
CREATE TRIGGER trigger_update_rd_federal_credit_updated_at BEFORE UPDATE ON public.rd_federal_credit FOR EACH ROW EXECUTE FUNCTION public.update_rd_federal_credit_updated_at();

-- Trigger 4/4
CREATE TRIGGER trigger_update_rd_state_proforma_data_updated_at BEFORE UPDATE ON public.rd_state_proforma_data FOR EACH ROW EXECUTE FUNCTION public.update_rd_state_proforma_data_updated_at();

