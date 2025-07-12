-- Multi-User Client Access Test Script
-- Tests the affiliate-client relationships and multi-user access system

\echo '=== Multi-User Client Access Test ==='

BEGIN;

-- Create test auth users
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, confirmation_token)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'affiliate1@test.com', NOW(), NOW(), NOW(), 'token1'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'affiliate2@test.com', NOW(), NOW(), NOW(), 'token2'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'client1@test.com', NOW(), NOW(), NOW(), 'token3'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'client2@test.com', NOW(), NOW(), NOW(), 'token4'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'admin@test.com', NOW(), NOW(), NOW(), 'token5')
ON CONFLICT (id) DO NOTHING;

-- Create test profiles
INSERT INTO profiles (id, full_name, email, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Test Affiliate 1', 'affiliate1@test.com', 'affiliate'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Test Affiliate 2', 'affiliate2@test.com', 'affiliate'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Test Client 1', 'client1@test.com', 'client'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Test Client 2', 'client2@test.com', 'client'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Test Admin', 'admin@test.com', 'admin')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Create test clients managed by affiliates
INSERT INTO clients (id, affiliate_id, full_name, email, phone, filing_status, state)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Client Company A', 'clienta@test.com', '555-0001', 'single', 'NV'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Client Company B', 'clientb@test.com', '555-0002', 'married_filing_jointly', 'CA'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Client Company C', 'clientc@test.com', '555-0003', 'head_of_household', 'TX')
ON CONFLICT (id) DO UPDATE SET
  affiliate_id = EXCLUDED.affiliate_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email;

-- Create multi-user access for clients
INSERT INTO client_users (client_id, user_id, role, is_active)
VALUES 
  -- Client A: Owner + Member access
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'owner', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'member', true),
  
  -- Client B: Owner only
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'owner', true),
  
  -- Client C: Different owner
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'owner', true)
ON CONFLICT (client_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Test 1: Affiliate can see their clients
\echo '=== Test 1: Affiliate Client Relationships ==='
SELECT 
  'Affiliate 1 Clients' as test_case,
  c.full_name as client_name,
  c.email as client_email,
  p.full_name as affiliate_name
FROM clients c
JOIN profiles p ON c.affiliate_id = p.id
WHERE c.affiliate_id = '11111111-1111-1111-1111-111111111111'::uuid
ORDER BY c.full_name;

SELECT 
  'Affiliate 2 Clients' as test_case,
  c.full_name as client_name,
  c.email as client_email,
  p.full_name as affiliate_name
FROM clients c
JOIN profiles p ON c.affiliate_id = p.id
WHERE c.affiliate_id = '22222222-2222-2222-2222-222222222222'::uuid
ORDER BY c.full_name;

-- Test 2: Multi-user client access
\echo '=== Test 2: Multi-User Client Access ==='
SELECT 
  c.full_name as client_name,
  p.full_name as user_name,
  cu.role as access_role,
  cu.is_active
FROM client_users cu
JOIN clients c ON cu.client_id = c.id
JOIN profiles p ON cu.user_id = p.id
ORDER BY c.full_name, cu.role;

-- Test 3: Helper function tests
\echo '=== Test 3: Helper Functions ==='
SELECT * FROM get_client_info('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT * FROM get_affiliate_from_client('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

-- Test 4: Commission tracking setup
\echo '=== Test 4: Commission Tracking Setup ==='
-- Create a test tax proposal
INSERT INTO tax_proposals (id, client_id, user_id, year, tax_info, proposed_strategies, total_savings, status)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  2024,
  '{"income": 100000, "deductions": 25000}'::jsonb,
  '[{"name": "Augusta Rule", "savings": 15000}]'::jsonb,
  15000.00,
  'proposed'
) ON CONFLICT (id) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  user_id = EXCLUDED.user_id,
  total_savings = EXCLUDED.total_savings;

-- Test the tax proposal with affiliate relationship
SELECT 
  tp.id as proposal_id,
  c.full_name as client_name,
  aff.full_name as affiliate_name,
  tp.total_savings,
  tp.status
FROM tax_proposals tp
JOIN clients c ON tp.client_id = c.id
JOIN profiles aff ON c.affiliate_id = aff.id
WHERE tp.id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid;

-- Test 5: Users with auth view
\echo '=== Test 5: Users with Auth View ==='
SELECT 
  full_name,
  email,
  role,
  auth_confirmed
FROM users_with_auth
WHERE role IN ('affiliate', 'admin')
ORDER BY role, full_name;

ROLLBACK;

\echo '=== Multi-User Access Tests Completed ===' 