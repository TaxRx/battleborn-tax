# RLS Policy Analysis & Improvement Plan

## Executive Summary

This document analyzes the current Row-Level Security (RLS) policies in our Supabase database and outlines a comprehensive plan to modernize and standardize access control. The current implementation has inconsistencies and limitations that prevent proper multi-account access control.

## Current State Analysis

### Existing Admin Detection Methods

Our current RLS policies use three different methods to detect admin users:

1. **`is_admin()` function**: Uses `profiles.is_admin = true` (deprecated field)
2. **Direct role checks**: `profiles.role = 'admin'` (better approach)
3. **JWT role checks**: `(auth.jwt() ->> 'role'::text) = 'admin'` (inconsistent)

### Problems Identified

#### 1. Inconsistent Admin Detection

- Some policies use `is_admin()` function which relies on the deprecated `profiles.is_admin` field
- Some use `profiles.role = 'admin'` (preferred method)
- Some use JWT role checks which are unreliable
- No consideration of `accounts.type` for admin privileges

**Example inconsistencies from current policies:**
```sql
-- Using deprecated is_admin() function
"qual": "is_admin()"

-- Using direct role check (better)
"qual": "profiles.role = 'admin'"

-- Using JWT (unreliable)
"qual": "((auth.jwt() ->> 'role'::text) = 'admin'::text)"
```

#### 2. No Account-Level Permissions

- Current RLS doesn't consider `accounts.type` (admin, operator, affiliate, expert, client)
- Missing cross-account access via new `account_client_access` table
- No integration with our new `can_access_client()` function
- No permission level granularity (admin vs view access)

#### 3. Client Access Logic Issues

- Only checks `clients.created_by = auth.uid()` (direct ownership model)
- No support for operators, affiliates, or experts accessing clients they don't own
- No hierarchical access control based on account relationships

## Account Types and Access Patterns

Based on database analysis, we have the following account types:

- **admin**: Global administrative access
- **operator**: Should have controlled access to specific clients
- **affiliate**: Should have controlled access to their assigned clients
- **expert**: Should have controlled access to specific clients
- **client**: Should have access to their own data

## Comprehensive RLS Improvement Plan

### Phase 1: Create Standardized Helper Functions

Replace inconsistent admin detection with standardized functions:

```sql
-- Modern admin detection function
CREATE OR REPLACE FUNCTION public.is_user_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        JOIN accounts a ON p.account_id = a.id
        WHERE p.id = auth.uid() 
        AND (p.role = 'admin' OR a.type = 'admin')
        AND (p.status IS NULL OR p.status = 'active')
        AND a.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Client access helper using our new can_access_client function
CREATE OR REPLACE FUNCTION public.can_user_access_client(
    client_id UUID, 
    permission_level TEXT DEFAULT 'view'
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.can_access_client(auth.uid(), client_id, permission_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Account-level access helper
CREATE OR REPLACE FUNCTION public.can_user_access_account(
    target_account_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        JOIN accounts a ON p.account_id = a.id
        WHERE p.id = auth.uid()
        AND (
            a.type = 'admin' OR -- Global admin access
            p.account_id = target_account_id -- Same account access
        )
        AND (p.status IS NULL OR p.status = 'active')
        AND a.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 2: Update Table-Specific RLS Policies

#### Admin-Only Tables

**Tables affected:** `leads`, `profiles` (admin view), `tax_profiles` (admin view), `user_preferences` (admin view)

**Current:** `is_admin()`  
**New:** `is_user_admin()`

#### Client-Related Tables

**Tables affected:** `clients`, `businesses`, `business_years`, `personal_years`

**Current:** `clients.created_by = auth.uid()`  
**New:** `can_user_access_client(client_id, 'view')` or `can_user_access_client(client_id, 'admin')`

**Benefits:**
- Operators can access clients assigned to them
- Affiliates can access their clients
- Experts can access clients they're working with
- Permission levels control read vs write access

#### Proposal/Strategy Tables

**Tables affected:** `tax_proposals`, `strategy_details`, `augusta_rule_details`, `charitable_donation_details`, `cost_segregation_details`, `hire_children_details`, `convertible_tax_bonds_details`

**Current:** `user_id = auth.uid()` (direct ownership only)  
**New:** Combination of direct ownership and client access:

```sql
-- User owns the proposal OR can access the associated client
(
    user_id = auth.uid() OR 
    can_user_access_client(
        (SELECT client_id FROM some_relation WHERE proposal_id = tax_proposals.id),
        'view'
    )
)
```

#### Admin Tools Tables

**Tables affected:** `admin_client_files`, `tool_enrollments`, `rd_client_portal_tokens`, `rd_qc_document_controls`, `rd_signature_records`

**Current:** Mix of `is_admin()` and direct role checks  
**New:** `is_user_admin()` with proper client access integration

### Phase 3: Policy Templates

#### Template 1: Admin + Owner Access
```sql
-- For tables where admins can see all, others see only their own
(is_user_admin() OR user_id = auth.uid())
```

#### Template 2: Client-Based Access with Permission Levels
```sql  
-- For tables related to clients
can_user_access_client(client_id, 'view') -- For SELECT
can_user_access_client(client_id, 'admin') -- For INSERT/UPDATE/DELETE
```

#### Template 3: Account-Based Access
```sql
-- For tables that should respect account boundaries
can_user_access_account(target_account_id)
```

#### Template 4: Hierarchical Access
```sql
-- For complex relationships (user owns OR admin OR can access client)
(
    user_id = auth.uid() OR 
    is_user_admin() OR
    can_user_access_client(related_client_id, 'view')
)
```

### Phase 4: Migration Strategy

1. **Create Helper Functions** (Single migration file)
   - `is_user_admin()`
   - `can_user_access_client()`
   - `can_user_access_account()`

2. **Update Policies in Batches**
   - **Batch 1**: Admin-only tables (lowest risk)
   - **Batch 2**: Direct user ownership tables
   - **Batch 3**: Client-related tables
   - **Batch 4**: Complex relationship tables

3. **Deprecation Process**
   - Keep old `is_admin()` function temporarily
   - Add deprecation notice
   - Monitor for any remaining usage
   - Remove after all policies updated

4. **Testing Strategy**
   - Test each batch with different account types
   - Verify operators can access assigned clients
   - Verify affiliates can access their clients
   - Verify admins retain global access
   - Verify clients can only access their own data

## Tables Requiring RLS Updates

### High Priority (Admin Detection Issues)
- `leads` - Uses `is_admin()`
- `profiles` - Uses `is_admin()`
- `tax_profiles` - Uses `is_admin()`
- `user_preferences` - Uses `is_admin()`
- `rd_client_portal_tokens` - Uses `profiles.is_admin = true`
- `rd_qc_document_controls` - Uses `profiles.is_admin = true`
- `rd_signatures` - Uses `profiles.is_admin = true`

### Medium Priority (Client Access Expansion)
- `clients` - Add cross-account access
- `businesses` - Through client relationship
- `business_years` - Through client relationship
- `personal_years` - Through client relationship
- `admin_client_files` - Enhance with client access

### Lower Priority (Complex Relationships)
- `tax_proposals` - Add client-based access
- `strategy_details` - Through proposal relationship
- All strategy detail tables (augusta_rule, charitable_donation, etc.)
- R&D related tables with proper client access

## Expected Benefits

### Security Improvements
- **Consistent access control** across all tables
- **Proper account hierarchy** consideration
- **Cross-account access support** for operators/affiliates/experts
- **Permission level granularity** (view vs admin)

### Maintenance Benefits
- **Standardized helper functions** reduce code duplication
- **Centralized access logic** easier to update
- **Clear policy templates** for future tables
- **Better testing** with predictable patterns

### Business Benefits
- **Multi-tenant support** for different account types
- **Scalable access control** for growing user base
- **Flexible permission model** supports business workflows
- **Audit trail support** through centralized functions

## Implementation Checklist

### Prerequisites
- [ ] `can_access_client()` function deployed
- [ ] `account_client_access` table created
- [ ] Helper functions tested in development

### Phase 1: Helper Functions
- [ ] Create `is_user_admin()` function
- [ ] Create `can_user_access_client()` function
- [ ] Create `can_user_access_account()` function
- [ ] Test all helper functions

### Phase 2: High Priority Tables
- [ ] Update admin detection in `leads`
- [ ] Update admin detection in `profiles`
- [ ] Update admin detection in `tax_profiles`
- [ ] Update admin detection in `user_preferences`
- [ ] Update admin detection in R&D tables

### Phase 3: Client Access Tables
- [ ] Update `clients` table policies
- [ ] Update `businesses` table policies
- [ ] Update `business_years` table policies
- [ ] Update `personal_years` table policies
- [ ] Update `admin_client_files` table policies

### Phase 4: Complex Relationships
- [ ] Update `tax_proposals` table policies
- [ ] Update all strategy detail table policies
- [ ] Update remaining R&D table policies

### Phase 5: Cleanup
- [ ] Remove deprecated `is_admin()` function
- [ ] Update any application code using old functions
- [ ] Document new policy patterns

## Risk Mitigation

### Rollback Strategy
- Keep old functions during transition
- Deploy policies one table at a time
- Test thoroughly in development first
- Have database backups before each change

### Testing Requirements
- Test with each account type (admin, operator, affiliate, expert, client)
- Test permission levels (view vs admin)
- Test cross-account access scenarios
- Test existing functionality remains intact

### Monitoring
- Monitor application logs for access denials
- Track policy violation attempts
- Performance monitoring for new function calls
- User feedback on access issues

## Conclusion

This RLS improvement plan addresses fundamental issues with our current access control system and provides a path to modern, scalable, multi-tenant security. The phased approach minimizes risk while delivering significant improvements to both security and maintainability.

The integration with our new `can_access_client()` function and `account_client_access` table will enable proper cross-account access for operators, affiliates, and experts while maintaining strong security boundaries.

Implementation should be done carefully with thorough testing at each phase, but the end result will be a much more robust and flexible security system that can support our growing business needs.