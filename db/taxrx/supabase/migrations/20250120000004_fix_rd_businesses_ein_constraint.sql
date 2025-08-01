-- Fix rd_businesses table to allow NULL EIN values
-- Migration: 20250120000004_fix_rd_businesses_ein_constraint.sql

-- Make EIN field nullable in rd_businesses table
-- This is needed because not all businesses have EIN values when they're first created
-- from the centralized businesses table during enrollment

ALTER TABLE rd_businesses 
ALTER COLUMN ein DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN rd_businesses.ein IS 'Employer Identification Number (EIN) - nullable because businesses may not have EIN during initial enrollment';

-- Add an index on EIN for better performance when searching by EIN
CREATE INDEX IF NOT EXISTS idx_rd_businesses_ein ON rd_businesses(ein) WHERE ein IS NOT NULL; 