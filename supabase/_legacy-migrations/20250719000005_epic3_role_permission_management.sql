-- Epic 3 Sprint 3: Role and Permission Management System
-- File: 20250724000005_epic3_role_permission_management.sql
-- Purpose: Comprehensive role assignment and permission management for profiles
-- Story: 3.3 - Role and Permission Management (8 points)

BEGIN;

-- ========= PART 1: EXTENDED ROLE MANAGEMENT TABLES =========

-- Create profile roles table for granular role assignments
CREATE TABLE IF NOT EXISTS public.profile_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    scope VARCHAR(50) DEFAULT 'global',
    scope_id UUID,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.profile_roles IS 'Granular role assignments for profiles with scope and expiration support';

-- Add constraints for profile roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_role_scope' 
    AND conrelid = 'public.profile_roles'::regclass
  ) THEN
    ALTER TABLE public.profile_roles
    ADD CONSTRAINT check_role_scope 
    CHECK (scope IN ('global', 'account', 'tool', 'client', 'project'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_role_name' 
    AND conrelid = 'public.profile_roles'::regclass
  ) THEN
    ALTER TABLE public.profile_roles
    ADD CONSTRAINT check_role_name 
    CHECK (role_name IN (
        'super_admin', 'admin', 'affiliate_manager', 'affiliate', 
        'client_manager', 'client', 'expert', 'consultant', 
        'tool_admin', 'read_only', 'guest'
    ));
  END IF;
END $$;

-- Create profile permissions table for fine-grained permissions
CREATE TABLE IF NOT EXISTS public.profile_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    action VARCHAR(50) NOT NULL,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.profile_permissions IS 'Fine-grained permission assignments for profiles';

-- Add constraints for profile permissions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_resource_type' 
    AND conrelid = 'public.profile_permissions'::regclass
  ) THEN
    ALTER TABLE public.profile_permissions
    ADD CONSTRAINT check_resource_type 
    CHECK (resource_type IN (
        'account', 'profile', 'tool', 'client', 'invoice', 'report', 
        'calculation', 'document', 'system', 'analytics', 'billing'
    ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_permission_action' 
    AND conrelid = 'public.profile_permissions'::regclass
  ) THEN
    ALTER TABLE public.profile_permissions
    ADD CONSTRAINT check_permission_action 
    CHECK (action IN (
        'create', 'read', 'update', 'delete', 'manage', 'assign', 
        'export', 'import', 'approve', 'execute', 'configure', 'monitor'
    ));
  END IF;
END $$;

-- Create role definitions table for role templates
CREATE TABLE IF NOT EXISTS public.role_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    default_permissions JSONB DEFAULT '[]',
    role_hierarchy_level INTEGER DEFAULT 0,
    can_assign_roles VARCHAR(100)[] DEFAULT '{}',
    max_scope VARCHAR(50) DEFAULT 'global',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.role_definitions IS 'Role templates and definitions with default permissions and hierarchy';

-- ========= PART 2: CREATE PERFORMANCE INDEXES =========

-- Indexes for profile_roles
CREATE INDEX IF NOT EXISTS idx_profile_roles_profile_id ON public.profile_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_roles_role_name ON public.profile_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_profile_roles_scope ON public.profile_roles(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_profile_roles_granted_by ON public.profile_roles(granted_by);
CREATE INDEX IF NOT EXISTS idx_profile_roles_expires_at ON public.profile_roles(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profile_roles_active ON public.profile_roles(is_active, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profile_roles_profile_active 
    ON public.profile_roles(profile_id, is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_profile_roles_role_scope_active 
    ON public.profile_roles(role_name, scope, is_active);

-- Indexes for profile_permissions
CREATE INDEX IF NOT EXISTS idx_profile_permissions_profile_id ON public.profile_permissions(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_permissions_permission_name ON public.profile_permissions(permission_name);
CREATE INDEX IF NOT EXISTS idx_profile_permissions_resource ON public.profile_permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_profile_permissions_action ON public.profile_permissions(action);
CREATE INDEX IF NOT EXISTS idx_profile_permissions_granted_by ON public.profile_permissions(granted_by);
CREATE INDEX IF NOT EXISTS idx_profile_permissions_expires_at ON public.profile_permissions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profile_permissions_active ON public.profile_permissions(is_active, created_at DESC);

-- Composite indexes for permission checks
CREATE INDEX IF NOT EXISTS idx_profile_permissions_check 
    ON public.profile_permissions(profile_id, resource_type, action, is_active);

CREATE INDEX IF NOT EXISTS idx_profile_permissions_resource_active 
    ON public.profile_permissions(resource_type, resource_id, is_active);

-- Indexes for role_definitions
CREATE INDEX IF NOT EXISTS idx_role_definitions_role_name ON public.role_definitions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_definitions_hierarchy ON public.role_definitions(role_hierarchy_level DESC);
CREATE INDEX IF NOT EXISTS idx_role_definitions_active ON public.role_definitions(is_active);

-- ========= PART 3: ROLE MANAGEMENT FUNCTIONS =========

-- Function to assign role to profile
CREATE OR REPLACE FUNCTION assign_profile_role(
    p_profile_id UUID,
    p_role_name VARCHAR,
    p_scope VARCHAR DEFAULT 'global',
    p_scope_id UUID DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    role_id UUID,
    message TEXT
) AS $$
DECLARE
    v_role_id UUID;
    v_granted_by UUID;
    existing_role_id UUID;
BEGIN
    -- Get current user
    v_granted_by := auth.uid();
    
    -- Check if role already exists for this profile and scope
    SELECT id INTO existing_role_id 
    FROM public.profile_roles 
    WHERE profile_id = p_profile_id 
      AND role_name = p_role_name 
      AND scope = p_scope 
      AND COALESCE(scope_id::text, '') = COALESCE(p_scope_id::text, '')
      AND is_active = true;
    
    IF existing_role_id IS NOT NULL THEN
        RETURN QUERY SELECT 
            FALSE as success,
            existing_role_id as role_id,
            'Role already assigned to this profile in the specified scope'::TEXT as message;
        RETURN;
    END IF;
    
    -- Validate role name exists in role_definitions
    IF NOT EXISTS (SELECT 1 FROM public.role_definitions WHERE role_name = p_role_name AND is_active = true) THEN
        RETURN QUERY SELECT 
            FALSE as success,
            NULL::UUID as role_id,
            'Invalid role name specified'::TEXT as message;
        RETURN;
    END IF;
    
    -- Insert new role assignment
    INSERT INTO public.profile_roles (
        profile_id, role_name, scope, scope_id, granted_by, expires_at, notes
    ) VALUES (
        p_profile_id, p_role_name, p_scope, p_scope_id, v_granted_by, p_expires_at, p_notes
    ) RETURNING id INTO v_role_id;
    
    -- Log the role assignment
    PERFORM log_profile_activity(
        p_profile_id,
        'role_assigned',
        'role',
        v_role_id,
        'Role assigned: ' || p_role_name || ' (' || p_scope || ')',
        jsonb_build_object(
            'role_name', p_role_name,
            'scope', p_scope,
            'scope_id', p_scope_id,
            'expires_at', p_expires_at,
            'granted_by', v_granted_by
        )
    );
    
    RETURN QUERY SELECT 
        TRUE as success,
        v_role_id as role_id,
        'Role successfully assigned'::TEXT as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_profile_role IS 'Assign a role to a profile with scope and expiration support';

-- Function to revoke role from profile
CREATE OR REPLACE FUNCTION revoke_profile_role(
    p_role_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_role_record RECORD;
    v_revoked_by UUID;
BEGIN
    -- Get current user
    v_revoked_by := auth.uid();
    
    -- Get role details before revoking
    SELECT * INTO v_role_record 
    FROM public.profile_roles 
    WHERE id = p_role_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE as success,
            'Role assignment not found or already inactive'::TEXT as message;
        RETURN;
    END IF;
    
    -- Deactivate the role
    UPDATE public.profile_roles 
    SET 
        is_active = false,
        updated_at = NOW(),
        notes = COALESCE(notes, '') || CASE 
            WHEN notes IS NOT NULL THEN E'\n' 
            ELSE '' 
        END || 'Revoked: ' || COALESCE(p_reason, 'No reason provided')
    WHERE id = p_role_id;
    
    -- Log the role revocation
    PERFORM log_profile_activity(
        v_role_record.profile_id,
        'role_removed',
        'role',
        p_role_id,
        'Role revoked: ' || v_role_record.role_name || ' (' || v_role_record.scope || ')',
        jsonb_build_object(
            'role_name', v_role_record.role_name,
            'scope', v_role_record.scope,
            'scope_id', v_role_record.scope_id,
            'revocation_reason', p_reason,
            'revoked_by', v_revoked_by
        )
    );
    
    RETURN QUERY SELECT 
        TRUE as success,
        'Role successfully revoked'::TEXT as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION revoke_profile_role IS 'Revoke a role assignment from a profile';

-- Function to grant specific permission to profile
CREATE OR REPLACE FUNCTION grant_profile_permission(
    p_profile_id UUID,
    p_permission_name VARCHAR,
    p_resource_type VARCHAR,
    p_action VARCHAR,
    p_resource_id UUID DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_conditions JSONB DEFAULT '{}'
) RETURNS TABLE (
    success BOOLEAN,
    permission_id UUID,
    message TEXT
) AS $$
DECLARE
    v_permission_id UUID;
    v_granted_by UUID;
    existing_permission_id UUID;
BEGIN
    -- Get current user
    v_granted_by := auth.uid();
    
    -- Check if permission already exists
    SELECT id INTO existing_permission_id 
    FROM public.profile_permissions 
    WHERE profile_id = p_profile_id 
      AND permission_name = p_permission_name
      AND resource_type = p_resource_type 
      AND action = p_action
      AND COALESCE(resource_id::text, '') = COALESCE(p_resource_id::text, '')
      AND is_active = true;
    
    IF existing_permission_id IS NOT NULL THEN
        RETURN QUERY SELECT 
            FALSE as success,
            existing_permission_id as permission_id,
            'Permission already granted to this profile'::TEXT as message;
        RETURN;
    END IF;
    
    -- Insert new permission
    INSERT INTO public.profile_permissions (
        profile_id, permission_name, resource_type, action, resource_id, 
        granted_by, expires_at, conditions
    ) VALUES (
        p_profile_id, p_permission_name, p_resource_type, p_action, p_resource_id,
        v_granted_by, p_expires_at, p_conditions
    ) RETURNING id INTO v_permission_id;
    
    -- Log the permission grant
    PERFORM log_profile_activity(
        p_profile_id,
        'permission_granted',
        'permission',
        v_permission_id,
        'Permission granted: ' || p_permission_name || ' on ' || p_resource_type,
        jsonb_build_object(
            'permission_name', p_permission_name,
            'resource_type', p_resource_type,
            'resource_id', p_resource_id,
            'action', p_action,
            'expires_at', p_expires_at,
            'conditions', p_conditions,
            'granted_by', v_granted_by
        )
    );
    
    RETURN QUERY SELECT 
        TRUE as success,
        v_permission_id as permission_id,
        'Permission successfully granted'::TEXT as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_profile_permission IS 'Grant a specific permission to a profile';

-- ========= PART 4: PERMISSION CHECK FUNCTIONS =========

-- Function to check if profile has specific permission
CREATE OR REPLACE FUNCTION check_profile_permission(
    p_profile_id UUID,
    p_resource_type VARCHAR,
    p_action VARCHAR,
    p_resource_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Check direct permissions
    SELECT true INTO has_permission
    FROM public.profile_permissions pp
    WHERE pp.profile_id = p_profile_id
      AND pp.resource_type = p_resource_type
      AND pp.action = p_action
      AND (p_resource_id IS NULL OR pp.resource_id = p_resource_id OR pp.resource_id IS NULL)
      AND pp.is_active = true
      AND (pp.expires_at IS NULL OR pp.expires_at > NOW())
    LIMIT 1;
    
    IF has_permission THEN
        RETURN TRUE;
    END IF;
    
    -- Check role-based permissions (simplified - would integrate with role definitions)
    SELECT true INTO has_permission
    FROM public.profile_roles pr
    JOIN public.profiles p ON pr.profile_id = p.id
    WHERE pr.profile_id = p_profile_id
      AND pr.is_active = true
      AND (pr.expires_at IS NULL OR pr.expires_at > NOW())
      AND (
        (pr.role_name = 'super_admin') OR
        (pr.role_name = 'admin' AND p_resource_type != 'system') OR
        (pr.role_name = 'affiliate_manager' AND p_resource_type IN ('client', 'affiliate', 'tool')) OR
        (pr.role_name = 'client_manager' AND p_resource_type = 'client')
      )
    LIMIT 1;
    
    RETURN COALESCE(has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_profile_permission IS 'Check if a profile has a specific permission';

-- Function to get profile effective permissions
CREATE OR REPLACE FUNCTION get_profile_effective_permissions(p_profile_id UUID)
RETURNS TABLE (
    permission_source VARCHAR,
    permission_name VARCHAR,
    resource_type VARCHAR,
    resource_id UUID,
    action VARCHAR,
    scope VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE,
    conditions JSONB
) AS $$
BEGIN
    -- Return direct permissions
    RETURN QUERY
    SELECT 
        'direct'::VARCHAR as permission_source,
        pp.permission_name,
        pp.resource_type,
        pp.resource_id,
        pp.action,
        'explicit'::VARCHAR as scope,
        pp.expires_at,
        pp.conditions
    FROM public.profile_permissions pp
    WHERE pp.profile_id = p_profile_id
      AND pp.is_active = true
      AND (pp.expires_at IS NULL OR pp.expires_at > NOW());
    
    -- Return role-based permissions (simplified mapping)
    RETURN QUERY
    SELECT 
        'role'::VARCHAR as permission_source,
        'role_' || pr.role_name as permission_name,
        'all'::VARCHAR as resource_type,
        NULL::UUID as resource_id,
        CASE 
            WHEN pr.role_name = 'super_admin' THEN 'manage'
            WHEN pr.role_name = 'admin' THEN 'manage'
            WHEN pr.role_name = 'affiliate_manager' THEN 'read'
            ELSE 'read'
        END as action,
        pr.scope,
        pr.expires_at,
        pr.metadata as conditions
    FROM public.profile_roles pr
    WHERE pr.profile_id = p_profile_id
      AND pr.is_active = true
      AND (pr.expires_at IS NULL OR pr.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_profile_effective_permissions IS 'Get all effective permissions for a profile from roles and direct grants';

-- ========= PART 5: POPULATE ROLE DEFINITIONS =========

-- Insert standard role definitions
INSERT INTO public.role_definitions (
    role_name, display_name, description, is_system_role, role_hierarchy_level, 
    can_assign_roles, max_scope, default_permissions
) VALUES 
    ('super_admin', 'Super Administrator', 'Full system access with all permissions', true, 100, 
     '{"super_admin","admin","affiliate_manager","affiliate","client_manager","client","expert","consultant","tool_admin","read_only","guest"}', 
     'global', '["system:*:*", "account:*:*", "profile:*:*", "tool:*:*"]'),
    
    ('admin', 'Administrator', 'Administrative access to most system functions', true, 90, 
     '{"affiliate_manager","affiliate","client_manager","client","expert","consultant","read_only","guest"}', 
     'global', '["account:*:manage", "profile:*:manage", "tool:*:read", "client:*:manage"]'),
    
    ('affiliate_manager', 'Affiliate Manager', 'Manage affiliate accounts and their clients', true, 70,
     '{"affiliate","client","read_only","guest"}', 
     'account', '["client:*:manage", "affiliate:*:read", "tool:*:read"]'),
    
    ('affiliate', 'Affiliate', 'Standard affiliate user access', true, 50,
     '{"client","read_only","guest"}', 
     'account', '["client:own:manage", "tool:assigned:read", "calculation:own:manage"]'),
    
    ('client_manager', 'Client Manager', 'Manage client accounts and data', true, 60,
     '{"client","read_only","guest"}', 
     'account', '["client:*:manage", "calculation:*:read"]'),
    
    ('client', 'Client', 'Client user with limited access', true, 30,
     '{"guest"}', 
     'account', '["calculation:own:read", "document:own:read", "report:own:read"]'),
    
    ('expert', 'Expert Consultant', 'Expert level access for consulting', true, 80,
     '{"consultant","read_only","guest"}', 
     'global', '["tool:all:read", "calculation:*:read", "report:*:create"]'),
    
    ('consultant', 'Consultant', 'Consulting access with calculation capabilities', true, 65,
     '{"read_only","guest"}', 
     'account', '["calculation:*:read", "tool:assigned:read", "report:own:create"]'),
    
    ('tool_admin', 'Tool Administrator', 'Administer specific tools and their access', true, 75,
     '{"read_only","guest"}', 
     'tool', '["tool:assigned:manage", "account:*:read"]'),
    
    ('read_only', 'Read Only', 'Read-only access to assigned resources', true, 20,
     '{"guest"}', 
     'account', '["*:assigned:read"]'),
    
    ('guest', 'Guest', 'Minimal guest access', true, 10,
     '{}', 
     'account', '["profile:own:read"]')
ON CONFLICT (role_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    role_hierarchy_level = EXCLUDED.role_hierarchy_level,
    can_assign_roles = EXCLUDED.can_assign_roles,
    max_scope = EXCLUDED.max_scope,
    default_permissions = EXCLUDED.default_permissions,
    updated_at = NOW();

-- ========= PART 6: CREATE HELPER VIEWS =========

-- View for active profile roles with details
CREATE OR REPLACE VIEW active_profile_roles AS
SELECT 
    pr.id,
    pr.profile_id,
    p.full_name as profile_name,
    p.email as profile_email,
    pr.role_name,
    rd.display_name as role_display_name,
    rd.description as role_description,
    pr.scope,
    pr.scope_id,
    pr.granted_by,
    granted_by_profile.full_name as granted_by_name,
    pr.granted_at,
    pr.expires_at,
    pr.is_active,
    pr.notes,
    pr.metadata,
    CASE 
        WHEN pr.expires_at IS NULL THEN false
        WHEN pr.expires_at <= NOW() THEN true
        ELSE false
    END as is_expired,
    CASE 
        WHEN pr.expires_at IS NULL THEN NULL
        WHEN pr.expires_at <= NOW() + INTERVAL '7 days' THEN true
        ELSE false
    END as expires_soon,
    rd.role_hierarchy_level
FROM public.profile_roles pr
JOIN public.profiles p ON pr.profile_id = p.id
LEFT JOIN public.role_definitions rd ON pr.role_name = rd.role_name
LEFT JOIN public.profiles granted_by_profile ON pr.granted_by = granted_by_profile.id
WHERE pr.is_active = true;

COMMENT ON VIEW active_profile_roles IS 'Active profile role assignments with full details and computed fields';

-- ========= PART 7: ENABLE ROW LEVEL SECURITY =========

ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;

-- ========= PART 8: CREATE RLS POLICIES =========

-- Profile roles policies
CREATE POLICY "Users can view their own roles" ON public.profile_roles
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage all profile roles" ON public.profile_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- Profile permissions policies
CREATE POLICY "Users can view their own permissions" ON public.profile_permissions
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage all profile permissions" ON public.profile_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- Role definitions policies
CREATE POLICY "Everyone can view role definitions" ON public.role_definitions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage role definitions" ON public.role_definitions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- ========= PART 9: GRANT PERMISSIONS =========

-- Grant execute permissions for role management functions
GRANT EXECUTE ON FUNCTION assign_profile_role(UUID, VARCHAR, VARCHAR, UUID, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_profile_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_profile_permission(UUID, VARCHAR, VARCHAR, VARCHAR, UUID, TIMESTAMP WITH TIME ZONE, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_profile_permission(UUID, VARCHAR, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_effective_permissions(UUID) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.profile_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profile_permissions TO authenticated;
GRANT SELECT ON public.role_definitions TO authenticated;
GRANT UPDATE ON public.role_definitions TO authenticated; -- For admin updates

-- Grant view permissions
GRANT SELECT ON active_profile_roles TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;