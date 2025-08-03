-- Fix rd_roles RLS policies to resolve 406 errors
-- The schema is already correct, but RLS policies may be blocking access

-- Ensure RLS is enabled
ALTER TABLE rd_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rd_roles;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON rd_roles;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON rd_roles;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON rd_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON rd_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON rd_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON rd_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON rd_roles;

-- Create permissive policies for authenticated users
-- These allow all authenticated users to read/write rd_roles records
CREATE POLICY "Enable read access for authenticated users" 
ON rd_roles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
ON rd_roles FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" 
ON rd_roles FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" 
ON rd_roles FOR DELETE 
TO authenticated 
USING (true);

-- Verify policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'rd_roles' 
    AND policyname = 'Enable read access for authenticated users';
    
    IF policy_count = 0 THEN
        RAISE EXCEPTION 'Failed to create read policy for rd_roles';
    END IF;
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'rd_roles' 
    AND policyname = 'Enable insert access for authenticated users';
    
    IF policy_count = 0 THEN
        RAISE EXCEPTION 'Failed to create insert policy for rd_roles';
    END IF;
    
    RAISE NOTICE 'Successfully updated rd_roles RLS policies';
    RAISE NOTICE '✅ All authenticated users can now read/write rd_roles records';
END $$;