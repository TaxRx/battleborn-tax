-- Disable Account Creation Activity Logging
-- Purpose: Fix foreign key constraint violation during user registration
-- Issue: auto_log_account_changes tries to log activity before profile exists
-- Solution: Skip INSERT operations, only log UPDATE and DELETE
-- Date: 2025-07-29

BEGIN;

-- Modify the auto_log_account_changes function to skip INSERT operations
CREATE OR REPLACE FUNCTION public.auto_log_account_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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

    -- REMOVED: Account creation logging to prevent foreign key constraint violations
    -- The INSERT logging has been disabled because it tries to reference a profile
    -- that doesn't exist yet during user registration
    
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
$function$;

-- Add comment to explain the change
COMMENT ON FUNCTION public.auto_log_account_changes() IS 'Logs account changes to account_activities. INSERT operations disabled to prevent foreign key violations during registration.';

COMMIT;