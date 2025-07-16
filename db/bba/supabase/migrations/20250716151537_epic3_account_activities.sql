-- Epic 3: Account Activities Table and Infrastructure
-- File: 20250716151537_epic3_account_activities.sql
-- Purpose: Create comprehensive account activity logging system for admin platform management
-- Story: 1.1 - Database Foundation and Schema Setup

BEGIN;

-- ========= PART 1: CREATE ACCOUNT ACTIVITIES TABLE =========

-- Create account_activities table for comprehensive audit logging
CREATE TABLE IF NOT EXISTS public.account_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL CHECK (activity_type IN (
        'account_created', 'account_updated', 'account_deleted',
        'profile_added', 'profile_removed', 'profile_updated',
        'status_changed', 'type_changed', 'access_granted', 'access_revoked',
        'tool_assigned', 'tool_removed', 'tool_access_modified',
        'billing_updated', 'subscription_changed', 'payment_processed',
        'login_success', 'login_failed', 'password_changed',
        'data_export', 'bulk_operation', 'admin_action'
    )),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN (
        'account', 'profile', 'tool', 'subscription', 'payment', 
        'commission', 'client', 'expert', 'affiliate', 'system'
    )),
    target_id UUID NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}' NOT NULL,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.account_activities IS 'Comprehensive audit log for all account-related activities in the admin platform';
COMMENT ON COLUMN public.account_activities.actor_id IS 'User who performed the action (null for system actions)';
COMMENT ON COLUMN public.account_activities.account_id IS 'Account that was affected by the activity';
COMMENT ON COLUMN public.account_activities.activity_type IS 'Type of activity performed';
COMMENT ON COLUMN public.account_activities.target_type IS 'Type of entity that was targeted';
COMMENT ON COLUMN public.account_activities.target_id IS 'ID of the specific entity that was targeted';
COMMENT ON COLUMN public.account_activities.metadata IS 'Additional context data (old/new values, etc.)';

-- ========= PART 2: CREATE PERFORMANCE INDEXES =========

-- Primary indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_account_activities_account_id 
    ON public.account_activities(account_id);

CREATE INDEX IF NOT EXISTS idx_account_activities_actor_id 
    ON public.account_activities(actor_id);

CREATE INDEX IF NOT EXISTS idx_account_activities_created_at 
    ON public.account_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_activities_type 
    ON public.account_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_account_activities_target 
    ON public.account_activities(target_type, target_id);

-- Composite indexes for common admin queries
CREATE INDEX IF NOT EXISTS idx_account_activities_account_date 
    ON public.account_activities(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_activities_actor_date 
    ON public.account_activities(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_activities_type_date 
    ON public.account_activities(activity_type, created_at DESC);

-- Index for filtering by date ranges (common admin requirement)
CREATE INDEX IF NOT EXISTS idx_account_activities_date_range 
    ON public.account_activities(created_at DESC, account_id, activity_type);

-- Composite index for date range queries (removed partial index due to immutability requirements)
CREATE INDEX IF NOT EXISTS idx_account_activities_recent 
    ON public.account_activities(account_id, activity_type, created_at DESC);

-- ========= PART 3: CREATE ACTIVITY LOGGING FUNCTION =========

-- Function for manual activity logging with enhanced metadata capture
CREATE OR REPLACE FUNCTION log_account_activity(
    p_account_id UUID,
    p_activity_type VARCHAR,
    p_target_type VARCHAR,
    p_target_id UUID,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
    current_user_agent TEXT;
    current_ip_address INET;
    current_session_id TEXT;
BEGIN
    -- Safely extract request context
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
    
    BEGIN
        current_session_id := current_setting('app.current_session_id', true);
    EXCEPTION WHEN OTHERS THEN
        current_session_id := NULL;
    END;

    -- Insert activity record
    INSERT INTO public.account_activities (
        actor_id,
        account_id,
        activity_type,
        target_type,
        target_id,
        description,
        metadata,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        auth.uid(),
        p_account_id,
        p_activity_type,
        p_target_type,
        p_target_id,
        p_description,
        p_metadata,
        current_ip_address,
        current_user_agent,
        current_session_id
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_account_activity IS 'Logs account activity with full context including IP, user agent, and session info';

-- ========= PART 4: CREATE AUTOMATIC TRIGGER FUNCTIONS =========

-- Trigger function for automatic account change logging
CREATE OR REPLACE FUNCTION auto_log_account_changes() RETURNS TRIGGER AS $$
DECLARE
    changed_fields JSONB;
    activity_description TEXT;
BEGIN
    -- Log account updates
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'accounts' THEN
        -- Calculate changed fields
        SELECT json_object_agg(key, json_build_object('old', old_val, 'new', new_val))::jsonb
        INTO changed_fields
        FROM (
            SELECT key, 
                   to_jsonb(OLD) ->> key as old_val,
                   to_jsonb(NEW) ->> key as new_val
            FROM jsonb_each(to_jsonb(NEW))
            WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
        ) changes;
        
        -- Create meaningful description
        activity_description := 'Account information updated: ' || NEW.name;
        IF changed_fields ? 'type' THEN
            activity_description := activity_description || ' (type changed)';
        END IF;
        IF changed_fields ? 'name' THEN
            activity_description := activity_description || ' (name changed)';
        END IF;
        
        PERFORM log_account_activity(
            NEW.id,
            'account_updated',
            'account',
            NEW.id,
            activity_description,
            jsonb_build_object(
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW),
                'changed_fields', changed_fields
            )
        );
    END IF;
    
    -- Log account creation
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'accounts' THEN
        PERFORM log_account_activity(
            NEW.id,
            'account_created',
            'account',
            NEW.id,
            'New account created: ' || NEW.name || ' (type: ' || NEW.type || ')',
            jsonb_build_object(
                'account_data', to_jsonb(NEW),
                'created_by_system', auth.uid() IS NULL
            )
        );
    END IF;
    
    -- Log account deletion
    IF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'accounts' THEN
        PERFORM log_account_activity(
            OLD.id,
            'account_deleted',
            'account',
            OLD.id,
            'Account deleted: ' || OLD.name,
            jsonb_build_object(
                'deleted_account_data', to_jsonb(OLD),
                'deletion_timestamp', NOW()
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for profile changes (additions, removals, updates)
CREATE OR REPLACE FUNCTION auto_log_profile_changes() RETURNS TRIGGER AS $$
DECLARE
    target_account_id UUID;
    changed_fields JSONB;
    activity_description TEXT;
BEGIN
    -- Get the account_id for the profile
    IF TG_OP = 'DELETE' THEN
        target_account_id := OLD.account_id;
    ELSE
        target_account_id := NEW.account_id;
    END IF;
    
    -- Skip if no account association
    IF target_account_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Log profile updates
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'profiles' THEN
        -- Calculate changed fields
        SELECT json_object_agg(key, json_build_object('old', old_val, 'new', new_val))
        INTO changed_fields
        FROM (
            SELECT key, 
                   to_jsonb(OLD) ->> key as old_val,
                   to_jsonb(NEW) ->> key as new_val
            FROM jsonb_each(to_jsonb(NEW))
            WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
        ) changes;
        
        activity_description := 'Profile updated: ' || COALESCE(NEW.full_name, NEW.email);
        
        PERFORM log_account_activity(
            target_account_id,
            'profile_updated',
            'profile',
            NEW.id,
            activity_description,
            json_build_object(
                'profile_id', NEW.id,
                'changed_fields', changed_fields
            )
        );
    END IF;
    
    -- Log profile creation/addition
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'profiles' THEN
        PERFORM log_account_activity(
            target_account_id,
            'profile_added',
            'profile',
            NEW.id,
            'New profile added: ' || COALESCE(NEW.full_name, NEW.email),
            json_build_object(
                'profile_id', NEW.id,
                'profile_email', NEW.email,
                'profile_role', NEW.role
            )
        );
    END IF;
    
    -- Log profile removal
    IF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'profiles' THEN
        PERFORM log_account_activity(
            target_account_id,
            'profile_removed',
            'profile',
            OLD.id,
            'Profile removed: ' || COALESCE(OLD.full_name, OLD.email),
            json_build_object(
                'profile_id', OLD.id,
                'profile_email', OLD.email,
                'removal_timestamp', NOW()
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========= PART 5: CREATE TRIGGERS =========

-- Create triggers for automatic logging
DROP TRIGGER IF EXISTS trigger_auto_log_account_changes ON public.accounts;
CREATE TRIGGER trigger_auto_log_account_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION auto_log_account_changes();

DROP TRIGGER IF EXISTS trigger_auto_log_profile_changes ON public.profiles;
CREATE TRIGGER trigger_auto_log_profile_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION auto_log_profile_changes();

-- ========= PART 6: ENABLE ROW LEVEL SECURITY =========

ALTER TABLE public.account_activities ENABLE ROW LEVEL SECURITY;

-- Admin users can view all activities
CREATE POLICY "Admins can view all account activities" ON public.account_activities
    FOR SELECT USING (
        user_is_admin(auth.uid()) OR user_has_admin_account(auth.uid())
    );

-- Admin users can insert activities (for manual logging)
CREATE POLICY "Admins can log activities" ON public.account_activities
    FOR INSERT WITH CHECK (
        user_is_admin(auth.uid()) OR user_has_admin_account(auth.uid())
    );

-- System can insert activities (for automatic logging via triggers)
CREATE POLICY "System can log activities" ON public.account_activities
    FOR INSERT WITH CHECK (true);

-- Users can view activities for their own account
CREATE POLICY "Users can view own account activities" ON public.account_activities
    FOR SELECT USING (
        account_id = get_user_account_id(auth.uid())
    );

-- ========= PART 7: GRANT NECESSARY PERMISSIONS =========

-- Grant execute permissions for the logging function
GRANT EXECUTE ON FUNCTION log_account_activity(UUID, VARCHAR, VARCHAR, UUID, TEXT, JSONB) TO authenticated;

-- Grant usage on the table
GRANT SELECT, INSERT ON public.account_activities TO authenticated;

-- Grant sequence usage for ID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========= PART 8: CREATE HELPER VIEWS FOR ADMIN QUERIES =========

-- Create view for recent account activities (last 7 days)
CREATE OR REPLACE VIEW recent_account_activities AS
SELECT 
    aa.id,
    aa.activity_type,
    aa.description,
    aa.created_at,
    a.name as account_name,
    a.type as account_type,
    p.full_name as actor_name,
    p.email as actor_email,
    aa.metadata
FROM public.account_activities aa
JOIN public.accounts a ON aa.account_id = a.id
LEFT JOIN public.profiles p ON aa.actor_id = p.id
WHERE aa.created_at >= (NOW() - INTERVAL '7 days')
ORDER BY aa.created_at DESC;

COMMENT ON VIEW recent_account_activities IS 'View showing recent account activities with account and actor details';

-- Create view for activity summary by type
CREATE OR REPLACE VIEW activity_summary_by_type AS
SELECT 
    activity_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT account_id) as affected_accounts,
    MAX(created_at) as last_occurrence,
    MIN(created_at) as first_occurrence
FROM public.account_activities
WHERE created_at >= (NOW() - INTERVAL '30 days')
GROUP BY activity_type
ORDER BY total_count DESC;

COMMENT ON VIEW activity_summary_by_type IS 'Summary of activities by type for the last 30 days';

COMMIT;