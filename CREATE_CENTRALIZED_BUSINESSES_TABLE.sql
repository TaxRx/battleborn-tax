-- Create the missing centralized_businesses table
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_centralized_businesses_created_by ON public.centralized_businesses(created_by);
CREATE INDEX IF NOT EXISTS idx_centralized_businesses_archived ON public.centralized_businesses(archived);

-- 3. Enable RLS
ALTER TABLE public.centralized_businesses ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Admins can see all businesses
CREATE POLICY IF NOT EXISTS "Admins can view all businesses" ON public.centralized_businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can see businesses they created
CREATE POLICY IF NOT EXISTS "Users can view their own businesses" ON public.centralized_businesses
    FOR SELECT USING (created_by = auth.uid());

-- Admins can manage all businesses
CREATE POLICY IF NOT EXISTS "Admins can manage all businesses" ON public.centralized_businesses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can manage their own businesses
CREATE POLICY IF NOT EXISTS "Users can manage their own businesses" ON public.centralized_businesses
    FOR ALL USING (created_by = auth.uid());

-- 5. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_centralized_businesses_updated_at ON public.centralized_businesses;
CREATE TRIGGER update_centralized_businesses_updated_at 
    BEFORE UPDATE ON public.centralized_businesses 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centralized_businesses TO authenticated;

-- 8. Add comments
COMMENT ON TABLE public.centralized_businesses IS 'Centralized business information for all tax tools';

-- 9. Verify the table was created
SELECT 'centralized_businesses table created successfully' as status; 