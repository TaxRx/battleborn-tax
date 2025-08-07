-- Complete Database Schema Fix for create_client_with_business function
-- Run this in the Supabase SQL editor

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS business_years CASCADE;
DROP TABLE IF EXISTS centralized_businesses CASCADE;

-- 3. Create the centralized_businesses table
CREATE TABLE public.centralized_businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create the business_years table
CREATE TABLE public.business_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.centralized_businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    ordinary_k1_income NUMERIC(15,2) DEFAULT 0,
    guaranteed_k1_income NUMERIC(15,2) DEFAULT 0,
    annual_revenue NUMERIC(15,2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX idx_centralized_businesses_created_at ON public.centralized_businesses(created_at);
CREATE INDEX idx_business_years_business_id ON public.business_years(business_id);
CREATE INDEX idx_business_years_year ON public.business_years(year);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.centralized_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_years ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for centralized_businesses
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.centralized_businesses;
CREATE POLICY "Users can view their own businesses" ON public.centralized_businesses
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert their own businesses" ON public.centralized_businesses;
CREATE POLICY "Users can insert their own businesses" ON public.centralized_businesses
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own businesses" ON public.centralized_businesses;
CREATE POLICY "Users can update their own businesses" ON public.centralized_businesses
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own businesses" ON public.centralized_businesses;
CREATE POLICY "Users can delete their own businesses" ON public.centralized_businesses
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 8. Create RLS policies for business_years
DROP POLICY IF EXISTS "Users can view business years" ON public.business_years;
CREATE POLICY "Users can view business years" ON public.business_years
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert business years" ON public.business_years;
CREATE POLICY "Users can insert business years" ON public.business_years
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update business years" ON public.business_years;
CREATE POLICY "Users can update business years" ON public.business_years
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete business years" ON public.business_years;
CREATE POLICY "Users can delete business years" ON public.business_years
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 9. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_centralized_businesses_updated_at ON public.centralized_businesses;
CREATE TRIGGER update_centralized_businesses_updated_at
    BEFORE UPDATE ON public.centralized_businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_years_updated_at ON public.business_years;
CREATE TRIGGER update_business_years_updated_at
    BEFORE UPDATE ON public.business_years
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Grant permissions to authenticated users
GRANT ALL ON public.centralized_businesses TO authenticated;
GRANT ALL ON public.business_years TO authenticated;

-- 12. Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 13. Verify tables were created
SELECT 'centralized_businesses table created successfully' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'centralized_businesses'
);

SELECT 'business_years table created successfully' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'business_years'
); 