-- Add missing signer fields to signature records table
-- Migration: 20250127000002_add_signature_fields.sql

-- Add new columns if they don't exist
ALTER TABLE public.rd_signature_records 
ADD COLUMN IF NOT EXISTS signer_title text,
ADD COLUMN IF NOT EXISTS signer_email text;

-- Add comments for new columns
COMMENT ON COLUMN public.rd_signature_records.signer_title IS 'Job title of the person who signed';
COMMENT ON COLUMN public.rd_signature_records.signer_email IS 'Email address of the person who signed';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully added signer_title and signer_email columns to rd_signature_records table';
END $$; 