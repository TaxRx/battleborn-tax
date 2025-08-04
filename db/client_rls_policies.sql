-- Row Level Security (RLS) Policies for Account-Based Client Access
-- This migration implements security policies to ensure clients can only access data
-- from their own account, and that all related data follows the account-based access model.

BEGIN;

-- Enable RLS on key tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ACCOUNTS TABLE POLICIES
-- =====================================================

-- Users can view accounts they belong to
CREATE POLICY "Users can view own account" ON accounts
    FOR SELECT
    USING (
        id IN (
            SELECT account_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Admins can view all accounts
CREATE POLICY "Admins can view all accounts" ON accounts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can update their own account
CREATE POLICY "Users can update own account" ON accounts
    FOR UPDATE
    USING (
        id IN (
            SELECT account_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- CLIENTS TABLE POLICIES
-- =====================================================

-- Users can view clients from their account
CREATE POLICY "Users can view clients from own account" ON clients
    FOR SELECT
    USING (
        account_id IN (
            SELECT account_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Admins can view all clients
CREATE POLICY "Admins can view all clients" ON clients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can update clients from their account
CREATE POLICY "Users can update clients from own account" ON clients
    FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Users can insert clients to their account
CREATE POLICY "Users can insert clients to own account" ON clients
    FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- TAX PROPOSALS TABLE POLICIES
-- =====================================================

-- Users can view tax proposals for clients in their account
CREATE POLICY "Users can view tax proposals from own account" ON tax_proposals
    FOR SELECT
    USING (
        client_id IN (
            SELECT c.id 
            FROM clients c
            INNER JOIN profiles p ON c.account_id = p.account_id
            WHERE p.id = auth.uid()
        )
    );

-- Admins can view all tax proposals
CREATE POLICY "Admins can view all tax proposals" ON tax_proposals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can update tax proposals for clients in their account
CREATE POLICY "Users can update tax proposals from own account" ON tax_proposals
    FOR UPDATE
    USING (
        client_id IN (
            SELECT c.id 
            FROM clients c
            INNER JOIN profiles p ON c.account_id = p.account_id
            WHERE p.id = auth.uid()
        )
    );

-- Users can insert tax proposals for clients in their account
CREATE POLICY "Users can insert tax proposals to own account" ON tax_proposals
    FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT c.id 
            FROM clients c
            INNER JOIN profiles p ON c.account_id = p.account_id
            WHERE p.id = auth.uid()
        )
    );

-- Affiliates and operators can create proposals for any client (business logic)
CREATE POLICY "Affiliates can create proposals for any client" ON tax_proposals
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            INNER JOIN accounts ON profiles.account_id = accounts.id
            WHERE profiles.id = auth.uid() 
            AND accounts.type IN ('affiliate', 'operator')
        )
    );

-- =====================================================
-- HELPER FUNCTION FOR ACCOUNT ACCESS
-- =====================================================

-- Create a helper function to check if user has access to account
CREATE OR REPLACE FUNCTION user_has_account_access(target_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user belongs to the account or is an admin
    RETURN EXISTS (
        SELECT 1 
        FROM profiles p
        LEFT JOIN accounts a ON p.account_id = a.id
        WHERE p.id = auth.uid()
        AND (p.account_id = target_account_id OR p.role = 'admin')
    );
END;
$$;

-- =====================================================
-- ADDITIONAL SECURITY POLICIES FOR RELATED TABLES
-- =====================================================

-- If proposal_notes table exists, add RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proposal_notes') THEN
        ALTER TABLE proposal_notes ENABLE ROW LEVEL SECURITY;
        
        -- Users can view notes for proposals in their account
        EXECUTE 'CREATE POLICY "Users can view proposal notes from own account" ON proposal_notes
            FOR SELECT
            USING (
                proposal_id IN (
                    SELECT tp.id 
                    FROM tax_proposals tp
                    INNER JOIN clients c ON tp.client_id = c.id
                    INNER JOIN profiles p ON c.account_id = p.account_id
                    WHERE p.id = auth.uid()
                )
            )';
        
        -- Admins can view all proposal notes
        EXECUTE 'CREATE POLICY "Admins can view all proposal notes" ON proposal_notes
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role = ''admin''
                )
            )';
    END IF;
END $$;

-- If strategy_implementations table exists, add RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strategy_implementations') THEN
        ALTER TABLE strategy_implementations ENABLE ROW LEVEL SECURITY;
        
        -- Users can view strategy implementations for proposals in their account
        EXECUTE 'CREATE POLICY "Users can view strategy implementations from own account" ON strategy_implementations
            FOR SELECT
            USING (
                proposal_id IN (
                    SELECT tp.id 
                    FROM tax_proposals tp
                    INNER JOIN clients c ON tp.client_id = c.id
                    INNER JOIN profiles p ON c.account_id = p.account_id
                    WHERE p.id = auth.uid()
                )
            )';
    END IF;
END $$;

-- =====================================================
-- VERIFY POLICIES ARE WORKING
-- =====================================================

-- Create a verification function
CREATE OR REPLACE FUNCTION verify_rls_policies()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result TEXT := '';
    policy_count INTEGER;
BEGIN
    -- Check clients table policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'clients';
    
    result := result || 'Clients table has ' || policy_count || ' policies. ';
    
    -- Check tax_proposals table policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'tax_proposals';
    
    result := result || 'Tax_proposals table has ' || policy_count || ' policies. ';
    
    -- Check accounts table policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'accounts';
    
    result := result || 'Accounts table has ' || policy_count || ' policies. ';
    
    RETURN result;
END;
$$;

COMMIT;

-- Log completion
SELECT 'RLS Policies for account-based client access have been created successfully!' as status;
SELECT verify_rls_policies() as policy_summary;