-- Fix create_client_with_business function to handle missing columns
-- Migration: 20250119000010_fix_create_client_function.sql

-- Drop the old function first
DROP FUNCTION IF EXISTS create_client_with_business(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, NUMERIC, BOOLEAN, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC);

-- Create a more robust version of the function
CREATE OR REPLACE FUNCTION create_client_with_business(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_filing_status TEXT DEFAULT 'single',
  p_dependents INTEGER DEFAULT 0,
  p_home_address TEXT DEFAULT NULL,
  p_state TEXT DEFAULT 'NV',
  p_wages_income NUMERIC DEFAULT 0,
  p_passive_income NUMERIC DEFAULT 0,
  p_unearned_income NUMERIC DEFAULT 0,
  p_capital_gains NUMERIC DEFAULT 0,
  p_household_income NUMERIC DEFAULT 0,
  p_standard_deduction BOOLEAN DEFAULT TRUE,
  p_custom_deduction NUMERIC DEFAULT 0,
  p_business_owner BOOLEAN DEFAULT FALSE,
  p_business_name TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_business_address TEXT DEFAULT NULL,
  p_ordinary_k1_income NUMERIC DEFAULT 0,
  p_guaranteed_k1_income NUMERIC DEFAULT 0,
  p_business_annual_revenue NUMERIC DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  v_client_file_id UUID;
  v_business_id UUID;
  v_admin_id UUID;
  v_affiliate_id UUID;
  v_tax_profile_data JSONB;
  v_phone_exists BOOLEAN;
BEGIN
  -- Get current user info
  v_admin_id := auth.uid();
  
  -- Check if phone column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_client_files' 
    AND column_name = 'phone'
  ) INTO v_phone_exists;
  
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

  -- Insert into admin_client_files with conditional phone column
  IF v_phone_exists THEN
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
  ELSE
    -- Fallback insert without phone column
    INSERT INTO admin_client_files (
      admin_id,
      affiliate_id,
      full_name,
      email,
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
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_client_with_business TO authenticated; 