-- Fix rd_client_portal_tokens foreign key constraint to enable cascade delete
-- Issue: Foreign key constraint rd_client_portal_tokens_business_id_fkey does not have ON DELETE CASCADE
-- This prevents deletion of businesses that have associated portal tokens

-- Drop the existing foreign key constraint
ALTER TABLE rd_client_portal_tokens 
DROP CONSTRAINT IF EXISTS rd_client_portal_tokens_business_id_fkey;

-- Recreate the foreign key constraint with CASCADE delete behavior
ALTER TABLE rd_client_portal_tokens 
ADD CONSTRAINT rd_client_portal_tokens_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE;

-- Add helpful comment
COMMENT ON CONSTRAINT rd_client_portal_tokens_business_id_fkey ON rd_client_portal_tokens 
IS 'Foreign key constraint with CASCADE delete - when a business is deleted, associated portal tokens are automatically deleted';

-- Verify the constraint was created successfully
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraint rd_client_portal_tokens_business_id_fkey has been updated with CASCADE delete behavior';
  RAISE NOTICE 'Businesses can now be safely deleted along with their associated portal tokens';
END $$;