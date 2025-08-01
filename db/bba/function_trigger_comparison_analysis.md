# Function and Trigger Comparison Analysis
## Remote Schema Dump vs Local Database

## SUMMARY OF KEY FINDINGS

### Functions Analysis
- **Remote has 26 public functions**
- **Local has 110 public functions** 
- **Major discrepancy**: Local database has significantly more functionality, particularly around:
  - Account management
  - Profile management 
  - Security and authentication
  - Tool access management
  - Analytics and reporting
  - Audit logging

### Triggers Analysis
- **Remote has 21 triggers** (plus some system triggers)
- **Local has 39 triggers**
- **Major discrepancy**: Local has more comprehensive trigger coverage for audit logging and data integrity

## DETAILED FUNCTION COMPARISON

### Functions that exist in REMOTE but NOT in LOCAL
*All remote functions appear to exist in local - no missing functions identified*

### Functions that exist in LOCAL but NOT in REMOTE (Major Gap - 84+ functions)

#### Account & Profile Management (Epic 1 features)
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

#### Security & Authentication
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

#### Analytics & Reporting (Epic 2 features)
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

#### Client Management
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

#### Tool & Access Management  
- `bulk_update_tool_status`
- `expire_tool_access`
- `log_tool_usage`
- `update_account_tool_access_updated_at`
- `user_has_admin_account`

#### Bulk Operations & Workflow
- `complete_bulk_operation`
- `create_bulk_operation`
- `process_bulk_operation_target`
- `rollback_bulk_operation`

#### Additional Utility Functions
- `create_activity_alert`
- `create_subscription`
- `detect_profile_sync_discrepancies`
- `ensure_client_has_owner`
- `expire_old_invitations`
- `generate_invitation_token`
- `generate_invoice`
- `get_auth_sync_status_summary`
- `get_sync_conflicts_summary`
- `get_user_account_id`
- `perform_sync_health_check`
- `process_payment`
- `resolve_sync_conflict`
- `restore_account`
- `set_invitation_token`
- `soft_delete_account`
- `update_client_engagement_status`
- `update_client_users_updated_at`
- `update_invitations_updated_at`
- `update_profile_updated_at`
- `user_is_admin`

### Functions with Different Security Attributes

#### Remote Functions with SECURITY DEFINER:
- `add_business_year` - SECURITY DEFINER
- `archive_client` - SECURITY DEFINER  
- `calculate_household_income` - SECURITY DEFINER
- `check_document_release_eligibility` - SECURITY DEFINER
- `create_business_with_enrollment` - SECURITY DEFINER
- `create_client_with_business` - SECURITY DEFINER
- `enroll_client_in_tool` - SECURITY DEFINER
- `generate_portal_token` - SECURITY DEFINER
- `get_client_tools` - SECURITY DEFINER
- `get_unified_client_list` - SECURITY DEFINER
- `handle_new_user` - SECURITY DEFINER
- `is_admin` - SECURITY DEFINER
- `update_business_year` - SECURITY DEFINER
- `validate_portal_token` - SECURITY DEFINER

## DETAILED TRIGGER COMPARISON

### Triggers that exist in REMOTE but NOT in LOCAL
*Need to check - some may exist with different names*

1. `trigger_update_completion_percentage` - BEFORE UPDATE on `rd_business_years`
   - Function: `update_completion_percentage` (missing from local)

### Triggers that exist in LOCAL but NOT in REMOTE (18+ additional triggers)

#### Account & Profile Management Triggers
- `trigger_auto_log_account_changes_after` - AFTER INSERT on `accounts`
- `trigger_auto_log_account_changes_before` - BEFORE DELETE OR UPDATE on `accounts`  
- `trigger_auto_log_profile_changes_after` - AFTER INSERT on `profiles`
- `trigger_auto_log_profile_changes_before` - BEFORE DELETE OR UPDATE on `profiles`
- `trigger_update_profile_updated_at` - BEFORE UPDATE on `profiles`

#### Tool Access Management Triggers  
- `trigger_auto_log_tool_assignment_changes` - AFTER INSERT OR DELETE OR UPDATE on `account_tool_access`
- `trigger_update_account_tool_access_updated_at` - BEFORE UPDATE on `account_tool_access`
- `trigger_auto_log_significant_tool_usage` - AFTER INSERT on `tool_usage_logs`

#### Client Management Triggers
- `trigger_client_users_updated_at` - BEFORE UPDATE on `client_users`
- `trigger_ensure_client_has_owner_delete` - BEFORE DELETE on `client_users`
- `trigger_ensure_client_has_owner_update` - BEFORE UPDATE on `client_users`
- `update_client_activities_updated_at` - BEFORE UPDATE on `client_activities`
- `update_client_dashboard_metrics_updated_at` - BEFORE UPDATE on `client_dashboard_metrics`
- `update_client_engagement_status_updated_at` - BEFORE UPDATE on `client_engagement_status`

#### Form & System Triggers
- `update_form_6765_overrides_updated_at` - BEFORE UPDATE on `form_6765_overrides`
- `trigger_invitations_updated_at` - BEFORE UPDATE on `invitations`
- `trigger_set_invitation_token` - BEFORE INSERT on `invitations`
- `update_user_preferences_updated_at` - BEFORE UPDATE on `user_preferences`

### Common Triggers (exist in both with same function)
- `handle_rd_contractor_subcomponents_updated_at`
- `handle_rd_contractor_year_data_updated_at`
- `handle_rd_federal_credit_results_updated_at`
- `handle_rd_supply_subcomponents_updated_at`
- `handle_rd_supply_year_data_updated_at`
- `set_updated_at_rd_supplies`
- `set_updated_at_rd_supply_subcomponents`
- `set_updated_at_rd_supply_year_data`
- `trigger_archive_rd_federal_credit_version`
- `trigger_create_strategy_details`
- `trigger_safe_update_practice_percent`
- `trigger_update_rd_federal_credit_updated_at`
- `trigger_update_rd_state_proforma_data_updated_at`
- `trigger_update_step_name`
- `trigger_update_total_qre`
- `update_rd_business_years_credits_calculated_at`
- `update_rd_reports_updated_at`
- `update_rd_roles_updated_at`
- `update_rd_state_calculations_updated_at`

## CRITICAL MISSING FUNCTIONS IN REMOTE

The remote database is missing essential Epic 1 and Epic 2 functionality:

### Epic 1 - Secure Client Authentication (MISSING)
- All invitation system functions
- Profile role management 
- Authentication sync functions
- Client access validation
- Security logging and audit

### Epic 2 - Dashboard Enhancement (MISSING)
- Dashboard metrics calculation
- Activity tracking and analytics
- Usage reporting functions
- Engagement status management

### Missing Security Features
- All security audit logging
- Profile permission management
- Account management functions
- Bulk operation capabilities

## MIGRATION STRATEGY RECOMMENDATION

**CRITICAL**: The local database contains significantly more advanced functionality than the remote. The remote appears to be missing most of the Epic 1 and Epic 2 implementations.

### Recommended Approach:
1. **DO NOT SYNC LOCAL TO REMOTE** - This would lose significant functionality
2. **Create comprehensive migration** to bring remote UP TO local standards
3. **Focus on Epic 1 & Epic 2 missing functions** as priority
4. **Preserve all existing R&D tax functionality** (common functions)

### Migration Priority:
1. **Security & Authentication Functions** (Epic 1)
2. **Profile & Account Management Functions** 
3. **Analytics & Dashboard Functions** (Epic 2)
4. **Audit Logging & Security Functions**
5. **Supporting Triggers** for data integrity

### Next Steps Required:
1. **Confirm** which environment should be considered "source of truth"
2. **Create migration files** for missing functions if remote needs to be updated
3. **Test migration** on development environment first
4. **Backup remote** before any migration attempts

## SECURITY IMPLICATIONS

The remote database lacks critical security functions including:
- Profile permission validation
- Security event logging  
- Account access controls
- Audit trail functionality

This represents a significant security gap that needs immediate attention.