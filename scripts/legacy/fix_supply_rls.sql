-- Fix RLS policies for rd_supply_subcomponents
-- This script ensures the RLS policies are properly set up with correct column names

-- 1. Enable RLS on rd_supply_subcomponents
ALTER TABLE public.rd_supply_subcomponents ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents;
DROP POLICY IF EXISTS "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents;
DROP POLICY IF EXISTS "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents;
DROP POLICY IF EXISTS "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents;

-- 3. Create simplified RLS policies that work with the current auth setup
-- These policies check that the business_year_id belongs to a business owned by the authenticated user
CREATE POLICY "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM rd_business_years 
        JOIN businesses ON rd_business_years.business_id = businesses.id
        WHERE rd_supply_subcomponents.business_year_id = rd_business_years.id
        AND businesses.client_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM rd_business_years 
        JOIN businesses ON rd_business_years.business_id = businesses.id
        WHERE rd_supply_subcomponents.business_year_id = rd_business_years.id
        AND businesses.client_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM rd_business_years 
        JOIN businesses ON rd_business_years.business_id = businesses.id
        WHERE rd_supply_subcomponents.business_year_id = rd_business_years.id
        AND businesses.client_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM rd_business_years 
        JOIN businesses ON rd_business_years.business_id = businesses.id
        WHERE rd_supply_subcomponents.business_year_id = rd_business_years.id
        AND businesses.client_id = auth.uid()
    )
);

-- 4. Also fix rd_supplies RLS policies
ALTER TABLE public.rd_supplies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own supplies" ON public.rd_supplies;
DROP POLICY IF EXISTS "Users can insert their own supplies" ON public.rd_supplies;
DROP POLICY IF EXISTS "Users can update their own supplies" ON public.rd_supplies;
DROP POLICY IF EXISTS "Users can delete their own supplies" ON public.rd_supplies;

CREATE POLICY "Users can view their own supplies" ON public.rd_supplies
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM businesses 
        WHERE rd_supplies.business_id = businesses.id
        AND businesses.client_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own supplies" ON public.rd_supplies
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM businesses 
        WHERE rd_supplies.business_id = businesses.id
        AND businesses.client_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own supplies" ON public.rd_supplies
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM businesses 
        WHERE rd_supplies.business_id = businesses.id
        AND businesses.client_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own supplies" ON public.rd_supplies
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM businesses 
        WHERE rd_supplies.business_id = businesses.id
        AND businesses.client_id = auth.uid()
    )
); 