-- Fix #4: Delete partners table and partner_tool_subscriptions table, migrate to accounts
-- Partners will be represented as accounts with type 'platform'
-- partner_tool_subscriptions has been replaced by account_tool_access
-- This migration:
-- 1. Migrates any existing partner data to accounts table
-- 2. Migrates partner_tool_subscriptions data to account_tool_access
-- 3. Updates FK references from partner_id to account_id
-- 4. Drops both partners and partner_tool_subscriptions tables

-- Check current state
DO $$
DECLARE
    partner_count INTEGER;
    subscription_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO partner_count FROM partners;
    RAISE NOTICE 'Found % partner records to migrate', partner_count;
    
    -- Check partner_tool_subscriptions table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'partner_tool_subscriptions' 
        AND table_schema = 'public'
    ) THEN
        SELECT COUNT(*) INTO subscription_count FROM partner_tool_subscriptions;
        RAISE NOTICE 'Found % partner_tool_subscriptions records to migrate', subscription_count;
    ELSE
        RAISE NOTICE 'partner_tool_subscriptions table does not exist';
    END IF;
END;
$$;

-- Migrate existing partners to accounts table
DO $$
DECLARE
    partner_record RECORD;
    new_account_id UUID;
    migration_count INTEGER := 0;
BEGIN
    -- Migrate each partner to accounts table
    FOR partner_record IN
        SELECT id, company_name, logo_url, stripe_customer_id, created_at, updated_at
        FROM partners
    LOOP
        -- Insert into accounts table with 'platform' type
        INSERT INTO accounts (
            name, 
            type, 
            logo_url, 
            stripe_customer_id, 
            created_at, 
            updated_at
        ) VALUES (
            partner_record.company_name,
            'platform',
            partner_record.logo_url,
            partner_record.stripe_customer_id,
            partner_record.created_at,
            partner_record.updated_at
        ) RETURNING id INTO new_account_id;
        
        -- Update references in clients table
        UPDATE clients 
        SET partner_id = new_account_id 
        WHERE partner_id = partner_record.id;
        
        -- Migrate partner_tool_subscriptions to account_tool_access if data exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'partner_tool_subscriptions' 
            AND table_schema = 'public'
        ) THEN
            -- Check if account_tool_access table exists
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'account_tool_access' 
                AND table_schema = 'public'
            ) THEN
                -- Migrate subscription data to account_tool_access
                INSERT INTO account_tool_access (account_id, tool_id, access_level, granted_at, granted_by)
                SELECT 
                    new_account_id,
                    pts.tool_id,
                    COALESCE(pts.access_level, 'read'),
                    COALESCE(pts.created_at, NOW()),
                    pts.created_by
                FROM partner_tool_subscriptions pts
                WHERE pts.partner_id = partner_record.id;
                
                RAISE NOTICE 'Migrated tool subscriptions for partner "%" to account_tool_access', partner_record.company_name;
            ELSE
                RAISE WARNING 'account_tool_access table does not exist - cannot migrate subscription data';
            END IF;
        END IF;
        
        migration_count := migration_count + 1;
        RAISE NOTICE 'Migrated partner "%" (%) to account %', 
            partner_record.company_name, partner_record.id, new_account_id;
    END LOOP;
    
    RAISE NOTICE 'Successfully migrated % partners to accounts table', migration_count;
END;
$$;

-- Update clients table FK constraint to reference accounts
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_partner_id_fkey;
ALTER TABLE clients 
ADD CONSTRAINT clients_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES accounts(id) ON DELETE SET NULL;

-- Drop partner_tool_subscriptions table (replaced by account_tool_access)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'partner_tool_subscriptions' 
        AND table_schema = 'public'
    ) THEN
        -- Drop any RLS policies first
        DROP POLICY IF EXISTS "Partners can manage their tool subscriptions" ON partner_tool_subscriptions;
        DROP POLICY IF EXISTS "Admins can view all tool subscriptions" ON partner_tool_subscriptions;
        
        -- Drop any triggers
        DROP TRIGGER IF EXISTS update_partner_tool_subscriptions_updated_at ON partner_tool_subscriptions;
        
        -- Drop the table
        DROP TABLE partner_tool_subscriptions CASCADE;
        RAISE NOTICE 'Dropped partner_tool_subscriptions table (replaced by account_tool_access)';
    ELSE
        RAISE NOTICE 'partner_tool_subscriptions table does not exist';
    END IF;
END;
$$;

-- Drop any RLS policies on partners table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop RLS policies on partners table
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'partners'
        AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Dropping RLS policy: %', policy_record.policyname;
        EXECUTE format('DROP POLICY IF EXISTS %I ON partners', policy_record.policyname);
    END LOOP;
END;
$$;

-- Drop any triggers on partners table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'partners'
        AND event_object_schema = 'public'
    LOOP
        RAISE NOTICE 'Dropping trigger: %', trigger_record.trigger_name;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON partners', trigger_record.trigger_name);
    END LOOP;
END;
$$;

-- Finally, drop the partners table
DROP TABLE IF EXISTS partners CASCADE;

-- Verify both tables have been dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'partners' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Failed to drop partners table';
    ELSE
        RAISE NOTICE 'Successfully dropped partners table';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'partner_tool_subscriptions' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Failed to drop partner_tool_subscriptions table';
    ELSE
        RAISE NOTICE 'Successfully dropped partner_tool_subscriptions table';
    END IF;
END;
$$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Fix #4 completed: Deleted partners and partner_tool_subscriptions tables';
    RAISE NOTICE '- Partners are now represented as accounts with type "platform"';
    RAISE NOTICE '- Partner tool subscriptions migrated to account_tool_access';
    RAISE NOTICE '- FK references updated to point to accounts table';
    RAISE NOTICE '- Legacy tables removed from schema';
END;
$$;