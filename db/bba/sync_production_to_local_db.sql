-- ===================================================
-- PRODUCTION TO LOCAL DATABASE SYNCHRONIZATION SCRIPT
-- ===================================================
-- This script synchronizes the production database schema with the local database schema
-- by adding missing tables, types, functions, and removing tables that don't exist in local
--
-- Generated on: 2025-07-28
-- Target: Sync production database to match local development database
--
-- IMPORTANT: Review this script carefully before execution
-- BACKUP YOUR PRODUCTION DATABASE BEFORE RUNNING THIS SCRIPT
-- ===================================================

-- Set transaction isolation level for consistency
BEGIN;

-- ===================================================
-- SECTION 1: CREATE MISSING TYPES
-- ===================================================
-- These types exist in local but not in production

DO $$ 
BEGIN
    -- access_level_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level_type') THEN
        CREATE TYPE public.access_level_type AS ENUM (
            'none',
            'read_only',
            'limited',
            'full',
            'admin'
        );
    END IF;

    -- account_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE public.account_status AS ENUM (
            'active',
            'inactive',
            'suspended',
            'archived'
        );
    END IF;

    -- account_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE public.account_type AS ENUM (
            'individual',
            'business',
            'partner',
            'affiliate',
            'admin',
            'operator'
        );
    END IF;

    -- activity_priority
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_priority') THEN
        CREATE TYPE public.activity_priority AS ENUM (
            'low',
            'medium',
            'high',
            'critical'
        );
    END IF;

    -- activity_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE public.activity_type AS ENUM (
            'login',
            'logout',
            'profile_update',
            'password_change',
            'email_verification',
            'data_access',
            'file_upload',
            'file_download',
            'calculation_run',
            'proposal_created',
            'proposal_updated'
        );
    END IF;

    -- client_role
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_role') THEN
        CREATE TYPE public.client_role AS ENUM (
            'owner',
            'editor',
            'viewer'
        );
    END IF;

    -- engagement_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engagement_status') THEN
        CREATE TYPE public.engagement_status AS ENUM (
            'new',
            'active',
            'on_hold',
            'completed',
            'cancelled'
        );
    END IF;

    -- filing_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'filing_status') THEN
        CREATE TYPE public.filing_status AS ENUM (
            'single',
            'married_filing_jointly',
            'married_filing_separately',
            'head_of_household',
            'qualifying_widow_er'
        );
    END IF;

    -- proposal_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposal_status') THEN
        CREATE TYPE public.proposal_status AS ENUM (
            'draft',
            'pending_review',
            'under_review',
            'approved',
            'rejected',
            'implemented'
        );
    END IF;

    -- strategy_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'strategy_type') THEN
        CREATE TYPE public.strategy_type AS ENUM (
            'tax_reduction',
            'retirement_planning',
            'estate_planning',
            'business_optimization',
            'charitable_giving'
        );
    END IF;

    -- subscription_level_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_level_type') THEN
        CREATE TYPE public.subscription_level_type AS ENUM (
            'trial',
            'basic',
            'professional',
            'enterprise',
            'custom'
        );
    END IF;

    -- user_role
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'admin',
            'staff',
            'affiliate',
            'client',
            'guest'
        );
    END IF;
END $$;

-- ===================================================
-- SECTION 2: CREATE MISSING TABLES
-- ===================================================
-- These tables exist in local but not in production

-- accounts table (central account management)
CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying NOT NULL,
    type public.account_type NOT NULL DEFAULT 'individual',
    status public.account_status NOT NULL DEFAULT 'active',
    contact_email character varying,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- profile_roles table (role assignments for profiles)
CREATE TABLE IF NOT EXISTS public.profile_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid NOT NULL,
    role_name character varying NOT NULL,
    scope character varying DEFAULT 'global',
    scope_id uuid,
    assigned_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    assigned_by uuid,
    notes text
);

-- profiles table (enhanced user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id uuid,
    account_id uuid,
    full_name character varying,
    email character varying,
    phone character varying,
    role public.user_role DEFAULT 'client',
    status character varying DEFAULT 'active',
    is_verified boolean DEFAULT false,
    last_login_at timestamp with time zone,
    login_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_profiles_account FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- role_definitions table (define available roles)
CREATE TABLE IF NOT EXISTS public.role_definitions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying UNIQUE NOT NULL,
    display_name character varying NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]',
    is_system_role boolean DEFAULT false,
    is_active boolean DEFAULT true,
    hierarchy_level integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- tools table (available tools in the system)
CREATE TABLE IF NOT EXISTS public.tools (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying NOT NULL,
    slug character varying UNIQUE NOT NULL,
    description text,
    category character varying,
    is_active boolean DEFAULT true,
    configuration jsonb DEFAULT '{}',
    access_requirements jsonb DEFAULT '{}',
    pricing_model jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- account_activities table (activity logging for accounts)
CREATE TABLE IF NOT EXISTS public.account_activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    profile_id uuid,
    activity_type character varying NOT NULL,
    activity_category character varying DEFAULT 'general',
    target_type character varying,
    target_id uuid,
    description text NOT NULL,
    result_status character varying DEFAULT 'success',
    risk_level character varying DEFAULT 'low',
    duration_ms integer,
    ip_address inet,
    user_agent text,
    session_id character varying,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_account_activities_account FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- account_tool_access table (tool access for accounts)
CREATE TABLE IF NOT EXISTS public.account_tool_access (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    tool_id uuid NOT NULL,
    access_level public.access_level_type DEFAULT 'read_only',
    subscription_level public.subscription_level_type DEFAULT 'basic',
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    granted_by uuid,
    status character varying DEFAULT 'active',
    usage_limits jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_account_tool_access_account FOREIGN KEY (account_id) REFERENCES public.accounts(id),
    CONSTRAINT fk_account_tool_access_tool FOREIGN KEY (tool_id) REFERENCES public.tools(id),
    UNIQUE(account_id, tool_id)
);

-- admin_sessions table (admin session tracking)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid NOT NULL,
    session_token character varying UNIQUE NOT NULL,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    last_activity timestamp with time zone DEFAULT now()
);

-- affiliate_tool_permissions table (affiliate tool permissions)
CREATE TABLE IF NOT EXISTS public.affiliate_tool_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid NOT NULL,
    tool_slug character varying NOT NULL,
    can_access boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- affiliates table (affiliate management)
CREATE TABLE IF NOT EXISTS public.affiliates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid NOT NULL,
    affiliate_code character varying UNIQUE,
    commission_rate numeric(5,4) DEFAULT 0.1000,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- billing_events table (billing event tracking)
CREATE TABLE IF NOT EXISTS public.billing_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    event_type character varying NOT NULL,
    amount_cents integer,
    currency character varying DEFAULT 'USD',
    description text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_billing_events_account FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- billing_invoices table (invoice management)
CREATE TABLE IF NOT EXISTS public.billing_invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    invoice_number character varying UNIQUE NOT NULL,
    amount_cents integer NOT NULL,
    currency character varying DEFAULT 'USD',
    status character varying DEFAULT 'pending',
    due_date date,
    paid_at timestamp with time zone,
    billing_period_start date,
    billing_period_end date,
    line_items jsonb DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_billing_invoices_account FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- bulk_operations table (bulk operation tracking)
CREATE TABLE IF NOT EXISTS public.bulk_operations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type character varying NOT NULL,
    operation_name character varying NOT NULL,
    initiated_by uuid NOT NULL,
    target_count integer DEFAULT 0,
    processed_count integer DEFAULT 0,
    successful_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    status character varying DEFAULT 'pending',
    operation_data jsonb DEFAULT '{}',
    progress_metadata jsonb DEFAULT '{}',
    can_rollback boolean DEFAULT false,
    rollback_data jsonb DEFAULT '{}',
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    estimated_duration_minutes integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- bulk_operation_results table (bulk operation results)
CREATE TABLE IF NOT EXISTS public.bulk_operation_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_operation_id uuid NOT NULL,
    target_profile_id uuid NOT NULL,
    status character varying DEFAULT 'pending',
    result_data jsonb DEFAULT '{}',
    error_message text,
    rollback_data jsonb DEFAULT '{}',
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_bulk_operation_results_operation FOREIGN KEY (bulk_operation_id) REFERENCES public.bulk_operations(id)
);

-- client_activities table (client activity tracking)
CREATE TABLE IF NOT EXISTS public.client_activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    user_id uuid NOT NULL,
    activity_type public.activity_type NOT NULL,
    title text NOT NULL,
    description text,
    priority public.activity_priority DEFAULT 'medium',
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_client_activities_client FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

-- client_dashboard_metrics table (client dashboard metrics)
CREATE TABLE IF NOT EXISTS public.client_dashboard_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    metric_type character varying NOT NULL,
    metric_value numeric,
    metric_data jsonb DEFAULT '{}',
    period_start date,
    period_end date,
    calculated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_client_dashboard_metrics_client FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

-- client_engagement_status table (client engagement tracking)
CREATE TABLE IF NOT EXISTS public.client_engagement_status (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    status public.engagement_status DEFAULT 'new',
    pending_actions integer DEFAULT 0,
    completion_percentage numeric(5,2) DEFAULT 0.00,
    last_interaction timestamp with time zone,
    next_action_due timestamp with time zone,
    notes text,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_client_engagement_status_client FOREIGN KEY (client_id) REFERENCES public.clients(id),
    UNIQUE(client_id)
);

-- client_users table (client user relationships)
CREATE TABLE IF NOT EXISTS public.client_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    role public.client_role DEFAULT 'viewer',
    permissions jsonb DEFAULT '{}',
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_client_users_client FOREIGN KEY (client_id) REFERENCES public.clients(id),
    CONSTRAINT fk_client_users_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
    UNIQUE(client_id, profile_id)
);

-- invitations table (invitation management)
CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email character varying NOT NULL,
    role public.user_role DEFAULT 'client',
    invited_by uuid NOT NULL,
    client_id uuid,
    invitation_token character varying UNIQUE,
    expires_at timestamp with time zone,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_invitations_client FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

-- invoice_line_items table (invoice line items)
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric DEFAULT 1,
    unit_price_cents integer NOT NULL,
    total_price_cents integer NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- invoices table (invoice management)
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    invoice_number character varying UNIQUE NOT NULL,
    status character varying DEFAULT 'draft',
    total_amount_cents integer DEFAULT 0,
    currency character varying DEFAULT 'USD',
    due_date date,
    issued_at timestamp with time zone,
    paid_at timestamp with time zone,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_invoices_account FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- login_attempts table (login attempt tracking)
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email character varying NOT NULL,
    ip_address inet,
    user_agent text,
    success boolean DEFAULT false,
    failure_reason text,
    attempted_at timestamp with time zone DEFAULT now(),
    profile_id uuid
);

-- mfa_settings table (MFA settings)
CREATE TABLE IF NOT EXISTS public.mfa_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid NOT NULL,
    is_enabled boolean DEFAULT false,
    backup_codes text[],
    totp_secret character varying,
    recovery_codes_generated_at timestamp with time zone,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_mfa_settings_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
    UNIQUE(profile_id)
);

-- partner_tool_subscriptions table (partner tool subscriptions)
CREATE TABLE IF NOT EXISTS public.partner_tool_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id uuid NOT NULL,
    tool_id uuid NOT NULL,
    subscription_level public.subscription_level_type DEFAULT 'basic',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_partner_tool_subscriptions_tool FOREIGN KEY (tool_id) REFERENCES public.tools(id),
    UNIQUE(partner_id, tool_id)
);

-- partners table (partner management)
CREATE TABLE IF NOT EXISTS public.partners (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    partner_code character varying UNIQUE,
    is_active boolean DEFAULT true,
    billing_contact_profile_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_partners_account FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- payment_methods table (payment method management)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    type character varying NOT NULL,
    provider character varying,
    provider_payment_method_id character varying,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_payment_methods_account FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- payments table (payment tracking)
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    amount_cents integer NOT NULL,
    currency character varying DEFAULT 'USD',
    status character varying DEFAULT 'pending',
    payment_method_id uuid,
    subscription_id uuid,
    invoice_id uuid,
    provider_transaction_id character varying,
    description text,
    metadata jsonb DEFAULT '{}',
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_payments_account FOREIGN KEY (account_id) REFERENCES public.accounts(id),
    CONSTRAINT fk_payments_payment_method FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id)
);

-- profile_permissions table (profile permission management)
CREATE TABLE IF NOT EXISTS public.profile_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid NOT NULL,
    permission_name character varying NOT NULL,
    resource_type character varying,
    resource_id uuid,
    action character varying NOT NULL,
    scope character varying DEFAULT 'global',
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    granted_by uuid,
    conditions jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_profile_permissions_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

-- profile_sync_conflicts table (profile sync conflict tracking)
CREATE TABLE IF NOT EXISTS public.profile_sync_conflicts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid NOT NULL,
    auth_user_id uuid,
    conflict_type character varying NOT NULL,
    profile_data jsonb DEFAULT '{}',
    auth_data jsonb DEFAULT '{}',
    severity character varying DEFAULT 'medium',
    resolution_strategy character varying,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    resolution_notes text,
    auto_resolution_attempted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_profile_sync_conflicts_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

-- security_alerts table (security alert management)
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type character varying NOT NULL,
    severity character varying DEFAULT 'medium',
    profile_id uuid,
    title text NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}',
    acknowledged boolean DEFAULT false,
    acknowledged_by uuid,
    acknowledged_at timestamp with time zone,
    resolved boolean DEFAULT false,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- security_events table (security event logging)
CREATE TABLE IF NOT EXISTS public.security_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type character varying NOT NULL,
    severity character varying DEFAULT 'low',
    profile_id uuid,
    client_id uuid,
    ip_address inet,
    user_agent text,
    description text,
    event_data jsonb DEFAULT '{}',
    risk_score integer DEFAULT 0,
    action_taken character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_security_events_client FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

-- subscription_plans table (subscription plan management)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying NOT NULL,
    description text,
    price_cents integer NOT NULL,
    currency character varying DEFAULT 'USD',
    billing_interval character varying DEFAULT 'monthly',
    trial_days integer DEFAULT 0,
    features jsonb DEFAULT '[]',
    limits jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- subscriptions table (subscription management)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status character varying DEFAULT 'active',
    current_period_start date,
    current_period_end date,
    trial_start date,
    trial_end date,
    billing_contact_profile_id uuid,
    payment_method_id uuid,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_subscriptions_account FOREIGN KEY (account_id) REFERENCES public.accounts(id),
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id),
    CONSTRAINT fk_subscriptions_payment_method FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id)
);

-- tool_usage_logs table (tool usage logging)
CREATE TABLE IF NOT EXISTS public.tool_usage_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    profile_id uuid,
    tool_id uuid NOT NULL,
    action character varying NOT NULL,
    feature_used character varying,
    session_id character varying,
    duration_seconds integer,
    data_volume_mb numeric,
    success boolean DEFAULT true,
    error_code character varying,
    error_message text,
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_tool_usage_logs_account FOREIGN KEY (account_id) REFERENCES public.accounts(id),
    CONSTRAINT fk_tool_usage_logs_tool FOREIGN KEY (tool_id) REFERENCES public.tools(id)
);

-- transactions table (transaction tracking)
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    type character varying NOT NULL,
    amount_cents integer NOT NULL,
    currency character varying DEFAULT 'USD',
    status character varying DEFAULT 'pending',
    reference_id character varying,
    description text,
    payment_id uuid,
    invoice_id uuid,
    metadata jsonb DEFAULT '{}',
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- drf_tmp_test table (temporary test table - can be removed if not needed)
CREATE TABLE IF NOT EXISTS public.drf_tmp_test (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    test_data text,
    created_at timestamp with time zone DEFAULT now()
);

-- ===================================================
-- SECTION 3: REMOVE TABLES THAT DON'T EXIST IN LOCAL
-- ===================================================
-- These tables exist in production but not in local
-- CAUTION: This will drop tables and all their data!

-- Uncomment the following lines if you want to remove these tables
-- WARNING: This will permanently delete data!

/*
DROP TABLE IF EXISTS public.form_6765_overrides CASCADE;
DROP TABLE IF EXISTS public.rd_billable_time_summary CASCADE;
DROP TABLE IF EXISTS public.rd_client_portal_tokens CASCADE;
DROP TABLE IF EXISTS public.rd_document_links CASCADE;
DROP TABLE IF EXISTS public.rd_federal_credit CASCADE;
DROP TABLE IF EXISTS public.rd_procedure_analysis CASCADE;
DROP TABLE IF EXISTS public.rd_procedure_research_links CASCADE;
DROP TABLE IF EXISTS public.rd_qc_document_controls CASCADE;
DROP TABLE IF EXISTS public.rd_signature_records CASCADE;
DROP TABLE IF EXISTS public.rd_signatures CASCADE;
DROP TABLE IF EXISTS public.rd_state_calculations_full CASCADE;
DROP TABLE IF EXISTS public.rd_state_credit_configs CASCADE;
DROP TABLE IF EXISTS public.rd_state_proforma_data CASCADE;
DROP TABLE IF EXISTS public.rd_state_proforma_lines CASCADE;
DROP TABLE IF EXISTS public.rd_state_proformas CASCADE;
DROP TABLE IF EXISTS public.rd_support_documents CASCADE;
*/

-- ===================================================
-- SECTION 4: MISSING FUNCTIONS FROM LOCAL
-- ===================================================
-- These functions exist in local but not in production
-- Note: Function definitions are extensive - including key functions only

-- Function: accept_invitation (invitation management)
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token character varying, user_id uuid) 
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Implementation would go here - simplified for migration
    RETURN '{"success": true, "message": "Function placeholder created"}'::json;
END;
$$;

-- Function: auto_log_account_changes (activity logging trigger)
CREATE OR REPLACE FUNCTION public.auto_log_account_changes() 
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    -- Implementation would go here - simplified for migration
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function: bulk_assign_tools (bulk tool assignment)
CREATE OR REPLACE FUNCTION public.bulk_assign_tools(
    p_account_ids uuid[], 
    p_tool_ids uuid[], 
    p_access_level public.access_level_type DEFAULT 'full',
    p_subscription_level public.subscription_level_type DEFAULT 'basic',
    p_expires_at timestamp with time zone DEFAULT NULL,
    p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Implementation would go here - simplified for migration
    RETURN '{"success": true, "message": "Function placeholder created"}'::jsonb;
END;
$$;

-- Function: log_account_activity (activity logging)
CREATE OR REPLACE FUNCTION public.log_account_activity(
    p_account_id uuid, 
    p_activity_type character varying, 
    p_target_type character varying, 
    p_target_id uuid, 
    p_description text, 
    p_metadata jsonb DEFAULT '{}'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    activity_id uuid;
BEGIN
    INSERT INTO public.account_activities (
        account_id, activity_type, target_type, target_id, description, metadata
    ) VALUES (
        p_account_id, p_activity_type, p_target_type, p_target_id, p_description, p_metadata
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$;

-- ===================================================
-- SECTION 5: CREATE INDEXES AND CONSTRAINTS
-- ===================================================
-- Add necessary indexes for performance

-- Indexes for account_activities
CREATE INDEX IF NOT EXISTS idx_account_activities_account_id ON public.account_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_account_activities_created_at ON public.account_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_account_activities_activity_type ON public.account_activities(activity_type);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account_id ON public.profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Indexes for tool_usage_logs
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_account_id ON public.tool_usage_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_tool_id ON public.tool_usage_logs(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_created_at ON public.tool_usage_logs(created_at);

-- Indexes for client_users
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON public.client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_profile_id ON public.client_users(profile_id);

-- ===================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================
-- Enable RLS and create basic policies

-- Enable RLS on key tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (these should be customized based on your security requirements)
DO $$
BEGIN
    -- Profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_own') THEN
        CREATE POLICY profiles_select_own ON public.profiles FOR SELECT 
        USING (auth.uid() = auth_user_id OR auth.uid() IN (
            SELECT auth_user_id FROM public.profiles p2 WHERE p2.role = 'admin'
        ));
    END IF;

    -- Account activities policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'account_activities' AND policyname = 'account_activities_select_own') THEN
        CREATE POLICY account_activities_select_own ON public.account_activities FOR SELECT 
        USING (account_id IN (
            SELECT account_id FROM public.profiles WHERE auth_user_id = auth.uid()
        ));
    END IF;

    -- Client users policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_users' AND policyname = 'client_users_select_own') THEN
        CREATE POLICY client_users_select_own ON public.client_users FOR SELECT 
        USING (profile_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        ));
    END IF;
END $$;

-- ===================================================
-- SECTION 7: TRIGGERS
-- ===================================================
-- Create necessary triggers

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column() 
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers to tables that have updated_at columns
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'accounts', 'profiles', 'account_tool_access', 'affiliates', 
        'billing_invoices', 'bulk_operations', 'client_users', 
        'client_engagement_status', 'invitations', 'invoices', 
        'mfa_settings', 'partner_tool_subscriptions', 'partners', 
        'payment_methods', 'payments', 'profile_sync_conflicts', 
        'security_alerts', 'subscription_plans', 'subscriptions', 
        'transactions'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
            CREATE TRIGGER update_%I_updated_at 
                BEFORE UPDATE ON public.%I 
                FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- ===================================================
-- SECTION 8: GRANT PERMISSIONS
-- ===================================================
-- Grant necessary permissions

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on tables to authenticated users
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'accounts', 'profiles', 'account_activities', 'account_tool_access',
        'admin_sessions', 'affiliate_tool_permissions', 'affiliates',
        'billing_events', 'billing_invoices', 'bulk_operations', 'bulk_operation_results',
        'client_activities', 'client_dashboard_metrics', 'client_engagement_status',
        'client_users', 'invitations', 'invoice_line_items', 'invoices',
        'login_attempts', 'mfa_settings', 'partner_tool_subscriptions', 'partners',
        'payment_methods', 'payments', 'profile_permissions', 'profile_roles',
        'profile_sync_conflicts', 'role_definitions', 'security_alerts', 'security_events',
        'subscription_plans', 'subscriptions', 'tool_usage_logs', 'tools', 'transactions'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
        EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    END LOOP;
END $$;

-- ===================================================
-- COMPLETION
-- ===================================================

COMMIT;

-- ===================================================
-- POST-MIGRATION NOTES
-- ===================================================
/*
After running this migration script, you should:

1. Verify all tables were created successfully
2. Test key functions work as expected
3. Verify RLS policies are working correctly
4. Run application tests to ensure compatibility
5. Monitor for any performance issues
6. Update application code if needed for new table structures

Key differences between local and production that were addressed:
- Added 35 new tables that exist in local but not production
- Added 11 new enum types
- Created placeholder functions (these may need full implementation)
- Set up basic RLS policies (customize as needed)
- Added necessary indexes for performance
- Set up updated_at triggers

Tables removed from production (commented out for safety):
- form_6765_overrides
- rd_billable_time_summary  
- rd_client_portal_tokens
- rd_document_links
- rd_federal_credit
- rd_procedure_analysis
- rd_procedure_research_links
- rd_qc_document_controls
- rd_signature_records
- rd_signatures
- rd_state_calculations_full
- rd_state_credit_configs
- rd_state_proforma_data
- rd_state_proforma_lines
- rd_state_proformas
- rd_support_documents

IMPORTANT REMINDERS:
- This script creates the structure but may need data migration
- Function implementations are simplified placeholders
- RLS policies should be reviewed and customized
- Test thoroughly before deploying to production
- Consider gradual rollout for complex changes
*/