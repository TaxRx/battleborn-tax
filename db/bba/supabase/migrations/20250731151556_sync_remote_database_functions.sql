-- Sync Remote Database Functions & Triggers
-- Purpose: Add missing functions and triggers that exist in remote but not in local
-- Date: 2025-07-31
-- Based on comprehensive comparison of ALL functions and targets (not just rd_*)

BEGIN;

-- MISSING FUNCTIONS (9)
-- These functions exist in remote database but are missing from local

-- 1. Function: archive_rd_federal_credit_version
CREATE OR REPLACE FUNCTION public.archive_rd_federal_credit_version() RETURNS trigger
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

-- 2. Function: safe_update_selected_subcomponent_practice_percent
CREATE OR REPLACE FUNCTION public.safe_update_selected_subcomponent_practice_percent() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Only set practice_percent if it's NULL or 0 (preserve manually set values)
  IF NEW.practice_percent IS NULL OR NEW.practice_percent = 0 THEN
    UPDATE rd_selected_subcomponents 
    SET practice_percent = (
      SELECT rsa.practice_percent 
      FROM rd_selected_activities rsa
      WHERE rsa.activity_id = NEW.research_activity_id
      AND rsa.business_year_id = NEW.business_year_id
      LIMIT 1
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Function: update_credits_calculated_at
CREATE OR REPLACE FUNCTION public.update_credits_calculated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only update timestamp if credit values actually changed and not during lock operation
    IF (OLD.federal_credit IS DISTINCT FROM NEW.federal_credit OR 
        OLD.state_credit IS DISTINCT FROM NEW.state_credit) AND
       (OLD.credits_locked_at IS NOT DISTINCT FROM NEW.credits_locked_at) THEN
        NEW.credits_calculated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Function: update_rd_federal_credit_updated_at
CREATE OR REPLACE FUNCTION public.update_rd_federal_credit_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 5. Function: update_rd_state_proforma_data_updated_at
CREATE OR REPLACE FUNCTION public.update_rd_state_proforma_data_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 6. Function: update_selected_subcomponent_step_name
CREATE OR REPLACE FUNCTION public.update_selected_subcomponent_step_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Set step_name from rd_research_steps when a new subcomponent is selected
  UPDATE rd_selected_subcomponents 
  SET step_name = (
    SELECT rs.name 
    FROM rd_research_steps rs
    JOIN rd_research_subcomponents rsc ON rsc.step_id = rs.id
    WHERE rsc.id = NEW.subcomponent_id
    LIMIT 1
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 7. Function: update_total_qre
CREATE OR REPLACE FUNCTION public.update_total_qre() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.total_qre = COALESCE(NEW.employee_qre, 0) + COALESCE(NEW.contractor_qre, 0) + COALESCE(NEW.supply_qre, 0);
  RETURN NEW;
END;
$$;

-- 8. Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 9. Function: validate_portal_token
CREATE OR REPLACE FUNCTION public.validate_portal_token(p_token character varying, p_ip_address inet DEFAULT NULL::inet) RETURNS TABLE(is_valid boolean, business_id uuid, business_name text, expires_at timestamp without time zone, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Look up the token
  SELECT t.id, t.business_id, t.expires_at, t.is_active, b.name as business_name
  INTO token_record
  FROM rd_client_portal_tokens t
  JOIN rd_businesses b ON t.business_id = b.id
  WHERE t.token = p_token;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TIMESTAMP, 'Invalid token'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token is active
  IF NOT token_record.is_active THEN
    RETURN QUERY SELECT FALSE, token_record.business_id, token_record.business_name, token_record.expires_at, 'Token has been deactivated'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token has expired
  IF token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, token_record.business_id, token_record.business_name, token_record.expires_at, 'Token has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Update access tracking
  UPDATE rd_client_portal_tokens 
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW(),
    last_accessed_ip = p_ip_address,
    updated_at = NOW()
  WHERE id = token_record.id;
  
  -- Return success
  RETURN QUERY SELECT TRUE, token_record.business_id, token_record.business_name, token_record.expires_at, 'Valid token'::TEXT;
END $$;

-- MISSING TRIGGERS (9)
-- These triggers exist in remote database but are missing from local

-- 1. Archive version trigger for rd_federal_credit
DROP TRIGGER IF EXISTS trigger_archive_rd_federal_credit_version ON public.rd_federal_credit;
CREATE TRIGGER trigger_archive_rd_federal_credit_version 
AFTER INSERT ON public.rd_federal_credit 
FOR EACH ROW EXECUTE FUNCTION public.archive_rd_federal_credit_version();

-- 2. Practice percent safe update trigger for rd_selected_subcomponents
DROP TRIGGER IF EXISTS trigger_safe_update_practice_percent ON public.rd_selected_subcomponents;
CREATE TRIGGER trigger_safe_update_practice_percent 
AFTER INSERT ON public.rd_selected_subcomponents 
FOR EACH ROW EXECUTE FUNCTION public.safe_update_selected_subcomponent_practice_percent();

-- 3. Update trigger for rd_federal_credit
DROP TRIGGER IF EXISTS trigger_update_rd_federal_credit_updated_at ON public.rd_federal_credit;
CREATE TRIGGER trigger_update_rd_federal_credit_updated_at 
BEFORE UPDATE ON public.rd_federal_credit 
FOR EACH ROW EXECUTE FUNCTION public.update_rd_federal_credit_updated_at();

-- 4. Update trigger for rd_state_proforma_data
DROP TRIGGER IF EXISTS trigger_update_rd_state_proforma_data_updated_at ON public.rd_state_proforma_data;
CREATE TRIGGER trigger_update_rd_state_proforma_data_updated_at 
BEFORE UPDATE ON public.rd_state_proforma_data 
FOR EACH ROW EXECUTE FUNCTION public.update_rd_state_proforma_data_updated_at();

-- 5. Step name update trigger for rd_selected_subcomponents
DROP TRIGGER IF EXISTS trigger_update_step_name ON public.rd_selected_subcomponents;
CREATE TRIGGER trigger_update_step_name 
AFTER INSERT ON public.rd_selected_subcomponents 
FOR EACH ROW EXECUTE FUNCTION public.update_selected_subcomponent_step_name();

-- 6. Total QRE calculation trigger
DROP TRIGGER IF EXISTS trigger_update_total_qre ON public.rd_business_years;
CREATE TRIGGER trigger_update_total_qre 
BEFORE INSERT OR UPDATE OF employee_qre, contractor_qre, supply_qre ON public.rd_business_years 
FOR EACH ROW EXECUTE FUNCTION public.update_total_qre();

-- 7. Credits calculation trigger for rd_business_years
DROP TRIGGER IF EXISTS update_rd_business_years_credits_calculated_at ON public.rd_business_years;
CREATE TRIGGER update_rd_business_years_credits_calculated_at 
BEFORE UPDATE OF federal_credit, state_credit ON public.rd_business_years 
FOR EACH ROW EXECUTE FUNCTION public.update_credits_calculated_at();

-- 8. Update trigger for rd_reports
DROP TRIGGER IF EXISTS update_rd_reports_updated_at ON public.rd_reports;
CREATE TRIGGER update_rd_reports_updated_at 
BEFORE UPDATE ON public.rd_reports 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Update trigger for rd_roles
DROP TRIGGER IF EXISTS update_rd_roles_updated_at ON public.rd_roles;
CREATE TRIGGER update_rd_roles_updated_at 
BEFORE UPDATE ON public.rd_roles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
