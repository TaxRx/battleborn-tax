-- Add phone field to tax_profiles table
-- Migration: 20250117000001_add_phone_to_tax_profiles.sql

ALTER TABLE public.tax_profiles 
ADD COLUMN phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.tax_profiles.phone IS 'Phone number for the tax profile'; 