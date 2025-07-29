-- Change Triggers to BEFORE and Remove FK Constraints from account_activities
-- Purpose: Fix timing issues by running triggers BEFORE operations and removing FK constraints
-- Benefits: 
--   1. BEFORE triggers can access data before it's deleted/modified
--   2. Removing FK constraints prevents cascade issues and allows orphaned references
--   3. INSERT operations stay AFTER to ensure the record exists first
-- Date: 2025-07-29

BEGIN;

-- ========= PART 1: REMOVE FOREIGN KEY CONSTRAINTS =========

-- Remove foreign key constraint on actor_id (profiles can be deleted without affecting activities)
ALTER TABLE public.account_activities DROP CONSTRAINT IF EXISTS account_activities_actor_id_fkey;

-- Remove foreign key constraint on account_id (accounts can be deleted without affecting activities)  
ALTER TABLE public.account_activities DROP CONSTRAINT IF EXISTS account_activities_account_id_fkey;

-- Add comments explaining why we removed the constraints
COMMENT ON COLUMN public.account_activities.actor_id IS 'User who performed the action (null for system actions). No FK constraint to allow historical records.';
COMMENT ON COLUMN public.account_activities.account_id IS 'Account that was affected by the activity. No FK constraint to preserve audit trail after account deletion.';

-- ========= PART 2: UPDATE TRIGGERS TO USE BEFORE TIMING =========

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_auto_log_account_changes ON public.accounts;
DROP TRIGGER IF EXISTS trigger_auto_log_profile_changes ON public.profiles;

-- Recreate account trigger with BEFORE UPDATE/DELETE and AFTER INSERT
CREATE TRIGGER trigger_auto_log_account_changes_before
    BEFORE UPDATE OR DELETE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION auto_log_account_changes();

CREATE TRIGGER trigger_auto_log_account_changes_after
    AFTER INSERT ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION auto_log_account_changes();

-- Recreate profile trigger with BEFORE UPDATE/DELETE and AFTER INSERT  
CREATE TRIGGER trigger_auto_log_profile_changes_before
    BEFORE UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION auto_log_profile_changes();

CREATE TRIGGER trigger_auto_log_profile_changes_after
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION auto_log_profile_changes();

-- ========= PART 3: UPDATE TRIGGER FUNCTIONS FOR BEFORE/AFTER LOGIC =========

-- Update account changes function to handle both BEFORE and AFTER triggers
CREATE OR REPLACE FUNCTION public.auto_log_account_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    changed_fields JSONB;
    activity_description TEXT;
BEGIN
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
        
        -- Create meaningful description
        activity_description := 'Account information updated: ' || OLD.name;
        IF changed_fields ? 'type' THEN
            activity_description := activity_description || ' (type changed)';
        END IF;
        IF changed_fields ? 'name' THEN
            activity_description := activity_description || ' (name changed)';
        END IF;
        
        PERFORM log_account_activity(
            OLD.id,
            'account_updated',
            'account',
            OLD.id,
            activity_description,
            jsonb_build_object(
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW),
                'changed_fields', changed_fields
            )
        );
    END IF;
    
    -- Handle AFTER INSERT - log after the account is created
    IF TG_OP = 'INSERT' AND TG_WHEN = 'AFTER' THEN
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
    
    -- Handle BEFORE DELETE - log before the account is deleted
    IF TG_OP = 'DELETE' AND TG_WHEN = 'BEFORE' THEN
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

-- Update profile changes function to handle both BEFORE and AFTER triggers
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
        SELECT json_object_agg(key, json_build_object('old', old_val, 'new', new_val))
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
            json_build_object(
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
            json_build_object(
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
            json_build_object(
                'profile_id', OLD.id,
                'profile_email', OLD.email,
                'removal_timestamp', NOW()
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add comments to explain the new approach
COMMENT ON FUNCTION public.auto_log_account_changes() IS 'Logs account changes using BEFORE timing for UPDATE/DELETE and AFTER for INSERT. No FK constraints prevent orphaned references.';
COMMENT ON FUNCTION public.auto_log_profile_changes() IS 'Logs profile changes using BEFORE timing for UPDATE/DELETE and AFTER for INSERT. No FK constraints prevent orphaned references.';

COMMIT;