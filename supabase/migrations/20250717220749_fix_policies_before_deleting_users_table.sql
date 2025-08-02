-- Fix RLS policies that reference public.users table before deletion
-- This migration updates policies to use existing admin helper functions instead of referencing users table
-- Fix #2a: Prepare for public.users table deletion by updating RLS policy references

-- Update clients table policies to use helper functions
DROP POLICY IF EXISTS "Client users can view their clients" ON clients;
CREATE POLICY "Client users can view their clients" ON clients
    FOR SELECT
    USING (
        -- Admin access using helper function
        user_is_admin(auth.uid())
        OR
        -- -- Affiliate access (managing affiliate)
        -- affiliate_id = auth.uid()
        -- OR
        -- Creator access (who created the record)
        created_by = auth.uid()
        OR
        -- Client user access (new multi-user access)
        user_has_client_access(auth.uid(), id)
    );

DROP POLICY IF EXISTS "Client users can update their clients" ON clients;
CREATE POLICY "Client users can update their clients" ON clients
    FOR UPDATE
    USING (
        -- Admin access using helper function
        user_is_admin(auth.uid())
        -- OR
        -- -- Affiliate access (managing affiliate)
        -- affiliate_id = auth.uid()
        OR
        -- Client owner access (new multi-user access)
        user_has_client_role(auth.uid(), id, 'owner')
    );

-- Update tax_proposals table policies
DROP POLICY IF EXISTS "Client users can view tax proposals" ON tax_proposals;
CREATE POLICY "Client users can view tax proposals" ON tax_proposals
    FOR SELECT
    USING (
        -- Admin access using helper function
        user_is_admin(auth.uid())
        OR
        -- Direct user access (proposal belongs to user)
        user_id = auth.uid()
        OR
        -- Creator access (who created the proposal)
        created_by = auth.uid()
        OR
        -- Client user access (new multi-user access)
        user_has_client_access(auth.uid(), client_id::uuid)
    );

DROP POLICY IF EXISTS "Client users can manage tax proposals" ON tax_proposals;
CREATE POLICY "Client users can manage tax proposals" ON tax_proposals
    FOR ALL
    USING (
        -- Admin access using helper function
        user_is_admin(auth.uid())
        OR
        -- Direct user access (proposal belongs to user)
        user_id = auth.uid()
        OR
        -- Creator access (who created the proposal)
        created_by = auth.uid()
        OR
        -- Client member+ access (new multi-user access)
        user_has_client_role(auth.uid(), client_id::uuid, 'member')
    );

-- Update tax_calculations table policies
DROP POLICY IF EXISTS "Client users can view tax calculations" ON tax_calculations;
CREATE POLICY "Client users can view tax calculations" ON tax_calculations
    FOR SELECT
    USING (
        -- Admin access using helper function
        user_is_admin(auth.uid())
        OR
        -- Direct user access (existing)
        user_id = auth.uid()
        OR
        -- Client user access (new) - if user_id references a client user
        EXISTS (
            SELECT 1 FROM client_users cu
            JOIN clients c ON cu.client_id = c.id
            WHERE cu.user_id = auth.uid()
            AND cu.is_active = true
            AND c.id IN (
                SELECT client_id FROM client_users cu2
                WHERE cu2.user_id = tax_calculations.user_id
                AND cu2.is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "Client users can manage tax calculations" ON tax_calculations;
CREATE POLICY "Client users can manage tax calculations" ON tax_calculations
    FOR ALL
    USING (
        -- Admin access using helper function
        user_is_admin(auth.uid())
        OR
        -- Direct user access (existing)
        user_id = auth.uid()
        OR
        -- Client member+ access (new)
        EXISTS (
            SELECT 1 FROM client_users cu
            JOIN clients c ON cu.client_id = c.id
            WHERE cu.user_id = auth.uid()
            AND cu.is_active = true
            AND cu.role IN ('member', 'accountant', 'owner')
            AND c.id IN (
                SELECT client_id FROM client_users cu2
                WHERE cu2.user_id = tax_calculations.user_id
                AND cu2.is_active = true
            )
        )
    );

-- Update business_activities table policies if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_activities') THEN
        DROP POLICY IF EXISTS "Client users can view business activities" ON business_activities;
        CREATE POLICY "Client users can view business activities" ON business_activities
            FOR SELECT
            USING (
                -- Admin access using helper function
                user_is_admin(auth.uid())
                OR
                -- Client user access
                user_has_client_access(auth.uid(), client_id)
            );

        DROP POLICY IF EXISTS "Client users can manage business activities" ON business_activities;
        CREATE POLICY "Client users can manage business activities" ON business_activities
            FOR ALL
            USING (
                -- Admin access using helper function
                user_is_admin(auth.uid())
                OR
                -- Client member+ access
                user_has_client_role(auth.uid(), client_id, 'member')
            );
    END IF;
END $$;

-- Update research_activities table policies if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'research_activities') THEN
        DROP POLICY IF EXISTS "Client users can view research activities" ON research_activities;
        CREATE POLICY "Client users can view research activities" ON research_activities
            FOR SELECT
            USING (
                -- Admin access using helper function
                user_is_admin(auth.uid())
                OR
                -- Client user access
                user_has_client_access(auth.uid(), business_id)
            );

        DROP POLICY IF EXISTS "Client users can manage research activities" ON research_activities;
        CREATE POLICY "Client users can manage research activities" ON research_activities
            FOR ALL
            USING (
                -- Admin access using helper function
                user_is_admin(auth.uid())
                OR
                -- Client member+ access
                user_has_client_role(auth.uid(), business_id, 'member')
            );
    END IF;
END $$;

-- Update documents table policies if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        DROP POLICY IF EXISTS "Client users can view documents" ON documents;
        CREATE POLICY "Client users can view documents" ON documents
            FOR SELECT
            USING (
                -- Admin access using helper function
                user_is_admin(auth.uid())
                OR
                -- Client user access
                user_has_client_access(auth.uid(), client_id)
            );

        DROP POLICY IF EXISTS "Client users can manage documents" ON documents;
        CREATE POLICY "Client users can manage documents" ON documents
            FOR ALL
            USING (
                -- Admin access using helper function
                user_is_admin(auth.uid())
                OR
                -- Client member+ access
                user_has_client_role(auth.uid(), client_id, 'member')
            );
    END IF;
END $$;

-- Update rd_credit_calculations table policies if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rd_credit_calculations') THEN
        DROP POLICY IF EXISTS "Client users can view rd calculations" ON rd_credit_calculations;
        CREATE POLICY "Client users can view rd calculations" ON rd_credit_calculations
            FOR SELECT
            USING (
                -- Admin access using helper function
                user_is_admin(auth.uid())
                OR
                -- Client user access
                user_has_client_access(auth.uid(), client_id)
            );

        DROP POLICY IF EXISTS "Client users can manage rd calculations" ON rd_credit_calculations;
        CREATE POLICY "Client users can manage rd calculations" ON rd_credit_calculations
            FOR ALL
            USING (
                -- Admin access using helper function
                user_is_admin(auth.uid())
                OR
                -- Client member+ access (accountants can also manage R&D calculations)
                user_has_client_role(auth.uid(), client_id, 'member')
            );
    END IF;
END $$;

-- Update security_events table policy from security_cleanup migration
DROP POLICY IF EXISTS "Admins can view security events" ON security_events;
CREATE POLICY "Admins can view security events" ON security_events
    FOR SELECT
    USING (
        -- Admin access using helper function
        user_is_admin(auth.uid())
    );

-- Add comment for documentation
-- COMMENT ON MIGRATION IS 'Updated all RLS policies to use admin helper functions instead of referencing public.users table directly';

-- Log completion using DO block
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated all RLS policies to use admin helper functions instead of public.users table references';
END;
$$;