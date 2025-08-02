-- Migration: Update client-related RLS policies for multi-user access
-- Created: 2025-01-11
-- Purpose: Update existing RLS policies to work with client_users junction table

-- Update clients table policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Affiliates can view their clients" ON clients;
DROP POLICY IF EXISTS "Affiliates can manage their clients" ON clients;

-- Create new policies for multi-user client access
CREATE POLICY "Client users can view their clients" ON clients
    FOR SELECT
    USING (
        -- Admin access
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role_type = 'ADMIN'
        )
        OR
        -- Affiliate access (managing affiliate)
        affiliate_id = auth.uid()
        OR
        -- Creator access (who created the record)
        created_by = auth.uid()
        OR
        -- Client user access (new multi-user access)
        user_has_client_access(auth.uid(), id)
    );

CREATE POLICY "Client users can update their clients" ON clients
    FOR UPDATE
    USING (
        -- Admin access
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role_type = 'ADMIN'
        )
        OR
        -- Affiliate access (managing affiliate)
        affiliate_id = auth.uid()
        OR
        -- Client owner access (new multi-user access)
        user_has_client_role(auth.uid(), id, 'owner')
    );

-- Update tax_proposals table policies
DROP POLICY IF EXISTS "Users can view own tax proposals" ON tax_proposals;
DROP POLICY IF EXISTS "Users can update own tax proposals" ON tax_proposals;
DROP POLICY IF EXISTS "Affiliates can view their tax proposals" ON tax_proposals;
DROP POLICY IF EXISTS "Affiliates can manage their tax proposals" ON tax_proposals;

CREATE POLICY "Client users can view tax proposals" ON tax_proposals
    FOR SELECT
    USING (
        -- Admin access
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role_type = 'ADMIN'
        )
        OR
        -- Affiliate access (who created the proposal)
        affiliate_id = auth.uid()::text
        OR
        -- Direct user access (proposal belongs to user)
        user_id = auth.uid()
        OR
        -- Client user access (new multi-user access)
        user_has_client_access(auth.uid(), client_id::uuid)
    );

CREATE POLICY "Client users can manage tax proposals" ON tax_proposals
    FOR ALL
    USING (
        -- Admin access
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role_type = 'ADMIN'
        )
        OR
        -- Affiliate access (who created the proposal)
        affiliate_id = auth.uid()::text
        OR
        -- Client member+ access (new multi-user access)
        user_has_client_role(auth.uid(), client_id::uuid, 'member')
    );

-- Update tax_calculations table policies (if exists)
DROP POLICY IF EXISTS "Users can view own tax calculations" ON tax_calculations;
DROP POLICY IF EXISTS "Users can update own tax calculations" ON tax_calculations;

CREATE POLICY "Client users can view tax calculations" ON tax_calculations
    FOR SELECT
    USING (
        -- Admin access
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role_type = 'ADMIN'
        )
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

CREATE POLICY "Client users can manage tax calculations" ON tax_calculations
    FOR ALL
    USING (
        -- Admin access
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role_type = 'ADMIN'
        )
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

-- Update business_activities table policies (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_activities') THEN
        DROP POLICY IF EXISTS "Users can view own business activities" ON business_activities;
        DROP POLICY IF EXISTS "Users can update own business activities" ON business_activities;

        CREATE POLICY "Client users can view business activities" ON business_activities
            FOR SELECT
            USING (
                -- Admin access
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role_type = 'ADMIN'
                )
                OR
                -- Client user access
                user_has_client_access(auth.uid(), client_id)
            );

        CREATE POLICY "Client users can manage business activities" ON business_activities
            FOR ALL
            USING (
                -- Admin access
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role_type = 'ADMIN'
                )
                OR
                -- Client member+ access
                user_has_client_role(auth.uid(), client_id, 'member')
            );
    END IF;
END $$;

-- Update research_activities table policies (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'research_activities') THEN
        DROP POLICY IF EXISTS "Users can view own research activities" ON research_activities;
        DROP POLICY IF EXISTS "Users can update own research activities" ON research_activities;

        CREATE POLICY "Client users can view research activities" ON research_activities
            FOR SELECT
            USING (
                -- Admin access
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role_type = 'ADMIN'
                )
                OR
                -- Client user access
                user_has_client_access(auth.uid(), business_id)
            );

        CREATE POLICY "Client users can manage research activities" ON research_activities
            FOR ALL
            USING (
                -- Admin access
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role_type = 'ADMIN'
                )
                OR
                -- Client member+ access
                user_has_client_role(auth.uid(), business_id, 'member')
            );
    END IF;
END $$;

-- Update documents table policies (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        DROP POLICY IF EXISTS "Users can view own documents" ON documents;
        DROP POLICY IF EXISTS "Users can update own documents" ON documents;

        CREATE POLICY "Client users can view documents" ON documents
            FOR SELECT
            USING (
                -- Admin access
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role_type = 'ADMIN'
                )
                OR
                -- Client user access
                user_has_client_access(auth.uid(), client_id)
            );

        CREATE POLICY "Client users can manage documents" ON documents
            FOR ALL
            USING (
                -- Admin access
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role_type = 'ADMIN'
                )
                OR
                -- Client member+ access
                user_has_client_role(auth.uid(), client_id, 'member')
            );
    END IF;
END $$;

-- Update rd_credit_calculations table policies (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rd_credit_calculations') THEN
        DROP POLICY IF EXISTS "Users can view own rd calculations" ON rd_credit_calculations;
        DROP POLICY IF EXISTS "Users can update own rd calculations" ON rd_credit_calculations;

        CREATE POLICY "Client users can view rd calculations" ON rd_credit_calculations
            FOR SELECT
            USING (
                -- Admin access
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role_type = 'ADMIN'
                )
                OR
                -- Client user access
                user_has_client_access(auth.uid(), client_id)
            );

        CREATE POLICY "Client users can manage rd calculations" ON rd_credit_calculations
            FOR ALL
            USING (
                -- Admin access
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role_type = 'ADMIN'
                )
                OR
                -- Client member+ access (accountants can also manage R&D calculations)
                user_has_client_role(auth.uid(), client_id, 'member')
            );
    END IF;
END $$;

-- Create audit function for client access
CREATE OR REPLACE FUNCTION log_client_access(
    action_type TEXT,
    client_id UUID,
    user_id UUID DEFAULT auth.uid(),
    additional_info JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        action,
        record_id,
        user_id,
        metadata,
        created_at
    ) VALUES (
        'client_access',
        action_type,
        client_id,
        user_id,
        additional_info || jsonb_build_object(
            'client_id', client_id,
            'access_timestamp', NOW()
        ),
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate client access before sensitive operations
CREATE OR REPLACE FUNCTION validate_client_access(
    check_client_id UUID,
    required_role client_role DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has required access
    IF NOT user_has_client_role(auth.uid(), check_client_id, required_role) THEN
        -- Log unauthorized access attempt
        PERFORM log_client_access(
            'unauthorized_access_attempt',
            check_client_id,
            auth.uid(),
            jsonb_build_object(
                'required_role', required_role,
                'user_role', get_user_client_role(auth.uid(), check_client_id)
            )
        );
        RETURN FALSE;
    END IF;
    
    -- Log successful access
    PERFORM log_client_access(
        'authorized_access',
        check_client_id,
        auth.uid(),
        jsonb_build_object(
            'required_role', required_role,
            'user_role', get_user_client_role(auth.uid(), check_client_id)
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION log_client_access(TEXT, UUID, UUID, JSONB) IS 'Log client access events for audit trail';
COMMENT ON FUNCTION validate_client_access(UUID, client_role) IS 'Validate user has required access to client and log the attempt'; 