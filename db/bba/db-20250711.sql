

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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


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



CREATE INDEX "idx_family_management_company_details_strategy_detail_id" ON "public"."family_management_company_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_hire_children_details_strategy_detail_id" ON "public"."hire_children_details" USING "btree" ("strategy_detail_id");



CREATE INDEX "idx_personal_years_client_id" ON "public"."personal_years" USING "btree" ("client_id");



CREATE INDEX "idx_personal_years_year" ON "public"."personal_years" USING "btree" ("year");



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



CREATE INDEX "idx_state_calculations_active" ON "public"."rd_state_calculations" USING "btree" ("is_active");



CREATE INDEX "idx_state_calculations_state" ON "public"."rd_state_calculations" USING "btree" ("state");



CREATE UNIQUE INDEX "idx_state_calculations_unique" ON "public"."rd_state_calculations" USING "btree" ("state", "start_year") WHERE ("is_active" = true);



CREATE INDEX "idx_state_calculations_year" ON "public"."rd_state_calculations" USING "btree" ("start_year", "end_year");



CREATE INDEX "idx_strategy_details_proposal_id" ON "public"."strategy_details" USING "btree" ("proposal_id");



CREATE INDEX "idx_strategy_details_strategy_id" ON "public"."strategy_details" USING "btree" ("strategy_id");



CREATE INDEX "idx_tax_proposals_affiliate_id" ON "public"."tax_proposals" USING "btree" ("affiliate_id");



CREATE INDEX "idx_tax_proposals_status" ON "public"."tax_proposals" USING "btree" ("status");



CREATE INDEX "idx_tax_proposals_user_id" ON "public"."tax_proposals" USING "btree" ("user_id");



CREATE INDEX "idx_tool_enrollments_business_id" ON "public"."tool_enrollments" USING "btree" ("business_id");



CREATE INDEX "idx_tool_enrollments_client_file_id" ON "public"."tool_enrollments" USING "btree" ("client_file_id");



CREATE INDEX "idx_tool_enrollments_status" ON "public"."tool_enrollments" USING "btree" ("status");



CREATE INDEX "idx_tool_enrollments_tool_slug" ON "public"."tool_enrollments" USING "btree" ("tool_slug");



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



CREATE OR REPLACE TRIGGER "trigger_create_strategy_details" AFTER INSERT ON "public"."tax_proposals" FOR EACH ROW EXECUTE FUNCTION "public"."create_strategy_details_for_proposal"();



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
    ADD CONSTRAINT "rd_contractors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



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



CREATE POLICY "Allow read access to rd_research_steps" ON "public"."rd_research_steps" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access to rd_research_subcomponents" ON "public"."rd_research_subcomponents" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



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



CREATE POLICY "Users can update own leads" ON "public"."leads" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



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



CREATE POLICY "Users can view own leads" ON "public"."leads" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



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


ALTER TABLE "public"."strategy_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supply_expenses" ENABLE ROW LEVEL SECURITY;


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



GRANT ALL ON FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_base_amount"("business_id" "uuid", "tax_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_household_income"("p_user_id" "uuid", "p_year" integer) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_business_year"("p_year_id" "uuid", "p_is_active" boolean, "p_ordinary_k1_income" numeric, "p_guaranteed_k1_income" numeric, "p_annual_revenue" numeric, "p_employee_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_business_years_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_business_years_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_business_years_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_historical_data"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_historical_data"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_historical_data"("data" "jsonb") TO "service_role";


















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
