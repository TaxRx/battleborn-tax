-- Migration: Comprehensive fix for all CSV import table RLS policies
-- Issue: 406 errors during CSV upload due to restrictive RLS policies
-- Purpose: Ensure all tables used in CSV import have permissive RLS policies for authenticated users

-- List of tables touched by CSV import:
-- 1. rd_research_categories
-- 2. rd_areas
-- 3. rd_focuses  
-- 4. rd_research_subcomponents
-- 5. rd_research_steps
-- 6. rd_research_activities

-- Helper function to drop all policies for a table
CREATE OR REPLACE FUNCTION drop_all_policies_for_table(table_name TEXT, schema_name TEXT DEFAULT 'public') 
RETURNS VOID AS $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = table_name AND schemaname = schema_name
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol_name, schema_name, table_name);
        RAISE NOTICE 'Dropped policy % on %.%', pol_name, schema_name, table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Helper function to create standard permissive policies for a table
CREATE OR REPLACE FUNCTION create_permissive_policies_for_table(table_name TEXT, schema_name TEXT DEFAULT 'public') 
RETURNS VOID AS $$
BEGIN
    -- Ensure RLS is enabled
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', schema_name, table_name);
    
    -- Create permissive policies for authenticated users
    EXECUTE format('CREATE POLICY "Enable read access for authenticated users" ON %I.%I FOR SELECT USING (auth.role() = ''authenticated'')', schema_name, table_name);
    EXECUTE format('CREATE POLICY "Enable insert access for authenticated users" ON %I.%I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', schema_name, table_name);
    EXECUTE format('CREATE POLICY "Enable update access for authenticated users" ON %I.%I FOR UPDATE USING (auth.role() = ''authenticated'')', schema_name, table_name);
    EXECUTE format('CREATE POLICY "Enable delete access for authenticated users" ON %I.%I FOR DELETE USING (auth.role() = ''authenticated'')', schema_name, table_name);
    
    RAISE NOTICE 'Created permissive policies for %.%', schema_name, table_name;
END;
$$ LANGUAGE plpgsql;

-- 1. Fix rd_research_categories
RAISE NOTICE 'Fixing RLS policies for rd_research_categories...';
SELECT drop_all_policies_for_table('rd_research_categories');
SELECT create_permissive_policies_for_table('rd_research_categories');

-- 2. Fix rd_areas
RAISE NOTICE 'Fixing RLS policies for rd_areas...';
SELECT drop_all_policies_for_table('rd_areas');
SELECT create_permissive_policies_for_table('rd_areas');

-- 3. Fix rd_focuses
RAISE NOTICE 'Fixing RLS policies for rd_focuses...';
SELECT drop_all_policies_for_table('rd_focuses');
SELECT create_permissive_policies_for_table('rd_focuses');

-- 4. Fix rd_research_subcomponents
RAISE NOTICE 'Fixing RLS policies for rd_research_subcomponents...';
SELECT drop_all_policies_for_table('rd_research_subcomponents');
SELECT create_permissive_policies_for_table('rd_research_subcomponents');

-- 5. Fix rd_research_steps
RAISE NOTICE 'Fixing RLS policies for rd_research_steps...';
SELECT drop_all_policies_for_table('rd_research_steps');
SELECT create_permissive_policies_for_table('rd_research_steps');

-- 6. Fix rd_research_activities
RAISE NOTICE 'Fixing RLS policies for rd_research_activities...';
SELECT drop_all_policies_for_table('rd_research_activities');
SELECT create_permissive_policies_for_table('rd_research_activities');

-- Clean up helper functions
DROP FUNCTION IF EXISTS drop_all_policies_for_table(TEXT, TEXT);
DROP FUNCTION IF EXISTS create_permissive_policies_for_table(TEXT, TEXT);

-- Verification: Check that all tables have the expected policies
DO $$
DECLARE
    table_names TEXT[] := ARRAY['rd_research_categories', 'rd_areas', 'rd_focuses', 'rd_research_subcomponents', 'rd_research_steps', 'rd_research_activities'];
    table_name TEXT;
    policy_count INTEGER;
    missing_policies TEXT[] := ARRAY[]::TEXT[];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = table_name 
        AND schemaname = 'public'
        AND policyname LIKE '%authenticated users%';
        
        IF policy_count < 4 THEN
            missing_policies := array_append(missing_policies, table_name);
        END IF;
        
        RAISE NOTICE 'Table % has % policies for authenticated users', table_name, policy_count;
    END LOOP;
    
    IF array_length(missing_policies, 1) > 0 THEN
        RAISE WARNING 'Some tables may have missing policies: %', array_to_string(missing_policies, ', ');
    ELSE
        RAISE NOTICE '✅ All CSV import tables have proper RLS policies for authenticated users';
        RAISE NOTICE '✅ CSV upload 406 errors should now be resolved';
    END IF;
END $$;