# Epic 0: Security Hardening Plan

**Project**: TaxApp Security Hardening
**Epic Owner**: Security/DevOps Team
**Created**: 2025-01-11
**Priority**: CRITICAL - BLOCKING
**Status**: ✅ **DATABASE MIGRATIONS COMPLETED**

## Epic Progress Update - 2025-01-11

### ✅ **COMPLETED: Database Foundation**
- **Migration 1**: `client_users` junction table created with full role-based permissions
- **Migration 2**: All client-related RLS policies updated for multi-user access
- **Migration 3**: Security cleanup and monitoring tools implemented

### 📋 **Migration Files Created:**
1. `taxapp/db/bba/supabase/migrations/20250111000001_create_client_users_junction.sql`
2. `taxapp/db/bba/supabase/migrations/20250111000002_update_client_rls_policies.sql`
3. `taxapp/db/bba/supabase/migrations/20250111000003_security_cleanup.sql`

### 🔧 **Next Steps:**
1. **Apply migrations** to testing database
2. **Run security health check** to validate implementation
3. **Test multi-user access** with sample data
4. **Proceed to Epic 1** (Secure Client Authentication)

## Overview

**CRITICAL SECURITY ISSUE**: The application currently allows direct database access from the frontend without Row Level Security (RLS) enabled. This is a critical security vulnerability that MUST be addressed before any new features, especially a client-facing portal, are developed.

This epic implements the 4-step security hardening plan to secure the application and prepare it for the client portal.

## Success Criteria

- [ ] All sensitive tables have RLS enabled
- [ ] Data ownership model is properly established
- [ ] SQL helper functions are implemented and tested
- [ ] RLS policies are defined and applied
- [ ] Security testing confirms no unauthorized data access
- [ ] Application functionality remains intact after hardening

## User Stories

### Story 1: Solidify Data Model for Ownership

**As a** system administrator  
**I want** to ensure proper data ownership relationships exist  
**So that** RLS policies can be correctly enforced

#### Acceptance Criteria
- [ ] `clients` table has non-nullable `affiliate_id` column linking each client to their creator
- [ ] `tax_proposals` table has `created_by` column linking each proposal to the affiliate who submitted it
- [ ] `client_users` junction table created for many-to-many client-user relationships
- [ ] Client-user relationship supports multiple users per client with role-based permissions
- [ ] All existing data is migrated to include proper ownership relationships
- [ ] Database constraints enforce data integrity

#### Technical Tasks
- [ ] Create migration to add `affiliate_id` to `clients` table (if not exists)
- [ ] Create migration to add `created_by` to `tax_proposals` table (if not exists)
- [ ] Create `client_users` junction table with proper schema
- [ ] Add role-based permissions system for client users
- [ ] Update existing records to populate ownership fields
- [ ] Add NOT NULL constraints after data migration
- [ ] Add foreign key constraints for referential integrity

### Story 2: Create SQL Helper Functions

**As a** system administrator  
**I want** reusable SQL functions for common authorization checks  
**So that** RLS policies can be consistently applied

#### Acceptance Criteria
- [ ] `is_admin()` function correctly identifies admin users
- [ ] `is_affiliated_with_client(client_id UUID)` function correctly identifies affiliate relationships
- [ ] `has_client_access(client_id UUID, permission TEXT)` function validates client user access
- [ ] `get_user_clients()` function returns all clients accessible to current user
- [ ] Functions handle edge cases (null values, non-existent records)
- [ ] Functions are performant and don't create bottlenecks
- [ ] Functions are thoroughly tested

#### Technical Tasks
- [ ] Create `is_admin()` function that checks user role
- [ ] Create `is_affiliated_with_client()` function that validates affiliate relationships
- [ ] Create `has_client_access()` function for client-user permission checking
- [ ] Create `get_user_clients()` function for client access listing
- [ ] Write comprehensive tests for all functions
- [ ] Performance test functions under load
- [ ] Document function usage and parameters

### Story 3: Define and Apply RLS Policies

**As a** system administrator  
**I want** comprehensive RLS policies on all sensitive tables  
**So that** users can only access data they're authorized to see

#### Acceptance Criteria
- [ ] `clients` table policies: Admins have full access, Affiliates see only their clients, Client users see only their assigned clients
- [ ] `client_users` table policies: Users can see their own relationships, Admins see all
- [ ] Child tables (`businesses`, `personal_years`, etc.) inherit access from parent `clients` record via junction table
- [ ] `tax_proposals` table policies: Admins have full access, Affiliates see only their proposals
- [ ] All other sensitive tables have appropriate policies
- [ ] Policies are tested for both positive and negative cases

#### Technical Tasks
- [ ] Create RLS policy for `clients` table (admin full access)
- [ ] Create RLS policy for `clients` table (affiliate restricted access)
- [ ] Create RLS policy for `clients` table (client user access via junction table)
- [ ] Create RLS policies for `client_users` junction table
- [ ] Create RLS policies for all child tables of `clients` using junction table logic
- [ ] Create RLS policies for `tax_proposals` table
- [ ] Create RLS policies for all other sensitive tables
- [ ] Test policies with different user roles and multi-user scenarios
- [ ] Document all RLS policies and their logic

### Story 4: Enable RLS on All Tables

**As a** system administrator  
**I want** RLS enabled on all tables containing sensitive data  
**So that** the security policies are actively enforced

#### Acceptance Criteria
- [ ] RLS is enabled on all tables containing client data
- [ ] RLS is enabled on all tables containing financial data
- [ ] RLS is enabled on all tables containing business data
- [ ] Application continues to function correctly after RLS enablement
- [ ] Performance impact is minimal and acceptable

#### Technical Tasks
- [ ] Identify all tables requiring RLS protection
- [ ] Create migration to enable RLS on identified tables
- [ ] Test application functionality after RLS enablement
- [ ] Performance test with RLS enabled
- [ ] Create rollback plan in case of issues

### Story 5: Security Testing & Validation

**As a** security team member  
**I want** comprehensive security testing of the hardened system  
**So that** I can confirm unauthorized access is prevented

#### Acceptance Criteria
- [ ] Penetration testing shows no unauthorized data access
- [ ] Different user roles can only access appropriate data
- [ ] SQL injection attempts are blocked
- [ ] Direct database access attempts are properly restricted
- [ ] All security tests pass

#### Technical Tasks
- [ ] Create test users with different roles (admin, affiliate, client)
- [ ] Test data access with each user role
- [ ] Attempt unauthorized data access and confirm it's blocked
- [ ] Test SQL injection scenarios
- [ ] Document security test results
- [ ] Create ongoing security monitoring plan

## Dependencies

- Database schema must be stable (completed ✅)
- Current user role system must be functional
- Existing authentication system must be working

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| RLS breaks existing functionality | High | Medium | Thorough testing in staging environment |
| Performance degradation | Medium | Low | Performance testing and query optimization |
| Data migration issues | High | Low | Backup data before migration, test migration scripts |
| Incomplete policy coverage | High | Medium | Comprehensive security audit and testing |

## Technical Notes

### Database Tables Requiring RLS
- `clients`
- `client_users` (new junction table)
- `businesses`
- `personal_years`
- `business_years`
- `tax_proposals`
- `tax_profiles`
- `invoices` (when added)
- `client_documents` (when added)
- All R&D credit related tables
- All commission/financial tables

### RLS Policy Examples

```sql
-- Example: Client_users junction table policies
CREATE POLICY "Users can view their own client relationships" ON client_users
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all client relationships" ON client_users
    FOR ALL TO authenticated
    USING (is_admin());

-- Example: Clients table policy for client users
CREATE POLICY "Client users can view their assigned clients" ON clients
    FOR SELECT TO authenticated
    USING (has_client_access(id, 'read'));

-- Example: Admin access policy (unchanged)
CREATE POLICY "Admins have full access" ON clients
    FOR ALL TO authenticated
    USING (is_admin());

-- Example: Child table access via junction table
CREATE POLICY "Users can view businesses for their clients" ON businesses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients c
            WHERE c.id = businesses.client_id
            AND has_client_access(c.id, 'read')
        )
    );
```

## Definition of Done

- [ ] All SQL helper functions are implemented and tested
- [ ] All RLS policies are defined and applied
- [ ] RLS is enabled on all sensitive tables
- [ ] Security testing confirms no unauthorized access
- [ ] Application functionality is verified to work correctly
- [ ] Performance testing shows acceptable performance
- [ ] Documentation is updated with security architecture
- [ ] Team is trained on new security model

## Next Steps After Completion

Once this epic is completed, the application will be ready for:
1. Client portal authentication implementation
2. Client-facing features development
3. Third-party integrations (payments, e-signatures)
4. Production deployment of client portal 