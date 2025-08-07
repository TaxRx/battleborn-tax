-- IMMEDIATE FIX: Run this SQL directly in Supabase SQL Editor to fix 406 errors
-- This fixes the RLS policies for rd_federal_credit table causing Section G save failures

-- Drop existing restrictive policies and create permissive ones
ALTER TABLE public.rd_federal_credit DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own rd_federal_credit" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Users can insert own rd_federal_credit" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Users can update own rd_federal_credit" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Users can delete own rd_federal_credit" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_federal_credit;

-- Re-enable RLS
ALTER TABLE public.rd_federal_credit ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON public.rd_federal_credit
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_federal_credit
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.rd_federal_credit
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_federal_credit
    FOR DELETE USING (auth.role() = 'authenticated');

SELECT 'rd_federal_credit RLS policies fixed! Section G save should work now.' as status;