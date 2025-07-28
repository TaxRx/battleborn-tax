

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."entity_type" AS ENUM (
    'LLC',
    'SCORP',
    'CCORP',
    'PARTNERSHIP',
    'SOLEPROP',
    'OTHER'
);


ALTER TYPE "public"."entity_type" OWNER TO "postgres";


CREATE TYPE "public"."qc_status_enum" AS ENUM (
    'pending',
    'in_review',
    'ready_for_review',
    'approved',
    'requires_changes',
    'complete'
);


ALTER TYPE "public"."qc_status_enum" OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."archive_rd_federal_credit_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."archive_rd_federal_credit_version"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."check_document_release_eligibility"("p_business_year_id" "uuid", "p_document_type" character varying) RETURNS TABLE("can_release" boolean, "reason" "text", "jurat_signed" boolean, "payment_received" boolean, "qc_approved" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  business_year_record RECORD;
  control_record RECORD;
  jurat_exists BOOLEAN;
BEGIN
  -- Get business year info
  SELECT * INTO business_year_record
  FROM rd_business_years
  WHERE id = p_business_year_id;
  
  -- Get document control info
  SELECT * INTO control_record
  FROM rd_qc_document_controls
  WHERE business_year_id = p_business_year_id 
  AND document_type = p_document_type;
  
  -- Check if jurat is signed (if required)
  SELECT EXISTS(
    SELECT 1 FROM rd_signatures 
    WHERE business_year_id = p_business_year_id 
    AND signature_type = 'jurat'
  ) INTO jurat_exists;
  
  -- Determine if document can be released based on type and requirements
  CASE p_document_type
    WHEN 'research_report' THEN
      -- Research Report: Available when QC marks as ready
      RETURN QUERY SELECT 
        (business_year_record.qc_status IN ('ready_for_review', 'approved', 'complete')),
        CASE 
          WHEN business_year_record.qc_status IN ('ready_for_review', 'approved', 'complete') THEN 'Document approved for release'
          ELSE 'Document pending QC approval'
        END,
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
        
    WHEN 'filing_guide' THEN
      -- Filing Guide: Available after jurat signed + QC approval + payment
      RETURN QUERY SELECT 
        (jurat_exists AND business_year_record.qc_status = 'complete' AND COALESCE(business_year_record.payment_received, FALSE)),
        CASE 
          WHEN NOT jurat_exists THEN 'Jurat must be signed first'
          WHEN business_year_record.qc_status != 'complete' THEN 'QC approval required'
          WHEN NOT COALESCE(business_year_record.payment_received, FALSE) THEN 'Payment required'
          ELSE 'Document approved for release'
        END,
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status = 'complete');
        
    WHEN 'allocation_report' THEN
      -- Allocation Report: Available after QC approval  
      RETURN QUERY SELECT 
        (business_year_record.qc_status IN ('approved', 'complete')),
        CASE 
          WHEN business_year_record.qc_status IN ('approved', 'complete') THEN 'Document approved for release'
          ELSE 'Document pending QC approval'
        END,
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
        
    ELSE
      -- Default: Require QC approval
      RETURN QUERY SELECT 
        (business_year_record.qc_status IN ('approved', 'complete')),
        'Document pending QC approval',
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
  END CASE;
END;
$$;


ALTER FUNCTION "public"."check_document_release_eligibility"("p_business_year_id" "uuid", "p_document_type" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_document_release_eligibility"("p_business_year_id" "uuid", "p_document_type" character varying) IS 'Checks if documents can be released based on business rules';



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


COMMENT ON FUNCTION "public"."create_business_with_enrollment"("p_business_name" "text", "p_entity_type" "text", "p_client_file_id" "uuid", "p_tool_slug" "text", "p_ein" "text", "p_business_address" "text", "p_business_city" "text", "p_business_state" "text", "p_business_zip" "text", "p_business_phone" "text", "p_business_email" "text", "p_industry" "text", "p_year_established" integer, "p_annual_revenue" numeric, "p_employee_count" integer) IS 'Creates a new business and enrolls it in a tax tool';



CREATE OR REPLACE FUNCTION "public"."create_client_with_business"("p_full_name" "text", "p_email" "text", "p_phone" "text" DEFAULT NULL::"text", "p_filing_status" "text" DEFAULT 'single'::"text", "p_dependents" integer DEFAULT 0, "p_home_address" "text" DEFAULT NULL::"text", "p_state" "text" DEFAULT 'NV'::"text", "p_wages_income" numeric DEFAULT 0, "p_passive_income" numeric DEFAULT 0, "p_unearned_income" numeric DEFAULT 0, "p_capital_gains" numeric DEFAULT 0, "p_household_income" numeric DEFAULT 0, "p_standard_deduction" boolean DEFAULT true, "p_custom_deduction" numeric DEFAULT 0, "p_business_owner" boolean DEFAULT false, "p_business_name" "text" DEFAULT NULL::"text", "p_entity_type" "text" DEFAULT NULL::"text", "p_business_address" "text" DEFAULT NULL::"text", "p_ordinary_k1_income" numeric DEFAULT 0, "p_guaranteed_k1_income" numeric DEFAULT 0, "p_business_annual_revenue" numeric DEFAULT 0) RETURNS "json"
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


COMMENT ON FUNCTION "public"."enroll_client_in_tool"("p_client_file_id" "uuid", "p_business_id" "uuid", "p_tool_slug" "text", "p_notes" "text") IS 'Enrolls a client/business in a tax tool';



CREATE OR REPLACE FUNCTION "public"."generate_portal_token"("p_business_id" "uuid") RETURNS TABLE("token" character varying, "expires_at" timestamp without time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_token VARCHAR(64);
  new_expires_at TIMESTAMP;
BEGIN
  -- Generate a secure random token
  new_token := encode(gen_random_bytes(32), 'hex');
  
  -- Set expiration to 30 days from now
  new_expires_at := NOW() + INTERVAL '30 days';
  
  -- Deactivate any existing tokens for this business
  UPDATE rd_client_portal_tokens 
  SET is_active = FALSE, updated_at = NOW()
  WHERE business_id = p_business_id AND is_active = TRUE;
  
  -- Insert new token
  INSERT INTO rd_client_portal_tokens (
    business_id, 
    token, 
    expires_at, 
    created_at, 
    updated_at,
    is_active,
    access_count
  ) VALUES (
    p_business_id, 
    new_token, 
    new_expires_at, 
    NOW(), 
    NOW(),
    TRUE,
    0
  );
  
  -- Return the new token
  RETURN QUERY SELECT new_token, new_expires_at;
END $$;


ALTER FUNCTION "public"."generate_portal_token"("p_business_id" "uuid") OWNER TO "postgres";


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


COMMENT ON FUNCTION "public"."get_client_tools"("p_client_file_id" "uuid", "p_business_id" "uuid") IS 'Returns all tools a client is enrolled in';



CREATE OR REPLACE FUNCTION "public"."get_client_with_data"("client_uuid" "uuid") RETURNS "json"
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


COMMENT ON FUNCTION "public"."get_unified_client_list"("p_tool_filter" "text", "p_admin_id" "uuid", "p_affiliate_id" "uuid") IS 'Returns unified client list with filtering options';



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
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_update_selected_subcomponent_practice_percent"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."safe_update_selected_subcomponent_practice_percent"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_credits_calculated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."update_credits_calculated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_rd_federal_credit_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_rd_federal_credit_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_rd_state_proforma_data_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_rd_state_proforma_data_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_selected_subcomponent_step_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."update_selected_subcomponent_step_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_total_qre"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.total_qre = COALESCE(NEW.employee_qre, 0) + COALESCE(NEW.contractor_qre, 0) + COALESCE(NEW.supply_qre, 0);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_total_qre"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_historical_data"("data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if data is an array
    IF jsonb_typeof(data) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Check each element in the array
    FOR i IN 0..jsonb_array_length(data) - 1 LOOP
        -- Each element should be an object with year, gross_receipts, and qre
        IF NOT (
            (data->i) ? 'year' AND
            (data->i) ? 'gross_receipts' AND
            (data->i) ? 'qre' AND
            jsonb_typeof(data->i->'year') = 'number' AND
            jsonb_typeof(data->i->'gross_receipts') = 'number' AND
            jsonb_typeof(data->i->'qre') = 'number'
        ) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."validate_historical_data"("data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_portal_token"("p_token" character varying, "p_ip_address" "inet" DEFAULT NULL::"inet") RETURNS TABLE("is_valid" boolean, "business_id" "uuid", "business_name" "text", "expires_at" timestamp without time zone, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."validate_portal_token"("p_token" character varying, "p_ip_address" "inet") OWNER TO "postgres";

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


COMMENT ON TABLE "public"."admin_client_files" IS 'Stores client files managed by admins';



COMMENT ON COLUMN "public"."admin_client_files"."admin_id" IS 'The admin who created/manages this client file';



COMMENT ON COLUMN "public"."admin_client_files"."affiliate_id" IS 'The affiliate associated with this client (if any)';



COMMENT ON COLUMN "public"."admin_client_files"."tax_profile_data" IS 'JSON data containing the complete tax profile';



COMMENT ON COLUMN "public"."admin_client_files"."archived" IS 'Whether this client file has been archived (soft delete)';



COMMENT ON COLUMN "public"."admin_client_files"."archived_at" IS 'Timestamp when this client file was archived';



COMMENT ON COLUMN "public"."admin_client_files"."business_id" IS 'Reference to the primary business for this client';



COMMENT ON COLUMN "public"."admin_client_files"."email" IS 'Email address of the client';



COMMENT ON COLUMN "public"."admin_client_files"."full_name" IS 'Full name of the client';



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
    "zip_code" "text"
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clients"."city" IS 'City of the client''s home address';



COMMENT ON COLUMN "public"."clients"."zip_code" IS 'ZIP code of the client''s home address';



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


CREATE TABLE IF NOT EXISTS "public"."form_6765_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "business_year" integer NOT NULL,
    "section" "text" NOT NULL,
    "line_number" integer NOT NULL,
    "value" numeric(15,2) NOT NULL,
    "last_modified_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."form_6765_overrides" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text"
);


ALTER TABLE "public"."rd_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_focuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "area_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text"
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
    "step" "text",
    "deactivated_at" timestamp without time zone,
    "deactivation_reason" "text",
    "business_id" "uuid"
);


ALTER TABLE "public"."rd_research_activities" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rd_research_activities"."business_id" IS 'Foreign key to rd_businesses. NULL = global activity available to all businesses. 
        Non-NULL = business-specific activity for IP protection.';



CREATE TABLE IF NOT EXISTS "public"."rd_research_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text"
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


ALTER TABLE "public"."rd_activity_hierarchy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_billable_time_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "research_activity_id" "uuid" NOT NULL,
    "subcomponent_id" "uuid",
    "total_procedures_count" integer DEFAULT 0,
    "total_billed_units" integer DEFAULT 0,
    "total_billed_amount" numeric(15,2) DEFAULT 0,
    "estimated_total_time_hours" numeric(10,2) DEFAULT 0,
    "current_practice_percentage" numeric(5,2),
    "calculated_billable_percentage" numeric(5,2),
    "recommended_percentage" numeric(5,2),
    "percentage_variance" numeric(5,2),
    "last_calculated" timestamp without time zone DEFAULT "now"(),
    "calculation_source" "text" DEFAULT 'ai_analysis'::"text",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_billable_time_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_business_years" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "gross_receipts" numeric(15,2) NOT NULL,
    "total_qre" numeric(15,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "qc_status" character varying(50) DEFAULT 'pending'::character varying,
    "qc_approved_by" "uuid",
    "qc_approved_at" timestamp without time zone,
    "payment_received" boolean DEFAULT false,
    "payment_received_at" timestamp without time zone,
    "qc_notes" "text",
    "payment_amount" numeric(15,2),
    "documents_released" boolean DEFAULT false,
    "documents_released_at" timestamp without time zone,
    "documents_released_by" "uuid",
    "employee_qre" numeric(15,2) DEFAULT 0,
    "contractor_qre" numeric(15,2) DEFAULT 0,
    "supply_qre" numeric(15,2) DEFAULT 0,
    "qre_locked" boolean DEFAULT false,
    "federal_credit" numeric(15,2) DEFAULT 0,
    "state_credit" numeric(15,2) DEFAULT 0,
    "credits_locked" boolean DEFAULT false,
    "credits_calculated_at" timestamp with time zone,
    "credits_locked_by" "uuid",
    "credits_locked_at" timestamp with time zone
);


ALTER TABLE "public"."rd_business_years" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rd_business_years"."employee_qre" IS 'Locked employee QRE value for this business year';



COMMENT ON COLUMN "public"."rd_business_years"."contractor_qre" IS 'Locked contractor QRE value for this business year';



COMMENT ON COLUMN "public"."rd_business_years"."supply_qre" IS 'Locked supply QRE value for this business year';



COMMENT ON COLUMN "public"."rd_business_years"."qre_locked" IS 'Whether the QRE values are locked (not automatically calculated)';



COMMENT ON COLUMN "public"."rd_business_years"."federal_credit" IS 'Federal R&D tax credit amount (editable and lockable)';



COMMENT ON COLUMN "public"."rd_business_years"."state_credit" IS 'State R&D tax credit amount (editable and lockable)';



COMMENT ON COLUMN "public"."rd_business_years"."credits_locked" IS 'Whether the credit values are locked from further calculation updates';



COMMENT ON COLUMN "public"."rd_business_years"."credits_calculated_at" IS 'When the credits were last calculated or manually updated';



COMMENT ON COLUMN "public"."rd_business_years"."credits_locked_by" IS 'Who locked the credit values';



COMMENT ON COLUMN "public"."rd_business_years"."credits_locked_at" IS 'When the credit values were locked';



CREATE TABLE IF NOT EXISTS "public"."rd_businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "ein" "text",
    "start_year" integer NOT NULL,
    "domicile_state" "text" NOT NULL,
    "contact_info" "jsonb" NOT NULL,
    "is_controlled_grp" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "historical_data" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "website" "text",
    "image_path" "text",
    "entity_type" "public"."entity_type" DEFAULT 'OTHER'::"public"."entity_type" NOT NULL,
    "naics" character varying(10),
    "category_id" "uuid",
    "github_token" "text",
    "portal_email" "text",
    CONSTRAINT "check_historical_data_structure" CHECK ("public"."validate_historical_data"("historical_data"))
);


ALTER TABLE "public"."rd_businesses" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rd_businesses"."ein" IS 'Employer Identification Number (EIN) - nullable because businesses may not have EIN during initial enrollment';



COMMENT ON COLUMN "public"."rd_businesses"."historical_data" IS 'JSON array of historical data objects with structure: [{"year": 2020, "gross_receipts": 1000000, "qre": 50000}, ...] Used for R&D tax credit base period calculations.';



COMMENT ON COLUMN "public"."rd_businesses"."website" IS 'Business website URL';



COMMENT ON COLUMN "public"."rd_businesses"."image_path" IS 'Path to company logo image in storage - publicly accessible URL';



COMMENT ON COLUMN "public"."rd_businesses"."category_id" IS 'Business research category - determines report type (Healthcare vs Software)';



COMMENT ON COLUMN "public"."rd_businesses"."github_token" IS 'Client-specific GitHub access token for Software R&D repository analysis';



COMMENT ON COLUMN "public"."rd_businesses"."portal_email" IS 'Override email address for client portal access and magic link generation. If set, this email will be used instead of the client email.';



CREATE TABLE IF NOT EXISTS "public"."rd_client_portal_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "token" character varying(255),
    "expires_at" timestamp without time zone,
    "created_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "access_count" integer DEFAULT 0,
    "last_accessed_at" timestamp without time zone,
    "last_accessed_ip" "inet"
);


ALTER TABLE "public"."rd_client_portal_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."rd_client_portal_tokens" IS 'Secure tokens for client portal access';



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


CREATE TABLE IF NOT EXISTS "public"."rd_document_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "link_type" "text" NOT NULL,
    "supply_id" "uuid",
    "contractor_id" "uuid",
    "amount_allocated" numeric(15,2),
    "allocation_percentage" numeric(5,2),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "rd_document_links_link_type_check" CHECK (("link_type" = ANY (ARRAY['supply'::"text", 'contractor'::"text"]))),
    CONSTRAINT "valid_link" CHECK (((("link_type" = 'supply'::"text") AND ("supply_id" IS NOT NULL) AND ("contractor_id" IS NULL)) OR (("link_type" = 'contractor'::"text") AND ("contractor_id" IS NOT NULL) AND ("supply_id" IS NULL))))
);


ALTER TABLE "public"."rd_document_links" OWNER TO "postgres";


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
    "user_id" "uuid",
    "type" "text"
);


ALTER TABLE "public"."rd_employee_year_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "role_id" "uuid",
    "is_owner" boolean DEFAULT false,
    "annual_wage" numeric(15,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_name" "text",
    "user_id" "uuid"
);


ALTER TABLE "public"."rd_employees" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rd_employees"."role_id" IS 'Role assignment for employee - nullable to allow employees without assigned roles';



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


CREATE TABLE IF NOT EXISTS "public"."rd_federal_credit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "research_activity_id" "uuid",
    "research_activity_name" "text",
    "direct_research_wages" numeric(15,2) DEFAULT 0,
    "supplies_expenses" numeric(15,2) DEFAULT 0,
    "contractor_expenses" numeric(15,2) DEFAULT 0,
    "total_qre" numeric(15,2) DEFAULT 0,
    "subcomponent_count" integer DEFAULT 0,
    "subcomponent_groups" "text",
    "applied_percent" numeric(5,2) DEFAULT 0,
    "line_49f_description" "text",
    "ai_generation_timestamp" timestamp without time zone,
    "ai_prompt_used" "text",
    "ai_response_raw" "text",
    "federal_credit_amount" numeric(15,2) DEFAULT 0,
    "federal_credit_percentage" numeric(5,2) DEFAULT 0,
    "calculation_method" "text",
    "industry_type" "text",
    "focus_area" "text",
    "general_description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "version" integer DEFAULT 1,
    "is_latest" boolean DEFAULT true,
    "previous_version_id" "uuid",
    "calculation_timestamp" timestamp without time zone DEFAULT "now"(),
    "data_snapshot" "jsonb",
    "notes" "text",
    CONSTRAINT "valid_amounts" CHECK ((("direct_research_wages" >= (0)::numeric) AND ("supplies_expenses" >= (0)::numeric) AND ("contractor_expenses" >= (0)::numeric))),
    CONSTRAINT "valid_percentages" CHECK ((("applied_percent" >= (0)::numeric) AND ("applied_percent" <= (100)::numeric))),
    CONSTRAINT "valid_subcomponent_count" CHECK (("subcomponent_count" >= 0))
);


ALTER TABLE "public"."rd_federal_credit" OWNER TO "postgres";


COMMENT ON TABLE "public"."rd_federal_credit" IS 'Audit log and snapshot table for R&D federal credit calculations';



COMMENT ON COLUMN "public"."rd_federal_credit"."line_49f_description" IS 'AI-generated description for Form 6765 Line 49(f)';



COMMENT ON COLUMN "public"."rd_federal_credit"."version" IS 'Version number for tracking changes';



COMMENT ON COLUMN "public"."rd_federal_credit"."is_latest" IS 'Flag indicating if this is the most recent version';



COMMENT ON COLUMN "public"."rd_federal_credit"."data_snapshot" IS 'JSON snapshot of all calculation inputs and intermediate values';



CREATE OR REPLACE VIEW "public"."rd_federal_credit_latest" AS
 SELECT "rd_federal_credit"."id",
    "rd_federal_credit"."business_year_id",
    "rd_federal_credit"."client_id",
    "rd_federal_credit"."research_activity_id",
    "rd_federal_credit"."research_activity_name",
    "rd_federal_credit"."direct_research_wages",
    "rd_federal_credit"."supplies_expenses",
    "rd_federal_credit"."contractor_expenses",
    "rd_federal_credit"."total_qre",
    "rd_federal_credit"."subcomponent_count",
    "rd_federal_credit"."subcomponent_groups",
    "rd_federal_credit"."applied_percent",
    "rd_federal_credit"."line_49f_description",
    "rd_federal_credit"."ai_generation_timestamp",
    "rd_federal_credit"."ai_prompt_used",
    "rd_federal_credit"."ai_response_raw",
    "rd_federal_credit"."federal_credit_amount",
    "rd_federal_credit"."federal_credit_percentage",
    "rd_federal_credit"."calculation_method",
    "rd_federal_credit"."industry_type",
    "rd_federal_credit"."focus_area",
    "rd_federal_credit"."general_description",
    "rd_federal_credit"."created_at",
    "rd_federal_credit"."updated_at",
    "rd_federal_credit"."created_by",
    "rd_federal_credit"."updated_by",
    "rd_federal_credit"."version",
    "rd_federal_credit"."is_latest",
    "rd_federal_credit"."previous_version_id",
    "rd_federal_credit"."calculation_timestamp",
    "rd_federal_credit"."data_snapshot",
    "rd_federal_credit"."notes"
   FROM "public"."rd_federal_credit"
  WHERE ("rd_federal_credit"."is_latest" = true);


ALTER TABLE "public"."rd_federal_credit_latest" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."rd_procedure_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "procedure_code" "text" NOT NULL,
    "procedure_description" "text",
    "procedure_category" "text",
    "billed_units" integer DEFAULT 0,
    "billed_amount" numeric(15,2) DEFAULT 0,
    "frequency_annual" integer,
    "ai_confidence_score" numeric(3,2),
    "extraction_method" "text" DEFAULT 'ai'::"text",
    "raw_data" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "rd_procedure_analysis_ai_confidence_score_check" CHECK ((("ai_confidence_score" >= (0)::numeric) AND ("ai_confidence_score" <= (1)::numeric))),
    CONSTRAINT "rd_procedure_analysis_extraction_method_check" CHECK (("extraction_method" = ANY (ARRAY['ai'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."rd_procedure_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_procedure_research_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "procedure_analysis_id" "uuid" NOT NULL,
    "research_activity_id" "uuid" NOT NULL,
    "subcomponent_id" "uuid",
    "allocation_percentage" numeric(5,2) NOT NULL,
    "estimated_research_time_hours" numeric(10,2),
    "ai_reasoning" "text",
    "ai_confidence_score" numeric(3,2),
    "status" "text" DEFAULT 'pending'::"text",
    "manual_override" boolean DEFAULT false,
    "approved_by" "uuid",
    "approval_notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "rd_procedure_research_links_ai_confidence_score_check" CHECK ((("ai_confidence_score" >= (0)::numeric) AND ("ai_confidence_score" <= (1)::numeric))),
    CONSTRAINT "rd_procedure_research_links_allocation_percentage_check" CHECK ((("allocation_percentage" > (0)::numeric) AND ("allocation_percentage" <= (100)::numeric))),
    CONSTRAINT "rd_procedure_research_links_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'modified'::"text"])))
);


ALTER TABLE "public"."rd_procedure_research_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_qc_document_controls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "document_type" character varying(50) NOT NULL,
    "is_released" boolean DEFAULT false,
    "released_at" timestamp without time zone,
    "released_by" "uuid",
    "release_notes" "text",
    "requires_jurat" boolean DEFAULT false,
    "requires_payment" boolean DEFAULT false,
    "qc_reviewer" "uuid",
    "qc_reviewed_at" timestamp without time zone,
    "qc_review_notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "qc_approver_name" "text",
    "qc_approver_credentials" "text",
    "qc_approved_date" timestamp with time zone,
    "qc_approver_ip_address" "text"
);


ALTER TABLE "public"."rd_qc_document_controls" OWNER TO "postgres";


COMMENT ON TABLE "public"."rd_qc_document_controls" IS 'Quality control and document release management';



COMMENT ON COLUMN "public"."rd_qc_document_controls"."qc_approver_name" IS 'Name of the QC approver';



COMMENT ON COLUMN "public"."rd_qc_document_controls"."qc_approver_credentials" IS 'Credentials/title of the QC approver';



COMMENT ON COLUMN "public"."rd_qc_document_controls"."qc_approved_date" IS 'Date when QC was approved';



COMMENT ON COLUMN "public"."rd_qc_document_controls"."qc_approver_ip_address" IS 'IP address of the QC approver for audit trail';



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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "generated_html" "text",
    "filing_guide" "text",
    "state_gross_receipts" "jsonb" DEFAULT '{}'::"jsonb",
    "qc_approved_by" "text",
    "qc_approved_at" timestamp with time zone,
    "qc_approver_ip" "text"
);


ALTER TABLE "public"."rd_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."rd_reports" IS 'R&D research reports with basic RLS policies for authenticated users';



COMMENT ON COLUMN "public"."rd_reports"."generated_html" IS 'Complete HTML of the generated research report for client access and archival';



COMMENT ON COLUMN "public"."rd_reports"."state_gross_receipts" IS 'Stores state-specific gross receipts data by year for state credit calculations. Format: {"2024": 1000000, "2023": 950000, "2022": 900000, "2021": 850000}';



COMMENT ON COLUMN "public"."rd_reports"."qc_approved_by" IS 'Name of the person who approved the QC';



COMMENT ON COLUMN "public"."rd_reports"."qc_approved_at" IS 'Timestamp when QC was approved';



COMMENT ON COLUMN "public"."rd_reports"."qc_approver_ip" IS 'IP address of the QC approver for audit trail';



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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "deactivated_at" timestamp without time zone,
    "deactivation_reason" "text",
    "business_id" "uuid"
);


ALTER TABLE "public"."rd_research_steps" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rd_research_steps"."step_order" IS 'Numeric order for displaying steps in UI and reports. Lower numbers appear first.';



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
    "alternative_paths" "text",
    "is_active" boolean DEFAULT true,
    "deactivated_at" timestamp without time zone,
    "deactivation_reason" "text",
    "business_id" "uuid"
);


ALTER TABLE "public"."rd_research_subcomponents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "is_default" boolean DEFAULT false,
    "business_year_id" "uuid",
    "baseline_applied_percent" numeric,
    "type" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_roles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rd_roles"."type" IS 'Role type: NULL for Direct Participant, "supervisor" for Supervisor, "admin" for Admin';



COMMENT ON COLUMN "public"."rd_roles"."description" IS 'Role description explaining responsibilities and duties';



CREATE TABLE IF NOT EXISTS "public"."rd_selected_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "practice_percent" numeric(5,2) NOT NULL,
    "selected_roles" "jsonb" NOT NULL,
    "config" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "research_guidelines" "jsonb",
    "is_enabled" boolean DEFAULT true NOT NULL,
    "activity_title_snapshot" "text",
    "activity_category_snapshot" "text"
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "non_rd_percentage" numeric(5,2) DEFAULT 0,
    CONSTRAINT "rd_selected_steps_non_rd_percentage_check" CHECK ((("non_rd_percentage" >= (0)::numeric) AND ("non_rd_percentage" <= (100)::numeric)))
);


ALTER TABLE "public"."rd_selected_steps" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rd_selected_steps"."non_rd_percentage" IS 'Percentage of step time allocated to non-R&D activities (0-100)';



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
    "practice_percent" numeric(5,2) DEFAULT 0,
    "subcomponent_name_snapshot" "text",
    "step_name_snapshot" "text"
);


ALTER TABLE "public"."rd_selected_subcomponents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rd_selected_subcomponents"."time_percentage" IS 'Step percentage calculated based on number of steps in the Research Activity';



CREATE TABLE IF NOT EXISTS "public"."rd_signature_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "signer_name" "text" NOT NULL,
    "signature_image" "text" NOT NULL,
    "ip_address" "text" NOT NULL,
    "signed_at" timestamp with time zone NOT NULL,
    "jurat_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signer_title" "text",
    "signer_email" "text"
);


ALTER TABLE "public"."rd_signature_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."rd_signature_records" IS 'Records of digital signatures for jurat statements with audit trail';



COMMENT ON COLUMN "public"."rd_signature_records"."business_year_id" IS 'Reference to the business year this signature applies to';



COMMENT ON COLUMN "public"."rd_signature_records"."signer_name" IS 'Full name of the person who signed';



COMMENT ON COLUMN "public"."rd_signature_records"."signature_image" IS 'Base64 encoded signature image from canvas';



COMMENT ON COLUMN "public"."rd_signature_records"."ip_address" IS 'IP address of the signer for audit purposes';



COMMENT ON COLUMN "public"."rd_signature_records"."signed_at" IS 'Timestamp when the signature was created';



COMMENT ON COLUMN "public"."rd_signature_records"."jurat_text" IS 'The full text of the jurat statement that was signed';



COMMENT ON COLUMN "public"."rd_signature_records"."signer_title" IS 'Job title of the person who signed';



COMMENT ON COLUMN "public"."rd_signature_records"."signer_email" IS 'Email address of the person who signed';



CREATE TABLE IF NOT EXISTS "public"."rd_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid",
    "signature_type" character varying(50),
    "signed_by" character varying(255),
    "signed_at" timestamp without time zone,
    "signature_data" "jsonb",
    "ip_address" "inet",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_signatures" OWNER TO "postgres";


COMMENT ON TABLE "public"."rd_signatures" IS 'Digital signatures for jurat and other documents';



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


CREATE TABLE IF NOT EXISTS "public"."rd_state_calculations_full" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state" character varying(2) NOT NULL,
    "calculation_method" "text",
    "refundable" "text",
    "carryforward" "text",
    "eligible_entities" "text",
    "special_notes" "text",
    "start_year" "text",
    "formula_correct" "text",
    "standard_credit_formula" "text",
    "alternate_credit_formula" "text",
    "additional_credit_formula" "text",
    "end_year" "text",
    "standard_info" "text",
    "alternative_info" "text",
    "other_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_state_calculations_full" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_state_credit_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state_code" character varying(2) NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_state_credit_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_state_proforma_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "state_code" character varying(2) NOT NULL,
    "method" character varying(20) NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rd_state_proforma_data_method_check" CHECK ((("method")::"text" = ANY ((ARRAY['standard'::character varying, 'alternative'::character varying])::"text"[])))
);


ALTER TABLE "public"."rd_state_proforma_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_state_proforma_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state_proforma_id" "uuid" NOT NULL,
    "line_number" character varying(10) NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(15,2) DEFAULT 0,
    "is_editable" boolean DEFAULT true,
    "is_calculated" boolean DEFAULT false,
    "calculation_formula" "text",
    "line_type" character varying(50),
    "sort_order" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_state_proforma_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rd_state_proformas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "state_code" character varying(2) NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "total_credit" numeric(15,2) DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."rd_state_proformas" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."rd_support_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_year_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" bigint,
    "mime_type" "text",
    "upload_date" timestamp without time zone DEFAULT "now"(),
    "uploaded_by" "uuid",
    "processing_status" "text" DEFAULT 'pending'::"text",
    "ai_analysis" "jsonb",
    "metadata" "jsonb",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "rd_support_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['invoice'::"text", '1099'::"text", 'procedure_report'::"text"]))),
    CONSTRAINT "rd_support_documents_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'manual_review'::"text"])))
);


ALTER TABLE "public"."rd_support_documents" OWNER TO "postgres";


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


COMMENT ON TABLE "public"."tax_calculations" IS 'Stores tax calculations with strategies for each user';



COMMENT ON COLUMN "public"."tax_calculations"."user_id" IS 'References auth.users(id)';



COMMENT ON COLUMN "public"."tax_calculations"."year" IS 'Tax year for the calculation';



COMMENT ON COLUMN "public"."tax_calculations"."tax_info" IS 'JSON object containing tax information';



COMMENT ON COLUMN "public"."tax_calculations"."breakdown" IS 'JSON object containing tax breakdown';



COMMENT ON COLUMN "public"."tax_calculations"."strategies" IS 'JSON array containing enabled tax strategies';



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


COMMENT ON COLUMN "public"."tax_profiles"."phone" IS 'Phone number for the tax profile';



CREATE TABLE IF NOT EXISTS "public"."tax_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "affiliate_id" "text",
    "client_id" "text",
    "client_name" "text",
    "year" integer NOT NULL,
    "tax_info" "jsonb" NOT NULL,
    "proposed_strategies" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_savings" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tax_proposals_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'proposed'::"text", 'accepted'::"text", 'rejected'::"text", 'implemented'::"text"])))
);


ALTER TABLE "public"."tax_proposals" OWNER TO "postgres";


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


COMMENT ON TABLE "public"."tool_enrollments" IS 'Tracks which clients/businesses are enrolled in which tax tools';



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


ALTER TABLE ONLY "public"."admin_client_files"
    ADD CONSTRAINT "admin_client_files_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."form_6765_overrides"
    ADD CONSTRAINT "form_6765_overrides_client_id_business_year_section_line_nu_key" UNIQUE ("client_id", "business_year", "section", "line_number");



ALTER TABLE ONLY "public"."form_6765_overrides"
    ADD CONSTRAINT "form_6765_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hire_children_details"
    ADD CONSTRAINT "hire_children_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."rd_billable_time_summary"
    ADD CONSTRAINT "rd_billable_time_summary_business_year_id_research_activity_key" UNIQUE ("business_year_id", "research_activity_id", "subcomponent_id");



ALTER TABLE ONLY "public"."rd_billable_time_summary"
    ADD CONSTRAINT "rd_billable_time_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_business_years"
    ADD CONSTRAINT "rd_business_years_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_businesses"
    ADD CONSTRAINT "rd_businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_client_portal_tokens"
    ADD CONSTRAINT "rd_client_portal_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_client_portal_tokens"
    ADD CONSTRAINT "rd_client_portal_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."rd_contractor_subcomponents"
    ADD CONSTRAINT "rd_contractor_subcomponents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_contractor_subcomponents"
    ADD CONSTRAINT "rd_contractor_subcomponents_unique" UNIQUE ("contractor_id", "subcomponent_id", "business_year_id");



ALTER TABLE ONLY "public"."rd_contractor_year_data"
    ADD CONSTRAINT "rd_contractor_year_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_contractors"
    ADD CONSTRAINT "rd_contractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_document_links"
    ADD CONSTRAINT "rd_document_links_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."rd_federal_credit"
    ADD CONSTRAINT "rd_federal_credit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_federal_credit_results"
    ADD CONSTRAINT "rd_federal_credit_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_federal_credit_results"
    ADD CONSTRAINT "rd_federal_credit_results_unique" UNIQUE ("business_year_id");



ALTER TABLE ONLY "public"."rd_focuses"
    ADD CONSTRAINT "rd_focuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_procedure_analysis"
    ADD CONSTRAINT "rd_procedure_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_procedure_research_links"
    ADD CONSTRAINT "rd_procedure_research_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_qc_document_controls"
    ADD CONSTRAINT "rd_qc_document_controls_business_year_id_document_type_key" UNIQUE ("business_year_id", "document_type");



ALTER TABLE ONLY "public"."rd_qc_document_controls"
    ADD CONSTRAINT "rd_qc_document_controls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_reports"
    ADD CONSTRAINT "rd_reports_business_year_type_unique" UNIQUE ("business_year_id", "type");



COMMENT ON CONSTRAINT "rd_reports_business_year_type_unique" ON "public"."rd_reports" IS 'Ensures only one report per business year and type combination - supports ON CONFLICT for upsert operations';



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



ALTER TABLE ONLY "public"."rd_signature_records"
    ADD CONSTRAINT "rd_signature_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_signatures"
    ADD CONSTRAINT "rd_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_state_calculations_full"
    ADD CONSTRAINT "rd_state_calculations_full_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_state_calculations"
    ADD CONSTRAINT "rd_state_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_state_credit_configs"
    ADD CONSTRAINT "rd_state_credit_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_state_credit_configs"
    ADD CONSTRAINT "rd_state_credit_configs_state_code_key" UNIQUE ("state_code");



ALTER TABLE ONLY "public"."rd_state_proforma_data"
    ADD CONSTRAINT "rd_state_proforma_data_business_year_id_state_code_method_key" UNIQUE ("business_year_id", "state_code", "method");



ALTER TABLE ONLY "public"."rd_state_proforma_data"
    ADD CONSTRAINT "rd_state_proforma_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_state_proforma_lines"
    ADD CONSTRAINT "rd_state_proforma_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rd_state_proformas"
    ADD CONSTRAINT "rd_state_proformas_business_year_id_state_code_key" UNIQUE ("business_year_id", "state_code");



ALTER TABLE ONLY "public"."rd_state_proformas"
    ADD CONSTRAINT "rd_state_proformas_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."rd_support_documents"
    ADD CONSTRAINT "rd_support_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reinsurance_details"
    ADD CONSTRAINT "reinsurance_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."research_activities"
    ADD CONSTRAINT "research_activities_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_billable_summary_activity" ON "public"."rd_billable_time_summary" USING "btree" ("research_activity_id");



CREATE INDEX "idx_billable_summary_business_year" ON "public"."rd_billable_time_summary" USING "btree" ("business_year_id");



CREATE INDEX "idx_business_years_business_id" ON "public"."business_years" USING "btree" ("business_id");



CREATE INDEX "idx_business_years_year" ON "public"."business_years" USING "btree" ("year");



CREATE INDEX "idx_businesses_client_id" ON "public"."businesses" USING "btree" ("client_id");



CREATE INDEX "idx_businesses_entity_type" ON "public"."businesses" USING "btree" ("entity_type");



CREATE INDEX "idx_businesses_is_active" ON "public"."businesses" USING "btree" ("is_active");



CREATE INDEX "idx_centralized_businesses_created_at" ON "public"."centralized_businesses" USING "btree" ("created_at");



CREATE INDEX "idx_charitable_donation_details_strategy_detail_id" ON "public"."charitable_donation_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_clients_archived" ON "public"."clients" USING "btree" ("archived");



CREATE INDEX "idx_clients_city" ON "public"."clients" USING "btree" ("city");



CREATE INDEX "idx_clients_created_at" ON "public"."clients" USING "btree" ("created_at");



CREATE INDEX "idx_clients_created_by" ON "public"."clients" USING "btree" ("created_by");



CREATE INDEX "idx_clients_email" ON "public"."clients" USING "btree" ("email");



CREATE INDEX "idx_clients_zip_code" ON "public"."clients" USING "btree" ("zip_code");



CREATE INDEX "idx_convertible_tax_bonds_details_strategy_detail_id" ON "public"."convertible_tax_bonds_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_cost_segregation_details_strategy_detail_id" ON "public"."cost_segregation_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_document_links_contractor" ON "public"."rd_document_links" USING "btree" ("contractor_id");



CREATE INDEX "idx_document_links_doc" ON "public"."rd_document_links" USING "btree" ("document_id");



CREATE INDEX "idx_document_links_supply" ON "public"."rd_document_links" USING "btree" ("supply_id");



CREATE INDEX "idx_family_management_company_details_strategy_detail_id" ON "public"."family_management_company_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_hire_children_details_strategy_detail_id" ON "public"."hire_children_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_personal_years_client_id" ON "public"."personal_years" USING "btree" ("client_id");



CREATE INDEX "idx_personal_years_year" ON "public"."personal_years" USING "btree" ("year");



CREATE INDEX "idx_procedure_analysis_code" ON "public"."rd_procedure_analysis" USING "btree" ("procedure_code");



CREATE INDEX "idx_procedure_analysis_doc" ON "public"."rd_procedure_analysis" USING "btree" ("document_id");



CREATE INDEX "idx_procedure_links_activity" ON "public"."rd_procedure_research_links" USING "btree" ("research_activity_id");



CREATE INDEX "idx_procedure_links_status" ON "public"."rd_procedure_research_links" USING "btree" ("status");



CREATE INDEX "idx_rd_business_years_business_year" ON "public"."rd_business_years" USING "btree" ("business_id", "year");



CREATE INDEX "idx_rd_business_years_credits_locked" ON "public"."rd_business_years" USING "btree" ("credits_locked") WHERE ("credits_locked" = true);



CREATE INDEX "idx_rd_businesses_category_id" ON "public"."rd_businesses" USING "btree" ("category_id");



CREATE INDEX "idx_rd_businesses_ein" ON "public"."rd_businesses" USING "btree" ("ein") WHERE ("ein" IS NOT NULL);



CREATE INDEX "idx_rd_businesses_github_token_exists" ON "public"."rd_businesses" USING "btree" ("github_token") WHERE ("github_token" IS NOT NULL);



CREATE INDEX "idx_rd_businesses_historical_data" ON "public"."rd_businesses" USING "gin" ("historical_data");



CREATE INDEX "idx_rd_client_portal_tokens_active" ON "public"."rd_client_portal_tokens" USING "btree" ("business_id", "is_active", "expires_at") WHERE ("is_active" = true);



CREATE INDEX "idx_rd_client_portal_tokens_business" ON "public"."rd_client_portal_tokens" USING "btree" ("business_id");



CREATE INDEX "idx_rd_client_portal_tokens_business_id" ON "public"."rd_client_portal_tokens" USING "btree" ("business_id");



CREATE INDEX "idx_rd_client_portal_tokens_token" ON "public"."rd_client_portal_tokens" USING "btree" ("token");



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



CREATE INDEX "idx_rd_federal_credit_activity" ON "public"."rd_federal_credit" USING "btree" ("research_activity_id");



CREATE INDEX "idx_rd_federal_credit_business_year" ON "public"."rd_federal_credit" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_federal_credit_client" ON "public"."rd_federal_credit" USING "btree" ("client_id");



CREATE INDEX "idx_rd_federal_credit_created_at" ON "public"."rd_federal_credit" USING "btree" ("created_at");



CREATE INDEX "idx_rd_federal_credit_latest" ON "public"."rd_federal_credit" USING "btree" ("is_latest") WHERE ("is_latest" = true);



CREATE INDEX "idx_rd_federal_credit_results_business_year_id" ON "public"."rd_federal_credit_results" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_federal_credit_results_calculation_date" ON "public"."rd_federal_credit_results" USING "btree" ("calculation_date");



CREATE INDEX "idx_rd_qc_document_controls_business_year" ON "public"."rd_qc_document_controls" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_qc_document_controls_qc_approved_date" ON "public"."rd_qc_document_controls" USING "btree" ("qc_approved_date") WHERE ("qc_approved_date" IS NOT NULL);



CREATE INDEX "idx_rd_qc_document_controls_released" ON "public"."rd_qc_document_controls" USING "btree" ("is_released");



CREATE INDEX "idx_rd_qc_document_controls_type" ON "public"."rd_qc_document_controls" USING "btree" ("document_type");



CREATE INDEX "idx_rd_reports_business_year_type" ON "public"."rd_reports" USING "btree" ("business_year_id", "type");



CREATE INDEX "idx_rd_reports_html_not_null" ON "public"."rd_reports" USING "btree" ("business_year_id", "type") WHERE ("generated_html" IS NOT NULL);



CREATE INDEX "idx_rd_reports_qc_approved_at" ON "public"."rd_reports" USING "btree" ("qc_approved_at") WHERE ("qc_approved_at" IS NOT NULL);



CREATE INDEX "idx_rd_reports_state_gross_receipts" ON "public"."rd_reports" USING "gin" ("state_gross_receipts");



CREATE INDEX "idx_rd_research_activities_business_id" ON "public"."rd_research_activities" USING "btree" ("business_id");



CREATE INDEX "idx_rd_research_activities_global" ON "public"."rd_research_activities" USING "btree" ("id") WHERE ("business_id" IS NULL);



CREATE INDEX "idx_rd_research_steps_activity_id" ON "public"."rd_research_steps" USING "btree" ("research_activity_id");



CREATE INDEX "idx_rd_research_steps_activity_step_order" ON "public"."rd_research_steps" USING "btree" ("research_activity_id", "step_order");



CREATE INDEX "idx_rd_research_steps_business_id" ON "public"."rd_research_steps" USING "btree" ("business_id");



CREATE INDEX "idx_rd_research_subcomponents_business_id" ON "public"."rd_research_subcomponents" USING "btree" ("business_id");



CREATE INDEX "idx_rd_research_subcomponents_step_id" ON "public"."rd_research_subcomponents" USING "btree" ("step_id");



CREATE INDEX "idx_rd_roles_business_year_id" ON "public"."rd_roles" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_roles_is_default" ON "public"."rd_roles" USING "btree" ("is_default");



CREATE INDEX "idx_rd_roles_type" ON "public"."rd_roles" USING "btree" ("type");



CREATE UNIQUE INDEX "idx_rd_roles_unique_default_per_year" ON "public"."rd_roles" USING "btree" ("business_year_id", "is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_rd_selected_activities_business_year_activity" ON "public"."rd_selected_activities" USING "btree" ("business_year_id", "activity_id");



CREATE INDEX "idx_rd_selected_steps_activity" ON "public"."rd_selected_steps" USING "btree" ("research_activity_id");



CREATE INDEX "idx_rd_selected_steps_business_year" ON "public"."rd_selected_steps" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_selected_subcomponents_activity" ON "public"."rd_selected_subcomponents" USING "btree" ("research_activity_id");



CREATE INDEX "idx_rd_selected_subcomponents_business_year" ON "public"."rd_selected_subcomponents" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_selected_subcomponents_step" ON "public"."rd_selected_subcomponents" USING "btree" ("step_id");



CREATE INDEX "idx_rd_signature_records_business_year_id" ON "public"."rd_signature_records" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_signature_records_signed_at" ON "public"."rd_signature_records" USING "btree" ("signed_at");



CREATE INDEX "idx_rd_signatures_business_year" ON "public"."rd_signatures" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_signatures_signed_at" ON "public"."rd_signatures" USING "btree" ("signed_at");



CREATE INDEX "idx_rd_signatures_type" ON "public"."rd_signatures" USING "btree" ("signature_type");



CREATE INDEX "idx_rd_state_proforma_data_lookup" ON "public"."rd_state_proforma_data" USING "btree" ("business_year_id", "state_code", "method");



CREATE INDEX "idx_rd_supplies_business_id" ON "public"."rd_supplies" USING "btree" ("business_id");



CREATE INDEX "idx_rd_supply_subcomponents_business_year_id" ON "public"."rd_supply_subcomponents" USING "btree" ("business_year_id");



CREATE INDEX "idx_rd_supply_subcomponents_subcomponent_id" ON "public"."rd_supply_subcomponents" USING "btree" ("subcomponent_id");



CREATE INDEX "idx_rd_supply_subcomponents_supply_id" ON "public"."rd_supply_subcomponents" USING "btree" ("supply_id");



CREATE INDEX "idx_reinsurance_details_strategy_detail_id" ON "public"."reinsurance_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_state_calculations_active" ON "public"."rd_state_calculations" USING "btree" ("is_active");



CREATE INDEX "idx_state_calculations_state" ON "public"."rd_state_calculations" USING "btree" ("state");



CREATE UNIQUE INDEX "idx_state_calculations_unique" ON "public"."rd_state_calculations" USING "btree" ("state", "start_year") WHERE ("is_active" = true);



CREATE INDEX "idx_state_calculations_year" ON "public"."rd_state_calculations" USING "btree" ("start_year", "end_year");



CREATE INDEX "idx_state_credit_configs_state_code" ON "public"."rd_state_credit_configs" USING "btree" ("state_code");



CREATE INDEX "idx_state_proforma_lines_state_proforma_id" ON "public"."rd_state_proforma_lines" USING "btree" ("state_proforma_id");



CREATE INDEX "idx_state_proformas_business_year" ON "public"."rd_state_proformas" USING "btree" ("business_year_id");



CREATE INDEX "idx_strategy_details_proposal_id" ON "public"."strategy_details" USING "btree" ("proposal_id");



CREATE INDEX "idx_strategy_details_strategy_id" ON "public"."strategy_details" USING "btree" ("strategy_id");



CREATE INDEX "idx_support_docs_business_year" ON "public"."rd_support_documents" USING "btree" ("business_year_id");



CREATE INDEX "idx_support_docs_status" ON "public"."rd_support_documents" USING "btree" ("processing_status");



CREATE INDEX "idx_support_docs_type" ON "public"."rd_support_documents" USING "btree" ("document_type");



CREATE INDEX "idx_tax_proposals_affiliate_id" ON "public"."tax_proposals" USING "btree" ("affiliate_id");



CREATE INDEX "idx_tax_proposals_status" ON "public"."tax_proposals" USING "btree" ("status");



CREATE INDEX "idx_tax_proposals_user_id" ON "public"."tax_proposals" USING "btree" ("user_id");



CREATE INDEX "idx_tool_enrollments_business_id" ON "public"."tool_enrollments" USING "btree" ("business_id");



CREATE INDEX "idx_tool_enrollments_client_file_id" ON "public"."tool_enrollments" USING "btree" ("client_file_id");



CREATE INDEX "idx_tool_enrollments_status" ON "public"."tool_enrollments" USING "btree" ("status");



CREATE INDEX "idx_tool_enrollments_tool_slug" ON "public"."tool_enrollments" USING "btree" ("tool_slug");



CREATE UNIQUE INDEX "idx_unique_procedure_research_link" ON "public"."rd_procedure_research_links" USING "btree" ("procedure_analysis_id", "research_activity_id", "subcomponent_id");



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



CREATE OR REPLACE TRIGGER "trigger_archive_rd_federal_credit_version" AFTER INSERT ON "public"."rd_federal_credit" FOR EACH ROW EXECUTE FUNCTION "public"."archive_rd_federal_credit_version"();



CREATE OR REPLACE TRIGGER "trigger_create_strategy_details" AFTER INSERT ON "public"."tax_proposals" FOR EACH ROW EXECUTE FUNCTION "public"."create_strategy_details_for_proposal"();



CREATE OR REPLACE TRIGGER "trigger_safe_update_practice_percent" AFTER INSERT ON "public"."rd_selected_subcomponents" FOR EACH ROW EXECUTE FUNCTION "public"."safe_update_selected_subcomponent_practice_percent"();



CREATE OR REPLACE TRIGGER "trigger_update_rd_federal_credit_updated_at" BEFORE UPDATE ON "public"."rd_federal_credit" FOR EACH ROW EXECUTE FUNCTION "public"."update_rd_federal_credit_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_rd_state_proforma_data_updated_at" BEFORE UPDATE ON "public"."rd_state_proforma_data" FOR EACH ROW EXECUTE FUNCTION "public"."update_rd_state_proforma_data_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_step_name" AFTER INSERT ON "public"."rd_selected_subcomponents" FOR EACH ROW EXECUTE FUNCTION "public"."update_selected_subcomponent_step_name"();



CREATE OR REPLACE TRIGGER "trigger_update_total_qre" BEFORE INSERT OR UPDATE OF "employee_qre", "contractor_qre", "supply_qre" ON "public"."rd_business_years" FOR EACH ROW EXECUTE FUNCTION "public"."update_total_qre"();



CREATE OR REPLACE TRIGGER "update_rd_business_years_credits_calculated_at" BEFORE UPDATE OF "federal_credit", "state_credit" ON "public"."rd_business_years" FOR EACH ROW EXECUTE FUNCTION "public"."update_credits_calculated_at"();



CREATE OR REPLACE TRIGGER "update_rd_reports_updated_at" BEFORE UPDATE ON "public"."rd_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rd_roles_updated_at" BEFORE UPDATE ON "public"."rd_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rd_state_calculations_updated_at" BEFORE UPDATE ON "public"."rd_state_calculations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_client_files"
    ADD CONSTRAINT "admin_client_files_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admin_client_files"
    ADD CONSTRAINT "admin_client_files_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admin_client_files"
    ADD CONSTRAINT "admin_client_files_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."augusta_rule_details"
    ADD CONSTRAINT "augusta_rule_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_years"
    ADD CONSTRAINT "business_years_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calculations"
    ADD CONSTRAINT "calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."charitable_donation_details"
    ADD CONSTRAINT "charitable_donation_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."commission_transactions"
    ADD CONSTRAINT "commission_transactions_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commission_transactions"
    ADD CONSTRAINT "commission_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."commission_transactions"
    ADD CONSTRAINT "commission_transactions_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."convertible_tax_bonds_details"
    ADD CONSTRAINT "convertible_tax_bonds_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cost_segregation_details"
    ADD CONSTRAINT "cost_segregation_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_management_company_details"
    ADD CONSTRAINT "family_management_company_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_6765_overrides"
    ADD CONSTRAINT "form_6765_overrides_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."form_6765_overrides"
    ADD CONSTRAINT "form_6765_overrides_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."hire_children_details"
    ADD CONSTRAINT "hire_children_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_years"
    ADD CONSTRAINT "personal_years_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_assignments"
    ADD CONSTRAINT "proposal_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."proposal_assignments"
    ADD CONSTRAINT "proposal_assignments_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_timeline"
    ADD CONSTRAINT "proposal_timeline_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rd_areas"
    ADD CONSTRAINT "rd_areas_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."rd_research_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_billable_time_summary"
    ADD CONSTRAINT "rd_billable_time_summary_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_billable_time_summary"
    ADD CONSTRAINT "rd_billable_time_summary_research_activity_id_fkey" FOREIGN KEY ("research_activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_billable_time_summary"
    ADD CONSTRAINT "rd_billable_time_summary_subcomponent_id_fkey" FOREIGN KEY ("subcomponent_id") REFERENCES "public"."rd_research_subcomponents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_business_years"
    ADD CONSTRAINT "rd_business_years_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_business_years"
    ADD CONSTRAINT "rd_business_years_credits_locked_by_fkey" FOREIGN KEY ("credits_locked_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rd_business_years"
    ADD CONSTRAINT "rd_business_years_documents_released_by_fkey" FOREIGN KEY ("documents_released_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rd_business_years"
    ADD CONSTRAINT "rd_business_years_qc_approved_by_fkey" FOREIGN KEY ("qc_approved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rd_businesses"
    ADD CONSTRAINT "rd_businesses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."rd_research_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_businesses"
    ADD CONSTRAINT "rd_businesses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_client_portal_tokens"
    ADD CONSTRAINT "rd_client_portal_tokens_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id");



ALTER TABLE ONLY "public"."rd_client_portal_tokens"
    ADD CONSTRAINT "rd_client_portal_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



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
    ADD CONSTRAINT "rd_contractors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rd_document_links"
    ADD CONSTRAINT "rd_document_links_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."rd_contractor_year_data"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_document_links"
    ADD CONSTRAINT "rd_document_links_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."rd_support_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_document_links"
    ADD CONSTRAINT "rd_document_links_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "public"."rd_supply_subcomponents"("id") ON DELETE SET NULL;



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
    ADD CONSTRAINT "rd_employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rd_roles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_employees"
    ADD CONSTRAINT "rd_employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



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



ALTER TABLE ONLY "public"."rd_federal_credit"
    ADD CONSTRAINT "rd_federal_credit_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."business_years"("id");



ALTER TABLE ONLY "public"."rd_federal_credit"
    ADD CONSTRAINT "rd_federal_credit_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."rd_federal_credit"
    ADD CONSTRAINT "rd_federal_credit_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rd_federal_credit"
    ADD CONSTRAINT "rd_federal_credit_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "public"."rd_federal_credit"("id");



ALTER TABLE ONLY "public"."rd_federal_credit"
    ADD CONSTRAINT "rd_federal_credit_research_activity_id_fkey" FOREIGN KEY ("research_activity_id") REFERENCES "public"."research_activities"("id");



ALTER TABLE ONLY "public"."rd_federal_credit_results"
    ADD CONSTRAINT "rd_federal_credit_results_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_federal_credit"
    ADD CONSTRAINT "rd_federal_credit_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rd_focuses"
    ADD CONSTRAINT "rd_focuses_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."rd_areas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_procedure_analysis"
    ADD CONSTRAINT "rd_procedure_analysis_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."rd_support_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_procedure_research_links"
    ADD CONSTRAINT "rd_procedure_research_links_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rd_procedure_research_links"
    ADD CONSTRAINT "rd_procedure_research_links_procedure_analysis_id_fkey" FOREIGN KEY ("procedure_analysis_id") REFERENCES "public"."rd_procedure_analysis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_procedure_research_links"
    ADD CONSTRAINT "rd_procedure_research_links_research_activity_id_fkey" FOREIGN KEY ("research_activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_procedure_research_links"
    ADD CONSTRAINT "rd_procedure_research_links_subcomponent_id_fkey" FOREIGN KEY ("subcomponent_id") REFERENCES "public"."rd_research_subcomponents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_qc_document_controls"
    ADD CONSTRAINT "rd_qc_document_controls_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_qc_document_controls"
    ADD CONSTRAINT "rd_qc_document_controls_qc_reviewer_fkey" FOREIGN KEY ("qc_reviewer") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rd_qc_document_controls"
    ADD CONSTRAINT "rd_qc_document_controls_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rd_reports"
    ADD CONSTRAINT "rd_reports_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_reports"
    ADD CONSTRAINT "rd_reports_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_research_activities"
    ADD CONSTRAINT "rd_research_activities_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_research_activities"
    ADD CONSTRAINT "rd_research_activities_focus_id_fkey" FOREIGN KEY ("focus_id") REFERENCES "public"."rd_focuses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_research_steps"
    ADD CONSTRAINT "rd_research_steps_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rd_research_steps"
    ADD CONSTRAINT "rd_research_steps_research_activity_id_fkey" FOREIGN KEY ("research_activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_research_subcomponents"
    ADD CONSTRAINT "rd_research_subcomponents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE SET NULL;



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



ALTER TABLE ONLY "public"."rd_signature_records"
    ADD CONSTRAINT "rd_signature_records_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_signatures"
    ADD CONSTRAINT "rd_signatures_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id");



ALTER TABLE ONLY "public"."rd_state_proforma_data"
    ADD CONSTRAINT "rd_state_proforma_data_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_state_proforma_lines"
    ADD CONSTRAINT "rd_state_proforma_lines_state_proforma_id_fkey" FOREIGN KEY ("state_proforma_id") REFERENCES "public"."rd_state_proformas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_subcomponents"
    ADD CONSTRAINT "rd_subcomponents_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."rd_research_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supplies"
    ADD CONSTRAINT "rd_supplies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rd_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supply_subcomponents"
    ADD CONSTRAINT "rd_supply_subcomponents_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supply_subcomponents"
    ADD CONSTRAINT "rd_supply_subcomponents_subcomponent_id_fkey" FOREIGN KEY ("subcomponent_id") REFERENCES "public"."rd_research_subcomponents"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "rd_supply_subcomponents_subcomponent_id_fkey" ON "public"."rd_supply_subcomponents" IS 'References rd_research_subcomponents.id instead of rd_subcomponents.id to align with contractor allocations';



ALTER TABLE ONLY "public"."rd_supply_subcomponents"
    ADD CONSTRAINT "rd_supply_subcomponents_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "public"."rd_supplies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supply_year_data"
    ADD CONSTRAINT "rd_supply_year_data_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_supply_year_data"
    ADD CONSTRAINT "rd_supply_year_data_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "public"."rd_supplies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_support_documents"
    ADD CONSTRAINT "rd_support_documents_business_year_id_fkey" FOREIGN KEY ("business_year_id") REFERENCES "public"."rd_business_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rd_support_documents"
    ADD CONSTRAINT "rd_support_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reinsurance_details"
    ADD CONSTRAINT "reinsurance_details_strategy_detail_id_fkey" FOREIGN KEY ("strategy_detail_id") REFERENCES "public"."strategy_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."strategy_commission_rates"
    ADD CONSTRAINT "strategy_commission_rates_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."strategy_details"
    ADD CONSTRAINT "strategy_details_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."tax_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "tax_calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tax_estimates"
    ADD CONSTRAINT "tax_estimates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_profiles"
    ADD CONSTRAINT "tax_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_proposals"
    ADD CONSTRAINT "tax_proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_enrollments"
    ADD CONSTRAINT "tool_enrollments_client_file_id_fkey" FOREIGN KEY ("client_file_id") REFERENCES "public"."admin_client_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_enrollments"
    ADD CONSTRAINT "tool_enrollments_enrolled_by_fkey" FOREIGN KEY ("enrolled_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can manage QC controls" ON "public"."rd_qc_document_controls" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admin can manage all signature records" ON "public"."rd_signature_records" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can manage portal tokens" ON "public"."rd_client_portal_tokens" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admin can view all signatures" ON "public"."rd_signatures" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can insert strategy details" ON "public"."strategy_details" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can insert tax profiles" ON "public"."tax_profiles" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all client files" ON "public"."admin_client_files" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all tool enrollments" ON "public"."tool_enrollments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update strategy details" ON "public"."strategy_details" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



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



CREATE POLICY "Allow all delete for dev" ON "public"."tax_proposals" FOR DELETE USING (true);



CREATE POLICY "Allow all for authenticated" ON "public"."rd_selected_filter" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow all for dev" ON "public"."rd_contractor_year_data" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all insert for dev" ON "public"."tax_proposals" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow all select" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Allow all select for debug" ON "public"."tax_proposals" FOR SELECT USING (true);



CREATE POLICY "Allow all select for dev" ON "public"."tax_proposals" FOR SELECT USING (true);



CREATE POLICY "Allow all update for dev" ON "public"."tax_proposals" FOR UPDATE USING (true);



CREATE POLICY "Allow authenticated users to create signatures" ON "public"."rd_signature_records" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to view signatures" ON "public"."rd_signature_records" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access to rd_research_steps" ON "public"."rd_research_steps" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access to rd_research_subcomponents" ON "public"."rd_research_subcomponents" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Anyone can create signatures via portal" ON "public"."rd_signatures" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_contractor_subcomponents" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_contractors" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_employee_subcomponents" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_expenses" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_reports" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for authenticated users" ON "public"."rd_supplies" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users" ON "public"."rd_research_steps" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable delete for authenticated users" ON "public"."rd_research_subcomponents" FOR DELETE USING (true);



CREATE POLICY "Enable delete for authenticated users only" ON "public"."rd_selected_steps" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_contractor_subcomponents" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_contractors" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_employee_subcomponents" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_expenses" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_reports" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."rd_supplies" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."rd_research_steps" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable insert for authenticated users" ON "public"."rd_research_subcomponents" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."rd_selected_steps" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable read access for all users" ON "public"."rd_research_steps" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."rd_research_subcomponents" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."rd_selected_steps" FOR SELECT USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_contractor_subcomponents" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_contractors" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_employee_subcomponents" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_expenses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_reports" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."rd_supplies" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_contractor_subcomponents" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_contractors" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_employee_subcomponents" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_expenses" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_reports" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."rd_supplies" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."rd_research_steps" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable update for authenticated users" ON "public"."rd_research_subcomponents" FOR UPDATE USING (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."rd_selected_steps" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can delete business years for their businesses" ON "public"."business_years" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."businesses"
     JOIN "public"."clients" ON (("businesses"."client_id" = "clients"."id")))
  WHERE (("businesses"."id" = "business_years"."business_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete businesses for their clients" ON "public"."businesses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "businesses"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete own calculations" ON "public"."tax_calculations" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



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



CREATE POLICY "Users can delete their own state pro forma data" ON "public"."rd_state_proforma_data" FOR DELETE USING (("business_year_id" IN ( SELECT "business_years"."id"
   FROM "public"."business_years"
  WHERE ("business_years"."business_id" IN ( SELECT "rd_businesses"."id"
           FROM "public"."rd_businesses"
          WHERE ("rd_businesses"."client_id" = "auth"."uid"()))))));



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



CREATE POLICY "Users can insert own calculations" ON "public"."tax_calculations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own leads" ON "public"."leads" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own rd_federal_credit" ON "public"."rd_federal_credit" FOR INSERT WITH CHECK (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."created_by" = "auth"."uid"()))));



CREATE POLICY "Users can insert own tax profiles" ON "public"."tax_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own user preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert personal years for their clients" ON "public"."personal_years" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "personal_years"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



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



CREATE POLICY "Users can insert their own state pro forma data" ON "public"."rd_state_proforma_data" FOR INSERT WITH CHECK (("business_year_id" IN ( SELECT "business_years"."id"
   FROM "public"."business_years"
  WHERE ("business_years"."business_id" IN ( SELECT "rd_businesses"."id"
           FROM "public"."rd_businesses"
          WHERE ("rd_businesses"."client_id" = "auth"."uid"()))))));



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



CREATE POLICY "Users can insert their own tax proposals" ON "public"."tax_proposals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



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



CREATE POLICY "Users can update own calculations" ON "public"."tax_calculations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own leads" ON "public"."leads" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own rd_federal_credit" ON "public"."rd_federal_credit" FOR UPDATE USING (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."created_by" = "auth"."uid"()))));



CREATE POLICY "Users can update own tax profiles" ON "public"."tax_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own user preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update personal years for their clients" ON "public"."personal_years" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "personal_years"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



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



CREATE POLICY "Users can update their own state pro forma data" ON "public"."rd_state_proforma_data" FOR UPDATE USING (("business_year_id" IN ( SELECT "business_years"."id"
   FROM "public"."business_years"
  WHERE ("business_years"."business_id" IN ( SELECT "rd_businesses"."id"
           FROM "public"."rd_businesses"
          WHERE ("rd_businesses"."client_id" = "auth"."uid"()))))));



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



CREATE POLICY "Users can update their own tax proposals" ON "public"."tax_proposals" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view business years for their businesses" ON "public"."business_years" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."businesses"
     JOIN "public"."clients" ON (("businesses"."client_id" = "clients"."id")))
  WHERE (("businesses"."id" = "business_years"."business_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view businesses for their clients" ON "public"."businesses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "businesses"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view own calculations" ON "public"."tax_calculations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own leads" ON "public"."leads" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own rd_federal_credit" ON "public"."rd_federal_credit" FOR SELECT USING (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."created_by" = "auth"."uid"()))));



CREATE POLICY "Users can view own tax profiles" ON "public"."tax_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own user preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view personal years for their clients" ON "public"."personal_years" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "personal_years"."client_id") AND ("clients"."created_by" = "auth"."uid"())))));



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



CREATE POLICY "Users can view their own state pro forma data" ON "public"."rd_state_proforma_data" FOR SELECT USING (("business_year_id" IN ( SELECT "business_years"."id"
   FROM "public"."business_years"
  WHERE ("business_years"."business_id" IN ( SELECT "rd_businesses"."id"
           FROM "public"."rd_businesses"
          WHERE ("rd_businesses"."client_id" = "auth"."uid"()))))));



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



CREATE POLICY "Users can view their own tax proposals" ON "public"."tax_proposals" FOR SELECT USING (("auth"."uid"() = "user_id"));



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


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractor_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."convertible_tax_bonds_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cost_segregation_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_management_company_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hire_children_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_years" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_client_portal_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_contractor_year_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_employee_subcomponents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_federal_credit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_federal_credit_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_qc_document_controls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_research_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_research_subcomponents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_selected_filter" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_selected_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_signature_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_state_proforma_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rd_supplies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reinsurance_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."research_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."strategy_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supply_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_calculations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tool_enrollments" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_business_year"("p_business_id" "uuid", "p_year" integer, "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_business_year"("p_business_id" "uuid", "p_year" integer, "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_business_year"("p_business_id" "uuid", "p_year" integer, "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."archive_client"("p_client_id" "uuid", "p_archive" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."archive_client"("p_client_id" "uuid", "p_archive" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_client"("p_client_id" "uuid", "p_archive" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."archive_rd_federal_credit_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."archive_rd_federal_credit_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_rd_federal_credit_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_document_release_eligibility"("p_business_year_id" "uuid", "p_document_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."check_document_release_eligibility"("p_business_year_id" "uuid", "p_document_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_document_release_eligibility"("p_business_year_id" "uuid", "p_document_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_business_with_enrollment"("p_business_name" "text", "p_entity_type" "text", "p_client_file_id" "uuid", "p_tool_slug" "text", "p_ein" "text", "p_business_address" "text", "p_business_city" "text", "p_business_state" "text", "p_business_zip" "text", "p_business_phone" "text", "p_business_email" "text", "p_industry" "text", "p_year_established" integer, "p_annual_revenue" numeric, "p_employee_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_business_with_enrollment"("p_business_name" "text", "p_entity_type" "text", "p_client_file_id" "uuid", "p_tool_slug" "text", "p_ein" "text", "p_business_address" "text", "p_business_city" "text", "p_business_state" "text", "p_business_zip" "text", "p_business_phone" "text", "p_business_email" "text", "p_industry" "text", "p_year_established" integer, "p_annual_revenue" numeric, "p_employee_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_business_with_enrollment"("p_business_name" "text", "p_entity_type" "text", "p_client_file_id" "uuid", "p_tool_slug" "text", "p_ein" "text", "p_business_address" "text", "p_business_city" "text", "p_business_state" "text", "p_business_zip" "text", "p_business_phone" "text", "p_business_email" "text", "p_industry" "text", "p_year_established" integer, "p_annual_revenue" numeric, "p_employee_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_client_with_business"("p_full_name" "text", "p_email" "text", "p_phone" "text", "p_filing_status" "text", "p_dependents" integer, "p_home_address" "text", "p_state" "text", "p_wages_income" numeric, "p_passive_income" numeric, "p_unearned_income" numeric, "p_capital_gains" numeric, "p_household_income" numeric, "p_standard_deduction" boolean, "p_custom_deduction" numeric, "p_business_owner" boolean, "p_business_name" "text", "p_entity_type" "text", "p_business_address" "text", "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_business_annual_revenue" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_client_with_business"("p_full_name" "text", "p_email" "text", "p_phone" "text", "p_filing_status" "text", "p_dependents" integer, "p_home_address" "text", "p_state" "text", "p_wages_income" numeric, "p_passive_income" numeric, "p_unearned_income" numeric, "p_capital_gains" numeric, "p_household_income" numeric, "p_standard_deduction" boolean, "p_custom_deduction" numeric, "p_business_owner" boolean, "p_business_name" "text", "p_entity_type" "text", "p_business_address" "text", "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_business_annual_revenue" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_client_with_business"("p_full_name" "text", "p_email" "text", "p_phone" "text", "p_filing_status" "text", "p_dependents" integer, "p_home_address" "text", "p_state" "text", "p_wages_income" numeric, "p_passive_income" numeric, "p_unearned_income" numeric, "p_capital_gains" numeric, "p_household_income" numeric, "p_standard_deduction" boolean, "p_custom_deduction" numeric, "p_business_owner" boolean, "p_business_name" "text", "p_entity_type" "text", "p_business_address" "text", "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_business_annual_revenue" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_strategy_details_for_proposal"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_strategy_details_for_proposal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_strategy_details_for_proposal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enroll_client_in_tool"("p_client_file_id" "uuid", "p_business_id" "uuid", "p_tool_slug" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."enroll_client_in_tool"("p_client_file_id" "uuid", "p_business_id" "uuid", "p_tool_slug" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enroll_client_in_tool"("p_client_file_id" "uuid", "p_business_id" "uuid", "p_tool_slug" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_portal_token"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_portal_token"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_portal_token"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_base_period_years"("business_start_year" integer, "tax_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_base_period_years"("business_start_year" integer, "tax_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_base_period_years"("business_start_year" integer, "tax_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_tools"("p_client_file_id" "uuid", "p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_tools"("p_client_file_id" "uuid", "p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_tools"("p_client_file_id" "uuid", "p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_with_data"("client_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_with_data"("client_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_with_data"("client_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_client_list"("p_tool_filter" "text", "p_admin_id" "uuid", "p_affiliate_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_client_list"("p_tool_filter" "text", "p_admin_id" "uuid", "p_affiliate_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_client_list"("p_tool_filter" "text", "p_admin_id" "uuid", "p_affiliate_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_update_selected_subcomponent_practice_percent"() TO "anon";
GRANT ALL ON FUNCTION "public"."safe_update_selected_subcomponent_practice_percent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_update_selected_subcomponent_practice_percent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_business_years_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_business_years_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_business_years_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_credits_calculated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_credits_calculated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_credits_calculated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_rd_federal_credit_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_rd_federal_credit_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_rd_federal_credit_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_rd_state_proforma_data_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_rd_state_proforma_data_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_rd_state_proforma_data_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_selected_subcomponent_step_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_selected_subcomponent_step_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_selected_subcomponent_step_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_total_qre"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_total_qre"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_total_qre"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_historical_data"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_historical_data"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_historical_data"("data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_portal_token"("p_token" character varying, "p_ip_address" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_portal_token"("p_token" character varying, "p_ip_address" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_portal_token"("p_token" character varying, "p_ip_address" "inet") TO "service_role";



























GRANT ALL ON TABLE "public"."admin_client_files" TO "anon";
GRANT ALL ON TABLE "public"."admin_client_files" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_client_files" TO "service_role";



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



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



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



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."experts" TO "anon";
GRANT ALL ON TABLE "public"."experts" TO "authenticated";
GRANT ALL ON TABLE "public"."experts" TO "service_role";



GRANT ALL ON TABLE "public"."family_management_company_details" TO "anon";
GRANT ALL ON TABLE "public"."family_management_company_details" TO "authenticated";
GRANT ALL ON TABLE "public"."family_management_company_details" TO "service_role";



GRANT ALL ON TABLE "public"."form_6765_overrides" TO "anon";
GRANT ALL ON TABLE "public"."form_6765_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."form_6765_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."hire_children_details" TO "anon";
GRANT ALL ON TABLE "public"."hire_children_details" TO "authenticated";
GRANT ALL ON TABLE "public"."hire_children_details" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



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



GRANT ALL ON TABLE "public"."rd_billable_time_summary" TO "anon";
GRANT ALL ON TABLE "public"."rd_billable_time_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_billable_time_summary" TO "service_role";



GRANT ALL ON TABLE "public"."rd_business_years" TO "anon";
GRANT ALL ON TABLE "public"."rd_business_years" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_business_years" TO "service_role";



GRANT ALL ON TABLE "public"."rd_businesses" TO "anon";
GRANT ALL ON TABLE "public"."rd_businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_businesses" TO "service_role";



GRANT ALL ON TABLE "public"."rd_client_portal_tokens" TO "anon";
GRANT ALL ON TABLE "public"."rd_client_portal_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_client_portal_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."rd_contractor_subcomponents" TO "anon";
GRANT ALL ON TABLE "public"."rd_contractor_subcomponents" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_contractor_subcomponents" TO "service_role";



GRANT ALL ON TABLE "public"."rd_contractor_year_data" TO "anon";
GRANT ALL ON TABLE "public"."rd_contractor_year_data" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_contractor_year_data" TO "service_role";



GRANT ALL ON TABLE "public"."rd_contractors" TO "anon";
GRANT ALL ON TABLE "public"."rd_contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_contractors" TO "service_role";



GRANT ALL ON TABLE "public"."rd_document_links" TO "anon";
GRANT ALL ON TABLE "public"."rd_document_links" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_document_links" TO "service_role";



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



GRANT ALL ON TABLE "public"."rd_federal_credit" TO "anon";
GRANT ALL ON TABLE "public"."rd_federal_credit" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_federal_credit" TO "service_role";



GRANT ALL ON TABLE "public"."rd_federal_credit_latest" TO "anon";
GRANT ALL ON TABLE "public"."rd_federal_credit_latest" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_federal_credit_latest" TO "service_role";



GRANT ALL ON TABLE "public"."rd_federal_credit_results" TO "anon";
GRANT ALL ON TABLE "public"."rd_federal_credit_results" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_federal_credit_results" TO "service_role";



GRANT ALL ON TABLE "public"."rd_procedure_analysis" TO "anon";
GRANT ALL ON TABLE "public"."rd_procedure_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_procedure_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."rd_procedure_research_links" TO "anon";
GRANT ALL ON TABLE "public"."rd_procedure_research_links" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_procedure_research_links" TO "service_role";



GRANT ALL ON TABLE "public"."rd_qc_document_controls" TO "anon";
GRANT ALL ON TABLE "public"."rd_qc_document_controls" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_qc_document_controls" TO "service_role";



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



GRANT ALL ON TABLE "public"."rd_signature_records" TO "anon";
GRANT ALL ON TABLE "public"."rd_signature_records" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_signature_records" TO "service_role";



GRANT ALL ON TABLE "public"."rd_signatures" TO "anon";
GRANT ALL ON TABLE "public"."rd_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_signatures" TO "service_role";



GRANT ALL ON TABLE "public"."rd_state_calculations" TO "anon";
GRANT ALL ON TABLE "public"."rd_state_calculations" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_state_calculations" TO "service_role";



GRANT ALL ON TABLE "public"."rd_state_calculations_full" TO "anon";
GRANT ALL ON TABLE "public"."rd_state_calculations_full" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_state_calculations_full" TO "service_role";



GRANT ALL ON TABLE "public"."rd_state_credit_configs" TO "anon";
GRANT ALL ON TABLE "public"."rd_state_credit_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_state_credit_configs" TO "service_role";



GRANT ALL ON TABLE "public"."rd_state_proforma_data" TO "anon";
GRANT ALL ON TABLE "public"."rd_state_proforma_data" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_state_proforma_data" TO "service_role";



GRANT ALL ON TABLE "public"."rd_state_proforma_lines" TO "anon";
GRANT ALL ON TABLE "public"."rd_state_proforma_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_state_proforma_lines" TO "service_role";



GRANT ALL ON TABLE "public"."rd_state_proformas" TO "anon";
GRANT ALL ON TABLE "public"."rd_state_proformas" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_state_proformas" TO "service_role";



GRANT ALL ON TABLE "public"."rd_supplies" TO "anon";
GRANT ALL ON TABLE "public"."rd_supplies" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_supplies" TO "service_role";



GRANT ALL ON TABLE "public"."rd_supply_subcomponents" TO "anon";
GRANT ALL ON TABLE "public"."rd_supply_subcomponents" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_supply_subcomponents" TO "service_role";



GRANT ALL ON TABLE "public"."rd_supply_year_data" TO "anon";
GRANT ALL ON TABLE "public"."rd_supply_year_data" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_supply_year_data" TO "service_role";



GRANT ALL ON TABLE "public"."rd_support_documents" TO "anon";
GRANT ALL ON TABLE "public"."rd_support_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."rd_support_documents" TO "service_role";



GRANT ALL ON TABLE "public"."reinsurance_details" TO "anon";
GRANT ALL ON TABLE "public"."reinsurance_details" TO "authenticated";
GRANT ALL ON TABLE "public"."reinsurance_details" TO "service_role";



GRANT ALL ON TABLE "public"."research_activities" TO "anon";
GRANT ALL ON TABLE "public"."research_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."research_activities" TO "service_role";



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



GRANT ALL ON TABLE "public"."tool_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."tool_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
