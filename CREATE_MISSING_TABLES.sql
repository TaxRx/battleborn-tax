-- Create missing tables for create_client_with_business function
-- Run this in the Supabase SQL editor

-- 1. Create the centralized_businesses table
CREATE TABLE IF NOT EXISTS public.centralized_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('LLC', 'S-Corp', 'C-Corp', 'Partnership', 'Sole Proprietorship', 'Other')),
    ein TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_zip TEXT,
    business_phone TEXT,
    business_email TEXT,
    industry TEXT,
    year_established INTEGER,
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES public.profiles(id)
);

-- 2. Create the business_years table
DROP TABLE IF EXISTS public.business_years CASCADE;
CREATE TABLE public.business_years (
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

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_centralized_businesses_created_by ON public.centralized_businesses(created_by);
CREATE INDEX IF NOT EXISTS idx_centralized_businesses_archived ON public.centralized_businesses(archived);
CREATE INDEX IF NOT EXISTS idx_business_years_business_id ON public.business_years(business_id);
CREATE INDEX IF NOT EXISTS idx_business_years_year ON public.business_years(year);

-- 4. Enable RLS
ALTER TABLE public.centralized_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_years ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for centralized_businesses
DROP POLICY IF EXISTS "Admins can view all businesses" ON public.centralized_businesses;
CREATE POLICY "Admins can view all businesses" ON public.centralized_businesses
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can insert businesses" ON public.centralized_businesses;
CREATE POLICY "Admins can insert businesses" ON public.centralized_businesses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update businesses" ON public.centralized_businesses;
CREATE POLICY "Admins can update businesses" ON public.centralized_businesses
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can delete businesses" ON public.centralized_businesses;
CREATE POLICY "Admins can delete businesses" ON public.centralized_businesses
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Create RLS policies for business_years
DROP POLICY IF EXISTS "Admins can view all business years" ON public.business_years;
CREATE POLICY "Admins can view all business years" ON public.business_years
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can insert business years" ON public.business_years;
CREATE POLICY "Admins can insert business years" ON public.business_years
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update business years" ON public.business_years;
CREATE POLICY "Admins can update business years" ON public.business_years
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can delete business years" ON public.business_years;
CREATE POLICY "Admins can delete business years" ON public.business_years
    FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_centralized_businesses ON public.centralized_businesses;
CREATE TRIGGER set_updated_at_centralized_businesses
    BEFORE UPDATE ON public.centralized_businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_business_years ON public.business_years;
CREATE TRIGGER set_updated_at_business_years
    BEFORE UPDATE ON public.business_years
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 9. Grant permissions
GRANT ALL ON public.centralized_businesses TO authenticated;
GRANT ALL ON public.business_years TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 10. Add comments
COMMENT ON TABLE public.centralized_businesses IS 'Centralized business information for all tax tools';
COMMENT ON TABLE public.business_years IS 'Business financial data by year';

-- 11. Success message
SELECT 'centralized_businesses and business_years tables created successfully' as status; 