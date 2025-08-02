-- Add profile_created to activity_type constraint
-- Purpose: Fix constraint violation where 'profile_created' activity type is not allowed
-- Issue: Edge function uses 'profile_created' but constraint only allows 'profile_added'
-- Solution: Add 'profile_created' to the allowed activity types
-- Date: 2025-07-29

BEGIN;

-- Drop the existing constraint
ALTER TABLE public.account_activities DROP CONSTRAINT IF EXISTS account_activities_activity_type_check;

-- Recreate constraint with 'profile_created' added
ALTER TABLE public.account_activities ADD CONSTRAINT account_activities_activity_type_check 
CHECK (activity_type IN (
    'account_created', 'account_updated', 'account_deleted',
    'profile_added', 'profile_removed', 'profile_updated', 'profile_created',
    'status_changed', 'type_changed', 'access_granted', 'access_revoked',
    'tool_assigned', 'tool_removed', 'tool_access_modified',
    'billing_updated', 'subscription_changed', 'payment_processed',
    'login_success', 'login_failed', 'password_changed',
    'data_export', 'bulk_operation', 'admin_action'
));

COMMIT;