-- Migration: Disable handle_new_user trigger
-- Purpose: Disable the automatic trigger that creates profiles when users are created
-- Date: 2025-07-17

-- Check if the trigger exists and disable it
DO $$
BEGIN
    -- Check if the trigger exists on auth.users table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        -- Drop the trigger
        DROP TRIGGER on_auth_user_created ON auth.users;
        RAISE NOTICE 'Disabled handle_new_user trigger: on_auth_user_created';
    ELSE
        RAISE NOTICE 'handle_new_user trigger on_auth_user_created does not exist or is already disabled';
    END IF;

    -- Also check for any other common trigger names that might exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'handle_new_user' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        -- Drop the trigger
        DROP TRIGGER handle_new_user ON auth.users;
        RAISE NOTICE 'Disabled handle_new_user trigger: handle_new_user';
    ELSE
        RAISE NOTICE 'handle_new_user trigger does not exist or is already disabled';
    END IF;

    -- Check for trigger with different name pattern
    IF EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%handle_new_user%' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        RAISE NOTICE 'Found other handle_new_user related triggers - manual review may be needed';
    END IF;

END;
$$;

-- Optionally, we can also drop the function if it's no longer needed
-- (Commenting out for safety - uncomment if you want to remove the function entirely)
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public'
    ) THEN
        DROP FUNCTION public.handle_new_user();
        RAISE NOTICE 'Dropped handle_new_user function';
    ELSE
        RAISE NOTICE 'handle_new_user function does not exist';
    END IF;
END;
$$;
*/

-- Add comment to document the change
COMMENT ON SCHEMA public IS 'handle_new_user trigger has been disabled to allow manual profile creation control';