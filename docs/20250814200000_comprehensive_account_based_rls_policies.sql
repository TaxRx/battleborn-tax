-- Comprehensive Account-Based RLS Policies Migration
-- This migration creates RLS policies for all tables with account_id, client_id, business_id, or business_year_id
-- Uses the can_access_account function for consistent access control across the system

-- Drop existing policies first to avoid conflicts
DO $$ 
DECLARE
    table_record RECORD;
    policy_record RECORD;
BEGIN
    -- Get all tables that will have policies created
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND column_name IN ('account_id', 'client_id', 'business_id', 'business_year_id', 'user_id')
            OR table_name = 'accounts'
        ORDER BY table_name
    LOOP
        -- Drop existing policies for this table
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
                AND tablename = table_record.table_name
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                          policy_record.policyname, 
                          table_record.table_name);
        END LOOP;
    END LOOP;
END $$;

-- Enable RLS on all relevant tables
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND column_name IN ('account_id', 'client_id', 'business_id', 'business_year_id', 'user_id')
            OR table_name = 'accounts'
        ORDER BY table_name
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.table_name);
    END LOOP;
END $$;

-- Create RLS policies for accounts table
CREATE POLICY "accounts_select" ON public.accounts
    FOR SELECT 
    USING (can_access_account(auth.uid(), id, 'view'));

CREATE POLICY "accounts_insert_update_delete" ON public.accounts
    FOR ALL 
    USING (can_access_account(auth.uid(), id, 'admin'));

-- Create RLS policies for tables with account_id
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND column_name = 'account_id'
            AND table_name != 'accounts'  -- Already handled above
        ORDER BY table_name
    LOOP
        -- SELECT policy with 'view' access level
        EXECUTE format('
            CREATE POLICY "%I_select" ON public.%I
                FOR SELECT 
                USING (can_access_account(auth.uid(), account_id, ''view''))', 
                table_record.table_name, table_record.table_name);
        
        -- INSERT/UPDATE/DELETE policy with 'admin' access level
        EXECUTE format('
            CREATE POLICY "%I_insert_update_delete" ON public.%I
                FOR ALL 
                USING (can_access_account(auth.uid(), account_id, ''admin''))', 
                table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- Create RLS policies for tables with client_id (resolve via get_account_id)
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND column_name = 'client_id'
            AND table_name NOT IN (
                -- Exclude tables that also have account_id (already handled above)
                SELECT DISTINCT table_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                    AND column_name = 'account_id'
            )
        ORDER BY table_name
    LOOP
        -- SELECT policy with 'view' access level
        EXECUTE format('
            CREATE POLICY "%I_select" ON public.%I
                FOR SELECT 
                USING (can_access_account(auth.uid(), get_account_id(''clients'', client_id), ''view''))', 
                table_record.table_name, table_record.table_name);
        
        -- INSERT/UPDATE/DELETE policy with 'admin' access level
        EXECUTE format('
            CREATE POLICY "%I_insert_update_delete" ON public.%I
                FOR ALL 
                USING (can_access_account(auth.uid(), get_account_id(''clients'', client_id), ''admin''))', 
                table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- Create RLS policies for tables with business_id (resolve via get_account_id)
-- Note: Tables with both client_id and business_id will be handled by client_id above
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND column_name = 'business_id'
            AND table_name NOT IN (
                -- Exclude tables that also have account_id or client_id (prioritize those instead)
                SELECT DISTINCT table_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                    AND column_name IN ('account_id', 'client_id')
            )
        ORDER BY table_name
    LOOP
        -- SELECT policy with 'view' access level
        EXECUTE format('
            CREATE POLICY "%I_select" ON public.%I
                FOR SELECT 
                USING (can_access_account(auth.uid(), get_account_id(''rd_businesses'', business_id), ''view''))', 
                table_record.table_name, table_record.table_name);
        
        -- INSERT/UPDATE/DELETE policy with 'admin' access level
        EXECUTE format('
            CREATE POLICY "%I_insert_update_delete" ON public.%I
                FOR ALL 
                USING (can_access_account(auth.uid(), get_account_id(''rd_businesses'', business_id), ''admin''))', 
                table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- Create RLS policies for tables with business_year_id (resolve via get_account_id)
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND column_name = 'business_year_id'
            AND table_name NOT IN (
                -- Exclude tables that also have account_id, client_id, or business_id (prioritize those instead)
                SELECT DISTINCT table_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                    AND column_name IN ('account_id', 'client_id', 'business_id')
            )
        ORDER BY table_name
    LOOP
        -- SELECT policy with 'view' access level
        EXECUTE format('
            CREATE POLICY "%I_select" ON public.%I
                FOR SELECT 
                USING (can_access_account(auth.uid(), get_account_id(''rd_business_years'', business_year_id, ''rd_businesses''), ''view''))', 
                table_record.table_name, table_record.table_name);
        
        -- INSERT/UPDATE/DELETE policy with 'admin' access level
        EXECUTE format('
            CREATE POLICY "%I_insert_update_delete" ON public.%I
                FOR ALL 
                USING (can_access_account(auth.uid(), get_account_id(''rd_business_years'', business_year_id, ''rd_businesses''), ''admin''))', 
                table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- Create RLS policies for tables with user_id (resolve via profiles.account_id)
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND column_name = 'user_id'
            AND table_name NOT IN (
                -- Exclude tables that also have higher priority columns
                SELECT DISTINCT table_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                    AND column_name IN ('account_id', 'client_id', 'business_id', 'business_year_id')
            )
        ORDER BY table_name
    LOOP
        -- SELECT policy with 'view' access level
        EXECUTE format('
            CREATE POLICY "%I_select" ON public.%I
                FOR SELECT 
                USING (
                    can_access_account(
                        auth.uid(), 
                        (SELECT account_id FROM profiles WHERE id = user_id), 
                        ''view''
                    )
                )', 
                table_record.table_name, table_record.table_name);
        
        -- INSERT/UPDATE/DELETE policy with 'admin' access level
        EXECUTE format('
            CREATE POLICY "%I_insert_update_delete" ON public.%I
                FOR ALL 
                USING (
                    can_access_account(
                        auth.uid(), 
                        (SELECT account_id FROM profiles WHERE id = user_id), 
                        ''admin''
                    )
                )', 
                table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION public.can_access_account(uuid, uuid, text) IS 
'Used by RLS policies across the system for consistent account-based access control.
SELECT operations use ''view'' permission level, INSERT/UPDATE/DELETE use ''admin'' level.';

-- Migration completion summary
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Migration completed successfully. Created RLS policies for tables with account access control.';
    RAISE NOTICE 'Total policies in public schema: %', policy_count;
END $$;