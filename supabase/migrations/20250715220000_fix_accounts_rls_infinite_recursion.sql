-- Fix infinite recursion in accounts RLS policies
-- The issue is that accounts policies reference profiles which may reference accounts, creating circular dependency

BEGIN;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;

-- Create a function to get user's account_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION get_user_account_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT account_id FROM public.profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION user_is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_id AND p.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has admin account type without recursion
CREATE OR REPLACE FUNCTION user_has_admin_account(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_account_id UUID;
  account_type_val TEXT;
BEGIN
  -- Get user's account_id
  SELECT account_id INTO user_account_id FROM public.profiles WHERE id = user_id;
  
  IF user_account_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get account type directly
  SELECT type INTO account_type_val FROM public.accounts WHERE id = user_account_id;
  
  RETURN account_type_val = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate accounts policies without circular dependency
CREATE POLICY "Users can view their own account" ON public.accounts
    FOR SELECT USING (id = get_user_account_id(auth.uid()));

CREATE POLICY "Admins can view all accounts" ON public.accounts
    FOR ALL USING (
        user_is_admin(auth.uid()) OR user_has_admin_account(auth.uid())
    );

-- Update account_tool_access policies to use the new functions
DROP POLICY IF EXISTS "Users can view their account tool access" ON public.account_tool_access;
DROP POLICY IF EXISTS "Admins can manage all tool access" ON public.account_tool_access;

CREATE POLICY "Users can view their account tool access" ON public.account_tool_access
    FOR SELECT USING (account_id = get_user_account_id(auth.uid()));

CREATE POLICY "Admins can manage all tool access" ON public.account_tool_access
    FOR ALL USING (
        user_is_admin(auth.uid()) OR user_has_admin_account(auth.uid())
    );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_account_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_admin_account(UUID) TO authenticated;

COMMIT;