-- Test billing database functions
-- File: test_billing_functions.sql

BEGIN;

-- Test 1: Create a subscription plan for testing
INSERT INTO public.subscription_plans (
    plan_code,
    plan_name,
    description,
    plan_type,
    billing_interval,
    price_cents,
    currency,
    trial_period_days,
    is_active
) VALUES (
    'basic-monthly',
    'Basic Monthly Plan',
    'Basic features with monthly billing',
    'recurring',
    'monthly',
    2999, -- $29.99
    'USD',
    14,
    true
) RETURNING id, plan_code, plan_name, price_cents;

-- Test 2: Get the account ID for testing (use the first admin account)
SELECT id as account_id, name, type 
FROM public.accounts 
WHERE type = 'admin' 
LIMIT 1;

-- Test 3: Test create_subscription function
-- Replace the UUIDs below with actual account_id and plan_id from above queries
/*
SELECT * FROM create_subscription(
    'ACCOUNT_ID_HERE'::UUID,  -- Replace with actual account ID
    'PLAN_ID_HERE'::UUID,     -- Replace with actual plan ID
    NULL,                     -- payment_method_id
    7,                        -- trial_days
    NULL                      -- billing_contact_profile_id
);
*/

-- Test 4: Test process_payment function
/*
SELECT * FROM process_payment(
    'ACCOUNT_ID_HERE'::UUID,  -- Replace with actual account ID
    2999,                     -- amount_cents ($29.99)
    'USD',                    -- currency
    NULL,                     -- payment_method_id
    NULL,                     -- subscription_id
    'Test payment for subscription'
);
*/

-- Test 5: Test generate_invoice function
/*
SELECT * FROM generate_invoice(
    'SUBSCRIPTION_ID_HERE'::UUID,  -- Replace with actual subscription ID
    CURRENT_DATE,                  -- billing_period_start
    CURRENT_DATE + INTERVAL '30 days'  -- billing_period_end
);
*/

-- Test 6: Check created data
SELECT 
    'subscription_plans' as table_name,
    COUNT(*) as record_count
FROM public.subscription_plans
WHERE plan_code = 'basic-monthly'

UNION ALL

SELECT 
    'subscriptions' as table_name,
    COUNT(*) as record_count  
FROM public.subscriptions

UNION ALL

SELECT 
    'payments' as table_name,
    COUNT(*) as record_count
FROM public.payments

UNION ALL

SELECT 
    'invoices' as table_name,
    COUNT(*) as record_count
FROM public.invoices

UNION ALL

SELECT 
    'billing_events' as table_name,
    COUNT(*) as record_count
FROM public.billing_events;

ROLLBACK;