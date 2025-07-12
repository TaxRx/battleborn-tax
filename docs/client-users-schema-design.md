# Client-Users Junction Table Schema Design

**Project**: TaxApp Client Portal  
**Feature**: Multi-User Client Access  
**Created**: 2025-01-11  
**Status**: Design Phase

## Overview

The `client_users` table is a junction table that enables a many-to-many relationship between clients and users, allowing multiple users to access a single client's data with different permission levels.

## Use Cases

### Primary Use Cases
1. **Business Owner + Accountant**: Business owner invites their accountant to access tax data
2. **Multiple Business Partners**: Partners in a business need shared access to tax information
3. **Authorized Representatives**: CPAs, tax professionals, or family members with permission
4. **Team Access**: Larger businesses with multiple people managing tax affairs

### Permission Scenarios
- **Owner**: Full access to all data, can invite/remove users, can modify sensitive information
- **Member**: Can view most data, upload documents, but cannot modify core business information
- **Viewer**: Read-only access to reports and basic information
- **Accountant**: Professional role with specific permissions for tax preparation

## Table Schema

```sql
CREATE TABLE client_users (
    -- Primary identifiers
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role and permissions
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer', 'accountant')),
    permissions JSONB DEFAULT '{}',
    
    -- Invitation tracking
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invitation_token UUID DEFAULT gen_random_uuid(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT, -- Optional notes about this user's access
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(client_id, user_id),
    
    -- Ensure at least one owner per client
    CONSTRAINT check_owner_exists CHECK (
        role != 'owner' OR 
        EXISTS (
            SELECT 1 FROM client_users cu 
            WHERE cu.client_id = client_users.client_id 
            AND cu.role = 'owner' 
            AND cu.is_active = true
        )
    )
);
```

## Role Definitions

### Owner Role
**Description**: Full control over the client account
**Permissions**:
- View all data
- Modify all data
- Invite/remove users
- Change user permissions
- Delete client account
- Access billing information

**Default Permissions JSON**:
```json
{
  "read": true,
  "write": true,
  "delete": true,
  "invite_users": true,
  "manage_users": true,
  "view_billing": true,
  "modify_billing": true,
  "download_reports": true,
  "upload_documents": true
}
```

### Member Role
**Description**: Standard access for authorized users
**Permissions**:
- View most data (except sensitive billing)
- Upload documents
- View reports
- Update basic information
- Cannot invite users or access billing

**Default Permissions JSON**:
```json
{
  "read": true,
  "write": false,
  "delete": false,
  "invite_users": false,
  "manage_users": false,
  "view_billing": false,
  "modify_billing": false,
  "download_reports": true,
  "upload_documents": true
}
```

### Viewer Role
**Description**: Read-only access for stakeholders
**Permissions**:
- View reports and basic information
- Cannot modify anything
- Cannot upload documents

**Default Permissions JSON**:
```json
{
  "read": true,
  "write": false,
  "delete": false,
  "invite_users": false,
  "manage_users": false,
  "view_billing": false,
  "modify_billing": false,
  "download_reports": true,
  "upload_documents": false
}
```

### Accountant Role
**Description**: Professional access for tax preparation
**Permissions**:
- View all tax-related data
- Upload/modify tax documents
- Generate reports
- Cannot access billing or invite users

**Default Permissions JSON**:
```json
{
  "read": true,
  "write": true,
  "delete": false,
  "invite_users": false,
  "manage_users": false,
  "view_billing": false,
  "modify_billing": false,
  "download_reports": true,
  "upload_documents": true,
  "modify_tax_data": true
}
```

## Supporting Functions

### Permission Check Function
```sql
CREATE OR REPLACE FUNCTION has_client_access(
    p_client_id UUID, 
    p_permission TEXT DEFAULT 'read'
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_users 
        WHERE client_id = p_client_id 
        AND user_id = auth.uid()
        AND is_active = true
        AND (
            -- Owner has all permissions
            role = 'owner' OR 
            -- Check specific permission in JSON
            (permissions->>p_permission)::boolean = true OR
            -- Default read access for members and viewers
            (p_permission = 'read' AND role IN ('member', 'viewer', 'accountant'))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Get User's Clients Function
```sql
CREATE OR REPLACE FUNCTION get_user_clients(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
    client_id UUID,
    client_name TEXT,
    user_role TEXT,
    permissions JSONB,
    joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cu.client_id,
        c.full_name as client_name,
        cu.role as user_role,
        cu.permissions,
        cu.accepted_at as joined_at
    FROM client_users cu
    JOIN clients c ON c.id = cu.client_id
    WHERE cu.user_id = p_user_id
    AND cu.is_active = true
    AND cu.accepted_at IS NOT NULL
    ORDER BY cu.accepted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## RLS Policies

### Client Users Table Policies
```sql
-- Users can view their own relationships
CREATE POLICY "Users can view own client relationships" ON client_users
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can update their own relationships (limited)
CREATE POLICY "Users can update own relationships" ON client_users
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        -- Can only update accepted_at and notes
        OLD.client_id = NEW.client_id AND
        OLD.user_id = NEW.user_id AND
        OLD.role = NEW.role AND
        OLD.permissions = NEW.permissions
    );

-- Owners can manage their client's user relationships
CREATE POLICY "Owners can manage client users" ON client_users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM client_users cu
            WHERE cu.client_id = client_users.client_id
            AND cu.user_id = auth.uid()
            AND cu.role = 'owner'
            AND cu.is_active = true
        )
    );

-- Admins have full access
CREATE POLICY "Admins have full access" ON client_users
    FOR ALL TO authenticated
    USING (is_admin());
```

### Updated Clients Table Policies
```sql
-- Client users can view their assigned clients
CREATE POLICY "Client users can view assigned clients" ON clients
    FOR SELECT TO authenticated
    USING (has_client_access(id, 'read'));

-- Client users can update clients based on permissions
CREATE POLICY "Client users can update based on permissions" ON clients
    FOR UPDATE TO authenticated
    USING (has_client_access(id, 'write'))
    WITH CHECK (has_client_access(id, 'write'));
```

## Invitation Workflow

### 1. Create Invitation
```sql
-- Admin/Owner creates invitation
INSERT INTO client_users (
    client_id, 
    user_id, 
    role, 
    invited_by,
    permissions
) VALUES (
    'client-uuid',
    'invited-user-uuid',
    'member',
    auth.uid(),
    '{"read": true, "upload_documents": true}'::jsonb
);
```

### 2. Accept Invitation
```sql
-- User accepts invitation
UPDATE client_users 
SET accepted_at = NOW()
WHERE client_id = 'client-uuid' 
AND user_id = auth.uid() 
AND accepted_at IS NULL;
```

## Migration Strategy

### Phase 1: Create Table and Functions
1. Create `client_users` table
2. Create helper functions
3. Create RLS policies

### Phase 2: Migrate Existing Data
1. For each existing client, create an owner relationship with the `created_by` user
2. Validate all clients have at least one owner

### Phase 3: Update Application Logic
1. Update client access checks to use junction table
2. Implement invitation system
3. Add user management UI

## Security Considerations

1. **At least one owner**: Every client must have at least one active owner
2. **Invitation tokens**: Use secure tokens for invitation links
3. **Permission inheritance**: Child tables inherit access through client relationship
4. **Audit trail**: Track who invited whom and when
5. **Soft delete**: Use `is_active` flag instead of hard deletes

## Future Enhancements

1. **Time-limited access**: Add expiration dates for temporary access
2. **IP restrictions**: Limit access to specific IP ranges
3. **Two-factor authentication**: Require 2FA for sensitive operations
4. **Audit logging**: Detailed logging of all permission changes
5. **Notification system**: Email notifications for access changes 