-- IMMEDIATE FIX: rd_research_activities RLS policies causing 406 errors
-- Run this SQL directly in Supabase SQL Editor

-- Fix rd_research_activities table specifically
ALTER TABLE public.rd_research_activities ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be restrictive
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.rd_research_activities;
DROP POLICY IF EXISTS "rd_research_activities_policy" ON public.rd_research_activities;

-- Create permissive policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON public.rd_research_activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_research_activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.rd_research_activities
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_research_activities
    FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the fix
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'rd_research_activities' 
AND schemaname = 'public'
ORDER BY cmd;

SELECT 'rd_research_activities RLS policies fixed! CSV import should work now.' as status;