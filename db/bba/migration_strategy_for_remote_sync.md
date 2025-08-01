# Migration Strategy: Remote Database Sync Requirements

## EXECUTIVE SUMMARY

**CRITICAL FINDING**: The remote database is missing **84+ essential functions** and **18+ triggers** that exist in the local development database. This represents missing Epic 1 (Secure Client Authentication) and Epic 2 (Dashboard Enhancement) functionality.

**RECOMMENDATION**: The remote database needs to be updated to match local functionality, NOT the reverse.

## MISSING FUNCTIONS REQUIRING MIGRATION

### 1. Missing Function: `update_completion_percentage()`
**Status**: Exists in remote schema dump but NOT in local database
**Impact**: R&D business years completion tracking
**Required**: YES - This function is used by remote trigger

```sql
CREATE FUNCTION public.update_completion_percentage() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Calculate completion percentage based on completed steps
    NEW.overall_completion_percentage = (
        (CASE WHEN NEW.business_setup_completed THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.research_activities_completed THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.research_design_completed THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.calculations_completed THEN 25 ELSE 0 END)
    );
    RETURN NEW;
END;
$$;
```

### 2. Missing Trigger: `trigger_update_completion_percentage`
**Status**: Exists in remote but NOT in local
**Required**: YES - For R&D business years functionality

```sql
CREATE TRIGGER trigger_update_completion_percentage 
    BEFORE UPDATE OF business_setup_completed, research_activities_completed, research_design_completed, calculations_completed 
    ON public.rd_business_years 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_completion_percentage();
```

## MISSING EPIC 1 FUNCTIONS (84+ Functions)

### Account & Profile Management
- `accept_invitation`
- `assign_profile_role`
- `auto_log_account_changes`
- `auto_log_profile_changes`
- `bulk_assign_tools`
- `bulk_sync_profiles`
- `check_profile_permission`
- `create_profile_if_missing`
- `get_profile_effective_permissions`
- `get_profile_summary`
- `grant_profile_permission`
- `revoke_profile_role`
- `sync_profile_with_auth`

### Security & Authentication
- `check_account_activities_access`
- `cleanup_expired_sessions`
- `cleanup_old_security_events`
- `create_security_alert`
- `detect_suspicious_activity`
- `is_security_admin`
- `is_super_admin`
- `log_security_event`
- `security_health_check`
- `validate_rls_enabled`

### Analytics & Reporting (Epic 2)
- `calculate_dashboard_metrics`
- `get_account_usage_analytics`
- `get_activity_trends`
- `get_profile_activity_summary`
- `get_profile_activity_timeline`
- `get_tool_usage_analytics`
- `get_tool_usage_metrics`
- `get_usage_export_data`
- `get_usage_trends`
- `refresh_usage_analytics`
- `schedule_analytics_refresh`

### Client Management
- `get_affiliate_from_client`
- `get_client_info`
- `get_tax_proposal_affiliate`
- `get_user_client_role`
- `is_affiliated_with_client`
- `log_client_access`
- `log_client_activity`
- `user_has_client_access`
- `user_has_client_role`
- `user_has_direct_client_access`
- `user_is_client_owner`
- `validate_client_access`

### Tool & Access Management
- `bulk_update_tool_status`
- `expire_tool_access`
- `log_tool_usage`
- `update_account_tool_access_updated_at`
- `user_has_admin_account`

*[... and 50+ more functions - see detailed analysis]*

## MISSING EPIC 1 & EPIC 2 TRIGGERS (18+ Triggers)

### Account & Profile Management Triggers
- `trigger_auto_log_account_changes_after`
- `trigger_auto_log_account_changes_before`
- `trigger_auto_log_profile_changes_after`
- `trigger_auto_log_profile_changes_before`
- `trigger_update_profile_updated_at`

### Tool Access Management Triggers
- `trigger_auto_log_tool_assignment_changes`
- `trigger_update_account_tool_access_updated_at`
- `trigger_auto_log_significant_tool_usage`

### Client Management Triggers
- `trigger_client_users_updated_at`
- `trigger_ensure_client_has_owner_delete`
- `trigger_ensure_client_has_owner_update`
- `update_client_activities_updated_at`
- `update_client_dashboard_metrics_updated_at`
- `update_client_engagement_status_updated_at`

*[... and additional system triggers]*

## SECURITY IMPLICATIONS

**CRITICAL SECURITY GAPS** in remote database:
1. **No Profile Permission System** - Missing all Epic 1 authentication
2. **No Security Audit Logging** - No security event tracking
3. **No Account Access Controls** - Missing access validation
4. **No Invitation System** - No secure user onboarding
5. **No Activity Monitoring** - Missing Epic 2 analytics

## PROPOSED MIGRATION APPROACH

### Phase 1: Critical Security Functions (Priority 1)
1. Add missing authentication functions
2. Add profile management functions  
3. Add security audit functions
4. Add invitation system functions

### Phase 2: R&D Completion Tracking (Priority 1)
1. Add `update_completion_percentage()` function
2. Add `trigger_update_completion_percentage` trigger

### Phase 3: Epic 2 Analytics (Priority 2)
1. Add dashboard metrics functions
2. Add activity tracking functions
3. Add usage analytics functions
4. Add engagement monitoring

### Phase 4: Supporting Infrastructure (Priority 3)
1. Add bulk operation functions
2. Add workflow management functions
3. Add remaining utility functions

## MIGRATION EXECUTION STRATEGY

### Option A: Full Migration (Recommended)
```bash
# Create comprehensive migration file
cd db/bba
supabase migration new "sync_remote_with_local_epic1_epic2_functions"

# Extract ALL missing functions from local database
# Apply to remote environment
```

### Option B: Selective Migration
```bash
# Create separate migrations for each phase
supabase migration new "add_missing_rd_completion_functions"
supabase migration new "add_epic1_authentication_functions" 
supabase migration new "add_epic2_analytics_functions"
```

## RISK ASSESSMENT

### HIGH RISK: Not Migrating
- Remote lacks Epic 1 & Epic 2 functionality
- Security vulnerabilities in production
- Missing critical business features
- Potential data integrity issues

### MEDIUM RISK: Full Migration
- Large migration file complexity
- Potential dependency issues
- Testing requirements across environments

### LOW RISK: Phase Migration  
- Controlled deployment
- Easier testing and validation
- Rollback capabilities

## IMMEDIATE ACTION REQUIRED

1. **Confirm Environment Priority**: Which should be source of truth?
2. **Backup Remote Database**: Before any migration attempts
3. **Create R&D Completion Function**: Missing from local, needed immediately
4. **Plan Epic 1/Epic 2 Migration**: For remote database update

## FILES GENERATED
- `/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/function_trigger_comparison_analysis.md`
- `/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/migration_strategy_for_remote_sync.md`

## RECOMMENDATION

**DO NOT sync local to remote** - this would lose critical Epic 1 and Epic 2 functionality. Instead, **bring remote UP to local standards** through comprehensive migration.