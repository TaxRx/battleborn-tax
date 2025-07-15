

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."activity_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."activity_priority" OWNER TO "postgres";


CREATE TYPE "public"."activity_type" AS ENUM (
    'login',
    'document_upload',
    'proposal_view',
    'profile_update',
    'calculation_run',
    'message_sent',
    'meeting_scheduled',
    'payment_made',
    'tool_enrollment',
    'status_update'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


CREATE TYPE "public"."client_role" AS ENUM (
    'owner',
    'member',
    'viewer',
    'accountant'
);


ALTER TYPE "public"."client_role" OWNER TO "postgres";


CREATE TYPE "public"."engagement_status" AS ENUM (
    'active',
    'inactive',
    'pending',
    'completed',
    'on_hold',
    'cancelled'
);


ALTER TYPE "public"."engagement_status" OWNER TO "postgres";


CREATE TYPE "public"."entity_type" AS ENUM (
    'LLC',
    'SCORP',
    'CCORP',
    'PARTNERSHIP',
    'SOLEPROP',
    'OTHER',
    's_corp',
    'llc',
    'c_corp',
    'partnership',
    'sole_prop',
    'other'
);


ALTER TYPE "public"."entity_type" OWNER TO "postgres";


CREATE TYPE "public"."filing_status" AS ENUM (
    'MFJ',
    'Single',
    'HOH',
    'MFS'
);


ALTER TYPE "public"."filing_status" OWNER TO "postgres";


CREATE TYPE "public"."proposal_status" AS ENUM (
    'draft',
    'submitted',
    'in_review',
    'expert_sent',
    'finalized'
);


ALTER TYPE "public"."proposal_status" OWNER TO "postgres";


CREATE TYPE "public"."rd_report_type" AS ENUM (
    'RESEARCH_DESIGN',
    'RESEARCH_SUMMARY',
    'FILING_GUIDE'
);


ALTER TYPE "public"."rd_report_type" OWNER TO "postgres";


CREATE TYPE "public"."role_type" AS ENUM (
    'ADMIN',
    'CLIENT',
    'STAFF'
);


ALTER TYPE "public"."role_type" OWNER TO "postgres";


CREATE TYPE "public"."strategy_type" AS ENUM (
    'deduction',
    'credit',
    'shift'
);


ALTER TYPE "public"."strategy_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'affiliate',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_invitation"("invitation_token" character varying, "user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
    client_record clients%ROWTYPE;
    result JSON;
BEGIN
    -- Get the invitation
    SELECT * INTO invitation_record
    FROM invitations
    WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired invitation'
        );
    END IF;
    
    -- Get the client
    SELECT * INTO client_record
    FROM clients
    WHERE id = invitation_record.client_id;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM client_users
        WHERE client_id = invitation_record.client_id
        AND user_id = user_id
        AND is_active = true
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User is already a member of this client'
        );
    END IF;
    
    -- Create client_users relationship
    INSERT INTO client_users (client_id, user_id, role, invited_by, accepted_at)
    VALUES (
        invitation_record.client_id,
        user_id,
        invitation_record.role,
        invitation_record.invited_by,
        now()
    );
    
    -- Update invitation status
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = now(),
        accepted_by = user_id,
        updated_at = now()
    WHERE id = invitation_record.id;
    
    RETURN json_build_object(
        'success', true,
        'client_id', invitation_record.client_id,
        'client_name', client_record.full_name,
        'role', invitation_record.role
    );
END;
$$;


ALTER FUNCTION "public"."accept_invitation"("invitation_token" character varying, "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_business_year"("p_business_id" "uuid", "p_year" integer, "p_is_active" boolean DEFAULT true, "p_ordinary_k1_income" numeric DEFAULT 0, "p_guaranteed_k1_income" numeric DEFAULT 0, "p_annual_revenue" numeric DEFAULT 0, "p_employee_count" integer DEFAULT 0) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_year_id UUID;
BEGIN
  INSERT INTO business_years (
    business_id,
    year,
    is_active,
    ordinary_k1_income,
    guaranteed_k1_income,
    annual_revenue,
    employee_count
  ) VALUES (
    p_business_id,
    p_year,
    p_is_active,
    p_ordinary_k1_income,
    p_guaranteed_k1_income,
    p_annual_revenue,
    p_employee_count
  ) RETURNING id INTO v_year_id;
  
  RETURN v_year_id;
END;
$$;


ALTER FUNCTION "public"."add_business_year"("p_business_id" "uuid", "p_year" integer, "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_client"("p_client_id" "uuid", "p_archive" boolean) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE clients 
    SET 
        archived = p_archive,
        archived_at = CASE WHEN p_archive THEN NOW() ELSE NULL END
    WHERE id = p_client_id;
END;
$$;


ALTER FUNCTION "public"."archive_client"("p_client_id" "uuid", "p_archive" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  business_record RECORD;
  base_period_years INTEGER[];
  total_gross_receipts NUMERIC := 0;
  total_qre NUMERIC := 0;
  year_count INTEGER := 0;
  year INTEGER;
  historical_item JSONB;
BEGIN
  -- Get business record
  SELECT * INTO business_record 
  FROM rd_businesses 
  WHERE id = business_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Get base period years
  base_period_years := get_base_period_years(business_record.start_year, tax_year);
  
  -- Calculate averages from historical data
  FOREACH year IN ARRAY base_period_years LOOP
    -- Find historical data for this year
    FOR historical_item IN SELECT jsonb_array_elements(business_record.historical_data) LOOP
      IF (historical_item->>'year')::INTEGER = year THEN
        total_gross_receipts := total_gross_receipts + (historical_item->>'gross_receipts')::NUMERIC;
        total_qre := total_qre + (historical_item->>'qre')::NUMERIC;
        year_count := year_count + 1;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Return average QRE if we have data, otherwise 0
  IF year_count > 0 THEN
    RETURN total_qre / year_count;
  ELSE
    RETURN 0;
  END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_dashboard_metrics"("p_client_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    metrics JSONB := '{}';
    total_proposals INTEGER;
    active_proposals INTEGER;
    total_savings DECIMAL;
    recent_activities INTEGER;
    completion_rate DECIMAL;
BEGIN
    -- Calculate proposal metrics
    SELECT COUNT(*), COUNT(CASE WHEN status != 'cancelled' THEN 1 END), COALESCE(SUM(total_savings), 0)
    INTO total_proposals, active_proposals, total_savings
    FROM tax_proposals WHERE client_id = p_client_id::TEXT;
    
    -- Calculate recent activity count (last 30 days)
    SELECT COUNT(*)
    INTO recent_activities
    FROM client_activities 
    WHERE client_id = p_client_id AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate completion rate based on engagement status
    SELECT completion_percentage
    INTO completion_rate
    FROM client_engagement_status
    WHERE client_id = p_client_id;
    
    -- Build metrics JSON
    metrics := jsonb_build_object(
        'total_proposals', COALESCE(total_proposals, 0),
        'active_proposals', COALESCE(active_proposals, 0),
        'total_savings', COALESCE(total_savings, 0),
        'recent_activities', COALESCE(recent_activities, 0),
        'completion_rate', COALESCE(completion_rate, 0.00),
        'calculated_at', NOW()
    );
    
    -- Cache the metrics
    INSERT INTO client_dashboard_metrics (client_id, metric_type, metric_data, expires_at)
    VALUES (p_client_id, 'overview', metrics, NOW() + INTERVAL '1 hour')
    ON CONFLICT (client_id, metric_type) DO UPDATE SET
        metric_data = metrics,
        calculated_at = NOW(),
        expires_at = NOW() + INTERVAL '1 hour',
        updated_at = NOW();
    
    RETURN metrics;
END;
$$;


ALTER FUNCTION "public"."calculate_dashboard_metrics"("p_client_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_dashboard_metrics"("p_client_id" "uuid") IS 'Calculates and caches dashboard metrics for a client';



CREATE OR REPLACE FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    personal_total DECIMAL(12,2) := 0;
    business_total DECIMAL(12,2) := 0;
BEGIN
    -- Get personal income for the year
    SELECT COALESCE(total_income, 0) INTO personal_total
    FROM personal_years
    WHERE user_id = p_user_id AND year = p_year;
    
    -- Get business income for the year
    SELECT COALESCE(total_business_income, 0) INTO business_total
    FROM business_years
    WHERE user_id = p_user_id AND year = p_year;
    
    RETURN COALESCE(personal_total, 0) + COALESCE(business_total, 0);
END;
$$;


ALTER FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_security_events"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete security events older than 1 year
    DELETE FROM security_events 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND severity IN ('LOW', 'MEDIUM');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    PERFORM log_security_event(
        'security_events_cleanup',
        NULL,
        jsonb_build_object('deleted_count', deleted_count),
        'LOW'
    );
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_security_events"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_security_events"() IS 'Clean up old security events to maintain performance';



CREATE OR REPLACE FUNCTION "public"."create_business_with_enrollment"("p_business_name" "text", "p_entity_type" "text", "p_client_file_id" "uuid", "p_tool_slug" "text", "p_ein" "text" DEFAULT NULL::"text", "p_business_address" "text" DEFAULT NULL::"text", "p_business_city" "text" DEFAULT NULL::"text", "p_business_state" "text" DEFAULT NULL::"text", "p_business_zip" "text" DEFAULT NULL::"text", "p_business_phone" "text" DEFAULT NULL::"text", "p_business_email" "text" DEFAULT NULL::"text", "p_industry" "text" DEFAULT NULL::"text", "p_year_established" integer DEFAULT NULL::integer, "p_annual_revenue" numeric DEFAULT NULL::numeric, "p_employee_count" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- Insert business
    INSERT INTO public.centralized_businesses (
        business_name,
        entity_type,
        ein,
        business_address,
        business_city,
        business_state,
        business_zip,
        business_phone,
        business_email,
        industry,
        year_established,
        annual_revenue,
        employee_count,
        created_by
    ) VALUES (
        p_business_name,
        p_entity_type,
        p_ein,
        p_business_address,
        p_business_city,
        p_business_state,
        p_business_zip,
        p_business_phone,
        p_business_email,
        p_industry,
        p_year_established,
        p_annual_revenue,
        p_employee_count,
        auth.uid()
    ) RETURNING id INTO v_business_id;

    -- Create tool enrollment
    INSERT INTO public.tool_enrollments (
        client_file_id,
        business_id,
        tool_slug,
        enrolled_by
    ) VALUES (
        p_client_file_id,
        v_business_id,
        p_tool_slug,
        auth.uid()
    );

    RETURN v_business_id;
END;
$$;


ALTER FUNCTION "public"."create_business_with_enrollment"("p_business_name" "text", "p_entity_type" "text", "p_client_file_id" "uuid", "p_tool_slug" "text", "p_ein" "text", "p_business_address" "text", "p_business_city" "text", "p_business_state" "text", "p_business_zip" "text", "p_business_phone" "text", "p_business_email" "text", "p_industry" "text", "p_year_established" integer, "p_annual_revenue" numeric, "p_employee_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_client_with_business"("p_full_name" "text", "p_email" "text", "p_phone" "text" DEFAULT NULL::"text", "p_filing_status" "text" DEFAULT 'single'::"text", "p_dependents" integer DEFAULT 0, "p_home_address" "text" DEFAULT NULL::"text", "p_state" "text" DEFAULT 'NV'::"text", "p_wages_income" numeric DEFAULT 0, "p_passive_income" numeric DEFAULT 0, "p_unearned_income" numeric DEFAULT 0, "p_capital_gains" numeric DEFAULT 0, "p_household_income" numeric DEFAULT 0, "p_standard_deduction" boolean DEFAULT true, "p_custom_deduction" numeric DEFAULT 0, "p_business_owner" boolean DEFAULT false, "p_business_name" "text" DEFAULT NULL::"text", "p_entity_type" "text" DEFAULT NULL::"text", "p_business_address" "text" DEFAULT NULL::"text", "p_ordinary_k1_income" numeric DEFAULT 0, "p_guaranteed_k1_income" numeric DEFAULT 0, "p_business_annual_revenue" numeric DEFAULT 0) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_client_file_id UUID;
  v_business_id UUID;
  v_admin_id UUID;
  v_affiliate_id UUID;
  v_tax_profile_data JSONB;
BEGIN
  -- Get current user info
  v_admin_id := auth.uid();
  
  -- Create tax profile data
  v_tax_profile_data := jsonb_build_object(
    'fullName', p_full_name,
    'email', p_email,
    'phone', p_phone,
    'filingStatus', p_filing_status,
    'dependents', p_dependents,
    'homeAddress', p_home_address,
    'state', p_state,
    'wagesIncome', p_wages_income,
    'passiveIncome', p_passive_income,
    'unearnedIncome', p_unearned_income,
    'capitalGains', p_capital_gains,
    'householdIncome', p_household_income,
    'standardDeduction', p_standard_deduction,
    'customDeduction', p_custom_deduction,
    'businessOwner', p_business_owner,
    'businessName', p_business_name,
    'entityType', p_entity_type,
    'businessAddress', p_business_address,
    'ordinaryK1Income', p_ordinary_k1_income,
    'guaranteedK1Income', p_guaranteed_k1_income,
    'businessAnnualRevenue', p_business_annual_revenue
  );

  -- Insert into admin_client_files
  INSERT INTO admin_client_files (
    admin_id,
    affiliate_id,
    full_name,
    email,
    phone,
    filing_status,
    dependents,
    home_address,
    state,
    wages_income,
    passive_income,
    unearned_income,
    capital_gains,
    household_income,
    standard_deduction,
    custom_deduction,
    business_owner,
    business_name,
    entity_type,
    business_address,
    ordinary_k1_income,
    guaranteed_k1_income,
    business_annual_revenue,
    tax_profile_data,
    archived
  ) VALUES (
    v_admin_id,
    v_affiliate_id,
    p_full_name,
    p_email,
    p_phone,
    p_filing_status,
    p_dependents,
    p_home_address,
    p_state,
    p_wages_income,
    p_passive_income,
    p_unearned_income,
    p_capital_gains,
    p_household_income,
    p_standard_deduction,
    p_custom_deduction,
    p_business_owner,
    p_business_name,
    p_entity_type,
    p_business_address,
    p_ordinary_k1_income,
    p_guaranteed_k1_income,
    p_business_annual_revenue,
    v_tax_profile_data,
    FALSE
  ) RETURNING id INTO v_client_file_id;

  -- If business owner and business name provided, create business
  IF p_business_owner AND p_business_name IS NOT NULL AND p_business_name != '' THEN
    INSERT INTO centralized_businesses (
      business_name,
      entity_type,
      business_address,
      ordinary_k1_income,
      guaranteed_k1_income,
      annual_revenue,
      created_by,
      archived
    ) VALUES (
      p_business_name,
      COALESCE(p_entity_type, 'Other')::centralized_businesses.entity_type%TYPE,
      p_business_address,
      p_ordinary_k1_income,
      p_guaranteed_k1_income,
      p_business_annual_revenue,
      v_admin_id,
      FALSE
    ) RETURNING id INTO v_business_id;

    -- Create initial business year record
    INSERT INTO business_years (
      business_id,
      year,
      is_active,
      ordinary_k1_income,
      guaranteed_k1_income,
      annual_revenue
    ) VALUES (
      v_business_id,
      EXTRACT(YEAR FROM NOW()),
      TRUE,
      p_ordinary_k1_income,
      p_guaranteed_k1_income,
      p_business_annual_revenue
    );
  END IF;

  -- Return the created IDs
  RETURN json_build_object(
    'client_file_id', v_client_file_id,
    'business_id', v_business_id
  );
END;
$$;


ALTER FUNCTION "public"."create_client_with_business"("p_full_name" "text", "p_email" "text", "p_phone" "text", "p_filing_status" "text", "p_dependents" integer, "p_home_address" "text", "p_state" "text", "p_wages_income" numeric, "p_passive_income" numeric, "p_unearned_income" numeric, "p_capital_gains" numeric, "p_household_income" numeric, "p_standard_deduction" boolean, "p_custom_deduction" numeric, "p_business_owner" boolean, "p_business_name" "text", "p_entity_type" "text", "p_business_address" "text", "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_business_annual_revenue" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_if_missing"("user_id" "uuid", "user_email" "text", "user_name" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    user_id,
    COALESCE(user_name, split_part(user_email, '@', 1)),
    user_email,
    CASE 
      WHEN user_email ILIKE '%admin%' THEN 'admin'::user_role
      ELSE 'affiliate'::user_role
    END
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."create_profile_if_missing"("user_id" "uuid", "user_email" "text", "user_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_strategy_details_for_proposal"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This function will be called when a proposal is created
  -- It will parse the proposed_strategies JSON and create corresponding strategy_details records
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_strategy_details_for_proposal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enroll_client_in_tool"("p_client_file_id" "uuid", "p_business_id" "uuid", "p_tool_slug" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_enrollment_id UUID;
BEGIN
    INSERT INTO public.tool_enrollments (
        client_file_id,
        business_id,
        tool_slug,
        enrolled_by,
        notes
    ) VALUES (
        p_client_file_id,
        p_business_id,
        p_tool_slug,
        auth.uid(),
        p_notes
    ) ON CONFLICT (client_file_id, business_id, tool_slug) 
    DO UPDATE SET 
        status = 'active',
        notes = COALESCE(p_notes, tool_enrollments.notes),
        enrolled_at = NOW()
    RETURNING id INTO v_enrollment_id;
    
    RETURN v_enrollment_id;
END;
$$;


ALTER FUNCTION "public"."enroll_client_in_tool"("p_client_file_id" "uuid", "p_business_id" "uuid", "p_tool_slug" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_client_has_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If deleting or updating an owner, ensure another owner exists
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND OLD.role = 'owner' THEN
        IF NOT EXISTS (
            SELECT 1 FROM client_users 
            WHERE client_id = OLD.client_id 
            AND role = 'owner' 
            AND is_active = true
            AND (TG_OP = 'DELETE' OR id != OLD.id)
        ) THEN
            RAISE EXCEPTION 'Cannot remove the last owner from a client. At least one owner must remain.';
        END IF;
    END IF;
    
    -- If updating role from owner to non-owner, ensure another owner exists
    IF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner' THEN
        IF NOT EXISTS (
            SELECT 1 FROM client_users 
            WHERE client_id = NEW.client_id 
            AND role = 'owner' 
            AND is_active = true
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'Cannot change the last owner role. At least one owner must remain.';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."ensure_client_has_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_old_invitations"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE invitations 
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending' AND expires_at < now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$;


ALTER FUNCTION "public"."expire_old_invitations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invitation_token"() RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;


ALTER FUNCTION "public"."generate_invitation_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_affiliate_from_client"("client_id" "uuid") RETURNS TABLE("affiliate_id" "uuid", "affiliate_name" "text", "affiliate_email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.affiliate_id,
    p.full_name as affiliate_name,
    p.email as affiliate_email
  FROM clients c
  LEFT JOIN profiles p ON c.affiliate_id = p.id
  WHERE c.id = get_affiliate_from_client.client_id;
END;
$$;


ALTER FUNCTION "public"."get_affiliate_from_client"("client_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_affiliate_from_client"("client_id" "uuid") IS 'Helper function to get affiliate information from a client ID';



CREATE OR REPLACE FUNCTION "public"."get_base_period_years"("business_start_year" integer, "tax_year" integer) RETURNS integer[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  start_from_year INTEGER;
  years INTEGER[] := ARRAY[]::INTEGER[];
  year INTEGER;
BEGIN
  -- Start from 8 years ago or business start year, whichever is later
  start_from_year := GREATEST(business_start_year, tax_year - 8);
  
  -- Generate array of years from start_from_year to tax_year - 1
  FOR year IN start_from_year..(tax_year - 1) LOOP
    years := array_append(years, year);
  END LOOP;
  
  RETURN years;
END;
$$;


ALTER FUNCTION "public"."get_base_period_years"("business_start_year" integer, "tax_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_client_info"("client_id" "uuid") RETURNS TABLE("id" "uuid", "full_name" "text", "email" "text", "phone" "text", "affiliate_id" "uuid", "affiliate_name" "text", "affiliate_email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.full_name,
    c.email,
    c.phone,
    c.affiliate_id,
    p.full_name as affiliate_name,
    p.email as affiliate_email
  FROM clients c
  LEFT JOIN profiles p ON c.affiliate_id = p.id
  WHERE c.id = get_client_info.client_id;
END;
$$;


ALTER FUNCTION "public"."get_client_info"("client_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_client_info"("client_id" "uuid") IS 'Helper function to get complete client information including affiliate details';



CREATE OR REPLACE FUNCTION "public"."get_client_tools"("p_client_file_id" "uuid", "p_business_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("tool_slug" "text", "tool_name" "text", "status" "text", "enrolled_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.tool_slug,
        CASE te.tool_slug
            WHEN 'rd' THEN 'R&D Tax Calculator'
            WHEN 'augusta' THEN 'Augusta Rule Estimator'
            WHEN 'hire_children' THEN 'Hire Children Calculator'
            WHEN 'cost_segregation' THEN 'Cost Segregation Calculator'
            WHEN 'convertible_bonds' THEN 'Convertible Tax Bonds Calculator'
            WHEN 'tax_planning' THEN 'Tax Planning'
            ELSE te.tool_slug
        END AS tool_name,
        te.status,
        te.enrolled_at
    FROM public.tool_enrollments te
    WHERE te.client_file_id = p_client_file_id
    AND (p_business_id IS NULL OR te.business_id = p_business_id)
    ORDER BY te.enrolled_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_client_tools"("p_client_file_id" "uuid", "p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_client_with_data"("client_uuid" "uuid") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'client', c,
        'personal_years', COALESCE(py_data, '[]'::json),
        'businesses', COALESCE(b_data, '[]'::json)
    ) INTO result
    FROM clients c
    LEFT JOIN (
        SELECT 
            client_id,
            json_agg(py.*) as py_data
        FROM personal_years py
        WHERE py.client_id = client_uuid
        GROUP BY client_id
    ) py ON c.id = py.client_id
    LEFT JOIN (
        SELECT 
            b.client_id,
            json_agg(
                json_build_object(
                    'business', b,
                    'business_years', COALESCE(by_data, '[]'::json)
                )
            ) as b_data
        FROM businesses b
        LEFT JOIN (
            SELECT 
                business_id,
                json_agg(by.*) as by_data
            FROM business_years by
            WHERE by.business_id IN (SELECT id FROM businesses WHERE client_id = client_uuid)
            GROUP BY business_id
        ) by ON b.id = by.business_id
        WHERE b.client_id = client_uuid
        GROUP BY b.client_id
    ) b ON c.id = b.client_id
    WHERE c.id = client_uuid;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_client_with_data"("client_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tax_proposal_affiliate"("proposal_id" "uuid") RETURNS TABLE("affiliate_id" "uuid", "affiliate_name" "text", "affiliate_email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.affiliate_id,
    p.full_name,
    p.email
  FROM tax_proposals tp
  JOIN clients c ON tp.client_id = c.id
  LEFT JOIN profiles p ON c.affiliate_id = p.id
  WHERE tp.id = proposal_id;
END;
$$;


ALTER FUNCTION "public"."get_tax_proposal_affiliate"("proposal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unified_client_list"("p_tool_filter" "text" DEFAULT NULL::"text", "p_admin_id" "uuid" DEFAULT NULL::"uuid", "p_affiliate_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("client_file_id" "uuid", "business_id" "uuid", "admin_id" "uuid", "affiliate_id" "uuid", "archived" boolean, "created_at" timestamp with time zone, "full_name" "text", "email" "text", "business_name" "text", "entity_type" "text", "tool_slug" "text", "tool_status" "text", "total_income" numeric, "filing_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        acf.id AS client_file_id,
        acf.business_id,
        acf.admin_id,
        acf.affiliate_id,
        acf.archived,
        acf.created_at,
        acf.full_name,
        acf.email,
        cb.business_name,
        cb.entity_type,
        te.tool_slug,
        te.status AS tool_status,
        COALESCE(
            (SELECT (wages_income + passive_income + unearned_income + capital_gains) 
             FROM personal_years py 
             WHERE py.client_id = acf.id 
             ORDER BY py.year DESC 
             LIMIT 1),
            (acf.wages_income + acf.passive_income + acf.unearned_income + acf.capital_gains)
        ) AS total_income,
        acf.filing_status
    FROM public.admin_client_files acf
    LEFT JOIN public.centralized_businesses cb ON acf.business_id = cb.id
    LEFT JOIN public.tool_enrollments te ON te.business_id = cb.id
    WHERE acf.archived IS NOT TRUE
    AND (p_tool_filter IS NULL OR te.tool_slug = p_tool_filter)
    AND (p_admin_id IS NULL OR acf.admin_id = p_admin_id)
    AND (p_affiliate_id IS NULL OR acf.affiliate_id = p_affiliate_id)
    ORDER BY acf.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_unified_client_list"("p_tool_filter" "text", "p_admin_id" "uuid", "p_affiliate_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_client_role"("check_user_id" "uuid", "check_client_id" "uuid") RETURNS "public"."client_role"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_role client_role;
BEGIN
    SELECT role INTO user_role
    FROM client_users
    WHERE user_id = check_user_id
    AND client_id = check_client_id
    AND is_active = true;
    
    RETURN user_role;
END;
$$;


ALTER FUNCTION "public"."get_user_client_role"("check_user_id" "uuid", "check_client_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_client_role"("check_user_id" "uuid", "check_client_id" "uuid") IS 'Get user role for a specific client';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_affiliated_with_client"("client_id_to_check" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_id_to_check AND affiliate_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_affiliated_with_client"("client_id_to_check" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_client_access"("action_type" "text", "client_id" "uuid", "user_id" "uuid" DEFAULT "auth"."uid"(), "additional_info" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        action,
        record_id,
        user_id,
        metadata,
        created_at
    ) VALUES (
        'client_access',
        action_type,
        client_id,
        user_id,
        additional_info || jsonb_build_object(
            'client_id', client_id,
            'access_timestamp', NOW()
        ),
        NOW()
    );
END;
$$;


ALTER FUNCTION "public"."log_client_access"("action_type" "text", "client_id" "uuid", "user_id" "uuid", "additional_info" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_client_access"("action_type" "text", "client_id" "uuid", "user_id" "uuid", "additional_info" "jsonb") IS 'Log client access events for audit trail';



CREATE OR REPLACE FUNCTION "public"."log_client_activity"("p_client_id" "uuid", "p_user_id" "uuid", "p_activity_type" "public"."activity_type", "p_title" "text", "p_description" "text" DEFAULT NULL::"text", "p_priority" "public"."activity_priority" DEFAULT 'medium'::"public"."activity_priority", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    activity_id UUID;
BEGIN
    -- Insert the activity
    INSERT INTO client_activities (
        client_id, user_id, activity_type, title, description, priority, metadata
    ) VALUES (
        p_client_id, p_user_id, p_activity_type, p_title, p_description, p_priority, p_metadata
    ) RETURNING id INTO activity_id;
    
    -- Update engagement status
    INSERT INTO client_engagement_status (client_id, last_activity_at, total_activities)
    VALUES (p_client_id, NOW(), 1)
    ON CONFLICT (client_id) DO UPDATE SET
        last_activity_at = NOW(),
        total_activities = client_engagement_status.total_activities + 1,
        updated_at = NOW();
    
    -- Update last login if it's a login activity
    IF p_activity_type = 'login' THEN
        UPDATE client_engagement_status 
        SET last_login_at = NOW(), updated_at = NOW()
        WHERE client_id = p_client_id;
    END IF;
    
    RETURN activity_id;
END;
$$;


ALTER FUNCTION "public"."log_client_activity"("p_client_id" "uuid", "p_user_id" "uuid", "p_activity_type" "public"."activity_type", "p_title" "text", "p_description" "text", "p_priority" "public"."activity_priority", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_client_activity"("p_client_id" "uuid", "p_user_id" "uuid", "p_activity_type" "public"."activity_type", "p_title" "text", "p_description" "text", "p_priority" "public"."activity_priority", "p_metadata" "jsonb") IS 'Logs a client activity and updates engagement status';



CREATE OR REPLACE FUNCTION "public"."log_security_event"("event_type" "text", "client_id" "uuid" DEFAULT NULL::"uuid", "event_data" "jsonb" DEFAULT '{}'::"jsonb", "severity" "text" DEFAULT 'LOW'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO security_events (
        event_type,
        user_id,
        client_id,
        event_data,
        severity,
        created_at
    ) VALUES (
        event_type,
        auth.uid(),
        client_id,
        event_data,
        severity,
        NOW()
    );
END;
$$;


ALTER FUNCTION "public"."log_security_event"("event_type" "text", "client_id" "uuid", "event_data" "jsonb", "severity" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_security_event"("event_type" "text", "client_id" "uuid", "event_data" "jsonb", "severity" "text") IS 'Log security events for audit trail';



CREATE OR REPLACE FUNCTION "public"."security_health_check"() RETURNS TABLE("check_name" "text", "status" "text", "details" "text", "severity" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check 1: Tables without RLS
    RETURN QUERY
    SELECT 
        'Tables without RLS'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        'Tables without RLS: ' || STRING_AGG(tablename, ', '),
        'HIGH'::TEXT
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
    AND NOT EXISTS (
        SELECT 1 FROM pg_class c
        WHERE c.relname = t.tablename
        AND c.relrowsecurity = true
    );

    -- Check 2: Tables with RLS but no policies
    RETURN QUERY
    SELECT 
        'Tables with RLS but no policies'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
        'Tables with RLS but no policies: ' || STRING_AGG(tablename, ', '),
        'MEDIUM'::TEXT
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
    AND EXISTS (
        SELECT 1 FROM pg_class c
        WHERE c.relname = t.tablename
        AND c.relrowsecurity = true
    )
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.tablename = t.tablename
        AND p.schemaname = 'public'
    );

    -- Check 3: Overly permissive policies
    RETURN QUERY
    SELECT 
        'Overly permissive policies'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        'Permissive policies found: ' || STRING_AGG(tablename || '.' || policyname, ', '),
        'HIGH'::TEXT
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        qual LIKE '%true%' OR
        qual LIKE '%1=1%' OR
        qual IS NULL
    );

    -- Check 4: Functions without SECURITY DEFINER
    RETURN QUERY
    SELECT 
        'Functions without SECURITY DEFINER'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'INFO' END,
        'Functions without SECURITY DEFINER: ' || STRING_AGG(proname, ', '),
        'LOW'::TEXT
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE '%client%'
    AND NOT p.prosecdef;

END;
$$;


ALTER FUNCTION "public"."security_health_check"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."security_health_check"() IS 'Comprehensive security health check for the database';



CREATE OR REPLACE FUNCTION "public"."set_invitation_token"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.token IS NULL OR NEW.token = '' THEN
        NEW.token := generate_invitation_token();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_invitation_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean DEFAULT NULL::boolean, "p_ordinary_k1_income" numeric DEFAULT NULL::numeric, "p_guaranteed_k1_income" numeric DEFAULT NULL::numeric, "p_annual_revenue" numeric DEFAULT NULL::numeric, "p_employee_count" integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE business_years SET
    is_active = COALESCE(p_is_active, is_active),
    ordinary_k1_income = COALESCE(p_ordinary_k1_income, ordinary_k1_income),
    guaranteed_k1_income = COALESCE(p_guaranteed_k1_income, guaranteed_k1_income),
    annual_revenue = COALESCE(p_annual_revenue, annual_revenue),
    employee_count = COALESCE(p_employee_count, employee_count),
    updated_at = NOW()
  WHERE id = p_year_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_business_years_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_business_years_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_client_engagement_status"("p_client_id" "uuid", "p_status" "public"."engagement_status" DEFAULT NULL::"public"."engagement_status", "p_pending_actions" integer DEFAULT NULL::integer, "p_completion_percentage" numeric DEFAULT NULL::numeric, "p_next_action_due" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO client_engagement_status (client_id, status, pending_actions, completion_percentage, next_action_due)
    VALUES (p_client_id, COALESCE(p_status, 'active'), COALESCE(p_pending_actions, 0), COALESCE(p_completion_percentage, 0.00), p_next_action_due)
    ON CONFLICT (client_id) DO UPDATE SET
        status = COALESCE(p_status, client_engagement_status.status),
        pending_actions = COALESCE(p_pending_actions, client_engagement_status.pending_actions),
        completion_percentage = COALESCE(p_completion_percentage, client_engagement_status.completion_percentage),
        next_action_due = COALESCE(p_next_action_due, client_engagement_status.next_action_due),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_client_engagement_status"("p_client_id" "uuid", "p_status" "public"."engagement_status", "p_pending_actions" integer, "p_completion_percentage" numeric, "p_next_action_due" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_client_engagement_status"("p_client_id" "uuid", "p_status" "public"."engagement_status", "p_pending_actions" integer, "p_completion_percentage" numeric, "p_next_action_due" timestamp with time zone) IS 'Updates client engagement status and metrics';



CREATE OR REPLACE FUNCTION "public"."update_client_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_client_users_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invitations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_invitations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_client_access"("check_user_id" "uuid", "check_client_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_users cu
        JOIN profiles p ON cu.user_id = p.id
        WHERE cu.user_id = check_user_id
        AND cu.client_id = check_client_id
        AND cu.is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."user_has_client_access"("check_user_id" "uuid", "check_client_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_has_client_access"("check_user_id" "uuid", "check_client_id" "uuid") IS 'Check if user has any access to a client';



CREATE OR REPLACE FUNCTION "public"."user_has_client_role"("check_user_id" "uuid", "check_client_id" "uuid", "required_role" "public"."client_role") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_role client_role;
    role_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- Get user's role for this client
    SELECT role INTO user_role
    FROM client_users
    WHERE user_id = check_user_id
    AND client_id = check_client_id
    AND is_active = true;
    
    -- If no role found, return false
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Define role hierarchy (higher number = more permissions)
    role_hierarchy := CASE user_role
        WHEN 'viewer' THEN 1
        WHEN 'member' THEN 2
        WHEN 'accountant' THEN 3
        WHEN 'owner' THEN 4
        ELSE 0
    END;
    
    required_hierarchy := CASE required_role
        WHEN 'viewer' THEN 1
        WHEN 'member' THEN 2
        WHEN 'accountant' THEN 3
        WHEN 'owner' THEN 4
        ELSE 0
    END;
    
    RETURN role_hierarchy >= required_hierarchy;
END;
$$;


ALTER FUNCTION "public"."user_has_client_role"("check_user_id" "uuid", "check_client_id" "uuid", "required_role" "public"."client_role") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_has_client_role"("check_user_id" "uuid", "check_client_id" "uuid", "required_role" "public"."client_role") IS 'Check if user has specific role or higher for a client';



CREATE OR REPLACE FUNCTION "public"."user_has_direct_client_access"("user_id" "uuid", "client_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user is the client creator
  IF EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_id AND c.created_by = user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is an admin
  IF EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = user_id AND p.role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is an affiliate who created the client
  IF EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_id AND c.affiliate_id = user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."user_has_direct_client_access"("user_id" "uuid", "client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_client_owner"("user_id" "uuid", "client_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.client_id = client_id 
    AND cu.user_id = user_id 
    AND cu.role = 'owner'
    AND cu.is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."user_is_client_owner"("user_id" "uuid", "client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_client_access"("check_client_id" "uuid", "required_role" "public"."client_role" DEFAULT 'viewer'::"public"."client_role") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if user has required access
    IF NOT user_has_client_role(auth.uid(), check_client_id, required_role) THEN
        -- Log unauthorized access attempt
        PERFORM log_client_access(
            'unauthorized_access_attempt',
            check_client_id,
            auth.uid(),
            jsonb_build_object(
                'required_role', required_role,
                'user_role', get_user_client_role(auth.uid(), check_client_id)
            )
        );
        RETURN FALSE;
    END IF;
    
    -- Log successful access
    PERFORM log_client_access(
        'authorized_access',
        check_client_id,
        auth.uid(),
        jsonb_build_object(
            'required_role', required_role,
            'user_role', get_user_client_role(auth.uid(), check_client_id)
        )
    );
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."validate_client_access"("check_client_id" "uuid", "required_role" "public"."client_role") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_client_access"("check_client_id" "uuid", "required_role" "public"."client_role") IS 'Validate user has required access to client and log the attempt';



CREATE OR REPLACE FUNCTION "public"."validate_historical_data"("data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if it's an array
  IF jsonb_typeof(data) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check each object in the array
  FOR i IN 0..jsonb_array_length(data) - 1 LOOP
    DECLARE
      item JSONB := data->i;
    BEGIN
      -- Check required fields exist and are numbers
      IF NOT (item ? 'year' AND item ? 'gross_receipts' AND item ? 'qre') THEN
        RETURN FALSE;
      END IF;
      
      -- Check year is reasonable
      IF (item->>'year')::INTEGER < 1900 OR (item->>'year')::INTEGER > EXTRACT(YEAR FROM CURRENT_DATE) + 1 THEN
        RETURN FALSE;
      END IF;
      
      -- Check amounts are non-negative
      IF (item->>'gross_receipts')::NUMERIC < 0 OR (item->>'qre')::NUMERIC < 0 THEN
        RETURN FALSE;
      END IF;
    END;
  END LOOP;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."validate_historical_data"("data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_rls_enabled"() RETURNS TABLE("table_name" "text", "rls_enabled" boolean, "has_policies" boolean, "policy_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COUNT(p.policyname) > 0,
        COUNT(p.policyname)::INTEGER
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$;


ALTER FUNCTION "public"."validate_rls_enabled"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_rls_enabled"() IS 'Validate that RLS is properly enabled on all tables';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_client_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "admin_id" "uuid",
    "affiliate_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "tax_profile_data" "jsonb",
    "last_calculation_date" timestamp without time zone,
    "projected_savings" numeric(10,2),
    "archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "business_id" "uuid",
    "ordinary_k1_income" numeric(15,2) DEFAULT 0,
    "guaranteed_k1_income" numeric(15,2) DEFAULT 0,
    "household_income" numeric(15,2) DEFAULT 0,
    "business_annual_revenue" numeric(15,2) DEFAULT 0,
    "email" "text",
    "full_name" "text",
    "phone" "text",
    "filing_status" "text",
    "dependents" numeric,
    "home_address" "text",
    "state" "text",
    "wages_income" numeric,
    "passive_income" numeric,
    "unearned_income" numeric,
    "capital_gains" numeric,
    "custom_deduction" numeric,
    "business_owner" boolean,
    "business_name" "text",
    "entity_type" "text",
    "business_address" "text",
    "standard_deduction" boolean
);


ALTER TABLE "public"."admin_client_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliate_tool_permissions" (
    "affiliate_profile_id" "uuid" NOT NULL,
    "tool_id" "uuid" NOT NULL,
    "permission_level" "text" NOT NULL,
    CONSTRAINT "affiliate_tool_permissions_permission_level_check" CHECK (("permission_level" = ANY (ARRAY['full'::"text", 'limited'::"text", 'reporting'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."affiliate_tool_permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."affiliate_tool_permissions" IS 'Maps which tools an affiliate can access, as set by their parent partner.';



CREATE TABLE IF NOT EXISTS "public"."augusta_rule_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "strategy_detail_id" "uuid" NOT NULL,
    "days_rented" integer DEFAULT 14 NOT NULL,
    "daily_rate" numeric(10,2) DEFAULT 1500 NOT NULL,
    "total_rent" numeric(12,2) DEFAULT 21000 NOT NULL,
    "state_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "federal_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "fica_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "rental_dates" "jsonb",
    "parties_info" "jsonb",
    "rental_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."augusta_rule_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_years" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "ordinary_k1_income" numeric(12,2) DEFAULT 0,
    "guaranteed_k1_income" numeric(12,2) DEFAULT 0,
    "annual_revenue" numeric(15,2) DEFAULT 0,
    "employee_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_years" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "business_name" character varying(255) NOT NULL,
    "entity_type" character varying(50) DEFAULT 'LLC'::character varying NOT NULL,
    "ein" character varying(20),
    "business_address" "text",
    "business_city" character varying(100),
    "business_state" character varying(2),
    "business_zip" character varying(10),
    "business_phone" character varying(50),
    "business_email" character varying(255),
    "industry" character varying(100),
    "year_established" integer,
    "annual_revenue" numeric(15,2) DEFAULT 0,
    "employee_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tax_info" "jsonb" NOT NULL,
    "breakdown" "jsonb" NOT NULL,
    "strategies" "jsonb"[],
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."centralized_businesses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "business_name" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "ein" "text",
    "business_address" "text",
    "business_city" "text",
    "business_state" "text",
    "business_zip" "text",
    "business_phone" "text",
    "business_email" "text",
    "industry" "text",
    "year_established" integer,
    "annual_revenue" numeric(15,2),
    "employee_count" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "centralized_businesses_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['LLC'::"text", 'S-Corp'::"text", 'C-Corp'::"text", 'Partnership'::"text", 'Sole Proprietorship'::"text", 'Other'::"text"])))
);


ALTER TABLE "public"."centralized_businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."charitable_donation_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "strategy_detail_id" "uuid" NOT NULL,
    "donation_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "fmv_multiplier" numeric(5,2) DEFAULT 5.0 NOT NULL,
    "agi_limit" numeric(3,2) DEFAULT 0.6 NOT NULL,
    "deduction_value" numeric(12,2) DEFAULT 0 NOT NULL,
    "federal_savings" numeric(12,2) DEFAULT 0 NOT NULL,
    "state_savings" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."charitable_donation_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."client_role" DEFAULT 'member'::"public"."client_role" NOT NULL,
    "invited_by" "uuid",
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_role" CHECK (("role" = ANY (ARRAY['owner'::"public"."client_role", 'member'::"public"."client_role", 'viewer'::"public"."client_role", 'accountant'::"public"."client_role"])))
);


ALTER TABLE "public"."client_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_users" IS 'Links users (profiles) to client accounts, allowing multiple users per client.';



COMMENT ON COLUMN "public"."client_users"."role" IS 'User role for this client: owner (full access), member (standard), viewer (read-only), accountant (professional)';



COMMENT ON COLUMN "public"."client_users"."invited_by" IS 'User who invited this user to the client';



COMMENT ON COLUMN "public"."client_users"."invited_at" IS 'When the invitation was sent';



COMMENT ON COLUMN "public"."client_users"."accepted_at" IS 'When the user accepted the invitation';



COMMENT ON COLUMN "public"."client_users"."is_active" IS 'Whether this user relationship is currently active';



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(50),
    "filing_status" character varying(50) DEFAULT 'single'::character varying NOT NULL,
    "home_address" "text",
    "state" character varying(2),
    "dependents" integer DEFAULT 0,
    "standard_deduction" boolean DEFAULT true,
    "custom_deduction" numeric(12,2) DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "city" "text",
    "zip_code" "text",
    "affiliate_id" "uuid",
    "partner_id" "uuid",
    "user_id" "uuid"
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clients"."affiliate_id" IS 'References the affiliate who manages this client';



CREATE OR REPLACE VIEW "public"."client_access_summary" AS
 SELECT "c"."id" AS "client_id",
    "c"."full_name" AS "client_name",
    "c"."affiliate_id",
    "count"("cu"."id") AS "total_users",
    "count"(
        CASE
            WHEN ("cu"."role" = 'owner'::"public"."client_role") THEN 1
            ELSE NULL::integer
        END) AS "owners",
    "count"(
        CASE
            WHEN ("cu"."role" = 'member'::"public"."client_role") THEN 1
            ELSE NULL::integer
        END) AS "members",
    "count"(
        CASE
            WHEN ("cu"."role" = 'viewer'::"public"."client_role") THEN 1
            ELSE NULL::integer
        END) AS "viewers",
    "count"(
        CASE
            WHEN ("cu"."role" = 'accountant'::"public"."client_role") THEN 1
            ELSE NULL::integer
        END) AS "accountants",
    "count"(
        CASE
            WHEN ("cu"."is_active" = true) THEN 1
            ELSE NULL::integer
        END) AS "active_users",
    "max"("cu"."created_at") AS "last_user_added"
   FROM ("public"."clients" "c"
     LEFT JOIN "public"."client_users" "cu" ON (("c"."id" = "cu"."client_id")))
  GROUP BY "c"."id", "c"."full_name", "c"."affiliate_id"
  ORDER BY "c"."full_name";


ALTER VIEW "public"."client_access_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."client_access_summary" IS 'Summary view showing user access patterns for each client';



CREATE TABLE IF NOT EXISTS "public"."client_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "activity_type" "public"."activity_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "public"."activity_priority" DEFAULT 'medium'::"public"."activity_priority",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_activities" IS 'Tracks all client activities for dashboard display and audit purposes';



CREATE TABLE IF NOT EXISTS "public"."client_dashboard_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "metric_type" "text" NOT NULL,
    "metric_value" numeric,
    "metric_data" "jsonb" DEFAULT '{}'::"jsonb",
    "calculated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_dashboard_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_dashboard_metrics" IS 'Cached dashboard metrics for performance optimization';



CREATE TABLE IF NOT EXISTS "public"."client_engagement_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "status" "public"."engagement_status" DEFAULT 'active'::"public"."engagement_status" NOT NULL,
    "last_activity_at" timestamp with time zone,
    "last_login_at" timestamp with time zone,
    "total_activities" integer DEFAULT 0,
    "pending_actions" integer DEFAULT 0,
    "completion_percentage" numeric(5,2) DEFAULT 0.00,
    "next_action_due" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_engagement_status" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_engagement_status" IS 'Maintains current engagement status and metrics for each client';



CREATE OR REPLACE VIEW "public"."client_dashboard_summary" AS
 SELECT "c"."id",
    "c"."full_name",
    "c"."email",
    "ces"."status" AS "engagement_status",
    "ces"."last_activity_at",
    "ces"."last_login_at",
    "ces"."total_activities",
    "ces"."pending_actions",
    "ces"."completion_percentage",
    "ces"."next_action_due",
    "count"("ca"."id") AS "recent_activities_count",
    "count"(
        CASE
            WHEN ("ca"."is_read" = false) THEN 1
            ELSE NULL::integer
        END) AS "unread_activities_count"
   FROM (("public"."clients" "c"
     LEFT JOIN "public"."client_engagement_status" "ces" ON (("c"."id" = "ces"."client_id")))
     LEFT JOIN "public"."client_activities" "ca" ON ((("c"."id" = "ca"."client_id") AND ("ca"."created_at" >= ("now"() - '7 days'::interval)))))
  GROUP BY "c"."id", "c"."full_name", "c"."email", "ces"."status", "ces"."last_activity_at", "ces"."last_login_at", "ces"."total_activities", "ces"."pending_actions", "ces"."completion_percentage", "ces"."next_action_due";


ALTER VIEW "public"."client_dashboard_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commission_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "affiliate_id" "uuid",
    "expert_id" "uuid",
    "transaction_type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "transaction_date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "payment_method" "text",
    "reference_number" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "commission_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "commission_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['expert_payment_received'::"text", 'affiliate_payment_due'::"text", 'affiliate_payment_sent'::"text", 'admin_commission'::"text"])))
);


ALTER TABLE "public"."commission_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contractor_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "contractor_name" "text",
    "amount" numeric,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."contractor_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."convertible_tax_bonds_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "strategy_detail_id" "uuid" NOT NULL,
    "ctb_payment" numeric(12,2) DEFAULT 0 NOT NULL,
    "ctb_tax_offset" numeric(12,2) DEFAULT 0 NOT NULL,
    "net_savings" numeric(12,2) DEFAULT 0 NOT NULL,
    "remaining_tax_after_ctb" numeric(12,2) DEFAULT 0 NOT NULL,
    "reduction_ratio" numeric(5,4) DEFAULT 0.75 NOT NULL,
    "total_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."convertible_tax_bonds_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cost_segregation_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "strategy_detail_id" "uuid" NOT NULL,
    "property_value" numeric(12,2) DEFAULT 0 NOT NULL,
    "land_value" numeric(12,2) DEFAULT 0 NOT NULL,
    "improvement_value" numeric(12,2) DEFAULT 0 NOT NULL,
    "bonus_depreciation_rate" numeric(5,4) DEFAULT 0.8 NOT NULL,
    "year_acquired" integer DEFAULT 2024 NOT NULL,
    "current_year_deduction" numeric(12,2) DEFAULT 0 NOT NULL,
    "years_2_to_5_annual" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_savings" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cost_segregation_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drf_tmp_test" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."drf_tmp_test" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "name" "text",
    "role" "text",
    "salary" numeric,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."experts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "company" "text",
    "specialties" "text"[] DEFAULT '{}'::"text"[],
    "current_workload" integer DEFAULT 0,
    "max_capacity" integer DEFAULT 10,
    "commission_rate" numeric(5,4) DEFAULT 0.10,
    "is_active" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."experts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_management_company_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "strategy_detail_id" "uuid" NOT NULL,
    "members" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_salaries" numeric(12,2) DEFAULT 0 NOT NULL,
    "state_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "federal_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "fica_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."family_management_company_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hire_children_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "strategy_detail_id" "uuid" NOT NULL,
    "children" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_salaries" numeric(12,2) DEFAULT 0 NOT NULL,
    "state_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "federal_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "fica_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hire_children_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" "public"."client_role" DEFAULT 'member'::"public"."client_role" NOT NULL,
    "token" character varying(255) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '48:00:00'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "accepted_by" "uuid",
    "message" "text",
    "resent_count" integer DEFAULT 0,
    "last_resent_at" timestamp with time zone,
    CONSTRAINT "invitations_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'due'::"text" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "stripe_invoice_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['due'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoices" IS 'Stores invoices generated from transactions for partners.';



CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "status" "text" DEFAULT 'new'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_tool_subscriptions" (
    "partner_id" "uuid" NOT NULL,
    "tool_id" "uuid" NOT NULL,
    "subscription_level" "text" NOT NULL,
    CONSTRAINT "partner_tool_subscriptions_subscription_level_check" CHECK (("subscription_level" = ANY (ARRAY['full'::"text", 'limited'::"text", 'reporting'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."partner_tool_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."partner_tool_subscriptions" IS 'Maps which tools a partner is subscribed to, as set by the platform admin.';



CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_name" "text" NOT NULL,
    "logo_url" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "stripe_customer_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "partners_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


COMMENT ON TABLE "public"."partners" IS 'Stores partner organizations who are the primary customers of the SaaS platform.';



CREATE TABLE IF NOT EXISTS "public"."personal_years" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "wages_income" numeric(12,2) DEFAULT 0,
    "passive_income" numeric(12,2) DEFAULT 0,
    "unearned_income" numeric(12,2) DEFAULT 0,
    "capital_gains" numeric(12,2) DEFAULT 0,
    "long_term_capital_gains" numeric(12,2) DEFAULT 0,
    "household_income" numeric(12,2) DEFAULT 0,
    "ordinary_income" numeric(12,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."personal_years" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'user'::"text",
    "is_admin" boolean DEFAULT false,
    "has_completed_tax_profile" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "partner_id" "uuid",
    "access_level" "text",
    "avatar_url" "text",
    CONSTRAINT "profiles_access_level_check" CHECK (("access_level" = ANY (ARRAY['platform'::"text", 'partner'::"text", 'affiliate'::"text", 'client'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Primary user table for application. All business logic should reference this table, not auth.users directly.';



CREATE TABLE IF NOT EXISTS "public"."proposal_assignments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "expert_id" "uuid",
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "submitted_to_expert_at" timestamp with time zone,
    "expert_response_at" timestamp with time zone,
    "expert_status" "text" DEFAULT 'assigned'::"text",
    "notes" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "proposal_assignments_expert_status_check" CHECK (("expert_status" = ANY (ARRAY['assigned'::"text", 'contacted'::"text", 'in_progress'::"text", 'completed'::"text", 'declined'::"text"]))),
    CONSTRAINT "proposal_assignments_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."proposal_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_timeline" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "status_from" "text",
    "status_to" "text" NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."proposal_timeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_focuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "area_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_focuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_research_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "focus_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "default_roles" "jsonb" NOT NULL,
    "default_steps" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "focus" "text",
    "category" "text",
    "area" "text",
    "research_activity" "text",
    "subcomponent" "text",
    "phase" "text",
    "step" "text"
);


ALTER TABLE "public"."rd_research_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_research_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_research_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_subcomponents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "phase" "text" NOT NULL,
    "step" "text",
    "hint" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "general_description" "text",
    "goal" "text",
    "hypothesis" "text",
    "alternatives" "text",
    "uncertainties" "text",
    "developmental_process" "text",
    "primary_goal" "text",
    "expected_outcome_type" "text",
    "cpt_codes" "text",
    "cdt_codes" "text",
    "alternative_paths" "text"
);


ALTER TABLE "public"."rd_subcomponents" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."rd_activity_hierarchy" AS
 SELECT "cat"."name" AS "category",
    "area"."name" AS "area",
    "focus"."name" AS "focus",
    "act"."title" AS "activity_title",
    "sub"."title" AS "subcomponent_title",
    "sub"."phase",
    "sub"."step",
    "sub"."hint",
    "sub"."general_description",
    "sub"."goal",
    "sub"."hypothesis",
    "sub"."alternatives",
    "sub"."uncertainties",
    "sub"."developmental_process",
    "sub"."primary_goal",
    "sub"."expected_outcome_type",
    "sub"."cpt_codes",
    "sub"."cdt_codes",
    "sub"."alternative_paths"
   FROM (((("public"."rd_research_categories" "cat"
     JOIN "public"."rd_areas" "area" ON (("area"."category_id" = "cat"."id")))
     JOIN "public"."rd_focuses" "focus" ON (("focus"."area_id" = "area"."id")))
     JOIN "public"."rd_research_activities" "act" ON (("act"."focus_id" = "focus"."id")))
     JOIN "public"."rd_subcomponents" "sub" ON (("sub"."activity_id" = "act"."id")))
  ORDER BY "cat"."name", "area"."name", "focus"."name", "act"."title", "sub"."step";


ALTER VIEW "public"."rd_activity_hierarchy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_business_years" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "gross_receipts" numeric(15,2) NOT NULL,
    "total_qre" numeric(15,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_business_years" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "ein" "text" NOT NULL,
    "entity_type" "public"."entity_type" NOT NULL,
    "start_year" integer NOT NULL,
    "domicile_state" "text" NOT NULL,
    "contact_info" "jsonb" NOT NULL,
    "is_controlled_grp" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "historical_data" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "check_historical_data_structure" CHECK ("public"."validate_historical_data"("historical_data"))
);


ALTER TABLE "public"."rd_businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_contractor_subcomponents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contractor_id" "uuid" NOT NULL,
    "subcomponent_id" "uuid" NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "time_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "applied_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "is_included" boolean DEFAULT true NOT NULL,
    "baseline_applied_percent" numeric(5,2) DEFAULT 0 NOT NULL,
    "practice_percentage" numeric(5,2),
    "year_percentage" numeric(5,2),
    "frequency_percentage" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "baseline_practice_percentage" numeric,
    "baseline_time_percentage" numeric
);


ALTER TABLE "public"."rd_contractor_subcomponents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_contractor_year_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "cost_amount" numeric(15,2) NOT NULL,
    "applied_percent" numeric(5,2) NOT NULL,
    "activity_link" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contractor_id" "uuid",
    "user_id" "uuid",
    "activity_roles" "jsonb",
    "calculated_qre" numeric
);


ALTER TABLE "public"."rd_contractor_year_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_contractors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text",
    "annual_cost" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "role_id" "uuid",
    "is_owner" boolean DEFAULT false,
    "amount" numeric(15,2),
    "calculated_qre" numeric(15,2)
);


ALTER TABLE "public"."rd_contractors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_employee_subcomponents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "subcomponent_id" "uuid" NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "time_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "applied_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "is_included" boolean DEFAULT true NOT NULL,
    "baseline_applied_percent" numeric(5,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "practice_percentage" numeric,
    "year_percentage" numeric,
    "frequency_percentage" numeric,
    "baseline_practice_percentage" numeric,
    "baseline_time_percentage" numeric,
    "user_id" "uuid"
);


ALTER TABLE "public"."rd_employee_subcomponents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_employee_year_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "applied_percent" numeric(5,2) NOT NULL,
    "calculated_qre" numeric(15,2) NOT NULL,
    "activity_roles" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."rd_employee_year_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "is_owner" boolean DEFAULT false,
    "annual_wage" numeric(15,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_name" "text",
    "user_id" "uuid"
);


ALTER TABLE "public"."rd_employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "research_activity_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "subcomponent_id" "uuid" NOT NULL,
    "employee_id" "uuid",
    "contractor_id" "uuid",
    "supply_id" "uuid",
    "category" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "role_name" "text",
    "supply_name" "text",
    "research_activity_title" "text" NOT NULL,
    "research_activity_practice_percent" numeric(5,2) NOT NULL,
    "step_name" "text" NOT NULL,
    "subcomponent_title" "text" NOT NULL,
    "subcomponent_year_percent" numeric(5,2) NOT NULL,
    "subcomponent_frequency_percent" numeric(5,2) NOT NULL,
    "subcomponent_time_percent" numeric(5,2) NOT NULL,
    "total_cost" numeric(10,2) NOT NULL,
    "applied_percent" numeric(5,2) NOT NULL,
    "baseline_applied_percent" numeric(5,2) NOT NULL,
    "employee_practice_percent" numeric(5,2),
    "employee_time_percent" numeric(5,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rd_expenses_category_check" CHECK (("category" = ANY (ARRAY['Employee'::"text", 'Contractor'::"text", 'Supply'::"text"])))
);


ALTER TABLE "public"."rd_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_federal_credit_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "standard_credit" numeric(15,2),
    "standard_adjusted_credit" numeric(15,2),
    "standard_base_percentage" numeric(5,4),
    "standard_fixed_base_amount" numeric(15,2),
    "standard_incremental_qre" numeric(15,2),
    "standard_is_eligible" boolean DEFAULT false,
    "standard_missing_data" "jsonb",
    "asc_credit" numeric(15,2),
    "asc_adjusted_credit" numeric(15,2),
    "asc_avg_prior_qre" numeric(15,2),
    "asc_incremental_qre" numeric(15,2),
    "asc_is_startup" boolean DEFAULT false,
    "asc_missing_data" "jsonb",
    "selected_method" "text",
    "use_280c" boolean DEFAULT false,
    "corporate_tax_rate" numeric(5,4) DEFAULT 0.21,
    "total_federal_credit" numeric(15,2),
    "total_state_credits" numeric(15,2),
    "total_credits" numeric(15,2),
    "calculation_date" timestamp with time zone DEFAULT "now"(),
    "qre_breakdown" "jsonb",
    "historical_data" "jsonb",
    "state_credits" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rd_federal_credit_results_selected_method_check" CHECK (("selected_method" = ANY (ARRAY['standard'::"text", 'asc'::"text"])))
);


ALTER TABLE "public"."rd_federal_credit_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "business_year_id" "uuid",
    "type" "public"."rd_report_type" NOT NULL,
    "generated_text" "text" NOT NULL,
    "editable_text" "text",
    "ai_version" "text" NOT NULL,
    "locked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_research_raw" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text",
    "area" "text",
    "focus" "text",
    "research_activity" "text",
    "subcomponent" "text",
    "phase" "text",
    "step" "text",
    "hint" "text",
    "general_description" "text",
    "goal" "text",
    "hypothesis" "text",
    "alternatives" "text",
    "uncertainties" "text",
    "developmental_process" "text",
    "primary_goal" "text",
    "expected_outcome_type" "text",
    "cpt_codes" "text",
    "cdt_codes" "text",
    "alternative_paths" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_research_raw" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_research_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "research_activity_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "step_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_research_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_research_subcomponents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "step_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "subcomponent_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "hint" "text",
    "general_description" "text",
    "goal" "text",
    "hypothesis" "text",
    "alternatives" "text",
    "uncertainties" "text",
    "developmental_process" "text",
    "primary_goal" "text",
    "expected_outcome_type" "text",
    "cpt_codes" "text",
    "cdt_codes" "text",
    "alternative_paths" "text"
);


ALTER TABLE "public"."rd_research_subcomponents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "is_default" boolean DEFAULT false,
    "business_year_id" "uuid",
    "baseline_applied_percent" numeric
);


ALTER TABLE "public"."rd_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_selected_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "practice_percent" numeric(5,2) NOT NULL,
    "selected_roles" "jsonb" NOT NULL,
    "config" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "research_guidelines" "jsonb"
);


ALTER TABLE "public"."rd_selected_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_selected_filter" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "selected_categories" "text"[] DEFAULT '{}'::"text"[],
    "selected_areas" "text"[] DEFAULT '{}'::"text"[],
    "selected_focuses" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_selected_filter" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_selected_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "research_activity_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "time_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "applied_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_selected_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_selected_subcomponents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "research_activity_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "subcomponent_id" "uuid" NOT NULL,
    "frequency_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "year_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "start_month" integer DEFAULT 1 NOT NULL,
    "start_year" integer NOT NULL,
    "selected_roles" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "non_rd_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "approval_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "hint" "text",
    "general_description" "text",
    "goal" "text",
    "hypothesis" "text",
    "alternatives" "text",
    "uncertainties" "text",
    "developmental_process" "text",
    "primary_goal" "text",
    "expected_outcome_type" "text",
    "cpt_codes" "text",
    "cdt_codes" "text",
    "alternative_paths" "text",
    "applied_percentage" numeric,
    "time_percentage" numeric,
    "user_notes" "text",
    "step_name" "text",
    "practice_percentage" numeric
);


ALTER TABLE "public"."rd_selected_subcomponents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_state_calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state" character varying(2) NOT NULL,
    "calculation_method" "text" NOT NULL,
    "refundable" "text",
    "carryforward" "text",
    "eligible_entities" "text"[],
    "calculation_formula" "text" NOT NULL,
    "special_notes" "text",
    "start_year" numeric NOT NULL,
    "end_year" numeric,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "formula_correct" "text"
);


ALTER TABLE "public"."rd_state_calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_supplies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "annual_cost" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_supplies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_supply_subcomponents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supply_id" "uuid" NOT NULL,
    "subcomponent_id" "uuid" NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "applied_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "is_included" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "amount_applied" numeric
);


ALTER TABLE "public"."rd_supply_subcomponents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_supply_year_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "cost_amount" numeric(15,2) NOT NULL,
    "applied_percent" numeric(5,2) NOT NULL,
    "activity_link" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "supply_id" "uuid",
    "calculated_qre" numeric(15,2)
);


ALTER TABLE "public"."rd_supply_year_data" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."recent_client_activities" AS
 SELECT "ca"."id",
    "ca"."client_id",
    "ca"."user_id",
    "ca"."activity_type",
    "ca"."title",
    "ca"."description",
    "ca"."priority",
    "ca"."metadata",
    "ca"."is_read",
    "ca"."created_at",
    "ca"."updated_at",
    "c"."full_name" AS "client_name",
    "p"."full_name" AS "user_name"
   FROM (("public"."client_activities" "ca"
     JOIN "public"."clients" "c" ON (("ca"."client_id" = "c"."id")))
     LEFT JOIN "public"."profiles" "p" ON (("ca"."user_id" = "p"."id")))
  WHERE ("ca"."created_at" >= ("now"() - '30 days'::interval))
  ORDER BY "ca"."created_at" DESC;


ALTER VIEW "public"."recent_client_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reinsurance_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "strategy_detail_id" "uuid" NOT NULL,
    "user_contribution" numeric(12,2) DEFAULT 0 NOT NULL,
    "agi_reduction" numeric(12,2) DEFAULT 0 NOT NULL,
    "federal_tax_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "state_tax_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_tax_savings" numeric(12,2) DEFAULT 0 NOT NULL,
    "net_year1_cost" numeric(12,2) DEFAULT 0 NOT NULL,
    "breakeven_years" numeric(5,2) DEFAULT 0 NOT NULL,
    "future_value" numeric(12,2) DEFAULT 0 NOT NULL,
    "capital_gains_tax" numeric(12,2) DEFAULT 0 NOT NULL,
    "setup_admin_cost" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_benefit" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reinsurance_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."research_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "name" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."research_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "client_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "event_data" "jsonb",
    "severity" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "security_events_severity_check" CHECK (("severity" = ANY (ARRAY['LOW'::"text", 'MEDIUM'::"text", 'HIGH'::"text", 'CRITICAL'::"text"])))
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_events" IS 'Audit log for security-related events and access attempts';



CREATE OR REPLACE VIEW "public"."security_policy_audit" AS
 SELECT "schemaname",
    "tablename",
    "policyname",
    "cmd",
        CASE
            WHEN (("qual" ~~ '%true%'::"text") OR ("qual" ~~ '%1=1%'::"text")) THEN 'PERMISSIVE'::"text"
            WHEN ("qual" ~~ '%auth.uid()%'::"text") THEN 'USER_SCOPED'::"text"
            WHEN ("qual" ~~ '%role_type%'::"text") THEN 'ROLE_BASED'::"text"
            ELSE 'CUSTOM'::"text"
        END AS "policy_type",
    "qual" AS "policy_condition"
   FROM "pg_policies"
  WHERE ("schemaname" = 'public'::"name")
  ORDER BY "tablename", "policyname";


ALTER VIEW "public"."security_policy_audit" OWNER TO "postgres";


COMMENT ON VIEW "public"."security_policy_audit" IS 'Audit view for reviewing all RLS policies and their types';



CREATE TABLE IF NOT EXISTS "public"."strategy_commission_rates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "affiliate_id" "uuid",
    "strategy_name" "text" NOT NULL,
    "affiliate_rate" numeric(5,4) NOT NULL,
    "admin_rate" numeric(5,4) NOT NULL,
    "expert_fee_percentage" numeric(5,4),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "rates_sum_check" CHECK ((("affiliate_rate" + "admin_rate") <= 1.0))
);


ALTER TABLE "public"."strategy_commission_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."strategy_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "strategy_id" "text" NOT NULL,
    "strategy_name" "text" NOT NULL,
    "strategy_category" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "estimated_savings" numeric(12,2) DEFAULT 0 NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."strategy_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supply_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "item_name" "text",
    "amount" numeric,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."supply_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "tax_info" "jsonb" NOT NULL,
    "breakdown" "jsonb" NOT NULL,
    "strategies" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tax_calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_estimates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "data" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tax_estimates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "standard_deduction" boolean DEFAULT false,
    "business_owner" boolean DEFAULT false,
    "full_name" "text",
    "email" "text",
    "filing_status" "text",
    "dependents" integer DEFAULT 0,
    "home_address" "text",
    "state" "text",
    "wages_income" numeric DEFAULT 0,
    "passive_income" numeric DEFAULT 0,
    "unearned_income" numeric DEFAULT 0,
    "capital_gains" numeric DEFAULT 0,
    "custom_deduction" numeric DEFAULT 0,
    "charitable_deduction" numeric DEFAULT 0,
    "business_name" "text",
    "entity_type" "text",
    "ordinary_k1_income" numeric DEFAULT 0,
    "guaranteed_k1_income" numeric DEFAULT 0,
    "business_address" "text",
    "deduction_limit_reached" boolean DEFAULT false,
    "household_income" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text"
);


ALTER TABLE "public"."tax_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "tax_info" "jsonb" NOT NULL,
    "proposed_strategies" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_savings" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "uuid",
    "created_by" "uuid",
    CONSTRAINT "tax_proposals_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'proposed'::"text", 'accepted'::"text", 'rejected'::"text", 'implemented'::"text"])))
);


ALTER TABLE "public"."tax_proposals" OWNER TO "postgres";


COMMENT ON TABLE "public"."tax_proposals" IS 'Tax proposals are now associated with clients. Affiliate information is accessed through the client relationship.';



COMMENT ON COLUMN "public"."tax_proposals"."client_id" IS 'References clients.id - get affiliate via clients.affiliate_id';



CREATE OR REPLACE VIEW "public"."tax_proposals_with_client_info" AS
 SELECT "tp"."id",
    "tp"."user_id",
    "tp"."year",
    "tp"."tax_info",
    "tp"."proposed_strategies",
    "tp"."total_savings",
    "tp"."status",
    "tp"."notes",
    "tp"."created_at",
    "tp"."updated_at",
    "tp"."client_id",
    "c"."full_name" AS "client_name",
    "c"."email" AS "client_email",
    "c"."affiliate_id",
    "p"."full_name" AS "affiliate_name",
    "p"."email" AS "affiliate_email"
   FROM (("public"."tax_proposals" "tp"
     JOIN "public"."clients" "c" ON (("tp"."client_id" = "c"."id")))
     LEFT JOIN "public"."profiles" "p" ON (("c"."affiliate_id" = "p"."id")));


ALTER VIEW "public"."tax_proposals_with_client_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tool_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_file_id" "uuid" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "tool_slug" "text" NOT NULL,
    "enrolled_by" "uuid",
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text",
    "notes" "text",
    CONSTRAINT "tool_enrollments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "tool_enrollments_tool_slug_check" CHECK (("tool_slug" = ANY (ARRAY['rd'::"text", 'augusta'::"text", 'hire_children'::"text", 'cost_segregation'::"text", 'convertible_bonds'::"text", 'tax_planning'::"text"])))
);


ALTER TABLE "public"."tool_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tools" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    CONSTRAINT "tools_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'in_development'::"text", 'deprecated'::"text"])))
);


ALTER TABLE "public"."tools" OWNER TO "postgres";


COMMENT ON TABLE "public"."tools" IS 'Defines the suite of tax tools offered by the platform.';



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "tool_id" "uuid" NOT NULL,
    "invoice_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'invoiced'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."transactions" IS 'Logs each billable event when a partner uses a tool for a client.';



CREATE OR REPLACE VIEW "public"."user_access_summary" AS
 SELECT "p"."id" AS "user_id",
    "p"."email",
    "p"."full_name" AS "name",
    "p"."role" AS "role_type",
    "count"("cu"."id") AS "client_count",
    "array_agg"(DISTINCT "cu"."role") AS "client_roles",
    "array_agg"(DISTINCT "c"."full_name") AS "client_names",
    "max"("cu"."created_at") AS "last_client_added"
   FROM (("public"."profiles" "p"
     LEFT JOIN "public"."client_users" "cu" ON ((("p"."id" = "cu"."user_id") AND ("cu"."is_active" = true))))
     LEFT JOIN "public"."clients" "c" ON (("cu"."client_id" = "c"."id")))
  WHERE ("p"."role" = ANY (ARRAY['client'::"text", 'staff'::"text", 'affiliate'::"text"]))
  GROUP BY "p"."id", "p"."email", "p"."full_name", "p"."role"
  ORDER BY "p"."full_name";


ALTER VIEW "public"."user_access_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."user_access_summary" IS 'Summary view showing client access patterns for each user';



CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "theme" "text" DEFAULT 'light'::"text",
    "notifications_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role_type" "public"."role_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."users_with_auth" AS
 SELECT "p"."id",
    "p"."email",
    "p"."full_name",
    "p"."role",
    "p"."is_admin",
    "p"."has_completed_tax_profile",
    "p"."created_at",
    "p"."updated_at",
    "au"."email" AS "auth_email",
    "au"."created_at" AS "auth_created_at",
    "au"."email_confirmed_at",
    "au"."last_sign_in_at"
   FROM ("public"."profiles" "p"
     JOIN "auth"."users" "au" ON (("p"."id" = "au"."id")));


ALTER VIEW "public"."users_with_auth" OWNER TO "postgres";


COMMENT ON VIEW "public"."users_with_auth" IS 'Convenience view that joins profiles with auth.users data when auth info is needed';



ALTER TABLE ONLY "public"."admin_client_files"
    ADD CONSTRAINT "admin_client_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_tool_permissions"
    ADD CONSTRAINT "affiliate_tool_permissions_pkey" PRIMARY KEY ("affiliate_profile_id", "tool_id");



ALTER TABLE ONLY "public"."augusta_rule_details"
    ADD CONSTRAINT "augusta_rule_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_years"
    ADD CONSTRAINT "business_years_business_id_year_key" UNIQUE ("business_id", "year");



ALTER TABLE ONLY "public"."business_years"
    ADD CONSTRAINT "business_years_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calculations"
    ADD CONSTRAINT "calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."centralized_businesses"
    ADD CONSTRAINT "centralized_businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."charitable_donation_details"
    ADD CONSTRAINT "charitable_donation_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_activities"
    ADD CONSTRAINT "client_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_dashboard_metrics"
    ADD CONSTRAINT "client_dashboard_metrics_client_id_metric_type_key" UNIQUE ("client_id", "metric_type");



ALTER TABLE ONLY "public"."client_dashboard_metrics"
    ADD CONSTRAINT "client_dashboard_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_engagement_status"
    ADD CONSTRAINT "client_engagement_status_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."client_engagement_status"
    ADD CONSTRAINT "client_engagement_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_client_id_user_id_key" UNIQUE ("client_id", "user_id");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_transactions"
    ADD CONSTRAINT "commission_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractor_expenses"
    ADD CONSTRAINT "contractor_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."convertible_tax_bonds_details"
    ADD CONSTRAINT "convertible_tax_bonds_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cost_segregation_details"
    ADD CONSTRAINT "cost_segregation_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."experts"
    ADD CONSTRAINT "experts_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."experts"
    ADD CONSTRAINT "experts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_management_company_details"
    ADD CONSTRAINT "family_management_company_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hire_children_details"
    ADD CONSTRAINT "hire_children_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_tool_subscriptions"
    ADD CONSTRAINT "partner_tool_subscriptions_pkey" PRIMARY KEY ("partner_id", "tool_id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."personal_years"
    ADD CONSTRAINT "personal_years_client_id_year_key" UNIQUE ("client_id", "year");



ALTER TABLE ONLY "public"."personal_years"
    ADD CONSTRAINT "personal_years_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_assignments"
    ADD CONSTRAINT "proposal_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_timeline"
    ADD CONSTRAINT "proposal_timeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_areas"
    ADD CONSTRAINT "rd_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_business_years"
    ADD CONSTRAINT "rd_business_years_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_businesses"
    ADD CONSTRAINT "rd_businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_contractor_subcomponents"
    ADD CONSTRAINT "rd_contractor_subcomponents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_contractor_subcomponents"
    ADD CONSTRAINT "rd_contractor_subcomponents_unique" UNIQUE ("contractor_id", "subcomponent_id", "business_year_id");



ALTER TABLE ONLY "public"."rd_contractor_year_data"
    ADD CONSTRAINT "rd_contractor_year_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_contractors"
    ADD CONSTRAINT "rd_contractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_employee_subcomponents"
    ADD CONSTRAINT "rd_employee_subcomponents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_employee_subcomponents"
    ADD CONSTRAINT "rd_employee_subcomponents_unique" UNIQUE ("employee_id", "subcomponent_id", "business_year_id");



ALTER TABLE ONLY "public"."rd_employee_year_data"
    ADD CONSTRAINT "rd_employee_year_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_employees"
    ADD CONSTRAINT "rd_employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_expenses"
    ADD CONSTRAINT "rd_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_federal_credit_results"
    ADD CONSTRAINT "rd_federal_credit_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_federal_credit_results"
    ADD CONSTRAINT "rd_federal_credit_results_unique" UNIQUE ("business_year_id");



ALTER TABLE ONLY "public"."rd_focuses"
    ADD CONSTRAINT "rd_focuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_reports"
    ADD CONSTRAINT "rd_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_research_activities"
    ADD CONSTRAINT "rd_research_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_research_categories"
    ADD CONSTRAINT "rd_research_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."rd_research_categories"
    ADD CONSTRAINT "rd_research_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_research_raw"
    ADD CONSTRAINT "rd_research_raw_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_research_steps"
    ADD CONSTRAINT "rd_research_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_research_subcomponents"
    ADD CONSTRAINT "rd_research_subcomponents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_roles"
    ADD CONSTRAINT "rd_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_selected_activities"
    ADD CONSTRAINT "rd_selected_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_selected_filter"
    ADD CONSTRAINT "rd_selected_filter_business_year_id_key" UNIQUE ("business_year_id");



ALTER TABLE ONLY "public"."rd_selected_filter"
    ADD CONSTRAINT "rd_selected_filter_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_selected_steps"
    ADD CONSTRAINT "rd_selected_steps_business_year_id_step_id_key" UNIQUE ("business_year_id", "step_id");



ALTER TABLE ONLY "public"."rd_selected_steps"
    ADD CONSTRAINT "rd_selected_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_selected_subcomponents"
    ADD CONSTRAINT "rd_selected_subcomponents_business_year_id_subcomponent_id_key" UNIQUE ("business_year_id", "subcomponent_id");



ALTER TABLE ONLY "public"."rd_selected_subcomponents"
    ADD CONSTRAINT "rd_selected_subcomponents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_state_calculations"
    ADD CONSTRAINT "rd_state_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_subcomponents"
    ADD CONSTRAINT "rd_subcomponents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_supplies"
    ADD CONSTRAINT "rd_supplies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_supply_subcomponents"
    ADD CONSTRAINT "rd_supply_subcomponents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_supply_subcomponents"
    ADD CONSTRAINT "rd_supply_subcomponents_unique" UNIQUE ("supply_id", "subcomponent_id", "business_year_id");



ALTER TABLE ONLY "public"."rd_supply_year_data"
    ADD CONSTRAINT "rd_supply_year_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reinsurance_details"
    ADD CONSTRAINT "reinsurance_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."research_activities"
    ADD CONSTRAINT "research_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."strategy_commission_rates"
    ADD CONSTRAINT "strategy_commission_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."strategy_details"
    ADD CONSTRAINT "strategy_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."strategy_details"
    ADD CONSTRAINT "strategy_details_proposal_id_strategy_id_key" UNIQUE ("proposal_id", "strategy_id");



ALTER TABLE ONLY "public"."supply_expenses"
    ADD CONSTRAINT "supply_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "tax_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_estimates"
    ADD CONSTRAINT "tax_estimates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_profiles"
    ADD CONSTRAINT "tax_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."tax_proposals"
    ADD CONSTRAINT "tax_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tool_enrollments"
    ADD CONSTRAINT "tool_enrollments_client_file_id_business_id_tool_slug_key" UNIQUE ("client_file_id", "business_id", "tool_slug");



ALTER TABLE ONLY "public"."tool_enrollments"
    ADD CONSTRAINT "tool_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tools"
    ADD CONSTRAINT "tools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tools"
    ADD CONSTRAINT "tools_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_research_activities"
    ADD CONSTRAINT "unique_activity_per_focus" UNIQUE ("title", "focus_id");



ALTER TABLE ONLY "public"."rd_areas"
    ADD CONSTRAINT "unique_area_name_per_category" UNIQUE ("name", "category_id");



ALTER TABLE ONLY "public"."rd_research_categories"
    ADD CONSTRAINT "unique_category_name" UNIQUE ("name");



ALTER TABLE ONLY "public"."rd_focuses"
    ADD CONSTRAINT "unique_focus_name_per_area" UNIQUE ("name", "area_id");



ALTER TABLE ONLY "public"."tax_profiles"
    ADD CONSTRAINT "unique_user_id" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_client_files_admin_id" ON "public"."admin_client_files" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_client_files_affiliate_id" ON "public"."admin_client_files" USING "btree" ("affiliate_id");



CREATE INDEX "idx_admin_client_files_archived" ON "public"."admin_client_files" USING "btree" ("archived");



CREATE INDEX "idx_admin_client_files_business_id" ON "public"."admin_client_files" USING "btree" ("business_id");



CREATE INDEX "idx_admin_client_files_created_at" ON "public"."admin_client_files" USING "btree" ("created_at");



CREATE INDEX "idx_admin_client_files_email" ON "public"."admin_client_files" USING "btree" ("email");



CREATE INDEX "idx_augusta_rule_details_strategy_detail_id" ON "public"."augusta_rule_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_business_years_business_id" ON "public"."business_years" USING "btree" ("business_id");



CREATE INDEX "idx_business_years_year" ON "public"."business_years" USING "btree" ("year");



CREATE INDEX "idx_businesses_client_id" ON "public"."businesses" USING "btree" ("client_id");



CREATE INDEX "idx_businesses_entity_type" ON "public"."businesses" USING "btree" ("entity_type");



CREATE INDEX "idx_businesses_is_active" ON "public"."businesses" USING "btree" ("is_active");



CREATE INDEX "idx_calculations_user_id_profiles" ON "public"."calculations" USING "btree" ("user_id");



CREATE INDEX "idx_centralized_businesses_created_at" ON "public"."centralized_businesses" USING "btree" ("created_at");



CREATE INDEX "idx_charitable_donation_details_strategy_detail_id" ON "public"."charitable_donation_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_client_activities_client_id" ON "public"."client_activities" USING "btree" ("client_id");



CREATE INDEX "idx_client_activities_created" ON "public"."client_activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_client_activities_priority" ON "public"."client_activities" USING "btree" ("priority");



CREATE INDEX "idx_client_activities_type" ON "public"."client_activities" USING "btree" ("activity_type");



CREATE INDEX "idx_client_activities_unread" ON "public"."client_activities" USING "btree" ("is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_client_activities_user_id" ON "public"."client_activities" USING "btree" ("user_id");



CREATE INDEX "idx_client_dashboard_metrics_client" ON "public"."client_dashboard_metrics" USING "btree" ("client_id");



CREATE INDEX "idx_client_dashboard_metrics_expires" ON "public"."client_dashboard_metrics" USING "btree" ("expires_at");



CREATE INDEX "idx_client_dashboard_metrics_type" ON "public"."client_dashboard_metrics" USING "btree" ("metric_type");



CREATE INDEX "idx_client_engagement_last_activity" ON "public"."client_engagement_status" USING "btree" ("last_activity_at" DESC);



CREATE INDEX "idx_client_engagement_pending" ON "public"."client_engagement_status" USING "btree" ("pending_actions") WHERE ("pending_actions" > 0);



CREATE INDEX "idx_client_engagement_status" ON "public"."client_engagement_status" USING "btree" ("status");



CREATE INDEX "idx_client_users_active" ON "public"."client_users" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_client_users_client_id" ON "public"."client_users" USING "btree" ("client_id");



CREATE INDEX "idx_client_users_role" ON "public"."client_users" USING "btree" ("role");



CREATE INDEX "idx_client_users_user_id" ON "public"."client_users" USING "btree" ("user_id");



CREATE INDEX "idx_clients_affiliate_id" ON "public"."clients" USING "btree" ("affiliate_id");



CREATE INDEX "idx_clients_archived" ON "public"."clients" USING "btree" ("archived");



CREATE INDEX "idx_clients_city" ON "public"."clients" USING "btree" ("city");



CREATE INDEX "idx_clients_created_at" ON "public"."clients" USING "btree" ("created_at");



CREATE INDEX "idx_clients_created_by" ON "public"."clients" USING "btree" ("created_by");



CREATE INDEX "idx_clients_email" ON "public"."clients" USING "btree" ("email");



CREATE INDEX "idx_clients_partner_id" ON "public"."clients" USING "btree" ("partner_id");



CREATE INDEX "idx_clients_user_id" ON "public"."clients" USING "btree" ("user_id");



CREATE INDEX "idx_clients_zip_code" ON "public"."clients" USING "btree" ("zip_code");



CREATE INDEX "idx_commission_transactions_proposal_id" ON "public"."commission_transactions" USING "btree" ("proposal_id");



CREATE INDEX "idx_convertible_tax_bonds_details_strategy_detail_id" ON "public"."convertible_tax_bonds_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_cost_segregation_details_strategy_detail_id" ON "public"."cost_segregation_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_family_management_company_details_strategy_detail_id" ON "public"."family_management_company_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_hire_children_details_strategy_detail_id" ON "public"."hire_children_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_invitations_client_id" ON "public"."invitations" USING "btree" ("client_id");



CREATE INDEX "idx_invitations_email" ON "public"."invitations" USING "btree" ("email");



CREATE INDEX "idx_invitations_expires_at" ON "public"."invitations" USING "btree" ("expires_at");



CREATE INDEX "idx_invitations_invited_by" ON "public"."invitations" USING "btree" ("invited_by");



CREATE INDEX "idx_invitations_status" ON "public"."invitations" USING "btree" ("status");



CREATE INDEX "idx_invitations_token" ON "public"."invitations" USING "btree" ("token");



CREATE UNIQUE INDEX "idx_invitations_unique_pending" ON "public"."invitations" USING "btree" ("client_id", "email") WHERE (("status")::"text" = 'pending'::"text");



CREATE INDEX "idx_invoices_partner_id" ON "public"."invoices" USING "btree" ("partner_id");



CREATE INDEX "idx_partners_stripe_customer_id" ON "public"."partners" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_personal_years_client_id" ON "public"."personal_years" USING "btree" ("client_id");



CREATE INDEX "idx_personal_years_year" ON "public"."personal_years" USING "btree" ("year");



CREATE INDEX "idx_profiles_partner_id" ON "public"."profiles" USING "btree" ("partner_id");



CREATE INDEX "idx_proposal_assignments_proposal_id" ON "public"."proposal_assignments" USING "btree" ("proposal_id");



CREATE INDEX "idx_proposal_timeline_proposal_id" ON "public"."proposal_timeline" USING "btree" ("proposal_id");



CREATE INDEX "idx_rd_business_years_business_year" ON "public"."rd_business_years" USING "btree" ("business_id", "year");



CREATE INDEX "idx_rd_businesses_historical_data" ON "public"."rd_businesses" USING "gin" ("historical_data");



CREATE INDEX "idx_rd_contractor_subcomponents_business_year_id" ON "public"."rd_contractor_subcomponents" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_contractor_subcomponents_contractor_id" ON "public"."rd_contractor_subcomponents" USING "btree" ("contractor_id");



CREATE INDEX "idx_rd_contractor_subcomponents_subcomponent_id" ON "public"."rd_contractor_subcomponents" USING "btree" ("subcomponent_id");



CREATE INDEX "idx_rd_contractor_subcomponents_user_id" ON "public"."rd_contractor_subcomponents" USING "btree" ("user_id");



CREATE INDEX "idx_rd_contractor_year_data_business_year_id" ON "public"."rd_contractor_year_data" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_contractor_year_data_contractor_id" ON "public"."rd_contractor_year_data" USING "btree" ("contractor_id");



CREATE INDEX "idx_rd_contractor_year_data_user_id" ON "public"."rd_contractor_year_data" USING "btree" ("user_id");



CREATE INDEX "idx_rd_contractors_business_id" ON "public"."rd_contractors" USING "btree" ("business_id");



CREATE INDEX "idx_rd_contractors_role_id" ON "public"."rd_contractors" USING "btree" ("role_id");



CREATE INDEX "idx_rd_contractors_user_id" ON "public"."rd_contractors" USING "btree" ("user_id");



CREATE INDEX "idx_rd_employee_subcomponents_employee_id" ON "public"."rd_employee_subcomponents" USING "btree" ("employee_id");



CREATE INDEX "idx_rd_employee_subcomponents_subcomponent_id" ON "public"."rd_employee_subcomponents" USING "btree" ("subcomponent_id");



CREATE INDEX "idx_rd_employee_subcomponents_user_id" ON "public"."rd_employee_subcomponents" USING "btree" ("user_id");



CREATE INDEX "idx_rd_employee_year_data_employee_year" ON "public"."rd_employee_year_data" USING "btree" ("employee_id", "business_year_id");



CREATE INDEX "idx_rd_employee_year_data_user_id" ON "public"."rd_employee_year_data" USING "btree" ("user_id");



CREATE INDEX "idx_rd_employees_user_id" ON "public"."rd_employees" USING "btree" ("user_id");



CREATE INDEX "idx_rd_expenses_business_year_id" ON "public"."rd_expenses" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_expenses_category" ON "public"."rd_expenses" USING "btree" ("category");



CREATE INDEX "idx_rd_expenses_employee_id" ON "public"."rd_expenses" USING "btree" ("employee_id");



CREATE INDEX "idx_rd_federal_credit_results_business_year_id" ON "public"."rd_federal_credit_results" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_federal_credit_results_calculation_date" ON "public"."rd_federal_credit_results" USING "btree" ("calculation_date");



CREATE INDEX "idx_rd_reports_business_year_type" ON "public"."rd_reports" USING "btree" ("business_year_id", "type");



CREATE INDEX "idx_rd_research_steps_activity_id" ON "public"."rd_research_steps" USING "btree" ("research_activity_id");



CREATE INDEX "idx_rd_research_subcomponents_step_id" ON "public"."rd_research_subcomponents" USING "btree" ("step_id");



CREATE INDEX "idx_rd_roles_business_year_id" ON "public"."rd_roles" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_roles_is_default" ON "public"."rd_roles" USING "btree" ("is_default");



CREATE UNIQUE INDEX "idx_rd_roles_unique_default_per_year" ON "public"."rd_roles" USING "btree" ("business_year_id", "is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_rd_selected_activities_business_year_activity" ON "public"."rd_selected_activities" USING "btree" ("business_year_id", "activity_id");



CREATE INDEX "idx_rd_selected_steps_activity" ON "public"."rd_selected_steps" USING "btree" ("research_activity_id");



CREATE INDEX "idx_rd_selected_steps_business_year" ON "public"."rd_selected_steps" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_selected_subcomponents_activity" ON "public"."rd_selected_subcomponents" USING "btree" ("research_activity_id");



CREATE INDEX "idx_rd_selected_subcomponents_business_year" ON "public"."rd_selected_subcomponents" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_selected_subcomponents_step" ON "public"."rd_selected_subcomponents" USING "btree" ("step_id");



CREATE INDEX "idx_rd_supplies_business_id" ON "public"."rd_supplies" USING "btree" ("business_id");



CREATE INDEX "idx_rd_supply_subcomponents_business_year_id" ON "public"."rd_supply_subcomponents" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_supply_subcomponents_subcomponent_id" ON "public"."rd_supply_subcomponents" USING "btree" ("subcomponent_id");



CREATE INDEX "idx_rd_supply_subcomponents_supply_id" ON "public"."rd_supply_subcomponents" USING "btree" ("supply_id");



CREATE INDEX "idx_reinsurance_details_strategy_detail_id" ON "public"."reinsurance_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_security_events_client_id" ON "public"."security_events" USING "btree" ("client_id");



CREATE INDEX "idx_security_events_created_at" ON "public"."security_events" USING "btree" ("created_at");



CREATE INDEX "idx_security_events_severity" ON "public"."security_events" USING "btree" ("severity");



CREATE INDEX "idx_security_events_type" ON "public"."security_events" USING "btree" ("event_type");



CREATE INDEX "idx_security_events_user_id" ON "public"."security_events" USING "btree" ("user_id");



CREATE INDEX "idx_state_calculations_active" ON "public"."rd_state_calculations" USING "btree" ("is_active");



CREATE INDEX "idx_state_calculations_state" ON "public"."rd_state_calculations" USING "btree" ("state");



CREATE UNIQUE INDEX "idx_state_calculations_unique" ON "public"."rd_state_calculations" USING "btree" ("state", "start_year") WHERE ("is_active" = true);



CREATE INDEX "idx_state_calculations_year" ON "public"."rd_state_calculations" USING "btree" ("start_year", "end_year");



CREATE INDEX "idx_strategy_details_proposal_id" ON "public"."strategy_details" USING "btree" ("proposal_id");



CREATE INDEX "idx_strategy_details_strategy_id" ON "public"."strategy_details" USING "btree" ("strategy_id");



CREATE INDEX "idx_tax_calculations_user_id_profiles" ON "public"."tax_calculations" USING "btree" ("user_id");



CREATE INDEX "idx_tax_estimates_user_id_profiles" ON "public"."tax_estimates" USING "btree" ("user_id");



CREATE INDEX "idx_tax_proposals_client_id" ON "public"."tax_proposals" USING "btree" ("client_id");



CREATE INDEX "idx_tax_proposals_created_by" ON "public"."tax_proposals" USING "btree" ("created_by");



CREATE INDEX "idx_tax_proposals_status" ON "public"."tax_proposals" USING "btree" ("status");



CREATE INDEX "idx_tax_proposals_user_id" ON "public"."tax_proposals" USING "btree" ("user_id");



CREATE INDEX "idx_tax_proposals_user_id_profiles" ON "public"."tax_proposals" USING "btree" ("user_id");



CREATE INDEX "idx_tool_enrollments_business_id" ON "public"."tool_enrollments" USING "btree" ("business_id");



CREATE INDEX "idx_tool_enrollments_client_file_id" ON "public"."tool_enrollments" USING "btree" ("client_file_id");



CREATE INDEX "idx_tool_enrollments_status" ON "public"."tool_enrollments" USING "btree" ("status");



CREATE INDEX "idx_tool_enrollments_tool_slug" ON "public"."tool_enrollments" USING "btree" ("tool_slug");



CREATE INDEX "idx_transactions_partner_id" ON "public"."transactions" USING "btree" ("partner_id");



CREATE INDEX "leads_user_id_idx" ON "public"."leads" USING "btree" ("user_id");



CREATE INDEX "profiles_created_at_idx" ON "public"."profiles" USING "btree" ("created_at");



CREATE INDEX "profiles_email_idx" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "profiles_updated_at_idx" ON "public"."profiles" USING "btree" ("updated_at");



CREATE INDEX "tax_calculations_user_id_idx" ON "public"."tax_calculations" USING "btree" ("user_id");



CREATE INDEX "tax_calculations_year_idx" ON "public"."tax_calculations" USING "btree" ("year");



CREATE INDEX "tax_profiles_user_id_idx" ON "public"."tax_profiles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "unique_tax_estimate_per_user" ON "public"."tax_estimates" USING "btree" ("user_id");



CREATE INDEX "user_preferences_user_id_idx" ON "public"."user_preferences" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "handle_rd_contractor_subcomponents_updated_at" BEFORE UPDATE ON "public"."rd_contractor_subcomponents" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_rd_contractor_year_data_updated_at" BEFORE UPDATE ON "public"."rd_contractor_year_data" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_rd_federal_credit_results_updated_at" BEFORE UPDATE ON "public"."rd_federal_credit_results" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_rd_supply_subcomponents_updated_at" BEFORE UPDATE ON "public"."rd_supply_subcomponents" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_rd_supply_year_data_updated_at" BEFORE UPDATE ON "public"."rd_supply_year_data" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_rd_supplies" BEFORE UPDATE ON "public"."rd_supplies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_rd_supply_subcomponents" BEFORE UPDATE ON "public"."rd_supply_subcomponents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_rd_supply_year_data" BEFORE UPDATE ON "public"."rd_supply_year_data" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_client_users_updated_at" BEFORE UPDATE ON "public"."client_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_client_users_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_create_strategy_details" AFTER INSERT ON "public"."tax_proposals" FOR EACH ROW EXECUTE FUNCTION "public"."create_strategy_details_for_proposal"();



CREATE OR REPLACE TRIGGER "trigger_ensure_client_has_owner_delete" BEFORE DELETE ON "public"."client_users" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_client_has_owner"();



CREATE OR REPLACE TRIGGER "trigger_ensure_client_has_owner_update" BEFORE UPDATE ON "public"."client_users" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_client_has_owner"();



CREATE OR REPLACE TRIGGER "trigger_invitations_updated_at" BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_invitations_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_set_invitation_token" BEFORE INSERT ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."set_invitation_token"();



CREATE OR REPLACE TRIGGER "update_client_activities_updated_at" BEFORE UPDATE ON "public"."client_activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_dashboard_metrics_updated_at" BEFORE UPDATE ON "public"."client_dashboard_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_engagement_status_updated_at" BEFORE UPDATE ON "public"."client_engagement_status" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rd_state_calculations_updated_at" BEFORE UPDATE ON "public"."rd_state_calculations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_client_files"
    ADD CONSTRAINT "admin_client_files_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admin_client_files"
    ADD CONSTRAINT "admin_client_files_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admin_client_files"
    ADD CONSTRAINT "admin_client_files_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."affiliate_tool_permissions"
    ADD CONSTRAINT "affiliate_tool_permissions_affiliate_profile_id_fkey" FOREIGN KEY ("affiliate_profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_tool_permissions"
    ADD CONSTRAINT "affiliate_tool_permissions_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."augusta_rule_details"
    ADD CONSTRAINT "augusta_rule_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_years"
    ADD CONSTRAINT "business_years_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calculations"
    ADD CONSTRAINT "calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."charitable_donation_details"
    ADD CONSTRAINT "charitable_donation_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_activities"
    ADD CONSTRAINT "client_activities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_activities"
    ADD CONSTRAINT "client_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client_dashboard_metrics"
    ADD CONSTRAINT "client_dashboard_metrics_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_engagement_status"
    ADD CONSTRAINT "client_engagement_status_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."commission_transactions"
    ADD CONSTRAINT "commission_transactions_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commission_transactions"
    ADD CONSTRAINT "commission_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."commission_transactions"
    ADD CONSTRAINT "commission_transactions_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commission_transactions"
    ADD CONSTRAINT "commission_transactions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."tax_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."convertible_tax_bonds_details"
    ADD CONSTRAINT "convertible_tax_bonds_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cost_segregation_details"
    ADD CONSTRAINT "cost_segregation_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_management_company_details"
    ADD CONSTRAINT "family_management_company_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hire_children_details"
    ADD CONSTRAINT "hire_children_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_tool_subscriptions"
    ADD CONSTRAINT "partner_tool_subscriptions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_tool_subscriptions"
    ADD CONSTRAINT "partner_tool_subscriptions_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_years"
    ADD CONSTRAINT "personal_years_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."proposal_assignments"
    ADD CONSTRAINT "proposal_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."proposal_assignments"
    ADD CONSTRAINT "proposal_assignments_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_assignments"
    ADD CONSTRAINT "proposal_assignments_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."tax_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_timeline"
    ADD CONSTRAINT "proposal_timeline_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."proposal_timeline"
    ADD CONSTRAINT "proposal_timeline_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."tax_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_areas"
    ADD CONSTRAINT "rd_areas_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."rd_research_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_business_years"
    ADD CONSTRAINT "rd_business_years_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_businesses"
    ADD CONSTRAINT "rd_businesses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_contractor_subcomponents"
    ADD CONSTRAINT "rd_contractor_subcomponents_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_contractor_subcomponents"
    ADD CONSTRAINT "rd_contractor_subcomponents_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."rd_contractors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_contractor_subcomponents"
    ADD CONSTRAINT "rd_contractor_subcomponents_subcomponent_id_fkey" FOREIGN KEY ("subcomponent_id") REFERENCES "public"."rd_research_subcomponents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_contractor_year_data"
    ADD CONSTRAINT "rd_contractor_year_data_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_contractor_year_data"
    ADD CONSTRAINT "rd_contractor_year_data_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."rd_contractors"("id");



ALTER TABLE ONLY "public"."rd_contractors"
    ADD CONSTRAINT "rd_contractors_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_contractors"
    ADD CONSTRAINT "rd_contractors_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rd_roles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_contractors"
    ADD CONSTRAINT "rd_contractors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rd_employee_subcomponents"
    ADD CONSTRAINT "rd_employee_subcomponents_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_employee_subcomponents"
    ADD CONSTRAINT "rd_employee_subcomponents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."rd_employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_employee_subcomponents"
    ADD CONSTRAINT "rd_employee_subcomponents_subcomponent_id_fkey" FOREIGN KEY ("subcomponent_id") REFERENCES "public"."rd_research_subcomponents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_employee_year_data"
    ADD CONSTRAINT "rd_employee_year_data_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_employee_year_data"
    ADD CONSTRAINT "rd_employee_year_data_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."rd_employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_employees"
    ADD CONSTRAINT "rd_employees_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_employees"
    ADD CONSTRAINT "rd_employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rd_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_employees"
    ADD CONSTRAINT "rd_employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rd_expenses"
    ADD CONSTRAINT "rd_expenses_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_expenses"
    ADD CONSTRAINT "rd_expenses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."rd_employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_expenses"
    ADD CONSTRAINT "rd_expenses_research_activity_id_fkey" FOREIGN KEY ("research_activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_expenses"
    ADD CONSTRAINT "rd_expenses_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."rd_research_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_expenses"
    ADD CONSTRAINT "rd_expenses_subcomponent_id_fkey" FOREIGN KEY ("subcomponent_id") REFERENCES "public"."rd_research_subcomponents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_federal_credit_results"
    ADD CONSTRAINT "rd_federal_credit_results_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_focuses"
    ADD CONSTRAINT "rd_focuses_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."rd_areas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_reports"
    ADD CONSTRAINT "rd_reports_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_reports"
    ADD CONSTRAINT "rd_reports_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_research_activities"
    ADD CONSTRAINT "rd_research_activities_focus_id_fkey" FOREIGN KEY ("focus_id") REFERENCES "public"."rd_focuses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_research_steps"
    ADD CONSTRAINT "rd_research_steps_research_activity_id_fkey" FOREIGN KEY ("research_activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_research_subcomponents"
    ADD CONSTRAINT "rd_research_subcomponents_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."rd_research_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_roles"
    ADD CONSTRAINT "rd_roles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_roles"
    ADD CONSTRAINT "rd_roles_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_roles"
    ADD CONSTRAINT "rd_roles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."rd_roles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_selected_activities"
    ADD CONSTRAINT "rd_selected_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_selected_activities"
    ADD CONSTRAINT "rd_selected_activities_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_selected_filter"
    ADD CONSTRAINT "rd_selected_filter_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_selected_steps"
    ADD CONSTRAINT "rd_selected_steps_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_selected_steps"
    ADD CONSTRAINT "rd_selected_steps_research_activity_id_fkey" FOREIGN KEY ("research_activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_selected_steps"
    ADD CONSTRAINT "rd_selected_steps_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."rd_research_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_selected_subcomponents"
    ADD CONSTRAINT "rd_selected_subcomponents_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_selected_subcomponents"
    ADD CONSTRAINT "rd_selected_subcomponents_research_activity_id_fkey" FOREIGN KEY ("research_activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_selected_subcomponents"
    ADD CONSTRAINT "rd_selected_subcomponents_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."rd_research_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_selected_subcomponents"
    ADD CONSTRAINT "rd_selected_subcomponents_subcomponent_id_fkey" FOREIGN KEY ("subcomponent_id") REFERENCES "public"."rd_research_subcomponents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_subcomponents"
    ADD CONSTRAINT "rd_subcomponents_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supplies"
    ADD CONSTRAINT "rd_supplies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supply_subcomponents"
    ADD CONSTRAINT "rd_supply_subcomponents_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supply_subcomponents"
    ADD CONSTRAINT "rd_supply_subcomponents_subcomponent_id_fkey" FOREIGN KEY ("subcomponent_id") REFERENCES "public"."rd_research_subcomponents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supply_subcomponents"
    ADD CONSTRAINT "rd_supply_subcomponents_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "public"."rd_supplies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supply_year_data"
    ADD CONSTRAINT "rd_supply_year_data_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supply_year_data"
    ADD CONSTRAINT "rd_supply_year_data_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "public"."rd_supplies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reinsurance_details"
    ADD CONSTRAINT "reinsurance_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."strategy_commission_rates"
    ADD CONSTRAINT "strategy_commission_rates_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."strategy_details"
    ADD CONSTRAINT "strategy_details_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."tax_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "tax_calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_estimates"
    ADD CONSTRAINT "tax_estimates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_profiles"
    ADD CONSTRAINT "tax_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_proposals"
    ADD CONSTRAINT "tax_proposals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_proposals"
    ADD CONSTRAINT "tax_proposals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tax_proposals"
    ADD CONSTRAINT "tax_proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_enrollments"
    ADD CONSTRAINT "tool_enrollments_client_file_id_fkey" FOREIGN KEY ("client_file_id") REFERENCES "public"."admin_client_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_enrollments"
    ADD CONSTRAINT "tool_enrollments_enrolled_by_fkey" FOREIGN KEY ("enrolled_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can access all business data" ON "public"."businesses" USING ("public"."is_admin"());



CREATE POLICY "Admins can access all business_years data" ON "public"."business_years" USING ("public"."is_admin"());



CREATE POLICY "Admins can access all clients" ON "public"."clients" USING ("public"."is_admin"());



CREATE POLICY "Admins can access all personal_years data" ON "public"."personal_years" USING ("public"."is_admin"());



CREATE POLICY "Admins can access all proposals" ON "public"."tax_proposals" USING ("public"."is_admin"());



CREATE POLICY "Admins can insert strategy details" ON "public"."strategy_details" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can insert tax profiles" ON "public"."tax_profiles" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert tax proposals" ON "public"."tax_proposals" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage all client files" ON "public"."admin_client_files" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all client users" ON "public"."client_users" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all tool enrollments" ON "public"."tool_enrollments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update strategy details" ON "public"."strategy_details" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can update tax proposals" ON "public"."tax_proposals" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view all client files" ON "public"."admin_client_files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all leads" ON "public"."leads" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all strategy details" ON "public"."strategy_details" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view all tax profiles" ON "public"."tax_profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all tax proposals" ON "public"."tax_proposals" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view all tool enrollments" ON "public"."tool_enrollments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all user preferences" ON "public"."user_preferences" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view security events" ON "public"."security_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role_type" = 'ADMIN'::"public"."role_type")))));



CREATE POLICY "Affiliates can access their clients' business data" ON "public"."businesses" USING ("public"."is_affiliated_with_client"("client_id"));



CREATE POLICY "Affiliates can access their clients' business_years data" ON "public"."business_years" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "business_years"."business_id") AND "public"."is_affiliated_with_client"("businesses"."client_id")))));



CREATE POLICY "Affiliates can access their clients' personal_years data" ON "public"."personal_years" USING ("public"."is_affiliated_with_client"("client_id"));



CREATE POLICY "Affiliates can access their own clients" ON "public"."clients" USING ("public"."is_affiliated_with_client"("id"));



CREATE POLICY "Affiliates can access their own proposals" ON "public"."tax_proposals" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Allow all delete for dev" ON "public"."tax_proposals" FOR DELETE USING (true);



CREATE POLICY "Allow all for authenticated" ON "public"."rd_selected_filter" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow all for dev" ON "public"."rd_contractor_year_data" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all insert for dev" ON "public"."tax_proposals" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow all select" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Allow all select for debug" ON "public"."tax_proposals" FOR SELECT USING (true);



CREATE POLICY "Allow all select for dev" ON "public"."tax_proposals" FOR SELECT USING (true);



CREATE POLICY "Allow all update for dev" ON "public"."tax_proposals" FOR UPDATE USING (true);



CREATE POLICY "Allow read access to rd_research_steps" ON "public"."rd_research_steps" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access to rd_research_subcomponents" ON "public"."rd_research_subcomponents" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Anyone can view invitations by token" ON "public"."invitations" FOR SELECT USING (("token" IS NOT NULL));



CREATE POLICY "Client owners can create invitations" ON "public"."invitations" FOR INSERT WITH CHECK (("public"."user_has_direct_client_access"("auth"."uid"(), "client_id") OR "public"."user_is_client_owner"("auth"."uid"(), "client_id")));



CREATE POLICY "Client owners can delete invitations" ON "public"."invitations" FOR DELETE USING (("public"."user_has_direct_client_access"("auth"."uid"(), "client_id") OR "public"."user_is_client_owner"("auth"."uid"(), "client_id")));



CREATE POLICY "Client owners can manage client users" ON "public"."client_users" USING ("public"."user_has_direct_client_access"("auth"."uid"(), "client_id"));



CREATE POLICY "Client owners can update activities" ON "public"."client_activities" FOR UPDATE USING ("public"."user_has_client_role"("auth"."uid"(), "client_id", 'owner'::"public"."client_role"));



CREATE POLICY "Client owners can update engagement status" ON "public"."client_engagement_status" FOR UPDATE USING ("public"."user_has_client_role"("auth"."uid"(), "client_id", 'owner'::"public"."client_role"));



CREATE POLICY "Client owners can update invitations" ON "public"."invitations" FOR UPDATE USING (("public"."user_has_direct_client_access"("auth"."uid"(), "client_id") OR "public"."user_is_client_owner"("auth"."uid"(), "client_id")));



CREATE POLICY "Client users can insert tax proposals" ON "public"."tax_proposals" FOR INSERT WITH CHECK ("public"."user_has_client_access"("auth"."uid"(), "client_id"));



CREATE POLICY "Client users can insert their activities" ON "public"."client_activities" FOR INSERT WITH CHECK ("public"."user_has_client_access"("auth"."uid"(), "client_id"));



CREATE POLICY "Client users can manage research activities" ON "public"."research_activities" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role_type" = 'ADMIN'::"public"."role_type")))) OR "public"."user_has_client_role"("auth"."uid"(), "business_id", 'member'::"public"."client_role")));



CREATE POLICY "Client users can manage tax calculations" ON "public"."tax_calculations" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role_type" = 'ADMIN'::"public"."role_type")))) OR ("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."client_users" "cu"
     JOIN "public"."clients" "c" ON (("cu"."client_id" = "c"."id")))
  WHERE (("cu"."user_id" = "auth"."uid"()) AND ("cu"."is_active" = true) AND ("cu"."role" = ANY (ARRAY['member'::"public"."client_role", 'accountant'::"public"."client_role", 'owner'::"public"."client_role"])) AND ("c"."id" IN ( SELECT "cu2"."client_id"
           FROM "public"."client_users" "cu2"
          WHERE (("cu2"."user_id" = "tax_calculations"."user_id") AND ("cu2"."is_active" = true)))))))));



CREATE POLICY "Client users can update tax proposals" ON "public"."tax_proposals" FOR UPDATE USING ("public"."user_has_client_access"("auth"."uid"(), "client_id"));



CREATE POLICY "Client users can update their clients" ON "public"."clients" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role_type" = 'ADMIN'::"public"."role_type")))) OR ("affiliate_id" = "auth"."uid"()) OR "public"."user_has_client_role"("auth"."uid"(), "id", 'owner'::"public"."client_role")));



CREATE POLICY "Client users can view dashboard metrics" ON "public"."client_dashboard_metrics" FOR SELECT USING ("public"."user_has_client_access"("auth"."uid"(), "client_id"));



CREATE POLICY "Client users can view engagement status" ON "public"."client_engagement_status" FOR SELECT USING ("public"."user_has_client_access"("auth"."uid"(), "client_id"));



CREATE POLICY "Client users can view research activities" ON "public"."research_activities" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role_type" = 'ADMIN'::"public"."role_type")))) OR "public"."user_has_client_access"("auth"."uid"(), "business_id")));



CREATE POLICY "Client users can view tax calculations" ON "public"."tax_calculations" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role_type" = 'ADMIN'::"public"."role_type")))) OR ("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."client_users" "cu"
     JOIN "public"."clients" "c" ON (("cu"."client_id" = "c"."id")))
  WHERE (("cu"."user_id" = "auth"."uid"()) AND ("cu"."is_active" = true) AND ("c"."id" IN ( SELECT "cu2"."client_id"
           FROM "public"."client_users" "cu2"
          WHERE (("cu2"."user_id" = "tax_calculations"."user_id") AND ("cu2"."is_active" = true)))))))));



CREATE POLICY "Client users can view tax proposals" ON "public"."tax_proposals" FOR SELECT USING ("public"."user_has_client_access"("auth"."uid"(), "client_id"));



CREATE POLICY "Client users can view their activities" ON "public"."client_activities" FOR SELECT USING ("public"."user_has_client_access"("auth"."uid"(), "client_id"));



CREATE POLICY "Client users can view their clients" ON "public"."clients" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role_type" = 'ADMIN'::"public"."role_type")))) OR ("affiliate_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"()) OR "public"."user_has_client_access"("auth"."uid"(), "id")));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_contractor_subcomponents" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_contractors" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_employee_subcomponents" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_expenses" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_supplies" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."rd_selected_steps" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_contractor_subcomponents" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_contractors" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_employee_subcomponents" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_expenses" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_supplies" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."rd_selected_steps" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable read access for all users" ON "public"."rd_selected_steps" FOR SELECT USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_contractor_subcomponents" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_contractors" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_employee_subcomponents" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_expenses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_supplies" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_contractor_subcomponents" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_contractors" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_employee_subcomponents" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_expenses" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_supplies" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."rd_selected_steps" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "System can manage dashboard metrics" ON "public"."client_dashboard_metrics" USING (true);



CREATE POLICY "Users can delete business years for their businesses" ON "public"."business_years" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."businesses"
     JOIN "public"."clients" ON (("businesses"."client_id" = "clients"."id")))
  WHERE (("businesses"."id" = "business_years"."business_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete businesses for their clients" ON "public"."businesses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "businesses"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete personal years for their clients" ON "public"."personal_years" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "personal_years"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own businesses" ON "public"."centralized_businesses" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can delete their own calculations" ON "public"."calculations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own clients" ON "public"."clients" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own contractor subcomponents" ON "public"."rd_contractor_subcomponents" FOR DELETE USING (("auth"."uid"() IN ( SELECT "rd_contractor_subcomponents"."user_id"
   FROM "public"."rd_business_years"
  WHERE ("rd_business_years"."id" = "rd_contractor_subcomponents"."business_year_id"))));



CREATE POLICY "Users can delete their own contractor year data" ON "public"."rd_contractor_year_data" FOR DELETE USING (("auth"."uid"() IN ( SELECT "rd_contractor_year_data"."user_id"
   FROM "public"."rd_business_years"
  WHERE ("rd_business_years"."id" = "rd_contractor_year_data"."business_year_id"))));



CREATE POLICY "Users can delete their own federal credit results" ON "public"."rd_federal_credit_results" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can delete their own supplies" ON "public"."rd_supplies" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("rd_supplies"."business_id" = "businesses"."id") AND ("businesses"."client_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own supply subcomponents" ON "public"."rd_supply_subcomponents" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."rd_supplies"
     JOIN "public"."businesses" ON (("rd_supplies"."business_id" = "businesses"."id")))
  WHERE (("rd_supply_subcomponents"."supply_id" = "rd_supplies"."id") AND ("businesses"."client_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own supply year data" ON "public"."rd_supply_year_data" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."rd_business_years"
  WHERE (("rd_business_years"."id" = "rd_supply_year_data"."business_year_id") AND ("rd_business_years"."business_id" IN ( SELECT "rd_business_years"."business_id"
           FROM "public"."rd_businesses"
          WHERE ("rd_businesses"."client_id" IN ( SELECT "clients"."id"
                   FROM "public"."clients"
                  WHERE ("rd_businesses"."client_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can delete their own tax profile" ON "public"."tax_profiles" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert business years for their businesses" ON "public"."business_years" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."businesses"
     JOIN "public"."clients" ON (("businesses"."client_id" = "clients"."id")))
  WHERE (("businesses"."id" = "business_years"."business_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can insert businesses for their clients" ON "public"."businesses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "businesses"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can insert own leads" ON "public"."leads" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own tax profiles" ON "public"."tax_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own user preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert personal years for their clients" ON "public"."personal_years" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "personal_years"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can insert tax proposals for their clients" ON "public"."tax_proposals" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "tax_proposals"."client_id") AND ("c"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own augusta rule details" ON "public"."augusta_rule_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "augusta_rule_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own businesses" ON "public"."centralized_businesses" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert their own calculations" ON "public"."calculations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own charitable donation details" ON "public"."charitable_donation_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "charitable_donation_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own clients" ON "public"."clients" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can insert their own contractor subcomponents" ON "public"."rd_contractor_subcomponents" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "rd_contractor_subcomponents"."user_id"
   FROM "public"."rd_business_years"
  WHERE ("rd_business_years"."id" = "rd_contractor_subcomponents"."business_year_id"))));



CREATE POLICY "Users can insert their own contractor year data" ON "public"."rd_contractor_year_data" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "rd_contractor_year_data"."user_id"
   FROM "public"."rd_business_years"
  WHERE ("rd_business_years"."id" = "rd_contractor_year_data"."business_year_id"))));



CREATE POLICY "Users can insert their own cost segregation details" ON "public"."cost_segregation_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "cost_segregation_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own ctb details" ON "public"."convertible_tax_bonds_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "convertible_tax_bonds_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own federal credit results" ON "public"."rd_federal_credit_results" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert their own hire children details" ON "public"."hire_children_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "hire_children_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own strategy details" ON "public"."strategy_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tax_proposals" "tp"
  WHERE (("tp"."id" = "strategy_details"."proposal_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own supplies" ON "public"."rd_supplies" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("rd_supplies"."business_id" = "businesses"."id") AND ("businesses"."client_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own supply subcomponents" ON "public"."rd_supply_subcomponents" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."rd_supplies"
     JOIN "public"."businesses" ON (("rd_supplies"."business_id" = "businesses"."id")))
  WHERE (("rd_supply_subcomponents"."supply_id" = "rd_supplies"."id") AND ("businesses"."client_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own supply year data" ON "public"."rd_supply_year_data" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."rd_business_years"
  WHERE (("rd_business_years"."id" = "rd_supply_year_data"."business_year_id") AND ("rd_business_years"."business_id" IN ( SELECT "rd_business_years"."business_id"
           FROM "public"."rd_businesses"
          WHERE ("rd_businesses"."client_id" IN ( SELECT "clients"."id"
                   FROM "public"."clients"
                  WHERE ("rd_businesses"."client_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can insert their own tax profile" ON "public"."tax_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own client files" ON "public"."admin_client_files" USING (("admin_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own tool enrollments" ON "public"."tool_enrollments" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_client_files" "acf"
  WHERE (("acf"."id" = "tool_enrollments"."client_file_id") AND ("acf"."admin_id" = "auth"."uid"())))));



CREATE POLICY "Users can select their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can select their own tax profile" ON "public"."tax_profiles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update business years for their businesses" ON "public"."business_years" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."businesses"
     JOIN "public"."clients" ON (("businesses"."client_id" = "clients"."id")))
  WHERE (("businesses"."id" = "business_years"."business_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can update businesses for their clients" ON "public"."businesses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "businesses"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can update own leads" ON "public"."leads" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own tax profiles" ON "public"."tax_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own user preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update personal years for their clients" ON "public"."personal_years" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "personal_years"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can update tax proposals for their clients" ON "public"."tax_proposals" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "tax_proposals"."client_id") AND ("c"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can update their own augusta rule details" ON "public"."augusta_rule_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "augusta_rule_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own businesses" ON "public"."centralized_businesses" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can update their own calculations" ON "public"."calculations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own charitable donation details" ON "public"."charitable_donation_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "charitable_donation_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own clients" ON "public"."clients" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own contractor subcomponents" ON "public"."rd_contractor_subcomponents" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "rd_contractor_subcomponents"."user_id"
   FROM "public"."rd_business_years"
  WHERE ("rd_business_years"."id" = "rd_contractor_subcomponents"."business_year_id"))));



CREATE POLICY "Users can update their own contractor year data" ON "public"."rd_contractor_year_data" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "rd_contractor_year_data"."user_id"
   FROM "public"."rd_business_years"
  WHERE ("rd_business_years"."id" = "rd_contractor_year_data"."business_year_id"))));



CREATE POLICY "Users can update their own cost segregation details" ON "public"."cost_segregation_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "cost_segregation_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own ctb details" ON "public"."convertible_tax_bonds_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "convertible_tax_bonds_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own federal credit results" ON "public"."rd_federal_credit_results" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can update their own hire children details" ON "public"."hire_children_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "hire_children_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own strategy details" ON "public"."strategy_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."tax_proposals" "tp"
  WHERE (("tp"."id" = "strategy_details"."proposal_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own supplies" ON "public"."rd_supplies" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("rd_supplies"."business_id" = "businesses"."id") AND ("businesses"."client_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own supply subcomponents" ON "public"."rd_supply_subcomponents" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."rd_supplies"
     JOIN "public"."businesses" ON (("rd_supplies"."business_id" = "businesses"."id")))
  WHERE (("rd_supply_subcomponents"."supply_id" = "rd_supplies"."id") AND ("businesses"."client_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own supply year data" ON "public"."rd_supply_year_data" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."rd_business_years"
  WHERE (("rd_business_years"."id" = "rd_supply_year_data"."business_year_id") AND ("rd_business_years"."business_id" IN ( SELECT "rd_business_years"."business_id"
           FROM "public"."rd_businesses"
          WHERE ("rd_businesses"."client_id" IN ( SELECT "clients"."id"
                   FROM "public"."clients"
                  WHERE ("rd_businesses"."client_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can update their own tax profile" ON "public"."tax_profiles" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view business years for their businesses" ON "public"."business_years" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."businesses"
     JOIN "public"."clients" ON (("businesses"."client_id" = "clients"."id")))
  WHERE (("businesses"."id" = "business_years"."business_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view businesses for their clients" ON "public"."businesses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "businesses"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view invitations for their clients" ON "public"."invitations" FOR SELECT USING (("public"."user_has_direct_client_access"("auth"."uid"(), "client_id") OR "public"."user_is_client_owner"("auth"."uid"(), "client_id") OR ("invited_by" = "auth"."uid"())));



CREATE POLICY "Users can view own client relationships" ON "public"."client_users" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own leads" ON "public"."leads" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own tax profiles" ON "public"."tax_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own user preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view personal years for their clients" ON "public"."personal_years" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "personal_years"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view tax proposals for their clients" ON "public"."tax_proposals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "tax_proposals"."client_id") AND ("c"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view their own augusta rule details" ON "public"."augusta_rule_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "augusta_rule_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own businesses" ON "public"."centralized_businesses" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can view their own calculations" ON "public"."calculations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own charitable donation details" ON "public"."charitable_donation_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "charitable_donation_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own client files" ON "public"."admin_client_files" FOR SELECT USING (("admin_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own clients" ON "public"."clients" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own contractor subcomponents" ON "public"."rd_contractor_subcomponents" FOR SELECT USING (("auth"."uid"() IN ( SELECT "rd_contractor_subcomponents"."user_id"
   FROM "public"."rd_business_years"
  WHERE ("rd_business_years"."id" = "rd_contractor_subcomponents"."business_year_id"))));



CREATE POLICY "Users can view their own contractor year data" ON "public"."rd_contractor_year_data" FOR SELECT USING (("auth"."uid"() IN ( SELECT "rd_contractor_year_data"."user_id"
   FROM "public"."rd_business_years"
  WHERE ("rd_business_years"."id" = "rd_contractor_year_data"."business_year_id"))));



CREATE POLICY "Users can view their own cost segregation details" ON "public"."cost_segregation_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "cost_segregation_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own ctb details" ON "public"."convertible_tax_bonds_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "convertible_tax_bonds_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own federal credit results" ON "public"."rd_federal_credit_results" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can view their own hire children details" ON "public"."hire_children_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."strategy_details" "sd"
     JOIN "public"."tax_proposals" "tp" ON (("tp"."id" = "sd"."proposal_id")))
  WHERE (("sd"."id" = "hire_children_details"."strategy_detail_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own strategy details" ON "public"."strategy_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tax_proposals" "tp"
  WHERE (("tp"."id" = "strategy_details"."proposal_id") AND ("tp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own supplies" ON "public"."rd_supplies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("rd_supplies"."business_id" = "businesses"."id") AND ("businesses"."client_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own supply subcomponents" ON "public"."rd_supply_subcomponents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."rd_supplies"
     JOIN "public"."businesses" ON (("rd_supplies"."business_id" = "businesses"."id")))
  WHERE (("rd_supply_subcomponents"."supply_id" = "rd_supplies"."id") AND ("businesses"."client_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own supply year data" ON "public"."rd_supply_year_data" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."rd_business_years"
  WHERE (("rd_business_years"."id" = "rd_supply_year_data"."business_year_id") AND ("rd_business_years"."business_id" IN ( SELECT "rd_business_years"."business_id"
           FROM "public"."rd_businesses"
          WHERE ("rd_businesses"."client_id" IN ( SELECT "clients"."id"
                   FROM "public"."clients"
                  WHERE ("rd_businesses"."client_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can view their own tool enrollments" ON "public"."tool_enrollments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_client_files" "acf"
  WHERE (("acf"."id" = "tool_enrollments"."client_file_id") AND ("acf"."admin_id" = "auth"."uid"())))));



ALTER TABLE "public"."admin_client_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."augusta_rule_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_years" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calculations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."centralized_businesses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."charitable_donation_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_dashboard_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_engagement_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractor_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."convertible_tax_bonds_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cost_segregation_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_management_company_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hire_children_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_years" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_contractor_year_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_employee_subcomponents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_federal_credit_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_research_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_research_subcomponents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_selected_filter" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_selected_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_supplies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reinsurance_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."research_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."strategy_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supply_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_proposals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tool_enrollments" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_invitation"("invitation_token" character varying, "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_invitation"("invitation_token" character varying, "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invitation"("invitation_token" character varying, "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_business_year"("p_business_id" "uuid", "p_year" integer, "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_business_year"("p_business_id" "uuid", "p_year" integer, "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_business_year"("p_business_id" "uuid", "p_year" integer, "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."archive_client"("p_client_id" "uuid", "p_archive" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."archive_client"("p_client_id" "uuid", "p_archive" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_client"("p_client_id" "uuid", "p_archive" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_dashboard_metrics"("p_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_dashboard_metrics"("p_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_dashboard_metrics"("p_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_security_events"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_security_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_security_events"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_business_with_enrollment"("p_business_name" "text", "p_entity_type" "text", "p_client_file_id" "uuid", "p_tool_slug" "text", "p_ein" "text", "p_business_address" "text", "p_business_city" "text", "p_business_state" "text", "p_business_zip" "text", "p_business_phone" "text", "p_business_email" "text", "p_industry" "text", "p_year_established" integer, "p_annual_revenue" numeric, "p_employee_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_business_with_enrollment"("p_business_name" "text", "p_entity_type" "text", "p_client_file_id" "uuid", "p_tool_slug" "text", "p_ein" "text", "p_business_address" "text", "p_business_city" "text", "p_business_state" "text", "p_business_zip" "text", "p_business_phone" "text", "p_business_email" "text", "p_industry" "text", "p_year_established" integer, "p_annual_revenue" numeric, "p_employee_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_business_with_enrollment"("p_business_name" "text", "p_entity_type" "text", "p_client_file_id" "uuid", "p_tool_slug" "text", "p_ein" "text", "p_business_address" "text", "p_business_city" "text", "p_business_state" "text", "p_business_zip" "text", "p_business_phone" "text", "p_business_email" "text", "p_industry" "text", "p_year_established" integer, "p_annual_revenue" numeric, "p_employee_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_client_with_business"("p_full_name" "text", "p_email" "text", "p_phone" "text", "p_filing_status" "text", "p_dependents" integer, "p_home_address" "text", "p_state" "text", "p_wages_income" numeric, "p_passive_income" numeric, "p_unearned_income" numeric, "p_capital_gains" numeric, "p_household_income" numeric, "p_standard_deduction" boolean, "p_custom_deduction" numeric, "p_business_owner" boolean, "p_business_name" "text", "p_entity_type" "text", "p_business_address" "text", "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_business_annual_revenue" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_client_with_business"("p_full_name" "text", "p_email" "text", "p_phone" "text", "p_filing_status" "text", "p_dependents" integer, "p_home_address" "text", "p_state" "text", "p_wages_income" numeric, "p_passive_income" numeric, "p_unearned_income" numeric, "p_capital_gains" numeric, "p_household_income" numeric, "p_standard_deduction" boolean, "p_custom_deduction" numeric, "p_business_owner" boolean, "p_business_name" "text", "p_entity_type" "text", "p_business_address" "text", "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_business_annual_revenue" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_client_with_business"("p_full_name" "text", "p_email" "text", "p_phone" "text", "p_filing_status" "text", "p_dependents" integer, "p_home_address" "text", "p_state" "text", "p_wages_income" numeric, "p_passive_income" numeric, "p_unearned_income" numeric, "p_capital_gains" numeric, "p_household_income" numeric, "p_standard_deduction" boolean, "p_custom_deduction" numeric, "p_business_owner" boolean, "p_business_name" "text", "p_entity_type" "text", "p_business_address" "text", "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_business_annual_revenue" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_if_missing"("user_id" "uuid", "user_email" "text", "user_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_if_missing"("user_id" "uuid", "user_email" "text", "user_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_if_missing"("user_id" "uuid", "user_email" "text", "user_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_strategy_details_for_proposal"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_strategy_details_for_proposal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_strategy_details_for_proposal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enroll_client_in_tool"("p_client_file_id" "uuid", "p_business_id" "uuid", "p_tool_slug" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."enroll_client_in_tool"("p_client_file_id" "uuid", "p_business_id" "uuid", "p_tool_slug" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enroll_client_in_tool"("p_client_file_id" "uuid", "p_business_id" "uuid", "p_tool_slug" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_client_has_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_client_has_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_client_has_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_affiliate_from_client"("client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_affiliate_from_client"("client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_affiliate_from_client"("client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_base_period_years"("business_start_year" integer, "tax_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_base_period_years"("business_start_year" integer, "tax_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_base_period_years"("business_start_year" integer, "tax_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_info"("client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_info"("client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_info"("client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_tools"("p_client_file_id" "uuid", "p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_tools"("p_client_file_id" "uuid", "p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_tools"("p_client_file_id" "uuid", "p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_with_data"("client_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_with_data"("client_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_with_data"("client_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tax_proposal_affiliate"("proposal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tax_proposal_affiliate"("proposal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tax_proposal_affiliate"("proposal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_client_list"("p_tool_filter" "text", "p_admin_id" "uuid", "p_affiliate_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_client_list"("p_tool_filter" "text", "p_admin_id" "uuid", "p_affiliate_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_client_list"("p_tool_filter" "text", "p_admin_id" "uuid", "p_affiliate_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_client_role"("check_user_id" "uuid", "check_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_client_role"("check_user_id" "uuid", "check_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_client_role"("check_user_id" "uuid", "check_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_affiliated_with_client"("client_id_to_check" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_affiliated_with_client"("client_id_to_check" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_affiliated_with_client"("client_id_to_check" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_client_access"("action_type" "text", "client_id" "uuid", "user_id" "uuid", "additional_info" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_client_access"("action_type" "text", "client_id" "uuid", "user_id" "uuid", "additional_info" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_client_access"("action_type" "text", "client_id" "uuid", "user_id" "uuid", "additional_info" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_client_activity"("p_client_id" "uuid", "p_user_id" "uuid", "p_activity_type" "public"."activity_type", "p_title" "text", "p_description" "text", "p_priority" "public"."activity_priority", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_client_activity"("p_client_id" "uuid", "p_user_id" "uuid", "p_activity_type" "public"."activity_type", "p_title" "text", "p_description" "text", "p_priority" "public"."activity_priority", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_client_activity"("p_client_id" "uuid", "p_user_id" "uuid", "p_activity_type" "public"."activity_type", "p_title" "text", "p_description" "text", "p_priority" "public"."activity_priority", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "client_id" "uuid", "event_data" "jsonb", "severity" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "client_id" "uuid", "event_data" "jsonb", "severity" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "client_id" "uuid", "event_data" "jsonb", "severity" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."security_health_check"() TO "anon";
GRANT ALL ON FUNCTION "public"."security_health_check"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."security_health_check"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invitation_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_invitation_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invitation_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_business_years_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_business_years_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_business_years_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_client_engagement_status"("p_client_id" "uuid", "p_status" "public"."engagement_status", "p_pending_actions" integer, "p_completion_percentage" numeric, "p_next_action_due" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."update_client_engagement_status"("p_client_id" "uuid", "p_status" "public"."engagement_status", "p_pending_actions" integer, "p_completion_percentage" numeric, "p_next_action_due" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_client_engagement_status"("p_client_id" "uuid", "p_status" "public"."engagement_status", "p_pending_actions" integer, "p_completion_percentage" numeric, "p_next_action_due" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_client_users_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_client_users_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_client_users_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_invitations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_invitations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_invitations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_client_access"("check_user_id" "uuid", "check_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_client_access"("check_user_id" "uuid", "check_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_client_access"("check_user_id" "uuid", "check_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_client_role"("check_user_id" "uuid", "check_client_id" "uuid", "required_role" "public"."client_role") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_client_role"("check_user_id" "uuid", "check_client_id" "uuid", "required_role" "public"."client_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_client_role"("check_user_id" "uuid", "check_client_id" "uuid", "required_role" "public"."client_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_direct_client_access"("user_id" "uuid", "client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_direct_client_access"("user_id" "uuid", "client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_direct_client_access"("user_id" "uuid", "client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_client_owner"("user_id" "uuid", "client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_client_owner"("user_id" "uuid", "client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_client_owner"("user_id" "uuid", "client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_client_access"("check_client_id" "uuid", "required_role" "public"."client_role") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_client_access"("check_client_id" "uuid", "required_role" "public"."client_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_client_access"("check_client_id" "uuid", "required_role" "public"."client_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_historical_data"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_historical_data"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_historical_data"("data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_rls_enabled"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_rls_enabled"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_rls_enabled"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_client_files" TO "anon";
GRANT ALL ON TABLE "public"."admin_client_files" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_client_files" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_tool_permissions" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_tool_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_tool_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."augusta_rule_details" TO "anon";
GRANT ALL ON TABLE "public"."augusta_rule_details" TO "authenticated";
GRANT ALL ON TABLE "public"."augusta_rule_details" TO "service_role";



GRANT ALL ON TABLE "public"."business_years" TO "anon";
GRANT ALL ON TABLE "public"."business_years" TO "authenticated";
GRANT ALL ON TABLE "public"."business_years" TO "service_role";



GRANT ALL ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT ALL ON TABLE "public"."calculations" TO "anon";
GRANT ALL ON TABLE "public"."calculations" TO "authenticated";
GRANT ALL ON TABLE "public"."calculations" TO "service_role";



GRANT ALL ON TABLE "public"."centralized_businesses" TO "anon";
GRANT ALL ON TABLE "public"."centralized_businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."centralized_businesses" TO "service_role";



GRANT ALL ON TABLE "public"."charitable_donation_details" TO "anon";
GRANT ALL ON TABLE "public"."charitable_donation_details" TO "authenticated";
GRANT ALL ON TABLE "public"."charitable_donation_details" TO "service_role";



GRANT ALL ON TABLE "public"."client_users" TO "anon";
GRANT ALL ON TABLE "public"."client_users" TO "authenticated";
GRANT ALL ON TABLE "public"."client_users" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."client_access_summary" TO "anon";
GRANT ALL ON TABLE "public"."client_access_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."client_access_summary" TO "service_role";



GRANT ALL ON TABLE "public"."client_activities" TO "anon";
GRANT ALL ON TABLE "public"."client_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."client_activities" TO "service_role";



GRANT ALL ON TABLE "public"."client_dashboard_metrics" TO "anon";
GRANT ALL ON TABLE "public"."client_dashboard_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."client_dashboard_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."client_engagement_status" TO "anon";
GRANT ALL ON TABLE "public"."client_engagement_status" TO "authenticated";
GRANT ALL ON TABLE "public"."client_engagement_status" TO "service_role";



GRANT ALL ON TABLE "public"."client_dashboard_summary" TO "anon";
GRANT ALL ON TABLE "public"."client_dashboard_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."client_dashboard_summary" TO "service_role";



GRANT ALL ON TABLE "public"."commission_transactions" TO "anon";
GRANT ALL ON TABLE "public"."commission_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."contractor_expenses" TO "anon";
GRANT ALL ON TABLE "public"."contractor_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."convertible_tax_bonds_details" TO "anon";
GRANT ALL ON TABLE "public"."convertible_tax_bonds_details" TO "authenticated";
GRANT ALL ON TABLE "public"."convertible_tax_bonds_details" TO "service_role";



GRANT ALL ON TABLE "public"."cost_segregation_details" TO "anon";
GRANT ALL ON TABLE "public"."cost_segregation_details" TO "authenticated";
GRANT ALL ON TABLE "public"."cost_segregation_details" TO "service_role";



GRANT ALL ON TABLE "public"."drf_tmp_test" TO "anon";
GRANT ALL ON TABLE "public"."drf_tmp_test" TO "authenticated";
GRANT ALL ON TABLE "public"."drf_tmp_test" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."experts" TO "anon";
GRANT ALL ON TABLE "public"."experts" TO "authenticated";
GRANT ALL ON TABLE "public"."experts" TO "service_role";



GRANT ALL ON TABLE "public"."family_management_company_details" TO "anon";
GRANT ALL ON TABLE "public"."family_management_company_details" TO "authenticated";
GRANT ALL ON TABLE "public"."family_management_company_details" TO "service_role";



GRANT ALL ON TABLE "public"."hire_children_details" TO "anon";
GRANT ALL ON TABLE "public"."hire_children_details" TO "authenticated";
GRANT ALL ON TABLE "public"."hire_children_details" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."partner_tool_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."partner_tool_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_tool_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."partners" TO "anon";
GRANT ALL ON TABLE "public"."partners" TO "authenticated";
GRANT ALL ON TABLE "public"."partners" TO "service_role";



GRANT ALL ON TABLE "public"."personal_years" TO "anon";
GRANT ALL ON TABLE "public"."personal_years" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_years" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_assignments" TO "anon";
GRANT ALL ON TABLE "public"."proposal_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_timeline" TO "anon";
GRANT ALL ON TABLE "public"."proposal_timeline" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_timeline" TO "service_role";



GRANT ALL ON TABLE "public"."rd_areas" TO "anon";
GRANT ALL ON TABLE "public"."rd_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_areas" TO "service_role";



GRANT ALL ON TABLE "public"."rd_focuses" TO "anon";
GRANT ALL ON TABLE "public"."rd_focuses" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_focuses" TO "service_role";



GRANT ALL ON TABLE "public"."rd_research_activities" TO "anon";
GRANT ALL ON TABLE "public"."rd_research_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_research_activities" TO "service_role";



GRANT ALL ON TABLE "public"."rd_research_categories" TO "anon";
GRANT ALL ON TABLE "public"."rd_research_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_research_categories" TO "service_role";



GRANT ALL ON TABLE "public"."rd_subcomponents" TO "anon";
GRANT ALL ON TABLE "public"."rd_subcomponents" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_subcomponents" TO "service_role";



GRANT ALL ON TABLE "public"."rd_activity_hierarchy" TO "anon";
GRANT ALL ON TABLE "public"."rd_activity_hierarchy" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_activity_hierarchy" TO "service_role";



GRANT ALL ON TABLE "public"."rd_business_years" TO "anon";
GRANT ALL ON TABLE "public"."rd_business_years" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_business_years" TO "service_role";



GRANT ALL ON TABLE "public"."rd_businesses" TO "anon";
GRANT ALL ON TABLE "public"."rd_businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_businesses" TO "service_role";



GRANT ALL ON TABLE "public"."rd_contractor_subcomponents" TO "anon";
GRANT ALL ON TABLE "public"."rd_contractor_subcomponents" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_contractor_subcomponents" TO "service_role";



GRANT ALL ON TABLE "public"."rd_contractor_year_data" TO "anon";
GRANT ALL ON TABLE "public"."rd_contractor_year_data" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_contractor_year_data" TO "service_role";



GRANT ALL ON TABLE "public"."rd_contractors" TO "anon";
GRANT ALL ON TABLE "public"."rd_contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_contractors" TO "service_role";



GRANT ALL ON TABLE "public"."rd_employee_subcomponents" TO "anon";
GRANT ALL ON TABLE "public"."rd_employee_subcomponents" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_employee_subcomponents" TO "service_role";



GRANT ALL ON TABLE "public"."rd_employee_year_data" TO "anon";
GRANT ALL ON TABLE "public"."rd_employee_year_data" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_employee_year_data" TO "service_role";



GRANT ALL ON TABLE "public"."rd_employees" TO "anon";
GRANT ALL ON TABLE "public"."rd_employees" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_employees" TO "service_role";



GRANT ALL ON TABLE "public"."rd_expenses" TO "anon";
GRANT ALL ON TABLE "public"."rd_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."rd_federal_credit_results" TO "anon";
GRANT ALL ON TABLE "public"."rd_federal_credit_results" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_federal_credit_results" TO "service_role";



GRANT ALL ON TABLE "public"."rd_reports" TO "anon";
GRANT ALL ON TABLE "public"."rd_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_reports" TO "service_role";



GRANT ALL ON TABLE "public"."rd_research_raw" TO "anon";
GRANT ALL ON TABLE "public"."rd_research_raw" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_research_raw" TO "service_role";



GRANT ALL ON TABLE "public"."rd_research_steps" TO "anon";
GRANT ALL ON TABLE "public"."rd_research_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_research_steps" TO "service_role";



GRANT ALL ON TABLE "public"."rd_research_subcomponents" TO "anon";
GRANT ALL ON TABLE "public"."rd_research_subcomponents" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_research_subcomponents" TO "service_role";



GRANT ALL ON TABLE "public"."rd_roles" TO "anon";
GRANT ALL ON TABLE "public"."rd_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_roles" TO "service_role";



GRANT ALL ON TABLE "public"."rd_selected_activities" TO "anon";
GRANT ALL ON TABLE "public"."rd_selected_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_selected_activities" TO "service_role";



GRANT ALL ON TABLE "public"."rd_selected_filter" TO "anon";
GRANT ALL ON TABLE "public"."rd_selected_filter" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_selected_filter" TO "service_role";



GRANT ALL ON TABLE "public"."rd_selected_steps" TO "anon";
GRANT ALL ON TABLE "public"."rd_selected_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_selected_steps" TO "service_role";



GRANT ALL ON TABLE "public"."rd_selected_subcomponents" TO "anon";
GRANT ALL ON TABLE "public"."rd_selected_subcomponents" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_selected_subcomponents" TO "service_role";



GRANT ALL ON TABLE "public"."rd_state_calculations" TO "anon";
GRANT ALL ON TABLE "public"."rd_state_calculations" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_state_calculations" TO "service_role";



GRANT ALL ON TABLE "public"."rd_supplies" TO "anon";
GRANT ALL ON TABLE "public"."rd_supplies" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_supplies" TO "service_role";



GRANT ALL ON TABLE "public"."rd_supply_subcomponents" TO "anon";
GRANT ALL ON TABLE "public"."rd_supply_subcomponents" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_supply_subcomponents" TO "service_role";



GRANT ALL ON TABLE "public"."rd_supply_year_data" TO "anon";
GRANT ALL ON TABLE "public"."rd_supply_year_data" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_supply_year_data" TO "service_role";



GRANT ALL ON TABLE "public"."recent_client_activities" TO "anon";
GRANT ALL ON TABLE "public"."recent_client_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_client_activities" TO "service_role";



GRANT ALL ON TABLE "public"."reinsurance_details" TO "anon";
GRANT ALL ON TABLE "public"."reinsurance_details" TO "authenticated";
GRANT ALL ON TABLE "public"."reinsurance_details" TO "service_role";



GRANT ALL ON TABLE "public"."research_activities" TO "anon";
GRANT ALL ON TABLE "public"."research_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."research_activities" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



GRANT ALL ON TABLE "public"."security_policy_audit" TO "anon";
GRANT ALL ON TABLE "public"."security_policy_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."security_policy_audit" TO "service_role";



GRANT ALL ON TABLE "public"."strategy_commission_rates" TO "anon";
GRANT ALL ON TABLE "public"."strategy_commission_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."strategy_commission_rates" TO "service_role";



GRANT ALL ON TABLE "public"."strategy_details" TO "anon";
GRANT ALL ON TABLE "public"."strategy_details" TO "authenticated";
GRANT ALL ON TABLE "public"."strategy_details" TO "service_role";



GRANT ALL ON TABLE "public"."supply_expenses" TO "anon";
GRANT ALL ON TABLE "public"."supply_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."supply_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."tax_calculations" TO "anon";
GRANT ALL ON TABLE "public"."tax_calculations" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_calculations" TO "service_role";



GRANT ALL ON TABLE "public"."tax_estimates" TO "anon";
GRANT ALL ON TABLE "public"."tax_estimates" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_estimates" TO "service_role";



GRANT ALL ON TABLE "public"."tax_profiles" TO "anon";
GRANT ALL ON TABLE "public"."tax_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tax_proposals" TO "anon";
GRANT ALL ON TABLE "public"."tax_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_proposals" TO "service_role";



GRANT ALL ON TABLE "public"."tax_proposals_with_client_info" TO "anon";
GRANT ALL ON TABLE "public"."tax_proposals_with_client_info" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_proposals_with_client_info" TO "service_role";



GRANT ALL ON TABLE "public"."tool_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."tool_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."tools" TO "anon";
GRANT ALL ON TABLE "public"."tools" TO "authenticated";
GRANT ALL ON TABLE "public"."tools" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_access_summary" TO "anon";
GRANT ALL ON TABLE "public"."user_access_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."user_access_summary" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."users_with_auth" TO "anon";
GRANT ALL ON TABLE "public"."users_with_auth" TO "authenticated";
GRANT ALL ON TABLE "public"."users_with_auth" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
