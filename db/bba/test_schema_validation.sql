-- Schema Validation Test Script
-- Tests the user reference fixes and overall database integrity

-- Test 1: Verify all tables reference profiles instead of auth.users
\echo '=== Test 1: User Reference Validation ==='

-- Check that all user FK constraints point to profiles, not auth.users
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (kcu.column_name LIKE '%user_id%' OR kcu.column_name LIKE '%affiliate_id%' OR kcu.column_name = 'created_by')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Test 2: Verify profiles table structure
\echo '=== Test 2: Profiles Table Structure ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 3: Check auth.users to profiles relationship
\echo '=== Test 3: Auth Users to Profiles Relationship ==='
SELECT 
  COUNT(*) as auth_users_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  COUNT(*) - (SELECT COUNT(*) FROM profiles) as difference
FROM auth.users;

-- Test 4: Verify affiliate relationships
\echo '=== Test 4: Affiliate Relationships ==='
-- Check clients.affiliate_id references
SELECT 
  'clients.affiliate_id' as relationship,
  COUNT(*) as total_clients,
  COUNT(affiliate_id) as clients_with_affiliate,
  COUNT(*) - COUNT(affiliate_id) as clients_without_affiliate
FROM clients
UNION ALL
-- Check admin_client_files.affiliate_id references  
SELECT 
  'admin_client_files.affiliate_id' as relationship,
  COUNT(*) as total_files,
  COUNT(affiliate_id) as files_with_affiliate,
  COUNT(*) - COUNT(affiliate_id) as files_without_affiliate
FROM admin_client_files;

-- Test 5: Verify commission tracking tables
\echo '=== Test 5: Commission Tracking ==='
-- Check if commission tables exist and have proper structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('commission_transactions', 'strategy_commission_rates', 'commissions')
  AND table_schema = 'public'
  AND column_name LIKE '%affiliate_id%'
ORDER BY table_name, ordinal_position;

-- Test 6: Verify RLS policies exist
\echo '=== Test 6: RLS Policies ==='
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'clients', 'tax_proposals', 'commission_transactions')
ORDER BY tablename, policyname;

-- Test 7: Check helper views and functions
\echo '=== Test 7: Helper Views and Functions ==='
-- Check if our helper views exist
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users_with_auth', 'commissions_with_details', 'tax_proposals_with_details')
ORDER BY table_name;

-- Check helper functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_client_info', 'get_affiliate_from_client', 'get_tax_proposal_affiliate')
ORDER BY routine_name;

-- Test 8: Sample data integrity
\echo '=== Test 8: Sample Data Integrity Test ==='
-- Create some test data to verify relationships work
BEGIN;

-- Insert test auth user (this would normally be done by Supabase Auth)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, confirmation_token)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'test-affiliate@example.com',
  NOW(),
  NOW(),
  NOW(),
  'test_token'
) ON CONFLICT (id) DO NOTHING;

-- Insert test profile (affiliate)
INSERT INTO profiles (id, full_name, email, role)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Test Affiliate',
  'test-affiliate@example.com',
  'affiliate'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Insert test client
INSERT INTO clients (id, affiliate_id, full_name, email, phone, filing_status, state)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Test Client',
  'test-client@example.com',
  '555-0123',
  'single',
  'NV'
) ON CONFLICT (id) DO UPDATE SET
  affiliate_id = EXCLUDED.affiliate_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email;

-- Test the relationship queries
SELECT 
  c.full_name as client_name,
  c.email as client_email,
  p.full_name as affiliate_name,
  p.role as affiliate_role
FROM clients c
JOIN profiles p ON c.affiliate_id = p.id
WHERE c.id = '550e8400-e29b-41d4-a716-446655440001'::uuid;

-- Test helper function
SELECT * FROM get_client_info('550e8400-e29b-41d4-a716-446655440001'::uuid);

ROLLBACK; -- Don't actually save test data

\echo '=== All Tests Completed ===' 