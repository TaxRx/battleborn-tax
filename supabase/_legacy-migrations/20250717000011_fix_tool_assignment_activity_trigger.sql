-- Migration: Fix tool assignment activity trigger
-- Purpose: Update trigger function to use valid activity type 'admin_action' instead of 'tool_assigned'
-- Date: 2025-07-24

-- First, let's check the current constraint values
DO $$
BEGIN
    -- Update the trigger function to use 'admin_action' instead of 'tool_assigned'
    CREATE OR REPLACE FUNCTION auto_log_tool_assignment_changes()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        -- Log tool assignment changes to account_activities
        IF TG_OP = 'INSERT' THEN
            INSERT INTO account_activities (
                account_id,
                activity_type,
                description,
                metadata,
                created_by
            ) VALUES (
                NEW.account_id,
                'admin_action',  -- Changed from 'tool_assigned' to valid enum value
                'Tool access granted: ' || (SELECT name FROM tools WHERE id = NEW.tool_id),
                jsonb_build_object(
                    'tool_id', NEW.tool_id,
                    'access_level', NEW.access_level,
                    'subscription_level', NEW.subscription_level,
                    'operation', 'assign'
                ),
                NEW.created_by
            );
        ELSIF TG_OP = 'UPDATE' THEN
            -- Only log if significant fields changed
            IF (OLD.access_level IS DISTINCT FROM NEW.access_level) OR
               (OLD.subscription_level IS DISTINCT FROM NEW.subscription_level) OR
               (OLD.status IS DISTINCT FROM NEW.status) THEN
                INSERT INTO account_activities (
                    account_id,
                    activity_type,
                    description,
                    metadata,
                    created_by
                ) VALUES (
                    NEW.account_id,
                    'admin_action',  -- Changed from 'tool_updated' to valid enum value
                    'Tool access updated: ' || (SELECT name FROM tools WHERE id = NEW.tool_id),
                    jsonb_build_object(
                        'tool_id', NEW.tool_id,
                        'old_access_level', OLD.access_level,
                        'new_access_level', NEW.access_level,
                        'old_subscription_level', OLD.subscription_level,
                        'new_subscription_level', NEW.subscription_level,
                        'old_status', OLD.status,
                        'new_status', NEW.status,
                        'operation', 'update'
                    ),
                    NEW.updated_by
                );
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO account_activities (
                account_id,
                activity_type,
                description,
                metadata,
                created_by
            ) VALUES (
                OLD.account_id,
                'admin_action',  -- Changed from 'tool_unassigned' to valid enum value
                'Tool access revoked: ' || (SELECT name FROM tools WHERE id = OLD.tool_id),
                jsonb_build_object(
                    'tool_id', OLD.tool_id,
                    'access_level', OLD.access_level,
                    'subscription_level', OLD.subscription_level,
                    'operation', 'unassign'
                ),
                OLD.updated_by
            );
        END IF;
        
        RETURN COALESCE(NEW, OLD);
    END;
    $trigger$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Comment on the function
    COMMENT ON FUNCTION auto_log_tool_assignment_changes() IS 'Automatically logs tool assignment changes to account_activities using valid activity types';

    RAISE NOTICE 'Updated auto_log_tool_assignment_changes function to use valid activity types';
END
$$;