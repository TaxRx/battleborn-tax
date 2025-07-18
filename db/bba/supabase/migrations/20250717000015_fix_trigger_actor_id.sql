-- Migration: Fix trigger to use actor_id instead of created_by
-- Purpose: Update trigger function to use correct column name for account_activities
-- Date: 2025-07-17

-- Update the trigger function to use actor_id instead of created_by
CREATE OR REPLACE FUNCTION auto_log_tool_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log tool assignment changes to account_activities
    IF TG_OP = 'INSERT' THEN
        INSERT INTO account_activities (
            account_id,
            actor_id,
            activity_type,
            target_type,
            target_id,
            description,
            metadata
        ) VALUES (
            NEW.account_id,
            NEW.created_by,  -- Use created_by from account_tool_access as actor_id
            'admin_action',
            'tool_assignment',
            NEW.tool_id,
            'Tool access granted: ' || COALESCE((SELECT name FROM tools WHERE id = NEW.tool_id), 'Unknown Tool'),
            jsonb_build_object(
                'tool_id', NEW.tool_id,
                'access_level', NEW.access_level,
                'subscription_level', NEW.subscription_level,
                'operation', 'assign',
                'granted_by', NEW.granted_by,
                'expires_at', NEW.expires_at
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if significant fields changed
        IF (OLD.access_level IS DISTINCT FROM NEW.access_level) OR
           (OLD.subscription_level IS DISTINCT FROM NEW.subscription_level) OR
           (OLD.status IS DISTINCT FROM NEW.status) OR
           (OLD.expires_at IS DISTINCT FROM NEW.expires_at) THEN
            INSERT INTO account_activities (
                account_id,
                actor_id,
                activity_type,
                target_type,
                target_id,
                description,
                metadata
            ) VALUES (
                NEW.account_id,
                NEW.updated_by,  -- Use updated_by from account_tool_access as actor_id
                'admin_action',
                'tool_assignment',
                NEW.tool_id,
                'Tool access updated: ' || COALESCE((SELECT name FROM tools WHERE id = NEW.tool_id), 'Unknown Tool'),
                jsonb_build_object(
                    'tool_id', NEW.tool_id,
                    'old_access_level', OLD.access_level,
                    'new_access_level', NEW.access_level,
                    'old_subscription_level', OLD.subscription_level,
                    'new_subscription_level', NEW.subscription_level,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'old_expires_at', OLD.expires_at,
                    'new_expires_at', NEW.expires_at,
                    'operation', 'update'
                )
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO account_activities (
            account_id,
            actor_id,
            activity_type,
            target_type,
            target_id,
            description,
            metadata
        ) VALUES (
            OLD.account_id,
            OLD.updated_by,  -- Use updated_by from account_tool_access as actor_id
            'admin_action',
            'tool_assignment',
            OLD.tool_id,
            'Tool access revoked: ' || COALESCE((SELECT name FROM tools WHERE id = OLD.tool_id), 'Unknown Tool'),
            jsonb_build_object(
                'tool_id', OLD.tool_id,
                'access_level', OLD.access_level,
                'subscription_level', OLD.subscription_level,
                'operation', 'unassign'
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on the function
COMMENT ON FUNCTION auto_log_tool_assignment_changes() IS 'Automatically logs tool assignment changes to account_activities using correct actor_id column';

-- Log the update
DO $$
BEGIN
    RAISE NOTICE 'Updated auto_log_tool_assignment_changes function to use actor_id instead of created_by';
END;
$$;