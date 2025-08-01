-- Fix accounts table primary key and then add foreign key constraint

-- Check current accounts table structure
SELECT 'Current accounts table info:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'accounts'
ORDER BY ordinal_position;

-- Check for duplicate IDs (should be 0 for primary key to work)
SELECT 'Checking for duplicate IDs in accounts:' as status;
SELECT id, COUNT(*) as count
FROM accounts
GROUP BY id
HAVING COUNT(*) > 1;

-- Add primary key constraint to accounts table
SELECT 'Adding primary key constraint to accounts table...' as status;
ALTER TABLE accounts ADD PRIMARY KEY (id);

-- Now add the foreign key constraint from profiles to accounts
SELECT 'Adding foreign key constraint from profiles to accounts...' as status;
ALTER TABLE profiles 
ADD CONSTRAINT profiles_account_id_fkey 
FOREIGN KEY (account_id) 
REFERENCES accounts(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Verify both constraints
SELECT 'Verifying constraints:' as status;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('accounts', 'profiles')
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type;

SELECT 'Database relationships fixed successfully!' as status;