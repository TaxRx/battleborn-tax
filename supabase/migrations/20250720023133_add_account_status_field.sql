-- Add status field to accounts table for soft deletion
-- File: 20250720000001_add_accounts_status_field.sql
-- Purpose: Enable soft deletion for accounts instead of hard deletion

BEGIN;

-- Create account status enum
DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS status account_status NOT NULL DEFAULT 'active';

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(status);

-- Add constraint to ensure only one status per account
COMMENT ON COLUMN public.accounts.status IS 'Account status: active (normal operation), inactive (temporarily disabled), suspended (admin action), deleted (soft deleted)';

-- Update existing accounts to active status
UPDATE public.accounts SET status = 'active' WHERE status IS NULL;

-- Create function to soft delete account
CREATE OR REPLACE FUNCTION soft_delete_account(account_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.accounts 
    SET 
        status = 'deleted',
        updated_at = NOW()
    WHERE id = account_uuid AND status != 'deleted';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION soft_delete_account IS 'Soft deletes an account by setting status to deleted';

-- Create function to restore deleted account
CREATE OR REPLACE FUNCTION restore_account(account_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.accounts 
    SET 
        status = 'active',
        updated_at = NOW()
    WHERE id = account_uuid AND status = 'deleted';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_account IS 'Restores a soft-deleted account by setting status to active';

-- Create view for active accounts only (commonly used query)
CREATE OR REPLACE VIEW public.active_accounts AS
SELECT * FROM public.accounts WHERE status != 'deleted';

COMMENT ON VIEW public.active_accounts IS 'View showing only non-deleted accounts';

-- Grant permissions
GRANT SELECT ON public.active_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_account(UUID) TO authenticated;

COMMIT;