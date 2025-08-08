-- Add function to determine if a user can access a specific client
-- This function evaluates access permissions based on account hierarchy and roles

-- Drop old function if it exists (in case it was created with the old name)
DROP FUNCTION IF EXISTS public.is_user_admin_on_client(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_user_admin_on_client(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.can_access_client(
    p_user_id UUID,
    p_client_id UUID,
    p_permission_level TEXT DEFAULT 'admin'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile_record RECORD;
    client_record RECORD;
BEGIN
    -- Validate inputs - return false for NULL parameters
    IF p_user_id IS NULL OR p_client_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Validate permission level parameter
    IF p_permission_level NOT IN ('admin', 'view') THEN
        RAISE EXCEPTION 'Invalid permission level: %. Must be ''admin'' or ''view''.', p_permission_level;
    END IF;
    
    -- Get user's profile and associated account information
    SELECT p.*, a.type as account_type
    INTO user_profile_record
    FROM profiles p
    JOIN accounts a ON p.account_id = a.id
    WHERE p.id = p_user_id
    AND (p.status IS NULL OR p.status = 'active')
    AND a.status = 'active';
    
    -- If no active profile found, user is not an admin
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get client information
    SELECT * INTO client_record
    FROM clients
    WHERE id = p_client_id;
    
    -- If client doesn't exist, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Admin Rule 1: Global admin access
    -- Admin account type has unrestricted access to all clients
    IF user_profile_record.account_type = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Admin Rule 2: Client account direct ownership
    -- Client account type can access their own clients with role-based permissions
    IF user_profile_record.account_type = 'client' THEN
        IF user_profile_record.account_id = client_record.account_id 
           AND (p_permission_level = 'view' OR user_profile_record.role = 'admin') THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Admin Rule 3: Cross-account access via account_client_access table
    -- For operator, affiliate, expert, and other account types
    IF user_profile_record.account_type IN ('operator', 'affiliate', 'expert') THEN
        -- Check if there's an active access record in the link table
        IF EXISTS (
            SELECT 1 
            FROM account_client_access aca
            WHERE aca.account_id = user_profile_record.account_id
            AND aca.client_id = client_record.id
            AND aca.is_active = TRUE
            AND (aca.expires_at IS NULL OR aca.expires_at > NOW())
            AND (p_permission_level = 'view' OR aca.access_level = 'admin')
        ) THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Default: user does not have admin privileges on this client
    RETURN FALSE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error for debugging and return false for security
        RAISE NOTICE 'Error in can_access_client(%, %): %', p_user_id, p_client_id, SQLERRM;
        RETURN FALSE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.can_access_client(UUID, UUID, TEXT) IS 
'Determines if a user (by profile ID) has specified permission level on a specific client.
Uses a 3-tier access control system based on account type.

Parameters:
- p_user_id: Profile UUID of the user
- p_client_id: Client UUID to check permissions for  
- p_permission_level: ''admin'' (default) or ''view''

Access Rules:
1. Admin accounts: Global access to all clients (unrestricted)
2. Client accounts: Direct ownership access based on account_id match and role requirements
3. Other accounts (operator, affiliate, expert): Access via account_client_access table

Permission Levels:
- ''admin'': Full administrative access (requires admin role or admin access level)
- ''view'': Read-only access (allows any role or view/admin access level)

Returns FALSE for invalid inputs, inactive accounts, non-existent clients, or unauthorized access.';