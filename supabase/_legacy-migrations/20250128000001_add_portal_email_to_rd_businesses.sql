-- Add portal_email column to rd_businesses table for client portal management
-- Migration: 20250128000001_add_portal_email_to_rd_businesses.sql

-- Add portal_email column to rd_businesses table
ALTER TABLE rd_businesses 
ADD COLUMN IF NOT EXISTS portal_email TEXT;

-- Add comment explaining the purpose
COMMENT ON COLUMN rd_businesses.portal_email IS 'Override email address for client portal access and magic link generation. If set, this email will be used instead of the client email.';

DO $$ BEGIN 
  RAISE NOTICE 'Successfully added portal_email column to rd_businesses table';
END $$; 