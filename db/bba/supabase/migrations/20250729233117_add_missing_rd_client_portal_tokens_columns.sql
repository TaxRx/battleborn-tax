-- Add Missing Columns to rd_client_portal_tokens for Remote Data Import Compatibility
-- Purpose: Add tracking columns present in remote database
-- Date: 2025-07-29

BEGIN;

-- Add missing columns to rd_client_portal_tokens table
ALTER TABLE public.rd_client_portal_tokens 
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_accessed_ip TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.rd_client_portal_tokens.created_by IS 'User who created the token (optional)';
COMMENT ON COLUMN public.rd_client_portal_tokens.access_count IS 'Number of times token has been used';
COMMENT ON COLUMN public.rd_client_portal_tokens.last_accessed_at IS 'Timestamp of last token usage';
COMMENT ON COLUMN public.rd_client_portal_tokens.last_accessed_ip IS 'IP address of last token usage';

-- Add foreign key constraint for created_by if needed
-- Note: We don't add FK constraint since it could reference different tables

COMMIT;