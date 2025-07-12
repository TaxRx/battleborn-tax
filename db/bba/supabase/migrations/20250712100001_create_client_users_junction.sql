-- Migration: Create client_users junction table for multi-user client access
-- Created: 2025-01-11
-- Purpose: Enable multiple users per client with role-based permissions

-- Create client_role enum for role-based permissions
CREATE TYPE client_role AS ENUM (
    'owner',        -- Full access, can manage users and permissions
    'member',       -- Standard access, can view and edit most data
    'viewer',       -- Read-only access to client data
    'accountant'    -- Professional access, can view and edit tax-related data
);

-- Create client_users junction table
CREATE TABLE client_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role client_role NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique client-user combinations
    UNIQUE(client_id, user_id),
    
    -- Ensure at least one owner per client (handled by triggers)
    CONSTRAINT valid_role CHECK (role IN ('owner', 'member', 'viewer', 'accountant'))
);

-- Create indexes for performance
CREATE INDEX idx_client_users_client_id ON client_users(client_id);
CREATE INDEX idx_client_users_user_id ON client_users(user_id);
CREATE INDEX idx_client_users_role ON client_users(role);
CREATE INDEX idx_client_users_active ON client_users(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_client_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_client_users_updated_at
    BEFORE UPDATE ON client_users
    FOR EACH ROW
    EXECUTE FUNCTION update_client_users_updated_at();

-- Create function to ensure at least one owner per client
CREATE OR REPLACE FUNCTION ensure_client_has_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- If deleting or updating an owner, ensure another owner exists
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND OLD.role = 'owner' THEN
        IF NOT EXISTS (
            SELECT 1 FROM client_users 
            WHERE client_id = OLD.client_id 
            AND role = 'owner' 
            AND is_active = true
            AND (TG_OP = 'DELETE' OR id != OLD.id)
        ) THEN
            RAISE EXCEPTION 'Cannot remove the last owner from a client. At least one owner must remain.';
        END IF;
    END IF;
    
    -- If updating role from owner to non-owner, ensure another owner exists
    IF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner' THEN
        IF NOT EXISTS (
            SELECT 1 FROM client_users 
            WHERE client_id = NEW.client_id 
            AND role = 'owner' 
            AND is_active = true
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'Cannot change the last owner role. At least one owner must remain.';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to ensure at least one owner per client
CREATE TRIGGER trigger_ensure_client_has_owner_update
    BEFORE UPDATE ON client_users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_client_has_owner();

CREATE TRIGGER trigger_ensure_client_has_owner_delete
    BEFORE DELETE ON client_users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_client_has_owner();

-- Create RLS policies for client_users table
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own client relationships
CREATE POLICY "Users can view own client relationships" ON client_users
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Client owners can manage all users for their clients
CREATE POLICY "Client owners can manage client users" ON client_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM client_users cu
            WHERE cu.client_id = client_users.client_id
            AND cu.user_id = auth.uid()
            AND cu.role = 'owner'
            AND cu.is_active = true
        )
    );

-- Policy: Admins can manage all client user relationships
CREATE POLICY "Admins can manage all client users" ON client_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role_type = 'ADMIN'
        )
    );

-- Create helper function to check if user has access to client
CREATE OR REPLACE FUNCTION user_has_client_access(check_user_id UUID, check_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_users
        WHERE user_id = check_user_id
        AND client_id = check_client_id
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user's role for a client
CREATE OR REPLACE FUNCTION get_user_client_role(check_user_id UUID, check_client_id UUID)
RETURNS client_role AS $$
DECLARE
    user_role client_role;
BEGIN
    SELECT role INTO user_role
    FROM client_users
    WHERE user_id = check_user_id
    AND client_id = check_client_id
    AND is_active = true;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user has specific role or higher for client
CREATE OR REPLACE FUNCTION user_has_client_role(check_user_id UUID, check_client_id UUID, required_role client_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role client_role;
    role_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- Get user's role for this client
    SELECT role INTO user_role
    FROM client_users
    WHERE user_id = check_user_id
    AND client_id = check_client_id
    AND is_active = true;
    
    -- If no role found, return false
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Define role hierarchy (higher number = more permissions)
    role_hierarchy := CASE user_role
        WHEN 'viewer' THEN 1
        WHEN 'member' THEN 2
        WHEN 'accountant' THEN 3
        WHEN 'owner' THEN 4
        ELSE 0
    END;
    
    required_hierarchy := CASE required_role
        WHEN 'viewer' THEN 1
        WHEN 'member' THEN 2
        WHEN 'accountant' THEN 3
        WHEN 'owner' THEN 4
        ELSE 0
    END;
    
    RETURN role_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE client_users IS 'Junction table enabling multiple users per client with role-based permissions';
COMMENT ON COLUMN client_users.role IS 'User role for this client: owner (full access), member (standard), viewer (read-only), accountant (professional)';
COMMENT ON COLUMN client_users.invited_by IS 'User who invited this user to the client';
COMMENT ON COLUMN client_users.invited_at IS 'When the invitation was sent';
COMMENT ON COLUMN client_users.accepted_at IS 'When the user accepted the invitation';
COMMENT ON COLUMN client_users.is_active IS 'Whether this user relationship is currently active';

COMMENT ON FUNCTION user_has_client_access(UUID, UUID) IS 'Check if user has any access to a client';
COMMENT ON FUNCTION get_user_client_role(UUID, UUID) IS 'Get user role for a specific client';
COMMENT ON FUNCTION user_has_client_role(UUID, UUID, client_role) IS 'Check if user has specific role or higher for a client'; 