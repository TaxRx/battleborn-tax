-- Performance Test Script
-- Tests key queries for performance and optimization

\echo '=== Performance Test ==='

BEGIN;

-- Create test data for performance testing
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, confirmation_token)
SELECT 
  gen_random_uuid(),
  'user' || generate_series || '@test.com',
  NOW(),
  NOW(),
  NOW(),
  'token' || generate_series
FROM generate_series(1, 100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, full_name, email, role)
SELECT 
  u.id,
  'User ' || ROW_NUMBER() OVER(),
  u.email,
  CASE WHEN ROW_NUMBER() OVER() % 10 = 0 THEN 'admin'
       WHEN ROW_NUMBER() OVER() % 5 = 0 THEN 'affiliate'
       ELSE 'client' END
FROM auth.users u
WHERE u.email LIKE '%@test.com'
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Create test clients for affiliates
INSERT INTO clients (id, affiliate_id, full_name, email, filing_status, state)
SELECT 
  gen_random_uuid(),
  p.id,
  'Client for ' || p.full_name,
  'client_' || p.id || '@test.com',
  'single',
  'NV'
FROM profiles p
WHERE p.role = 'affiliate'
  AND p.email LIKE '%@test.com'
ON CONFLICT (id) DO UPDATE SET
  affiliate_id = EXCLUDED.affiliate_id,
  full_name = EXCLUDED.full_name;

-- Test 1: Profile Lookup Performance
\echo '=== Test 1: Profile Lookup Performance ==='
\timing on

EXPLAIN ANALYZE
SELECT p.*, au.email as auth_email, au.created_at as auth_created_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.role = 'affiliate'
LIMIT 10;

-- Test 2: Client-Affiliate Relationship Performance
\echo '=== Test 2: Client-Affiliate Relationship Performance ==='

EXPLAIN ANALYZE
SELECT 
  aff.full_name as affiliate_name,
  COUNT(c.id) as client_count,
  AVG(EXTRACT(EPOCH FROM NOW() - c.created_at)) / 86400 as avg_days_since_created
FROM profiles aff
LEFT JOIN clients c ON c.affiliate_id = aff.id
WHERE aff.role = 'affiliate'
GROUP BY aff.id, aff.full_name
ORDER BY client_count DESC;

-- Test 3: Users with Auth View Performance
\echo '=== Test 3: Users with Auth View Performance ==='

EXPLAIN ANALYZE
SELECT full_name, email, role, email_confirmed_at
FROM users_with_auth
WHERE role IN ('affiliate', 'admin')
ORDER BY created_at DESC
LIMIT 20;

-- Test 4: Helper Function Performance
\echo '=== Test 4: Helper Function Performance ==='

-- Test get_client_info function
SELECT client_id, get_client_info(client_id) as client_info
FROM (
  SELECT id as client_id 
  FROM clients 
  WHERE affiliate_id IS NOT NULL 
  LIMIT 5
) sample_clients;

-- Test 5: Commission Query Performance
\echo '=== Test 5: Commission Query Performance ==='

-- Create sample commission data
INSERT INTO commission_transactions (proposal_id, affiliate_id, transaction_type, amount, status, created_by)
SELECT 
  gen_random_uuid(),
  p.id,
  'affiliate_payment_due',
  ROUND((RANDOM() * 5000 + 1000)::numeric, 2),
  'pending',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
FROM profiles p
WHERE p.role = 'affiliate'
  AND p.email LIKE '%@test.com';

EXPLAIN ANALYZE
SELECT 
  p.full_name as affiliate_name,
  COUNT(ct.id) as transaction_count,
  SUM(ct.amount) as total_amount,
  AVG(ct.amount) as avg_amount
FROM commission_transactions ct
JOIN profiles p ON ct.affiliate_id = p.id
WHERE ct.status = 'pending'
GROUP BY p.id, p.full_name
ORDER BY total_amount DESC;

-- Test 6: Index Usage Analysis
\echo '=== Test 6: Index Usage Analysis ==='

-- Check if indexes are being used effectively
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'clients', 'commission_transactions', 'client_users')
ORDER BY idx_tup_read DESC;

-- Test 7: Query Plan Analysis for Complex Joins
\echo '=== Test 7: Complex Join Performance ==='

EXPLAIN ANALYZE
SELECT 
  aff.full_name as affiliate_name,
  c.full_name as client_name,
  COUNT(cu.id) as user_count,
  COUNT(ct.id) as commission_count,
  SUM(ct.amount) as total_commissions
FROM profiles aff
JOIN clients c ON c.affiliate_id = aff.id
LEFT JOIN client_users cu ON cu.client_id = c.id AND cu.is_active = true
LEFT JOIN commission_transactions ct ON ct.affiliate_id = aff.id
WHERE aff.role = 'affiliate'
GROUP BY aff.id, aff.full_name, c.id, c.full_name
HAVING COUNT(cu.id) > 0 OR COUNT(ct.id) > 0
ORDER BY total_commissions DESC NULLS LAST
LIMIT 10;

\timing off

-- Test 8: Database Statistics
\echo '=== Test 8: Database Statistics ==='

SELECT 
  'Profiles' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN role = 'affiliate' THEN 1 END) as affiliates,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'client' THEN 1 END) as clients
FROM profiles

UNION ALL

SELECT 
  'Clients' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN affiliate_id IS NOT NULL THEN 1 END) as with_affiliate,
  COUNT(CASE WHEN affiliate_id IS NULL THEN 1 END) as without_affiliate,
  0 as clients
FROM clients

UNION ALL

SELECT 
  'Commission Transactions' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  0 as clients
FROM commission_transactions;

ROLLBACK;

\echo '=== Performance Tests Completed ===' 