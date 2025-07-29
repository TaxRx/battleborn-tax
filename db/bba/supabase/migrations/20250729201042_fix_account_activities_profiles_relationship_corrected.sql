-- Fix Account Activities Profiles Relationship for REST API (Corrected)
-- Purpose: Re-add foreign key relationship to enable REST API joins while preserving audit data
-- Issue: Removing FK constraints broke REST API join syntax for profiles
-- Solution: Add FK constraint with NO ACTION and NOT VALID to preserve audit trail but enable joins
-- Date: 2025-07-29

BEGIN;

-- Add foreign key constraint with NOT VALID to avoid checking existing data
-- This allows REST API joins to work while not cascading deletes or validating existing orphaned data
ALTER TABLE public.account_activities 
ADD CONSTRAINT account_activities_actor_id_fkey 
FOREIGN KEY (actor_id) REFERENCES public.profiles(id) 
ON DELETE NO ACTION ON UPDATE NO ACTION NOT VALID;

-- Update comments to reflect the new approach
COMMENT ON COLUMN public.account_activities.actor_id IS 'User who performed the action (null for system actions). FK constraint with NO ACTION preserves historical records.';

-- Create a view for easier querying with profile information
CREATE OR REPLACE VIEW account_activities_with_profiles AS
SELECT 
    aa.*,
    p.full_name as actor_name,
    p.email as actor_email
FROM public.account_activities aa
LEFT JOIN public.profiles p ON aa.actor_id = p.id;

-- Grant access to the view
GRANT SELECT ON account_activities_with_profiles TO authenticated;

-- Add RLS policy for the view (need to create a security definer function since views can't have RLS directly)
CREATE OR REPLACE FUNCTION check_account_activities_access(account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles pr
        JOIN accounts ac ON pr.account_id = ac.id
        WHERE pr.id = auth.uid() 
        AND (
            ac.type IN ('admin', 'operator') 
            OR account_id = ac.id
        )
    );
END;
$$;

COMMIT;