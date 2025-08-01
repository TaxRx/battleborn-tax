# Database Functions Comparison Report

Generated on: 2025-07-31 09:10:10

## Summary

| Status | Count | Description |
|--------|-------|-------------|
| ✅ Identical | 0 | Functions that are exactly the same |
| 🔄 Different | 22 | Functions that exist in both but differ |
| ➕ Remote Only | 9 | Functions missing from local database |
| ➖ Local Only | 80 | Functions missing from remote database |
| **Total** | **111** | **Total functions analyzed** |
| **Issues** | **111** | **Functions requiring attention** |

⚠️ **111 functions need attention**

### 🔴 High Priority: Missing Functions
**9 functions** exist in remote but not locally. These should be created:
- `update_rd_federal_credit_updated_at`
- `update_rd_state_proforma_data_updated_at`
- `validate_portal_token`
- `archive_rd_federal_credit_version`
- `update_credits_calculated_at`
- `update_total_qre`
- `update_completion_percentage`
- `safe_update_selected_subcomponent_practice_percent`
- `update_selected_subcomponent_step_name`

### 🟡 Medium Priority: Different Functions
**22 functions** have differences that should be reviewed:
- `get_client_tools`
- `get_base_period_years`
- `update_business_years_updated_at`
- `get_client_with_data`
- `validate_historical_data`
- `add_business_year`
- `get_unified_client_list`
- `create_business_with_enrollment`
- `update_updated_at_column`
- `set_updated_at`
- `handle_new_user`
- `create_client_with_business`
- `check_document_release_eligibility`
- `calculate_base_amount`
- `enroll_client_in_tool`
- `archive_client`
- `update_business_year`
- `handle_updated_at`
- `calculate_household_income`
- `generate_portal_token`
- `create_strategy_details_for_proposal`
- `is_admin`

### 🟢 Low Priority: Local Only Functions
**80 functions** exist only locally. Review if needed:
- `cleanup_expired_sessions`
- `get_sync_conflicts_summary`
- `set_invitation_token`
- `restore_account`
- `get_tax_proposal_affiliate`
- `expire_tool_access`
- `accept_invitation`
- `security_health_check`
- `validate_rls_enabled`
- `get_profile_activity_summary`
- `bulk_assign_tools`
- `auto_log_significant_tool_usage`
- `get_tool_usage_analytics`
- `create_activity_alert`
- `auto_log_profile_changes`
- `user_has_direct_client_access`
- `create_security_alert`
- `validate_client_access`
- `get_tool_usage_metrics`
- `update_client_engagement_status`
- `refresh_usage_analytics`
- `detect_profile_sync_discrepancies`
- `bulk_update_tool_status`
- `get_profile_activity_timeline`
- `grant_profile_permission`
- `get_profile_effective_permissions`
- `schedule_analytics_refresh`
- `is_security_admin`
- `update_profile_updated_at`
- `create_subscription`
- `is_super_admin`
- `generate_invoice`
- `get_usage_export_data`
- `user_has_client_access`
- `assign_profile_role`
- `check_profile_permission`
- `log_client_access`
- `get_activity_trends`
- `process_payment`
- `get_profile_summary`
- `get_auth_sync_status_summary`
- `cleanup_old_security_events`
- `perform_sync_health_check`
- `log_tool_usage`
- `user_has_client_role`
- `rollback_bulk_operation`
- `get_usage_trends`
- `update_client_users_updated_at`
- `get_user_account_id`
- `create_bulk_operation`
- `update_account_tool_access_updated_at`
- `get_account_usage_analytics`
- `user_has_admin_account`
- `resolve_sync_conflict`
- `log_profile_activity`
- `revoke_profile_role`
- `complete_bulk_operation`
- `detect_suspicious_activity`
- `log_security_event`
- `update_invitations_updated_at`
- `is_affiliated_with_client`
- `user_is_client_owner`
- `ensure_client_has_owner`
- `generate_invitation_token`
- `log_account_activity`
- `expire_old_invitations`
- `auto_log_account_changes`
- `check_account_activities_access`
- `calculate_dashboard_metrics`
- `create_profile_if_missing`
- `get_affiliate_from_client`
- `sync_profile_with_auth`
- `bulk_sync_profiles`
- `process_bulk_operation_target`
- `user_is_admin`
- `get_user_client_role`
- `get_client_info`
- `soft_delete_account`
- `log_client_activity`
- `auto_log_tool_assignment_changes`

## 🔄 Different Functions (22)

### `get_client_tools`

**Differences:**
```diff
- CREATE FUNCTION public.get_client_tools(p_client_file_id uuid, p_business_id uuid DEFAULT NULL::uuid) RETURNS TABLE(tool_slug text, tool_name text, status text, enrolled_at timestamp with time zone)
+ CREATE OR REPLACE FUNCTION public.get_client_tools(p_client_file_id uuid, p_business_id uuid DEFAULT NULL::uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- BEGIN
-     RETURN QUERY
-     SELECT 
-         te.tool_slug,
-         CASE te.tool_slug
-             WHEN 'rd' THEN 'R&D Tax Calculator'
-             WHEN 'augusta' THEN 'Augusta Rule Estimator'
-             WHEN 'hire_children' THEN 'Hire Children Calculator'
-             WHEN 'cost_segregation' THEN 'Cost Segregation Calculator'
-             WHEN 'convertible_bonds' THEN 'Convertible Tax Bonds Calculator'
-             WHEN 'tax_planning' THEN 'Tax Planning'
-             ELSE te.tool_slug
-         END AS tool_name,
-         te.status,
-         te.enrolled_at
-     FROM public.tool_enrollments te
-     WHERE te.client_file_id = p_client_file_id
-     AND (p_business_id IS NULL OR te.business_id = p_business_id)
-     ORDER BY te.enrolled_at DESC;
- END;
- $$;
- --
- -- Name: FUNCTION get_client_tools(p_client_file_id uuid, p_business_id uuid); Type: COMMENT; Schema: public; Owner: -
- --
- COMMENT ON FUNCTION public.get_client_tools(p_client_file_id uuid, p_business_id uuid) IS 'Returns all tools a client is enrolled in';
```

### `get_base_period_years`

**Differences:**
```diff
- CREATE FUNCTION public.get_base_period_years(business_start_year integer, tax_year integer) RETURNS integer[]
+ CREATE OR REPLACE FUNCTION public.get_base_period_years(business_start_year integer, tax_year integer)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
-     LANGUAGE plpgsql
-     AS $$
- DECLARE
-   start_from_year INTEGER;
-   years INTEGER[] := ARRAY[]::INTEGER[];
-   year INTEGER;
- BEGIN
-   -- Start from 8 years ago or business start year, whichever is later
-   start_from_year := GREATEST(business_start_year, tax_year - 8);
-   -- Generate array of years from start_from_year to tax_year - 1
-   FOR year IN start_from_year..(tax_year - 1) LOOP
-     years := array_append(years, year);
-   END LOOP;
-   RETURN years;
- END;
- $$;
- --
- -- Name: get_client_tools(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `update_business_years_updated_at`

**Differences:**
```diff
- CREATE FUNCTION public.update_business_years_updated_at() RETURNS trigger
+ CREATE OR REPLACE FUNCTION public.update_business_years_updated_at()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        +
-     LANGUAGE plpgsql
-     AS $$
- BEGIN
-   NEW.updated_at = NOW();
-   RETURN NEW;
- END;
- $$;
- --
- -- Name: update_completion_percentage(); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `get_client_with_data`

**Differences:**
```diff
- CREATE FUNCTION public.get_client_with_data(client_uuid uuid) RETURNS json
+ CREATE OR REPLACE FUNCTION public.get_client_with_data(client_uuid uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    +
-     LANGUAGE plpgsql
-     AS $$
- DECLARE
-     result JSON;
- BEGIN
-     SELECT json_build_object(
-         'client', c,
-         'personal_years', COALESCE(py_data, '[]'::json),
-         'businesses', COALESCE(b_data, '[]'::json)
-     ) INTO result
-     FROM clients c
-     LEFT JOIN (
-         SELECT 
-             client_id,
-             json_agg(py.*) as py_data
-         FROM personal_years py
-         WHERE py.client_id = client_uuid
-         GROUP BY client_id
-     ) py ON c.id = py.client_id
-     LEFT JOIN (
-         SELECT 
-             b.client_id,
-             json_agg(
-                 json_build_object(
-                     'business', b,
-                     'business_years', COALESCE(by_data, '[]'::json)
-                 )
-             ) as b_data
-         FROM businesses b
-         LEFT JOIN (
-             SELECT 
-                 business_id,
-                 json_agg(by.*) as by_data
-             FROM business_years by
-             WHERE by.business_id IN (SELECT id FROM businesses WHERE client_id = client_uuid)
-             GROUP BY business_id
-         ) by ON b.id = by.business_id
-         WHERE b.client_id = client_uuid
-         GROUP BY b.client_id
-     ) b ON c.id = b.client_id
-     WHERE c.id = client_uuid;
-     RETURN result;
- END;
- $$;
- --
- -- Name: get_unified_client_list(text, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `validate_historical_data`

**Differences:**
```diff
- CREATE FUNCTION public.validate_historical_data(data jsonb) RETURNS boolean
+ CREATE OR REPLACE FUNCTION public.validate_historical_data(data jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
-     LANGUAGE plpgsql
-     AS $$
- BEGIN
-     -- Check if data is an array
-     IF jsonb_typeof(data) != 'array' THEN
-         RETURN FALSE;
-     END IF;
-     -- Check each element in the array
-     FOR i IN 0..jsonb_array_length(data) - 1 LOOP
-         -- Each element should be an object with year, gross_receipts, and qre
-         IF NOT (
-             (data->i) ? 'year' AND
-             (data->i) ? 'gross_receipts' AND
-             (data->i) ? 'qre' AND
-             jsonb_typeof(data->i->'year') = 'number' AND
-             jsonb_typeof(data->i->'gross_receipts') = 'number' AND
-             jsonb_typeof(data->i->'qre') = 'number'
-         ) THEN
-             RETURN FALSE;
-         END IF;
-     END LOOP;
-     RETURN TRUE;
- END;
- $$;
- --
- -- Name: validate_portal_token(character varying, inet); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `add_business_year`

**Differences:**
```diff
- CREATE FUNCTION public.add_business_year(p_business_id uuid, p_year integer, p_is_active boolean DEFAULT true, p_ordinary_k1_income numeric DEFAULT 0, p_guaranteed_k1_income numeric DEFAULT 0, p_annual_revenue numeric DEFAULT 0, p_employee_count integer DEFAULT 0) RETURNS uuid
+ CREATE OR REPLACE FUNCTION public.add_business_year(p_business_id uuid, p_year integer, p_is_active boolean DEFAULT true, p_ordinary_k1_income numeric DEFAULT 0, p_guaranteed_k1_income numeric DEFAULT 0, p_annual_revenue numeric DEFAULT 0, p_employee_count integer DEFAULT 0)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- DECLARE
-   v_year_id UUID;
- BEGIN
-   INSERT INTO business_years (
-     business_id,
-     year,
-     is_active,
-     ordinary_k1_income,
-     guaranteed_k1_income,
-     annual_revenue,
-     employee_count
-   ) VALUES (
-     p_business_id,
-     p_year,
-     p_is_active,
-     p_ordinary_k1_income,
-     p_guaranteed_k1_income,
-     p_annual_revenue,
-     p_employee_count
-   ) RETURNING id INTO v_year_id;
-   RETURN v_year_id;
- END;
- $$;
- --
- -- Name: archive_client(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `get_unified_client_list`

**Differences:**
```diff
- CREATE FUNCTION public.get_unified_client_list(p_tool_filter text DEFAULT NULL::text, p_admin_id uuid DEFAULT NULL::uuid, p_affiliate_id uuid DEFAULT NULL::uuid) RETURNS TABLE(client_file_id uuid, business_id uuid, admin_id uuid, affiliate_id uuid, archived boolean, created_at timestamp with time zone, full_name text, email text, business_name text, entity_type text, tool_slug text, tool_status text, total_income numeric, filing_status text)
+ CREATE OR REPLACE FUNCTION public.get_unified_client_list(p_tool_filter text DEFAULT NULL::text, p_admin_id uuid DEFAULT NULL::uuid, p_affiliate_id uuid DEFAULT NULL::uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- BEGIN
-     RETURN QUERY
-     SELECT DISTINCT
-         acf.id AS client_file_id,
-         acf.business_id,
-         acf.admin_id,
-         acf.affiliate_id,
-         acf.archived,
-         acf.created_at,
-         acf.full_name,
-         acf.email,
-         cb.business_name,
-         cb.entity_type,
-         te.tool_slug,
-         te.status AS tool_status,
-         COALESCE(
-             (SELECT (wages_income + passive_income + unearned_income + capital_gains) 
-              FROM personal_years py 
-              WHERE py.client_id = acf.id 
-              ORDER BY py.year DESC 
-              LIMIT 1),
-             (acf.wages_income + acf.passive_income + acf.unearned_income + acf.capital_gains)
-         ) AS total_income,
-         acf.filing_status
-     FROM public.admin_client_files acf
-     LEFT JOIN public.centralized_businesses cb ON acf.business_id = cb.id
-     LEFT JOIN public.tool_enrollments te ON te.business_id = cb.id
-     WHERE acf.archived IS NOT TRUE
-     AND (p_tool_filter IS NULL OR te.tool_slug = p_tool_filter)
-     AND (p_admin_id IS NULL OR acf.admin_id = p_admin_id)
-     AND (p_affiliate_id IS NULL OR acf.affiliate_id = p_affiliate_id)
-     ORDER BY acf.created_at DESC;
- END;
- $$;
- --
- -- Name: FUNCTION get_unified_client_list(p_tool_filter text, p_admin_id uuid, p_affiliate_id uuid); Type: COMMENT; Schema: public; Owner: -
- --
- COMMENT ON FUNCTION public.get_unified_client_list(p_tool_filter text, p_admin_id uuid, p_affiliate_id uuid) IS 'Returns unified client list with filtering options';
```

### `create_business_with_enrollment`

**Differences:**
```diff
- CREATE FUNCTION public.create_business_with_enrollment(p_business_name text, p_entity_type text, p_client_file_id uuid, p_tool_slug text, p_ein text DEFAULT NULL::text, p_business_address text DEFAULT NULL::text, p_business_city text DEFAULT NULL::text, p_business_state text DEFAULT NULL::text, p_business_zip text DEFAULT NULL::text, p_business_phone text DEFAULT NULL::text, p_business_email text DEFAULT NULL::text, p_industry text DEFAULT NULL::text, p_year_established integer DEFAULT NULL::integer, p_annual_revenue numeric DEFAULT NULL::numeric, p_employee_count integer DEFAULT NULL::integer) RETURNS uuid
+ CREATE OR REPLACE FUNCTION public.create_business_with_enrollment(p_business_name text, p_entity_type text, p_client_file_id uuid, p_tool_slug text, p_ein text DEFAULT NULL::text, p_business_address text DEFAULT NULL::text, p_business_city text DEFAULT NULL::text, p_business_state text DEFAULT NULL::text, p_business_zip text DEFAULT NULL::text, p_business_phone text DEFAULT NULL::text, p_business_email text DEFAULT NULL::text, p_industry text DEFAULT NULL::text, p_year_established integer DEFAULT NULL::integer, p_annual_revenue numeric DEFAULT NULL::numeric, p_employee_count integer DEFAULT NULL::integer)                                                                                                                                                                                                                        +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- DECLARE
-     v_business_id UUID;
- BEGIN
-     -- Insert business
-     INSERT INTO public.centralized_businesses (
-         business_name,
-         entity_type,
-         ein,
-         business_address,
-         business_city,
-         business_state,
-         business_zip,
-         business_phone,
-         business_email,
-         industry,
-         year_established,
-         annual_revenue,
-         employee_count,
-         created_by
-     ) VALUES (
-         p_business_name,
-         p_entity_type,
-         p_ein,
-         p_business_address,
-         p_business_city,
-         p_business_state,
-         p_business_zip,
-         p_business_phone,
-         p_business_email,
-         p_industry,
-         p_year_established,
-         p_annual_revenue,
-         p_employee_count,
-         auth.uid()
-     ) RETURNING id INTO v_business_id;
-     -- Create tool enrollment
-     INSERT INTO public.tool_enrollments (
-         client_file_id,
-         business_id,
-         tool_slug,
-         enrolled_by
-     ) VALUES (
-         p_client_file_id,
-         v_business_id,
-         p_tool_slug,
-         auth.uid()
-     );
-     RETURN v_business_id;
- END;
- $$;
- --
- -- Name: FUNCTION create_business_with_enrollment(p_business_name text, p_entity_type text, p_client_file_id uuid, p_tool_slug text, p_ein text, p_business_address text, p_business_city text, p_business_state text, p_business_zip text, p_business_phone text, p_business_email text, p_industry text, p_year_established integer, p_annual_revenue numeric, p_employee_count integer); Type: COMMENT; Schema: public; Owner: -
- --
- COMMENT ON FUNCTION public.create_business_with_enrollment(p_business_name text, p_entity_type text, p_client_file_id uuid, p_tool_slug text, p_ein text, p_business_address text, p_business_city text, p_business_state text, p_business_zip text, p_business_phone text, p_business_email text, p_industry text, p_year_established integer, p_annual_revenue numeric, p_employee_count integer) IS 'Creates a new business and enrolls it in a tax tool';
```

### `update_updated_at_column`

**Differences:**
```diff
- CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
+ CREATE OR REPLACE FUNCTION public.update_updated_at_column()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
-     LANGUAGE plpgsql
-     AS $$
- BEGIN
-     NEW.updated_at = NOW();
-     RETURN NEW;
- END;
- $$;
- --
- -- Name: validate_historical_data(jsonb); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `set_updated_at`

**Differences:**
```diff
- CREATE FUNCTION public.set_updated_at() RETURNS trigger
+ CREATE OR REPLACE FUNCTION public.set_updated_at()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          +
-     LANGUAGE plpgsql
-     AS $$
- BEGIN
-   NEW.updated_at = NOW();
-   RETURN NEW;
- END;
- $$;
- --
- -- Name: update_business_year(uuid, boolean, numeric, numeric, numeric, integer); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `handle_new_user`

**Differences:**
```diff
- CREATE FUNCTION public.handle_new_user() RETURNS trigger
+ CREATE OR REPLACE FUNCTION public.handle_new_user()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- BEGIN
-     INSERT INTO profiles (id, email, full_name)
-     VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
-     RETURN NEW;
- END;
- $$;
- --
- -- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `create_client_with_business`

**Differences:**
```diff
- CREATE FUNCTION public.create_client_with_business(p_full_name text, p_email text, p_phone text DEFAULT NULL::text, p_filing_status text DEFAULT 'single'::text, p_dependents integer DEFAULT 0, p_home_address text DEFAULT NULL::text, p_state text DEFAULT 'NV'::text, p_wages_income numeric DEFAULT 0, p_passive_income numeric DEFAULT 0, p_unearned_income numeric DEFAULT 0, p_capital_gains numeric DEFAULT 0, p_household_income numeric DEFAULT 0, p_standard_deduction boolean DEFAULT true, p_custom_deduction numeric DEFAULT 0, p_business_owner boolean DEFAULT false, p_business_name text DEFAULT NULL::text, p_entity_type text DEFAULT NULL::text, p_business_address text DEFAULT NULL::text, p_ordinary_k1_income numeric DEFAULT 0, p_guaranteed_k1_income numeric DEFAULT 0, p_business_annual_revenue numeric DEFAULT 0) RETURNS json
+ CREATE OR REPLACE FUNCTION public.create_client_with_business(p_full_name text, p_email text, p_phone text DEFAULT NULL::text, p_filing_status text DEFAULT 'single'::text, p_dependents integer DEFAULT 0, p_home_address text DEFAULT NULL::text, p_state text DEFAULT 'NV'::text, p_wages_income numeric DEFAULT 0, p_passive_income numeric DEFAULT 0, p_unearned_income numeric DEFAULT 0, p_capital_gains numeric DEFAULT 0, p_household_income numeric DEFAULT 0, p_standard_deduction boolean DEFAULT true, p_custom_deduction numeric DEFAULT 0, p_business_owner boolean DEFAULT false, p_business_name text DEFAULT NULL::text, p_entity_type text DEFAULT NULL::text, p_business_address text DEFAULT NULL::text, p_ordinary_k1_income numeric DEFAULT 0, p_guaranteed_k1_income numeric DEFAULT 0, p_business_annual_revenue numeric DEFAULT 0)+
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- DECLARE
-   v_client_file_id UUID;
-   v_business_id UUID;
-   v_admin_id UUID;
-   v_affiliate_id UUID;
-   v_tax_profile_data JSONB;
- BEGIN
-   -- Get current user info
-   v_admin_id := auth.uid();
-   -- Create tax profile data
-   v_tax_profile_data := jsonb_build_object(
-     'fullName', p_full_name,
-     'email', p_email,
-     'phone', p_phone,
-     'filingStatus', p_filing_status,
-     'dependents', p_dependents,
-     'homeAddress', p_home_address,
-     'state', p_state,
-     'wagesIncome', p_wages_income,
-     'passiveIncome', p_passive_income,
-     'unearnedIncome', p_unearned_income,
-     'capitalGains', p_capital_gains,
-     'householdIncome', p_household_income,
-     'standardDeduction', p_standard_deduction,
-     'customDeduction', p_custom_deduction,
-     'businessOwner', p_business_owner,
-     'businessName', p_business_name,
-     'entityType', p_entity_type,
-     'businessAddress', p_business_address,
-     'ordinaryK1Income', p_ordinary_k1_income,
-     'guaranteedK1Income', p_guaranteed_k1_income,
-     'businessAnnualRevenue', p_business_annual_revenue
-   );
-   -- Insert into admin_client_files
-   INSERT INTO admin_client_files (
-     admin_id,
-     affiliate_id,
-     full_name,
-     email,
-     phone,
-     filing_status,
-     dependents,
-     home_address,
-     state,
-     wages_income,
-     passive_income,
-     unearned_income,
-     capital_gains,
-     household_income,
-     standard_deduction,
-     custom_deduction,
-     business_owner,
-     business_name,
-     entity_type,
-     business_address,
-     ordinary_k1_income,
-     guaranteed_k1_income,
-     business_annual_revenue,
-     tax_profile_data,
-     archived
-   ) VALUES (
-     v_admin_id,
-     v_affiliate_id,
-     p_full_name,
-     p_email,
-     p_phone,
-     p_filing_status,
-     p_dependents,
-     p_home_address,
-     p_state,
-     p_wages_income,
-     p_passive_income,
-     p_unearned_income,
-     p_capital_gains,
-     p_household_income,
-     p_standard_deduction,
-     p_custom_deduction,
-     p_business_owner,
-     p_business_name,
-     p_entity_type,
-     p_business_address,
-     p_ordinary_k1_income,
-     p_guaranteed_k1_income,
-     p_business_annual_revenue,
-     v_tax_profile_data,
-     FALSE
-   ) RETURNING id INTO v_client_file_id;
-   -- If business owner and business name provided, create business
-   IF p_business_owner AND p_business_name IS NOT NULL AND p_business_name != '' THEN
-     INSERT INTO centralized_businesses (
-       business_name,
-       entity_type,
-       business_address,
-       ordinary_k1_income,
-       guaranteed_k1_income,
-       annual_revenue,
-       created_by,
-       archived
-     ) VALUES (
-       p_business_name,
-       COALESCE(p_entity_type, 'Other')::centralized_businesses.entity_type%TYPE,
-       p_business_address,
-       p_ordinary_k1_income,
-       p_guaranteed_k1_income,
-       p_business_annual_revenue,
-       v_admin_id,
-       FALSE
-     ) RETURNING id INTO v_business_id;
-     -- Create initial business year record
-     INSERT INTO business_years (
-       business_id,
-       year,
-       is_active,
-       ordinary_k1_income,
-       guaranteed_k1_income,
-       annual_revenue
-     ) VALUES (
-       v_business_id,
-       EXTRACT(YEAR FROM NOW()),
-       TRUE,
-       p_ordinary_k1_income,
-       p_guaranteed_k1_income,
-       p_business_annual_revenue
-     );
-   END IF;
-   -- Return the created IDs
-   RETURN json_build_object(
-     'client_file_id', v_client_file_id,
-     'business_id', v_business_id
-   );
- END;
- $$;
- --
- -- Name: create_strategy_details_for_proposal(); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `check_document_release_eligibility`

**Differences:**
```diff
- CREATE FUNCTION public.check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying) RETURNS TABLE(can_release boolean, reason text, jurat_signed boolean, payment_received boolean, qc_approved boolean)
+ CREATE OR REPLACE FUNCTION public.check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- DECLARE
-   business_year_record RECORD;
-   control_record RECORD;
-   jurat_exists BOOLEAN;
- BEGIN
-   -- Get business year info
-   SELECT * INTO business_year_record
-   FROM rd_business_years
-   WHERE id = p_business_year_id;
-   -- Get document control info
-   SELECT * INTO control_record
-   FROM rd_qc_document_controls
-   WHERE business_year_id = p_business_year_id 
-   AND document_type = p_document_type;
-   -- Check if jurat is signed (if required)
-   SELECT EXISTS(
-     SELECT 1 FROM rd_signatures 
-     WHERE business_year_id = p_business_year_id 
-     AND signature_type = 'jurat'
-   ) INTO jurat_exists;
-   -- Determine if document can be released based on type and requirements
-   CASE p_document_type
-     WHEN 'research_report' THEN
-       -- Research Report: Available when QC marks as ready
-       RETURN QUERY SELECT 
-         (business_year_record.qc_status IN ('ready_for_review', 'approved', 'complete')),
-         CASE 
-           WHEN business_year_record.qc_status IN ('ready_for_review', 'approved', 'complete') THEN 'Document approved for release'
-           ELSE 'Document pending QC approval'
-         END,
-         jurat_exists,
-         COALESCE(business_year_record.payment_received, FALSE),
-         (business_year_record.qc_status IN ('approved', 'complete'));
-     WHEN 'filing_guide' THEN
-       -- Filing Guide: Available after jurat signed + QC approval + payment
-       RETURN QUERY SELECT 
-         (jurat_exists AND business_year_record.qc_status = 'complete' AND COALESCE(business_year_record.payment_received, FALSE)),
-         CASE 
-           WHEN NOT jurat_exists THEN 'Jurat must be signed first'
-           WHEN business_year_record.qc_status != 'complete' THEN 'QC approval required'
-           WHEN NOT COALESCE(business_year_record.payment_received, FALSE) THEN 'Payment required'
-           ELSE 'Document approved for release'
-         END,
-         jurat_exists,
-         COALESCE(business_year_record.payment_received, FALSE),
-         (business_year_record.qc_status = 'complete');
-     WHEN 'allocation_report' THEN
-       -- Allocation Report: Available after QC approval  
-       RETURN QUERY SELECT 
-         (business_year_record.qc_status IN ('approved', 'complete')),
-         CASE 
-           WHEN business_year_record.qc_status IN ('approved', 'complete') THEN 'Document approved for release'
-           ELSE 'Document pending QC approval'
-         END,
-         jurat_exists,
-         COALESCE(business_year_record.payment_received, FALSE),
-         (business_year_record.qc_status IN ('approved', 'complete'));
-     ELSE
-       -- Default: Require QC approval
-       RETURN QUERY SELECT 
-         (business_year_record.qc_status IN ('approved', 'complete')),
-         'Document pending QC approval',
-         jurat_exists,
-         COALESCE(business_year_record.payment_received, FALSE),
-         (business_year_record.qc_status IN ('approved', 'complete'));
-   END CASE;
- END;
- $$;
- --
- -- Name: FUNCTION check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying); Type: COMMENT; Schema: public; Owner: -
- --
- COMMENT ON FUNCTION public.check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying) IS 'Checks if documents can be released based on business rules';
```

### `calculate_base_amount`

**Differences:**
```diff
- CREATE FUNCTION public.calculate_base_amount(business_id uuid, tax_year integer) RETURNS numeric
+ CREATE OR REPLACE FUNCTION public.calculate_base_amount(business_id uuid, tax_year integer)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 +
-     LANGUAGE plpgsql
-     AS $$
- DECLARE
-   business_record RECORD;
-   base_period_years INTEGER[];
-   total_gross_receipts NUMERIC := 0;
-   total_qre NUMERIC := 0;
-   year_count INTEGER := 0;
-   year INTEGER;
-   historical_item JSONB;
- BEGIN
-   -- Get business record
-   SELECT * INTO business_record 
-   FROM rd_businesses 
-   WHERE id = business_id;
-   IF NOT FOUND THEN
-     RETURN 0;
-   END IF;
-   -- Get base period years
-   base_period_years := get_base_period_years(business_record.start_year, tax_year);
-   -- Calculate averages from historical data
-   FOREACH year IN ARRAY base_period_years LOOP
-     -- Find historical data for this year
-     FOR historical_item IN SELECT jsonb_array_elements(business_record.historical_data) LOOP
-       IF (historical_item->>'year')::INTEGER = year THEN
-         total_gross_receipts := total_gross_receipts + (historical_item->>'gross_receipts')::NUMERIC;
-         total_qre := total_qre + (historical_item->>'qre')::NUMERIC;
-         year_count := year_count + 1;
-         EXIT;
-       END IF;
-     END LOOP;
-   END LOOP;
-   -- Return average QRE if we have data, otherwise 0
-   IF year_count > 0 THEN
-     RETURN total_qre / year_count;
-   ELSE
-     RETURN 0;
-   END IF;
- END;
- $$;
- --
- -- Name: calculate_household_income(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `enroll_client_in_tool`

**Differences:**
```diff
- CREATE FUNCTION public.enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, p_tool_slug text, p_notes text DEFAULT NULL::text) RETURNS uuid
+ CREATE OR REPLACE FUNCTION public.enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, p_tool_slug text, p_notes text DEFAULT NULL::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- DECLARE
-     v_enrollment_id UUID;
- BEGIN
-     INSERT INTO public.tool_enrollments (
-         client_file_id,
-         business_id,
-         tool_slug,
-         enrolled_by,
-         notes
-     ) VALUES (
-         p_client_file_id,
-         p_business_id,
-         p_tool_slug,
-         auth.uid(),
-         p_notes
-     ) ON CONFLICT (client_file_id, business_id, tool_slug) 
-     DO UPDATE SET 
-         status = 'active',
-         notes = COALESCE(p_notes, tool_enrollments.notes),
-         enrolled_at = NOW()
-     RETURNING id INTO v_enrollment_id;
-     RETURN v_enrollment_id;
- END;
- $$;
- --
- -- Name: FUNCTION enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, p_tool_slug text, p_notes text); Type: COMMENT; Schema: public; Owner: -
- --
- COMMENT ON FUNCTION public.enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, p_tool_slug text, p_notes text) IS 'Enrolls a client/business in a tax tool';
```

### `archive_client`

**Differences:**
```diff
- CREATE FUNCTION public.archive_client(p_client_id uuid, p_archive boolean DEFAULT true) RETURNS boolean
+ CREATE OR REPLACE FUNCTION public.archive_client(p_client_id uuid, p_archive boolean)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- BEGIN
-     -- Update the clients table to set archived status
-     UPDATE clients 
-     SET 
-         archived = p_archive, 
-         archived_at = CASE 
-             WHEN p_archive THEN NOW() 
-             ELSE NULL 
-         END,
-         updated_at = NOW()
-     WHERE id = p_client_id;
-     -- Return true if a row was found and updated
-     RETURN FOUND;
- EXCEPTION
-     WHEN OTHERS THEN
-         -- Log the error and return false
-         RAISE NOTICE 'Error archiving client %: %', p_client_id, SQLERRM;
-         RETURN FALSE;
- END;
- $$;
- --
- -- Name: FUNCTION archive_client(p_client_id uuid, p_archive boolean); Type: COMMENT; Schema: public; Owner: -
- --
- COMMENT ON FUNCTION public.archive_client(p_client_id uuid, p_archive boolean) IS 'Archives or unarchives a client by setting the archived flag and timestamp';
```

### `update_business_year`

**Differences:**
```diff
- CREATE FUNCTION public.update_business_year(p_year_id uuid, p_is_active boolean DEFAULT NULL::boolean, p_ordinary_k1_income numeric DEFAULT NULL::numeric, p_guaranteed_k1_income numeric DEFAULT NULL::numeric, p_annual_revenue numeric DEFAULT NULL::numeric, p_employee_count integer DEFAULT NULL::integer) RETURNS boolean
+ CREATE OR REPLACE FUNCTION public.update_business_year(p_year_id uuid, p_is_active boolean DEFAULT NULL::boolean, p_ordinary_k1_income numeric DEFAULT NULL::numeric, p_guaranteed_k1_income numeric DEFAULT NULL::numeric, p_annual_revenue numeric DEFAULT NULL::numeric, p_employee_count integer DEFAULT NULL::integer)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- BEGIN
-   UPDATE business_years SET
-     is_active = COALESCE(p_is_active, is_active),
-     ordinary_k1_income = COALESCE(p_ordinary_k1_income, ordinary_k1_income),
-     guaranteed_k1_income = COALESCE(p_guaranteed_k1_income, guaranteed_k1_income),
-     annual_revenue = COALESCE(p_annual_revenue, annual_revenue),
-     employee_count = COALESCE(p_employee_count, employee_count),
-     updated_at = NOW()
-   WHERE id = p_year_id;
-   RETURN FOUND;
- END;
- $$;
- --
- -- Name: update_business_years_updated_at(); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `handle_updated_at`

**Differences:**
```diff
- CREATE FUNCTION public.handle_updated_at() RETURNS trigger
+ CREATE OR REPLACE FUNCTION public.handle_updated_at()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +
-     LANGUAGE plpgsql
-     AS $$
- BEGIN
-   NEW.updated_at = now();
-   RETURN NEW;
- END;
- $$;
- --
- -- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `calculate_household_income`

**Differences:**
```diff
- CREATE FUNCTION public.calculate_household_income(p_user_id uuid, p_year integer) RETURNS numeric
+ CREATE OR REPLACE FUNCTION public.calculate_household_income(p_user_id uuid, p_year integer)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- DECLARE
-     personal_total DECIMAL(12,2) := 0;
-     business_total DECIMAL(12,2) := 0;
- BEGIN
-     -- Get personal income for the year
-     SELECT COALESCE(total_income, 0) INTO personal_total
-     FROM personal_years
-     WHERE user_id = p_user_id AND year = p_year;
-     -- Get business income for the year
-     SELECT COALESCE(total_business_income, 0) INTO business_total
-     FROM business_years
-     WHERE user_id = p_user_id AND year = p_year;
-     RETURN COALESCE(personal_total, 0) + COALESCE(business_total, 0);
- END;
- $$;
- --
- -- Name: check_document_release_eligibility(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `generate_portal_token`

**Differences:**
```diff
- CREATE FUNCTION public.generate_portal_token(p_business_id uuid) RETURNS TABLE(token character varying, expires_at timestamp without time zone)
+ CREATE OR REPLACE FUNCTION public.generate_portal_token(p_business_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- DECLARE
-   new_token VARCHAR(64);
-   new_expires_at TIMESTAMP;
- BEGIN
-   -- Generate a secure random token
-   new_token := encode(gen_random_bytes(32), 'hex');
-   -- Set expiration to 30 days from now
-   new_expires_at := NOW() + INTERVAL '30 days';
-   -- Deactivate any existing tokens for this business
-   UPDATE rd_client_portal_tokens 
-   SET is_active = FALSE, updated_at = NOW()
-   WHERE business_id = p_business_id AND is_active = TRUE;
-   -- Insert new token
-   INSERT INTO rd_client_portal_tokens (
-     business_id, 
-     token, 
-     expires_at, 
-     created_at, 
-     updated_at,
-     is_active,
-     access_count
-   ) VALUES (
-     p_business_id, 
-     new_token, 
-     new_expires_at, 
-     NOW(), 
-     NOW(),
-     TRUE,
-     0
-   );
-   -- Return the new token
-   RETURN QUERY SELECT new_token, new_expires_at;
- END $$;
- --
- -- Name: get_base_period_years(integer, integer); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `create_strategy_details_for_proposal`

**Differences:**
```diff
- CREATE FUNCTION public.create_strategy_details_for_proposal() RETURNS trigger
+ CREATE OR REPLACE FUNCTION public.create_strategy_details_for_proposal()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    +
-     LANGUAGE plpgsql
-     AS $$
- BEGIN
-   -- This function will be called when a proposal is created
-   -- It will parse the proposed_strategies JSON and create corresponding strategy_details records
-   RETURN NEW;
- END;
- $$;
- --
- -- Name: enroll_client_in_tool(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
- --
```

### `is_admin`

**Differences:**
```diff
- CREATE FUNCTION public.is_admin() RETURNS boolean
+ CREATE OR REPLACE FUNCTION public.is_admin()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
-     LANGUAGE plpgsql SECURITY DEFINER
-     AS $$
- BEGIN
-     RETURN EXISTS (
-         SELECT 1 FROM profiles
-         WHERE id = auth.uid() AND is_admin = true
-     );
- END;
- $$;
- --
- -- Name: safe_update_selected_subcomponent_practice_percent(); Type: FUNCTION; Schema: public; Owner: -
- --
```

## ➕ Missing Functions (Remote Only) (9)

### `update_rd_federal_credit_updated_at`

**Definition to add locally:**
```sql
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
```

### `update_rd_state_proforma_data_updated_at`

**Definition to add locally:**
```sql
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
```

### `validate_portal_token`

**Definition to add locally:**
```sql
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
```

### `archive_rd_federal_credit_version`

**Definition to add locally:**
```sql
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
```

### `update_credits_calculated_at`

**Definition to add locally:**
```sql
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
```

### `update_total_qre`

**Definition to add locally:**
```sql
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
```

### `update_completion_percentage`

**Definition to add locally:**
```sql
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
```

### `safe_update_selected_subcomponent_practice_percent`

**Definition to add locally:**
```sql
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
```

### `update_selected_subcomponent_step_name`

**Definition to add locally:**
```sql
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
```

## ➖ Local Only Functions (80)

### `cleanup_expired_sessions`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
```

### `get_sync_conflicts_summary`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_sync_conflicts_summary()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              +
```

### `set_invitation_token`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.set_invitation_token()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    +
```

### `restore_account`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.restore_account(account_uuid uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        +
```

### `get_tax_proposal_affiliate`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_tax_proposal_affiliate(proposal_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              +
```

### `expire_tool_access`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.expire_tool_access()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
```

### `accept_invitation`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token character varying, user_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +
```

### `security_health_check`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.security_health_check()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   +
```

### `validate_rls_enabled`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.validate_rls_enabled()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    +
```

### `get_profile_activity_summary`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_profile_activity_summary(p_start_date timestamp with time zone DEFAULT (now() - '30 days'::interval), p_end_date timestamp with time zone DEFAULT now(), p_profile_id uuid DEFAULT NULL::uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        +
```

### `bulk_assign_tools`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.bulk_assign_tools(p_account_ids uuid[], p_tool_ids uuid[], p_access_level access_level_type DEFAULT 'full'::access_level_type, p_subscription_level subscription_level_type DEFAULT 'basic'::subscription_level_type, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_notes text DEFAULT NULL::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
```

### `auto_log_significant_tool_usage`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.auto_log_significant_tool_usage()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
```

### `get_tool_usage_analytics`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_tool_usage_analytics(p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_tool_category character varying DEFAULT NULL::character varying)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   +
```

### `create_activity_alert`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.create_activity_alert(p_profile_id uuid, p_alert_type character varying, p_severity character varying, p_title text, p_description text, p_metadata jsonb DEFAULT '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            +
```

### `auto_log_profile_changes`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.auto_log_profile_changes()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
```

### `user_has_direct_client_access`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.user_has_direct_client_access(user_id uuid, client_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               +
```

### `create_security_alert`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.create_security_alert(p_alert_type character varying, p_severity character varying, p_user_id uuid DEFAULT NULL::uuid, p_description text DEFAULT ''::text, p_metadata jsonb DEFAULT '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
```

### `validate_client_access`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.validate_client_access(check_client_id uuid, required_role client_role DEFAULT 'viewer'::client_role)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     +
```

### `get_tool_usage_metrics`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_tool_usage_metrics(p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_account_id uuid DEFAULT NULL::uuid, p_tool_id uuid DEFAULT NULL::uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               +
```

### `update_client_engagement_status`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.update_client_engagement_status(p_client_id uuid, p_status engagement_status DEFAULT NULL::engagement_status, p_pending_actions integer DEFAULT NULL::integer, p_completion_percentage numeric DEFAULT NULL::numeric, p_next_action_due timestamp with time zone DEFAULT NULL::timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  +
```

### `refresh_usage_analytics`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.refresh_usage_analytics()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 +
```

### `detect_profile_sync_discrepancies`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.detect_profile_sync_discrepancies()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +
```

### `bulk_update_tool_status`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.bulk_update_tool_status(p_assignment_filters jsonb, p_new_status character varying, p_notes text DEFAULT NULL::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
```

### `get_profile_activity_timeline`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_profile_activity_timeline(p_profile_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  +
```

### `grant_profile_permission`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.grant_profile_permission(p_profile_id uuid, p_permission_name character varying, p_resource_type character varying, p_action character varying, p_resource_id uuid DEFAULT NULL::uuid, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_conditions jsonb DEFAULT '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              +
```

### `get_profile_effective_permissions`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_profile_effective_permissions(p_profile_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
```

### `schedule_analytics_refresh`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.schedule_analytics_refresh()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              +
```

### `is_security_admin`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.is_security_admin()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +
```

### `update_profile_updated_at`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.update_profile_updated_at()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               +
```

### `create_subscription`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.create_subscription(p_account_id uuid, p_plan_id uuid, p_payment_method_id uuid DEFAULT NULL::uuid, p_trial_days integer DEFAULT NULL::integer, p_billing_contact_profile_id uuid DEFAULT NULL::uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     +
```

### `is_super_admin`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.is_super_admin()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          +
```

### `generate_invoice`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.generate_invoice(p_subscription_id uuid, p_billing_period_start date DEFAULT NULL::date, p_billing_period_end date DEFAULT NULL::date)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    +
```

### `get_usage_export_data`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_usage_export_data(p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_account_id uuid DEFAULT NULL::uuid, p_tool_id uuid DEFAULT NULL::uuid, p_format character varying DEFAULT 'csv'::character varying)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   +
```

### `user_has_client_access`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.user_has_client_access(check_user_id uuid, check_client_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          +
```

### `assign_profile_role`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.assign_profile_role(p_profile_id uuid, p_role_name character varying, p_scope character varying DEFAULT 'global'::character varying, p_scope_id uuid DEFAULT NULL::uuid, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_notes text DEFAULT NULL::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   +
```

### `check_profile_permission`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.check_profile_permission(p_profile_id uuid, p_resource_type character varying, p_action character varying, p_resource_id uuid DEFAULT NULL::uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
```

### `log_client_access`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.log_client_access(action_type text, client_id uuid, user_id uuid DEFAULT auth.uid(), additional_info jsonb DEFAULT '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           +
```

### `get_activity_trends`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_activity_trends(p_days integer DEFAULT 7, p_granularity character varying DEFAULT 'daily'::character varying)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
```

### `process_payment`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.process_payment(p_account_id uuid, p_amount_cents integer, p_currency character varying DEFAULT 'USD'::character varying, p_payment_method_id uuid DEFAULT NULL::uuid, p_subscription_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  +
```

### `get_profile_summary`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_profile_summary(p_profile_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    +
```

### `get_auth_sync_status_summary`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_auth_sync_status_summary()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            +
```

### `cleanup_old_security_events`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             +
```

### `perform_sync_health_check`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.perform_sync_health_check()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               +
```

### `log_tool_usage`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.log_tool_usage(p_account_id uuid, p_tool_id uuid, p_action character varying, p_feature_used character varying DEFAULT NULL::character varying, p_duration_seconds integer DEFAULT NULL::integer, p_data_volume_mb numeric DEFAULT NULL::numeric, p_success boolean DEFAULT true, p_error_code character varying DEFAULT NULL::character varying, p_error_message text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                          +
```

### `user_has_client_role`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.user_has_client_role(check_user_id uuid, check_client_id uuid, required_role client_role)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 +
```

### `rollback_bulk_operation`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.rollback_bulk_operation(p_bulk_operation_id uuid, p_rollback_reason text DEFAULT NULL::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              +
```

### `get_usage_trends`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_usage_trends(p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_interval character varying DEFAULT 'day'::character varying)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               +
```

### `update_client_users_updated_at`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.update_client_users_updated_at()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          +
```

### `get_user_account_id`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_user_account_id(user_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
```

### `create_bulk_operation`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.create_bulk_operation(p_operation_type character varying, p_operation_name character varying, p_target_profile_ids uuid[], p_operation_data jsonb DEFAULT '{}'::jsonb, p_metadata jsonb DEFAULT '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              +
```

### `update_account_tool_access_updated_at`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.update_account_tool_access_updated_at()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   +
```

### `get_account_usage_analytics`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_account_usage_analytics(p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_account_type character varying DEFAULT NULL::character varying)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 +
```

### `user_has_admin_account`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.user_has_admin_account(user_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
```

### `resolve_sync_conflict`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.resolve_sync_conflict(p_conflict_id uuid, p_resolution_strategy text, p_resolution_notes text DEFAULT NULL::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
```

### `log_profile_activity`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.log_profile_activity(p_profile_id uuid, p_activity_type character varying, p_target_type character varying, p_target_id uuid, p_description text, p_metadata jsonb DEFAULT '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   +
```

### `revoke_profile_role`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.revoke_profile_role(p_role_id uuid, p_reason text DEFAULT NULL::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     +
```

### `complete_bulk_operation`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.complete_bulk_operation(p_bulk_operation_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
```

### `detect_suspicious_activity`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(p_lookback_hours integer DEFAULT 24, p_min_threshold integer DEFAULT 10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +
```

### `log_security_event`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, client_id uuid DEFAULT NULL::uuid, event_data jsonb DEFAULT '{}'::jsonb, severity text DEFAULT 'LOW'::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           +
```

### `update_invitations_updated_at`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.update_invitations_updated_at()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           +
```

### `is_affiliated_with_client`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.is_affiliated_with_client(client_id_to_check uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        +
```

### `user_is_client_owner`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.user_is_client_owner(user_id uuid, client_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        +
```

### `ensure_client_has_owner`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.ensure_client_has_owner()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 +
```

### `generate_invitation_token`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.generate_invitation_token()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               +
```

### `log_account_activity`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.log_account_activity(p_account_id uuid, p_activity_type character varying, p_target_type character varying, p_target_id uuid, p_description text, p_metadata jsonb DEFAULT '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   +
```

### `expire_old_invitations`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.expire_old_invitations()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  +
```

### `auto_log_account_changes`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.auto_log_account_changes()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
```

### `check_account_activities_access`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.check_account_activities_access(account_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          +
```

### `calculate_dashboard_metrics`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.calculate_dashboard_metrics(p_client_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             +
```

### `create_profile_if_missing`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.create_profile_if_missing(user_id uuid, user_email text, user_name text DEFAULT NULL::text)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               +
```

### `get_affiliate_from_client`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_affiliate_from_client(client_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 +
```

### `sync_profile_with_auth`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.sync_profile_with_auth(p_profile_id uuid, p_strategy text DEFAULT 'auto'::text, p_force_sync boolean DEFAULT false)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +
```

### `bulk_sync_profiles`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.bulk_sync_profiles(p_profile_ids uuid[] DEFAULT NULL::uuid[], p_sync_strategy text DEFAULT 'auto'::text, p_max_conflicts integer DEFAULT 10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              +
```

### `process_bulk_operation_target`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.process_bulk_operation_target(p_bulk_operation_id uuid, p_target_profile_id uuid, p_operation_type character varying, p_operation_data jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             +
```

### `user_is_admin`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.user_is_admin(user_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               +
```

### `get_user_client_role`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_user_client_role(check_user_id uuid, check_client_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            +
```

### `get_client_info`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.get_client_info(client_id uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           +
```

### `soft_delete_account`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.soft_delete_account(account_uuid uuid)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    +
```

### `log_client_activity`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.log_client_activity(p_client_id uuid, p_user_id uuid, p_activity_type activity_type, p_title text, p_description text DEFAULT NULL::text, p_priority activity_priority DEFAULT 'medium'::activity_priority, p_metadata jsonb DEFAULT '{}'::jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         +
```

### `auto_log_tool_assignment_changes`

**Local definition:**
```sql
CREATE OR REPLACE FUNCTION public.auto_log_tool_assignment_changes()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        +
```

