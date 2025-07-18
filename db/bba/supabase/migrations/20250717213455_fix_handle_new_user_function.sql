-- Fix #1: Fix handle_new_user function to create account then profile
-- This migration fixes the handle_new_user trigger function to:
-- 1. Create a client account first
-- 2. Then create a profile linked to that account
-- 3. Handle user metadata properly with fallbacks

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_account_id UUID;
    v_account_name TEXT;
    v_full_name TEXT;
BEGIN
    -- Extract full_name from user metadata, fallback to email prefix
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    
    -- Use full_name for account name, fallback to email prefix with suffix
    v_account_name := COALESCE(v_full_name, split_part(NEW.email, '@', 1)) || '''s Account';
    
    -- Create a client account first
    INSERT INTO accounts (name, type)
    VALUES (v_account_name, 'client'::account_type)
    RETURNING id INTO v_account_id;
    
    -- Create profile linked to the new account
    INSERT INTO profiles (id, email, full_name, role, account_id)
    VALUES (
        NEW.id, 
        NEW.email, 
        v_full_name,
        'user',
        v_account_id
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise it
        RAISE EXCEPTION 'Error in handle_new_user for user %: %', NEW.email, SQLERRM;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION handle_new_user() IS 'Creates a client account and profile when a new user is registered via auth.signUp()';