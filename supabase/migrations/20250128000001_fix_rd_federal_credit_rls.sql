-- Migration: Fix rd_federal_credit RLS policies
-- Issue: RLS policies are too restrictive causing 406 errors on SELECT queries
-- Purpose: Update RLS policies to allow proper read/write access for authenticated users

-- Temporarily disable RLS to ensure we can modify policies
ALTER TABLE public.rd_federal_credit DISABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own rd_federal_credit" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Users can insert own rd_federal_credit" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Users can update own rd_federal_credit" ON public.rd_federal_credit;
DROP POLICY IF EXISTS "Users can delete own rd_federal_credit" ON public.rd_federal_credit;

-- Re-enable RLS
ALTER TABLE public.rd_federal_credit ENABLE ROW LEVEL SECURITY;

-- Create simplified, more permissive policies for authenticated users
-- These policies allow all authenticated users to read/write rd_federal_credit records
-- This matches the pattern used in other rd_* tables

CREATE POLICY "Enable read access for authenticated users" ON public.rd_federal_credit
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_federal_credit
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.rd_federal_credit
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_federal_credit
    FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies were created successfully
DO $$
BEGIN
    -- Check if the policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rd_federal_credit' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        RAISE EXCEPTION 'Failed to create read policy for rd_federal_credit';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rd_federal_credit' 
        AND policyname = 'Enable insert access for authenticated users'
    ) THEN
        RAISE EXCEPTION 'Failed to create insert policy for rd_federal_credit';
    END IF;
    
    RAISE NOTICE 'Successfully updated rd_federal_credit RLS policies';
    RAISE NOTICE '✅ All authenticated users can now read/write rd_federal_credit records';
END $$; 