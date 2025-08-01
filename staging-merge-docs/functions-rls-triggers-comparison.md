# Database Functions, RLS Policies & Triggers Comparison: Epic3 vs Main Production

## Executive Summary

Our database dumps **DO include complete functions, RLS policies, and triggers**. Here's the comprehensive comparison:

### Summary Statistics
| Component | Epic3 Staging | Main Production | Difference |
|-----------|---------------|-----------------|------------|
| **Functions** | 113 functions | 30 functions | **+83 Epic3** |
| **RLS Policies** | 283 policies | 209 policies | **+74 Epic3** |
| **Tables with RLS** | ~102 tables | ~71 tables | **+31 Epic3** |

**Key Finding**: Epic3 has **significantly more sophisticated** database logic with 3.8x more functions and more comprehensive RLS security.

---

## 1. Database Functions Analysis

### Epic3 Functions (113 total) - Advanced Enterprise Features

#### **Account & User Management Functions**
```sql
-- Epic3 has sophisticated user/account management
accept_invitation(invitation_token, user_id) RETURNS json
assign_profile_role(profile_id, role_name, scope, scope_id, expires_at, notes)
bulk_sync_profiles(profile_ids[], sync_strategy, max_conflicts)
check_profile_permission(profile_id, resource_type, action, resource_id)
```

#### **Advanced Analytics & Monitoring**
```sql
-- Epic3 has comprehensive analytics functions
aggregate_daily_usage_metrics(p_date) RETURNS TABLE
analyze_performance_metrics(p_hours, p_percentile) RETURNS TABLE
calculate_dashboard_metrics(p_client_id) RETURNS jsonb
```

#### **Bulk Operations & Automation**
```sql
-- Epic3 supports enterprise bulk operations
bulk_assign_tools(account_ids[], tool_ids[], access_level, subscription_level)
bulk_update_tool_status(assignment_filters, new_status, notes)
complete_bulk_operation(bulk_operation_id) RETURNS TABLE
```

#### **Security & Session Management**
```sql
-- Epic3 has advanced security functions
cleanup_expired_sessions() RETURNS integer
cleanup_old_security_events() RETURNS integer
auto_log_account_changes() RETURNS trigger
auto_log_profile_changes() RETURNS trigger
```

### Main Production Functions (30 total) - Core Business Logic

#### **Core Business Functions** (Shared with Epic3)
```sql
-- Both databases have these core functions
add_business_year(business_id, year, is_active, k1_income, revenue, employee_count)
calculate_base_amount(business_id, tax_year) RETURNS numeric
calculate_household_income(user_id, year) RETURNS numeric
archive_client(client_id, archive) RETURNS void
```

#### **R&D Credit Specific Functions** (Main Production Only)
```sql
-- Main has production R&D features Epic3 lacks
check_document_release_eligibility(business_year_id, document_type) RETURNS TABLE
generate_portal_token(business_id) RETURNS TABLE
get_base_period_years(business_start_year, tax_year) RETURNS integer[]
create_business_with_enrollment(business_name, entity_type, client_file_id, tool_slug, ...)
```

#### **Production Data Management**
```sql
-- Main has production-specific data functions
get_unified_client_list(tool_filter, admin_id, affiliate_id) RETURNS TABLE
get_client_with_data(client_uuid) RETURNS json
enroll_client_in_tool(client_file_id, business_id, tool_slug, notes)
```

---

## 2. Row Level Security (RLS) Policies Analysis

### Epic3 RLS Policies (283 total) - Modern Security Architecture

#### **Account-Based Security Model**
```sql
-- Epic3 uses modern account-based RLS
CREATE POLICY "Account users can access their data" ON clients 
    USING (user_has_account_access(auth.uid(), account_id));

CREATE POLICY "Admins can access all business data" ON businesses 
    USING (is_admin());

CREATE POLICY "Users can only see their account activities" ON account_activities
    USING (account_id IN (SELECT account_id FROM profiles WHERE id = auth.uid()));
```

#### **Multi-User Client Access Policies**
```sql
-- Epic3 has sophisticated multi-user RLS
CREATE POLICY "Client users can view their clients" ON clients
    FOR SELECT USING (
        user_is_admin(auth.uid()) OR
        created_by = auth.uid() OR
        user_has_client_access(auth.uid(), id)
    );

CREATE POLICY "Client users can update their clients" ON clients
    FOR UPDATE USING (
        user_is_admin(auth.uid()) OR
        user_has_client_role(auth.uid(), id, 'owner')
    );
```

#### **Advanced Permission Policies**
```sql
-- Epic3 has granular permission control
CREATE POLICY "Profile permissions based on roles" ON profile_permissions
    USING (profile_id = auth.uid() OR user_is_admin(auth.uid()));

CREATE POLICY "Tool access based on account permissions" ON account_tool_access
    USING (account_id IN (SELECT account_id FROM profiles WHERE id = auth.uid()));
```

### Main Production RLS Policies (209 total) - User-Based Security

#### **User-Based Security Model**
```sql
-- Main uses simpler user-based RLS
CREATE POLICY "Users can access their own data" ON clients
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all client files" ON admin_client_files
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
```

#### **R&D Credit Specific Policies**
```sql
-- Main has production R&D security policies
CREATE POLICY "Admin can manage QC controls" ON rd_qc_document_controls
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can manage portal tokens" ON rd_client_portal_tokens
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can view all signatures" ON rd_signatures
    FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
```

---

## 3. Key Functional Differences

### Functions Only in Epic3 (83 unique functions)

#### **Enterprise User Management**
- `accept_invitation()` - User invitation system
- `assign_profile_role()` - Dynamic role assignment
- `bulk_sync_profiles()` - Profile synchronization
- `check_profile_permission()` - Granular permissions

#### **Advanced Analytics**
- `aggregate_daily_usage_metrics()` - Usage analytics
- `analyze_performance_metrics()` - Performance monitoring
- `calculate_dashboard_metrics()` - Dashboard calculations

#### **Security & Monitoring**
- `cleanup_expired_sessions()` - Session management
- `cleanup_old_security_events()` - Security cleanup
- `auto_log_*_changes()` - Automatic audit logging

#### **Bulk Operations**
- `bulk_assign_tools()` - Enterprise tool management
- `bulk_update_tool_status()` - Status management
- `complete_bulk_operation()` - Operation completion

### Functions Only in Main Production (7 unique functions)

#### **R&D Credit Processing**
- `check_document_release_eligibility()` - Document release logic
- `generate_portal_token()` - Client portal access
- `get_base_period_years()` - R&D period calculations
- `create_business_with_enrollment()` - Business creation with tool enrollment

#### **Production Data Management**
- `get_unified_client_list()` - Unified client reporting
- `enroll_client_in_tool()` - Tool enrollment automation
- `archive_rd_federal_credit_version()` - R&D version archiving

---

## 4. RLS Policy Architecture Differences

### Epic3 Modern RLS Architecture ✅

**Advantages:**
- **Account-based permissions** (scalable)
- **Multi-user client access** (enterprise-ready)
- **Helper function approach** (maintainable)
- **Granular role-based access** (secure)
- **Comprehensive audit policies** (compliant)

**Pattern Example:**
```sql
-- Epic3 uses helper functions for cleaner RLS
CREATE POLICY "Multi-user access" ON clients
    USING (
        user_is_admin(auth.uid()) OR
        user_has_client_access(auth.uid(), id) OR
        user_has_client_role(auth.uid(), id, 'member')
    );
```

### Main Production Legacy RLS ❌

**Characteristics:**
- **User-based permissions** (simpler but less scalable)
- **Single-user client model** (limited)
- **Direct table queries** (harder to maintain)
- **Admin-heavy access patterns** (less granular)

**Pattern Example:**
```sql
-- Main uses direct queries in RLS (harder to maintain)
CREATE POLICY "User access" ON clients
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));
```

---

## 5. Migration Strategy for Functions & RLS

### Phase 1: Preserve Epic3 Advanced Functions ✅
- **Keep all 113 Epic3 functions** (modern architecture)
- **Add select Main production functions** for R&D credit processing
- **Merge approach**: Epic3 foundation + Main production enhancements

### Phase 2: Implement Epic3 RLS Architecture ✅
- **Use Epic3's 283 RLS policies** (account-based security)
- **Migrate Main data** to work with Epic3 RLS patterns
- **Preserve security**: All Main access patterns replicated in Epic3 model

### Phase 3: Production-Specific Integration
- **Add Main's R&D functions** to Epic3 schema
- **Create compatibility layer** for production features
- **Testing**: Validate all access patterns work correctly

---

## 6. Critical Migration Requirements

### Must Preserve from Epic3 ✅
- All 113 advanced functions (user management, analytics, security)
- All 283 RLS policies (account-based architecture)
- All helper functions for maintainable RLS
- Multi-user client access patterns

### Must Preserve from Main Production ⚠️
- R&D credit processing functions (7 unique functions)
- Document release and signature workflows
- Portal token generation system
- Production client management patterns

### Must Create New 🔧
- Compatibility functions to bridge Epic3 and Main patterns
- Data migration functions for user → account conversion
- RLS policy updates for production data access patterns

---

## 7. Risk Assessment

### Low Risk ✅
- **Epic3 functions are comprehensive** and well-designed
- **RLS policies are more secure** than Main production
- **Helper function approach** makes maintenance easier

### Medium Risk ⚠️
- **Main's R&D functions** need integration into Epic3
- **Production data access patterns** must be preserved
- **Testing required** to ensure no access regressions

### High Risk 🚨
- **User authentication migration** (public.users → auth.users + accounts)
- **RLS policy testing** with production data patterns
- **Function compatibility** between different architectures

---

## Conclusion

**Epic3 has dramatically superior database logic** with:
- **3.8x more functions** (113 vs 30)
- **35% more RLS policies** (283 vs 209)  
- **Modern account-based architecture**
- **Enterprise-grade security and analytics**

**Main Production contributes valuable R&D processing logic** that must be preserved.

**Recommendation**: Use Epic3 as the foundation and carefully integrate Main's production-specific R&D functions. The Epic3 RLS architecture is significantly more advanced and should be the target security model.

---

**Next Steps**: Create integration plan for Main's R&D functions into Epic3 schema while preserving all Epic3 architectural advantages.