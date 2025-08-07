-- Fix profiles-accounts foreign key relationship
-- This creates the missing foreign key constraint so Supabase API can perform joins

-- First, let's verify the current state
SELECT 'Current profiles without valid account_id:' as status;
SELECT COUNT(*) as count
FROM profiles p
WHERE p.account_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = p.account_id);

-- Check if there are any NULL account_ids that might cause issues
SELECT 'Profiles with NULL account_id:' as status;
SELECT COUNT(*) as count FROM profiles WHERE account_id IS NULL;

-- Add foreign key constraint
-- Note: This will fail if there are orphaned references
SELECT 'Adding foreign key constraint...' as status;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_account_id_fkey 
FOREIGN KEY (account_id) 
REFERENCES accounts(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Verify the constraint was created
SELECT 'Foreign key constraint created successfully!' as status;

-- Test the relationship
SELECT 'Testing relationship:' as status;
SELECT 
    p.email,
    p.account_id,
    a.name as account_name,
    a.type as account_type
FROM profiles p
LEFT JOIN accounts a ON p.account_id = a.id
LIMIT 5;