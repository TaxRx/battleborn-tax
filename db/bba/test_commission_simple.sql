-- Simplified Commission Tracking Test
-- Tests commission functionality with current table structure

\echo '=== Simplified Commission Tracking Test ==='

BEGIN;

-- Create test data
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, confirmation_token)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'affiliate1@test.com', NOW(), NOW(), NOW(), 'token1'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'admin@test.com', NOW(), NOW(), NOW(), 'token5')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, full_name, email, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Test Affiliate 1', 'affiliate1@test.com', 'affiliate'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Test Admin', 'admin@test.com', 'admin')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, role = EXCLUDED.role;

-- Create test client
INSERT INTO clients (id, affiliate_id, full_name, email, filing_status, state)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Commission Test Client', 'commission@test.com', 'single', 'NV')
ON CONFLICT (id) DO UPDATE SET affiliate_id = EXCLUDED.affiliate_id, full_name = EXCLUDED.full_name;

-- Create test expert
INSERT INTO experts (id, name, email, specialties, commission_rate, is_active)
VALUES ('77777777-7777-7777-7777-777777777777'::uuid, 'Tax Strategy Expert', 'expert@test.com', ARRAY['Augusta Rule', 'Cost Segregation'], 0.15, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

-- Test 1: Strategy Commission Rates
\echo '=== Test 1: Strategy Commission Rates ==='
INSERT INTO strategy_commission_rates (affiliate_id, strategy_name, affiliate_rate, admin_rate, expert_fee_percentage)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Augusta Rule Test', 0.10, 0.05, 0.15),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Cost Segregation Test', 0.08, 0.07, 0.20);

-- Show commission rates
SELECT 
  p.full_name as affiliate_name,
  scr.strategy_name,
  scr.affiliate_rate,
  scr.admin_rate,
  scr.expert_fee_percentage
FROM strategy_commission_rates scr
JOIN profiles p ON scr.affiliate_id = p.id
WHERE scr.affiliate_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Test 2: Tax Proposal Creation
\echo '=== Test 2: Tax Proposal Creation ==='
INSERT INTO tax_proposals (id, client_id, user_id, year, tax_info, proposed_strategies, total_savings, status)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  2024,
  '{"income": 250000, "current_tax": 75000}'::jsonb,
  '[
    {"name": "Augusta Rule", "estimated_savings": 15000, "implementation_fee": 5000},
    {"name": "Cost Segregation", "estimated_savings": 25000, "implementation_fee": 8000}
  ]'::jsonb,
  40000.00,
  'proposed'
);

-- Show proposal with affiliate relationship
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

-- Test 3: Commission Transactions
\echo '=== Test 3: Commission Transactions ==='
-- Affiliate commission
INSERT INTO commission_transactions (
  proposal_id, affiliate_id, transaction_type, amount, status, notes, created_by
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'affiliate_payment_due',
  4000.00,
  'pending',
  'Commission for Augusta Rule + Cost Segregation strategies',
  '55555555-5555-5555-5555-555555555555'::uuid
);

-- Admin commission
INSERT INTO commission_transactions (
  proposal_id, affiliate_id, transaction_type, amount, status, notes, created_by
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  '55555555-5555-5555-5555-555555555555'::uuid,
  'admin_commission',
  2400.00,
  'pending',
  'Admin commission for proposal management',
  '55555555-5555-5555-5555-555555555555'::uuid
);

-- Show commission transactions
SELECT 
  ct.transaction_type,
  p.full_name as recipient_name,
  ct.amount,
  ct.status,
  ct.notes
FROM commission_transactions ct
JOIN profiles p ON ct.affiliate_id = p.id
WHERE ct.proposal_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid
ORDER BY ct.created_at;

-- Test 4: Expert Assignment
\echo '=== Test 4: Expert Assignment ==='
INSERT INTO proposal_assignments (
  proposal_id, expert_id, assigned_by, expert_status, notes, priority
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  '77777777-7777-7777-7777-777777777777'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'assigned',
  'Expert assigned for Augusta Rule and Cost Segregation implementation',
  'high'
);

-- Show expert assignment
SELECT 
  pa.proposal_id,
  e.name as expert_name,
  assigner.full_name as assigned_by,
  pa.expert_status,
  pa.priority
FROM proposal_assignments pa
JOIN experts e ON pa.expert_id = e.id
JOIN profiles assigner ON pa.assigned_by = assigner.id
WHERE pa.proposal_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid;

-- Test 5: Complete Workflow Summary
\echo '=== Test 5: Complete Workflow Summary ==='
SELECT 
  aff.full_name as affiliate_name,
  c.full_name as client_name,
  tp.total_savings as client_savings,
  tp.status as proposal_status,
  e.name as assigned_expert,
  pa.expert_status,
  SUM(ct.amount) as total_commission_due
FROM profiles aff
JOIN clients c ON c.affiliate_id = aff.id
JOIN tax_proposals tp ON tp.client_id = c.id
LEFT JOIN commission_transactions ct ON ct.proposal_id = tp.id
LEFT JOIN proposal_assignments pa ON pa.proposal_id = tp.id
LEFT JOIN experts e ON pa.expert_id = e.id
WHERE aff.role = 'affiliate'
  AND tp.id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid
GROUP BY aff.full_name, c.full_name, tp.total_savings, tp.status, e.name, pa.expert_status;

-- Test 6: Commission Breakdown by Type
\echo '=== Test 6: Commission Breakdown ==='
SELECT 
  ct.transaction_type,
  COUNT(*) as transaction_count,
  SUM(ct.amount) as total_amount,
  AVG(ct.amount) as avg_amount
FROM commission_transactions ct
WHERE ct.proposal_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid
GROUP BY ct.transaction_type
ORDER BY ct.transaction_type;

ROLLBACK;

\echo '=== Commission Tests Completed Successfully ===' 