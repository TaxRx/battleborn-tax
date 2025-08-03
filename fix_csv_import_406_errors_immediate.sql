-- IMMEDIATE FIX: Run this SQL directly in Supabase SQL Editor to fix CSV import 406 errors
-- This fixes RLS policies for all tables used in CSV import

-- Fix rd_research_categories
ALTER TABLE public.rd_research_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_research_categories;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_research_categories;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_research_categories;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_research_categories;

CREATE POLICY "Enable read access for authenticated users" ON public.rd_research_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_research_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_research_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_research_categories FOR DELETE USING (auth.role() = 'authenticated');

-- Fix rd_areas
ALTER TABLE public.rd_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_areas;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_areas;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_areas;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_areas;

CREATE POLICY "Enable read access for authenticated users" ON public.rd_areas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_areas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_areas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_areas FOR DELETE USING (auth.role() = 'authenticated');

-- Fix rd_focuses
ALTER TABLE public.rd_focuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_focuses;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_focuses;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_focuses;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_focuses;

CREATE POLICY "Enable read access for authenticated users" ON public.rd_focuses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_focuses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_focuses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_focuses FOR DELETE USING (auth.role() = 'authenticated');

-- Fix rd_research_subcomponents
ALTER TABLE public.rd_research_subcomponents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_research_subcomponents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_research_subcomponents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_research_subcomponents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_research_subcomponents;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rd_research_subcomponents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.rd_research_subcomponents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.rd_research_subcomponents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.rd_research_subcomponents;

CREATE POLICY "Enable read access for authenticated users" ON public.rd_research_subcomponents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_research_subcomponents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_research_subcomponents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_research_subcomponents FOR DELETE USING (auth.role() = 'authenticated');

-- Fix rd_research_steps
ALTER TABLE public.rd_research_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_research_steps;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_research_steps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_research_steps;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_research_steps;

CREATE POLICY "Enable read access for authenticated users" ON public.rd_research_steps FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_research_steps FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_research_steps FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_research_steps FOR DELETE USING (auth.role() = 'authenticated');

-- Fix rd_research_activities
ALTER TABLE public.rd_research_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_research_activities;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_research_activities;

CREATE POLICY "Enable read access for authenticated users" ON public.rd_research_activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_research_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_research_activities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_research_activities FOR DELETE USING (auth.role() = 'authenticated');

SELECT 'CSV import RLS policies fixed! 406 errors should be resolved.' as status;