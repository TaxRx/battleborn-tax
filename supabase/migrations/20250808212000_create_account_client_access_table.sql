-- Create account_client_access table to manage cross-account client access
-- This table allows operators, affiliates, and experts to have controlled access to specific clients

CREATE TABLE public.account_client_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL DEFAULT 'view',
    granted_by UUID REFERENCES profiles(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_account_client_access_account_id ON account_client_access(account_id);
CREATE INDEX idx_account_client_access_client_id ON account_client_access(client_id);
CREATE INDEX idx_account_client_access_active ON account_client_access(is_active) WHERE is_active = TRUE;

-- Unique constraint to prevent duplicate active access records
CREATE UNIQUE INDEX idx_account_client_access_unique 
ON account_client_access(account_id, client_id) 
WHERE is_active = TRUE;

-- Add check constraint for access levels
ALTER TABLE account_client_access 
ADD CONSTRAINT chk_access_level 
CHECK (access_level IN ('view', 'admin'));

-- Add comment for documentation
COMMENT ON TABLE public.account_client_access IS 
'Manages cross-account access to clients. Allows operators, affiliates, and experts to access specific clients they do not directly own.';

COMMENT ON COLUMN public.account_client_access.access_level IS 
'Access level: ''view'' for read-only access, ''admin'' for full access';

COMMENT ON COLUMN public.account_client_access.expires_at IS 
'Optional expiration date for time-limited access';

COMMENT ON COLUMN public.account_client_access.granted_by IS 
'Profile ID of the user who granted this access';