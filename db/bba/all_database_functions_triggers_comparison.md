# Complete Database Functions & Triggers Comparison Report

Generated on: 2025-07-31

## Functions Comparison

### Remote Functions (public schema)
From remote database schema dump:

1. `add_business_year(p_business_id uuid, p_year integer, ...)`
2. `archive_client(p_client_id uuid, p_archive boolean)`
3. `archive_rd_federal_credit_version()`
4. `calculate_base_amount(business_id uuid, tax_year integer)`
5. `calculate_household_income(p_user_id uuid, p_year integer)`
6. `check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying)`
7. `create_business_with_enrollment(p_business_name text, p_entity_type text, ...)`
8. `create_client_with_business(p_full_name text, p_email text, ...)`
9. `create_strategy_details_for_proposal()`
10. `enroll_client_in_tool(p_client_file_id uuid, p_business_id uuid, ...)`
11. `generate_portal_token(p_business_id uuid)`
12. `get_base_period_years(business_start_year integer, tax_year integer)`
13. `get_client_tools(p_client_file_id uuid, p_business_id uuid)`
14. `get_client_with_data(client_uuid uuid)`
15. `get_unified_client_list(p_tool_filter text, p_admin_id uuid, ...)`
16. `handle_new_user()`
17. `handle_updated_at()`
18. `is_admin()`
19. `safe_update_selected_subcomponent_practice_percent()`
20. `set_updated_at()`
21. `update_business_year(p_year_id uuid, p_is_active boolean, ...)`
22. `update_business_years_updated_at()`
23. `update_credits_calculated_at()`
24. `update_rd_federal_credit_updated_at()`
25. `update_rd_state_proforma_data_updated_at()`
26. `update_selected_subcomponent_step_name()`
27. `update_total_qre()`
28. `update_updated_at_column()`
29. `validate_historical_data(data jsonb)`
30. `validate_portal_token(p_token character varying, p_ip_address inet)`

### Local Functions (public schema)
From local database query results (showing many more functions):

1. `accept_invitation(invitation_token character varying, user_id uuid)`
2. `add_business_year(p_business_id uuid, p_year integer, ...)`
3. `archive_client(p_client_id uuid, p_archive boolean)`
4. `assign_profile_role(p_profile_id uuid, p_role_name character varying, ...)`
5. `auto_log_account_changes()`
6. `auto_log_profile_changes()`
7. `auto_log_significant_tool_usage()`
8. `auto_log_tool_assignment_changes()`
9. `bulk_assign_tools(p_account_ids uuid[], p_tool_ids uuid[], ...)`
10. `bulk_sync_profiles(p_profile_ids uuid[], p_sync_strategy text, ...)`
11. `bulk_update_tool_status(p_assignment_filters jsonb, p_new_status character varying, ...)`
12. `calculate_base_amount(business_id uuid, tax_year integer)`
13. `calculate_dashboard_metrics(p_client_id uuid)`
14. `calculate_household_income(p_user_id uuid, p_year integer)`
15. `check_account_activities_access(account_id uuid)`
16. `check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying)`
17. `check_profile_permission(p_profile_id uuid, p_resource_type character varying, ...)`
18. `cleanup_expired_sessions()`
19. `cleanup_old_security_events()`
20. `complete_bulk_operation(p_bulk_operation_id uuid)`
21. `create_activity_alert(p_profile_id uuid, p_alert_type character varying, ...)`
22. `create_bulk_operation(p_operation_type character varying, p_operation_name character varying, ...)`
23. `create_business_with_enrollment(p_business_name text, p_entity_type text, ...)`
24. `create_client_with_business(p_full_name text, p_email text, ...)`
25. `create_profile_if_missing(user_id uuid, user_email text, ...)`
26. `create_security_alert(p_profile_id uuid, p_alert_type character varying, ...)`
27. And many more... (85+ functions total)

### Functions Analysis

#### ✅ Functions that exist in both local and remote:
- `add_business_year`
- `archive_client` 
- `calculate_base_amount`
- `calculate_household_income`
- `check_document_release_eligibility`
- `create_business_with_enrollment`
- `create_client_with_business`
- `handle_new_user`
- `is_admin`
- And several others...

#### ➕ Functions that exist only in LOCAL (many):
The local database has 85+ functions while remote has only ~30. Local has many additional functions for:
- User management and profiles
- Security and permissions
- Bulk operations
- Activity logging
- Tool assignments
- Dashboard metrics
- And many more enterprise features

#### ➖ Functions that exist only in REMOTE:
- `archive_rd_federal_credit_version()`
- `safe_update_selected_subcomponent_practice_percent()`
- `update_credits_calculated_at()`
- `update_rd_federal_credit_updated_at()`
- `update_rd_state_proforma_data_updated_at()`
- `update_selected_subcomponent_step_name()`
- `update_total_qre()`
- `update_updated_at_column()`
- `validate_portal_token()`

## Triggers Comparison

### Remote Triggers (public schema)
1. `handle_rd_contractor_subcomponents_updated_at` on `rd_contractor_subcomponents`
2. `handle_rd_contractor_year_data_updated_at` on `rd_contractor_year_data`
3. `handle_rd_federal_credit_results_updated_at` on `rd_federal_credit_results`
4. `handle_rd_supply_subcomponents_updated_at` on `rd_supply_subcomponents`
5. `handle_rd_supply_year_data_updated_at` on `rd_supply_year_data`
6. `set_updated_at_rd_supplies` on `rd_supplies`
7. `set_updated_at_rd_supply_subcomponents` on `rd_supply_subcomponents`
8. `set_updated_at_rd_supply_year_data` on `rd_supply_year_data`
9. `trigger_archive_rd_federal_credit_version` on `rd_federal_credit`
10. `trigger_create_strategy_details` on `tax_proposals`
11. `trigger_safe_update_practice_percent` on `rd_selected_subcomponents`
12. `trigger_update_rd_federal_credit_updated_at` on `rd_federal_credit`
13. `trigger_update_rd_state_proforma_data_updated_at` on `rd_state_proforma_data`
14. `trigger_update_step_name` on `rd_selected_subcomponents`
15. `trigger_update_total_qre` on `rd_business_years`
16. `update_rd_business_years_credits_calculated_at` on `rd_business_years`
17. `update_rd_reports_updated_at` on `rd_reports`
18. `update_rd_roles_updated_at` on `rd_roles`
19. `update_rd_state_calculations_updated_at` on `rd_state_calculations`

### Local Triggers (public schema)
1. `trigger_auto_log_tool_assignment_changes` on `account_tool_access`
2. `trigger_update_account_tool_access_updated_at` on `account_tool_access`
3. `trigger_auto_log_account_changes_after` on `accounts`
4. `trigger_auto_log_account_changes_before` on `accounts`
5. `update_client_activities_updated_at` on `client_activities`
6. `update_client_dashboard_metrics_updated_at` on `client_dashboard_metrics`
7. `update_client_engagement_status_updated_at` on `client_engagement_status`
8. `trigger_client_users_updated_at` on `client_users`
9. `trigger_ensure_client_has_owner_delete` on `client_users`
10. `trigger_ensure_client_has_owner_update` on `client_users`
11. `update_form_6765_overrides_updated_at` on `form_6765_overrides`
12. `trigger_invitations_updated_at` on `invitations`
13. `trigger_set_invitation_token` on `invitations`
14. `trigger_auto_log_profile_changes_after` on `profiles`
15. `trigger_auto_log_profile_changes_before` on `profiles`
16. `trigger_update_profile_updated_at` on `profiles`
17. `handle_rd_contractor_subcomponents_updated_at` on `rd_contractor_subcomponents`
18. `handle_rd_contractor_year_data_updated_at` on `rd_contractor_year_data`
19. `handle_rd_federal_credit_results_updated_at` on `rd_federal_credit_results`
20. `update_rd_state_calculations_updated_at` on `rd_state_calculations`
21. `set_updated_at_rd_supplies` on `rd_supplies`
22. `handle_rd_supply_subcomponents_updated_at` on `rd_supply_subcomponents`
23. `set_updated_at_rd_supply_subcomponents` on `rd_supply_subcomponents`
24. `handle_rd_supply_year_data_updated_at` on `rd_supply_year_data`
25. `set_updated_at_rd_supply_year_data` on `rd_supply_year_data`
26. `trigger_create_strategy_details` on `tax_proposals`
27. `trigger_auto_log_significant_tool_usage` on `tool_usage_logs`
28. `update_user_preferences_updated_at` on `user_preferences`

### Triggers Analysis

#### ✅ Triggers that exist in both local and remote:
- `handle_rd_contractor_subcomponents_updated_at`
- `handle_rd_contractor_year_data_updated_at`
- `handle_rd_federal_credit_results_updated_at`
- `handle_rd_supply_subcomponents_updated_at`
- `handle_rd_supply_year_data_updated_at`
- `set_updated_at_rd_supplies`
- `set_updated_at_rd_supply_subcomponents`
- `set_updated_at_rd_supply_year_data`
- `trigger_create_strategy_details`
- `update_rd_state_calculations_updated_at`

#### ➕ Triggers that exist only in LOCAL:
Many triggers for additional features:
- Account and profile logging triggers
- Client management triggers
- Tool assignment triggers
- Security and audit triggers

#### ➖ Triggers that exist only in REMOTE:
- `trigger_archive_rd_federal_credit_version` on `rd_federal_credit`
- `trigger_safe_update_practice_percent` on `rd_selected_subcomponents`
- `trigger_update_rd_federal_credit_updated_at` on `rd_federal_credit`
- `trigger_update_rd_state_proforma_data_updated_at` on `rd_state_proforma_data`
- `trigger_update_step_name` on `rd_selected_subcomponents`
- `trigger_update_total_qre` on `rd_business_years`
- `update_rd_business_years_credits_calculated_at` on `rd_business_years`
- `update_rd_reports_updated_at` on `rd_reports`
- `update_rd_roles_updated_at` on `rd_roles`

## Migration Requirements

### Functions to Add (from remote):
1. `archive_rd_federal_credit_version()`
2. `safe_update_selected_subcomponent_practice_percent()`
3. `update_credits_calculated_at()`
4. `update_rd_federal_credit_updated_at()`
5. `update_rd_state_proforma_data_updated_at()`
6. `update_selected_subcomponent_step_name()`
7. `update_total_qre()`
8. `update_updated_at_column()`
9. `validate_portal_token()`

### Triggers to Add (from remote):
1. `trigger_archive_rd_federal_credit_version` on `rd_federal_credit`
2. `trigger_safe_update_practice_percent` on `rd_selected_subcomponents`
3. `trigger_update_rd_federal_credit_updated_at` on `rd_federal_credit`
4. `trigger_update_rd_state_proforma_data_updated_at` on `rd_state_proforma_data`
5. `trigger_update_step_name` on `rd_selected_subcomponents`
6. `trigger_update_total_qre` on `rd_business_years`
7. `update_rd_business_years_credits_calculated_at` on `rd_business_years`
8. `update_rd_reports_updated_at` on `rd_reports`
9. `update_rd_roles_updated_at` on `rd_roles`

## Summary

- **Local has many more functions** than remote (85+ vs ~30)
- **9 functions exist only in remote** and need to be added to local
- **9 triggers exist only in remote** and need to be added to local
- **No functions or triggers need to be removed** from local (local has additional enterprise features)