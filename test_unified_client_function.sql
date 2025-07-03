-- Test the get_unified_client_list function
-- Run this SQL in your Supabase SQL editor to test the function

-- First, let's check if the function exists and what it returns
SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_unified_client_list';

-- Test the function with no parameters (limit to 5 to avoid DISTINCT issues)
SELECT * FROM get_unified_client_list() LIMIT 5;

-- Test the function with a specific tool filter
SELECT * FROM get_unified_client_list('rd') LIMIT 5;

-- Check the structure of admin_client_files table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_client_files' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we have any data in admin_client_files
SELECT COUNT(*) as total_clients FROM admin_client_files WHERE archived IS NOT TRUE;

-- Check if centralized_businesses table exists
SELECT COUNT(*) as business_count FROM centralized_businesses;

-- Check if tool_enrollments table exists
SELECT COUNT(*) as enrollment_count FROM tool_enrollments; 