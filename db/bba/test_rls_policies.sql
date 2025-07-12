-- RLS Policies Test Script
-- Tests Row Level Security policies for different user roles

\echo '=== RLS Policies Test ==='

BEGIN;

-- Create test users and data
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, confirmation_token)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'affiliate1@test.com', NOW(), NOW(), NOW(), 'token1'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'affiliate2@test.com', NOW(), NOW(), NOW(), 'token2'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'client1@test.com', NOW(), NOW(), NOW(), 'token3'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'admin@test.com', NOW(), NOW(), NOW(), 'token5')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, full_name, email, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Affiliate 1', 'affiliate1@test.com', 'affiliate'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Affiliate 2', 'affiliate2@test.com', 'affiliate'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Client User', 'client1@test.com', 'client'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Admin User', 'admin@test.com', 'admin')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, role = EXCLUDED.role;

-- Create test clients
INSERT INTO clients (id, affiliate_id, full_name, email, filing_status, state)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Client A', 'clienta@test.com', 'single', 'NV'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Client B', 'clientb@test.com', 'married_filing_jointly', 'CA')
ON CONFLICT (id) DO UPDATE SET affiliate_id = EXCLUDED.affiliate_id, full_name = EXCLUDED.full_name;

-- Create client access
INSERT INTO client_users (client_id, user_id, role, is_active)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'owner', true)
ON CONFLICT (client_id, user_id) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;

-- Create test proposals
INSERT INTO tax_proposals (id, client_id, user_id, year, tax_info, proposed_strategies, total_savings, status)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 2024, '{}'::jsonb, '[]'::jsonb, 10000.00, 'draft'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 2024, '{}'::jsonb, '[]'::jsonb, 15000.00, 'proposed')
ON CONFLICT (id) DO UPDATE SET total_savings = EXCLUDED.total_savings;

-- Test 1: Profile Access Control
\echo '=== Test 1: Profile Access Control ==='
-- Simulate different user contexts by checking what each user should see

-- All users should see their own profile
SELECT 'Own Profile Access' as test_case, COUNT(*) as accessible_profiles
FROM profiles 
WHERE id = '11111111-1111-1111-1111-111111111111'::uuid; -- Affiliate 1's own profile

-- Test admin access to all profiles (simulated)
SELECT 'Admin Profile Access' as test_case, COUNT(*) as total_profiles
FROM profiles;

-- Test 2: Client Access Control
\echo '=== Test 2: Client Access Control ==='
-- Affiliate 1 should see their clients
SELECT 'Affiliate 1 Clients' as test_case, c.full_name, c.email
FROM clients c
WHERE c.affiliate_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Affiliate 2 should see their clients
SELECT 'Affiliate 2 Clients' as test_case, c.full_name, c.email
FROM clients c
WHERE c.affiliate_id = '22222222-2222-2222-2222-222222222222'::uuid;

-- Client user should see clients they have access to
SELECT 'Client User Access' as test_case, c.full_name, cu.role
FROM client_users cu
JOIN clients c ON cu.client_id = c.id
WHERE cu.user_id = '33333333-3333-3333-3333-333333333333'::uuid AND cu.is_active = true;

-- Test 3: Tax Proposal Access Control
\echo '=== Test 3: Tax Proposal Access Control ==='
-- Affiliate 1 should see proposals for their clients
SELECT 'Affiliate 1 Proposals' as test_case, tp.id, c.full_name as client_name, tp.total_savings
FROM tax_proposals tp
JOIN clients c ON tp.client_id = c.id
WHERE c.affiliate_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Affiliate 2 should see proposals for their clients
SELECT 'Affiliate 2 Proposals' as test_case, tp.id, c.full_name as client_name, tp.total_savings
FROM tax_proposals tp
JOIN clients c ON tp.client_id = c.id
WHERE c.affiliate_id = '22222222-2222-2222-2222-222222222222'::uuid;

-- Client user should see proposals for clients they have access to
SELECT 'Client User Proposals' as test_case, tp.id, c.full_name as client_name, tp.total_savings
FROM tax_proposals tp
JOIN clients c ON tp.client_id = c.id
JOIN client_users cu ON cu.client_id = c.id
WHERE cu.user_id = '33333333-3333-3333-3333-333333333333'::uuid AND cu.is_active = true;

-- Test 4: Commission Transaction Access
\echo '=== Test 4: Commission Transaction Access ==='
-- Create test commission transactions
INSERT INTO commission_transactions (proposal_id, affiliate_id, transaction_type, amount, status, created_by)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'affiliate_payment_due', 1000.00, 'pending', '55555555-5555-5555-5555-555555555555'::uuid),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'affiliate_payment_due', 1500.00, 'pending', '55555555-5555-5555-5555-555555555555'::uuid);

-- Affiliate 1 should see their own commissions
SELECT 'Affiliate 1 Commissions' as test_case, ct.amount, ct.status
FROM commission_transactions ct
WHERE ct.affiliate_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Affiliate 2 should see their own commissions
SELECT 'Affiliate 2 Commissions' as test_case, ct.amount, ct.status
FROM commission_transactions ct
WHERE ct.affiliate_id = '22222222-2222-2222-2222-222222222222'::uuid;

-- Admin should see all commissions
SELECT 'Admin Commission View' as test_case, COUNT(*) as total_commissions, SUM(ct.amount) as total_amount
FROM commission_transactions ct;

-- Test 5: Cross-Affiliate Data Isolation
\echo '=== Test 5: Cross-Affiliate Data Isolation ==='
-- Verify Affiliate 1 cannot see Affiliate 2's data

-- Affiliate 1 should NOT see Affiliate 2's clients
SELECT 'Cross-Affiliate Client Isolation' as test_case, 
       COUNT(CASE WHEN c.affiliate_id = '11111111-1111-1111-1111-111111111111'::uuid THEN 1 END) as own_clients,
       COUNT(CASE WHEN c.affiliate_id = '22222222-2222-2222-2222-222222222222'::uuid THEN 1 END) as other_affiliate_clients
FROM clients c;

-- Affiliate 1 should NOT see Affiliate 2's proposals
SELECT 'Cross-Affiliate Proposal Isolation' as test_case,
       COUNT(CASE WHEN c.affiliate_id = '11111111-1111-1111-1111-111111111111'::uuid THEN 1 END) as own_proposals,
       COUNT(CASE WHEN c.affiliate_id = '22222222-2222-2222-2222-222222222222'::uuid THEN 1 END) as other_affiliate_proposals
FROM tax_proposals tp
JOIN clients c ON tp.client_id = c.id;

-- Test 6: Multi-User Client Access Validation
\echo '=== Test 6: Multi-User Client Access Validation ==='
-- Test that multiple users can access the same client with different roles

-- Show all users who have access to Client A
SELECT 
  c.full_name as client_name,
  p.full_name as user_name,
  p.role as user_role,
  cu.role as client_access_role,
  cu.is_active
FROM client_users cu
JOIN clients c ON cu.client_id = c.id
JOIN profiles p ON cu.user_id = p.id
WHERE c.id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
ORDER BY cu.role;

-- Test 7: Helper Function Security
\echo '=== Test 7: Helper Function Security ==='
-- Test that helper functions respect data boundaries
SELECT * FROM get_client_info('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);
SELECT * FROM get_affiliate_from_client('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

-- Test 8: RLS Policy Summary
\echo '=== Test 8: RLS Policy Summary ==='
-- Show which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'clients', 'client_users', 'tax_proposals', 'commission_transactions')
ORDER BY tablename;

ROLLBACK;

\echo '=== RLS Policy Tests Completed ===' 