# Functions Requiring Review

This file contains functions that exist in both local and remote databases but have differences. These functions need manual review to determine if the remote version should replace the local version.

## Different Functions (22)

### 1. add_business_year
**Remote Definition:**
```sql
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
```

### 2. archive_client
**Remote Definition:**
```sql
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

COMMENT ON FUNCTION public.archive_client(p_client_id uuid, p_archive boolean) IS 'Archives or unarchives a client by setting the archived flag and timestamp';
```

### 3. calculate_base_amount
**Remote Definition:**
```sql
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
```

### 4. calculate_household_income
**Remote Definition:**
```sql
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
```

### 5. check_document_release_eligibility
**Remote Definition:**
```sql
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

COMMENT ON FUNCTION public.check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying) IS 'Checks if documents can be released based on business rules';
```

### 6. create_business_with_enrollment
**Remote Definition:**
```sql
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

COMMENT ON FUNCTION public.create_business_with_enrollment(p_business_name text, p_entity_type text, p_client_file_id uuid, p_tool_slug text, p_ein text, p_business_address text, p_business_city text, p_business_state text, p_business_zip text, p_business_phone text, p_business_email text, p_industry text, p_year_established integer, p_annual_revenue numeric, p_employee_count integer) IS 'Creates a new business and enrolls it in a tax tool';
```

### 7. create_client_with_business
**Remote Definition:**
```sql
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
```

### 8. create_strategy_details_for_proposal
**Remote Definition:**
```sql
CREATE FUNCTION public.create_strategy_details_for_proposal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- This function will be called when a proposal is created
  -- It will parse the proposed_strategies JSON and create corresponding strategy_details records
  RETURN NEW;
END;
$$;
```

### 9. enroll_client_in_tool
**Remote Definition:**
```sql
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

COMMENT ON FUNCTION public.enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, p_tool_slug text, p_notes text) IS 'Enrolls a client/business in a tax tool';
```

### 10. generate_portal_token
**Remote Definition:**  
```sql
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
```

### 11. get_base_period_years
**Remote Definition:**
```sql
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
```

### 12. get_client_tools
**Remote Definition:**
```sql
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

COMMENT ON FUNCTION public.get_client_tools(p_client_file_id uuid, p_business_id uuid) IS 'Returns all tools a client is enrolled in';
```

### 13. get_client_with_data
**Remote Definition:**
```sql
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
```

### 14. get_unified_client_list
**Remote Definition:**
```sql
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

COMMENT ON FUNCTION public.get_unified_client_list(p_tool_filter text, p_admin_id uuid, p_affiliate_id uuid) IS 'Returns unified client list with filtering options';
```

### 15. handle_new_user
**Remote Definition:**
```sql
CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$;
```

### 16. handle_updated_at
**Remote Definition:**
```sql
CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 17. is_admin
**Remote Definition:**
```sql
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
```

### 18. set_updated_at
**Remote Definition:**
```sql
CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

### 19. update_business_year
**Remote Definition:**
```sql
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
```

### 20. update_business_years_updated_at
**Remote Definition:**
```sql
CREATE FUNCTION public.update_business_years_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

### 21. update_updated_at_column
**Remote Definition:**
```sql
CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
```

### 22. validate_historical_data
**Remote Definition:**
```sql
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
```

## Review Instructions

For each function above:

1. **Compare with local version** - Check if the remote version has important changes
2. **Test compatibility** - Ensure the remote version works with current database schema  
3. **Update if needed** - Replace local version with remote version if beneficial
4. **Document changes** - Note any breaking changes or new functionality

Once reviewed, these functions can be added to a new migration file or updated individually as needed.