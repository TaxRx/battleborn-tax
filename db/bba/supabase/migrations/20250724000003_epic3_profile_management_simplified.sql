-- Epic 3 Sprint 3 Day 1: Profile Management Foundation (Simplified)
-- File: 20250724000003_epic3_profile_management_simplified.sql
-- Purpose: Extend profiles table for admin management using existing account_activities
-- Story: 3.1 - Profile CRUD Operations (Simplified Architecture)

BEGIN;

-- ========= PART 1: EXTEND PROFILES TABLE FOR ADMIN MANAGEMENT =========

-- Add admin management columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active',
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS auth_sync_status VARCHAR DEFAULT 'synced',
ADD COLUMN IF NOT EXISTS auth_sync_last_attempted TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraints for profile status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_profile_status' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT check_profile_status 
    CHECK (status IN ('active', 'inactive', 'suspended', 'pending', 'locked'));
  END IF;
END $$;

-- Add constraints for auth sync status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_auth_sync_status' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT check_auth_sync_status 
    CHECK (auth_sync_status IN ('synced', 'pending', 'conflict', 'error', 'requires_attention'));
  END IF;
END $$;

-- Add constraints for failed login attempts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_failed_login_attempts' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT check_failed_login_attempts 
    CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 10);
  END IF;
END $$;

-- Create performance indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_sync ON public.profiles(auth_sync_status);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- Composite indexes for common admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_status_last_login 
    ON public.profiles(status, last_login_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_account_status 
    ON public.profiles(account_id, status);

CREATE INDEX IF NOT EXISTS idx_profiles_sync_status_date 
    ON public.profiles(auth_sync_status, auth_sync_last_attempted DESC);

-- ========= PART 2: CREATE PROFILE SYNC CONFLICTS TABLE =========

-- Create table to track auth.users synchronization conflicts (essential for auth sync)
CREATE TABLE IF NOT EXISTS public.profile_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    auth_user_id UUID,
    conflict_type VARCHAR(50) NOT NULL,
    profile_data JSONB NOT NULL,
    auth_data JSONB NOT NULL,
    resolution_strategy VARCHAR(50),
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.profile_sync_conflicts IS 'Tracks conflicts between profiles and auth.users for resolution';

-- Add constraints for sync conflicts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_conflict_type' 
    AND conrelid = 'public.profile_sync_conflicts'::regclass
  ) THEN
    ALTER TABLE public.profile_sync_conflicts
    ADD CONSTRAINT check_conflict_type 
    CHECK (conflict_type IN (
        'email_mismatch', 'profile_missing', 'auth_missing', 'data_inconsistency',
        'role_mismatch', 'status_mismatch', 'metadata_conflict'
    ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_resolution_strategy' 
    AND conrelid = 'public.profile_sync_conflicts'::regclass
  ) THEN
    ALTER TABLE public.profile_sync_conflicts
    ADD CONSTRAINT check_resolution_strategy 
    CHECK (resolution_strategy IN (
        'profile_wins', 'auth_wins', 'merge', 'manual', 'ignore'
    ));
  END IF;
END $$;

-- Indexes for sync conflicts
CREATE INDEX IF NOT EXISTS idx_profile_sync_conflicts_profile ON public.profile_sync_conflicts(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_sync_conflicts_auth_user ON public.profile_sync_conflicts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_sync_conflicts_type ON public.profile_sync_conflicts(conflict_type);
CREATE INDEX IF NOT EXISTS idx_profile_sync_conflicts_resolved ON public.profile_sync_conflicts(resolved_at);
CREATE INDEX IF NOT EXISTS idx_profile_sync_conflicts_created_at ON public.profile_sync_conflicts(created_at DESC);

-- ========= PART 3: EXTEND ACCOUNT_ACTIVITIES FOR PROFILE LOGGING =========

-- Add profile-related activity types to existing account_activities check constraint
-- First, drop the existing constraint to modify it
ALTER TABLE public.account_activities DROP CONSTRAINT IF EXISTS check_activity_type;

-- Re-create the constraint with profile activity types included
ALTER TABLE public.account_activities 
ADD CONSTRAINT check_activity_type 
CHECK (activity_type IN (
    -- Existing account activity types
    'account_created', 'account_updated', 'account_deleted', 'account_suspended',
    'account_activated', 'admin_action', 'system_action', 'data_export', 'data_import',
    -- New profile activity types
    'profile_created', 'profile_updated', 'profile_deleted', 'profile_suspended',
    'profile_activated', 'profile_locked', 'profile_unlocked', 'profile_verified',
    'login_success', 'login_failed', 'logout', 'password_changed', 'password_reset',
    'two_factor_enabled', 'two_factor_disabled', 'role_assigned', 'role_removed',
    'permission_granted', 'permission_revoked', 'profile_synced', 'profile_sync_failed'
));

-- Update target_type constraint to include profile targets
ALTER TABLE public.account_activities DROP CONSTRAINT IF EXISTS check_target_type;
ALTER TABLE public.account_activities 
ADD CONSTRAINT check_target_type 
CHECK (target_type IN ('account', 'tool', 'profile', 'invoice', 'user', 'role', 'permission', 'system', 'auth'));

-- ========= PART 4: CREATE PROFILE MANAGEMENT FUNCTIONS =========

-- Function to log profile activities using existing account_activities table
CREATE OR REPLACE FUNCTION log_profile_activity(
    p_profile_id UUID,
    p_activity_type VARCHAR,
    p_target_type VARCHAR,
    p_target_id UUID,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
    profile_account_id UUID;
BEGIN
    -- Get the account_id for the profile
    SELECT account_id INTO profile_account_id 
    FROM public.profiles 
    WHERE id = p_profile_id;
    
    -- Use existing log_account_activity function but for profile context
    SELECT log_account_activity(
        profile_account_id,  -- account_id (required by existing function)
        p_activity_type,     -- activity_type
        p_target_type,       -- target_type  
        p_target_id,         -- target_id
        p_description,       -- description
        p_metadata || jsonb_build_object(
            'profile_id', p_profile_id,
            'activity_context', 'profile_management'
        )                    -- enhanced metadata with profile context
    ) INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_profile_activity IS 'Logs profile activity using existing account_activities table with profile context';

-- Function to get profile summary with computed fields
CREATE OR REPLACE FUNCTION get_profile_summary(p_profile_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    role user_role,
    status VARCHAR,
    account_name TEXT,
    account_type account_type,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER,
    is_verified BOOLEAN,
    auth_sync_status VARCHAR,
    days_since_last_login INTEGER,
    total_activities INTEGER,
    unresolved_sync_conflicts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.role,
        p.status,
        a.name as account_name,
        a.type as account_type,
        p.last_login_at,
        p.login_count,
        p.is_verified,
        p.auth_sync_status,
        CASE 
            WHEN p.last_login_at IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM NOW() - p.last_login_at)::INTEGER
        END as days_since_last_login,
        (SELECT COUNT(*) FROM public.account_activities aa 
         WHERE aa.metadata->>'profile_id' = p.id::text)::INTEGER as total_activities,
        (SELECT COUNT(*) FROM public.profile_sync_conflicts psc 
         WHERE psc.profile_id = p.id AND psc.resolved_at IS NULL)::INTEGER as unresolved_sync_conflicts
    FROM public.profiles p
    LEFT JOIN public.accounts a ON p.account_id = a.id
    WHERE p.id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_profile_summary IS 'Returns comprehensive profile summary with computed fields';

-- ========= PART 5: CREATE TRIGGER FUNCTIONS FOR AUTOMATIC LOGGING =========

-- Trigger function for automatic profile change logging using existing account_activities
CREATE OR REPLACE FUNCTION auto_log_profile_changes() RETURNS TRIGGER AS $$
DECLARE
    changed_fields JSONB;
    activity_description TEXT;
    target_profile_id UUID;
BEGIN
    -- Determine the profile ID for logging
    IF TG_OP = 'DELETE' THEN
        target_profile_id := OLD.id;
    ELSE
        target_profile_id := NEW.id;
    END IF;
    
    -- Log profile updates
    IF TG_OP = 'UPDATE' THEN
        -- Calculate changed fields
        SELECT json_object_agg(key, json_build_object('old', old_val, 'new', new_val))::jsonb
        INTO changed_fields
        FROM (
            SELECT key, 
                   to_jsonb(OLD) ->> key as old_val,
                   to_jsonb(NEW) ->> key as new_val
            FROM jsonb_each(to_jsonb(NEW))
            WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
            AND key NOT IN ('updated_at') -- Exclude automatic timestamp
        ) changes;
        
        activity_description := 'Profile updated: ' || COALESCE(NEW.full_name, NEW.email);
        IF changed_fields ? 'status' THEN
            activity_description := activity_description || ' (status changed)';
        END IF;
        IF changed_fields ? 'role' THEN
            activity_description := activity_description || ' (role changed)';
        END IF;
        
        PERFORM log_profile_activity(
            target_profile_id,
            'profile_updated',
            'profile',
            target_profile_id,
            activity_description,
            jsonb_build_object(
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW),
                'changed_fields', changed_fields,
                'trigger_source', 'auto_log_profile_changes'
            )
        );
    END IF;
    
    -- Log profile creation
    IF TG_OP = 'INSERT' THEN
        PERFORM log_profile_activity(
            target_profile_id,
            'profile_created',
            'profile',
            target_profile_id,
            'New profile created: ' || COALESCE(NEW.full_name, NEW.email) || ' (role: ' || NEW.role || ')',
            jsonb_build_object(
                'profile_data', to_jsonb(NEW),
                'created_by_system', auth.uid() IS NULL,
                'trigger_source', 'auto_log_profile_changes'
            )
        );
    END IF;
    
    -- Log profile deletion
    IF TG_OP = 'DELETE' THEN
        PERFORM log_profile_activity(
            target_profile_id,
            'profile_deleted',
            'profile',
            target_profile_id,
            'Profile deleted: ' || COALESCE(OLD.full_name, OLD.email),
            jsonb_build_object(
                'deleted_profile_data', to_jsonb(OLD),
                'deletion_timestamp', NOW(),
                'trigger_source', 'auto_log_profile_changes'
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update profile updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========= PART 6: CREATE TRIGGERS =========

-- Create triggers for automatic logging and timestamp updates
DROP TRIGGER IF EXISTS trigger_auto_log_profile_changes ON public.profiles;
CREATE TRIGGER trigger_auto_log_profile_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION auto_log_profile_changes();

DROP TRIGGER IF EXISTS trigger_update_profile_updated_at ON public.profiles;
CREATE TRIGGER trigger_update_profile_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_updated_at();

-- ========= PART 7: ENABLE ROW LEVEL SECURITY =========

ALTER TABLE public.profile_sync_conflicts ENABLE ROW LEVEL SECURITY;

-- ========= PART 8: CREATE RLS POLICIES =========

-- Profile sync conflicts policies (only table we're adding)
CREATE POLICY "Admins can manage sync conflicts" ON public.profile_sync_conflicts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- ========= PART 9: CREATE HELPER VIEWS =========

-- View for profile management summary using existing tables
CREATE OR REPLACE VIEW profile_management_summary AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.status,
    p.account_id,
    a.name as account_name,
    a.type as account_type,
    p.last_login_at,
    p.login_count,
    p.is_verified,
    p.auth_sync_status,
    p.phone,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    CASE 
        WHEN p.last_login_at IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM NOW() - p.last_login_at)::INTEGER
    END as days_since_last_login,
    -- Count activities from existing account_activities table where profile_id is in metadata
    (SELECT COUNT(*) FROM public.account_activities aa 
     WHERE aa.metadata->>'profile_id' = p.id::text)::INTEGER as total_activities,
    -- Count unresolved sync conflicts
    (SELECT COUNT(*) FROM public.profile_sync_conflicts psc 
     WHERE psc.profile_id = p.id AND psc.resolved_at IS NULL)::INTEGER as unresolved_conflicts
FROM public.profiles p
LEFT JOIN public.accounts a ON p.account_id = a.id;

COMMENT ON VIEW profile_management_summary IS 'Comprehensive view for profile management using existing account_activities table';

-- ========= PART 10: GRANT PERMISSIONS =========

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION log_profile_activity(UUID, VARCHAR, VARCHAR, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_summary(UUID) TO authenticated;

-- Grant usage on new table and view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_sync_conflicts TO authenticated;
GRANT SELECT ON profile_management_summary TO authenticated;

-- Grant sequence usage for ID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;