-- Test script to verify rd_roles table schema
-- Run this in your Supabase SQL Editor to verify the schema is correct

-- 1. Check if the table exists and show all columns
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'rd_roles'
ORDER BY ordinal_position;

-- 2. Check the table constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'rd_roles';

-- 3. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'rd_roles' 
  AND schemaname = 'public';

-- 4. Test a simple insert (you can comment this out if you don't want to test)
-- This will help identify if the issue is with the schema or with specific data
/*
INSERT INTO rd_roles (
    business_id,
    name,
    description,
    parent_id,
    is_default,
    business_year_id,
    baseline_applied_percent,
    type
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- Replace with real business_id
    'Test Role',
    'Test Description',
    NULL,
    false,
    '00000000-0000-0000-0000-000000000000'::uuid, -- Replace with real business_year_id
    NULL,
    'admin'
) RETURNING *;
*/

-- 5. Count existing roles
SELECT COUNT(*) as total_roles FROM rd_roles; 