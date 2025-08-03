-- Migration: Add affiliate_id to clients table
-- Created: 2025-01-11
-- Purpose: Establish direct relationship between clients and their managing affiliates

-- Add affiliate_id column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES profiles(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_clients_affiliate_id ON clients(affiliate_id);

-- Populate affiliate_id from admin_client_files for existing data
UPDATE clients 
SET affiliate_id = acf.affiliate_id
FROM admin_client_files acf
WHERE clients.id = acf.client_id
AND clients.affiliate_id IS NULL
AND acf.affiliate_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN clients.affiliate_id IS 'References the affiliate who manages this client'; 