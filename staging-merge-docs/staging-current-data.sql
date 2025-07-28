SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."accounts" ("id", "name", "type", "address", "logo_url", "website_url", "stripe_customer_id", "created_at", "updated_at", "status", "contact_email") VALUES
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Platform Administration', 'admin', NULL, NULL, NULL, NULL, '2025-07-15 21:39:21.936587+00', '2025-07-15 21:39:21.936587+00', 'active', NULL),
	('5bbae274-48a1-484b-8f7e-bea7a9c0b7b8', 'Platform Administrator', 'client', NULL, NULL, NULL, NULL, '2025-07-15 21:39:21.936587+00', '2025-07-15 21:39:21.936587+00', 'active', NULL),
	('d8c221ca-e4c5-4769-a0a1-0b4fa970126b', 'dan@fellars.com', 'client', NULL, NULL, NULL, NULL, '2025-07-15 21:39:21.936587+00', '2025-07-15 21:39:21.936587+00', 'active', NULL),
	('55e48b22-d43b-413b-a66b-1119f32e1ecb', 'testclient@fellars.com', 'client', NULL, NULL, NULL, NULL, '2025-07-15 21:39:21.936587+00', '2025-07-15 21:39:21.936587+00', 'active', NULL),
	('cd0ee3a0-5d8e-4624-b31f-47bcff5545c3', 'Fellars Test Company', 'client', NULL, NULL, NULL, NULL, '2025-07-15 21:39:21.936587+00', '2025-07-15 21:39:21.936587+00', 'active', NULL),
	('e4d38cae-ca9c-47b7-b7f2-98ba0830d68d', 'Test Partner Inc.', 'operator', NULL, NULL, NULL, 'cus_test123', '2025-07-15 21:39:21.936587+00', '2025-07-15 21:39:21.936587+00', 'active', NULL);


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "email", "full_name", "role", "created_at", "updated_at", "avatar_url", "account_id", "theme", "notifications_enabled", "last_login_at", "login_count", "status", "admin_notes", "auth_sync_status", "auth_sync_last_attempted", "metadata", "phone", "timezone", "preferences", "last_seen_at", "is_verified", "verification_token", "password_reset_token", "password_reset_expires_at", "two_factor_enabled", "two_factor_secret", "backup_codes", "failed_login_attempts", "locked_until") VALUES
	('12345678-1234-1234-1234-123456789012', 'admin@taxrxgroup.com', 'Platform Administrator', 'admin', '2025-07-15 21:39:21.873902+00', '2025-07-15 21:39:21.873902+00', NULL, '5bbae274-48a1-484b-8f7e-bea7a9c0b7b8', 'light', true, NULL, 0, 'active', NULL, 'synced', NULL, '{}', NULL, 'UTC', '{}', NULL, false, NULL, NULL, NULL, false, NULL, NULL, 0, NULL),
	('12345678-1234-1234-1234-123456789013', 'dan@fellars.com', NULL, 'user', '2025-07-15 21:39:21.873902+00', '2025-07-15 21:39:21.873902+00', NULL, 'd8c221ca-e4c5-4769-a0a1-0b4fa970126b', 'light', true, NULL, 0, 'active', NULL, 'synced', NULL, '{}', NULL, 'UTC', '{}', NULL, false, NULL, NULL, NULL, false, NULL, NULL, 0, NULL),
	('12345678-1234-1234-1234-123456789014', 'testclient@fellars.com', NULL, 'user', '2025-07-15 21:39:21.873902+00', '2025-07-15 21:39:21.873902+00', NULL, '55e48b22-d43b-413b-a66b-1119f32e1ecb', 'light', true, NULL, 0, 'active', NULL, 'synced', NULL, '{}', NULL, 'UTC', '{}', NULL, false, NULL, NULL, NULL, false, NULL, NULL, 0, NULL);


--
-- Data for Name: account_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."account_activities" ("id", "actor_id", "account_id", "activity_type", "target_type", "target_id", "description", "metadata", "ip_address", "user_agent", "session_id", "created_at") VALUES
	('644a2e04-af56-4c69-8da4-54a34280a2fd', NULL, 'e4d38cae-ca9c-47b7-b7f2-98ba0830d68d', 'account_updated', 'account', 'e4d38cae-ca9c-47b7-b7f2-98ba0830d68d', 'Account information updated: Test Partner Inc. (type changed)', '{"new_values": {"id": "e4d38cae-ca9c-47b7-b7f2-98ba0830d68d", "name": "Test Partner Inc.", "type": "operator", "address": null, "logo_url": null, "created_at": "2025-07-15T21:39:21.936587+00:00", "updated_at": "2025-07-15T21:39:21.936587+00:00", "website_url": null, "stripe_customer_id": "cus_test123"}, "old_values": {"id": "e4d38cae-ca9c-47b7-b7f2-98ba0830d68d", "name": "Test Partner Inc.", "type": "platform", "address": null, "logo_url": null, "created_at": "2025-07-15T21:39:21.936587+00:00", "updated_at": "2025-07-15T21:39:21.936587+00:00", "website_url": null, "stripe_customer_id": "cus_test123"}, "changed_fields": {"type": {"new": "operator", "old": "platform"}}}', '2600:1f1c:f9:4d01:25a4:e608:fef:b3d3', NULL, NULL, '2025-07-22 04:07:48.503883+00');


--
-- Data for Name: tools; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tools" ("id", "name", "slug", "description", "status") VALUES
	('d748c975-66d2-4d2c-974e-f365a107c614', 'R&D Tax Credit', 'rd-tax-credit', 'Calculates the Research & Development Tax Credit.', 'active'),
	('1a66d04e-3463-488c-b161-85ae2a36f885', 'Augusta Rule', 'augusta-rule', 'Applies the Augusta Rule for tax-free rental income.', 'active'),
	('767a73a5-0636-4d3e-9d63-6faa26ca6b81', 'Child Work Credit', 'child-work-credit', 'Manages tax implications of hiring your children.', 'in_development');


--
-- Data for Name: account_tool_access; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: admin_client_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: affiliate_tool_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: affiliates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."clients" ("id", "full_name", "email", "phone", "filing_status", "home_address", "state", "dependents", "standard_deduction", "custom_deduction", "created_by", "created_at", "updated_at", "archived", "archived_at", "city", "zip_code", "account_id", "primary_affiliate_id", "has_completed_tax_profile") VALUES
	('12345678-1234-1234-1234-123456789015', 'Fellars Test Company', 'dan@fellars.com', '+1-555-123-4567', 'single', NULL, NULL, 0, true, 0.00, NULL, '2025-07-15 21:39:21.873902+00', '2025-07-15 21:39:21.873902+00', false, NULL, NULL, NULL, 'cd0ee3a0-5d8e-4624-b31f-47bcff5545c3', NULL, false);


--
-- Data for Name: tax_proposals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: strategy_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: augusta_rule_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: billing_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: billing_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bulk_operations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bulk_operation_results; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: business_years; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: calculations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: centralized_businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: charitable_donation_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: client_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: client_dashboard_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: client_engagement_status; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: client_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."client_users" ("id", "client_id", "user_id", "role", "invited_by", "invited_at", "accepted_at", "is_active", "created_at", "updated_at") VALUES
	('a13e01f1-5469-4854-bb06-d858df9cb43b', '12345678-1234-1234-1234-123456789015', '12345678-1234-1234-1234-123456789013', 'owner', NULL, '2025-07-15 21:39:21.873902+00', NULL, true, '2025-07-15 21:39:21.873902+00', '2025-07-15 21:39:21.873902+00'),
	('fa9e1319-80d4-4ef0-835d-ad175511a8ae', '12345678-1234-1234-1234-123456789015', '12345678-1234-1234-1234-123456789014', 'viewer', NULL, '2025-07-15 21:39:21.873902+00', NULL, true, '2025-07-15 21:39:21.873902+00', '2025-07-15 21:39:21.873902+00');


--
-- Data for Name: experts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: commission_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contractor_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: convertible_tax_bonds_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cost_segregation_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: document_folders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: document_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: document_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: document_access_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: document_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: document_processing_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: drf_tmp_test; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: family_management_company_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: feature_usage_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: hire_children_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: invoice_line_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mfa_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: personal_years; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: platform_usage_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profile_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profile_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profile_sync_conflicts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: proposal_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: proposal_timeline; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_research_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_areas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_business_years; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_contractors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_focuses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_research_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_research_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_research_subcomponents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_contractor_subcomponents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_contractor_year_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_employees; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_employee_subcomponents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_employee_year_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_federal_credit_results; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_research_raw; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_selected_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_selected_filter; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_selected_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_selected_subcomponents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_state_calculations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_subcomponents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_supplies; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_supply_subcomponents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rd_supply_year_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reinsurance_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: research_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: role_definitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."role_definitions" ("id", "role_name", "display_name", "description", "is_system_role", "default_permissions", "role_hierarchy_level", "can_assign_roles", "max_scope", "is_active", "created_at", "updated_at") VALUES
	('e60d28bf-f77d-4089-9905-c430d14ecd56', 'super_admin', 'Super Administrator', 'Full system access with all permissions', true, '["system:*:*", "account:*:*", "profile:*:*", "tool:*:*"]', 100, '{super_admin,admin,affiliate_manager,affiliate,client_manager,client,expert,consultant,tool_admin,read_only,guest}', 'global', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('d78a7186-7f48-4416-8417-4cdcec066201', 'admin', 'Administrator', 'Administrative access to most system functions', true, '["account:*:manage", "profile:*:manage", "tool:*:read", "client:*:manage"]', 90, '{affiliate_manager,affiliate,client_manager,client,expert,consultant,read_only,guest}', 'global', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('42ca4152-319b-4887-ac55-2bc3d3c70075', 'affiliate_manager', 'Affiliate Manager', 'Manage affiliate accounts and their clients', true, '["client:*:manage", "affiliate:*:read", "tool:*:read"]', 70, '{affiliate,client,read_only,guest}', 'account', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('ff693ac6-701b-447e-8c80-f680e3ae3ff6', 'affiliate', 'Affiliate', 'Standard affiliate user access', true, '["client:own:manage", "tool:assigned:read", "calculation:own:manage"]', 50, '{client,read_only,guest}', 'account', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('efa44131-f7fe-42e0-afa0-bea63ca913d1', 'client_manager', 'Client Manager', 'Manage client accounts and data', true, '["client:*:manage", "calculation:*:read"]', 60, '{client,read_only,guest}', 'account', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('302ab797-0eea-4138-a1ef-aaa9d3aaad11', 'client', 'Client', 'Client user with limited access', true, '["calculation:own:read", "document:own:read", "report:own:read"]', 30, '{guest}', 'account', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('31ff5e70-036a-43d7-bb10-7d185695d485', 'expert', 'Expert Consultant', 'Expert level access for consulting', true, '["tool:all:read", "calculation:*:read", "report:*:create"]', 80, '{consultant,read_only,guest}', 'global', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('6c31e2e0-ade7-4be5-a3c7-0ac2b7b883ed', 'consultant', 'Consultant', 'Consulting access with calculation capabilities', true, '["calculation:*:read", "tool:assigned:read", "report:own:create"]', 65, '{read_only,guest}', 'account', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('0a825782-450c-46be-9d55-890da34b08a9', 'tool_admin', 'Tool Administrator', 'Administer specific tools and their access', true, '["tool:assigned:manage", "account:*:read"]', 75, '{read_only,guest}', 'tool', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('959fb909-8e23-4500-bd42-44a374e905ed', 'read_only', 'Read Only', 'Read-only access to assigned resources', true, '["*:assigned:read"]', 20, '{guest}', 'account', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00'),
	('86062b14-1abb-4e1c-b600-85a484ebbcde', 'guest', 'Guest', 'Minimal guest access', true, '["profile:own:read"]', 10, '{}', 'account', true, '2025-07-22 04:07:48.822104+00', '2025-07-22 04:07:48.822104+00');


--
-- Data for Name: security_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: security_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: strategy_commission_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: supply_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tax_calculations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tax_estimates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tax_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tool_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tool_usage_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

RESET ALL;
