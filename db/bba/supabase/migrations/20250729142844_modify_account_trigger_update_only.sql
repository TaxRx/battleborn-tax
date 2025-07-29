-- Modify Account Changes Trigger to Update Only
-- Purpose: Fix the trigger to only run on UPDATE operations, not INSERT/DELETE
-- Issue: INSERT operations cause foreign key violations during registration
-- Solution: Only track account updates, not creation or deletion
-- Date: 2025-07-29

BEGIN;

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_auto_log_account_changes ON public.accounts;

-- Recreate trigger to only run on UPDATE operations
CREATE TRIGGER trigger_auto_log_account_changes
    AFTER UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION auto_log_account_changes();

-- Simplify the auto_log_account_changes function to only handle UPDATE
CREATE OR REPLACE FUNCTION public.auto_log_account_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    changed_fields JSONB;
    activity_description TEXT;
BEGIN
    -- Only handle UPDATE operations now
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

    RETURN NEW;
END;
$function$;

-- Add comment to explain the change
COMMENT ON FUNCTION public.auto_log_account_changes() IS 'Logs account updates only. INSERT/DELETE operations removed to prevent foreign key violations during registration.';

COMMIT;