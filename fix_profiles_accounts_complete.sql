-- Complete fix for profiles-accounts relationship
-- This script:
-- 1. Creates missing account records for profiles without them
-- 2. Adds primary key constraint to accounts table
-- 3. Adds foreign key constraint from profiles to accounts

-- Step 1: Create missing accounts for profiles that don't have them
DO $$
DECLARE
    profile_record RECORD;
    new_account_id UUID;
    account_name TEXT;
    account_type TEXT;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting profiles-accounts relationship fix...';
    
    -- Process profiles without account_id or with invalid account_id
    FOR profile_record IN 
        SELECT p.id, p.email, p.role, p.is_admin, p.account_id,
               CASE WHEN p.account_id IS NOT NULL AND EXISTS(SELECT 1 FROM accounts WHERE id = p.account_id) 
                    THEN false 
                    ELSE true 
               END as needs_fix
        FROM profiles p
        WHERE p.account_id IS NULL 
           OR NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = p.account_id)
    LOOP
        -- Determine account name and type based on profile
        IF profile_record.is_admin = true OR profile_record.role = 'admin' THEN
            account_name := 'Admin Account - ' || COALESCE(profile_record.email, 'Unknown');
            account_type := 'admin';
        ELSIF profile_record.role = 'partner' THEN
            account_name := 'Partner Account - ' || COALESCE(profile_record.email, 'Unknown');
            account_type := 'partner';
        ELSIF profile_record.role = 'operator' THEN
            account_name := 'Operator Account - ' || COALESCE(profile_record.email, 'Unknown');
            account_type := 'operator';
        ELSE
            account_name := 'Client Account - ' || COALESCE(profile_record.email, 'Unknown');
            account_type := 'client';
        END IF;

        -- Create new account record
        INSERT INTO accounts (name, type, status, created_at, updated_at)
        VALUES (account_name, account_type, 'active', NOW(), NOW())
        RETURNING id INTO new_account_id;

        -- Update profile with new account_id
        UPDATE profiles 
        SET account_id = new_account_id, updated_at = NOW()
        WHERE id = profile_record.id;

        fixed_count := fixed_count + 1;
        
        RAISE NOTICE 'Fixed profile % (%) - Created account % with type %', 
            profile_record.email, profile_record.id, new_account_id, account_type;
    END LOOP;

    RAISE NOTICE 'Total profiles fixed: %', fixed_count;
END $$;

-- Step 2: Add primary key constraint to accounts table (if it doesn't exist)
DO $$
BEGIN
    -- Check if primary key already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'accounts' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        -- Check for duplicate IDs first
        IF EXISTS (
            SELECT id FROM accounts GROUP BY id HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'Cannot add primary key: duplicate IDs found in accounts table';
        END IF;
        
        ALTER TABLE accounts ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key constraint to accounts table';
    ELSE
        RAISE NOTICE 'Primary key constraint already exists on accounts table';
    END IF;
END $$;

-- Step 3: Add foreign key constraint from profiles to accounts (if it doesn't exist)
DO $$
BEGIN
    -- Check if foreign key already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_name = 'profiles_account_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_account_id_fkey 
        FOREIGN KEY (account_id) 
        REFERENCES accounts(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint from profiles to accounts';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists from profiles to accounts';
    END IF;
END $$;

-- Step 4: Verification
SELECT 'VERIFICATION RESULTS:' as status;

-- Show profiles without account_id
SELECT 'Profiles without account_id:' as status;
SELECT COUNT(*) as count FROM profiles WHERE account_id IS NULL;

-- Show profiles with invalid account_id
SELECT 'Profiles with invalid account_id:' as status;
SELECT COUNT(*) as count
FROM profiles p
WHERE p.account_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = p.account_id);

-- Show account distribution
SELECT 'Account distribution by type:' as status;
SELECT 
    type,
    COUNT(*) as count,
    status
FROM accounts 
GROUP BY type, status
ORDER BY type, status;

-- Show constraints
SELECT 'Database constraints:' as status;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
WHERE tc.table_name IN ('accounts', 'profiles')
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type;

SELECT 'Fix completed successfully!' as status;