-- Add foreign key constraint from profiles.account_id to accounts.id if it doesn't exist
-- This ensures referential integrity between profiles and accounts tables

DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name 
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name 
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'profiles'
            AND kcu.column_name = 'account_id'
            AND ccu.table_name = 'accounts'
            AND ccu.column_name = 'id'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_account_id_fkey 
        FOREIGN KEY (account_id) 
        REFERENCES accounts(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint profiles_account_id_fkey from profiles.account_id to accounts.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint from profiles.account_id to accounts.id already exists';
    END IF;
END $$;

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT profiles_account_id_fkey ON profiles IS 
'Foreign key constraint ensuring that every profile belongs to a valid account. Cascade delete removes profiles when account is deleted.';