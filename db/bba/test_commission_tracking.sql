-- Commission Tracking End-to-End Test Script
-- Tests the complete commission workflow from proposal to payment

\echo '=== Commission Tracking End-to-End Test ==='

BEGIN;

-- Create test data (reuse from previous test)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, confirmation_token)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'affiliate1@test.com', NOW(), NOW(), NOW(), 'token1'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'admin@test.com', NOW(), NOW(), NOW(), 'token5'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'expert1@test.com', NOW(), NOW(), NOW(), 'token6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, full_name, email, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Test Affiliate 1', 'affiliate1@test.com', 'affiliate'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Test Admin', 'admin@test.com', 'admin'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'Test Expert 1', 'expert1@test.com', 'expert')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, role = EXCLUDED.role;

-- Create test client
INSERT INTO clients (id, affiliate_id, full_name, email, filing_status, state)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Commission Test Client', 'commission@test.com', 'single', 'NV')
ON CONFLICT (id) DO UPDATE SET affiliate_id = EXCLUDED.affiliate_id, full_name = EXCLUDED.full_name;

-- Create test expert (if experts table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'experts') THEN
        INSERT INTO experts (id, name, email, specialties, commission_rate, is_active)
        VALUES ('77777777-7777-7777-7777-777777777777'::uuid, 'Tax Strategy Expert', 'expert1@test.com', ARRAY['Augusta Rule', 'Cost Segregation'], 0.15, true)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
    END IF;
END $$;

-- Test 1: Strategy Commission Rates Setup
\echo '=== Test 1: Strategy Commission Rates ==='
-- Check if strategy_commission_rates table exists and set up rates
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'strategy_commission_rates') THEN
        INSERT INTO strategy_commission_rates (affiliate_id, strategy_name, affiliate_rate, admin_rate, expert_fee_percentage)
        VALUES 
          ('11111111-1111-1111-1111-111111111111'::uuid, 'Augusta Rule', 0.10, 0.05, 0.15),
          ('11111111-1111-1111-1111-111111111111'::uuid, 'Cost Segregation', 0.08, 0.07, 0.20)
        ON CONFLICT (affiliate_id, strategy_name) DO UPDATE SET
          affiliate_rate = EXCLUDED.affiliate_rate,
          admin_rate = EXCLUDED.admin_rate,
          expert_fee_percentage = EXCLUDED.expert_fee_percentage;
        
        -- Show the rates
        RAISE NOTICE 'Strategy commission rates created successfully';
    ELSE
        RAISE NOTICE 'strategy_commission_rates table does not exist - skipping setup';
    END IF;
END $$;

-- Check commission rates
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
\echo '=== Test 2: Tax Proposal with Commission Potential ==='
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
) ON CONFLICT (id) DO UPDATE SET
  total_savings = EXCLUDED.total_savings,
  proposed_strategies = EXCLUDED.proposed_strategies;

-- Show proposal with affiliate info
SELECT 
  tp.id as proposal_id,
  c.full_name as client_name,
  aff.full_name as affiliate_name,
  tp.total_savings,
  tp.proposed_strategies,
  tp.status
FROM tax_proposals tp
JOIN clients c ON tp.client_id = c.id
JOIN profiles aff ON c.affiliate_id = aff.id
WHERE tp.id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid;

-- Test 3: Commission Transactions (if table exists)
\echo '=== Test 3: Commission Transactions ==='
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commission_transactions') THEN
        -- Simulate affiliate payment due
        INSERT INTO commission_transactions (
          proposal_id, affiliate_id, transaction_type, amount, status, notes, created_by
        ) VALUES (
          'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
          '11111111-1111-1111-1111-111111111111'::uuid,
          'affiliate_payment_due',
          4000.00, -- 10% of $40k savings
          'pending',
          'Commission for Augusta Rule + Cost Segregation strategies',
          '55555555-5555-5555-5555-555555555555'::uuid -- admin
        ) ON CONFLICT DO NOTHING;
        
        -- Simulate admin commission
        INSERT INTO commission_transactions (
          proposal_id, affiliate_id, transaction_type, amount, status, notes, created_by
        ) VALUES (
          'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
          '55555555-5555-5555-5555-555555555555'::uuid,
          'admin_commission',
          2400.00, -- 6% of $40k savings (combined admin rates)
          'pending',
          'Admin commission for proposal management',
          '55555555-5555-5555-5555-555555555555'::uuid
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Commission transactions created successfully';
    ELSE
        RAISE NOTICE 'commission_transactions table does not exist - skipping transaction tests';
    END IF;
END $$;

-- Show commission transactions
SELECT 
  ct.transaction_type,
  p.full_name as recipient_name,
  ct.amount,
  ct.status,
  ct.notes,
  ct.created_at
FROM commission_transactions ct
JOIN profiles p ON ct.affiliate_id = p.id
WHERE ct.proposal_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid
ORDER BY ct.created_at;

-- Test 4: Expert Assignment (if tables exist)
\echo '=== Test 4: Expert Assignment Workflow ==='
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proposal_assignments') THEN
        INSERT INTO proposal_assignments (
          proposal_id, expert_id, assigned_by, expert_status, notes, priority
        ) VALUES (
          'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
          '77777777-7777-7777-7777-777777777777'::uuid,
          '11111111-1111-1111-1111-111111111111'::uuid, -- assigned by affiliate
          'assigned',
          'Expert assigned for Augusta Rule and Cost Segregation implementation',
          'high'
        ) ON CONFLICT (proposal_id, expert_id) DO UPDATE SET
          assigned_by = EXCLUDED.assigned_by,
          expert_status = EXCLUDED.expert_status;
        
        RAISE NOTICE 'Expert assignment created successfully';
    ELSE
        RAISE NOTICE 'proposal_assignments table does not exist - skipping expert assignment tests';
    END IF;
END $$;

-- Show expert assignments
SELECT 
  pa.proposal_id,
  e.name as expert_name,
  assigner.full_name as assigned_by,
  pa.expert_status,
  pa.priority,
  pa.assigned_at
FROM proposal_assignments pa
JOIN experts e ON pa.expert_id = e.id
JOIN profiles assigner ON pa.assigned_by = assigner.id
WHERE pa.proposal_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid;

-- Test 5: Commission Calculation Summary
\echo '=== Test 5: Commission Calculation Summary ==='
-- Calculate total commission breakdown
SELECT 
  'Commission Summary' as report_type,
  tp.total_savings as total_client_savings,
  (
    SELECT SUM(ct.amount) 
    FROM commission_transactions ct 
    WHERE ct.proposal_id = tp.id AND ct.transaction_type = 'affiliate_payment_due'
  ) as affiliate_commission,
  (
    SELECT SUM(ct.amount) 
    FROM commission_transactions ct 
    WHERE ct.proposal_id = tp.id AND ct.transaction_type = 'admin_commission'
  ) as admin_commission,
  (
    SELECT SUM(ct.amount) 
    FROM commission_transactions ct 
    WHERE ct.proposal_id = tp.id
  ) as total_commission_due
FROM tax_proposals tp
WHERE tp.id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid;

-- Test 6: End-to-End Workflow Validation
\echo '=== Test 6: End-to-End Workflow Validation ==='
-- Show complete workflow from affiliate → client → proposal → commission
SELECT 
  aff.full_name as affiliate_name,
  c.full_name as client_name,
  tp.total_savings,
  tp.status as proposal_status,
  COUNT(ct.id) as commission_transactions,
  SUM(ct.amount) as total_commission_amount
FROM profiles aff
JOIN clients c ON c.affiliate_id = aff.id
JOIN tax_proposals tp ON tp.client_id = c.id
LEFT JOIN commission_transactions ct ON ct.proposal_id = tp.id
WHERE aff.role = 'affiliate'
  AND tp.id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid
GROUP BY aff.id, aff.full_name, c.full_name, tp.total_savings, tp.status;

ROLLBACK;

\echo '=== Commission Tracking Tests Completed ===' 