-- Fix JSON to JSONB Type Casting in Trigger Functions
-- Purpose: Fix function call errors due to JSON vs JSONB type mismatch
-- Issue: log_account_activity expects JSONB but we're passing JSON
-- Solution: Cast json_build_object results to JSONB
-- Date: 2025-07-29

BEGIN;

-- Update profile changes function to properly cast JSON to JSONB
CREATE OR REPLACE FUNCTION public.auto_log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    
    -- Handle BEFORE UPDATE - log before the change happens
    IF TG_OP = 'UPDATE' AND TG_WHEN = 'BEFORE' THEN
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
        
        activity_description := 'Profile updated: ' || COALESCE(OLD.full_name, OLD.email);
        
        PERFORM log_account_activity(
            target_account_id,
            'profile_updated',
            'profile',
            OLD.id,
            activity_description,
            jsonb_build_object(
                'profile_id', OLD.id,
                'changed_fields', changed_fields
            )
        );
    END IF;
    
    -- Handle AFTER INSERT - log after the profile is created
    IF TG_OP = 'INSERT' AND TG_WHEN = 'AFTER' THEN
        PERFORM log_account_activity(
            target_account_id,
            'profile_added',
            'profile',
            NEW.id,
            'New profile added: ' || COALESCE(NEW.full_name, NEW.email),
            jsonb_build_object(
                'profile_id', NEW.id,
                'profile_email', NEW.email,
                'profile_role', NEW.role
            )
        );
    END IF;
    
    -- Handle BEFORE DELETE - log before the profile is deleted
    IF TG_OP = 'DELETE' AND TG_WHEN = 'BEFORE' THEN
        PERFORM log_account_activity(
            target_account_id,
            'profile_removed',
            'profile',
            OLD.id,
            'Profile removed: ' || COALESCE(OLD.full_name, OLD.email),
            jsonb_build_object(
                'profile_id', OLD.id,
                'profile_email', OLD.email,
                'removal_timestamp', NOW()
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

COMMIT;