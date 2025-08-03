-- Add missing city and zip_code columns to clients table
-- Migration: 20250119000011_add_city_zip_to_clients.sql

-- Add city column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE clients ADD COLUMN city TEXT;
    END IF;
END $$;

-- Add zip_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'zip_code'
    ) THEN
        ALTER TABLE clients ADD COLUMN zip_code TEXT;
    END IF;
END $$;

-- Create indexes for the new columns for better performance
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_zip_code ON clients(zip_code);

-- Add comments to document the new columns
COMMENT ON COLUMN clients.city IS 'City of the client''s home address';
COMMENT ON COLUMN clients.zip_code IS 'ZIP code of the client''s home address'; 