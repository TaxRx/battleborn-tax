-- Epic 3 Sprint 3: Profile Activity Monitoring System
-- File: 20250724000007_epic3_profile_activity_monitoring.sql
-- Purpose: Enhanced activity monitoring and analytics for profile management
-- Story: 3.5 - Profile Activity Monitoring (5 points)

BEGIN;

-- ========= PART 1: ENHANCED ACTIVITY VIEWS =========

-- Create comprehensive activity monitoring view
CREATE OR REPLACE VIEW profile_activity_monitoring AS
SELECT 
    aa.id,
    aa.actor_id as profile_id,
    p.full_name as profile_name,
    p.email as profile_email,
    p.role as profile_role,
    aa.activity_type,
    aa.target_type,
    aa.target_id,
    aa.description,
    aa.metadata,
    aa.ip_address,
    aa.user_agent,
    aa.session_id,
    aa.created_at,
    -- Computed success field based on activity type and metadata
    CASE 
        WHEN aa.activity_type LIKE '%_failed' THEN false
        WHEN aa.metadata->>'success' = 'false' THEN false
        WHEN aa.metadata->>'error' IS NOT NULL THEN false
        ELSE true
    END as success,
    aa.metadata->>'error_details' as error_details,
    COALESCE((aa.metadata->>'duration_ms')::integer, NULL) as duration_ms,
    -- Computed fields
    CASE 
        WHEN aa.created_at >= NOW() - INTERVAL '1 hour' THEN 'recent'
        WHEN aa.created_at >= NOW() - INTERVAL '24 hours' THEN 'today'
        WHEN aa.created_at >= NOW() - INTERVAL '7 days' THEN 'this_week'
        WHEN aa.created_at >= NOW() - INTERVAL '30 days' THEN 'this_month'
        ELSE 'older'
    END as time_category,
    CASE 
        WHEN aa.activity_type IN ('login', 'logout', 'password_reset') THEN 'authentication'
        WHEN aa.activity_type IN ('profile_created', 'profile_updated', 'profile_deleted') THEN 'profile_management'
        WHEN aa.activity_type IN ('role_assigned', 'role_removed', 'permission_granted', 'permission_revoked') THEN 'access_control'
        WHEN aa.activity_type IN ('bulk_operation', 'profile_sync_failed', 'sync_conflict_resolved') THEN 'system_operations'
        ELSE 'other'
    END as activity_category,
    CASE 
        WHEN (CASE 
                WHEN aa.activity_type LIKE '%_failed' THEN false
                WHEN aa.metadata->>'success' = 'false' THEN false
                WHEN aa.metadata->>'error' IS NOT NULL THEN false
                ELSE true
              END) = true THEN 'success'
        WHEN (CASE 
                WHEN aa.activity_type LIKE '%_failed' THEN false
                WHEN aa.metadata->>'success' = 'false' THEN false
                WHEN aa.metadata->>'error' IS NOT NULL THEN false
                ELSE true
              END) = false AND aa.metadata->>'error_details' IS NOT NULL THEN 'error'
        WHEN (CASE 
                WHEN aa.activity_type LIKE '%_failed' THEN false
                WHEN aa.metadata->>'success' = 'false' THEN false
                WHEN aa.metadata->>'error' IS NOT NULL THEN false
                ELSE true
              END) = false THEN 'failed'
        ELSE 'unknown'
    END as result_status,
    -- Risk scoring
    CASE 
        WHEN aa.activity_type IN ('profile_deleted', 'role_assigned', 'permission_granted') AND 
             (CASE 
                WHEN aa.activity_type LIKE '%_failed' THEN false
                WHEN aa.metadata->>'success' = 'false' THEN false
                WHEN aa.metadata->>'error' IS NOT NULL THEN false
                ELSE true
              END) = true THEN 'high'
        WHEN aa.activity_type IN ('profile_updated', 'role_removed', 'bulk_operation') AND 
             (CASE 
                WHEN aa.activity_type LIKE '%_failed' THEN false
                WHEN aa.metadata->>'success' = 'false' THEN false
                WHEN aa.metadata->>'error' IS NOT NULL THEN false
                ELSE true
              END) = true THEN 'medium'
        WHEN (CASE 
                WHEN aa.activity_type LIKE '%_failed' THEN false
                WHEN aa.metadata->>'success' = 'false' THEN false
                WHEN aa.metadata->>'error' IS NOT NULL THEN false
                ELSE true
              END) = false THEN 'medium'
        ELSE 'low'
    END as risk_level
FROM public.account_activities aa
LEFT JOIN public.profiles p ON aa.actor_id = p.id
WHERE aa.target_type IN ('profile', 'role', 'permission', 'auth', 'bulk_operation')
   OR aa.activity_type IN ('profile_created', 'profile_updated', 'profile_deleted', 'role_assigned', 'role_removed', 'permission_granted', 'permission_revoked', 'bulk_operation', 'profile_synced', 'sync_conflict_resolved');

COMMENT ON VIEW profile_activity_monitoring IS 'Comprehensive activity monitoring view for profile management operations';

-- ========= PART 2: ACTIVITY ANALYTICS FUNCTIONS =========

-- Function to get activity summary by time period
CREATE OR REPLACE FUNCTION get_profile_activity_summary(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_profile_id UUID DEFAULT NULL
) RETURNS TABLE (
    total_activities INTEGER,
    successful_activities INTEGER,
    failed_activities INTEGER,
    success_rate NUMERIC,
    unique_profiles INTEGER,
    activity_types JSONB,
    activity_categories JSONB,
    risk_distribution JSONB,
    peak_activity_hour INTEGER,
    most_active_profile JSONB
) AS $$
DECLARE
    v_total_activities INTEGER;
    v_successful_activities INTEGER;
    v_failed_activities INTEGER;
    v_unique_profiles INTEGER;
    v_activity_types JSONB;
    v_activity_categories JSONB;
    v_risk_distribution JSONB;
    v_peak_hour INTEGER;
    v_most_active JSONB;
BEGIN
    -- Base activity counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE success = TRUE),
        COUNT(*) FILTER (WHERE success = FALSE),
        COUNT(DISTINCT profile_id)
    INTO v_total_activities, v_successful_activities, v_failed_activities, v_unique_profiles
    FROM profile_activity_monitoring pam
    WHERE pam.created_at BETWEEN p_start_date AND p_end_date
      AND (p_profile_id IS NULL OR pam.profile_id = p_profile_id);
    
    -- Activity type distribution
    SELECT jsonb_object_agg(activity_type, activity_count)
    INTO v_activity_types
    FROM (
        SELECT activity_type, COUNT(*) as activity_count
        FROM profile_activity_monitoring pam
        WHERE pam.created_at BETWEEN p_start_date AND p_end_date
          AND (p_profile_id IS NULL OR pam.profile_id = p_profile_id)
        GROUP BY activity_type
        ORDER BY activity_count DESC
        LIMIT 10
    ) activity_types;
    
    -- Activity category distribution
    SELECT jsonb_object_agg(activity_category, category_count)
    INTO v_activity_categories
    FROM (
        SELECT activity_category, COUNT(*) as category_count
        FROM profile_activity_monitoring pam
        WHERE pam.created_at BETWEEN p_start_date AND p_end_date
          AND (p_profile_id IS NULL OR pam.profile_id = p_profile_id)
        GROUP BY activity_category
    ) categories;
    
    -- Risk level distribution
    SELECT jsonb_object_agg(risk_level, risk_count)
    INTO v_risk_distribution
    FROM (
        SELECT risk_level, COUNT(*) as risk_count
        FROM profile_activity_monitoring pam
        WHERE pam.created_at BETWEEN p_start_date AND p_end_date
          AND (p_profile_id IS NULL OR pam.profile_id = p_profile_id)
        GROUP BY risk_level
    ) risks;
    
    -- Peak activity hour
    SELECT EXTRACT(HOUR FROM created_at)::INTEGER
    INTO v_peak_hour
    FROM profile_activity_monitoring pam
    WHERE pam.created_at BETWEEN p_start_date AND p_end_date
      AND (p_profile_id IS NULL OR pam.profile_id = p_profile_id)
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Most active profile (if not filtering by specific profile)
    IF p_profile_id IS NULL THEN
        SELECT jsonb_build_object(
            'profile_id', profile_id,
            'profile_name', profile_name,
            'profile_email', profile_email,
            'activity_count', activity_count
        )
        INTO v_most_active
        FROM (
            SELECT 
                profile_id, 
                profile_name, 
                profile_email, 
                COUNT(*) as activity_count
            FROM profile_activity_monitoring pam
            WHERE pam.created_at BETWEEN p_start_date AND p_end_date
              AND profile_id IS NOT NULL
            GROUP BY profile_id, profile_name, profile_email
            ORDER BY activity_count DESC
            LIMIT 1
        ) most_active;
    END IF;
    
    RETURN QUERY SELECT 
        v_total_activities as total_activities,
        v_successful_activities as successful_activities,
        v_failed_activities as failed_activities,
        CASE 
            WHEN v_total_activities > 0 THEN ROUND((v_successful_activities::NUMERIC / v_total_activities::NUMERIC) * 100, 2)
            ELSE 0
        END as success_rate,
        v_unique_profiles as unique_profiles,
        COALESCE(v_activity_types, '{}'::JSONB) as activity_types,
        COALESCE(v_activity_categories, '{}'::JSONB) as activity_categories,
        COALESCE(v_risk_distribution, '{}'::JSONB) as risk_distribution,
        v_peak_hour as peak_activity_hour,
        COALESCE(v_most_active, '{}'::JSONB) as most_active_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_profile_activity_summary IS 'Get comprehensive activity analytics for profile management operations';

-- Function to get activity timeline for a specific profile
CREATE OR REPLACE FUNCTION get_profile_activity_timeline(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    activity_type VARCHAR,
    activity_category VARCHAR,
    target_type VARCHAR,
    target_id UUID,
    description TEXT,
    result_status VARCHAR,
    risk_level VARCHAR,
    duration_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    time_ago TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pam.id,
        pam.activity_type,
        pam.activity_category,
        pam.target_type,
        pam.target_id,
        pam.description,
        pam.result_status,
        pam.risk_level,
        pam.duration_ms,
        pam.ip_address,
        pam.user_agent,
        pam.session_id,
        pam.metadata,
        pam.created_at,
        CASE 
            WHEN pam.created_at >= NOW() - INTERVAL '1 minute' THEN 'just now'
            WHEN pam.created_at >= NOW() - INTERVAL '1 hour' THEN EXTRACT(MINUTE FROM NOW() - pam.created_at)::TEXT || ' minutes ago'
            WHEN pam.created_at >= NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM NOW() - pam.created_at)::TEXT || ' hours ago'
            WHEN pam.created_at >= NOW() - INTERVAL '7 days' THEN EXTRACT(DAY FROM NOW() - pam.created_at)::TEXT || ' days ago'
            ELSE TO_CHAR(pam.created_at, 'YYYY-MM-DD')
        END as time_ago
    FROM profile_activity_monitoring pam
    WHERE pam.profile_id = p_profile_id
    ORDER BY pam.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_profile_activity_timeline IS 'Get paginated activity timeline for a specific profile';

-- Function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
    p_lookback_hours INTEGER DEFAULT 24,
    p_min_threshold INTEGER DEFAULT 10
) RETURNS TABLE (
    profile_id UUID,
    profile_name TEXT,
    profile_email TEXT,
    suspicious_pattern VARCHAR,
    activity_count INTEGER,
    risk_score INTEGER,
    details JSONB,
    detected_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- High-risk activities in short time
    RETURN QUERY
    SELECT 
        pam.profile_id,
        pam.profile_name,
        pam.profile_email,
        'high_risk_burst'::VARCHAR as suspicious_pattern,
        COUNT(*)::INTEGER as activity_count,
        80 as risk_score,
        jsonb_build_object(
            'time_window_hours', p_lookback_hours,
            'high_risk_activities', array_agg(DISTINCT pam.activity_type),
            'first_activity', MIN(pam.created_at),
            'last_activity', MAX(pam.created_at)
        ) as details,
        NOW() as detected_at
    FROM profile_activity_monitoring pam
    WHERE pam.created_at >= NOW() - (p_lookback_hours || ' hours')::INTERVAL
      AND pam.risk_level = 'high'
      AND pam.profile_id IS NOT NULL
    GROUP BY pam.profile_id, pam.profile_name, pam.profile_email
    HAVING COUNT(*) >= 3;
    
    -- Multiple failed activities
    RETURN QUERY
    SELECT 
        pam.profile_id,
        pam.profile_name,
        pam.profile_email,
        'multiple_failures'::VARCHAR as suspicious_pattern,
        COUNT(*)::INTEGER as activity_count,
        60 as risk_score,
        jsonb_build_object(
            'time_window_hours', p_lookback_hours,
            'failed_activities', array_agg(DISTINCT pam.activity_type),
            'error_patterns', array_agg(DISTINCT pam.error_details) FILTER (WHERE pam.error_details IS NOT NULL)
        ) as details,
        NOW() as detected_at
    FROM profile_activity_monitoring pam
    WHERE pam.created_at >= NOW() - (p_lookback_hours || ' hours')::INTERVAL
      AND pam.result_status IN ('error', 'failed')
      AND pam.profile_id IS NOT NULL
    GROUP BY pam.profile_id, pam.profile_name, pam.profile_email
    HAVING COUNT(*) >= 5;
    
    -- Unusual activity volume
    RETURN QUERY
    SELECT 
        pam.profile_id,
        pam.profile_name,
        pam.profile_email,
        'unusual_volume'::VARCHAR as suspicious_pattern,
        COUNT(*)::INTEGER as activity_count,
        40 as risk_score,
        jsonb_build_object(
            'time_window_hours', p_lookback_hours,
            'total_activities', COUNT(*),
            'activity_types', array_agg(DISTINCT pam.activity_type),
            'peak_hour', EXTRACT(HOUR FROM MAX(pam.created_at))
        ) as details,
        NOW() as detected_at
    FROM profile_activity_monitoring pam
    WHERE pam.created_at >= NOW() - (p_lookback_hours || ' hours')::INTERVAL
      AND pam.profile_id IS NOT NULL
    GROUP BY pam.profile_id, pam.profile_name, pam.profile_email
    HAVING COUNT(*) >= p_min_threshold * 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_suspicious_activity IS 'Detect suspicious activity patterns in profile management';

-- ========= PART 3: ACTIVITY ALERTING FUNCTIONS =========

-- Function to create activity alerts
CREATE OR REPLACE FUNCTION create_activity_alert(
    p_profile_id UUID,
    p_alert_type VARCHAR,
    p_severity VARCHAR,
    p_title TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    INSERT INTO public.account_activities (
        profile_id,
        activity_type,
        target_type,
        target_id,
        description,
        success,
        metadata
    ) VALUES (
        p_profile_id,
        'security_alert',
        'alert',
        gen_random_uuid(),
        p_title || ': ' || p_description,
        true,
        jsonb_build_object(
            'alert_type', p_alert_type,
            'severity', p_severity,
            'title', p_title,
            'description', p_description,
            'additional_data', p_metadata
        )
    ) RETURNING target_id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_activity_alert IS 'Create activity-based security alerts';

-- Function to get activity trends
CREATE OR REPLACE FUNCTION get_activity_trends(
    p_days INTEGER DEFAULT 7,
    p_granularity VARCHAR DEFAULT 'daily'
) RETURNS TABLE (
    time_bucket TIMESTAMP WITH TIME ZONE,
    total_activities INTEGER,
    successful_activities INTEGER,
    failed_activities INTEGER,
    unique_profiles INTEGER,
    high_risk_activities INTEGER
) AS $$
DECLARE
    v_interval TEXT;
    v_trunc_format TEXT;
BEGIN
    -- Set time bucket format based on granularity
    CASE p_granularity
        WHEN 'hourly' THEN 
            v_interval := '1 hour';
            v_trunc_format := 'hour';
        WHEN 'daily' THEN 
            v_interval := '1 day';
            v_trunc_format := 'day';
        WHEN 'weekly' THEN 
            v_interval := '1 week';
            v_trunc_format := 'week';
        ELSE 
            v_interval := '1 day';
            v_trunc_format := 'day';
    END CASE;
    
    RETURN QUERY
    SELECT 
        DATE_TRUNC(v_trunc_format, pam.created_at) as time_bucket,
        COUNT(*)::INTEGER as total_activities,
        COUNT(*) FILTER (WHERE pam.result_status = 'success')::INTEGER as successful_activities,
        COUNT(*) FILTER (WHERE pam.result_status IN ('error', 'failed'))::INTEGER as failed_activities,
        COUNT(DISTINCT pam.profile_id)::INTEGER as unique_profiles,
        COUNT(*) FILTER (WHERE pam.risk_level = 'high')::INTEGER as high_risk_activities
    FROM profile_activity_monitoring pam
    WHERE pam.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE_TRUNC(v_trunc_format, pam.created_at)
    ORDER BY time_bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_activity_trends IS 'Get activity trends over time with configurable granularity';

-- ========= PART 4: ENABLE ROW LEVEL SECURITY =========

-- Note: account_activities table already has RLS enabled from previous migrations

-- ========= PART 5: GRANT PERMISSIONS =========

-- Grant execute permissions for activity monitoring functions
GRANT EXECUTE ON FUNCTION get_profile_activity_summary(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_activity_timeline(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_activity(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_activity_alert(UUID, VARCHAR, VARCHAR, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_trends(INTEGER, VARCHAR) TO authenticated;

-- Grant view permissions
GRANT SELECT ON profile_activity_monitoring TO authenticated;

COMMIT;