-- Epic 3: Admin Security Framework - Core Tables Only
-- Simplified migration focusing only on new admin security tables

-- Add admin_role column to profiles table for enhanced RBAC
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50) CHECK (
    admin_role IN ('super_admin', 'admin', 'platform_admin')
);

-- Create admin_sessions table for enhanced session management
CREATE TABLE IF NOT EXISTS admin_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- Create security_alerts table for real-time security monitoring  
CREATE TABLE IF NOT EXISTS security_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN (
        'failed_login', 'suspicious_ip', 'privilege_abuse', 
        'data_breach', 'session_anomaly', 'brute_force',
        'unauthorized_access', 'policy_violation'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    escalated BOOLEAN DEFAULT false,
    escalated_at TIMESTAMP WITH TIME ZONE
);

-- Create mfa_settings table for future MFA implementation
CREATE TABLE IF NOT EXISTS mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT false,
    method VARCHAR(50) CHECK (method IN ('totp', 'sms', 'email', 'hardware_key')),
    secret_key TEXT, -- Encrypted TOTP secret
    backup_codes TEXT[], -- Encrypted backup codes
    phone_number VARCHAR(20), -- For SMS MFA
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE
);

-- Create login_attempts table for brute force protection
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    ip_address INET NOT NULL,
    success BOOLEAN NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    failure_reason TEXT,
    blocked BOOLEAN DEFAULT false
);

-- Performance indexes for admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_last_activity ON admin_sessions(last_activity DESC);

-- Performance indexes for security_alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);

-- Performance indexes for login_attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at DESC);

-- Update existing security_events table
ALTER TABLE security_events 
    ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS resolved_by UUID;

-- Add indexes for new security_events columns
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved, created_at DESC);

-- Add foreign key constraint for resolved_by if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'security_events_resolved_by_fkey'
    ) THEN
        ALTER TABLE security_events 
        ADD CONSTRAINT security_events_resolved_by_fkey 
        FOREIGN KEY (resolved_by) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create security utility functions
CREATE OR REPLACE FUNCTION is_security_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        JOIN accounts a ON p.account_id = a.id
        WHERE p.id = auth.uid() 
        AND a.type = 'admin'
        AND p.admin_role IN ('super_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        JOIN accounts a ON p.account_id = a.id
        WHERE p.id = auth.uid() 
        AND a.type = 'admin'
        AND p.admin_role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE admin_sessions 
    SET is_active = false 
    WHERE is_active = true 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
    p_alert_type VARCHAR,
    p_severity VARCHAR,
    p_user_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT '',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO security_alerts (
        alert_type,
        severity,
        user_id,
        description,
        metadata
    ) VALUES (
        p_alert_type,
        p_severity,
        p_user_id,
        p_description,
        p_metadata
    ) RETURNING security_alerts.alert_id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON admin_sessions TO authenticated;
GRANT ALL ON admin_sessions TO service_role;

GRANT SELECT, UPDATE ON security_alerts TO authenticated;
GRANT ALL ON security_alerts TO service_role;

GRANT ALL ON mfa_settings TO authenticated;
GRANT ALL ON mfa_settings TO service_role;

GRANT SELECT ON login_attempts TO authenticated;
GRANT ALL ON login_attempts TO service_role;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION is_security_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION create_security_alert(VARCHAR, VARCHAR, UUID, TEXT, JSONB) TO service_role;

COMMENT ON TABLE admin_sessions IS 'Enhanced admin session management with timeout and security tracking';
COMMENT ON TABLE security_alerts IS 'Real-time security alerts for immediate attention';
COMMENT ON TABLE mfa_settings IS 'Multi-factor authentication settings for enhanced security';
COMMENT ON TABLE login_attempts IS 'Login attempt tracking for brute force protection';