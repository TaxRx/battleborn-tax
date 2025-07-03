-- Add K-1 income fields and business years support
-- Migration: 20250119000007_add_k1_income_and_business_years.sql

-- 1. Add K-1 income fields to admin_client_files table
ALTER TABLE public.admin_client_files 
ADD COLUMN IF NOT EXISTS ordinary_k1_income NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS guaranteed_k1_income NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS household_income NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_annual_revenue NUMERIC(15,2) DEFAULT 0;

-- 2. Add K-1 income fields to centralized_businesses table
ALTER TABLE public.centralized_businesses 
ADD COLUMN IF NOT EXISTS ordinary_k1_income NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS guaranteed_k1_income NUMERIC(15,2) DEFAULT 0;

-- 3. Create business_years table to track business data by year
CREATE TABLE IF NOT EXISTS public.business_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.centralized_businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    ordinary_k1_income NUMERIC(15,2) DEFAULT 0,
    guaranteed_k1_income NUMERIC(15,2) DEFAULT 0,
    annual_revenue NUMERIC(15,2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year)
);

-- 4. Create indexes for business_years
CREATE INDEX IF NOT EXISTS idx_business_years_business_id ON public.business_years(business_id);
CREATE INDEX IF NOT EXISTS idx_business_years_year ON public.business_years(year);
CREATE INDEX IF NOT EXISTS idx_business_years_active ON public.business_years(is_active);

-- 5. Enable RLS for business_years
ALTER TABLE public.business_years ENABLE ROW LEVEL SECURITY;

-- Admins can see all business years
CREATE POLICY "Admins can view all business years" ON public.business_years
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can see business years for their businesses
CREATE POLICY "Users can view their own business years" ON public.business_years
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.centralized_businesses cb
            WHERE cb.id = business_years.business_id 
            AND cb.created_by = auth.uid()
        )
    );

-- Admins can manage all business years
CREATE POLICY "Admins can manage all business years" ON public.business_years
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can manage their own business years
CREATE POLICY "Users can manage their own business years" ON public.business_years
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.centralized_businesses cb
            WHERE cb.id = business_years.business_id 
            AND cb.created_by = auth.uid()
        )
    );

-- 6. Drop the old function first to avoid conflicts
DROP FUNCTION IF EXISTS create_client_with_business(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, NUMERIC, BOOLEAN, TEXT, TEXT, TEXT);

-- 7. Update the create_client_with_business function to include new fields
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_client_with_business TO authenticated;

-- 8. Create function to add a business year
CREATE OR REPLACE FUNCTION add_business_year(
  p_business_id UUID,
  p_year INTEGER,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_ordinary_k1_income NUMERIC DEFAULT 0,
  p_guaranteed_k1_income NUMERIC DEFAULT 0,
  p_annual_revenue NUMERIC DEFAULT 0,
  p_employee_count INTEGER DEFAULT 0
) RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_business_year TO authenticated;

-- 9. Create function to update a business year
CREATE OR REPLACE FUNCTION update_business_year(
  p_year_id UUID,
  p_is_active BOOLEAN DEFAULT NULL,
  p_ordinary_k1_income NUMERIC DEFAULT NULL,
  p_guaranteed_k1_income NUMERIC DEFAULT NULL,
  p_annual_revenue NUMERIC DEFAULT NULL,
  p_employee_count INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_business_year TO authenticated;

-- 10. Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_years_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for business_years table
CREATE TRIGGER update_business_years_updated_at 
  BEFORE UPDATE ON public.business_years 
  FOR EACH ROW EXECUTE FUNCTION update_business_years_updated_at(); 