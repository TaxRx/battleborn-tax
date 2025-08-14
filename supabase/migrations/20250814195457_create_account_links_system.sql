-- Create account_links table and can_access_account function
-- Replaces account_client_access with more flexible account-to-account linking

-- Create account_links table
CREATE TABLE IF NOT EXISTS public.account_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    target_account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    access_level text NOT NULL DEFAULT 'view' CHECK (access_level IN ('admin', 'view')),
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone DEFAULT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id),
    notes text,
    
    -- Prevent self-linking and duplicate links
    CONSTRAINT account_links_no_self_link CHECK (source_account_id != target_account_id),
    CONSTRAINT account_links_unique_active UNIQUE (source_account_id, target_account_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_links_source_account ON public.account_links(source_account_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_account_links_target_account ON public.account_links(target_account_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_account_links_expires_at ON public.account_links(expires_at) WHERE expires_at IS NOT NULL;

-- Add RLS policies
ALTER TABLE public.account_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "account_links_view_own" ON public.account_links;
DROP POLICY IF EXISTS "account_links_admin_all" ON public.account_links;
DROP POLICY IF EXISTS "account_links_operator_manage" ON public.account_links;

-- Policy: Users can view links where their account is involved
CREATE POLICY "account_links_view_own" ON public.account_links
    FOR SELECT 
    USING (
        source_account_id IN (
            SELECT account_id FROM profiles WHERE id = auth.uid()
        ) OR
        target_account_id IN (
            SELECT account_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Admin accounts can manage all links
CREATE POLICY "account_links_admin_all" ON public.account_links
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN accounts a ON p.account_id = a.id 
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- Policy: Operator accounts can manage links they're authorized for
CREATE POLICY "account_links_operator_manage" ON public.account_links
    FOR ALL 
    USING (
        source_account_id IN (
            SELECT account_id FROM profiles p 
            JOIN accounts a ON p.account_id = a.id 
            WHERE p.id = auth.uid() AND a.type = 'operator'
        )
    );

-- Add trigger for updated_at
-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS account_links_update_updated_at ON public.account_links;
DROP FUNCTION IF EXISTS update_account_links_updated_at();

CREATE OR REPLACE FUNCTION update_account_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER account_links_update_updated_at
    BEFORE UPDATE ON public.account_links
    FOR EACH ROW
    EXECUTE FUNCTION update_account_links_updated_at();

-- Create can_access_account function
CREATE OR REPLACE FUNCTION public.can_access_account(
    p_user_id uuid, 
    p_target_account_id uuid, 
    p_permission_level text DEFAULT 'admin'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    user_profile_record RECORD;
    target_account_record RECORD;
BEGIN
    -- Validate inputs - return false for NULL parameters
    IF p_user_id IS NULL OR p_target_account_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Validate permission level parameter
    IF p_permission_level NOT IN ('admin', 'view') THEN
        RAISE EXCEPTION 'Invalid permission level: %. Must be ''admin'' or ''view''.', p_permission_level;
    END IF;
    
    -- Get user's profile and associated account information
    SELECT p.*, a.type as account_type, a.status as account_status
    INTO user_profile_record
    FROM profiles p
    JOIN accounts a ON p.account_id = a.id
    WHERE p.id = p_user_id
    AND (p.status IS NULL OR p.status = 'active')
    AND a.status = 'active';
    
    -- If no active profile found, user cannot access
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get target account information
    SELECT * INTO target_account_record
    FROM accounts
    WHERE id = p_target_account_id
    AND status = 'active';
    
    -- If target account doesn't exist or isn't active, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Access Rule 1: Admin accounts have unrestricted access to all accounts
    IF user_profile_record.account_type = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Access Rule 2: Self-access (users can access their own account)
    -- For admin permission level, user must have admin role within their account
    IF user_profile_record.account_id = p_target_account_id THEN
        RETURN p_permission_level = 'view' OR user_profile_record.role = 'admin';
    END IF;
    
    -- Access Rule 3: Account linking rules based on account types
    -- Check if there's an active link from user's account to target account
    IF EXISTS (
        SELECT 1 
        FROM account_links al
        WHERE al.source_account_id = user_profile_record.account_id
        AND al.target_account_id = p_target_account_id
        AND al.is_active = TRUE
        AND (al.expires_at IS NULL OR al.expires_at > NOW())
        AND (p_permission_level = 'view' OR al.access_level = 'admin')
    ) THEN
        -- Validate the link is allowed based on account type rules
        -- operator -> can link to (client, affiliate, expert)
        IF user_profile_record.account_type = 'operator' 
           AND target_account_record.type IN ('client', 'affiliate', 'expert') THEN
            RETURN p_permission_level = 'view' OR user_profile_record.role = 'admin';
        END IF;
        
        -- affiliate/expert -> can link to client accounts only
        IF user_profile_record.account_type IN ('affiliate', 'expert') 
           AND target_account_record.type = 'client' THEN
            RETURN p_permission_level = 'view' OR user_profile_record.role = 'admin';
        END IF;
    END IF;
    
    -- Access Rule 4: Client accounts cannot be source of links (handled above in self-access)
    -- but they can be targets, so no additional logic needed
    
    -- Default: user does not have access to this account
    RETURN FALSE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error for debugging and return false for security
        RAISE NOTICE 'Error in can_access_account(%, %): %', p_user_id, p_target_account_id, SQLERRM;
        RETURN FALSE;
END;
$function$;

-- Create helper function to get account_id from client_id
CREATE OR REPLACE FUNCTION public.get_account_id_by_client(p_client_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    account_uuid uuid;
BEGIN
    -- Input validation
    IF p_client_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get account_id from clients table
    SELECT account_id INTO account_uuid
    FROM clients
    WHERE id = p_client_id;
    
    RETURN account_uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return NULL for any errors rather than throwing
        RETURN NULL;
END;
$function$;

-- Create composite function to get account_id from any table/record combination
CREATE OR REPLACE FUNCTION public.get_account_id(
  p_table_name text,                              -- Source table name
  p_record_id uuid,                               -- Record ID in source table  
  p_join_table text DEFAULT NULL,                -- Optional join table (has client_id)
  p_foreign_key_column text DEFAULT 'business_id' -- Foreign key column (defaults to business_id)
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    client_uuid uuid;
BEGIN
    -- Input validation
    IF p_table_name IS NULL OR p_record_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Special case 1: Direct account lookup
    IF p_table_name = 'accounts' THEN
        RETURN p_record_id;
    END IF;
    
    -- Special case 2: Direct client lookup
    IF p_table_name = 'clients' THEN
        RETURN get_account_id_by_client(p_record_id);
    END IF;
    
    -- General case: Get client_id first, then account_id
    SELECT get_client_id(p_table_name, p_record_id, p_join_table, p_foreign_key_column) INTO client_uuid;
    
    -- If no client_id found, return NULL
    IF client_uuid IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get and return account_id from the client_id
    RETURN get_account_id_by_client(client_uuid);
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return NULL for any errors rather than throwing
        RETURN NULL;
END;
$function$;

-- Add helpful comments
COMMENT ON TABLE public.account_links IS 
'Links between accounts for access control. Rules:
- admin: no links needed (global access)  
- operator: can link to client/affiliate/expert accounts
- affiliate/expert: can link to client accounts only
- client: cannot be source of links (only target)';

COMMENT ON FUNCTION public.can_access_account(uuid, uuid, text) IS 
'Checks if a user can access a target account based on account linking rules.
Similar to can_access_client but works at the account level.
Returns true if access is allowed, false otherwise.';

COMMENT ON FUNCTION public.get_account_id_by_client(uuid) IS 
'Helper function to get account_id from client_id.
Usage: get_account_id_by_client(client_uuid)';

COMMENT ON FUNCTION public.get_account_id(text, uuid, text, text) IS 
'Composite function to get account_id from any table/record combination.
Special cases: accounts table returns record_id directly, clients table uses direct lookup.
General case chains: get_client_id() -> get_account_id_by_client().
Usage examples:
- Accounts: get_account_id(''accounts'', account_id)
- Clients: get_account_id(''clients'', client_id) 
- Businesses: get_account_id(''rd_businesses'', business_id)
- Years: get_account_id(''rd_business_years'', year_id, ''rd_businesses'')';

-- Migration note: account_client_access table can be deprecated after this is implemented