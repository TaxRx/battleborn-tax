--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
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
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA _realtime;


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
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_functions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_functions;


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
-- Name: access_level_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.access_level_type AS ENUM (
    'full',
    'limited',
    'reporting',
    'none',
    'client',
    'expert'
);


--
-- Name: account_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_type AS ENUM (
    'admin',
    'platform',
    'affiliate',
    'client',
    'expert'
);


--
-- Name: activity_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


--
-- Name: activity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_type AS ENUM (
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


--
-- Name: client_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.client_role AS ENUM (
    'owner',
    'member',
    'viewer',
    'accountant'
);


--
-- Name: engagement_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.engagement_status AS ENUM (
    'active',
    'inactive',
    'pending',
    'completed',
    'on_hold',
    'cancelled'
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
    'OTHER',
    's_corp',
    'llc',
    'c_corp',
    'partnership',
    'sole_prop',
    'other'
);


--
-- Name: filing_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.filing_status AS ENUM (
    'MFJ',
    'Single',
    'HOH',
    'MFS'
);


--
-- Name: proposal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.proposal_status AS ENUM (
    'draft',
    'submitted',
    'in_review',
    'expert_sent',
    'finalized'
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
-- Name: strategy_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.strategy_type AS ENUM (
    'deduction',
    'credit',
    'shift'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'affiliate',
    'admin'
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
    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
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
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: accept_invitation(character varying, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.accept_invitation(invitation_token character varying, user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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

CREATE FUNCTION public.archive_client(p_client_id uuid, p_archive boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE clients 
    SET 
        archived = p_archive,
        archived_at = CASE WHEN p_archive THEN NOW() ELSE NULL END
    WHERE id = p_client_id;
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
-- Name: calculate_dashboard_metrics(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_dashboard_metrics(p_client_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION calculate_dashboard_metrics(p_client_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_dashboard_metrics(p_client_id uuid) IS 'Calculates and caches dashboard metrics for a client';


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
-- Name: cleanup_old_security_events(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_security_events() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION cleanup_old_security_events(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.cleanup_old_security_events() IS 'Clean up old security events to maintain performance';


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
-- Name: create_profile_if_missing(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_profile_if_missing(user_id uuid, user_email text, user_name text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
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
-- Name: ensure_client_has_owner(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_client_has_owner() RETURNS trigger
    LANGUAGE plpgsql
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


--
-- Name: expire_old_invitations(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.expire_old_invitations() RETURNS integer
    LANGUAGE plpgsql
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


--
-- Name: generate_invitation_token(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invitation_token() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;


--
-- Name: get_affiliate_from_client(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_affiliate_from_client(client_id uuid) RETURNS TABLE(affiliate_id uuid, affiliate_name text, affiliate_email text)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION get_affiliate_from_client(client_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_affiliate_from_client(client_id uuid) IS 'Helper function to get affiliate information from a client ID';


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
-- Name: get_client_info(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_info(client_id uuid) RETURNS TABLE(id uuid, full_name text, email text, phone text, affiliate_id uuid, affiliate_name text, affiliate_email text)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION get_client_info(client_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_client_info(client_id uuid) IS 'Helper function to get complete client information including affiliate details';


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
-- Name: get_tax_proposal_affiliate(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_tax_proposal_affiliate(proposal_id uuid) RETURNS TABLE(affiliate_id uuid, affiliate_name text, affiliate_email text)
    LANGUAGE plpgsql SECURITY DEFINER
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
-- Name: get_user_client_role(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_client_role(check_user_id uuid, check_client_id uuid) RETURNS public.client_role
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION get_user_client_role(check_user_id uuid, check_client_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_client_role(check_user_id uuid, check_client_id uuid) IS 'Get user role for a specific client';


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
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;


--
-- Name: is_affiliated_with_client(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_affiliated_with_client(client_id_to_check uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_id_to_check AND affiliate_id = auth.uid()
  );
END;
$$;


--
-- Name: log_client_access(text, uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_client_access(action_type text, client_id uuid, user_id uuid DEFAULT auth.uid(), additional_info jsonb DEFAULT '{}'::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION log_client_access(action_type text, client_id uuid, user_id uuid, additional_info jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.log_client_access(action_type text, client_id uuid, user_id uuid, additional_info jsonb) IS 'Log client access events for audit trail';


--
-- Name: log_client_activity(uuid, uuid, public.activity_type, text, text, public.activity_priority, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_client_activity(p_client_id uuid, p_user_id uuid, p_activity_type public.activity_type, p_title text, p_description text DEFAULT NULL::text, p_priority public.activity_priority DEFAULT 'medium'::public.activity_priority, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION log_client_activity(p_client_id uuid, p_user_id uuid, p_activity_type public.activity_type, p_title text, p_description text, p_priority public.activity_priority, p_metadata jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.log_client_activity(p_client_id uuid, p_user_id uuid, p_activity_type public.activity_type, p_title text, p_description text, p_priority public.activity_priority, p_metadata jsonb) IS 'Logs a client activity and updates engagement status';


--
-- Name: log_security_event(text, uuid, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_security_event(event_type text, client_id uuid DEFAULT NULL::uuid, event_data jsonb DEFAULT '{}'::jsonb, severity text DEFAULT 'LOW'::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION log_security_event(event_type text, client_id uuid, event_data jsonb, severity text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.log_security_event(event_type text, client_id uuid, event_data jsonb, severity text) IS 'Log security events for audit trail';


--
-- Name: security_health_check(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.security_health_check() RETURNS TABLE(check_name text, status text, details text, severity text)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION security_health_check(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.security_health_check() IS 'Comprehensive security health check for the database';


--
-- Name: set_invitation_token(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_invitation_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.token IS NULL OR NEW.token = '' THEN
        NEW.token := generate_invitation_token();
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
-- Name: update_client_engagement_status(uuid, public.engagement_status, integer, numeric, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_client_engagement_status(p_client_id uuid, p_status public.engagement_status DEFAULT NULL::public.engagement_status, p_pending_actions integer DEFAULT NULL::integer, p_completion_percentage numeric DEFAULT NULL::numeric, p_next_action_due timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION update_client_engagement_status(p_client_id uuid, p_status public.engagement_status, p_pending_actions integer, p_completion_percentage numeric, p_next_action_due timestamp with time zone); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_client_engagement_status(p_client_id uuid, p_status public.engagement_status, p_pending_actions integer, p_completion_percentage numeric, p_next_action_due timestamp with time zone) IS 'Updates client engagement status and metrics';


--
-- Name: update_client_users_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_client_users_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_invitations_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_invitations_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: user_has_client_access(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_client_access(check_user_id uuid, check_client_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION user_has_client_access(check_user_id uuid, check_client_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_has_client_access(check_user_id uuid, check_client_id uuid) IS 'Check if user has any access to a client';


--
-- Name: user_has_client_role(uuid, uuid, public.client_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_client_role(check_user_id uuid, check_client_id uuid, required_role public.client_role) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION user_has_client_role(check_user_id uuid, check_client_id uuid, required_role public.client_role); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_has_client_role(check_user_id uuid, check_client_id uuid, required_role public.client_role) IS 'Check if user has specific role or higher for a client';


--
-- Name: user_has_direct_client_access(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_direct_client_access(user_id uuid, client_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: user_is_client_owner(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_is_client_owner(user_id uuid, client_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: validate_client_access(uuid, public.client_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_client_access(check_client_id uuid, required_role public.client_role DEFAULT 'viewer'::public.client_role) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION validate_client_access(check_client_id uuid, required_role public.client_role); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_client_access(check_client_id uuid, required_role public.client_role) IS 'Validate user has required access to client and log the attempt';


--
-- Name: validate_historical_data(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_historical_data(data jsonb) RETURNS boolean
    LANGUAGE plpgsql
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


--
-- Name: validate_rls_enabled(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_rls_enabled() RETURNS TABLE(table_name text, rls_enabled boolean, has_policies boolean, policy_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION validate_rls_enabled(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_rls_enabled() IS 'Validate that RLS is properly enabled on all tables';


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
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
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
-- Name: http_request(); Type: FUNCTION; Schema: supabase_functions; Owner: -
--

CREATE FUNCTION supabase_functions.http_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'supabase_functions'
    AS $$
  DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  BEGIN
    IF url IS NULL OR url = 'null' THEN
      RAISE EXCEPTION 'url argument is missing';
    END IF;

    IF method IS NULL OR method = 'null' THEN
      RAISE EXCEPTION 'method argument is missing';
    END IF;

    IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
      headers = '{"Content-Type": "application/json"}'::jsonb;
    ELSE
      headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
      params = '{}'::jsonb;
    ELSE
      params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
      timeout_ms = 1000;
    ELSE
      timeout_ms = TG_ARGV[4]::integer;
    END IF;

    CASE
      WHEN method = 'GET' THEN
        SELECT http_get INTO request_id FROM net.http_get(
          url,
          params,
          headers,
          timeout_ms
        );
      WHEN method = 'POST' THEN
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );

        SELECT http_post INTO request_id FROM net.http_post(
          url,
          payload,
          params,
          headers,
          timeout_ms
        );
      ELSE
        RAISE EXCEPTION 'method argument % is invalid', method;
    END CASE;

    INSERT INTO supabase_functions.hooks
      (hook_table_id, hook_name, request_id)
    VALUES
      (TG_RELID, TG_NAME, request_id);

    RETURN NEW;
  END
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL,
    migrations_ran integer DEFAULT 0,
    broadcast_adapter character varying(255) DEFAULT 'phoenix'::character varying
);


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
-- Name: account_tool_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_tool_access (
    account_id uuid NOT NULL,
    tool_id uuid NOT NULL,
    access_level public.access_level_type DEFAULT 'none'::public.access_level_type NOT NULL,
    affiliate_id uuid,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE account_tool_access; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.account_tool_access IS 'Manages tool access permissions for accounts, with optional affiliate override';


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    type public.account_type NOT NULL,
    address text,
    logo_url text,
    website_url text,
    stripe_customer_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE accounts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.accounts IS 'Central table for all entities: admin, platform, affiliate, client, and expert accounts';


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
-- Name: affiliate_tool_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_tool_permissions (
    affiliate_profile_id uuid NOT NULL,
    tool_id uuid NOT NULL,
    permission_level text NOT NULL,
    CONSTRAINT affiliate_tool_permissions_permission_level_check CHECK ((permission_level = ANY (ARRAY['full'::text, 'limited'::text, 'reporting'::text, 'none'::text])))
);


--
-- Name: TABLE affiliate_tool_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.affiliate_tool_permissions IS 'Maps which tools an affiliate can access, as set by their parent partner.';


--
-- Name: affiliates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliates (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    commission_rate numeric(5,4) DEFAULT 0.10,
    territory text,
    specializations text[],
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE affiliates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.affiliates IS 'Extension table for affiliate-specific data when account.type = affiliate';


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
-- Name: client_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.client_role DEFAULT 'member'::public.client_role NOT NULL,
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_role CHECK ((role = ANY (ARRAY['owner'::public.client_role, 'member'::public.client_role, 'viewer'::public.client_role, 'accountant'::public.client_role])))
);


--
-- Name: TABLE client_users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.client_users IS 'Links users (profiles) to client accounts, allowing multiple users per client.';


--
-- Name: COLUMN client_users.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.client_users.role IS 'User role for this client: owner (full access), member (standard), viewer (read-only), accountant (professional)';


--
-- Name: COLUMN client_users.invited_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.client_users.invited_by IS 'User who invited this user to the client';


--
-- Name: COLUMN client_users.invited_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.client_users.invited_at IS 'When the invitation was sent';


--
-- Name: COLUMN client_users.accepted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.client_users.accepted_at IS 'When the user accepted the invitation';


--
-- Name: COLUMN client_users.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.client_users.is_active IS 'Whether this user relationship is currently active';


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
    zip_code text,
    affiliate_id uuid,
    user_id uuid,
    partner_id uuid,
    account_id uuid,
    primary_affiliate_id uuid
);


--
-- Name: COLUMN clients.affiliate_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clients.affiliate_id IS 'References the affiliate who manages this client';


--
-- Name: client_access_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.client_access_summary AS
 SELECT c.id AS client_id,
    c.full_name AS client_name,
    c.affiliate_id,
    count(cu.id) AS total_users,
    count(
        CASE
            WHEN (cu.role = 'owner'::public.client_role) THEN 1
            ELSE NULL::integer
        END) AS owners,
    count(
        CASE
            WHEN (cu.role = 'member'::public.client_role) THEN 1
            ELSE NULL::integer
        END) AS members,
    count(
        CASE
            WHEN (cu.role = 'viewer'::public.client_role) THEN 1
            ELSE NULL::integer
        END) AS viewers,
    count(
        CASE
            WHEN (cu.role = 'accountant'::public.client_role) THEN 1
            ELSE NULL::integer
        END) AS accountants,
    count(
        CASE
            WHEN (cu.is_active = true) THEN 1
            ELSE NULL::integer
        END) AS active_users,
    max(cu.created_at) AS last_user_added
   FROM (public.clients c
     LEFT JOIN public.client_users cu ON ((c.id = cu.client_id)))
  GROUP BY c.id, c.full_name, c.affiliate_id
  ORDER BY c.full_name;


--
-- Name: VIEW client_access_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.client_access_summary IS 'Summary view showing user access patterns for each client';


--
-- Name: client_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    activity_type public.activity_type NOT NULL,
    title text NOT NULL,
    description text,
    priority public.activity_priority DEFAULT 'medium'::public.activity_priority,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE client_activities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.client_activities IS 'Tracks all client activities for dashboard display and audit purposes';


--
-- Name: client_dashboard_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_dashboard_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    metric_type text NOT NULL,
    metric_value numeric,
    metric_data jsonb DEFAULT '{}'::jsonb,
    calculated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE client_dashboard_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.client_dashboard_metrics IS 'Cached dashboard metrics for performance optimization';


--
-- Name: client_engagement_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_engagement_status (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    status public.engagement_status DEFAULT 'active'::public.engagement_status NOT NULL,
    last_activity_at timestamp with time zone,
    last_login_at timestamp with time zone,
    total_activities integer DEFAULT 0,
    pending_actions integer DEFAULT 0,
    completion_percentage numeric(5,2) DEFAULT 0.00,
    next_action_due timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE client_engagement_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.client_engagement_status IS 'Maintains current engagement status and metrics for each client';


--
-- Name: client_dashboard_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.client_dashboard_summary AS
 SELECT c.id,
    c.full_name,
    c.email,
    ces.status AS engagement_status,
    ces.last_activity_at,
    ces.last_login_at,
    ces.total_activities,
    ces.pending_actions,
    ces.completion_percentage,
    ces.next_action_due,
    count(ca.id) AS recent_activities_count,
    count(
        CASE
            WHEN (ca.is_read = false) THEN 1
            ELSE NULL::integer
        END) AS unread_activities_count
   FROM ((public.clients c
     LEFT JOIN public.client_engagement_status ces ON ((c.id = ces.client_id)))
     LEFT JOIN public.client_activities ca ON (((c.id = ca.client_id) AND (ca.created_at >= (now() - '7 days'::interval)))))
  GROUP BY c.id, c.full_name, c.email, ces.status, ces.last_activity_at, ces.last_login_at, ces.total_activities, ces.pending_actions, ces.completion_percentage, ces.next_action_due;


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
-- Name: drf_tmp_test; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drf_tmp_test (
    id uuid DEFAULT gen_random_uuid() NOT NULL
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
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    account_id uuid
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
-- Name: invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    invited_by uuid NOT NULL,
    email character varying(255) NOT NULL,
    role public.client_role DEFAULT 'member'::public.client_role NOT NULL,
    token character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '48:00:00'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    accepted_by uuid,
    message text,
    resent_count integer DEFAULT 0,
    last_resent_at timestamp with time zone,
    CONSTRAINT invitations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    partner_id uuid NOT NULL,
    status text DEFAULT 'due'::text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    stripe_invoice_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['due'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])))
);


--
-- Name: TABLE invoices; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.invoices IS 'Stores invoices generated from transactions for partners.';


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
-- Name: partner_tool_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_tool_subscriptions (
    partner_id uuid NOT NULL,
    tool_id uuid NOT NULL,
    subscription_level text NOT NULL,
    CONSTRAINT partner_tool_subscriptions_subscription_level_check CHECK ((subscription_level = ANY (ARRAY['full'::text, 'limited'::text, 'reporting'::text, 'none'::text])))
);


--
-- Name: TABLE partner_tool_subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.partner_tool_subscriptions IS 'Maps which tools a partner is subscribed to, as set by the platform admin.';


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    company_name text NOT NULL,
    logo_url text,
    status text DEFAULT 'active'::text NOT NULL,
    stripe_customer_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT partners_status_check CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text])))
);


--
-- Name: TABLE partners; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.partners IS 'Stores partner organizations who are the primary customers of the SaaS platform.';


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
    updated_at timestamp with time zone DEFAULT now(),
    partner_id uuid,
    access_level text,
    avatar_url text,
    account_id uuid,
    CONSTRAINT profiles_access_level_check CHECK ((access_level = ANY (ARRAY['platform'::text, 'partner'::text, 'affiliate'::text, 'client'::text])))
);


--
-- Name: TABLE profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.profiles IS 'Primary user table for application. All business logic should reference this table, not auth.users directly.';


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
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: rd_focuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_focuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    area_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
    step text
);


--
-- Name: rd_research_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_research_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
-- Name: rd_business_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_business_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    year integer NOT NULL,
    gross_receipts numeric(15,2) NOT NULL,
    total_qre numeric(15,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: rd_businesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    ein text NOT NULL,
    entity_type public.entity_type NOT NULL,
    start_year integer NOT NULL,
    domicile_state text NOT NULL,
    contact_info jsonb NOT NULL,
    is_controlled_grp boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    historical_data jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT check_historical_data_structure CHECK (public.validate_historical_data(historical_data))
);


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
    user_id uuid
);


--
-- Name: rd_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    first_name text NOT NULL,
    role_id uuid NOT NULL,
    is_owner boolean DEFAULT false,
    annual_wage numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_name text,
    user_id uuid
);


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
    updated_at timestamp with time zone DEFAULT now()
);


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
    updated_at timestamp with time zone DEFAULT now()
);


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
    alternative_paths text
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
    baseline_applied_percent numeric
);


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
    research_guidelines jsonb
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
    updated_at timestamp with time zone DEFAULT now()
);


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
    practice_percentage numeric
);


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
-- Name: recent_client_activities; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.recent_client_activities AS
 SELECT ca.id,
    ca.client_id,
    ca.user_id,
    ca.activity_type,
    ca.title,
    ca.description,
    ca.priority,
    ca.metadata,
    ca.is_read,
    ca.created_at,
    ca.updated_at,
    c.full_name AS client_name,
    p.full_name AS user_name
   FROM ((public.client_activities ca
     JOIN public.clients c ON ((ca.client_id = c.id)))
     LEFT JOIN public.profiles p ON ((ca.user_id = p.id)))
  WHERE (ca.created_at >= (now() - '30 days'::interval))
  ORDER BY ca.created_at DESC;


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
-- Name: security_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    user_id uuid,
    client_id uuid,
    ip_address inet,
    user_agent text,
    event_data jsonb,
    severity text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT security_events_severity_check CHECK ((severity = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'CRITICAL'::text])))
);


--
-- Name: TABLE security_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.security_events IS 'Audit log for security-related events and access attempts';


--
-- Name: security_policy_audit; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.security_policy_audit AS
 SELECT schemaname,
    tablename,
    policyname,
    cmd,
        CASE
            WHEN ((qual ~~ '%true%'::text) OR (qual ~~ '%1=1%'::text)) THEN 'PERMISSIVE'::text
            WHEN (qual ~~ '%auth.uid()%'::text) THEN 'USER_SCOPED'::text
            WHEN (qual ~~ '%role_type%'::text) THEN 'ROLE_BASED'::text
            ELSE 'CUSTOM'::text
        END AS policy_type,
    qual AS policy_condition
   FROM pg_policies
  WHERE (schemaname = 'public'::name)
  ORDER BY tablename, policyname;


--
-- Name: VIEW security_policy_audit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.security_policy_audit IS 'Audit view for reviewing all RLS policies and their types';


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
-- Name: tax_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    year integer NOT NULL,
    tax_info jsonb NOT NULL,
    proposed_strategies jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_savings numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    client_id uuid,
    created_by uuid,
    CONSTRAINT tax_proposals_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'proposed'::text, 'accepted'::text, 'rejected'::text, 'implemented'::text])))
);


--
-- Name: TABLE tax_proposals; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tax_proposals IS 'Tax proposals are now associated with clients. Affiliate information is accessed through the client relationship.';


--
-- Name: COLUMN tax_proposals.client_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tax_proposals.client_id IS 'References clients.id - get affiliate via clients.affiliate_id';


--
-- Name: tax_proposals_with_client_info; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.tax_proposals_with_client_info AS
 SELECT tp.id,
    tp.user_id,
    tp.year,
    tp.tax_info,
    tp.proposed_strategies,
    tp.total_savings,
    tp.status,
    tp.notes,
    tp.created_at,
    tp.updated_at,
    tp.client_id,
    c.full_name AS client_name,
    c.email AS client_email,
    c.affiliate_id,
    p.full_name AS affiliate_name,
    p.email AS affiliate_email
   FROM ((public.tax_proposals tp
     JOIN public.clients c ON ((tp.client_id = c.id)))
     LEFT JOIN public.profiles p ON ((c.affiliate_id = p.id)));


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
-- Name: tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tools (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    CONSTRAINT tools_status_check CHECK ((status = ANY (ARRAY['active'::text, 'in_development'::text, 'deprecated'::text])))
);


--
-- Name: TABLE tools; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tools IS 'Defines the suite of tax tools offered by the platform.';


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    partner_id uuid NOT NULL,
    client_id uuid NOT NULL,
    tool_id uuid NOT NULL,
    invoice_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    amount numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transactions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'invoiced'::text, 'paid'::text, 'cancelled'::text])))
);


--
-- Name: TABLE transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.transactions IS 'Logs each billable event when a partner uses a tool for a client.';


--
-- Name: user_access_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_access_summary AS
 SELECT p.id AS user_id,
    p.email,
    p.full_name AS name,
    p.role AS role_type,
    count(cu.id) AS client_count,
    array_agg(DISTINCT cu.role) AS client_roles,
    array_agg(DISTINCT c.full_name) AS client_names,
    max(cu.created_at) AS last_client_added
   FROM ((public.profiles p
     LEFT JOIN public.client_users cu ON (((p.id = cu.user_id) AND (cu.is_active = true))))
     LEFT JOIN public.clients c ON ((cu.client_id = c.id)))
  WHERE (p.role = ANY (ARRAY['client'::text, 'staff'::text, 'affiliate'::text]))
  GROUP BY p.id, p.email, p.full_name, p.role
  ORDER BY p.full_name;


--
-- Name: VIEW user_access_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.user_access_summary IS 'Summary view showing client access patterns for each user';


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
-- Name: users_with_auth; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.users_with_auth AS
 SELECT p.id,
    p.email,
    p.full_name,
    p.role,
    p.is_admin,
    p.has_completed_tax_profile,
    p.created_at,
    p.updated_at,
    au.email AS auth_email,
    au.created_at AS auth_created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
   FROM (public.profiles p
     JOIN auth.users au ON ((p.id = au.id)));


--
-- Name: VIEW users_with_auth; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.users_with_auth IS 'Convenience view that joins profiles with auth.users data when auth info is needed';


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
-- Name: messages_2025_07_14; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_07_14 (
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
-- Name: messages_2025_07_15; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_07_15 (
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
-- Name: messages_2025_07_16; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_07_16 (
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
-- Name: messages_2025_07_17; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_07_17 (
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
-- Name: messages_2025_07_18; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_07_18 (
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
-- Name: hooks; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.hooks (
    id bigint NOT NULL,
    hook_table_id integer NOT NULL,
    hook_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    request_id bigint
);


--
-- Name: TABLE hooks; Type: COMMENT; Schema: supabase_functions; Owner: -
--

COMMENT ON TABLE supabase_functions.hooks IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';


--
-- Name: hooks_id_seq; Type: SEQUENCE; Schema: supabase_functions; Owner: -
--

CREATE SEQUENCE supabase_functions.hooks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hooks_id_seq; Type: SEQUENCE OWNED BY; Schema: supabase_functions; Owner: -
--

ALTER SEQUENCE supabase_functions.hooks_id_seq OWNED BY supabase_functions.hooks.id;


--
-- Name: migrations; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.migrations (
    version text NOT NULL,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
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
-- Name: messages_2025_07_14; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_14 FOR VALUES FROM ('2025-07-14 00:00:00') TO ('2025-07-15 00:00:00');


--
-- Name: messages_2025_07_15; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_15 FOR VALUES FROM ('2025-07-15 00:00:00') TO ('2025-07-16 00:00:00');


--
-- Name: messages_2025_07_16; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_16 FOR VALUES FROM ('2025-07-16 00:00:00') TO ('2025-07-17 00:00:00');


--
-- Name: messages_2025_07_17; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_17 FOR VALUES FROM ('2025-07-17 00:00:00') TO ('2025-07-18 00:00:00');


--
-- Name: messages_2025_07_18; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_18 FOR VALUES FROM ('2025-07-18 00:00:00') TO ('2025-07-19 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: hooks id; Type: DEFAULT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks ALTER COLUMN id SET DEFAULT nextval('supabase_functions.hooks_id_seq'::regclass);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


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
-- Name: account_tool_access account_tool_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_tool_access
    ADD CONSTRAINT account_tool_access_pkey PRIMARY KEY (account_id, tool_id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: admin_client_files admin_client_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_client_files
    ADD CONSTRAINT admin_client_files_pkey PRIMARY KEY (id);


--
-- Name: affiliate_tool_permissions affiliate_tool_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_tool_permissions
    ADD CONSTRAINT affiliate_tool_permissions_pkey PRIMARY KEY (affiliate_profile_id, tool_id);


--
-- Name: affiliates affiliates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_pkey PRIMARY KEY (id);


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
-- Name: client_activities client_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_activities
    ADD CONSTRAINT client_activities_pkey PRIMARY KEY (id);


--
-- Name: client_dashboard_metrics client_dashboard_metrics_client_id_metric_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_dashboard_metrics
    ADD CONSTRAINT client_dashboard_metrics_client_id_metric_type_key UNIQUE (client_id, metric_type);


--
-- Name: client_dashboard_metrics client_dashboard_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_dashboard_metrics
    ADD CONSTRAINT client_dashboard_metrics_pkey PRIMARY KEY (id);


--
-- Name: client_engagement_status client_engagement_status_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_engagement_status
    ADD CONSTRAINT client_engagement_status_client_id_key UNIQUE (client_id);


--
-- Name: client_engagement_status client_engagement_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_engagement_status
    ADD CONSTRAINT client_engagement_status_pkey PRIMARY KEY (id);


--
-- Name: client_users client_users_client_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_users
    ADD CONSTRAINT client_users_client_id_user_id_key UNIQUE (client_id, user_id);


--
-- Name: client_users client_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_users
    ADD CONSTRAINT client_users_pkey PRIMARY KEY (id);


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
-- Name: hire_children_details hire_children_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hire_children_details
    ADD CONSTRAINT hire_children_details_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_key UNIQUE (token);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: partner_tool_subscriptions partner_tool_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_tool_subscriptions
    ADD CONSTRAINT partner_tool_subscriptions_pkey PRIMARY KEY (partner_id, tool_id);


--
-- Name: partners partners_company_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_company_name_key UNIQUE (company_name);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: partners partners_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_stripe_customer_id_key UNIQUE (stripe_customer_id);


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
-- Name: profiles profiles_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_unique UNIQUE (email);


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
-- Name: rd_state_calculations rd_state_calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_state_calculations
    ADD CONSTRAINT rd_state_calculations_pkey PRIMARY KEY (id);


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
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


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
-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY (id);


--
-- Name: tools tools_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_slug_key UNIQUE (slug);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


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
-- Name: messages_2025_07_14 messages_2025_07_14_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_07_14
    ADD CONSTRAINT messages_2025_07_14_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_07_15 messages_2025_07_15_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_07_15
    ADD CONSTRAINT messages_2025_07_15_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_07_16 messages_2025_07_16_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_07_16
    ADD CONSTRAINT messages_2025_07_16_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_07_17 messages_2025_07_17_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_07_17
    ADD CONSTRAINT messages_2025_07_17_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_07_18 messages_2025_07_18_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_07_18
    ADD CONSTRAINT messages_2025_07_18_pkey PRIMARY KEY (id, inserted_at);


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
-- Name: hooks hooks_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks
    ADD CONSTRAINT hooks_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (version);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE INDEX extensions_tenant_external_id_index ON _realtime.extensions USING btree (tenant_external_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON _realtime.extensions USING btree (tenant_external_id, type);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX tenants_external_id_index ON _realtime.tenants USING btree (external_id);


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
-- Name: idx_account_tool_access_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_tool_access_account_id ON public.account_tool_access USING btree (account_id);


--
-- Name: idx_account_tool_access_affiliate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_tool_access_affiliate_id ON public.account_tool_access USING btree (affiliate_id);


--
-- Name: idx_account_tool_access_tool_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_tool_access_tool_id ON public.account_tool_access USING btree (tool_id);


--
-- Name: idx_accounts_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_name ON public.accounts USING btree (name);


--
-- Name: idx_accounts_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_stripe_customer_id ON public.accounts USING btree (stripe_customer_id);


--
-- Name: idx_accounts_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_type ON public.accounts USING btree (type);


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
-- Name: idx_affiliates_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affiliates_account_id ON public.affiliates USING btree (account_id);


--
-- Name: idx_augusta_rule_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_augusta_rule_details_strategy_detail_id ON public.augusta_rule_details USING btree (strategy_detail_id);


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
-- Name: idx_calculations_user_id_profiles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calculations_user_id_profiles ON public.calculations USING btree (user_id);


--
-- Name: idx_centralized_businesses_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_centralized_businesses_created_at ON public.centralized_businesses USING btree (created_at);


--
-- Name: idx_charitable_donation_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charitable_donation_details_strategy_detail_id ON public.charitable_donation_details USING btree (strategy_detail_id);


--
-- Name: idx_client_activities_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_activities_client_id ON public.client_activities USING btree (client_id);


--
-- Name: idx_client_activities_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_activities_created ON public.client_activities USING btree (created_at DESC);


--
-- Name: idx_client_activities_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_activities_priority ON public.client_activities USING btree (priority);


--
-- Name: idx_client_activities_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_activities_type ON public.client_activities USING btree (activity_type);


--
-- Name: idx_client_activities_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_activities_unread ON public.client_activities USING btree (is_read) WHERE (is_read = false);


--
-- Name: idx_client_activities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_activities_user_id ON public.client_activities USING btree (user_id);


--
-- Name: idx_client_dashboard_metrics_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_dashboard_metrics_client ON public.client_dashboard_metrics USING btree (client_id);


--
-- Name: idx_client_dashboard_metrics_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_dashboard_metrics_expires ON public.client_dashboard_metrics USING btree (expires_at);


--
-- Name: idx_client_dashboard_metrics_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_dashboard_metrics_type ON public.client_dashboard_metrics USING btree (metric_type);


--
-- Name: idx_client_engagement_last_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_engagement_last_activity ON public.client_engagement_status USING btree (last_activity_at DESC);


--
-- Name: idx_client_engagement_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_engagement_pending ON public.client_engagement_status USING btree (pending_actions) WHERE (pending_actions > 0);


--
-- Name: idx_client_engagement_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_engagement_status ON public.client_engagement_status USING btree (status);


--
-- Name: idx_client_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_users_active ON public.client_users USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_client_users_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_users_client_id ON public.client_users USING btree (client_id);


--
-- Name: idx_client_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_users_role ON public.client_users USING btree (role);


--
-- Name: idx_client_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_users_user_id ON public.client_users USING btree (user_id);


--
-- Name: idx_clients_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_account_id ON public.clients USING btree (account_id);


--
-- Name: idx_clients_affiliate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_affiliate_id ON public.clients USING btree (affiliate_id);


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
-- Name: idx_clients_partner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_partner_id ON public.clients USING btree (partner_id);


--
-- Name: idx_clients_primary_affiliate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_primary_affiliate_id ON public.clients USING btree (primary_affiliate_id);


--
-- Name: idx_clients_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_user_id ON public.clients USING btree (user_id);


--
-- Name: idx_clients_zip_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_zip_code ON public.clients USING btree (zip_code);


--
-- Name: idx_commission_transactions_proposal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commission_transactions_proposal_id ON public.commission_transactions USING btree (proposal_id);


--
-- Name: idx_convertible_tax_bonds_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_convertible_tax_bonds_details_strategy_detail_id ON public.convertible_tax_bonds_details USING btree (strategy_detail_id);


--
-- Name: idx_cost_segregation_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_segregation_details_strategy_detail_id ON public.cost_segregation_details USING btree (strategy_detail_id);


--
-- Name: idx_experts_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experts_account_id ON public.experts USING btree (account_id);


--
-- Name: idx_family_management_company_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_family_management_company_details_strategy_detail_id ON public.family_management_company_details USING btree (strategy_detail_id);


--
-- Name: idx_hire_children_details_strategy_detail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_children_details_strategy_detail_id ON public.hire_children_details USING btree (strategy_detail_id);


--
-- Name: idx_invitations_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_client_id ON public.invitations USING btree (client_id);


--
-- Name: idx_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_email ON public.invitations USING btree (email);


--
-- Name: idx_invitations_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_expires_at ON public.invitations USING btree (expires_at);


--
-- Name: idx_invitations_invited_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_invited_by ON public.invitations USING btree (invited_by);


--
-- Name: idx_invitations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_status ON public.invitations USING btree (status);


--
-- Name: idx_invitations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_token ON public.invitations USING btree (token);


--
-- Name: idx_invitations_unique_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_invitations_unique_pending ON public.invitations USING btree (client_id, email) WHERE ((status)::text = 'pending'::text);


--
-- Name: idx_invoices_partner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_partner_id ON public.invoices USING btree (partner_id);


--
-- Name: idx_partners_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partners_stripe_customer_id ON public.partners USING btree (stripe_customer_id);


--
-- Name: idx_personal_years_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personal_years_client_id ON public.personal_years USING btree (client_id);


--
-- Name: idx_personal_years_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personal_years_year ON public.personal_years USING btree (year);


--
-- Name: idx_profiles_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_account_id ON public.profiles USING btree (account_id);


--
-- Name: idx_profiles_partner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_partner_id ON public.profiles USING btree (partner_id);


--
-- Name: idx_proposal_assignments_proposal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposal_assignments_proposal_id ON public.proposal_assignments USING btree (proposal_id);


--
-- Name: idx_proposal_timeline_proposal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposal_timeline_proposal_id ON public.proposal_timeline USING btree (proposal_id);


--
-- Name: idx_rd_business_years_business_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_business_years_business_year ON public.rd_business_years USING btree (business_id, year);


--
-- Name: idx_rd_businesses_historical_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_businesses_historical_data ON public.rd_businesses USING gin (historical_data);


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
-- Name: idx_rd_federal_credit_results_business_year_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_federal_credit_results_business_year_id ON public.rd_federal_credit_results USING btree (business_year_id);


--
-- Name: idx_rd_federal_credit_results_calculation_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_federal_credit_results_calculation_date ON public.rd_federal_credit_results USING btree (calculation_date);


--
-- Name: idx_rd_reports_business_year_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_reports_business_year_type ON public.rd_reports USING btree (business_year_id, type);


--
-- Name: idx_rd_research_steps_activity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_research_steps_activity_id ON public.rd_research_steps USING btree (research_activity_id);


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
-- Name: idx_security_events_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_client_id ON public.security_events USING btree (client_id);


--
-- Name: idx_security_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_created_at ON public.security_events USING btree (created_at);


--
-- Name: idx_security_events_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_severity ON public.security_events USING btree (severity);


--
-- Name: idx_security_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_type ON public.security_events USING btree (event_type);


--
-- Name: idx_security_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_user_id ON public.security_events USING btree (user_id);


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
-- Name: idx_strategy_details_proposal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_strategy_details_proposal_id ON public.strategy_details USING btree (proposal_id);


--
-- Name: idx_strategy_details_strategy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_strategy_details_strategy_id ON public.strategy_details USING btree (strategy_id);


--
-- Name: idx_tax_calculations_user_id_profiles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_calculations_user_id_profiles ON public.tax_calculations USING btree (user_id);


--
-- Name: idx_tax_estimates_user_id_profiles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_estimates_user_id_profiles ON public.tax_estimates USING btree (user_id);


--
-- Name: idx_tax_proposals_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_proposals_client_id ON public.tax_proposals USING btree (client_id);


--
-- Name: idx_tax_proposals_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_proposals_created_by ON public.tax_proposals USING btree (created_by);


--
-- Name: idx_tax_proposals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_proposals_status ON public.tax_proposals USING btree (status);


--
-- Name: idx_tax_proposals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_proposals_user_id ON public.tax_proposals USING btree (user_id);


--
-- Name: idx_tax_proposals_user_id_profiles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_proposals_user_id_profiles ON public.tax_proposals USING btree (user_id);


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
-- Name: idx_transactions_partner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_partner_id ON public.transactions USING btree (partner_id);


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
-- Name: supabase_functions_hooks_h_table_id_h_name_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_h_table_id_h_name_idx ON supabase_functions.hooks USING btree (hook_table_id, hook_name);


--
-- Name: supabase_functions_hooks_request_id_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_request_id_idx ON supabase_functions.hooks USING btree (request_id);


--
-- Name: messages_2025_07_14_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_14_pkey;


--
-- Name: messages_2025_07_15_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_15_pkey;


--
-- Name: messages_2025_07_16_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_16_pkey;


--
-- Name: messages_2025_07_17_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_17_pkey;


--
-- Name: messages_2025_07_18_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_18_pkey;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


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
-- Name: client_users trigger_client_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_client_users_updated_at BEFORE UPDATE ON public.client_users FOR EACH ROW EXECUTE FUNCTION public.update_client_users_updated_at();


--
-- Name: tax_proposals trigger_create_strategy_details; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_create_strategy_details AFTER INSERT ON public.tax_proposals FOR EACH ROW EXECUTE FUNCTION public.create_strategy_details_for_proposal();


--
-- Name: client_users trigger_ensure_client_has_owner_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_ensure_client_has_owner_delete BEFORE DELETE ON public.client_users FOR EACH ROW EXECUTE FUNCTION public.ensure_client_has_owner();


--
-- Name: client_users trigger_ensure_client_has_owner_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_ensure_client_has_owner_update BEFORE UPDATE ON public.client_users FOR EACH ROW EXECUTE FUNCTION public.ensure_client_has_owner();


--
-- Name: invitations trigger_invitations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.update_invitations_updated_at();


--
-- Name: invitations trigger_set_invitation_token; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_invitation_token BEFORE INSERT ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.set_invitation_token();


--
-- Name: client_activities update_client_activities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_activities_updated_at BEFORE UPDATE ON public.client_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_dashboard_metrics update_client_dashboard_metrics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_dashboard_metrics_updated_at BEFORE UPDATE ON public.client_dashboard_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_engagement_status update_client_engagement_status_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_engagement_status_updated_at BEFORE UPDATE ON public.client_engagement_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES _realtime.tenants(external_id) ON DELETE CASCADE;


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
-- Name: account_tool_access account_tool_access_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_tool_access
    ADD CONSTRAINT account_tool_access_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: account_tool_access account_tool_access_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_tool_access
    ADD CONSTRAINT account_tool_access_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: account_tool_access account_tool_access_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_tool_access
    ADD CONSTRAINT account_tool_access_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id);


--
-- Name: account_tool_access account_tool_access_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_tool_access
    ADD CONSTRAINT account_tool_access_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


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
-- Name: affiliate_tool_permissions affiliate_tool_permissions_affiliate_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_tool_permissions
    ADD CONSTRAINT affiliate_tool_permissions_affiliate_profile_id_fkey FOREIGN KEY (affiliate_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: affiliate_tool_permissions affiliate_tool_permissions_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_tool_permissions
    ADD CONSTRAINT affiliate_tool_permissions_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


--
-- Name: affiliates affiliates_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


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
    ADD CONSTRAINT calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: charitable_donation_details charitable_donation_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charitable_donation_details
    ADD CONSTRAINT charitable_donation_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: client_activities client_activities_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_activities
    ADD CONSTRAINT client_activities_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_activities client_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_activities
    ADD CONSTRAINT client_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: client_dashboard_metrics client_dashboard_metrics_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_dashboard_metrics
    ADD CONSTRAINT client_dashboard_metrics_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_engagement_status client_engagement_status_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_engagement_status
    ADD CONSTRAINT client_engagement_status_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_users client_users_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_users
    ADD CONSTRAINT client_users_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_users client_users_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_users
    ADD CONSTRAINT client_users_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id);


--
-- Name: client_users client_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_users
    ADD CONSTRAINT client_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: clients clients_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: clients clients_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.profiles(id);


--
-- Name: clients clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: clients clients_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: clients clients_primary_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_primary_affiliate_id_fkey FOREIGN KEY (primary_affiliate_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


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
-- Name: commission_transactions commission_transactions_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_transactions
    ADD CONSTRAINT commission_transactions_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.tax_proposals(id) ON DELETE CASCADE;


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
-- Name: experts experts_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT experts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: family_management_company_details family_management_company_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_management_company_details
    ADD CONSTRAINT family_management_company_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: hire_children_details hire_children_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hire_children_details
    ADD CONSTRAINT hire_children_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: invitations invitations_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.profiles(id);


--
-- Name: invitations invitations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: invitations invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id);


--
-- Name: invoices invoices_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_account_id_fkey FOREIGN KEY (partner_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: leads leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: partner_tool_subscriptions partner_tool_subscriptions_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_tool_subscriptions
    ADD CONSTRAINT partner_tool_subscriptions_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: partner_tool_subscriptions partner_tool_subscriptions_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_tool_subscriptions
    ADD CONSTRAINT partner_tool_subscriptions_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


--
-- Name: personal_years personal_years_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_years
    ADD CONSTRAINT personal_years_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;


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
-- Name: proposal_assignments proposal_assignments_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_assignments
    ADD CONSTRAINT proposal_assignments_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.tax_proposals(id) ON DELETE CASCADE;


--
-- Name: proposal_timeline proposal_timeline_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_timeline
    ADD CONSTRAINT proposal_timeline_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id);


--
-- Name: proposal_timeline proposal_timeline_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_timeline
    ADD CONSTRAINT proposal_timeline_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.tax_proposals(id) ON DELETE CASCADE;


--
-- Name: rd_areas rd_areas_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_areas
    ADD CONSTRAINT rd_areas_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.rd_research_categories(id) ON DELETE CASCADE;


--
-- Name: rd_business_years rd_business_years_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_business_years
    ADD CONSTRAINT rd_business_years_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE;


--
-- Name: rd_businesses rd_businesses_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_businesses
    ADD CONSTRAINT rd_businesses_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


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
    ADD CONSTRAINT rd_contractor_year_data_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id);


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
    ADD CONSTRAINT rd_contractors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


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
    ADD CONSTRAINT rd_employees_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rd_roles(id) ON DELETE CASCADE;


--
-- Name: rd_employees rd_employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employees
    ADD CONSTRAINT rd_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


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
-- Name: rd_federal_credit_results rd_federal_credit_results_business_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_federal_credit_results
    ADD CONSTRAINT rd_federal_credit_results_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;


--
-- Name: rd_focuses rd_focuses_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_focuses
    ADD CONSTRAINT rd_focuses_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.rd_areas(id) ON DELETE CASCADE;


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
-- Name: rd_research_activities rd_research_activities_focus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_activities
    ADD CONSTRAINT rd_research_activities_focus_id_fkey FOREIGN KEY (focus_id) REFERENCES public.rd_focuses(id) ON DELETE CASCADE;


--
-- Name: rd_research_steps rd_research_steps_research_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_research_steps
    ADD CONSTRAINT rd_research_steps_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;


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
-- Name: reinsurance_details reinsurance_details_strategy_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinsurance_details
    ADD CONSTRAINT reinsurance_details_strategy_detail_id_fkey FOREIGN KEY (strategy_detail_id) REFERENCES public.strategy_details(id) ON DELETE CASCADE;


--
-- Name: security_events security_events_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: security_events security_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


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
    ADD CONSTRAINT tax_calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: tax_estimates tax_estimates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_estimates
    ADD CONSTRAINT tax_estimates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: tax_profiles tax_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT tax_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: tax_proposals tax_proposals_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_proposals
    ADD CONSTRAINT tax_proposals_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: tax_proposals tax_proposals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_proposals
    ADD CONSTRAINT tax_proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: tax_proposals tax_proposals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_proposals
    ADD CONSTRAINT tax_proposals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


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
-- Name: transactions transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_fkey FOREIGN KEY (partner_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


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
-- Name: businesses Admins can access all business data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can access all business data" ON public.businesses USING (public.is_admin());


--
-- Name: business_years Admins can access all business_years data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can access all business_years data" ON public.business_years USING (public.is_admin());


--
-- Name: clients Admins can access all clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can access all clients" ON public.clients USING (public.is_admin());


--
-- Name: personal_years Admins can access all personal_years data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can access all personal_years data" ON public.personal_years USING (public.is_admin());


--
-- Name: tax_proposals Admins can access all proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can access all proposals" ON public.tax_proposals USING (public.is_admin());


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
-- Name: tax_proposals Admins can insert tax proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert tax proposals" ON public.tax_proposals FOR INSERT WITH CHECK (((auth.jwt() ->> 'role'::text) = 'admin'::text));


--
-- Name: admin_client_files Admins can manage all client files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all client files" ON public.admin_client_files USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: client_users Admins can manage all client users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all client users" ON public.client_users USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: account_tool_access Admins can manage all tool access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all tool access" ON public.account_tool_access USING ((EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.accounts a ON ((p.account_id = a.id)))
  WHERE ((p.id = auth.uid()) AND (a.type = 'admin'::public.account_type)))));


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
-- Name: tax_proposals Admins can update tax proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update tax proposals" ON public.tax_proposals FOR UPDATE USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));


--
-- Name: accounts Admins can view all accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all accounts" ON public.accounts USING ((EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.accounts a ON ((p.account_id = a.id)))
  WHERE ((p.id = auth.uid()) AND (a.type = 'admin'::public.account_type)))));


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
-- Name: security_events Admins can view security events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view security events" ON public.security_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role_type = 'ADMIN'::public.role_type)))));


--
-- Name: businesses Affiliates can access their clients' business data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Affiliates can access their clients' business data" ON public.businesses USING (public.is_affiliated_with_client(client_id));


--
-- Name: business_years Affiliates can access their clients' business_years data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Affiliates can access their clients' business_years data" ON public.business_years USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = business_years.business_id) AND public.is_affiliated_with_client(businesses.client_id)))));


--
-- Name: personal_years Affiliates can access their clients' personal_years data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Affiliates can access their clients' personal_years data" ON public.personal_years USING (public.is_affiliated_with_client(client_id));


--
-- Name: clients Affiliates can access their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Affiliates can access their own clients" ON public.clients USING (public.is_affiliated_with_client(id));


--
-- Name: tax_proposals Affiliates can access their own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Affiliates can access their own proposals" ON public.tax_proposals USING ((created_by = auth.uid()));


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
-- Name: rd_research_steps Allow read access to rd_research_steps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to rd_research_steps" ON public.rd_research_steps FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_research_subcomponents Allow read access to rd_research_subcomponents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to rd_research_subcomponents" ON public.rd_research_subcomponents FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: invitations Anyone can view invitations by token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view invitations by token" ON public.invitations FOR SELECT USING ((token IS NOT NULL));


--
-- Name: invitations Client owners can create invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client owners can create invitations" ON public.invitations FOR INSERT WITH CHECK ((public.user_has_direct_client_access(auth.uid(), client_id) OR public.user_is_client_owner(auth.uid(), client_id)));


--
-- Name: invitations Client owners can delete invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client owners can delete invitations" ON public.invitations FOR DELETE USING ((public.user_has_direct_client_access(auth.uid(), client_id) OR public.user_is_client_owner(auth.uid(), client_id)));


--
-- Name: client_users Client owners can manage client users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client owners can manage client users" ON public.client_users USING (public.user_has_direct_client_access(auth.uid(), client_id));


--
-- Name: client_activities Client owners can update activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client owners can update activities" ON public.client_activities FOR UPDATE USING (public.user_has_client_role(auth.uid(), client_id, 'owner'::public.client_role));


--
-- Name: client_engagement_status Client owners can update engagement status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client owners can update engagement status" ON public.client_engagement_status FOR UPDATE USING (public.user_has_client_role(auth.uid(), client_id, 'owner'::public.client_role));


--
-- Name: invitations Client owners can update invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client owners can update invitations" ON public.invitations FOR UPDATE USING ((public.user_has_direct_client_access(auth.uid(), client_id) OR public.user_is_client_owner(auth.uid(), client_id)));


--
-- Name: tax_proposals Client users can insert tax proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can insert tax proposals" ON public.tax_proposals FOR INSERT WITH CHECK (public.user_has_client_access(auth.uid(), client_id));


--
-- Name: client_activities Client users can insert their activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can insert their activities" ON public.client_activities FOR INSERT WITH CHECK (public.user_has_client_access(auth.uid(), client_id));


--
-- Name: research_activities Client users can manage research activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can manage research activities" ON public.research_activities USING (((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role_type = 'ADMIN'::public.role_type)))) OR public.user_has_client_role(auth.uid(), business_id, 'member'::public.client_role)));


--
-- Name: tax_calculations Client users can manage tax calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can manage tax calculations" ON public.tax_calculations USING (((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role_type = 'ADMIN'::public.role_type)))) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public.client_users cu
     JOIN public.clients c ON ((cu.client_id = c.id)))
  WHERE ((cu.user_id = auth.uid()) AND (cu.is_active = true) AND (cu.role = ANY (ARRAY['member'::public.client_role, 'accountant'::public.client_role, 'owner'::public.client_role])) AND (c.id IN ( SELECT cu2.client_id
           FROM public.client_users cu2
          WHERE ((cu2.user_id = tax_calculations.user_id) AND (cu2.is_active = true)))))))));


--
-- Name: tax_proposals Client users can update tax proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can update tax proposals" ON public.tax_proposals FOR UPDATE USING (public.user_has_client_access(auth.uid(), client_id));


--
-- Name: clients Client users can update their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can update their clients" ON public.clients FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role_type = 'ADMIN'::public.role_type)))) OR (affiliate_id = auth.uid()) OR public.user_has_client_role(auth.uid(), id, 'owner'::public.client_role)));


--
-- Name: client_dashboard_metrics Client users can view dashboard metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can view dashboard metrics" ON public.client_dashboard_metrics FOR SELECT USING (public.user_has_client_access(auth.uid(), client_id));


--
-- Name: client_engagement_status Client users can view engagement status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can view engagement status" ON public.client_engagement_status FOR SELECT USING (public.user_has_client_access(auth.uid(), client_id));


--
-- Name: research_activities Client users can view research activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can view research activities" ON public.research_activities FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role_type = 'ADMIN'::public.role_type)))) OR public.user_has_client_access(auth.uid(), business_id)));


--
-- Name: tax_calculations Client users can view tax calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can view tax calculations" ON public.tax_calculations FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role_type = 'ADMIN'::public.role_type)))) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public.client_users cu
     JOIN public.clients c ON ((cu.client_id = c.id)))
  WHERE ((cu.user_id = auth.uid()) AND (cu.is_active = true) AND (c.id IN ( SELECT cu2.client_id
           FROM public.client_users cu2
          WHERE ((cu2.user_id = tax_calculations.user_id) AND (cu2.is_active = true)))))))));


--
-- Name: tax_proposals Client users can view tax proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can view tax proposals" ON public.tax_proposals FOR SELECT USING (public.user_has_client_access(auth.uid(), client_id));


--
-- Name: client_activities Client users can view their activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can view their activities" ON public.client_activities FOR SELECT USING (public.user_has_client_access(auth.uid(), client_id));


--
-- Name: clients Client users can view their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client users can view their clients" ON public.clients FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role_type = 'ADMIN'::public.role_type)))) OR (affiliate_id = auth.uid()) OR (created_by = auth.uid()) OR public.user_has_client_access(auth.uid(), id)));


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
-- Name: rd_supplies Enable delete access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_supplies FOR DELETE USING ((auth.role() = 'authenticated'::text));


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
-- Name: rd_supplies Enable insert access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_supplies FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: rd_selected_steps Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.rd_selected_steps FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


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
-- Name: rd_supplies Enable update access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for authenticated users" ON public.rd_supplies FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: rd_selected_steps Enable update for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for authenticated users only" ON public.rd_selected_steps FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: client_dashboard_metrics System can manage dashboard metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can manage dashboard metrics" ON public.client_dashboard_metrics USING (true);


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
-- Name: leads Users can insert own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own leads" ON public.leads FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


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
-- Name: tax_proposals Users can insert tax proposals for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert tax proposals for their clients" ON public.tax_proposals FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.clients c
  WHERE ((c.id = tax_proposals.client_id) AND (c.created_by = auth.uid())))));


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
-- Name: leads Users can update own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


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
-- Name: tax_proposals Users can update tax proposals for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update tax proposals for their clients" ON public.tax_proposals FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.clients c
  WHERE ((c.id = tax_proposals.client_id) AND (c.created_by = auth.uid())))));


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
-- Name: invitations Users can view invitations for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view invitations for their clients" ON public.invitations FOR SELECT USING ((public.user_has_direct_client_access(auth.uid(), client_id) OR public.user_is_client_owner(auth.uid(), client_id) OR (invited_by = auth.uid())));


--
-- Name: client_users Users can view own client relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own client relationships" ON public.client_users FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: leads Users can view own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


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
-- Name: tax_proposals Users can view tax proposals for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tax proposals for their clients" ON public.tax_proposals FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.clients c
  WHERE ((c.id = tax_proposals.client_id) AND (c.created_by = auth.uid())))));


--
-- Name: account_tool_access Users can view their account tool access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their account tool access" ON public.account_tool_access FOR SELECT USING ((account_id IN ( SELECT profiles.account_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: accounts Users can view their own account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own account" ON public.accounts FOR SELECT USING ((id IN ( SELECT profiles.account_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


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
-- Name: tool_enrollments Users can view their own tool enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tool enrollments" ON public.tool_enrollments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.admin_client_files acf
  WHERE ((acf.id = tool_enrollments.client_file_id) AND (acf.admin_id = auth.uid())))));


--
-- Name: account_tool_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.account_tool_access ENABLE ROW LEVEL SECURITY;

--
-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_client_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_client_files ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

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
-- Name: client_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: client_dashboard_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_dashboard_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: client_engagement_status; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_engagement_status ENABLE ROW LEVEL SECURITY;

--
-- Name: client_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

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
-- Name: invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: personal_years; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personal_years ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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
-- Name: rd_federal_credit_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rd_federal_credit_results ENABLE ROW LEVEL SECURITY;

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
-- Name: security_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

--
-- Name: strategy_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.strategy_details ENABLE ROW LEVEL SECURITY;

--
-- Name: supply_expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supply_expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tax_proposals ENABLE ROW LEVEL SECURITY;

--
-- Name: tool_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tool_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

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

