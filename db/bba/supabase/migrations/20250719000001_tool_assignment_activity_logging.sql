-- Epic 3 Sprint 2: Tool Assignment Activity Logging
-- File: 20250719000001_tool_assignment_activity_logging.sql
-- Purpose: Add automatic activity logging for tool assignment changes
-- Sprint 2 Day 1: Enhanced activity logging for tool management operations

BEGIN;

-- ========= PART 1: CREATE TOOL ASSIGNMENT ACTIVITY LOGGING FUNCTION =========

-- Trigger function for automatic tool assignment change logging
CREATE OR REPLACE FUNCTION auto_log_tool_assignment_changes() RETURNS TRIGGER AS $$
DECLARE
    target_account_id UUID;
    target_tool_id UUID;
    changed_fields JSONB;
    activity_description TEXT;
    tool_name TEXT;
    account_name TEXT;
    old_status TEXT;
    new_status TEXT;
BEGIN
    -- Get the account_id and tool_id for the assignment
    IF TG_OP = 'DELETE' THEN
        target_account_id := OLD.account_id;
        target_tool_id := OLD.tool_id;
    ELSE
        target_account_id := NEW.account_id;
        target_tool_id := NEW.tool_id;
    END IF;
    
    -- Get tool and account names for description
    SELECT name INTO tool_name FROM public.tools WHERE id = target_tool_id;
    SELECT name INTO account_name FROM public.accounts WHERE id = target_account_id;
    
    -- Log tool assignment updates
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'account_tool_access' THEN
        -- Calculate changed fields
        SELECT json_object_agg(key, json_build_object('old', old_val, 'new', new_val))::jsonb
        INTO changed_fields
        FROM (
            SELECT key, 
                   to_jsonb(OLD) ->> key as old_val,
                   to_jsonb(NEW) ->> key as new_val
            FROM jsonb_each(to_jsonb(NEW))
            WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
              AND key NOT IN ('updated_at', 'updated_by') -- Exclude automatic fields
        ) changes;
        
        -- Create meaningful description based on what changed
        old_status := OLD.status;
        new_status := NEW.status;
        
        IF changed_fields ? 'status' THEN
            activity_description := 'Tool access status changed: ' || tool_name || ' (' || old_status || ' → ' || new_status || ')';
        ELSIF changed_fields ? 'subscription_level' THEN
            activity_description := 'Tool subscription level updated: ' || tool_name || ' (' || OLD.subscription_level || ' → ' || NEW.subscription_level || ')';
        ELSIF changed_fields ? 'expires_at' THEN
            activity_description := 'Tool access expiration updated: ' || tool_name;
        ELSIF changed_fields ? 'access_level' THEN
            activity_description := 'Tool access level changed: ' || tool_name || ' (' || OLD.access_level || ' → ' || NEW.access_level || ')';
        ELSIF changed_fields ? 'features_enabled' THEN
            activity_description := 'Tool features updated: ' || tool_name;
        ELSIF changed_fields ? 'usage_limits' THEN
            activity_description := 'Tool usage limits updated: ' || tool_name;
        ELSE
            activity_description := 'Tool access modified: ' || tool_name;
        END IF;
        
        PERFORM log_account_activity(
            target_account_id,
            'tool_access_modified',
            'tool',
            target_tool_id,
            activity_description,
            jsonb_build_object(
                'tool_name', tool_name,
                'account_name', account_name,
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW),
                'changed_fields', changed_fields,
                'action_type', 'update'
            )
        );
    END IF;
    
    -- Log tool assignment creation
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'account_tool_access' THEN
        activity_description := 'Tool access granted: ' || tool_name || 
                               ' (level: ' || NEW.access_level || 
                               ', subscription: ' || NEW.subscription_level || ')';
        
        PERFORM log_account_activity(
            target_account_id,
            'tool_assigned',
            'tool',
            target_tool_id,
            activity_description,
            jsonb_build_object(
                'tool_name', tool_name,
                'account_name', account_name,
                'access_level', NEW.access_level,
                'subscription_level', NEW.subscription_level,
                'status', NEW.status,
                'expires_at', NEW.expires_at,
                'granted_by', NEW.created_by,
                'action_type', 'assign'
            )
        );
    END IF;
    
    -- Log tool assignment removal
    IF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'account_tool_access' THEN
        activity_description := 'Tool access removed: ' || tool_name || 
                               ' (was: ' || OLD.access_level || ', ' || OLD.subscription_level || ')';
        
        PERFORM log_account_activity(
            target_account_id,
            'tool_removed',
            'tool',
            target_tool_id,
            activity_description,
            jsonb_build_object(
                'tool_name', tool_name,
                'account_name', account_name,
                'previous_access_level', OLD.access_level,
                'previous_subscription_level', OLD.subscription_level,
                'previous_status', OLD.status,
                'granted_at', OLD.granted_at,
                'last_accessed_at', OLD.last_accessed_at,
                'removal_timestamp', NOW(),
                'action_type', 'remove'
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_log_tool_assignment_changes IS 'Automatically logs tool assignment changes with detailed context';

-- ========= PART 2: CREATE TOOL USAGE ACTIVITY LOGGING FUNCTION =========

-- Function to log significant tool usage events as activities
CREATE OR REPLACE FUNCTION auto_log_significant_tool_usage() RETURNS TRIGGER AS $$
DECLARE
    tool_name TEXT;
    account_name TEXT;
    user_name TEXT;
    activity_description TEXT;
    should_log BOOLEAN := false;
BEGIN
    -- Only log certain significant actions
    IF NEW.action IN ('tool_access', 'bulk_operation', 'data_export', 'api_call') 
       OR NEW.success = false 
       OR NEW.data_volume_mb > 100 
       OR NEW.duration_seconds > 3600 THEN
        should_log := true;
    END IF;
    
    -- Don't log routine feature usage to avoid noise
    IF NOT should_log THEN
        RETURN NEW;
    END IF;
    
    -- Get contextual information
    SELECT name INTO tool_name FROM public.tools WHERE id = NEW.tool_id;
    SELECT name INTO account_name FROM public.accounts WHERE id = NEW.account_id;
    SELECT full_name INTO user_name FROM public.profiles WHERE id = NEW.profile_id;
    
    -- Create activity description
    IF NEW.success = false THEN
        activity_description := 'Tool usage failed: ' || tool_name || ' (' || NEW.action || ')';
    ELSIF NEW.action = 'data_export' THEN
        activity_description := 'Data exported from: ' || tool_name;
        IF NEW.data_volume_mb IS NOT NULL THEN
            activity_description := activity_description || ' (' || NEW.data_volume_mb || ' MB)';
        END IF;
    ELSIF NEW.action = 'bulk_operation' THEN
        activity_description := 'Bulk operation performed: ' || tool_name;
    ELSIF NEW.data_volume_mb > 100 THEN
        activity_description := 'Large data operation: ' || tool_name || ' (' || NEW.data_volume_mb || ' MB)';
    ELSIF NEW.duration_seconds > 3600 THEN
        activity_description := 'Extended tool session: ' || tool_name || ' (' || (NEW.duration_seconds / 60) || ' minutes)';
    ELSE
        activity_description := 'Tool accessed: ' || tool_name || ' (' || NEW.action || ')';
    END IF;
    
    -- Log the activity
    PERFORM log_account_activity(
        NEW.account_id,
        CASE 
            WHEN NEW.success = false THEN 'admin_action'
            WHEN NEW.action = 'data_export' THEN 'data_export'
            WHEN NEW.action = 'bulk_operation' THEN 'bulk_operation'
            ELSE 'tool_assigned'
        END,
        'tool',
        NEW.tool_id,
        activity_description,
        jsonb_build_object(
            'tool_name', tool_name,
            'account_name', account_name,
            'user_name', user_name,
            'action', NEW.action,
            'feature_used', NEW.feature_used,
            'duration_seconds', NEW.duration_seconds,
            'data_volume_mb', NEW.data_volume_mb,
            'success', NEW.success,
            'error_code', NEW.error_code,
            'session_id', NEW.session_id,
            'usage_log_id', NEW.id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_log_significant_tool_usage IS 'Logs significant tool usage events as account activities';

-- ========= PART 3: CREATE TRIGGERS =========

-- Create trigger for tool assignment changes
DROP TRIGGER IF EXISTS trigger_auto_log_tool_assignment_changes ON public.account_tool_access;
CREATE TRIGGER trigger_auto_log_tool_assignment_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.account_tool_access
    FOR EACH ROW EXECUTE FUNCTION auto_log_tool_assignment_changes();

-- Create trigger for significant tool usage logging
DROP TRIGGER IF EXISTS trigger_auto_log_significant_tool_usage ON public.tool_usage_logs;
CREATE TRIGGER trigger_auto_log_significant_tool_usage
    AFTER INSERT ON public.tool_usage_logs
    FOR EACH ROW EXECUTE FUNCTION auto_log_significant_tool_usage();

-- ========= PART 4: CREATE BULK OPERATION HELPER FUNCTIONS =========

-- Function for bulk tool assignment with activity logging
CREATE OR REPLACE FUNCTION bulk_assign_tools(
    p_account_ids UUID[],
    p_tool_ids UUID[],
    p_access_level access_level_type DEFAULT 'full',
    p_subscription_level subscription_level_type DEFAULT 'basic',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    account_id UUID;
    tool_id UUID;
    errors JSONB := '[]'::jsonb;
    assignments JSONB := '[]'::jsonb;
BEGIN
    -- Iterate through all account/tool combinations
    FOREACH account_id IN ARRAY p_account_ids
    LOOP
        FOREACH tool_id IN ARRAY p_tool_ids
        LOOP
            BEGIN
                -- Insert or update the tool assignment
                INSERT INTO public.account_tool_access (
                    account_id,
                    tool_id,
                    access_level,
                    subscription_level,
                    expires_at,
                    notes,
                    created_by,
                    status
                ) VALUES (
                    account_id,
                    tool_id,
                    p_access_level,
                    p_subscription_level,
                    p_expires_at,
                    p_notes,
                    auth.uid(),
                    'active'
                )
                ON CONFLICT (account_id, tool_id) 
                DO UPDATE SET
                    access_level = EXCLUDED.access_level,
                    subscription_level = EXCLUDED.subscription_level,
                    expires_at = EXCLUDED.expires_at,
                    notes = EXCLUDED.notes,
                    updated_by = auth.uid(),
                    status = 'active';
                
                success_count := success_count + 1;
                assignments := assignments || jsonb_build_object(
                    'account_id', account_id,
                    'tool_id', tool_id,
                    'status', 'success'
                );
                
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                errors := errors || jsonb_build_object(
                    'account_id', account_id,
                    'tool_id', tool_id,
                    'error', SQLERRM
                );
            END;
        END LOOP;
    END LOOP;
    
    -- Log bulk operation activity
    PERFORM log_account_activity(
        NULL, -- Will log for system user in individual assignments
        'bulk_operation',
        'system',
        gen_random_uuid(),
        'Bulk tool assignment: ' || success_count || ' assignments, ' || error_count || ' errors',
        jsonb_build_object(
            'operation_type', 'bulk_assign_tools',
            'account_count', array_length(p_account_ids, 1),
            'tool_count', array_length(p_tool_ids, 1),
            'success_count', success_count,
            'error_count', error_count,
            'access_level', p_access_level,
            'subscription_level', p_subscription_level,
            'expires_at', p_expires_at,
            'assignments', assignments,
            'errors', errors
        )
    );
    
    -- Return operation result
    result := jsonb_build_object(
        'success_count', success_count,
        'error_count', error_count,
        'total_operations', success_count + error_count,
        'assignments', assignments,
        'errors', errors
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION bulk_assign_tools IS 'Performs bulk tool assignments with comprehensive error handling and activity logging';

-- Function for bulk status updates
CREATE OR REPLACE FUNCTION bulk_update_tool_status(
    p_assignment_filters JSONB,
    p_new_status VARCHAR,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    update_count INTEGER;
    where_conditions TEXT := '';
    query_text TEXT;
BEGIN
    -- Build dynamic WHERE clause from filters
    IF p_assignment_filters ? 'account_ids' THEN
        where_conditions := where_conditions || ' AND account_id = ANY($1)';
    END IF;
    
    IF p_assignment_filters ? 'tool_ids' THEN
        where_conditions := where_conditions || ' AND tool_id = ANY($2)';
    END IF;
    
    IF p_assignment_filters ? 'subscription_levels' THEN
        where_conditions := where_conditions || ' AND subscription_level = ANY($3)';
    END IF;
    
    IF p_assignment_filters ? 'current_status' THEN
        where_conditions := where_conditions || ' AND status = ANY($4)';
    END IF;
    
    -- Remove leading ' AND '
    where_conditions := substring(where_conditions from 5);
    
    -- Perform the update
    query_text := 'UPDATE public.account_tool_access SET 
                   status = $5,
                   notes = COALESCE($6, notes),
                   updated_by = auth.uid()
                   WHERE ' || where_conditions;
    
    EXECUTE query_text 
    USING 
        p_assignment_filters->'account_ids',
        p_assignment_filters->'tool_ids', 
        p_assignment_filters->'subscription_levels',
        p_assignment_filters->'current_status',
        p_new_status,
        p_notes;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    -- Return result
    result := jsonb_build_object(
        'updated_count', update_count,
        'new_status', p_new_status,
        'filters_applied', p_assignment_filters
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION bulk_update_tool_status IS 'Performs bulk status updates on tool assignments with dynamic filtering';

-- ========= PART 5: GRANT PERMISSIONS =========

-- Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION bulk_assign_tools(UUID[], UUID[], access_level_type, subscription_level_type, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_tool_status(JSONB, VARCHAR, TEXT) TO authenticated;

COMMIT;