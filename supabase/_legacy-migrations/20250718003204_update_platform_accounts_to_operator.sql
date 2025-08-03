-- Migration: Update platform accounts to operator
-- Date: 2025-07-18
-- Purpose: Step 2 - Update existing 'platform' accounts to use 'operator' type

-- Step 1: Update existing 'platform' accounts to 'operator'
UPDATE accounts SET type = 'operator' WHERE type = 'platform';

-- Step 2: Update any metadata references in auth.users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{account_type}', '"operator"')
WHERE raw_user_meta_data->>'account_type' = 'platform';

-- Verify the changes
SELECT 'Updated accounts:' as message, count(*) as count FROM accounts WHERE type = 'operator';
SELECT 'Remaining platform accounts:' as message, count(*) as count FROM accounts WHERE type = 'platform';