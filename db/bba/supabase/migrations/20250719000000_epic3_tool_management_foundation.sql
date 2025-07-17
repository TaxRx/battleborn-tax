-- Epic 3 Sprint 2: Tool Management Foundation
-- File: 20250719000000_epic3_tool_management_foundation.sql
-- Purpose: Create comprehensive tool management system database foundation
-- Sprint 2 Day 1: Database foundation for tool assignment, subscription management, and usage tracking

BEGIN;

-- ========= PART 1: CREATE SUBSCRIPTION LEVEL ENUM =========

-- Create subscription level enum for granular tool access control
CREATE TYPE subscription_level_type AS ENUM ('basic', 'premium', 'enterprise', 'trial', 'custom');

COMMENT ON TYPE subscription_level_type IS 'Subscription levels for tool access control with billing integration';

-- ========= PART 2: EXTEND ACCOUNT_TOOL_ACCESS TABLE =========

-- Add enhanced columns for tool management system
ALTER TABLE public.account_tool_access 
ADD COLUMN IF NOT EXISTS subscription_level subscription_level_type DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'suspended')),
ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS usage_limits JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;

-- Add constraints for data integrity
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_expiration_future' 
    AND conrelid = 'public.account_tool_access'::regclass
  ) THEN
    ALTER TABLE public.account_tool_access 
    ADD CONSTRAINT check_expiration_future 
    CHECK (expires_at IS NULL OR expires_at > granted_at);
  END IF;
END $$;

-- Add comment describing enhanced table
COMMENT ON TABLE public.account_tool_access IS 'Enhanced tool access management with subscription levels, expiration, and feature control';
COMMENT ON COLUMN public.account_tool_access.subscription_level IS 'Subscription tier determining feature access level';
COMMENT ON COLUMN public.account_tool_access.expires_at IS 'Expiration timestamp for time-limited access (NULL = no expiration)';
COMMENT ON COLUMN public.account_tool_access.created_by IS 'Admin user who initially granted the access';
COMMENT ON COLUMN public.account_tool_access.updated_by IS 'Admin user who last modified the access';
COMMENT ON COLUMN public.account_tool_access.status IS 'Current status of the tool access';
COMMENT ON COLUMN public.account_tool_access.features_enabled IS 'JSON object specifying which tool features are enabled';
COMMENT ON COLUMN public.account_tool_access.usage_limits IS 'JSON object defining usage limits (API calls, exports, etc.)';
COMMENT ON COLUMN public.account_tool_access.last_accessed_at IS 'Timestamp of last tool access for analytics';

-- ========= PART 3: CREATE TOOL_USAGE_LOGS TABLE =========

-- Create comprehensive usage tracking table for analytics
CREATE TABLE IF NOT EXISTS public.tool_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    action VARCHAR(100) NOT NULL CHECK (action IN (
        'tool_access', 'feature_use', 'calculation_run', 'data_export', 
        'document_upload', 'report_generation', 'api_call', 'bulk_operation',
        'template_use', 'collaboration_action', 'workflow_step', 'integration_sync'
    )),
    feature_used VARCHAR(100),
    duration_seconds INTEGER CHECK (duration_seconds >= 0),
    data_volume_mb DECIMAL(10,2) CHECK (data_volume_mb >= 0),
    success BOOLEAN DEFAULT true,
    error_code VARCHAR(50),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.tool_usage_logs IS 'Comprehensive tracking of tool usage for analytics, billing, and optimization';
COMMENT ON COLUMN public.tool_usage_logs.account_id IS 'Account that owns the tool access';
COMMENT ON COLUMN public.tool_usage_logs.tool_id IS 'Tool that was accessed or used';
COMMENT ON COLUMN public.tool_usage_logs.profile_id IS 'User who performed the action (NULL for system actions)';
COMMENT ON COLUMN public.tool_usage_logs.action IS 'Type of action performed with the tool';
COMMENT ON COLUMN public.tool_usage_logs.feature_used IS 'Specific feature within the tool that was used';
COMMENT ON COLUMN public.tool_usage_logs.duration_seconds IS 'Duration of the session or action in seconds';
COMMENT ON COLUMN public.tool_usage_logs.data_volume_mb IS 'Amount of data processed in megabytes';
COMMENT ON COLUMN public.tool_usage_logs.success IS 'Whether the action completed successfully';
COMMENT ON COLUMN public.tool_usage_logs.metadata IS 'Additional context data for the usage event';

-- ========= PART 4: CREATE PERFORMANCE INDEXES =========

-- Indexes for account_tool_access table (enhanced)
CREATE INDEX IF NOT EXISTS idx_account_tool_access_expires_at 
    ON public.account_tool_access(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_account_tool_access_status 
    ON public.account_tool_access(status);

CREATE INDEX IF NOT EXISTS idx_account_tool_access_subscription_level 
    ON public.account_tool_access(subscription_level);

CREATE INDEX IF NOT EXISTS idx_account_tool_access_last_accessed 
    ON public.account_tool_access(last_accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_tool_access_created_by 
    ON public.account_tool_access(created_by);

-- Composite indexes for common admin queries
CREATE INDEX IF NOT EXISTS idx_account_tool_access_account_status 
    ON public.account_tool_access(account_id, status);

CREATE INDEX IF NOT EXISTS idx_account_tool_access_tool_status 
    ON public.account_tool_access(tool_id, status);

CREATE INDEX IF NOT EXISTS idx_account_tool_access_expires_status 
    ON public.account_tool_access(expires_at, status) WHERE expires_at IS NOT NULL;

-- Indexes for tool_usage_logs table (optimized for analytics)
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_account_id 
    ON public.tool_usage_logs(account_id);

CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_tool_id 
    ON public.tool_usage_logs(tool_id);

CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_profile_id 
    ON public.tool_usage_logs(profile_id);

CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_created_at 
    ON public.tool_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_action 
    ON public.tool_usage_logs(action);

CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_session_id 
    ON public.tool_usage_logs(session_id);

-- Composite indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_account_date 
    ON public.tool_usage_logs(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_tool_date 
    ON public.tool_usage_logs(tool_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_account_tool_date 
    ON public.tool_usage_logs(account_id, tool_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_action_date 
    ON public.tool_usage_logs(action, created_at DESC);

-- Specialized index for time-range analytics queries
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_analytics 
    ON public.tool_usage_logs(created_at DESC, tool_id, account_id, action, success);

-- Partial index for failed operations (smaller, more efficient)
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_failures 
    ON public.tool_usage_logs(account_id, tool_id, created_at DESC, error_code) 
    WHERE success = false;

-- ========= PART 5: CREATE AUTOMATED UPDATE TRIGGER =========

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_account_tool_access_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_update_account_tool_access_updated_at ON public.account_tool_access;
CREATE TRIGGER trigger_update_account_tool_access_updated_at
    BEFORE UPDATE ON public.account_tool_access
    FOR EACH ROW EXECUTE FUNCTION update_account_tool_access_updated_at();

-- ========= PART 6: CREATE STATUS MANAGEMENT FUNCTIONS =========

-- Function to automatically expire tool access
CREATE OR REPLACE FUNCTION expire_tool_access() RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired tool access records
    WITH expired_access AS (
        UPDATE public.account_tool_access 
        SET status = 'expired',
            updated_at = NOW(),
            updated_by = NULL  -- System action
        WHERE expires_at IS NOT NULL 
          AND expires_at <= NOW() 
          AND status = 'active'
        RETURNING id
    )
    SELECT COUNT(*) INTO expired_count FROM expired_access;
    
    -- Log expired access as activities
    INSERT INTO public.account_activities (
        actor_id,
        account_id,
        activity_type,
        target_type,
        target_id,
        description,
        metadata
    )
    SELECT 
        NULL, -- System action
        ata.account_id,
        'tool_access_modified',
        'tool',
        ata.tool_id,
        'Tool access expired: ' || t.name,
        jsonb_build_object(
            'action', 'auto_expire',
            'previous_status', 'active',
            'new_status', 'expired',
            'expires_at', ata.expires_at,
            'automated', true
        )
    FROM public.account_tool_access ata
    JOIN public.tools t ON ata.tool_id = t.id
    WHERE ata.status = 'expired' 
      AND ata.updated_at > NOW() - INTERVAL '1 minute'; -- Recently expired
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_tool_access() IS 'Automatically expires tool access and logs activity. Returns count of expired records.';

-- ========= PART 7: CREATE USAGE LOGGING FUNCTION =========

-- Function for logging tool usage events
CREATE OR REPLACE FUNCTION log_tool_usage(
    p_account_id UUID,
    p_tool_id UUID,
    p_action VARCHAR,
    p_feature_used VARCHAR DEFAULT NULL,
    p_duration_seconds INTEGER DEFAULT NULL,
    p_data_volume_mb DECIMAL DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_code VARCHAR DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    usage_log_id UUID;
    current_session_id TEXT;
    current_user_agent TEXT;
    current_ip_address INET;
BEGIN
    -- Safely extract request context
    BEGIN
        current_session_id := current_setting('app.current_session_id', true);
    EXCEPTION WHEN OTHERS THEN
        current_session_id := NULL;
    END;
    
    BEGIN
        current_user_agent := current_setting('request.headers', true)::json->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        current_user_agent := NULL;
    END;
    
    BEGIN
        current_ip_address := inet_client_addr();
    EXCEPTION WHEN OTHERS THEN
        current_ip_address := NULL;
    END;

    -- Insert usage log record
    INSERT INTO public.tool_usage_logs (
        account_id,
        tool_id,
        profile_id,
        session_id,
        action,
        feature_used,
        duration_seconds,
        data_volume_mb,
        success,
        error_code,
        error_message,
        metadata,
        ip_address,
        user_agent
    ) VALUES (
        p_account_id,
        p_tool_id,
        auth.uid(),
        current_session_id,
        p_action,
        p_feature_used,
        p_duration_seconds,
        p_data_volume_mb,
        p_success,
        p_error_code,
        p_error_message,
        p_metadata,
        current_ip_address,
        current_user_agent
    ) RETURNING id INTO usage_log_id;
    
    -- Update last_accessed_at in account_tool_access
    UPDATE public.account_tool_access 
    SET last_accessed_at = NOW()
    WHERE account_id = p_account_id AND tool_id = p_tool_id;
    
    RETURN usage_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_tool_usage IS 'Logs tool usage events with full context and updates last access timestamp';

-- ========= PART 8: ENABLE ROW LEVEL SECURITY =========

-- Enable RLS on tool_usage_logs table
ALTER TABLE public.tool_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own account's usage logs
CREATE POLICY "Users can view own account usage logs" ON public.tool_usage_logs
    FOR SELECT USING (
        account_id = get_user_account_id(auth.uid())
    );

-- Admins can view all usage logs
CREATE POLICY "Admins can view all usage logs" ON public.tool_usage_logs
    FOR ALL USING (
        user_is_admin(auth.uid()) OR user_has_admin_account(auth.uid())
    );

-- System can insert usage logs (for logging function)
CREATE POLICY "System can insert usage logs" ON public.tool_usage_logs
    FOR INSERT WITH CHECK (true);

-- ========= PART 9: CREATE HELPER VIEWS =========

-- View for active tool assignments with details
CREATE OR REPLACE VIEW active_tool_assignments AS
SELECT 
    ata.account_id,
    ata.tool_id,
    a.name as account_name,
    a.type as account_type,
    t.name as tool_name,
    t.slug as tool_slug,
    ata.access_level,
    ata.subscription_level,
    ata.status,
    ata.expires_at,
    ata.granted_at,
    ata.last_accessed_at,
    p_created.full_name as created_by_name,
    p_updated.full_name as updated_by_name,
    ata.notes,
    ata.features_enabled,
    ata.usage_limits,
    CASE 
        WHEN ata.expires_at IS NULL THEN false
        WHEN ata.expires_at <= NOW() THEN true
        ELSE false
    END as is_expired,
    CASE 
        WHEN ata.expires_at IS NULL THEN NULL
        WHEN ata.expires_at <= NOW() + INTERVAL '7 days' THEN true
        ELSE false
    END as expires_soon
FROM public.account_tool_access ata
JOIN public.accounts a ON ata.account_id = a.id
JOIN public.tools t ON ata.tool_id = t.id
LEFT JOIN public.profiles p_created ON ata.created_by = p_created.id
LEFT JOIN public.profiles p_updated ON ata.updated_by = p_updated.id
WHERE ata.status IN ('active', 'expired');

COMMENT ON VIEW active_tool_assignments IS 'Complete view of tool assignments with account, tool, and expiration details';

-- View for tool usage analytics summary
CREATE OR REPLACE VIEW tool_usage_summary AS
SELECT 
    tul.tool_id,
    t.name as tool_name,
    t.slug as tool_slug,
    COUNT(*) as total_usage_events,
    COUNT(DISTINCT tul.account_id) as unique_accounts,
    COUNT(DISTINCT tul.profile_id) as unique_users,
    COUNT(*) FILTER (WHERE tul.success = false) as failed_events,
    AVG(tul.duration_seconds) as avg_duration_seconds,
    SUM(tul.data_volume_mb) as total_data_volume_mb,
    MAX(tul.created_at) as last_usage,
    COUNT(*) FILTER (WHERE tul.created_at >= NOW() - INTERVAL '24 hours') as usage_last_24h,
    COUNT(*) FILTER (WHERE tul.created_at >= NOW() - INTERVAL '7 days') as usage_last_7d,
    COUNT(*) FILTER (WHERE tul.created_at >= NOW() - INTERVAL '30 days') as usage_last_30d
FROM public.tool_usage_logs tul
JOIN public.tools t ON tul.tool_id = t.id
WHERE tul.created_at >= NOW() - INTERVAL '90 days'
GROUP BY tul.tool_id, t.name, t.slug
ORDER BY total_usage_events DESC;

COMMENT ON VIEW tool_usage_summary IS 'Analytics summary of tool usage over the last 90 days';

-- ========= PART 10: GRANT PERMISSIONS =========

-- Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION log_tool_usage(UUID, UUID, VARCHAR, VARCHAR, INTEGER, DECIMAL, BOOLEAN, VARCHAR, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_tool_access() TO authenticated;

-- Grant usage on the new table
GRANT SELECT, INSERT ON public.tool_usage_logs TO authenticated;
GRANT SELECT, UPDATE ON public.account_tool_access TO authenticated;

-- Grant usage on sequences for ID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant view access
GRANT SELECT ON active_tool_assignments TO authenticated;
GRANT SELECT ON tool_usage_summary TO authenticated;

COMMIT;