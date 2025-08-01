--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5 (Homebrew)

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

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: pgsodium; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgsodium;


--
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;


--
-- Name: EXTENSION pgsodium; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgsodium IS 'Pgsodium is a modern cryptography library for Postgres.';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: entity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.entity_type AS ENUM (
    'LLC',
    'SCORP',
    'CCORP',
    'PARTNERSHIP',
    'SOLEPROP',
    'OTHER'
);


--
-- Name: qc_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.qc_status_enum AS ENUM (
    'pending',
    'in_review',
    'ready_for_review',
    'approved',
    'requires_changes',
    'complete'
);


--
-- Name: rd_report_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rd_report_type AS ENUM (
    'RESEARCH_DESIGN',
    'RESEARCH_SUMMARY',
    'FILING_GUIDE'
);


--
-- Name: role_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_type AS ENUM (
    'ADMIN',
    'CLIENT',
    'STAFF'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: add_business_year(uuid, integer, boolean, numeric, numeric, numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_business_year(p_business_id uuid, p_year integer, p_is_active boolean DEFAULT true, p_ordinary_k1_income numeric DEFAULT 0, p_guaranteed_k1_income numeric DEFAULT 0, p_annual_revenue numeric DEFAULT 0, p_employee_count integer DEFAULT 0) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: archive_client(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.archive_client(p_client_id uuid, p_archive boolean DEFAULT true) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Update the clients table to set archived status
    UPDATE clients 
    SET 
        archived = p_archive, 
        archived_at = CASE 
            WHEN p_archive THEN NOW() 
            ELSE NULL 
        END,
        updated_at = NOW()
    WHERE id = p_client_id;
    
    -- Return true if a row was found and updated
    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and return false
        RAISE NOTICE 'Error archiving client %: %', p_client_id, SQLERRM;
        RETURN FALSE;
END;
$$;


--
-- Name: FUNCTION archive_client(p_client_id uuid, p_archive boolean); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.archive_client(p_client_id uuid, p_archive boolean) IS 'Archives or unarchives a client by setting the archived flag and timestamp';


--
-- Name: archive_rd_federal_credit_version(); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: calculate_base_amount(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_base_amount(business_id uuid, tax_year integer) RETURNS numeric
    LANGUAGE plpgsql
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


--
-- Name: calculate_household_income(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_household_income(p_user_id uuid, p_year integer) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: check_document_release_eligibility(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying) RETURNS TABLE(can_release boolean, reason text, jurat_signed boolean, payment_received boolean, qc_approved boolean)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying) IS 'Checks if documents can be released based on business rules';


--
-- Name: create_business_with_enrollment(text, text, uuid, text, text, text, text, text, text, text, text, text, integer, numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_business_with_enrollment(p_business_name text, p_entity_type text, p_client_file_id uuid, p_tool_slug text, p_ein text DEFAULT NULL::text, p_business_address text DEFAULT NULL::text, p_business_city text DEFAULT NULL::text, p_business_state text DEFAULT NULL::text, p_business_zip text DEFAULT NULL::text, p_business_phone text DEFAULT NULL::text, p_business_email text DEFAULT NULL::text, p_industry text DEFAULT NULL::text, p_year_established integer DEFAULT NULL::integer, p_annual_revenue numeric DEFAULT NULL::numeric, p_employee_count integer DEFAULT NULL::integer) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION create_business_with_enrollment(p_business_name text, p_entity_type text, p_client_file_id uuid, p_tool_slug text, p_ein text, p_business_address text, p_business_city text, p_business_state text, p_business_zip text, p_business_phone text, p_business_email text, p_industry text, p_year_established integer, p_annual_revenue numeric, p_employee_count integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_business_with_enrollment(p_business_name text, p_entity_type text, p_client_file_id uuid, p_tool_slug text, p_ein text, p_business_address text, p_business_city text, p_business_state text, p_business_zip text, p_business_phone text, p_business_email text, p_industry text, p_year_established integer, p_annual_revenue numeric, p_employee_count integer) IS 'Creates a new business and enrolls it in a tax tool';


--
-- Name: create_client_with_business(text, text, text, text, integer, text, text, numeric, numeric, numeric, numeric, numeric, boolean, numeric, boolean, text, text, text, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_client_with_business(p_full_name text, p_email text, p_phone text DEFAULT NULL::text, p_filing_status text DEFAULT 'single'::text, p_dependents integer DEFAULT 0, p_home_address text DEFAULT NULL::text, p_state text DEFAULT 'NV'::text, p_wages_income numeric DEFAULT 0, p_passive_income numeric DEFAULT 0, p_unearned_income numeric DEFAULT 0, p_capital_gains numeric DEFAULT 0, p_household_income numeric DEFAULT 0, p_standard_deduction boolean DEFAULT true, p_custom_deduction numeric DEFAULT 0, p_business_owner boolean DEFAULT false, p_business_name text DEFAULT NULL::text, p_entity_type text DEFAULT NULL::text, p_business_address text DEFAULT NULL::text, p_ordinary_k1_income numeric DEFAULT 0, p_guaranteed_k1_income numeric DEFAULT 0, p_business_annual_revenue numeric DEFAULT 0) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: create_strategy_details_for_proposal(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_strategy_details_for_proposal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- This function will be called when a proposal is created
  -- It will parse the proposed_strategies JSON and create corresponding strategy_details records
  RETURN NEW;
END;
$$;


--
-- Name: enroll_client_in_tool(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, p_tool_slug text, p_notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, p_tool_slug text, p_notes text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, p_tool_slug text, p_notes text) IS 'Enrolls a client/business in a tax tool';


--
-- Name: generate_portal_token(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_portal_token(p_business_id uuid) RETURNS TABLE(token character varying, expires_at timestamp without time zone)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: get_base_period_years(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_base_period_years(business_start_year integer, tax_year integer) RETURNS integer[]
    LANGUAGE plpgsql
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


--
-- Name: get_client_tools(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_tools(p_client_file_id uuid, p_business_id uuid DEFAULT NULL::uuid) RETURNS TABLE(tool_slug text, tool_name text, status text, enrolled_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION get_client_tools(p_client_file_id uuid, p_business_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_client_tools(p_client_file_id uuid, p_business_id uuid) IS 'Returns all tools a client is enrolled in';


--
-- Name: get_client_with_data(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_with_data(client_uuid uuid) RETURNS json
    LANGUAGE plpgsql
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


--
-- Name: get_unified_client_list(text, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unified_client_list(p_tool_filter text DEFAULT NULL::text, p_admin_id uuid DEFAULT NULL::uuid, p_affiliate_id uuid DEFAULT NULL::uuid) RETURNS TABLE(client_file_id uuid, business_id uuid, admin_id uuid, affiliate_id uuid, archived boolean, created_at timestamp with time zone, full_name text, email text, business_name text, entity_type text, tool_slug text, tool_status text, total_income numeric, filing_status text)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION get_unified_client_list(p_tool_filter text, p_admin_id uuid, p_affiliate_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_unified_client_list(p_tool_filter text, p_admin_id uuid, p_affiliate_id uuid) IS 'Returns unified client list with filtering options';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$;


--
-- Name: safe_update_selected_subcomponent_practice_percent(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.safe_update_selected_subcomponent_practice_percent() RETURNS trigger
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


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_business_year(uuid, boolean, numeric, numeric, numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_business_year(p_year_id uuid, p_is_active boolean DEFAULT NULL::boolean, p_ordinary_k1_income numeric DEFAULT NULL::numeric, p_guaranteed_k1_income numeric DEFAULT NULL::numeric, p_annual_revenue numeric DEFAULT NULL::numeric, p_employee_count integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: update_business_years_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_business_years_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_completion_percentage(); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: update_credits_calculated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_credits_calculated_at() RETURNS trigger
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


--
-- Name: update_rd_federal_credit_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_rd_federal_credit_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_rd_state_proforma_data_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_rd_state_proforma_data_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_selected_subcomponent_step_name(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_selected_subcomponent_step_name() RETURNS trigger
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


--
-- Name: update_total_qre(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_total_qre() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.total_qre = COALESCE(NEW.employee_qre, 0) + COALESCE(NEW.contractor_qre, 0) + COALESCE(NEW.supply_qre, 0);
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: validate_historical_data(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_historical_data(data jsonb) RETURNS boolean
    LANGUAGE plpgsql
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


--
-- Name: validate_portal_token(character varying, inet); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_portal_token(p_token character varying, p_ip_address inet DEFAULT NULL::inet) RETURNS TABLE(is_valid boolean, business_id uuid, business_name text, expires_at timestamp without time zone, message text)
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


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: secrets_encrypt_secret_secret(); Type: FUNCTION; Schema: vault; Owner: -
--

CREATE FUNCTION vault.secrets_encrypt_secret_secret() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
		BEGIN
		        new.secret = CASE WHEN new.secret IS NULL THEN NULL ELSE
			CASE WHEN new.key_id IS NULL THEN NULL ELSE pg_catalog.encode(
			  pgsodium.crypto_aead_det_encrypt(
				pg_catalog.convert_to(new.secret, 'utf8'),
				pg_catalog.convert_to((new.id::text || new.description::text || new.created_at::text || new.updated_at::text)::text, 'utf8'),
				new.key_id::uuid,
				new.nonce
			  ),
				'base64') END END;
		RETURN new;
		END;
		$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: admin_client_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_client_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    admin_id uuid,
    affiliate_id uuid,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tax_profile_data jsonb,
    last_calculation_date timestamp without time zone,
    projected_savings numeric(10,2),
    archived boolean DEFAULT false,
    archived_at timestamp with time zone,
    business_id uuid,
    ordinary_k1_income numeric(15,2) DEFAULT 0,
    guaranteed_k1_income numeric(15,2) DEFAULT 0,
    household_income numeric(15,2) DEFAULT 0,
    business_annual_revenue numeric(15,2) DEFAULT 0,
    email text,
    full_name text,
    phone text,
    filing_status text,
    dependents numeric,
    home_address text,
    state text,
    wages_income numeric,
    passive_income numeric,
    unearned_income numeric,
    capital_gains numeric,
    custom_deduction numeric,
    business_owner boolean,
    business_name text,
    entity_type text,
    business_address text,
    standard_deduction boolean
);


--
-- Name: TABLE admin_client_files; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.admin_client_files IS 'Stores client files managed by admins';


--
-- Name: COLUMN admin_client_files.admin_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_client_files.admin_id IS 'The admin who created/manages this client file';


--
-- Name: COLUMN admin_client_files.affiliate_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_client_files.affiliate_id IS 'The affiliate associated with this client (if any)';


--
-- Name: COLUMN admin_client_files.tax_profile_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_client_files.tax_profile_data IS 'JSON data containing the complete tax profile';


--
-- Name: COLUMN admin_client_files.archived; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_client_files.archived IS 'Whether this client file has been archived (soft delete)';


--
-- Name: COLUMN admin_client_files.archived_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_client_files.archived_at IS 'Timestamp when this client file was archived';


--
-- Name: COLUMN admin_client_files.business_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_client_files.business_id IS 'Reference to the primary business for this client';


--
-- Name: COLUMN admin_client_files.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_client_files.email IS 'Email address of the client';


--
-- Name: COLUMN admin_client_files.full_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_client_files.full_name IS 'Full name of the client';


--
-- Name: augusta_rule_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.augusta_rule_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    strategy_detail_id uuid NOT NULL,
    days_rented integer DEFAULT 14 NOT NULL,
    daily_rate numeric(10,2) DEFAULT 1500 NOT NULL,
    total_rent numeric(12,2) DEFAULT 21000 NOT NULL,
    state_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    federal_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    fica_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    total_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    rental_dates jsonb,
    parties_info jsonb,
    rental_info jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: business_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_years (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    business_id uuid NOT NULL,
    year integer NOT NULL,
    is_active boolean DEFAULT true,
    ordinary_k1_income numeric(12,2) DEFAULT 0,
    guaranteed_k1_income numeric(12,2) DEFAULT 0,
    annual_revenue numeric(15,2) DEFAULT 0,
    employee_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: businesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.businesses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    business_name character varying(255) NOT NULL,
    entity_type character varying(50) DEFAULT 'LLC'::character varying NOT NULL,
    ein character varying(20),
    business_address text,
    business_city character varying(100),
    business_state character varying(2),
    business_zip character varying(10),
    business_phone character varying(50),
    business_email character varying(255),
    industry character varying(100),
    year_established integer,
    annual_revenue numeric(15,2) DEFAULT 0,
    employee_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: calculations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calculations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    year integer NOT NULL,
    date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    tax_info jsonb NOT NULL,
    breakdown jsonb NOT NULL,
    strategies jsonb[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: centralized_businesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.centralized_businesses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    business_name text NOT NULL,
    entity_type text NOT NULL,
    ein text,
    business_address text,
    business_city text,
    business_state text,
    business_zip text,
    business_phone text,
    business_email text,
    industry text,
    year_established integer,
    annual_revenue numeric(15,2),
    employee_count integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT centralized_businesses_entity_type_check CHECK ((entity_type = ANY (ARRAY['LLC'::text, 'S-Corp'::text, 'C-Corp'::text, 'Partnership'::text, 'Sole Proprietorship'::text, 'Other'::text])))
);


--
-- Name: charitable_donation_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.charitable_donation_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    strategy_detail_id uuid NOT NULL,
    donation_amount numeric(12,2) DEFAULT 0 NOT NULL,
    fmv_multiplier numeric(5,2) DEFAULT 5.0 NOT NULL,
    agi_limit numeric(3,2) DEFAULT 0.6 NOT NULL,
    deduction_value numeric(12,2) DEFAULT 0 NOT NULL,
    federal_savings numeric(12,2) DEFAULT 0 NOT NULL,
    state_savings numeric(12,2) DEFAULT 0 NOT NULL,
    total_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    filing_status character varying(50) DEFAULT 'single'::character varying NOT NULL,
    home_address text,
    state character varying(2),
    dependents integer DEFAULT 0,
    standard_deduction boolean DEFAULT true,
    custom_deduction numeric(12,2) DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    archived boolean DEFAULT false,
    archived_at timestamp with time zone,
    city text,
    zip_code text
);


--
-- Name: COLUMN clients.city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clients.city IS 'City of the client''s home address';


--
-- Name: COLUMN clients.zip_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clients.zip_code IS 'ZIP code of the client''s home address';


--
-- Name: commission_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    proposal_id uuid NOT NULL,
    affiliate_id uuid,
    expert_id uuid,
    transaction_type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'USD'::text,
    transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    payment_method text,
    reference_number text,
    status text DEFAULT 'pending'::text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT commission_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))),
    CONSTRAINT commission_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['expert_payment_received'::text, 'affiliate_payment_due'::text, 'affiliate_payment_sent'::text, 'admin_commission'::text])))
);


--
-- Name: contractor_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contractor_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    contractor_name text,
    amount numeric,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: convertible_tax_bonds_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.convertible_tax_bonds_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    strategy_detail_id uuid NOT NULL,
    ctb_payment numeric(12,2) DEFAULT 0 NOT NULL,
    ctb_tax_offset numeric(12,2) DEFAULT 0 NOT NULL,
    net_savings numeric(12,2) DEFAULT 0 NOT NULL,
    remaining_tax_after_ctb numeric(12,2) DEFAULT 0 NOT NULL,
    reduction_ratio numeric(5,4) DEFAULT 0.75 NOT NULL,
    total_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cost_segregation_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_segregation_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    strategy_detail_id uuid NOT NULL,
    property_value numeric(12,2) DEFAULT 0 NOT NULL,
    land_value numeric(12,2) DEFAULT 0 NOT NULL,
    improvement_value numeric(12,2) DEFAULT 0 NOT NULL,
    bonus_depreciation_rate numeric(5,4) DEFAULT 0.8 NOT NULL,
    year_acquired integer DEFAULT 2024 NOT NULL,
    current_year_deduction numeric(12,2) DEFAULT 0 NOT NULL,
    years_2_to_5_annual numeric(12,2) DEFAULT 0 NOT NULL,
    total_savings numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name text,
    role text,
    salary numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: experts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    company text,
    specialties text[] DEFAULT '{}'::text[],
    current_workload integer DEFAULT 0,
    max_capacity integer DEFAULT 10,
    commission_rate numeric(5,4) DEFAULT 0.10,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: family_management_company_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.family_management_company_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    strategy_detail_id uuid NOT NULL,
    members jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_salaries numeric(12,2) DEFAULT 0 NOT NULL,
    state_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    federal_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    fica_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    total_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: form_6765_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_6765_overrides (
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


--
-- Name: hire_children_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hire_children_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    strategy_detail_id uuid NOT NULL,
    children jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_salaries numeric(12,2) DEFAULT 0 NOT NULL,
    state_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    federal_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    fica_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    total_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    email text,
    phone text,
    status text DEFAULT 'new'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: personal_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_years (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    year integer NOT NULL,
    wages_income numeric(12,2) DEFAULT 0,
    passive_income numeric(12,2) DEFAULT 0,
    unearned_income numeric(12,2) DEFAULT 0,
    capital_gains numeric(12,2) DEFAULT 0,
    long_term_capital_gains numeric(12,2) DEFAULT 0,
    household_income numeric(12,2) DEFAULT 0,
    ordinary_income numeric(12,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    role text DEFAULT 'user'::text,
    is_admin boolean DEFAULT false,
    has_completed_tax_profile boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: proposal_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_assignments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    proposal_id uuid NOT NULL,
    expert_id uuid,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    submitted_to_expert_at timestamp with time zone,
    expert_response_at timestamp with time zone,
    expert_status text DEFAULT 'assigned'::text,
    notes text,
    priority text DEFAULT 'medium'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT proposal_assignments_expert_status_check CHECK ((expert_status = ANY (ARRAY['assigned'::text, 'contacted'::text, 'in_progress'::text, 'completed'::text, 'declined'::text]))),
    CONSTRAINT proposal_assignments_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])))
);


--
-- Name: proposal_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_timeline (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    proposal_id uuid NOT NULL,
    status_from text,
    status_to text NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: rd_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_areas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text
);


--
-- Name: rd_focuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_focuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    area_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text
);


--
-- Name: rd_research_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_research_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    focus_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    default_roles jsonb NOT NULL,
    default_steps jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    focus text,
    category text,
    area text,
    research_activity text,
    subcomponent text,
    phase text,
    step text,
    deactivated_at timestamp without time zone,
    deactivation_reason text,
    business_id uuid
);


--
-- Name: COLUMN rd_research_activities.business_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_research_activities.business_id IS 'Foreign key to rd_businesses. NULL = global activity available to all businesses. 
        Non-NULL = business-specific activity for IP protection.';


--
-- Name: rd_research_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_research_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text
);


--
-- Name: rd_subcomponents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    title text NOT NULL,
    phase text NOT NULL,
    step text,
    hint text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    general_description text,
    goal text,
    hypothesis text,
    alternatives text,
    uncertainties text,
    developmental_process text,
    primary_goal text,
    expected_outcome_type text,
    cpt_codes text,
    cdt_codes text,
    alternative_paths text
);


--
-- Name: rd_activity_hierarchy; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.rd_activity_hierarchy AS
 SELECT cat.name AS category,
    area.name AS area,
    focus.name AS focus,
    act.title AS activity_title,
    sub.title AS subcomponent_title,
    sub.phase,
    sub.step,
    sub.hint,
    sub.general_description,
    sub.goal,
    sub.hypothesis,
    sub.alternatives,
    sub.uncertainties,
    sub.developmental_process,
    sub.primary_goal,
    sub.expected_outcome_type,
    sub.cpt_codes,
    sub.cdt_codes,
    sub.alternative_paths
   FROM ((((public.rd_research_categories cat
     JOIN public.rd_areas area ON ((area.category_id = cat.id)))
     JOIN public.rd_focuses focus ON ((focus.area_id = area.id)))
     JOIN public.rd_research_activities act ON ((act.focus_id = focus.id)))
     JOIN public.rd_subcomponents sub ON ((sub.activity_id = act.id)))
  ORDER BY cat.name, area.name, focus.name, act.title, sub.step;


--
-- Name: rd_billable_time_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_billable_time_summary (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    subcomponent_id uuid,
    total_procedures_count integer DEFAULT 0,
    total_billed_units integer DEFAULT 0,
    total_billed_amount numeric(15,2) DEFAULT 0,
    estimated_total_time_hours numeric(10,2) DEFAULT 0,
    current_practice_percentage numeric(5,2),
    calculated_billable_percentage numeric(5,2),
    recommended_percentage numeric(5,2),
    percentage_variance numeric(5,2),
    last_calculated timestamp without time zone DEFAULT now(),
    calculation_source text DEFAULT 'ai_analysis'::text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: rd_business_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_business_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    year integer NOT NULL,
    gross_receipts numeric(15,2) NOT NULL,
    total_qre numeric(15,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    qc_status character varying(50) DEFAULT 'pending'::character varying,
    qc_approved_by uuid,
    qc_approved_at timestamp without time zone,
    payment_received boolean DEFAULT false,
    payment_received_at timestamp without time zone,
    qc_notes text,
    payment_amount numeric(15,2),
    documents_released boolean DEFAULT false,
    documents_released_at timestamp without time zone,
    documents_released_by uuid,
    employee_qre numeric(15,2) DEFAULT 0,
    contractor_qre numeric(15,2) DEFAULT 0,
    supply_qre numeric(15,2) DEFAULT 0,
    qre_locked boolean DEFAULT false,
    federal_credit numeric(15,2) DEFAULT 0,
    state_credit numeric(15,2) DEFAULT 0,
    credits_locked boolean DEFAULT false,
    credits_calculated_at timestamp with time zone,
    credits_locked_by uuid,
    credits_locked_at timestamp with time zone,
    business_setup_completed boolean DEFAULT false,
    business_setup_completed_at timestamp with time zone,
    business_setup_completed_by uuid,
    research_activities_completed boolean DEFAULT false,
    research_activities_completed_at timestamp with time zone,
    research_activities_completed_by uuid,
    research_design_completed boolean DEFAULT false,
    research_design_completed_at timestamp with time zone,
    research_design_completed_by uuid,
    calculations_completed boolean DEFAULT false,
    calculations_completed_at timestamp with time zone,
    calculations_completed_by uuid,
    overall_completion_percentage integer DEFAULT 0,
    last_step_completed text,
    completion_updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: COLUMN rd_business_years.employee_qre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.employee_qre IS 'Locked employee QRE value for this business year';


--
-- Name: COLUMN rd_business_years.contractor_qre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.contractor_qre IS 'Locked contractor QRE value for this business year';


--
-- Name: COLUMN rd_business_years.supply_qre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.supply_qre IS 'Locked supply QRE value for this business year';


--
-- Name: COLUMN rd_business_years.qre_locked; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.qre_locked IS 'Whether the QRE values are locked (not automatically calculated)';


--
-- Name: COLUMN rd_business_years.federal_credit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.federal_credit IS 'Federal R&D tax credit amount (editable and lockable)';


--
-- Name: COLUMN rd_business_years.state_credit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.state_credit IS 'State R&D tax credit amount (editable and lockable)';


--
-- Name: COLUMN rd_business_years.credits_locked; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.credits_locked IS 'Whether the credit values are locked from further calculation updates';


--
-- Name: COLUMN rd_business_years.credits_calculated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.credits_calculated_at IS 'When the credits were last calculated or manually updated';


--
-- Name: COLUMN rd_business_years.credits_locked_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.credits_locked_by IS 'Who locked the credit values';


--
-- Name: COLUMN rd_business_years.credits_locked_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.credits_locked_at IS 'When the credit values were locked';


--
-- Name: COLUMN rd_business_years.business_setup_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.business_setup_completed IS 'Whether the Business Setup step is completed and locked';


--
-- Name: COLUMN rd_business_years.business_setup_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.business_setup_completed_at IS 'When the Business Setup step was completed';


--
-- Name: COLUMN rd_business_years.business_setup_completed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.business_setup_completed_by IS 'Who completed the Business Setup step';


--
-- Name: COLUMN rd_business_years.research_activities_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.research_activities_completed IS 'Whether the Research Activities step is completed and locked';


--
-- Name: COLUMN rd_business_years.research_activities_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.research_activities_completed_at IS 'When the Research Activities step was completed';


--
-- Name: COLUMN rd_business_years.research_activities_completed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.research_activities_completed_by IS 'Who completed the Research Activities step';


--
-- Name: COLUMN rd_business_years.research_design_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.research_design_completed IS 'Whether the Research Design step is completed and locked';


--
-- Name: COLUMN rd_business_years.research_design_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.research_design_completed_at IS 'When the Research Design step was completed';


--
-- Name: COLUMN rd_business_years.research_design_completed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.research_design_completed_by IS 'Who completed the Research Design step';


--
-- Name: COLUMN rd_business_years.calculations_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.calculations_completed IS 'Whether the Calculations step is completed and locked';


--
-- Name: COLUMN rd_business_years.calculations_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.calculations_completed_at IS 'When the Calculations step was completed';


--
-- Name: COLUMN rd_business_years.calculations_completed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.calculations_completed_by IS 'Who completed the Calculations step';


--
-- Name: COLUMN rd_business_years.overall_completion_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.overall_completion_percentage IS 'Overall completion percentage (0-100) for progress tracking';


--
-- Name: COLUMN rd_business_years.last_step_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_business_years.last_step_completed IS 'Name of the last completed step';


--
-- Name: rd_businesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    ein text,
    start_year integer NOT NULL,
    domicile_state text NOT NULL,
    contact_info jsonb NOT NULL,
    is_controlled_grp boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    historical_data jsonb DEFAULT '[]'::jsonb NOT NULL,
    website text,
    image_path text,
    entity_type public.entity_type DEFAULT 'OTHER'::public.entity_type NOT NULL,
    naics character varying(10),
    category_id uuid,
    github_token text,
    portal_email text,
    CONSTRAINT check_historical_data_structure CHECK (public.validate_historical_data(historical_data))
);


--
-- Name: COLUMN rd_businesses.ein; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_businesses.ein IS 'Employer Identification Number (EIN) - nullable because businesses may not have EIN during initial enrollment';


--
-- Name: COLUMN rd_businesses.historical_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_businesses.historical_data IS 'JSON array of historical data objects with structure: [{"year": 2020, "gross_receipts": 1000000, "qre": 50000}, ...] Used for R&D tax credit base period calculations.';


--
-- Name: COLUMN rd_businesses.website; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_businesses.website IS 'Business website URL';


--
-- Name: COLUMN rd_businesses.image_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_businesses.image_path IS 'Path to company logo image in storage - publicly accessible URL';


--
-- Name: COLUMN rd_businesses.category_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_businesses.category_id IS 'Business research category - determines report type (Healthcare vs Software)';


--
-- Name: COLUMN rd_businesses.github_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_businesses.github_token IS 'Client-specific GitHub access token for Software R&D repository analysis';


--
-- Name: COLUMN rd_businesses.portal_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_businesses.portal_email IS 'Override email address for client portal access and magic link generation. If set, this email will be used instead of the client email.';


--
-- Name: rd_client_portal_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_client_portal_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    token character varying(255),
    expires_at timestamp without time zone,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now(),
    access_count integer DEFAULT 0,
    last_accessed_at timestamp without time zone,
    last_accessed_ip inet
);


--
-- Name: TABLE rd_client_portal_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.rd_client_portal_tokens IS 'Secure tokens for client portal access';


--
-- Name: tax_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_profiles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    standard_deduction boolean DEFAULT false,
    business_owner boolean DEFAULT false,
    full_name text,
    email text,
    filing_status text,
    dependents integer DEFAULT 0,
    home_address text,
    state text,
    wages_income numeric DEFAULT 0,
    passive_income numeric DEFAULT 0,
    unearned_income numeric DEFAULT 0,
    capital_gains numeric DEFAULT 0,
    custom_deduction numeric DEFAULT 0,
    charitable_deduction numeric DEFAULT 0,
    business_name text,
    entity_type text,
    ordinary_k1_income numeric DEFAULT 0,
    guaranteed_k1_income numeric DEFAULT 0,
    business_address text,
    deduction_limit_reached boolean DEFAULT false,
    household_income numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    phone text
);


--
-- Name: COLUMN tax_profiles.phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tax_profiles.phone IS 'Phone number for the tax profile';


--
-- Name: rd_client_progress_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.rd_client_progress_summary AS
 SELECT cb.id AS business_id,
    cb.name AS business_name,
    cb.client_id,
    p.full_name AS client_name,
    p.email AS client_email,
    tp.business_name AS tax_profile_business_name,
    by.year,
    by.business_setup_completed,
    by.research_activities_completed,
    by.research_design_completed,
    by.calculations_completed,
    by.qre_locked AS qres_completed,
    by.overall_completion_percentage,
    by.last_step_completed,
    by.completion_updated_at,
    by.qc_status
   FROM (((public.rd_businesses cb
     JOIN public.tax_profiles tp ON ((cb.client_id = tp.id)))
     LEFT JOIN public.profiles p ON ((tp.user_id = p.id)))
     LEFT JOIN public.rd_business_years by ON ((cb.id = by.business_id)))
  WHERE (by.year IS NOT NULL)
  ORDER BY p.full_name, cb.name, by.year DESC;


--
-- Name: rd_contractor_subcomponents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_contractor_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contractor_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    time_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    applied_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    baseline_applied_percent numeric(5,2) DEFAULT 0 NOT NULL,
    practice_percentage numeric(5,2),
    year_percentage numeric(5,2),
    frequency_percentage numeric(5,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    baseline_practice_percentage numeric,
    baseline_time_percentage numeric
);


--
-- Name: rd_contractor_year_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_contractor_year_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    name text NOT NULL,
    cost_amount numeric(15,2) NOT NULL,
    applied_percent numeric(5,2) NOT NULL,
    activity_link jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    contractor_id uuid,
    user_id uuid,
    activity_roles jsonb,
    calculated_qre numeric
);


--
-- Name: rd_contractors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_contractors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    role text,
    annual_cost numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    first_name text,
    last_name text,
    role_id uuid,
    is_owner boolean DEFAULT false,
    amount numeric(15,2),
    calculated_qre numeric(15,2)
);


--
-- Name: rd_document_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_document_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    link_type text NOT NULL,
    supply_id uuid,
    contractor_id uuid,
    amount_allocated numeric(15,2),
    allocation_percentage numeric(5,2),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rd_document_links_link_type_check CHECK ((link_type = ANY (ARRAY['supply'::text, 'contractor'::text]))),
    CONSTRAINT valid_link CHECK ((((link_type = 'supply'::text) AND (supply_id IS NOT NULL) AND (contractor_id IS NULL)) OR ((link_type = 'contractor'::text) AND (contractor_id IS NOT NULL) AND (supply_id IS NULL))))
);


--
-- Name: rd_employee_subcomponents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_employee_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    time_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    applied_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    baseline_applied_percent numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    practice_percentage numeric,
    year_percentage numeric,
    frequency_percentage numeric,
    baseline_practice_percentage numeric,
    baseline_time_percentage numeric,
    user_id uuid
);


--
-- Name: rd_employee_year_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_employee_year_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    applied_percent numeric(5,2) NOT NULL,
    calculated_qre numeric(15,2) NOT NULL,
    activity_roles jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    type text
);


--
-- Name: rd_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    first_name text NOT NULL,
    role_id uuid,
    is_owner boolean DEFAULT false,
    annual_wage numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_name text,
    user_id uuid
);


--
-- Name: COLUMN rd_employees.role_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_employees.role_id IS 'Role assignment for employee - nullable to allow employees without assigned roles';


--
-- Name: rd_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    step_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    employee_id uuid,
    contractor_id uuid,
    supply_id uuid,
    category text NOT NULL,
    first_name text,
    last_name text,
    role_name text,
    supply_name text,
    research_activity_title text NOT NULL,
    research_activity_practice_percent numeric(5,2) NOT NULL,
    step_name text NOT NULL,
    subcomponent_title text NOT NULL,
    subcomponent_year_percent numeric(5,2) NOT NULL,
    subcomponent_frequency_percent numeric(5,2) NOT NULL,
    subcomponent_time_percent numeric(5,2) NOT NULL,
    total_cost numeric(10,2) NOT NULL,
    applied_percent numeric(5,2) NOT NULL,
    baseline_applied_percent numeric(5,2) NOT NULL,
    employee_practice_percent numeric(5,2),
    employee_time_percent numeric(5,2),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rd_expenses_category_check CHECK ((category = ANY (ARRAY['Employee'::text, 'Contractor'::text, 'Supply'::text])))
);


--
-- Name: rd_federal_credit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_federal_credit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    client_id uuid NOT NULL,
    research_activity_id uuid,
    research_activity_name text,
    direct_research_wages numeric(15,2) DEFAULT 0,
    supplies_expenses numeric(15,2) DEFAULT 0,
    contractor_expenses numeric(15,2) DEFAULT 0,
    total_qre numeric(15,2) DEFAULT 0,
    subcomponent_count integer DEFAULT 0,
    subcomponent_groups text,
    applied_percent numeric(5,2) DEFAULT 0,
    line_49f_description text,
    ai_generation_timestamp timestamp without time zone,
    ai_prompt_used text,
    ai_response_raw text,
    federal_credit_amount numeric(15,2) DEFAULT 0,
    federal_credit_percentage numeric(5,2) DEFAULT 0,
    calculation_method text,
    industry_type text,
    focus_area text,
    general_description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    version integer DEFAULT 1,
    is_latest boolean DEFAULT true,
    previous_version_id uuid,
    calculation_timestamp timestamp without time zone DEFAULT now(),
    data_snapshot jsonb,
    notes text,
    CONSTRAINT valid_amounts CHECK (((direct_research_wages >= (0)::numeric) AND (supplies_expenses >= (0)::numeric) AND (contractor_expenses >= (0)::numeric))),
    CONSTRAINT valid_percentages CHECK (((applied_percent >= (0)::numeric) AND (applied_percent <= (100)::numeric))),
    CONSTRAINT valid_subcomponent_count CHECK ((subcomponent_count >= 0))
);


--
-- Name: TABLE rd_federal_credit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.rd_federal_credit IS 'Audit log and snapshot table for R&D federal credit calculations';


--
-- Name: COLUMN rd_federal_credit.line_49f_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_federal_credit.line_49f_description IS 'AI-generated description for Form 6765 Line 49(f)';


--
-- Name: COLUMN rd_federal_credit.version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_federal_credit.version IS 'Version number for tracking changes';


--
-- Name: COLUMN rd_federal_credit.is_latest; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_federal_credit.is_latest IS 'Flag indicating if this is the most recent version';


--
-- Name: COLUMN rd_federal_credit.data_snapshot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_federal_credit.data_snapshot IS 'JSON snapshot of all calculation inputs and intermediate values';


--
-- Name: rd_federal_credit_latest; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.rd_federal_credit_latest AS
 SELECT rd_federal_credit.id,
    rd_federal_credit.business_year_id,
    rd_federal_credit.client_id,
    rd_federal_credit.research_activity_id,
    rd_federal_credit.research_activity_name,
    rd_federal_credit.direct_research_wages,
    rd_federal_credit.supplies_expenses,
    rd_federal_credit.contractor_expenses,
    rd_federal_credit.total_qre,
    rd_federal_credit.subcomponent_count,
    rd_federal_credit.subcomponent_groups,
    rd_federal_credit.applied_percent,
    rd_federal_credit.line_49f_description,
    rd_federal_credit.ai_generation_timestamp,
    rd_federal_credit.ai_prompt_used,
    rd_federal_credit.ai_response_raw,
    rd_federal_credit.federal_credit_amount,
    rd_federal_credit.federal_credit_percentage,
    rd_federal_credit.calculation_method,
    rd_federal_credit.industry_type,
    rd_federal_credit.focus_area,
    rd_federal_credit.general_description,
    rd_federal_credit.created_at,
    rd_federal_credit.updated_at,
    rd_federal_credit.created_by,
    rd_federal_credit.updated_by,
    rd_federal_credit.version,
    rd_federal_credit.is_latest,
    rd_federal_credit.previous_version_id,
    rd_federal_credit.calculation_timestamp,
    rd_federal_credit.data_snapshot,
    rd_federal_credit.notes
   FROM public.rd_federal_credit
  WHERE (rd_federal_credit.is_latest = true);


--
-- Name: rd_federal_credit_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_federal_credit_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    standard_credit numeric(15,2),
    standard_adjusted_credit numeric(15,2),
    standard_base_percentage numeric(5,4),
    standard_fixed_base_amount numeric(15,2),
    standard_incremental_qre numeric(15,2),
    standard_is_eligible boolean DEFAULT false,
    standard_missing_data jsonb,
    asc_credit numeric(15,2),
    asc_adjusted_credit numeric(15,2),
    asc_avg_prior_qre numeric(15,2),
    asc_incremental_qre numeric(15,2),
    asc_is_startup boolean DEFAULT false,
    asc_missing_data jsonb,
    selected_method text,
    use_280c boolean DEFAULT false,
    corporate_tax_rate numeric(5,4) DEFAULT 0.21,
    total_federal_credit numeric(15,2),
    total_state_credits numeric(15,2),
    total_credits numeric(15,2),
    calculation_date timestamp with time zone DEFAULT now(),
    qre_breakdown jsonb,
    historical_data jsonb,
    state_credits jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rd_federal_credit_results_selected_method_check CHECK ((selected_method = ANY (ARRAY['standard'::text, 'asc'::text])))
);


--
-- Name: rd_procedure_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_procedure_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    procedure_code text NOT NULL,
    procedure_description text,
    procedure_category text,
    billed_units integer DEFAULT 0,
    billed_amount numeric(15,2) DEFAULT 0,
    frequency_annual integer,
    ai_confidence_score numeric(3,2),
    extraction_method text DEFAULT 'ai'::text,
    raw_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rd_procedure_analysis_ai_confidence_score_check CHECK (((ai_confidence_score >= (0)::numeric) AND (ai_confidence_score <= (1)::numeric))),
    CONSTRAINT rd_procedure_analysis_extraction_method_check CHECK ((extraction_method = ANY (ARRAY['ai'::text, 'manual'::text])))
);


--
-- Name: rd_procedure_research_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_procedure_research_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    procedure_analysis_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    subcomponent_id uuid,
    allocation_percentage numeric(5,2) NOT NULL,
    estimated_research_time_hours numeric(10,2),
    ai_reasoning text,
    ai_confidence_score numeric(3,2),
    status text DEFAULT 'pending'::text,
    manual_override boolean DEFAULT false,
    approved_by uuid,
    approval_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rd_procedure_research_links_ai_confidence_score_check CHECK (((ai_confidence_score >= (0)::numeric) AND (ai_confidence_score <= (1)::numeric))),
    CONSTRAINT rd_procedure_research_links_allocation_percentage_check CHECK (((allocation_percentage > (0)::numeric) AND (allocation_percentage <= (100)::numeric))),
    CONSTRAINT rd_procedure_research_links_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'modified'::text])))
);


--
-- Name: rd_qc_document_controls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_qc_document_controls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    document_type character varying(50) NOT NULL,
    is_released boolean DEFAULT false,
    released_at timestamp without time zone,
    released_by uuid,
    release_notes text,
    requires_jurat boolean DEFAULT false,
    requires_payment boolean DEFAULT false,
    qc_reviewer uuid,
    qc_reviewed_at timestamp without time zone,
    qc_review_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    qc_approver_name text,
    qc_approver_credentials text,
    qc_approved_date timestamp with time zone,
    qc_approver_ip_address text
);


--
-- Name: TABLE rd_qc_document_controls; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.rd_qc_document_controls IS 'Quality control and document release management';


--
-- Name: COLUMN rd_qc_document_controls.qc_approver_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_qc_document_controls.qc_approver_name IS 'Name of the QC approver';


--
-- Name: COLUMN rd_qc_document_controls.qc_approver_credentials; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_qc_document_controls.qc_approver_credentials IS 'Credentials/title of the QC approver';


--
-- Name: COLUMN rd_qc_document_controls.qc_approved_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_qc_document_controls.qc_approved_date IS 'Date when QC was approved';


--
-- Name: COLUMN rd_qc_document_controls.qc_approver_ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_qc_document_controls.qc_approver_ip_address IS 'IP address of the QC approver for audit trail';


--
-- Name: rd_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    business_year_id uuid,
    type public.rd_report_type NOT NULL,
    generated_text text NOT NULL,
    editable_text text,
    ai_version text NOT NULL,
    locked boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    generated_html text,
    filing_guide text,
    state_gross_receipts jsonb DEFAULT '{}'::jsonb,
    qc_approved_by text,
    qc_approved_at timestamp with time zone,
    qc_approver_ip text
);


--
-- Name: TABLE rd_reports; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.rd_reports IS 'R&D research reports with basic RLS policies for authenticated users';


--
-- Name: COLUMN rd_reports.generated_html; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_reports.generated_html IS 'Complete HTML of the generated research report for client access and archival';


--
-- Name: COLUMN rd_reports.state_gross_receipts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_reports.state_gross_receipts IS 'Stores state-specific gross receipts data by year for state credit calculations. Format: {"2024": 1000000, "2023": 950000, "2022": 900000, "2021": 850000}';


--
-- Name: COLUMN rd_reports.qc_approved_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_reports.qc_approved_by IS 'Name of the person who approved the QC';


--
-- Name: COLUMN rd_reports.qc_approved_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_reports.qc_approved_at IS 'Timestamp when QC was approved';


--
-- Name: COLUMN rd_reports.qc_approver_ip; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_reports.qc_approver_ip IS 'IP address of the QC approver for audit trail';


--
-- Name: rd_research_raw; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_research_raw (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text,
    area text,
    focus text,
    research_activity text,
    subcomponent text,
    phase text,
    step text,
    hint text,
    general_description text,
    goal text,
    hypothesis text,
    alternatives text,
    uncertainties text,
    developmental_process text,
    primary_goal text,
    expected_outcome_type text,
    cpt_codes text,
    cdt_codes text,
    alternative_paths text,
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: rd_research_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_research_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    research_activity_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    step_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    deactivated_at timestamp without time zone,
    deactivation_reason text,
    business_id uuid
);


--
-- Name: COLUMN rd_research_steps.step_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_research_steps.step_order IS 'Numeric order for displaying steps in UI and reports. Lower numbers appear first.';


--
-- Name: rd_research_subcomponents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_research_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    step_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    subcomponent_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    hint text,
    general_description text,
    goal text,
    hypothesis text,
    alternatives text,
    uncertainties text,
    developmental_process text,
    primary_goal text,
    expected_outcome_type text,
    cpt_codes text,
    cdt_codes text,
    alternative_paths text,
    is_active boolean DEFAULT true,
    deactivated_at timestamp without time zone,
    deactivation_reason text,
    business_id uuid
);


--
-- Name: rd_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    parent_id uuid,
    is_default boolean DEFAULT false,
    business_year_id uuid,
    baseline_applied_percent numeric,
    type text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: COLUMN rd_roles.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_roles.type IS 'Role type: NULL for Direct Participant, "supervisor" for Supervisor, "admin" for Admin';


--
-- Name: COLUMN rd_roles.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_roles.description IS 'Role description explaining responsibilities and duties';


--
-- Name: rd_selected_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_selected_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    practice_percent numeric(5,2) NOT NULL,
    selected_roles jsonb NOT NULL,
    config jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    research_guidelines jsonb,
    is_enabled boolean DEFAULT true NOT NULL,
    activity_title_snapshot text,
    activity_category_snapshot text
);


--
-- Name: rd_selected_filter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_selected_filter (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    selected_categories text[] DEFAULT '{}'::text[],
    selected_areas text[] DEFAULT '{}'::text[],
    selected_focuses text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: rd_selected_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_selected_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    step_id uuid NOT NULL,
    time_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    applied_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    non_rd_percentage numeric(5,2) DEFAULT 0,
    CONSTRAINT rd_selected_steps_non_rd_percentage_check CHECK (((non_rd_percentage >= (0)::numeric) AND (non_rd_percentage <= (100)::numeric)))
);


--
-- Name: COLUMN rd_selected_steps.non_rd_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_selected_steps.non_rd_percentage IS 'Percentage of step time allocated to non-R&D activities (0-100)';


--
-- Name: rd_selected_subcomponents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_selected_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    research_activity_id uuid NOT NULL,
    step_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    frequency_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    year_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    start_month integer DEFAULT 1 NOT NULL,
    start_year integer NOT NULL,
    selected_roles jsonb DEFAULT '[]'::jsonb NOT NULL,
    non_rd_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    approval_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    hint text,
    general_description text,
    goal text,
    hypothesis text,
    alternatives text,
    uncertainties text,
    developmental_process text,
    primary_goal text,
    expected_outcome_type text,
    cpt_codes text,
    cdt_codes text,
    alternative_paths text,
    applied_percentage numeric,
    time_percentage numeric,
    user_notes text,
    step_name text,
    practice_percent numeric(5,2) DEFAULT 0,
    subcomponent_name_snapshot text,
    step_name_snapshot text
);


--
-- Name: COLUMN rd_selected_subcomponents.time_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_selected_subcomponents.time_percentage IS 'Step percentage calculated based on number of steps in the Research Activity';


--
-- Name: rd_signature_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_signature_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    signer_name text NOT NULL,
    signature_image text NOT NULL,
    ip_address text NOT NULL,
    signed_at timestamp with time zone NOT NULL,
    jurat_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    signer_title text,
    signer_email text
);


--
-- Name: TABLE rd_signature_records; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.rd_signature_records IS 'Records of digital signatures for jurat statements with audit trail';


--
-- Name: COLUMN rd_signature_records.business_year_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_signature_records.business_year_id IS 'Reference to the business year this signature applies to';


--
-- Name: COLUMN rd_signature_records.signer_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_signature_records.signer_name IS 'Full name of the person who signed';


--
-- Name: COLUMN rd_signature_records.signature_image; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_signature_records.signature_image IS 'Base64 encoded signature image from canvas';


--
-- Name: COLUMN rd_signature_records.ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_signature_records.ip_address IS 'IP address of the signer for audit purposes';


--
-- Name: COLUMN rd_signature_records.signed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_signature_records.signed_at IS 'Timestamp when the signature was created';


--
-- Name: COLUMN rd_signature_records.jurat_text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_signature_records.jurat_text IS 'The full text of the jurat statement that was signed';


--
-- Name: COLUMN rd_signature_records.signer_title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_signature_records.signer_title IS 'Job title of the person who signed';


--
-- Name: COLUMN rd_signature_records.signer_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rd_signature_records.signer_email IS 'Email address of the person who signed';


--
-- Name: rd_signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_signatures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid,
    signature_type character varying(50),
    signed_by character varying(255),
    signed_at timestamp without time zone,
    signature_data jsonb,
    ip_address inet,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE rd_signatures; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.rd_signatures IS 'Digital signatures for jurat and other documents';


--
-- Name: rd_state_calculations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_state_calculations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state character varying(2) NOT NULL,
    calculation_method text NOT NULL,
    refundable text,
    carryforward text,
    eligible_entities text[],
    calculation_formula text NOT NULL,
    special_notes text,
    start_year numeric NOT NULL,
    end_year numeric,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    formula_correct text
);


--
-- Name: rd_state_calculations_full; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_state_calculations_full (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state character varying(2) NOT NULL,
    calculation_method text,
    refundable text,
    carryforward text,
    eligible_entities text,
    special_notes text,
    start_year text,
    formula_correct text,
    standard_credit_formula text,
    alternate_credit_formula text,
    additional_credit_formula text,
    end_year text,
    standard_info text,
    alternative_info text,
    other_info text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: rd_state_credit_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_state_credit_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_code character varying(2) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: rd_state_proforma_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_state_proforma_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    state_code character varying(2) NOT NULL,
    method character varying(20) NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rd_state_proforma_data_method_check CHECK (((method)::text = ANY ((ARRAY['standard'::character varying, 'alternative'::character varying])::text[])))
);


--
-- Name: rd_state_proforma_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_state_proforma_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_proforma_id uuid NOT NULL,
    line_number character varying(10) NOT NULL,
    description text NOT NULL,
    amount numeric(15,2) DEFAULT 0,
    is_editable boolean DEFAULT true,
    is_calculated boolean DEFAULT false,
    calculation_formula text,
    line_type character varying(50),
    sort_order integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: rd_state_proformas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_state_proformas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    state_code character varying(2) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    total_credit numeric(15,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: rd_supplies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_supplies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    annual_cost numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: rd_supply_subcomponents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_supply_subcomponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supply_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    applied_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    amount_applied numeric
);


--
-- Name: rd_supply_year_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_supply_year_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    name text NOT NULL,
    cost_amount numeric(15,2) NOT NULL,
    applied_percent numeric(5,2) NOT NULL,
    activity_link jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    supply_id uuid,
    calculated_qre numeric(15,2)
);


--
-- Name: rd_support_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_support_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_year_id uuid NOT NULL,
    document_type text NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    mime_type text,
    upload_date timestamp without time zone DEFAULT now(),
    uploaded_by uuid,
    processing_status text DEFAULT 'pending'::text,
    ai_analysis jsonb,
    metadata jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rd_support_documents_document_type_check CHECK ((document_type = ANY (ARRAY['invoice'::text, '1099'::text, 'procedure_report'::text]))),
    CONSTRAINT rd_support_documents_processing_status_check CHECK ((processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'manual_review'::text])))
);


--
-- Name: reinsurance_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reinsurance_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    strategy_detail_id uuid NOT NULL,
    user_contribution numeric(12,2) DEFAULT 0 NOT NULL,
    agi_reduction numeric(12,2) DEFAULT 0 NOT NULL,
    federal_tax_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    state_tax_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    total_tax_savings numeric(12,2) DEFAULT 0 NOT NULL,
    net_year1_cost numeric(12,2) DEFAULT 0 NOT NULL,
    breakeven_years numeric(5,2) DEFAULT 0 NOT NULL,
    future_value numeric(12,2) DEFAULT 0 NOT NULL,
    capital_gains_tax numeric(12,2) DEFAULT 0 NOT NULL,
    setup_admin_cost numeric(12,2) DEFAULT 0 NOT NULL,
    total_benefit numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: research_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name text,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: strategy_commission_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategy_commission_rates (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    affiliate_id uuid,
    strategy_name text NOT NULL,
    affiliate_rate numeric(5,4) NOT NULL,
    admin_rate numeric(5,4) NOT NULL,
    expert_fee_percentage numeric(5,4),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT rates_sum_check CHECK (((affiliate_rate + admin_rate) <= 1.0))
);


--
-- Name: strategy_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategy_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proposal_id uuid NOT NULL,
    strategy_id text NOT NULL,
    strategy_name text NOT NULL,
    strategy_category text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    estimated_savings numeric(12,2) DEFAULT 0 NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: supply_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supply_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    item_name text,
    amount numeric,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: tax_calculations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_calculations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    year integer NOT NULL,
    tax_info jsonb NOT NULL,
    breakdown jsonb NOT NULL,
    strategies jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE tax_calculations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tax_calculations IS 'Stores tax calculations with strategies for each user';


--
-- Name: COLUMN tax_calculations.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tax_calculations.user_id IS 'References auth.users(id)';


--
-- Name: COLUMN tax_calculations.year; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tax_calculations.year IS 'Tax year for the calculation';


--
-- Name: COLUMN tax_calculations.tax_info; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tax_calculations.tax_info IS 'JSON object containing tax information';


--
-- Name: COLUMN tax_calculations.breakdown; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tax_calculations.breakdown IS 'JSON object containing tax breakdown';


--
-- Name: COLUMN tax_calculations.strategies; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tax_calculations.strategies IS 'JSON array containing enabled tax strategies';


--
-- Name: tax_estimates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_estimates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tax_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    affiliate_id text,
    client_id text,
    client_name text,
    year integer NOT NULL,
    tax_info jsonb NOT NULL,
    proposed_strategies jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_savings numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tax_proposals_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'proposed'::text, 'accepted'::text, 'rejected'::text, 'implemented'::text])))
);


--
-- Name: tool_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tool_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_file_id uuid NOT NULL,
    business_id uuid NOT NULL,
    tool_slug text NOT NULL,
    enrolled_by uuid,
    enrolled_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text,
    notes text,
    CONSTRAINT tool_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT tool_enrollments_tool_slug_check CHECK ((tool_slug = ANY (ARRAY['rd'::text, 'augusta'::text, 'hire_children'::text, 'cost_segregation'::text, 'convertible_bonds'::text, 'tax_planning'::text])))
);


--
-- Name: TABLE tool_enrollments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tool_enrollments IS 'Tracks which clients/businesses are enrolled in which tax tools';


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    theme text DEFAULT 'light'::text,
    notifications_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role_type public.role_type NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2025_04_17; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_04_17 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_04_18; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_04_18 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_04_19; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_04_19 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_04_20; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_04_20 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_04_21; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_04_21 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_04_22; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_04_22 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_04_23; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_04_23 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: messages_2025_04_17; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_04_17 FOR VALUES FROM ('2025-04-17 00:00:00') TO ('2025-04-18 00:00:00');


--
-- Name: messages_2025_04_18; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_04_18 FOR VALUES FROM ('2025-04-18 00:00:00') TO ('2025-04-19 00:00:00');


--
-- Name: messages_2025_04_19; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_04_19 FOR VALUES FROM ('2025-04-19 00:00:00') TO ('2025-04-20 00:00:00');


--
-- Name: messages_2025_04_20; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_04_20 FOR VALUES FROM ('2025-04-20 00:00:00') TO ('2025-04-21 00:00:00');


--
-- Name: messages_2025_04_21; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_04_21 FOR VALUES FROM ('2025-04-21 00:00:00') TO ('2025-04-22 00:00:00');


--
-- Name: messages_2025_04_22; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_04_22 FOR VALUES FROM ('2025-04-22 00:00:00') TO ('2025-04-23 00:00:00');


--
-- Name: messages_2025_04_23; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_04_23 FOR VALUES FROM ('2025-04-23 00:00:00') TO ('2025-04-24 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admin_client_files admin_client_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_client_files
    ADD CONSTRAINT admin_client_files_pkey PRIMARY KEY (id);


--
-- Name: augusta_rule_details augusta_rule_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.augusta_rule_details
    ADD CONSTRAINT augusta_rule_details_pkey PRIMARY KEY (id);


--
-- Name: business_years business_years_business_id_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_years
    ADD CONSTRAINT business_years_business_id_year_key UNIQUE (business_id, year);


--
-- Name: business_years business_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_years
    ADD CONSTRAINT business_years_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: calculations calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculations
    ADD CONSTRAINT calculations_pkey PRIMARY KEY (id);


--
-- Name: centralized_businesses centralized_businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centralized_businesses
    ADD CONSTRAINT centralized_businesses_pkey PRIMARY KEY (id);


--
-- Name: charitable_donation_details charitable_donation_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charitable_donation_details
    ADD CONSTRAINT charitable_donation_details_pkey PRIMARY KEY (id);


--
-- Name: clients clients_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_email_key UNIQUE (email);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: commission_transactions commission_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_transactions
    ADD CONSTRAINT commission_transactions_pkey PRIMARY KEY (id);


--
-- Name: contractor_expenses contractor_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor_expenses
    ADD CONSTRAINT contractor_expenses_pkey PRIMARY KEY (id);


--
-- Name: convertible_tax_bonds_details convertible_tax_bonds_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.convertible_tax_bonds_details
    ADD CONSTRAINT convertible_tax_bonds_details_pkey PRIMARY KEY (id);


--
-- Name: cost_segregation_details cost_segregation_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_segregation_details
    ADD CONSTRAINT cost_segregation_details_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: experts experts_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT experts_email_key UNIQUE (email);


--
-- Name: experts experts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT experts_pkey PRIMARY KEY (id);


--
-- Name: family_management_company_details family_management_company_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_management_company_details
    ADD CONSTRAINT family_management_company_details_pkey PRIMARY KEY (id);


--
-- Name: form_6765_overrides form_6765_overrides_client_id_business_year_section_line_nu_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_6765_overrides
    ADD CONSTRAINT form_6765_overrides_client_id_business_year_section_line_nu_key UNIQUE (client_id, business_year, section, line_number);


--
-- Name: form_6765_overrides form_6765_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_6765_overrides
    ADD CONSTRAINT form_6765_overrides_pkey PRIMARY KEY (id);


--
-- Name: hire_children_details hire_children_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hire_children_details
    ADD CONSTRAINT hire_children_details_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: personal_years personal_years_client_id_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_years
    ADD CONSTRAINT personal_years_client_id_year_key UNIQUE (client_id, year);


--
-- Name: personal_years personal_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_years
    ADD CONSTRAINT personal_years_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: proposal_assignments proposal_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_assignments
    ADD CONSTRAINT proposal_assignments_pkey PRIMARY KEY (id);


--
-- Name: proposal_timeline proposal_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_timeline
    ADD CONSTRAINT proposal_timeline_pkey PRIMARY KEY (id);


--
-- Name: rd_areas rd_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_areas
    ADD CONSTRAINT rd_areas_pkey PRIMARY KEY (id);


--
-- Name: rd_billable_time_summary rd_billable_time_summary_business_year_id_research_activity_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_billable_time_summary
    ADD CONSTRAINT rd_billable_time_summary_business_year_id_research_activity_key UNIQUE (business_year_id, research_activity_id, subcomponent_id);


--
-- Name: rd_billable_time_summary rd_billable_time_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_billable_time_summary
    ADD CONSTRAINT rd_billable_time_summary_pkey PRIMARY KEY (id);


--
-- Name: rd_business_years rd_business_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_pkey PRIMARY KEY (id);


--
-- Name: rd_businesses rd_businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_businesses
    ADD CONSTRAINT rd_businesses_pkey PRIMARY KEY (id);


--
-- Name: rd_client_portal_tokens rd_client_portal_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_client_portal_tokens
    ADD CONSTRAINT rd_client_portal_tokens_pkey PRIMARY KEY (id);


--
-- Name: rd_client_portal_tokens rd_client_portal_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_client_portal_tokens
    ADD CONSTRAINT rd_client_portal_tokens_token_key UNIQUE (token);


--
-- Name: rd_contractor_subcomponents rd_contractor_subcomponents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractor_subcomponents
    ADD CONSTRAINT rd_contractor_subcomponents_pkey PRIMARY KEY (id);


--
-- Name: rd_contractor_subcomponents rd_contractor_subcomponents_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractor_subcomponents
    ADD CONSTRAINT rd_contractor_subcomponents_unique UNIQUE (contractor_id, subcomponent_id, business_year_id);


--
-- Name: rd_contractor_year_data rd_contractor_year_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractor_year_data
    ADD CONSTRAINT rd_contractor_year_data_pkey PRIMARY KEY (id);


--
-- Name: rd_contractors rd_contractors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractors
    ADD CONSTRAINT rd_contractors_pkey PRIMARY KEY (id);


--
-- Name: rd_document_links rd_document_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_document_links
    ADD CONSTRAINT rd_document_links_pkey PRIMARY KEY (id);


--
-- Name: rd_employee_subcomponents rd_employee_subcomponents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employee_subcomponents
    ADD CONSTRAINT rd_employee_subcomponents_pkey PRIMARY KEY (id);


--
-- Name: rd_employee_subcomponents rd_employee_subcomponents_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employee_subcomponents
    ADD CONSTRAINT rd_employee_subcomponents_unique UNIQUE (employee_id, subcomponent_id, business_year_id);


--
-- Name: rd_employee_year_data rd_employee_year_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employee_year_data
    ADD CONSTRAINT rd_employee_year_data_pkey PRIMARY KEY (id);


--
-- Name: rd_employees rd_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employees
    ADD CONSTRAINT rd_employees_pkey PRIMARY KEY (id);


--
-- Name: rd_expenses rd_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_expenses
    ADD CONSTRAINT rd_expenses_pkey PRIMARY KEY (id);


--
-- Name: rd_federal_credit rd_federal_credit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit
    ADD CONSTRAINT rd_federal_credit_pkey PRIMARY KEY (id);


--
-- Name: rd_federal_credit_results rd_federal_credit_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit_results
    ADD CONSTRAINT rd_federal_credit_results_pkey PRIMARY KEY (id);


--
-- Name: rd_federal_credit_results rd_federal_credit_results_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit_results
    ADD CONSTRAINT rd_federal_credit_results_unique UNIQUE (business_year_id);


--
-- Name: rd_focuses rd_focuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_focuses
    ADD CONSTRAINT rd_focuses_pkey PRIMARY KEY (id);


--
-- Name: rd_procedure_analysis rd_procedure_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_procedure_analysis
    ADD CONSTRAINT rd_procedure_analysis_pkey PRIMARY KEY (id);


--
-- Name: rd_procedure_research_links rd_procedure_research_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_procedure_research_links
    ADD CONSTRAINT rd_procedure_research_links_pkey PRIMARY KEY (id);


--
-- Name: rd_qc_document_controls rd_qc_document_controls_business_year_id_document_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_qc_document_controls
    ADD CONSTRAINT rd_qc_document_controls_business_year_id_document_type_key UNIQUE (business_year_id, document_type);


--
-- Name: rd_qc_document_controls rd_qc_document_controls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_qc_document_controls
    ADD CONSTRAINT rd_qc_document_controls_pkey PRIMARY KEY (id);


--
-- Name: rd_reports rd_reports_business_year_type_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_reports
    ADD CONSTRAINT rd_reports_business_year_type_unique UNIQUE (business_year_id, type);


--
-- Name: CONSTRAINT rd_reports_business_year_type_unique ON rd_reports; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT rd_reports_business_year_type_unique ON public.rd_reports IS 'Ensures only one report per business year and type combination - supports ON CONFLICT for upsert operations';


--
-- Name: rd_reports rd_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_reports
    ADD CONSTRAINT rd_reports_pkey PRIMARY KEY (id);


--
-- Name: rd_research_activities rd_research_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_activities
    ADD CONSTRAINT rd_research_activities_pkey PRIMARY KEY (id);


--
-- Name: rd_research_categories rd_research_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_categories
    ADD CONSTRAINT rd_research_categories_name_key UNIQUE (name);


--
-- Name: rd_research_categories rd_research_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_categories
    ADD CONSTRAINT rd_research_categories_pkey PRIMARY KEY (id);


--
-- Name: rd_research_raw rd_research_raw_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_raw
    ADD CONSTRAINT rd_research_raw_pkey PRIMARY KEY (id);


--
-- Name: rd_research_steps rd_research_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_steps
    ADD CONSTRAINT rd_research_steps_pkey PRIMARY KEY (id);


--
-- Name: rd_research_subcomponents rd_research_subcomponents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_subcomponents
    ADD CONSTRAINT rd_research_subcomponents_pkey PRIMARY KEY (id);


--
-- Name: rd_roles rd_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_roles
    ADD CONSTRAINT rd_roles_pkey PRIMARY KEY (id);


--
-- Name: rd_selected_activities rd_selected_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_activities
    ADD CONSTRAINT rd_selected_activities_pkey PRIMARY KEY (id);


--
-- Name: rd_selected_filter rd_selected_filter_business_year_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_filter
    ADD CONSTRAINT rd_selected_filter_business_year_id_key UNIQUE (business_year_id);


--
-- Name: rd_selected_filter rd_selected_filter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_filter
    ADD CONSTRAINT rd_selected_filter_pkey PRIMARY KEY (id);


--
-- Name: rd_selected_steps rd_selected_steps_business_year_id_step_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_steps
    ADD CONSTRAINT rd_selected_steps_business_year_id_step_id_key UNIQUE (business_year_id, step_id);


--
-- Name: rd_selected_steps rd_selected_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_steps
    ADD CONSTRAINT rd_selected_steps_pkey PRIMARY KEY (id);


--
-- Name: rd_selected_subcomponents rd_selected_subcomponents_business_year_id_subcomponent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_subcomponents
    ADD CONSTRAINT rd_selected_subcomponents_business_year_id_subcomponent_id_key UNIQUE (business_year_id, subcomponent_id);


--
-- Name: rd_selected_subcomponents rd_selected_subcomponents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_subcomponents
    ADD CONSTRAINT rd_selected_subcomponents_pkey PRIMARY KEY (id);


--
-- Name: rd_signature_records rd_signature_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_signature_records
    ADD CONSTRAINT rd_signature_records_pkey PRIMARY KEY (id);


--
-- Name: rd_signatures rd_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_signatures
    ADD CONSTRAINT rd_signatures_pkey PRIMARY KEY (id);


--
-- Name: rd_state_calculations_full rd_state_calculations_full_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_calculations_full
    ADD CONSTRAINT rd_state_calculations_full_pkey PRIMARY KEY (id);


--
-- Name: rd_state_calculations rd_state_calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_calculations
    ADD CONSTRAINT rd_state_calculations_pkey PRIMARY KEY (id);


--
-- Name: rd_state_credit_configs rd_state_credit_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_credit_configs
    ADD CONSTRAINT rd_state_credit_configs_pkey PRIMARY KEY (id);


--
-- Name: rd_state_credit_configs rd_state_credit_configs_state_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_credit_configs
    ADD CONSTRAINT rd_state_credit_configs_state_code_key UNIQUE (state_code);


--
-- Name: rd_state_proforma_data rd_state_proforma_data_business_year_id_state_code_method_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_proforma_data
    ADD CONSTRAINT rd_state_proforma_data_business_year_id_state_code_method_key UNIQUE (business_year_id, state_code, method);


--
-- Name: rd_state_proforma_data rd_state_proforma_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_proforma_data
    ADD CONSTRAINT rd_state_proforma_data_pkey PRIMARY KEY (id);


--
-- Name: rd_state_proforma_lines rd_state_proforma_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_proforma_lines
    ADD CONSTRAINT rd_state_proforma_lines_pkey PRIMARY KEY (id);


--
-- Name: rd_state_proformas rd_state_proformas_business_year_id_state_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_proformas
    ADD CONSTRAINT rd_state_proformas_business_year_id_state_code_key UNIQUE (business_year_id, state_code);


--
-- Name: rd_state_proformas rd_state_proformas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_proformas
    ADD CONSTRAINT rd_state_proformas_pkey PRIMARY KEY (id);


--
-- Name: rd_subcomponents rd_subcomponents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_subcomponents
    ADD CONSTRAINT rd_subcomponents_pkey PRIMARY KEY (id);


--
-- Name: rd_supplies rd_supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supplies
    ADD CONSTRAINT rd_supplies_pkey PRIMARY KEY (id);


--
-- Name: rd_supply_subcomponents rd_supply_subcomponents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supply_subcomponents
    ADD CONSTRAINT rd_supply_subcomponents_pkey PRIMARY KEY (id);


--
-- Name: rd_supply_subcomponents rd_supply_subcomponents_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supply_subcomponents
    ADD CONSTRAINT rd_supply_subcomponents_unique UNIQUE (supply_id, subcomponent_id, business_year_id);


--
-- Name: rd_supply_year_data rd_supply_year_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supply_year_data
    ADD CONSTRAINT rd_supply_year_data_pkey PRIMARY KEY (id);


--
-- Name: rd_support_documents rd_support_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_support_documents
    ADD CONSTRAINT rd_support_documents_pkey PRIMARY KEY (id);


--
-- Name: reinsurance_details reinsurance_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinsurance_details
    ADD CONSTRAINT reinsurance_details_pkey PRIMARY KEY (id);


--
-- Name: research_activities research_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_activities
    ADD CONSTRAINT research_activities_pkey PRIMARY KEY (id);


--
-- Name: strategy_commission_rates strategy_commission_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_commission_rates
    ADD CONSTRAINT strategy_commission_rates_pkey PRIMARY KEY (id);


--
-- Name: strategy_details strategy_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_details
    ADD CONSTRAINT strategy_details_pkey PRIMARY KEY (id);


--
-- Name: strategy_details strategy_details_proposal_id_strategy_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_details
    ADD CONSTRAINT strategy_details_proposal_id_strategy_id_key UNIQUE (proposal_id, strategy_id);


--
-- Name: supply_expenses supply_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_expenses
    ADD CONSTRAINT supply_expenses_pkey PRIMARY KEY (id);


--
-- Name: tax_calculations tax_calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_calculations
    ADD CONSTRAINT tax_calculations_pkey PRIMARY KEY (id);


--
-- Name: tax_estimates tax_estimates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_estimates
    ADD CONSTRAINT tax_estimates_pkey PRIMARY KEY (id);


--
-- Name: tax_profiles tax_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT tax_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: tax_proposals tax_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_proposals
    ADD CONSTRAINT tax_proposals_pkey PRIMARY KEY (id);


--
-- Name: tool_enrollments tool_enrollments_client_file_id_business_id_tool_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_enrollments
    ADD CONSTRAINT tool_enrollments_client_file_id_business_id_tool_slug_key UNIQUE (client_file_id, business_id, tool_slug);


--
-- Name: tool_enrollments tool_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_enrollments
    ADD CONSTRAINT tool_enrollments_pkey PRIMARY KEY (id);


--
-- Name: rd_research_activities unique_activity_per_focus; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_activities
    ADD CONSTRAINT unique_activity_per_focus UNIQUE (title, focus_id);


--
-- Name: rd_areas unique_area_name_per_category; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_areas
    ADD CONSTRAINT unique_area_name_per_category UNIQUE (name, category_id);


--
-- Name: rd_research_categories unique_category_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_categories
    ADD CONSTRAINT unique_category_name UNIQUE (name);


--
-- Name: rd_focuses unique_focus_name_per_area; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_focuses
    ADD CONSTRAINT unique_focus_name_per_area UNIQUE (name, area_id);


--
-- Name: tax_profiles unique_user_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT unique_user_id UNIQUE (user_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_04_17 messages_2025_04_17_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_04_17
    ADD CONSTRAINT messages_2025_04_17_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_04_18 messages_2025_04_18_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_04_18
    ADD CONSTRAINT messages_2025_04_18_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_04_19 messages_2025_04_19_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_04_19
    ADD CONSTRAINT messages_2025_04_19_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_04_20 messages_2025_04_20_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_04_20
    ADD CONSTRAINT messages_2025_04_20_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_04_21 messages_2025_04_21_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_04_21
    ADD CONSTRAINT messages_2025_04_21_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_04_22 messages_2025_04_22_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_04_22
    ADD CONSTRAINT messages_2025_04_22_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_04_23 messages_2025_04_23_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_04_23
    ADD CONSTRAINT messages_2025_04_23_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_admin_client_files_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_client_files_admin_id ON public.admin_client_files USING btree (admin_id);


--
-- Name: idx_admin_client_files_affiliate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_client_files_affiliate_id ON public.admin_client_files USING btree (affiliate_id);


--
-- Name: idx_admin_client_files_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_client_files_archived ON public.admin_client_files USING btree (archived);


--
-- Name: idx_admin_client_files_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_client_files_business_id ON public.admin_client_files USING btree (business_id);


--
-- Name: idx_admin_client_files_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_client_files_created_at ON public.admin_client_files USING btree (created_at);


--
-- Name: idx_admin_client_files_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_client_files_email ON public.admin_client_files USING btree (email);


--
-- Name: idx_augusta_rule_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_augusta_rule_details_strategy_detail_id ON public.augusta_rule_details USING btree (strategy_detail_id);


--
-- Name: idx_billable_summary_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billable_summary_activity ON public.rd_billable_time_summary USING btree (research_activity_id);


--
-- Name: idx_billable_summary_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billable_summary_business_year ON public.rd_billable_time_summary USING btree (business_year_id);


--
-- Name: idx_business_years_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_years_business_id ON public.business_years USING btree (business_id);


--
-- Name: idx_business_years_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_years_year ON public.business_years USING btree (year);


--
-- Name: idx_businesses_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_client_id ON public.businesses USING btree (client_id);


--
-- Name: idx_businesses_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_entity_type ON public.businesses USING btree (entity_type);


--
-- Name: idx_businesses_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_is_active ON public.businesses USING btree (is_active);


--
-- Name: idx_centralized_businesses_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_centralized_businesses_created_at ON public.centralized_businesses USING btree (created_at);


--
-- Name: idx_charitable_donation_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charitable_donation_details_strategy_detail_id ON public.charitable_donation_details USING btree (strategy_detail_id);


--
-- Name: idx_clients_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_archived ON public.clients USING btree (archived);


--
-- Name: idx_clients_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_city ON public.clients USING btree (city);


--
-- Name: idx_clients_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_created_at ON public.clients USING btree (created_at);


--
-- Name: idx_clients_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_created_by ON public.clients USING btree (created_by);


--
-- Name: idx_clients_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_email ON public.clients USING btree (email);


--
-- Name: idx_clients_zip_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_zip_code ON public.clients USING btree (zip_code);


--
-- Name: idx_convertible_tax_bonds_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_convertible_tax_bonds_details_strategy_detail_id ON public.convertible_tax_bonds_details USING btree (strategy_detail_id);


--
-- Name: idx_cost_segregation_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_segregation_details_strategy_detail_id ON public.cost_segregation_details USING btree (strategy_detail_id);


--
-- Name: idx_document_links_contractor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_links_contractor ON public.rd_document_links USING btree (contractor_id);


--
-- Name: idx_document_links_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_links_doc ON public.rd_document_links USING btree (document_id);


--
-- Name: idx_document_links_supply; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_links_supply ON public.rd_document_links USING btree (supply_id);


--
-- Name: idx_family_management_company_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_family_management_company_details_strategy_detail_id ON public.family_management_company_details USING btree (strategy_detail_id);


--
-- Name: idx_hire_children_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_children_details_strategy_detail_id ON public.hire_children_details USING btree (strategy_detail_id);


--
-- Name: idx_personal_years_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personal_years_client_id ON public.personal_years USING btree (client_id);


--
-- Name: idx_personal_years_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personal_years_year ON public.personal_years USING btree (year);


--
-- Name: idx_procedure_analysis_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedure_analysis_code ON public.rd_procedure_analysis USING btree (procedure_code);


--
-- Name: idx_procedure_analysis_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedure_analysis_doc ON public.rd_procedure_analysis USING btree (document_id);


--
-- Name: idx_procedure_links_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedure_links_activity ON public.rd_procedure_research_links USING btree (research_activity_id);


--
-- Name: idx_procedure_links_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedure_links_status ON public.rd_procedure_research_links USING btree (status);


--
-- Name: idx_rd_business_years_business_setup_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_business_years_business_setup_completed ON public.rd_business_years USING btree (business_setup_completed) WHERE (business_setup_completed = true);


--
-- Name: idx_rd_business_years_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_business_years_business_year ON public.rd_business_years USING btree (business_id, year);


--
-- Name: idx_rd_business_years_calculations_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_business_years_calculations_completed ON public.rd_business_years USING btree (calculations_completed) WHERE (calculations_completed = true);


--
-- Name: idx_rd_business_years_completion_percentage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_business_years_completion_percentage ON public.rd_business_years USING btree (overall_completion_percentage);


--
-- Name: idx_rd_business_years_credits_locked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_business_years_credits_locked ON public.rd_business_years USING btree (credits_locked) WHERE (credits_locked = true);


--
-- Name: idx_rd_business_years_research_activities_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_business_years_research_activities_completed ON public.rd_business_years USING btree (research_activities_completed) WHERE (research_activities_completed = true);


--
-- Name: idx_rd_business_years_research_design_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_business_years_research_design_completed ON public.rd_business_years USING btree (research_design_completed) WHERE (research_design_completed = true);


--
-- Name: idx_rd_businesses_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_businesses_category_id ON public.rd_businesses USING btree (category_id);


--
-- Name: idx_rd_businesses_ein; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_businesses_ein ON public.rd_businesses USING btree (ein) WHERE (ein IS NOT NULL);


--
-- Name: idx_rd_businesses_github_token_exists; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_businesses_github_token_exists ON public.rd_businesses USING btree (github_token) WHERE (github_token IS NOT NULL);


--
-- Name: idx_rd_businesses_historical_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_businesses_historical_data ON public.rd_businesses USING gin (historical_data);


--
-- Name: idx_rd_client_portal_tokens_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_client_portal_tokens_active ON public.rd_client_portal_tokens USING btree (business_id, is_active, expires_at) WHERE (is_active = true);


--
-- Name: idx_rd_client_portal_tokens_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_client_portal_tokens_business ON public.rd_client_portal_tokens USING btree (business_id);


--
-- Name: idx_rd_client_portal_tokens_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_client_portal_tokens_business_id ON public.rd_client_portal_tokens USING btree (business_id);


--
-- Name: idx_rd_client_portal_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_client_portal_tokens_token ON public.rd_client_portal_tokens USING btree (token);


--
-- Name: idx_rd_contractor_subcomponents_business_year_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractor_subcomponents_business_year_id ON public.rd_contractor_subcomponents USING btree (business_year_id);


--
-- Name: idx_rd_contractor_subcomponents_contractor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractor_subcomponents_contractor_id ON public.rd_contractor_subcomponents USING btree (contractor_id);


--
-- Name: idx_rd_contractor_subcomponents_subcomponent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractor_subcomponents_subcomponent_id ON public.rd_contractor_subcomponents USING btree (subcomponent_id);


--
-- Name: idx_rd_contractor_subcomponents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractor_subcomponents_user_id ON public.rd_contractor_subcomponents USING btree (user_id);


--
-- Name: idx_rd_contractor_year_data_business_year_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractor_year_data_business_year_id ON public.rd_contractor_year_data USING btree (business_year_id);


--
-- Name: idx_rd_contractor_year_data_contractor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractor_year_data_contractor_id ON public.rd_contractor_year_data USING btree (contractor_id);


--
-- Name: idx_rd_contractor_year_data_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractor_year_data_user_id ON public.rd_contractor_year_data USING btree (user_id);


--
-- Name: idx_rd_contractors_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractors_business_id ON public.rd_contractors USING btree (business_id);


--
-- Name: idx_rd_contractors_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractors_role_id ON public.rd_contractors USING btree (role_id);


--
-- Name: idx_rd_contractors_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_contractors_user_id ON public.rd_contractors USING btree (user_id);


--
-- Name: idx_rd_employee_subcomponents_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_employee_subcomponents_employee_id ON public.rd_employee_subcomponents USING btree (employee_id);


--
-- Name: idx_rd_employee_subcomponents_subcomponent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_employee_subcomponents_subcomponent_id ON public.rd_employee_subcomponents USING btree (subcomponent_id);


--
-- Name: idx_rd_employee_subcomponents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_employee_subcomponents_user_id ON public.rd_employee_subcomponents USING btree (user_id);


--
-- Name: idx_rd_employee_year_data_employee_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_employee_year_data_employee_year ON public.rd_employee_year_data USING btree (employee_id, business_year_id);


--
-- Name: idx_rd_employee_year_data_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_employee_year_data_user_id ON public.rd_employee_year_data USING btree (user_id);


--
-- Name: idx_rd_employees_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_employees_user_id ON public.rd_employees USING btree (user_id);


--
-- Name: idx_rd_expenses_business_year_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_expenses_business_year_id ON public.rd_expenses USING btree (business_year_id);


--
-- Name: idx_rd_expenses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_expenses_category ON public.rd_expenses USING btree (category);


--
-- Name: idx_rd_expenses_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_expenses_employee_id ON public.rd_expenses USING btree (employee_id);


--
-- Name: idx_rd_federal_credit_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_federal_credit_activity ON public.rd_federal_credit USING btree (research_activity_id);


--
-- Name: idx_rd_federal_credit_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_federal_credit_business_year ON public.rd_federal_credit USING btree (business_year_id);


--
-- Name: idx_rd_federal_credit_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_federal_credit_client ON public.rd_federal_credit USING btree (client_id);


--
-- Name: idx_rd_federal_credit_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_federal_credit_created_at ON public.rd_federal_credit USING btree (created_at);


--
-- Name: idx_rd_federal_credit_latest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_federal_credit_latest ON public.rd_federal_credit USING btree (is_latest) WHERE (is_latest = true);


--
-- Name: idx_rd_federal_credit_results_business_year_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_federal_credit_results_business_year_id ON public.rd_federal_credit_results USING btree (business_year_id);


--
-- Name: idx_rd_federal_credit_results_calculation_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_federal_credit_results_calculation_date ON public.rd_federal_credit_results USING btree (calculation_date);


--
-- Name: idx_rd_qc_document_controls_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_qc_document_controls_business_year ON public.rd_qc_document_controls USING btree (business_year_id);


--
-- Name: idx_rd_qc_document_controls_qc_approved_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_qc_document_controls_qc_approved_date ON public.rd_qc_document_controls USING btree (qc_approved_date) WHERE (qc_approved_date IS NOT NULL);


--
-- Name: idx_rd_qc_document_controls_released; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_qc_document_controls_released ON public.rd_qc_document_controls USING btree (is_released);


--
-- Name: idx_rd_qc_document_controls_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_qc_document_controls_type ON public.rd_qc_document_controls USING btree (document_type);


--
-- Name: idx_rd_reports_business_year_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_reports_business_year_type ON public.rd_reports USING btree (business_year_id, type);


--
-- Name: idx_rd_reports_html_not_null; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_reports_html_not_null ON public.rd_reports USING btree (business_year_id, type) WHERE (generated_html IS NOT NULL);


--
-- Name: idx_rd_reports_qc_approved_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_reports_qc_approved_at ON public.rd_reports USING btree (qc_approved_at) WHERE (qc_approved_at IS NOT NULL);


--
-- Name: idx_rd_reports_state_gross_receipts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_reports_state_gross_receipts ON public.rd_reports USING gin (state_gross_receipts);


--
-- Name: idx_rd_research_activities_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_research_activities_business_id ON public.rd_research_activities USING btree (business_id);


--
-- Name: idx_rd_research_activities_global; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_research_activities_global ON public.rd_research_activities USING btree (id) WHERE (business_id IS NULL);


--
-- Name: idx_rd_research_steps_activity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_research_steps_activity_id ON public.rd_research_steps USING btree (research_activity_id);


--
-- Name: idx_rd_research_steps_activity_step_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_research_steps_activity_step_order ON public.rd_research_steps USING btree (research_activity_id, step_order);


--
-- Name: idx_rd_research_steps_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_research_steps_business_id ON public.rd_research_steps USING btree (business_id);


--
-- Name: idx_rd_research_subcomponents_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_research_subcomponents_business_id ON public.rd_research_subcomponents USING btree (business_id);


--
-- Name: idx_rd_research_subcomponents_step_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_research_subcomponents_step_id ON public.rd_research_subcomponents USING btree (step_id);


--
-- Name: idx_rd_roles_business_year_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_roles_business_year_id ON public.rd_roles USING btree (business_year_id);


--
-- Name: idx_rd_roles_is_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_roles_is_default ON public.rd_roles USING btree (is_default);


--
-- Name: idx_rd_roles_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_roles_type ON public.rd_roles USING btree (type);


--
-- Name: idx_rd_roles_unique_default_per_year; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_rd_roles_unique_default_per_year ON public.rd_roles USING btree (business_year_id, is_default) WHERE (is_default = true);


--
-- Name: idx_rd_selected_activities_business_year_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_selected_activities_business_year_activity ON public.rd_selected_activities USING btree (business_year_id, activity_id);


--
-- Name: idx_rd_selected_steps_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_selected_steps_activity ON public.rd_selected_steps USING btree (research_activity_id);


--
-- Name: idx_rd_selected_steps_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_selected_steps_business_year ON public.rd_selected_steps USING btree (business_year_id);


--
-- Name: idx_rd_selected_subcomponents_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_selected_subcomponents_activity ON public.rd_selected_subcomponents USING btree (research_activity_id);


--
-- Name: idx_rd_selected_subcomponents_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_selected_subcomponents_business_year ON public.rd_selected_subcomponents USING btree (business_year_id);


--
-- Name: idx_rd_selected_subcomponents_step; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_selected_subcomponents_step ON public.rd_selected_subcomponents USING btree (step_id);


--
-- Name: idx_rd_signature_records_business_year_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_signature_records_business_year_id ON public.rd_signature_records USING btree (business_year_id);


--
-- Name: idx_rd_signature_records_signed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_signature_records_signed_at ON public.rd_signature_records USING btree (signed_at);


--
-- Name: idx_rd_signatures_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_signatures_business_year ON public.rd_signatures USING btree (business_year_id);


--
-- Name: idx_rd_signatures_signed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_signatures_signed_at ON public.rd_signatures USING btree (signed_at);


--
-- Name: idx_rd_signatures_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_signatures_type ON public.rd_signatures USING btree (signature_type);


--
-- Name: idx_rd_state_proforma_data_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_state_proforma_data_lookup ON public.rd_state_proforma_data USING btree (business_year_id, state_code, method);


--
-- Name: idx_rd_supplies_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_supplies_business_id ON public.rd_supplies USING btree (business_id);


--
-- Name: idx_rd_supply_subcomponents_business_year_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_supply_subcomponents_business_year_id ON public.rd_supply_subcomponents USING btree (business_year_id);


--
-- Name: idx_rd_supply_subcomponents_subcomponent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_supply_subcomponents_subcomponent_id ON public.rd_supply_subcomponents USING btree (subcomponent_id);


--
-- Name: idx_rd_supply_subcomponents_supply_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_supply_subcomponents_supply_id ON public.rd_supply_subcomponents USING btree (supply_id);


--
-- Name: idx_reinsurance_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reinsurance_details_strategy_detail_id ON public.reinsurance_details USING btree (strategy_detail_id);


--
-- Name: idx_state_calculations_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_calculations_active ON public.rd_state_calculations USING btree (is_active);


--
-- Name: idx_state_calculations_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_calculations_state ON public.rd_state_calculations USING btree (state);


--
-- Name: idx_state_calculations_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_state_calculations_unique ON public.rd_state_calculations USING btree (state, start_year) WHERE (is_active = true);


--
-- Name: idx_state_calculations_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_calculations_year ON public.rd_state_calculations USING btree (start_year, end_year);


--
-- Name: idx_state_credit_configs_state_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_credit_configs_state_code ON public.rd_state_credit_configs USING btree (state_code);


--
-- Name: idx_state_proforma_lines_state_proforma_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_proforma_lines_state_proforma_id ON public.rd_state_proforma_lines USING btree (state_proforma_id);


--
-- Name: idx_state_proformas_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_proformas_business_year ON public.rd_state_proformas USING btree (business_year_id);


--
-- Name: idx_strategy_details_proposal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_strategy_details_proposal_id ON public.strategy_details USING btree (proposal_id);


--
-- Name: idx_strategy_details_strategy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_strategy_details_strategy_id ON public.strategy_details USING btree (strategy_id);


--
-- Name: idx_support_docs_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_docs_business_year ON public.rd_support_documents USING btree (business_year_id);


--
-- Name: idx_support_docs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_docs_status ON public.rd_support_documents USING btree (processing_status);


--
-- Name: idx_support_docs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_docs_type ON public.rd_support_documents USING btree (document_type);


--
-- Name: idx_tax_proposals_affiliate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_proposals_affiliate_id ON public.tax_proposals USING btree (affiliate_id);


--
-- Name: idx_tax_proposals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_proposals_status ON public.tax_proposals USING btree (status);


--
-- Name: idx_tax_proposals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_proposals_user_id ON public.tax_proposals USING btree (user_id);


--
-- Name: idx_tool_enrollments_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tool_enrollments_business_id ON public.tool_enrollments USING btree (business_id);


--
-- Name: idx_tool_enrollments_client_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tool_enrollments_client_file_id ON public.tool_enrollments USING btree (client_file_id);


--
-- Name: idx_tool_enrollments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tool_enrollments_status ON public.tool_enrollments USING btree (status);


--
-- Name: idx_tool_enrollments_tool_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tool_enrollments_tool_slug ON public.tool_enrollments USING btree (tool_slug);


--
-- Name: idx_unique_procedure_research_link; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unique_procedure_research_link ON public.rd_procedure_research_links USING btree (procedure_analysis_id, research_activity_id, subcomponent_id);


--
-- Name: leads_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_user_id_idx ON public.leads USING btree (user_id);


--
-- Name: profiles_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_created_at_idx ON public.profiles USING btree (created_at);


--
-- Name: profiles_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_email_idx ON public.profiles USING btree (email);


--
-- Name: profiles_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_updated_at_idx ON public.profiles USING btree (updated_at);


--
-- Name: tax_calculations_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tax_calculations_user_id_idx ON public.tax_calculations USING btree (user_id);


--
-- Name: tax_calculations_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tax_calculations_year_idx ON public.tax_calculations USING btree (year);


--
-- Name: tax_profiles_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tax_profiles_user_id_idx ON public.tax_profiles USING btree (user_id);


--
-- Name: unique_tax_estimate_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_tax_estimate_per_user ON public.tax_estimates USING btree (user_id);


--
-- Name: user_preferences_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_preferences_user_id_idx ON public.user_preferences USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: messages_2025_04_17_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_04_17_pkey;


--
-- Name: messages_2025_04_18_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_04_18_pkey;


--
-- Name: messages_2025_04_19_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_04_19_pkey;


--
-- Name: messages_2025_04_20_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_04_20_pkey;


--
-- Name: messages_2025_04_21_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_04_21_pkey;


--
-- Name: messages_2025_04_22_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_04_22_pkey;


--
-- Name: messages_2025_04_23_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_04_23_pkey;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;


--
-- Name: rd_contractor_subcomponents handle_rd_contractor_subcomponents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_rd_contractor_subcomponents_updated_at BEFORE UPDATE ON public.rd_contractor_subcomponents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: rd_contractor_year_data handle_rd_contractor_year_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_rd_contractor_year_data_updated_at BEFORE UPDATE ON public.rd_contractor_year_data FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: rd_federal_credit_results handle_rd_federal_credit_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_rd_federal_credit_results_updated_at BEFORE UPDATE ON public.rd_federal_credit_results FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: rd_supply_subcomponents handle_rd_supply_subcomponents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_rd_supply_subcomponents_updated_at BEFORE UPDATE ON public.rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: rd_supply_year_data handle_rd_supply_year_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_rd_supply_year_data_updated_at BEFORE UPDATE ON public.rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: rd_supplies set_updated_at_rd_supplies; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_rd_supplies BEFORE UPDATE ON public.rd_supplies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: rd_supply_subcomponents set_updated_at_rd_supply_subcomponents; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_rd_supply_subcomponents BEFORE UPDATE ON public.rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: rd_supply_year_data set_updated_at_rd_supply_year_data; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_rd_supply_year_data BEFORE UPDATE ON public.rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: rd_federal_credit trigger_archive_rd_federal_credit_version; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_archive_rd_federal_credit_version AFTER INSERT ON public.rd_federal_credit FOR EACH ROW EXECUTE FUNCTION public.archive_rd_federal_credit_version();


--
-- Name: tax_proposals trigger_create_strategy_details; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_create_strategy_details AFTER INSERT ON public.tax_proposals FOR EACH ROW EXECUTE FUNCTION public.create_strategy_details_for_proposal();


--
-- Name: rd_selected_subcomponents trigger_safe_update_practice_percent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_safe_update_practice_percent AFTER INSERT ON public.rd_selected_subcomponents FOR EACH ROW EXECUTE FUNCTION public.safe_update_selected_subcomponent_practice_percent();


--
-- Name: rd_business_years trigger_update_completion_percentage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_completion_percentage BEFORE UPDATE OF business_setup_completed, research_activities_completed, research_design_completed, calculations_completed ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_completion_percentage();


--
-- Name: rd_federal_credit trigger_update_rd_federal_credit_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_rd_federal_credit_updated_at BEFORE UPDATE ON public.rd_federal_credit FOR EACH ROW EXECUTE FUNCTION public.update_rd_federal_credit_updated_at();


--
-- Name: rd_state_proforma_data trigger_update_rd_state_proforma_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_rd_state_proforma_data_updated_at BEFORE UPDATE ON public.rd_state_proforma_data FOR EACH ROW EXECUTE FUNCTION public.update_rd_state_proforma_data_updated_at();


--
-- Name: rd_selected_subcomponents trigger_update_step_name; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_step_name AFTER INSERT ON public.rd_selected_subcomponents FOR EACH ROW EXECUTE FUNCTION public.update_selected_subcomponent_step_name();


--
-- Name: rd_business_years trigger_update_total_qre; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_total_qre BEFORE INSERT OR UPDATE OF employee_qre, contractor_qre, supply_qre ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_total_qre();


--
-- Name: rd_business_years update_rd_business_years_credits_calculated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rd_business_years_credits_calculated_at BEFORE UPDATE OF federal_credit, state_credit ON public.rd_business_years FOR EACH ROW EXECUTE FUNCTION public.update_credits_calculated_at();


--
-- Name: rd_reports update_rd_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rd_reports_updated_at BEFORE UPDATE ON public.rd_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rd_roles update_rd_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rd_roles_updated_at BEFORE UPDATE ON public.rd_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rd_state_calculations update_rd_state_calculations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rd_state_calculations_updated_at BEFORE UPDATE ON public.rd_state_calculations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: admin_client_files admin_client_files_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_client_files
    ADD CONSTRAINT admin_client_files_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id);


--
-- Name: admin_client_files admin_client_files_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_client_files
    ADD CONSTRAINT admin_client_files_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.profiles(id);


--
-- Name: admin_client_files admin_client_files_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_client_files
    ADD CONSTRAINT admin_client_files_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id);


--
-- Name: augusta_rule_details augusta_rule_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.augusta_rule_details
    ADD CONSTRAINT augusta_rule_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: business_years business_years_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_years
    ADD CONSTRAINT business_years_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: businesses businesses_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: calculations calculations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculations
    ADD CONSTRAINT calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: charitable_donation_details charitable_donation_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charitable_donation_details
    ADD CONSTRAINT charitable_donation_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: clients clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: commission_transactions commission_transactions_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_transactions
    ADD CONSTRAINT commission_transactions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: commission_transactions commission_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_transactions
    ADD CONSTRAINT commission_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: commission_transactions commission_transactions_expert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_transactions
    ADD CONSTRAINT commission_transactions_expert_id_fkey FOREIGN KEY (expert_id) REFERENCES public.experts(id) ON DELETE CASCADE;


--
-- Name: convertible_tax_bonds_details convertible_tax_bonds_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.convertible_tax_bonds_details
    ADD CONSTRAINT convertible_tax_bonds_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: cost_segregation_details cost_segregation_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_segregation_details
    ADD CONSTRAINT cost_segregation_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: family_management_company_details family_management_company_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_management_company_details
    ADD CONSTRAINT family_management_company_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: form_6765_overrides form_6765_overrides_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_6765_overrides
    ADD CONSTRAINT form_6765_overrides_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: form_6765_overrides form_6765_overrides_last_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_6765_overrides
    ADD CONSTRAINT form_6765_overrides_last_modified_by_fkey FOREIGN KEY (last_modified_by) REFERENCES public.users(id);


--
-- Name: hire_children_details hire_children_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hire_children_details
    ADD CONSTRAINT hire_children_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: leads leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: personal_years personal_years_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_years
    ADD CONSTRAINT personal_years_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: proposal_assignments proposal_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_assignments
    ADD CONSTRAINT proposal_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);


--
-- Name: proposal_assignments proposal_assignments_expert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_assignments
    ADD CONSTRAINT proposal_assignments_expert_id_fkey FOREIGN KEY (expert_id) REFERENCES public.experts(id) ON DELETE CASCADE;


--
-- Name: proposal_timeline proposal_timeline_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_timeline
    ADD CONSTRAINT proposal_timeline_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id);


--
-- Name: rd_areas rd_areas_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_areas
    ADD CONSTRAINT rd_areas_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.rd_research_categories(id) ON DELETE CASCADE;


--
-- Name: rd_billable_time_summary rd_billable_time_summary_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_billable_time_summary
    ADD CONSTRAINT rd_billable_time_summary_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_billable_time_summary rd_billable_time_summary_research_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_billable_time_summary
    ADD CONSTRAINT rd_billable_time_summary_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


--
-- Name: rd_billable_time_summary rd_billable_time_summary_subcomponent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_billable_time_summary
    ADD CONSTRAINT rd_billable_time_summary_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE SET NULL;


--
-- Name: rd_business_years rd_business_years_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;


--
-- Name: rd_business_years rd_business_years_business_setup_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_business_setup_completed_by_fkey FOREIGN KEY (business_setup_completed_by) REFERENCES public.profiles(id);


--
-- Name: rd_business_years rd_business_years_calculations_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_calculations_completed_by_fkey FOREIGN KEY (calculations_completed_by) REFERENCES public.profiles(id);


--
-- Name: rd_business_years rd_business_years_credits_locked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_credits_locked_by_fkey FOREIGN KEY (credits_locked_by) REFERENCES public.profiles(id);


--
-- Name: rd_business_years rd_business_years_documents_released_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_documents_released_by_fkey FOREIGN KEY (documents_released_by) REFERENCES public.profiles(id);


--
-- Name: rd_business_years rd_business_years_qc_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_qc_approved_by_fkey FOREIGN KEY (qc_approved_by) REFERENCES public.profiles(id);


--
-- Name: rd_business_years rd_business_years_research_activities_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_research_activities_completed_by_fkey FOREIGN KEY (research_activities_completed_by) REFERENCES public.profiles(id);


--
-- Name: rd_business_years rd_business_years_research_design_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_research_design_completed_by_fkey FOREIGN KEY (research_design_completed_by) REFERENCES public.profiles(id);


--
-- Name: rd_businesses rd_businesses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_businesses
    ADD CONSTRAINT rd_businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.rd_research_categories(id) ON DELETE SET NULL;


--
-- Name: rd_businesses rd_businesses_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_businesses
    ADD CONSTRAINT rd_businesses_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: rd_client_portal_tokens rd_client_portal_tokens_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_client_portal_tokens
    ADD CONSTRAINT rd_client_portal_tokens_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id);


--
-- Name: rd_client_portal_tokens rd_client_portal_tokens_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_client_portal_tokens
    ADD CONSTRAINT rd_client_portal_tokens_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: rd_contractor_subcomponents rd_contractor_subcomponents_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractor_subcomponents
    ADD CONSTRAINT rd_contractor_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_contractor_subcomponents rd_contractor_subcomponents_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractor_subcomponents
    ADD CONSTRAINT rd_contractor_subcomponents_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id) ON DELETE CASCADE;


--
-- Name: rd_contractor_subcomponents rd_contractor_subcomponents_subcomponent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractor_subcomponents
    ADD CONSTRAINT rd_contractor_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;


--
-- Name: rd_contractor_year_data rd_contractor_year_data_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractor_year_data
    ADD CONSTRAINT rd_contractor_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_contractor_year_data rd_contractor_year_data_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractor_year_data
    ADD CONSTRAINT rd_contractor_year_data_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;


--
-- Name: rd_contractors rd_contractors_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractors
    ADD CONSTRAINT rd_contractors_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;


--
-- Name: rd_contractors rd_contractors_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractors
    ADD CONSTRAINT rd_contractors_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rd_roles(id) ON DELETE SET NULL;


--
-- Name: rd_contractors rd_contractors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_contractors
    ADD CONSTRAINT rd_contractors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: rd_document_links rd_document_links_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_document_links
    ADD CONSTRAINT rd_document_links_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractor_year_data(id) ON DELETE SET NULL;


--
-- Name: rd_document_links rd_document_links_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_document_links
    ADD CONSTRAINT rd_document_links_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.rd_support_documents(id) ON DELETE CASCADE;


--
-- Name: rd_document_links rd_document_links_supply_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_document_links
    ADD CONSTRAINT rd_document_links_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.rd_supply_subcomponents(id) ON DELETE SET NULL;


--
-- Name: rd_employee_subcomponents rd_employee_subcomponents_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employee_subcomponents
    ADD CONSTRAINT rd_employee_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_employee_subcomponents rd_employee_subcomponents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employee_subcomponents
    ADD CONSTRAINT rd_employee_subcomponents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE CASCADE;


--
-- Name: rd_employee_subcomponents rd_employee_subcomponents_subcomponent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employee_subcomponents
    ADD CONSTRAINT rd_employee_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;


--
-- Name: rd_employee_year_data rd_employee_year_data_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employee_year_data
    ADD CONSTRAINT rd_employee_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_employee_year_data rd_employee_year_data_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employee_year_data
    ADD CONSTRAINT rd_employee_year_data_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE CASCADE;


--
-- Name: rd_employees rd_employees_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employees
    ADD CONSTRAINT rd_employees_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;


--
-- Name: rd_employees rd_employees_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employees
    ADD CONSTRAINT rd_employees_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rd_roles(id) ON DELETE SET NULL;


--
-- Name: rd_employees rd_employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employees
    ADD CONSTRAINT rd_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: rd_expenses rd_expenses_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_expenses
    ADD CONSTRAINT rd_expenses_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_expenses rd_expenses_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_expenses
    ADD CONSTRAINT rd_expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE CASCADE;


--
-- Name: rd_expenses rd_expenses_research_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_expenses
    ADD CONSTRAINT rd_expenses_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


--
-- Name: rd_expenses rd_expenses_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_expenses
    ADD CONSTRAINT rd_expenses_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE;


--
-- Name: rd_expenses rd_expenses_subcomponent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_expenses
    ADD CONSTRAINT rd_expenses_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;


--
-- Name: rd_federal_credit rd_federal_credit_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit
    ADD CONSTRAINT rd_federal_credit_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_federal_credit rd_federal_credit_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit
    ADD CONSTRAINT rd_federal_credit_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: rd_federal_credit rd_federal_credit_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit
    ADD CONSTRAINT rd_federal_credit_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: rd_federal_credit rd_federal_credit_previous_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit
    ADD CONSTRAINT rd_federal_credit_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES public.rd_federal_credit(id);


--
-- Name: rd_federal_credit rd_federal_credit_research_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit
    ADD CONSTRAINT rd_federal_credit_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


--
-- Name: rd_federal_credit_results rd_federal_credit_results_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit_results
    ADD CONSTRAINT rd_federal_credit_results_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_federal_credit rd_federal_credit_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit
    ADD CONSTRAINT rd_federal_credit_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: rd_focuses rd_focuses_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_focuses
    ADD CONSTRAINT rd_focuses_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.rd_areas(id) ON DELETE CASCADE;


--
-- Name: rd_procedure_analysis rd_procedure_analysis_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_procedure_analysis
    ADD CONSTRAINT rd_procedure_analysis_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.rd_support_documents(id) ON DELETE CASCADE;


--
-- Name: rd_procedure_research_links rd_procedure_research_links_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_procedure_research_links
    ADD CONSTRAINT rd_procedure_research_links_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: rd_procedure_research_links rd_procedure_research_links_procedure_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_procedure_research_links
    ADD CONSTRAINT rd_procedure_research_links_procedure_analysis_id_fkey FOREIGN KEY (procedure_analysis_id) REFERENCES public.rd_procedure_analysis(id) ON DELETE CASCADE;


--
-- Name: rd_procedure_research_links rd_procedure_research_links_research_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_procedure_research_links
    ADD CONSTRAINT rd_procedure_research_links_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


--
-- Name: rd_procedure_research_links rd_procedure_research_links_subcomponent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_procedure_research_links
    ADD CONSTRAINT rd_procedure_research_links_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE SET NULL;


--
-- Name: rd_qc_document_controls rd_qc_document_controls_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_qc_document_controls
    ADD CONSTRAINT rd_qc_document_controls_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_qc_document_controls rd_qc_document_controls_qc_reviewer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_qc_document_controls
    ADD CONSTRAINT rd_qc_document_controls_qc_reviewer_fkey FOREIGN KEY (qc_reviewer) REFERENCES public.profiles(id);


--
-- Name: rd_qc_document_controls rd_qc_document_controls_released_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_qc_document_controls
    ADD CONSTRAINT rd_qc_document_controls_released_by_fkey FOREIGN KEY (released_by) REFERENCES public.profiles(id);


--
-- Name: rd_reports rd_reports_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_reports
    ADD CONSTRAINT rd_reports_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE SET NULL;


--
-- Name: rd_reports rd_reports_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_reports
    ADD CONSTRAINT rd_reports_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE SET NULL;


--
-- Name: rd_research_activities rd_research_activities_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_activities
    ADD CONSTRAINT rd_research_activities_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;


--
-- Name: rd_research_activities rd_research_activities_focus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_activities
    ADD CONSTRAINT rd_research_activities_focus_id_fkey FOREIGN KEY (focus_id) REFERENCES public.rd_focuses(id) ON DELETE CASCADE;


--
-- Name: rd_research_steps rd_research_steps_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_steps
    ADD CONSTRAINT rd_research_steps_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE SET NULL;


--
-- Name: rd_research_steps rd_research_steps_research_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_steps
    ADD CONSTRAINT rd_research_steps_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


--
-- Name: rd_research_subcomponents rd_research_subcomponents_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_subcomponents
    ADD CONSTRAINT rd_research_subcomponents_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE SET NULL;


--
-- Name: rd_research_subcomponents rd_research_subcomponents_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_subcomponents
    ADD CONSTRAINT rd_research_subcomponents_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE;


--
-- Name: rd_roles rd_roles_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_roles
    ADD CONSTRAINT rd_roles_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;


--
-- Name: rd_roles rd_roles_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_roles
    ADD CONSTRAINT rd_roles_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_roles rd_roles_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_roles
    ADD CONSTRAINT rd_roles_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.rd_roles(id) ON DELETE SET NULL;


--
-- Name: rd_selected_activities rd_selected_activities_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_activities
    ADD CONSTRAINT rd_selected_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


--
-- Name: rd_selected_activities rd_selected_activities_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_activities
    ADD CONSTRAINT rd_selected_activities_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_selected_filter rd_selected_filter_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_filter
    ADD CONSTRAINT rd_selected_filter_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_selected_steps rd_selected_steps_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_steps
    ADD CONSTRAINT rd_selected_steps_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_selected_steps rd_selected_steps_research_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_steps
    ADD CONSTRAINT rd_selected_steps_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


--
-- Name: rd_selected_steps rd_selected_steps_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_steps
    ADD CONSTRAINT rd_selected_steps_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE;


--
-- Name: rd_selected_subcomponents rd_selected_subcomponents_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_subcomponents
    ADD CONSTRAINT rd_selected_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_selected_subcomponents rd_selected_subcomponents_research_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_subcomponents
    ADD CONSTRAINT rd_selected_subcomponents_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


--
-- Name: rd_selected_subcomponents rd_selected_subcomponents_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_subcomponents
    ADD CONSTRAINT rd_selected_subcomponents_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE;


--
-- Name: rd_selected_subcomponents rd_selected_subcomponents_subcomponent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_selected_subcomponents
    ADD CONSTRAINT rd_selected_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;


--
-- Name: rd_signature_records rd_signature_records_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_signature_records
    ADD CONSTRAINT rd_signature_records_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_signatures rd_signatures_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_signatures
    ADD CONSTRAINT rd_signatures_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id);


--
-- Name: rd_state_proforma_data rd_state_proforma_data_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_proforma_data
    ADD CONSTRAINT rd_state_proforma_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.business_years(id) ON DELETE CASCADE;


--
-- Name: rd_state_proforma_lines rd_state_proforma_lines_state_proforma_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_proforma_lines
    ADD CONSTRAINT rd_state_proforma_lines_state_proforma_id_fkey FOREIGN KEY (state_proforma_id) REFERENCES public.rd_state_proformas(id) ON DELETE CASCADE;


--
-- Name: rd_subcomponents rd_subcomponents_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_subcomponents
    ADD CONSTRAINT rd_subcomponents_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


--
-- Name: rd_supplies rd_supplies_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supplies
    ADD CONSTRAINT rd_supplies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;


--
-- Name: rd_supply_subcomponents rd_supply_subcomponents_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supply_subcomponents
    ADD CONSTRAINT rd_supply_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_supply_subcomponents rd_supply_subcomponents_subcomponent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supply_subcomponents
    ADD CONSTRAINT rd_supply_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT rd_supply_subcomponents_subcomponent_id_fkey ON rd_supply_subcomponents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT rd_supply_subcomponents_subcomponent_id_fkey ON public.rd_supply_subcomponents IS 'References rd_research_subcomponents.id instead of rd_subcomponents.id to align with contractor allocations';


--
-- Name: rd_supply_subcomponents rd_supply_subcomponents_supply_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supply_subcomponents
    ADD CONSTRAINT rd_supply_subcomponents_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.rd_supplies(id) ON DELETE CASCADE;


--
-- Name: rd_supply_year_data rd_supply_year_data_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supply_year_data
    ADD CONSTRAINT rd_supply_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_supply_year_data rd_supply_year_data_supply_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_supply_year_data
    ADD CONSTRAINT rd_supply_year_data_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.rd_supplies(id) ON DELETE CASCADE;


--
-- Name: rd_support_documents rd_support_documents_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_support_documents
    ADD CONSTRAINT rd_support_documents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_support_documents rd_support_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_support_documents
    ADD CONSTRAINT rd_support_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);


--
-- Name: reinsurance_details reinsurance_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinsurance_details
    ADD CONSTRAINT reinsurance_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: strategy_commission_rates strategy_commission_rates_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_commission_rates
    ADD CONSTRAINT strategy_commission_rates_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: strategy_details strategy_details_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_details
    ADD CONSTRAINT strategy_details_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.tax_proposals(id) ON DELETE CASCADE;


--
-- Name: tax_calculations tax_calculations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_calculations
    ADD CONSTRAINT tax_calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: tax_estimates tax_estimates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_estimates
    ADD CONSTRAINT tax_estimates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tax_profiles tax_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT tax_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: tax_proposals tax_proposals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_proposals
    ADD CONSTRAINT tax_proposals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tool_enrollments tool_enrollments_client_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_enrollments
    ADD CONSTRAINT tool_enrollments_client_file_id_fkey FOREIGN KEY (client_file_id) REFERENCES public.admin_client_files(id) ON DELETE CASCADE;


--
-- Name: tool_enrollments tool_enrollments_enrolled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_enrollments
    ADD CONSTRAINT tool_enrollments_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES public.profiles(id);


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_qc_document_controls Admin can manage QC controls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage QC controls" ON public.rd_qc_document_controls USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: rd_signature_records Admin can manage all signature records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage all signature records" ON public.rd_signature_records USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: rd_client_portal_tokens Admin can manage portal tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage portal tokens" ON public.rd_client_portal_tokens USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: rd_signatures Admin can view all signatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view all signatures" ON public.rd_signatures FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: strategy_details Admins can insert strategy details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert strategy details" ON public.strategy_details FOR INSERT WITH CHECK (((auth.jwt() ->> 'role'::text) = 'admin'::text));


--
-- Name: tax_profiles Admins can insert tax profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert tax profiles" ON public.tax_profiles FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: admin_client_files Admins can manage all client files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all client files" ON public.admin_client_files USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: tool_enrollments Admins can manage all tool enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all tool enrollments" ON public.tool_enrollments USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: strategy_details Admins can update strategy details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update strategy details" ON public.strategy_details FOR UPDATE USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));


--
-- Name: admin_client_files Admins can view all client files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all client files" ON public.admin_client_files FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: leads Admins can view all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT USING (public.is_admin());


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());


--
-- Name: strategy_details Admins can view all strategy details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all strategy details" ON public.strategy_details FOR SELECT USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));


--
-- Name: tax_profiles Admins can view all tax profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tax profiles" ON public.tax_profiles FOR SELECT USING (public.is_admin());


--
-- Name: tax_proposals Admins can view all tax proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tax proposals" ON public.tax_proposals FOR SELECT USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));


--
-- Name: tool_enrollments Admins can view all tool enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tool enrollments" ON public.tool_enrollments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: user_preferences Admins can view all user preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all user preferences" ON public.user_preferences FOR SELECT USING (public.is_admin());


--
-- Name: tax_proposals Allow all delete for dev; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all delete for dev" ON public.tax_proposals FOR DELETE USING (true);


--
-- Name: rd_selected_filter Allow all for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for authenticated" ON public.rd_selected_filter USING ((auth.uid() IS NOT NULL));


--
-- Name: rd_contractor_year_data Allow all for dev; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for dev" ON public.rd_contractor_year_data USING (true) WITH CHECK (true);


--
-- Name: tax_proposals Allow all insert for dev; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all insert for dev" ON public.tax_proposals FOR INSERT WITH CHECK (true);


--
-- Name: profiles Allow all select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all select" ON public.profiles FOR SELECT USING (true);


--
-- Name: tax_proposals Allow all select for debug; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all select for debug" ON public.tax_proposals FOR SELECT USING (true);


--
-- Name: tax_proposals Allow all select for dev; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all select for dev" ON public.tax_proposals FOR SELECT USING (true);


--
-- Name: tax_proposals Allow all update for dev; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all update for dev" ON public.tax_proposals FOR UPDATE USING (true);


--
-- Name: rd_signature_records Allow authenticated users to create signatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to create signatures" ON public.rd_signature_records FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: rd_signature_records Allow authenticated users to view signatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view signatures" ON public.rd_signature_records FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_research_steps Allow read access to rd_research_steps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to rd_research_steps" ON public.rd_research_steps FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_research_subcomponents Allow read access to rd_research_subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to rd_research_subcomponents" ON public.rd_research_subcomponents FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_signatures Anyone can create signatures via portal; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create signatures via portal" ON public.rd_signatures FOR INSERT WITH CHECK (true);


--
-- Name: rd_contractor_subcomponents Enable delete access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractor_subcomponents FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_contractors Enable delete access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractors FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_employee_subcomponents Enable delete access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_employee_subcomponents FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_expenses Enable delete access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_expenses FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_reports Enable delete access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_reports FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_supplies Enable delete access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_supplies FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_research_steps Enable delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for authenticated users" ON public.rd_research_steps FOR DELETE USING ((auth.uid() IS NOT NULL));


--
-- Name: rd_research_subcomponents Enable delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for authenticated users" ON public.rd_research_subcomponents FOR DELETE USING (true);


--
-- Name: rd_selected_steps Enable delete for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for authenticated users only" ON public.rd_selected_steps FOR DELETE USING ((auth.uid() IS NOT NULL));


--
-- Name: rd_contractor_subcomponents Enable insert access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractor_subcomponents FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: rd_contractors Enable insert access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractors FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: rd_employee_subcomponents Enable insert access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_employee_subcomponents FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: rd_expenses Enable insert access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_expenses FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: rd_reports Enable insert access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_reports FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: rd_supplies Enable insert access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_supplies FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: rd_research_steps Enable insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users" ON public.rd_research_steps FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: rd_research_subcomponents Enable insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users" ON public.rd_research_subcomponents FOR INSERT WITH CHECK (true);


--
-- Name: rd_selected_steps Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.rd_selected_steps FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: rd_research_steps Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.rd_research_steps FOR SELECT USING (true);


--
-- Name: rd_research_subcomponents Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.rd_research_subcomponents FOR SELECT USING (true);


--
-- Name: rd_selected_steps Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.rd_selected_steps FOR SELECT USING (true);


--
-- Name: rd_contractor_subcomponents Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractor_subcomponents FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_contractors Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractors FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_employee_subcomponents Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.rd_employee_subcomponents FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_expenses Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.rd_expenses FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_reports Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.rd_reports FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_supplies Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.rd_supplies FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_contractor_subcomponents Enable update access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractor_subcomponents FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_contractors Enable update access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractors FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_employee_subcomponents Enable update access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for authenticated users" ON public.rd_employee_subcomponents FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_expenses Enable update access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for authenticated users" ON public.rd_expenses FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_reports Enable update access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for authenticated users" ON public.rd_reports FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_supplies Enable update access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for authenticated users" ON public.rd_supplies FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_research_steps Enable update for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for authenticated users" ON public.rd_research_steps FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: rd_research_subcomponents Enable update for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for authenticated users" ON public.rd_research_subcomponents FOR UPDATE USING (true);


--
-- Name: rd_selected_steps Enable update for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for authenticated users only" ON public.rd_selected_steps FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: business_years Users can delete business years for their businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete business years for their businesses" ON public.business_years FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.businesses
     JOIN public.clients ON ((businesses.client_id = clients.id)))
  WHERE ((businesses.id = business_years.business_id) AND (clients.created_by = auth.uid())))));


--
-- Name: businesses Users can delete businesses for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete businesses for their clients" ON public.businesses FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.clients
  WHERE ((clients.id = businesses.client_id) AND (clients.created_by = auth.uid())))));


--
-- Name: tax_calculations Users can delete own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own calculations" ON public.tax_calculations FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: personal_years Users can delete personal years for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete personal years for their clients" ON public.personal_years FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.clients
  WHERE ((clients.id = personal_years.client_id) AND (clients.created_by = auth.uid())))));


--
-- Name: centralized_businesses Users can delete their own businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own businesses" ON public.centralized_businesses FOR DELETE USING ((auth.uid() IS NOT NULL));


--
-- Name: calculations Users can delete their own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own calculations" ON public.calculations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: clients Users can delete their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING ((auth.uid() = created_by));


--
-- Name: rd_contractor_subcomponents Users can delete their own contractor subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR DELETE USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));


--
-- Name: rd_contractor_year_data Users can delete their own contractor year data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own contractor year data" ON public.rd_contractor_year_data FOR DELETE USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));


--
-- Name: rd_federal_credit_results Users can delete their own federal credit results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own federal credit results" ON public.rd_federal_credit_results FOR DELETE USING ((auth.uid() IS NOT NULL));


--
-- Name: rd_state_proforma_data Users can delete their own state pro forma data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own state pro forma data" ON public.rd_state_proforma_data FOR DELETE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));


--
-- Name: rd_supplies Users can delete their own supplies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own supplies" ON public.rd_supplies FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));


--
-- Name: rd_supply_subcomponents Users can delete their own supply subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));


--
-- Name: rd_supply_year_data Users can delete their own supply year data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own supply year data" ON public.rd_supply_year_data FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));


--
-- Name: tax_profiles Users can delete their own tax profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tax profile" ON public.tax_profiles FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: business_years Users can insert business years for their businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert business years for their businesses" ON public.business_years FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.businesses
     JOIN public.clients ON ((businesses.client_id = clients.id)))
  WHERE ((businesses.id = business_years.business_id) AND (clients.created_by = auth.uid())))));


--
-- Name: businesses Users can insert businesses for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert businesses for their clients" ON public.businesses FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.clients
  WHERE ((clients.id = businesses.client_id) AND (clients.created_by = auth.uid())))));


--
-- Name: tax_calculations Users can insert own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own calculations" ON public.tax_calculations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: leads Users can insert own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own leads" ON public.leads FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: rd_federal_credit Users can insert own rd_federal_credit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own rd_federal_credit" ON public.rd_federal_credit FOR INSERT WITH CHECK ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));


--
-- Name: tax_profiles Users can insert own tax profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own tax profiles" ON public.tax_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert own user preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own user preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: personal_years Users can insert personal years for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert personal years for their clients" ON public.personal_years FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.clients
  WHERE ((clients.id = personal_years.client_id) AND (clients.created_by = auth.uid())))));


--
-- Name: augusta_rule_details Users can insert their own augusta rule details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own augusta rule details" ON public.augusta_rule_details FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = augusta_rule_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: centralized_businesses Users can insert their own businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own businesses" ON public.centralized_businesses FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: calculations Users can insert their own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own calculations" ON public.calculations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: charitable_donation_details Users can insert their own charitable donation details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own charitable donation details" ON public.charitable_donation_details FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = charitable_donation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: clients Users can insert their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: rd_contractor_subcomponents Users can insert their own contractor subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));


--
-- Name: rd_contractor_year_data Users can insert their own contractor year data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own contractor year data" ON public.rd_contractor_year_data FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));


--
-- Name: cost_segregation_details Users can insert their own cost segregation details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own cost segregation details" ON public.cost_segregation_details FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = cost_segregation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: convertible_tax_bonds_details Users can insert their own ctb details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own ctb details" ON public.convertible_tax_bonds_details FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = convertible_tax_bonds_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: rd_federal_credit_results Users can insert their own federal credit results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own federal credit results" ON public.rd_federal_credit_results FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: hire_children_details Users can insert their own hire children details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own hire children details" ON public.hire_children_details FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = hire_children_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: user_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: rd_state_proforma_data Users can insert their own state pro forma data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own state pro forma data" ON public.rd_state_proforma_data FOR INSERT WITH CHECK ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));


--
-- Name: strategy_details Users can insert their own strategy details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own strategy details" ON public.strategy_details FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tax_proposals tp
  WHERE ((tp.id = strategy_details.proposal_id) AND (tp.user_id = auth.uid())))));


--
-- Name: rd_supplies Users can insert their own supplies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own supplies" ON public.rd_supplies FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));


--
-- Name: rd_supply_subcomponents Users can insert their own supply subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));


--
-- Name: rd_supply_year_data Users can insert their own supply year data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own supply year data" ON public.rd_supply_year_data FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));


--
-- Name: tax_profiles Users can insert their own tax profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own tax profile" ON public.tax_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tax_proposals Users can insert their own tax proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own tax proposals" ON public.tax_proposals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: admin_client_files Users can manage their own client files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own client files" ON public.admin_client_files USING ((admin_id = auth.uid()));


--
-- Name: tool_enrollments Users can manage their own tool enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own tool enrollments" ON public.tool_enrollments USING ((EXISTS ( SELECT 1
   FROM public.admin_client_files acf
  WHERE ((acf.id = tool_enrollments.client_file_id) AND (acf.admin_id = auth.uid())))));


--
-- Name: profiles Users can select their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: tax_profiles Users can select their own tax profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select their own tax profile" ON public.tax_profiles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: business_years Users can update business years for their businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update business years for their businesses" ON public.business_years FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.businesses
     JOIN public.clients ON ((businesses.client_id = clients.id)))
  WHERE ((businesses.id = business_years.business_id) AND (clients.created_by = auth.uid())))));


--
-- Name: businesses Users can update businesses for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update businesses for their clients" ON public.businesses FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.clients
  WHERE ((clients.id = businesses.client_id) AND (clients.created_by = auth.uid())))));


--
-- Name: tax_calculations Users can update own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own calculations" ON public.tax_calculations FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: leads Users can update own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: rd_federal_credit Users can update own rd_federal_credit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own rd_federal_credit" ON public.rd_federal_credit FOR UPDATE USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));


--
-- Name: tax_profiles Users can update own tax profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own tax profiles" ON public.tax_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update own user preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own user preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: personal_years Users can update personal years for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update personal years for their clients" ON public.personal_years FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.clients
  WHERE ((clients.id = personal_years.client_id) AND (clients.created_by = auth.uid())))));


--
-- Name: augusta_rule_details Users can update their own augusta rule details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own augusta rule details" ON public.augusta_rule_details FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = augusta_rule_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: centralized_businesses Users can update their own businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own businesses" ON public.centralized_businesses FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: calculations Users can update their own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own calculations" ON public.calculations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: charitable_donation_details Users can update their own charitable donation details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own charitable donation details" ON public.charitable_donation_details FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = charitable_donation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: clients Users can update their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING ((auth.uid() = created_by));


--
-- Name: rd_contractor_subcomponents Users can update their own contractor subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR UPDATE USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));


--
-- Name: rd_contractor_year_data Users can update their own contractor year data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own contractor year data" ON public.rd_contractor_year_data FOR UPDATE USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));


--
-- Name: cost_segregation_details Users can update their own cost segregation details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own cost segregation details" ON public.cost_segregation_details FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = cost_segregation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: convertible_tax_bonds_details Users can update their own ctb details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own ctb details" ON public.convertible_tax_bonds_details FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = convertible_tax_bonds_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: rd_federal_credit_results Users can update their own federal credit results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own federal credit results" ON public.rd_federal_credit_results FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: hire_children_details Users can update their own hire children details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own hire children details" ON public.hire_children_details FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = hire_children_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: rd_state_proforma_data Users can update their own state pro forma data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own state pro forma data" ON public.rd_state_proforma_data FOR UPDATE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));


--
-- Name: strategy_details Users can update their own strategy details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own strategy details" ON public.strategy_details FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.tax_proposals tp
  WHERE ((tp.id = strategy_details.proposal_id) AND (tp.user_id = auth.uid())))));


--
-- Name: rd_supplies Users can update their own supplies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own supplies" ON public.rd_supplies FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));


--
-- Name: rd_supply_subcomponents Users can update their own supply subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));


--
-- Name: rd_supply_year_data Users can update their own supply year data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own supply year data" ON public.rd_supply_year_data FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));


--
-- Name: tax_profiles Users can update their own tax profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tax profile" ON public.tax_profiles FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: tax_proposals Users can update their own tax proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tax proposals" ON public.tax_proposals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: business_years Users can view business years for their businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view business years for their businesses" ON public.business_years FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.businesses
     JOIN public.clients ON ((businesses.client_id = clients.id)))
  WHERE ((businesses.id = business_years.business_id) AND (clients.created_by = auth.uid())))));


--
-- Name: businesses Users can view businesses for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view businesses for their clients" ON public.businesses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.clients
  WHERE ((clients.id = businesses.client_id) AND (clients.created_by = auth.uid())))));


--
-- Name: tax_calculations Users can view own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own calculations" ON public.tax_calculations FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: leads Users can view own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: rd_federal_credit Users can view own rd_federal_credit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own rd_federal_credit" ON public.rd_federal_credit FOR SELECT USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));


--
-- Name: tax_profiles Users can view own tax profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tax profiles" ON public.tax_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can view own user preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own user preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: personal_years Users can view personal years for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view personal years for their clients" ON public.personal_years FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.clients
  WHERE ((clients.id = personal_years.client_id) AND (clients.created_by = auth.uid())))));


--
-- Name: augusta_rule_details Users can view their own augusta rule details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own augusta rule details" ON public.augusta_rule_details FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = augusta_rule_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: centralized_businesses Users can view their own businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own businesses" ON public.centralized_businesses FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: calculations Users can view their own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own calculations" ON public.calculations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: charitable_donation_details Users can view their own charitable donation details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own charitable donation details" ON public.charitable_donation_details FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = charitable_donation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: admin_client_files Users can view their own client files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own client files" ON public.admin_client_files FOR SELECT USING ((admin_id = auth.uid()));


--
-- Name: clients Users can view their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING ((auth.uid() = created_by));


--
-- Name: rd_contractor_subcomponents Users can view their own contractor subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR SELECT USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));


--
-- Name: rd_contractor_year_data Users can view their own contractor year data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own contractor year data" ON public.rd_contractor_year_data FOR SELECT USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));


--
-- Name: cost_segregation_details Users can view their own cost segregation details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own cost segregation details" ON public.cost_segregation_details FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = cost_segregation_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: convertible_tax_bonds_details Users can view their own ctb details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own ctb details" ON public.convertible_tax_bonds_details FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = convertible_tax_bonds_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: rd_federal_credit_results Users can view their own federal credit results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own federal credit results" ON public.rd_federal_credit_results FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: hire_children_details Users can view their own hire children details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own hire children details" ON public.hire_children_details FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.strategy_details sd
     JOIN public.tax_proposals tp ON ((tp.id = sd.proposal_id)))
  WHERE ((sd.id = hire_children_details.strategy_detail_id) AND (tp.user_id = auth.uid())))));


--
-- Name: rd_state_proforma_data Users can view their own state pro forma data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own state pro forma data" ON public.rd_state_proforma_data FOR SELECT USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));


--
-- Name: strategy_details Users can view their own strategy details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own strategy details" ON public.strategy_details FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tax_proposals tp
  WHERE ((tp.id = strategy_details.proposal_id) AND (tp.user_id = auth.uid())))));


--
-- Name: rd_supplies Users can view their own supplies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own supplies" ON public.rd_supplies FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));


--
-- Name: rd_supply_subcomponents Users can view their own supply subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));


--
-- Name: rd_supply_year_data Users can view their own supply year data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own supply year data" ON public.rd_supply_year_data FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));


--
-- Name: tax_proposals Users can view their own tax proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tax proposals" ON public.tax_proposals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tool_enrollments Users can view their own tool enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tool enrollments" ON public.tool_enrollments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.admin_client_files acf
  WHERE ((acf.id = tool_enrollments.client_file_id) AND (acf.admin_id = auth.uid())))));


--
-- Name: admin_client_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_client_files ENABLE ROW LEVEL SECURITY;

--
-- Name: augusta_rule_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.augusta_rule_details ENABLE ROW LEVEL SECURITY;

--
-- Name: business_years; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_years ENABLE ROW LEVEL SECURITY;

--
-- Name: businesses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

--
-- Name: calculations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

--
-- Name: centralized_businesses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.centralized_businesses ENABLE ROW LEVEL SECURITY;

--
-- Name: charitable_donation_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.charitable_donation_details ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: contractor_expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contractor_expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: convertible_tax_bonds_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.convertible_tax_bonds_details ENABLE ROW LEVEL SECURITY;

--
-- Name: cost_segregation_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cost_segregation_details ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: family_management_company_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.family_management_company_details ENABLE ROW LEVEL SECURITY;

--
-- Name: hire_children_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hire_children_details ENABLE ROW LEVEL SECURITY;

--
-- Name: personal_years; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personal_years ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_client_portal_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_client_portal_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_contractor_year_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_contractor_year_data ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_contractors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_contractors ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_employee_subcomponents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_employee_subcomponents ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_federal_credit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_federal_credit ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_federal_credit_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_federal_credit_results ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_qc_document_controls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_qc_document_controls ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_research_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_research_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_research_subcomponents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_research_subcomponents ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_selected_filter; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_selected_filter ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_selected_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_selected_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_signature_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_signature_records ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_signatures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_signatures ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_state_proforma_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_state_proforma_data ENABLE ROW LEVEL SECURITY;

--
-- Name: rd_supplies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_supplies ENABLE ROW LEVEL SECURITY;

--
-- Name: reinsurance_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reinsurance_details ENABLE ROW LEVEL SECURITY;

--
-- Name: research_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.research_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: strategy_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.strategy_details ENABLE ROW LEVEL SECURITY;

--
-- Name: supply_expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supply_expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_calculations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tool_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tool_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Authenticated users can delete logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can delete logos" ON storage.objects FOR DELETE USING (((bucket_id = 'logos'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Authenticated users can update logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE USING (((bucket_id = 'logos'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Authenticated users can upload logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'logos'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Public read access for logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Public read access for logos" ON storage.objects FOR SELECT USING ((bucket_id = 'logos'::text));


--
-- Name: objects Users can upload support documents; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload support documents" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'support-documents'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Users can view their business documents; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can view their business documents" ON storage.objects FOR SELECT USING (((bucket_id = 'support-documents'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

