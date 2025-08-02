-- Migration: Add contact_email column to accounts table
-- Purpose: Store contact email for Stripe billing integration and account communications
-- Created: 2025-01-21

-- Add contact_email column to accounts table
ALTER TABLE accounts 
ADD COLUMN contact_email TEXT;

-- Add index for performance on email lookups
CREATE INDEX IF NOT EXISTS idx_accounts_contact_email ON accounts(contact_email);

-- Add comment for documentation
COMMENT ON COLUMN accounts.contact_email IS 'Contact email for Stripe billing and account communications';