-- Update handle_new_user function to support account types and create affiliate/client records
-- This migration enhances the handle_new_user function to:
-- 1. Support 'affiliate' or 'client' account types from user metadata
-- 2. Use businessName from businessInfo for account name
-- 3. Create corresponding affiliate or client records after account creation
-- 4. Set profile role to 'admin' (first profile of an account gets admin role)

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the enhanced handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_account_id UUID;
    v_account_name TEXT;
    v_full_name TEXT;
    v_account_type account_type;
    v_business_name TEXT;
BEGIN
    -- Extract data from user metadata
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'client')::account_type;
    v_business_name := NEW.raw_user_meta_data->'business_info'->>'businessName';
    
    -- Use businessName if available, otherwise fallback to full_name or email prefix
    v_account_name := COALESCE(
        NULLIF(v_business_name, ''),
        v_full_name,
        split_part(NEW.email, '@', 1)
    );
    
    -- Create account with the specified type
    INSERT INTO accounts (name, type)
    VALUES (v_account_name, v_account_type)
    RETURNING id INTO v_account_id;
    
    -- Create profile linked to the new account with admin role (first profile gets admin)
    INSERT INTO profiles (id, email, full_name, role, account_id)
    VALUES (
        NEW.id, 
        NEW.email, 
        v_full_name,
        'admin',
        v_account_id
    );
    
    -- Create corresponding affiliate or client record
    IF v_account_type = 'affiliate' THEN
        -- Insert into affiliates table with minimal required fields
        INSERT INTO affiliates (account_id)
        VALUES (v_account_id);
    ELSE
        -- Insert into clients table with required fields only
        INSERT INTO clients (full_name, email, account_id, user_id, created_by)
        VALUES (v_full_name, NEW.email, v_account_id, NEW.id, NEW.id);
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise it
        RAISE EXCEPTION 'Error in handle_new_user for user % (type: %): %', NEW.email, v_account_type, SQLERRM;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION handle_new_user() IS 'Creates account, profile, and affiliate/client records when a new user is registered. First profile gets admin role.';