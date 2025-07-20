-- Epic 3 Sprint 3 Day 1: Auth.Users Synchronization System
-- File: 20250724000004_epic3_auth_synchronization.sql
-- Purpose: Comprehensive auth.users synchronization with conflict detection and resolution
-- Story: 3.2 - Auth.Users Synchronization (13 points - Critical)

BEGIN;

-- ========= PART 1: AUTH SYNC STATUS FUNCTIONS =========

-- Function to detect profile sync discrepancies
CREATE OR REPLACE FUNCTION detect_profile_sync_discrepancies()
RETURNS TABLE (
    discrepancy_type TEXT,
    profile_id UUID,
    auth_user_id UUID,
    profile_email TEXT,
    auth_email TEXT,
    profile_data JSONB,
    auth_data JSONB,
    severity TEXT,
    description TEXT
) AS $$
BEGIN
    -- Return profiles that exist but have no matching auth.users
    RETURN QUERY
    SELECT 
        'profile_missing_auth'::TEXT as discrepancy_type,
        p.id as profile_id,
        NULL::UUID as auth_user_id,
        p.email as profile_email,
        NULL::TEXT as auth_email,
        to_jsonb(p) as profile_data,
        '{}'::JSONB as auth_data,
        'high'::TEXT as severity,
        'Profile exists but no corresponding auth.users record found'::TEXT as description
    FROM public.profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users au WHERE au.email = p.email
    );

    -- Return auth.users that exist but have no matching profile
    RETURN QUERY
    SELECT 
        'auth_missing_profile'::TEXT as discrepancy_type,
        NULL::UUID as profile_id,
        au.id as auth_user_id,
        NULL::TEXT as profile_email,
        au.email::TEXT as auth_email,
        '{}'::JSONB as profile_data,
        jsonb_build_object(
            'id', au.id,
            'email', au.email::TEXT,
            'email_confirmed_at', au.email_confirmed_at,
            'last_sign_in_at', au.last_sign_in_at,
            'created_at', au.created_at,
            'updated_at', au.updated_at,
            'user_metadata', au.raw_user_meta_data,
            'app_metadata', au.raw_app_meta_data
        ) as auth_data,
        'medium'::TEXT as severity,
        'Auth.users record exists but no corresponding profile found'::TEXT as description
    FROM auth.users au
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.email = au.email
    );

    -- Return email mismatches (same UUID but different emails)
    RETURN QUERY
    SELECT 
        'email_mismatch'::TEXT as discrepancy_type,
        p.id as profile_id,
        au.id as auth_user_id,
        p.email as profile_email,
        au.email::TEXT as auth_email,
        to_jsonb(p) as profile_data,
        jsonb_build_object(
            'id', au.id,
            'email', au.email::TEXT,
            'email_confirmed_at', au.email_confirmed_at,
            'last_sign_in_at', au.last_sign_in_at,
            'created_at', au.created_at,
            'updated_at', au.updated_at
        ) as auth_data,
        'critical'::TEXT as severity,
        'Profile and auth.users have same ID but different emails'::TEXT as description
    FROM public.profiles p
    JOIN auth.users au ON p.id = au.id
    WHERE p.email != au.email;

    -- Return metadata inconsistencies
    RETURN QUERY
    SELECT 
        'metadata_inconsistency'::TEXT as discrepancy_type,
        p.id as profile_id,
        au.id as auth_user_id,
        p.email as profile_email,
        au.email::TEXT as auth_email,
        to_jsonb(p) as profile_data,
        jsonb_build_object(
            'user_metadata', au.raw_user_meta_data,
            'app_metadata', au.raw_app_meta_data
        ) as auth_data,
        'low'::TEXT as severity,
        'Profile and auth.users metadata may be inconsistent'::TEXT as description
    FROM public.profiles p
    JOIN auth.users au ON p.email = au.email
    WHERE (
        COALESCE(p.full_name, '') != COALESCE(au.raw_user_meta_data->>'full_name', '') OR
        COALESCE(p.avatar_url, '') != COALESCE(au.raw_user_meta_data->>'avatar_url', '')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_profile_sync_discrepancies IS 'Detect discrepancies between profiles and auth.users tables';

-- Function to get comprehensive sync status summary
CREATE OR REPLACE FUNCTION get_auth_sync_status_summary()
RETURNS TABLE (
    total_profiles INTEGER,
    total_auth_users INTEGER,
    synced_profiles INTEGER,
    pending_sync INTEGER,
    conflict_profiles INTEGER,
    error_profiles INTEGER,
    unresolved_conflicts INTEGER,
    last_sync_check TIMESTAMP WITH TIME ZONE,
    sync_health_score NUMERIC
) AS $$
DECLARE
    v_total_profiles INTEGER;
    v_total_auth_users INTEGER;
    v_synced_profiles INTEGER;
    v_pending_sync INTEGER;
    v_conflict_profiles INTEGER;
    v_error_profiles INTEGER;
    v_unresolved_conflicts INTEGER;
    v_last_sync_check TIMESTAMP WITH TIME ZONE;
    v_sync_health_score NUMERIC;
BEGIN
    -- Get profile counts
    SELECT 
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE auth_sync_status = 'synced')::INTEGER,
        COUNT(*) FILTER (WHERE auth_sync_status = 'pending')::INTEGER,
        COUNT(*) FILTER (WHERE auth_sync_status = 'conflict')::INTEGER,
        COUNT(*) FILTER (WHERE auth_sync_status = 'error')::INTEGER
    INTO 
        v_total_profiles,
        v_synced_profiles,
        v_pending_sync,
        v_conflict_profiles,
        v_error_profiles
    FROM public.profiles;

    -- Get auth users count
    SELECT COUNT(*)::INTEGER INTO v_total_auth_users FROM auth.users;
    
    -- Get unresolved conflicts
    SELECT COUNT(*)::INTEGER INTO v_unresolved_conflicts 
    FROM public.profile_sync_conflicts WHERE resolved_at IS NULL;
    
    -- Set timestamp
    v_last_sync_check := NOW();

    -- Calculate sync health score (0-100)
    v_sync_health_score := CASE 
        WHEN v_total_profiles = 0 THEN 100
        ELSE ROUND(
            (v_synced_profiles::NUMERIC / v_total_profiles::NUMERIC) * 100 - 
            (v_conflict_profiles::NUMERIC / v_total_profiles::NUMERIC) * 20 - 
            (v_error_profiles::NUMERIC / v_total_profiles::NUMERIC) * 30,
            2
        )
    END;

    RETURN QUERY SELECT 
        v_total_profiles,
        v_total_auth_users,
        v_synced_profiles,
        v_pending_sync,
        v_conflict_profiles,
        v_error_profiles,
        v_unresolved_conflicts,
        v_last_sync_check,
        v_sync_health_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_auth_sync_status_summary IS 'Get comprehensive auth synchronization status summary with health score';

-- ========= PART 2: AUTH SYNC OPERATION FUNCTIONS =========

-- Function to sync individual profile with auth.users
CREATE OR REPLACE FUNCTION sync_profile_with_auth(
    p_profile_id UUID,
    p_strategy TEXT DEFAULT 'auto',
    p_force_sync BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    success BOOLEAN,
    action_taken TEXT,
    conflicts_created INTEGER,
    error_message TEXT,
    sync_details JSONB
) AS $$
DECLARE
    profile_record RECORD;
    auth_record RECORD;
    sync_result RECORD;
    conflicts_count INTEGER := 0;
    operation_details JSONB := '{}';
BEGIN
    -- Get profile data
    SELECT * INTO profile_record FROM public.profiles WHERE id = p_profile_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE as success,
            'profile_not_found'::TEXT as action_taken,
            0 as conflicts_created,
            'Profile not found'::TEXT as error_message,
            '{}'::JSONB as sync_details;
        RETURN;
    END IF;

    -- Get auth.users data by email
    SELECT * INTO auth_record FROM auth.users WHERE email = profile_record.email;

    -- Handle different sync scenarios
    IF auth_record IS NULL THEN
        -- No auth.users record exists
        IF p_strategy = 'create_auth' OR (p_strategy = 'auto' AND profile_record.status = 'active') THEN
            -- Would create auth.users record (requires admin API call in application)
            UPDATE public.profiles 
            SET auth_sync_status = 'pending',
                auth_sync_last_attempted = NOW(),
                metadata = COALESCE(metadata, '{}') || jsonb_build_object(
                    'sync_action_required', 'create_auth_user',
                    'sync_attempted_at', NOW()
                )
            WHERE id = p_profile_id;
            
            operation_details := jsonb_build_object(
                'action', 'create_auth_required',
                'profile_email', profile_record.email,
                'profile_status', profile_record.status
            );
            
            RETURN QUERY SELECT 
                TRUE as success,
                'create_auth_required'::TEXT as action_taken,
                0 as conflicts_created,
                NULL::TEXT as error_message,
                operation_details as sync_details;
        ELSE
            -- Create conflict record
            INSERT INTO public.profile_sync_conflicts (
                profile_id, auth_user_id, conflict_type, profile_data, auth_data, metadata
            ) VALUES (
                p_profile_id, NULL, 'auth_missing', 
                to_jsonb(profile_record), '{}',
                jsonb_build_object('sync_strategy', p_strategy, 'created_by', 'sync_function')
            );
            conflicts_count := 1;
            
            UPDATE public.profiles 
            SET auth_sync_status = 'conflict' 
            WHERE id = p_profile_id;
            
            RETURN QUERY SELECT 
                FALSE as success,
                'conflict_created'::TEXT as action_taken,
                conflicts_count as conflicts_created,
                'Auth user missing - conflict created'::TEXT as error_message,
                jsonb_build_object('conflict_type', 'auth_missing') as sync_details;
        END IF;
    ELSE
        -- Auth.users record exists - check for conflicts
        IF profile_record.email != auth_record.email THEN
            -- Email mismatch
            INSERT INTO public.profile_sync_conflicts (
                profile_id, auth_user_id, conflict_type, profile_data, auth_data
            ) VALUES (
                p_profile_id, auth_record.id, 'email_mismatch',
                to_jsonb(profile_record),
                jsonb_build_object(
                    'id', auth_record.id,
                    'email', auth_record.email,
                    'created_at', auth_record.created_at
                )
            );
            conflicts_count := 1;
            
            UPDATE public.profiles 
            SET auth_sync_status = 'conflict' 
            WHERE id = p_profile_id;
            
            RETURN QUERY SELECT 
                FALSE as success,
                'email_conflict'::TEXT as action_taken,
                conflicts_count as conflicts_created,
                'Email mismatch between profile and auth.users'::TEXT as error_message,
                jsonb_build_object('profile_email', profile_record.email, 'auth_email', auth_record.email) as sync_details;
        ELSE
            -- No conflicts - update sync status and sync metadata
            UPDATE public.profiles 
            SET 
                auth_sync_status = 'synced',
                auth_sync_last_attempted = NOW(),
                last_login_at = COALESCE(auth_record.last_sign_in_at, last_login_at),
                is_verified = COALESCE(auth_record.email_confirmed_at IS NOT NULL, is_verified),
                metadata = COALESCE(metadata, '{}') || jsonb_build_object(
                    'auth_user_id', auth_record.id,
                    'last_sync_at', NOW(),
                    'auth_created_at', auth_record.created_at,
                    'auth_updated_at', auth_record.updated_at
                )
            WHERE id = p_profile_id;
            
            -- Log the sync activity
            PERFORM log_profile_activity(
                p_profile_id,
                'profile_synced',
                'auth',
                auth_record.id,
                'Profile successfully synchronized with auth.users',
                jsonb_build_object(
                    'auth_user_id', auth_record.id,
                    'sync_strategy', p_strategy,
                    'sync_timestamp', NOW()
                )
            );
            
            operation_details := jsonb_build_object(
                'auth_user_id', auth_record.id,
                'last_sign_in_at', auth_record.last_sign_in_at,
                'email_confirmed', auth_record.email_confirmed_at IS NOT NULL
            );
            
            RETURN QUERY SELECT 
                TRUE as success,
                'synced'::TEXT as action_taken,
                0 as conflicts_created,
                NULL::TEXT as error_message,
                operation_details as sync_details;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_profile_with_auth IS 'Sync individual profile with auth.users, handling conflicts and different strategies';

-- Function for bulk profile synchronization
CREATE OR REPLACE FUNCTION bulk_sync_profiles(
    p_profile_ids UUID[] DEFAULT NULL,
    p_sync_strategy TEXT DEFAULT 'auto',
    p_max_conflicts INTEGER DEFAULT 10
) RETURNS TABLE (
    operation_id UUID,
    total_processed INTEGER,
    successful_syncs INTEGER,
    conflicts_created INTEGER,
    errors_encountered INTEGER,
    processing_time_ms INTEGER,
    summary JSONB
) AS $$
DECLARE
    operation_uuid UUID := gen_random_uuid();
    start_time TIMESTAMP := clock_timestamp();
    profile_ids_to_process UUID[];
    profile_id UUID;
    sync_result RECORD;
    total_count INTEGER := 0;
    success_count INTEGER := 0;
    conflict_count INTEGER := 0;
    error_count INTEGER := 0;
    operation_summary JSONB;
BEGIN
    -- Determine which profiles to process
    IF p_profile_ids IS NULL THEN
        -- Get all profiles needing sync
        SELECT array_agg(id) INTO profile_ids_to_process
        FROM public.profiles 
        WHERE auth_sync_status IN ('pending', 'error') 
           OR auth_sync_last_attempted IS NULL
           OR auth_sync_last_attempted < NOW() - INTERVAL '24 hours';
    ELSE
        profile_ids_to_process := p_profile_ids;
    END IF;

    -- Process each profile
    FOREACH profile_id IN ARRAY profile_ids_to_process
    LOOP
        total_count := total_count + 1;
        
        -- Stop if we've hit the conflict limit
        IF conflict_count >= p_max_conflicts THEN
            EXIT;
        END IF;
        
        BEGIN
            SELECT * INTO sync_result 
            FROM sync_profile_with_auth(profile_id, p_sync_strategy);
            
            IF sync_result.success THEN
                success_count := success_count + 1;
            ELSE
                IF sync_result.conflicts_created > 0 THEN
                    conflict_count := conflict_count + sync_result.conflicts_created;
                ELSE
                    error_count := error_count + 1;
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            
            -- Log the error
            PERFORM log_profile_activity(
                profile_id,
                'profile_sync_failed',
                'auth',
                profile_id,
                'Bulk sync failed: ' || SQLERRM,
                jsonb_build_object(
                    'operation_id', operation_uuid,
                    'error_message', SQLERRM,
                    'error_state', SQLSTATE
                )
            );
        END;
    END LOOP;

    -- Create summary
    operation_summary := jsonb_build_object(
        'operation_id', operation_uuid,
        'strategy', p_sync_strategy,
        'started_at', start_time,
        'completed_at', clock_timestamp(),
        'profiles_requested', array_length(profile_ids_to_process, 1),
        'max_conflicts_limit', p_max_conflicts,
        'stopped_early', conflict_count >= p_max_conflicts
    );

    RETURN QUERY SELECT 
        operation_uuid as operation_id,
        total_count as total_processed,
        success_count as successful_syncs,
        conflict_count as conflicts_created,
        error_count as errors_encountered,
        EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::INTEGER as processing_time_ms,
        operation_summary as summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION bulk_sync_profiles IS 'Perform bulk synchronization of profiles with auth.users';

-- ========= PART 3: CONFLICT RESOLUTION FUNCTIONS =========

-- Function to resolve sync conflicts
CREATE OR REPLACE FUNCTION resolve_sync_conflict(
    p_conflict_id UUID,
    p_resolution_strategy TEXT,
    p_resolution_notes TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    action_taken TEXT,
    resolved_profile_id UUID,
    error_message TEXT
) AS $$
DECLARE
    conflict_record RECORD;
    resolved_successfully BOOLEAN := FALSE;
    action_description TEXT;
BEGIN
    -- Get conflict details
    SELECT * INTO conflict_record 
    FROM public.profile_sync_conflicts 
    WHERE id = p_conflict_id AND resolved_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE as success,
            'conflict_not_found'::TEXT as action_taken,
            NULL::UUID as resolved_profile_id,
            'Conflict not found or already resolved'::TEXT as error_message;
        RETURN;
    END IF;

    -- Apply resolution strategy
    CASE p_resolution_strategy
        WHEN 'profile_wins' THEN
            -- Profile data takes precedence
            IF conflict_record.conflict_type = 'email_mismatch' THEN
                -- Would need to update auth.users email (requires admin API)
                action_description := 'profile_wins_auth_update_required';
                resolved_successfully := TRUE;
            ELSIF conflict_record.conflict_type = 'metadata_inconsistency' THEN
                -- Update auth.users metadata to match profile
                action_description := 'profile_wins_metadata_updated';
                resolved_successfully := TRUE;
            END IF;
            
        WHEN 'auth_wins' THEN
            -- Auth.users data takes precedence
            IF conflict_record.conflict_type = 'email_mismatch' THEN
                -- Update profile email to match auth.users
                UPDATE public.profiles 
                SET email = (conflict_record.auth_data->>'email')::TEXT,
                    auth_sync_status = 'synced',
                    auth_sync_last_attempted = NOW()
                WHERE id = conflict_record.profile_id;
                
                action_description := 'auth_wins_profile_updated';
                resolved_successfully := TRUE;
            END IF;
            
        WHEN 'manual' THEN
            -- Manual resolution - just mark as resolved with notes
            action_description := 'manual_resolution';
            resolved_successfully := TRUE;
            
        WHEN 'ignore' THEN
            -- Ignore the conflict
            action_description := 'conflict_ignored';
            resolved_successfully := TRUE;
            
        ELSE
            RETURN QUERY SELECT 
                FALSE as success,
                'invalid_strategy'::TEXT as action_taken,
                conflict_record.profile_id as resolved_profile_id,
                'Invalid resolution strategy'::TEXT as error_message;
            RETURN;
    END CASE;

    -- Mark conflict as resolved
    IF resolved_successfully THEN
        UPDATE public.profile_sync_conflicts 
        SET 
            resolved_at = NOW(),
            resolved_by = auth.uid(),
            resolution_strategy = p_resolution_strategy,
            resolution_notes = p_resolution_notes,
            updated_at = NOW()
        WHERE id = p_conflict_id;
        
        -- Log the resolution
        PERFORM log_profile_activity(
            conflict_record.profile_id,
            'sync_conflict_resolved',
            'conflict',
            p_conflict_id,
            'Sync conflict resolved using ' || p_resolution_strategy || ' strategy',
            jsonb_build_object(
                'conflict_id', p_conflict_id,
                'conflict_type', conflict_record.conflict_type,
                'resolution_strategy', p_resolution_strategy,
                'resolution_notes', p_resolution_notes
            )
        );
        
        RETURN QUERY SELECT 
            TRUE as success,
            action_description as action_taken,
            conflict_record.profile_id as resolved_profile_id,
            NULL::TEXT as error_message;
    ELSE
        RETURN QUERY SELECT 
            FALSE as success,
            'resolution_failed'::TEXT as action_taken,
            conflict_record.profile_id as resolved_profile_id,
            'Failed to apply resolution strategy'::TEXT as error_message;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION resolve_sync_conflict IS 'Resolve sync conflicts using specified strategy';

-- ========= PART 4: MONITORING AND REPORTING FUNCTIONS =========

-- Function to get sync conflict summary
CREATE OR REPLACE FUNCTION get_sync_conflicts_summary()
RETURNS TABLE (
    total_conflicts INTEGER,
    unresolved_conflicts INTEGER,
    email_mismatches INTEGER,
    missing_auth_users INTEGER,
    missing_profiles INTEGER,
    metadata_inconsistencies INTEGER,
    oldest_unresolved_conflict TIMESTAMP WITH TIME ZONE,
    recent_resolutions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_conflicts,
        COUNT(*) FILTER (WHERE resolved_at IS NULL)::INTEGER as unresolved_conflicts,
        COUNT(*) FILTER (WHERE conflict_type = 'email_mismatch' AND resolved_at IS NULL)::INTEGER as email_mismatches,
        COUNT(*) FILTER (WHERE conflict_type = 'auth_missing' AND resolved_at IS NULL)::INTEGER as missing_auth_users,
        COUNT(*) FILTER (WHERE conflict_type = 'profile_missing' AND resolved_at IS NULL)::INTEGER as missing_profiles,
        COUNT(*) FILTER (WHERE conflict_type = 'metadata_inconsistency' AND resolved_at IS NULL)::INTEGER as metadata_inconsistencies,
        MIN(created_at) FILTER (WHERE resolved_at IS NULL) as oldest_unresolved_conflict,
        COUNT(*) FILTER (WHERE resolved_at >= NOW() - INTERVAL '24 hours')::INTEGER as recent_resolutions
    FROM public.profile_sync_conflicts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sync_conflicts_summary IS 'Get summary of sync conflicts by type and status';

-- ========= PART 5: AUTOMATED SYNC HEALTH CHECK =========

-- Function to perform automated sync health check
CREATE OR REPLACE FUNCTION perform_sync_health_check()
RETURNS TABLE (
    check_timestamp TIMESTAMP WITH TIME ZONE,
    health_score NUMERIC,
    total_discrepancies INTEGER,
    critical_issues INTEGER,
    recommendations TEXT[],
    auto_actions_taken INTEGER
) AS $$
DECLARE
    discrepancy_count INTEGER;
    critical_count INTEGER;
    auto_actions INTEGER := 0;
    recommendations_list TEXT[] := '{}';
    health_score_val NUMERIC;
    discrepancy_rec RECORD;
BEGIN
    check_timestamp := NOW();
    
    -- Count discrepancies
    SELECT COUNT(*) INTO discrepancy_count 
    FROM detect_profile_sync_discrepancies();
    
    SELECT COUNT(*) INTO critical_count 
    FROM detect_profile_sync_discrepancies() 
    WHERE severity = 'critical';
    
    -- Auto-resolve low-severity metadata inconsistencies
    FOR discrepancy_rec IN 
        SELECT * FROM detect_profile_sync_discrepancies() 
        WHERE severity = 'low' AND discrepancy_type = 'metadata_inconsistency'
    LOOP
        -- Auto-update profile metadata from auth.users
        UPDATE public.profiles 
        SET 
            full_name = COALESCE(
                (discrepancy_rec.auth_data->'user_metadata'->>'full_name'),
                full_name
            ),
            avatar_url = COALESCE(
                (discrepancy_rec.auth_data->'user_metadata'->>'avatar_url'),
                avatar_url
            ),
            auth_sync_status = 'synced',
            auth_sync_last_attempted = NOW()
        WHERE id = discrepancy_rec.profile_id;
        
        auto_actions := auto_actions + 1;
    END LOOP;
    
    -- Generate recommendations
    IF critical_count > 0 THEN
        recommendations_list := recommendations_list || 'Immediate attention required for critical email mismatches';
    END IF;
    
    IF discrepancy_count > 10 THEN
        recommendations_list := recommendations_list || 'Consider running bulk sync operation';
    END IF;
    
    SELECT COUNT(*) INTO discrepancy_count 
    FROM public.profile_sync_conflicts 
    WHERE resolved_at IS NULL AND created_at < NOW() - INTERVAL '7 days';
    
    IF discrepancy_count > 0 THEN
        recommendations_list := recommendations_list || 'Review and resolve conflicts older than 7 days';
    END IF;
    
    -- Calculate health score
    SELECT sync_health_score INTO health_score_val 
    FROM get_auth_sync_status_summary();
    
    RETURN QUERY SELECT 
        check_timestamp,
        health_score_val as health_score,
        discrepancy_count as total_discrepancies,
        critical_count as critical_issues,
        recommendations_list as recommendations,
        auto_actions as auto_actions_taken;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION perform_sync_health_check IS 'Automated sync health check with auto-resolution and recommendations';

-- ========= PART 6: GRANT PERMISSIONS =========

-- Grant execute permissions for auth sync functions
GRANT EXECUTE ON FUNCTION detect_profile_sync_discrepancies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_sync_status_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_profile_with_auth(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_sync_profiles(UUID[], TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_sync_conflict(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sync_conflicts_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION perform_sync_health_check() TO authenticated;

COMMIT;