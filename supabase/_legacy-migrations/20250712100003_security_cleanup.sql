-- Migration: Security cleanup and hardening
-- Created: 2025-01-11
-- Purpose: Remove development policies and add final security measures

-- Remove any remaining "allow all" development policies
-- These are dangerous and should not exist in production

-- Check for and remove overly permissive policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find policies that might be overly permissive
    FOR policy_record IN
        SELECT schemaname, tablename, policyname, cmd, qual
        FROM pg_policies
        WHERE schemaname = 'public'
        AND (
            qual LIKE '%true%' OR
            qual LIKE '%1=1%' OR
            qual IS NULL
        )
    LOOP
        -- Log the policy for review
        RAISE NOTICE 'Found potentially permissive policy: %.% - %', 
            policy_record.schemaname, policy_record.tablename, policy_record.policyname;
        
        -- Uncomment the next line to actually drop these policies
        -- EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
        --     policy_record.policyname, policy_record.schemaname, policy_record.tablename);
    END LOOP;
END;
$$;

-- Create security monitoring views
CREATE OR REPLACE VIEW security_policy_audit AS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%true%' OR qual LIKE '%1=1%' THEN 'PERMISSIVE'
        WHEN qual LIKE '%auth.uid()%' THEN 'USER_SCOPED'
        WHEN qual LIKE '%role_type%' THEN 'ROLE_BASED'
        ELSE 'CUSTOM'
    END as policy_type,
    qual as policy_condition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Create function to validate all RLS policies are enabled
CREATE OR REPLACE FUNCTION validate_rls_enabled()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    has_policies BOOLEAN,
    policy_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COUNT(p.policyname) > 0,
        COUNT(p.policyname)::INTEGER
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check for security vulnerabilities
CREATE OR REPLACE FUNCTION security_health_check()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Check 1: Tables without RLS
    RETURN QUERY
    SELECT 
        'Tables without RLS'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        'Tables without RLS: ' || STRING_AGG(tablename, ', '),
        'HIGH'::TEXT
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
    AND NOT EXISTS (
        SELECT 1 FROM pg_class c
        WHERE c.relname = t.tablename
        AND c.relrowsecurity = true
    );

    -- Check 2: Tables with RLS but no policies
    RETURN QUERY
    SELECT 
        'Tables with RLS but no policies'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
        'Tables with RLS but no policies: ' || STRING_AGG(tablename, ', '),
        'MEDIUM'::TEXT
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
    AND EXISTS (
        SELECT 1 FROM pg_class c
        WHERE c.relname = t.tablename
        AND c.relrowsecurity = true
    )
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.tablename = t.tablename
        AND p.schemaname = 'public'
    );

    -- Check 3: Overly permissive policies
    RETURN QUERY
    SELECT 
        'Overly permissive policies'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        'Permissive policies found: ' || STRING_AGG(tablename || '.' || policyname, ', '),
        'HIGH'::TEXT
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        qual LIKE '%true%' OR
        qual LIKE '%1=1%' OR
        qual IS NULL
    );

    -- Check 4: Functions without SECURITY DEFINER
    RETURN QUERY
    SELECT 
        'Functions without SECURITY DEFINER'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'INFO' END,
        'Functions without SECURITY DEFINER: ' || STRING_AGG(proname, ', '),
        'LOW'::TEXT
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE '%client%'
    AND NOT p.prosecdef;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create client access summary view
CREATE OR REPLACE VIEW client_access_summary AS
SELECT 
    c.id as client_id,
    c.full_name as client_name,
    c.affiliate_id,
    COUNT(cu.id) as total_users,
    COUNT(CASE WHEN cu.role = 'owner' THEN 1 END) as owners,
    COUNT(CASE WHEN cu.role = 'member' THEN 1 END) as members,
    COUNT(CASE WHEN cu.role = 'viewer' THEN 1 END) as viewers,
    COUNT(CASE WHEN cu.role = 'accountant' THEN 1 END) as accountants,
    COUNT(CASE WHEN cu.is_active = true THEN 1 END) as active_users,
    MAX(cu.created_at) as last_user_added
FROM clients c
LEFT JOIN client_users cu ON c.id = cu.client_id
GROUP BY c.id, c.full_name, c.affiliate_id
ORDER BY c.full_name;

-- Create user access summary view
CREATE OR REPLACE VIEW user_access_summary AS
SELECT 
    p.id as user_id,
    p.email,
    p.full_name as name,
    p.role as role_type,
    COUNT(cu.id) as client_count,
    ARRAY_AGG(DISTINCT cu.role) as client_roles,
    ARRAY_AGG(DISTINCT c.full_name) as client_names,
    MAX(cu.created_at) as last_client_added
FROM profiles p
LEFT JOIN client_users cu ON p.id = cu.user_id AND cu.is_active = true
LEFT JOIN clients c ON cu.client_id = c.id
WHERE p.role IN ('client', 'staff', 'affiliate')
GROUP BY p.id, p.email, p.full_name, p.role
ORDER BY p.full_name;

-- Create audit trail for security events
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    client_id UUID REFERENCES clients(id),
    ip_address INET,
    user_agent TEXT,
    event_data JSONB,
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" ON security_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role_type = 'ADMIN'
        )
    );

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    event_type TEXT,
    client_id UUID DEFAULT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    severity TEXT DEFAULT 'LOW'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_events (
        event_type,
        user_id,
        client_id,
        event_data,
        severity,
        created_at
    ) VALUES (
        event_type,
        auth.uid(),
        client_id,
        event_data,
        severity,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_client_id ON security_events(client_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

-- Create function to clean up old security events
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete security events older than 1 year
    DELETE FROM security_events 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND severity IN ('LOW', 'MEDIUM');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    PERFORM log_security_event(
        'security_events_cleanup',
        NULL,
        jsonb_build_object('deleted_count', deleted_count),
        'LOW'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add final security validations
DO $$
BEGIN
    -- Ensure critical tables have RLS enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        WHERE c.relname = 'clients'
        AND c.relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'SECURITY ERROR: clients table must have RLS enabled';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        WHERE c.relname = 'client_users'
        AND c.relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'SECURITY ERROR: client_users table must have RLS enabled';
    END IF;
    
    -- Ensure client_users table exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'client_users'
        AND schemaname = 'public'
    ) THEN
        RAISE EXCEPTION 'SECURITY ERROR: client_users table must exist before completing security hardening';
    END IF;
    
    RAISE NOTICE 'Security hardening validation completed successfully';
END;
$$;

-- Add comments for documentation
COMMENT ON VIEW security_policy_audit IS 'Audit view for reviewing all RLS policies and their types';
COMMENT ON VIEW client_access_summary IS 'Summary view showing user access patterns for each client';
COMMENT ON VIEW user_access_summary IS 'Summary view showing client access patterns for each user';
COMMENT ON TABLE security_events IS 'Audit log for security-related events and access attempts';
COMMENT ON FUNCTION security_health_check() IS 'Comprehensive security health check for the database';
COMMENT ON FUNCTION validate_rls_enabled() IS 'Validate that RLS is properly enabled on all tables';
COMMENT ON FUNCTION log_security_event(TEXT, UUID, JSONB, TEXT) IS 'Log security events for audit trail';
COMMENT ON FUNCTION cleanup_old_security_events() IS 'Clean up old security events to maintain performance'; 