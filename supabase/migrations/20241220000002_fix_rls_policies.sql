-- Fix RLS policies for R&D tax credit tables
-- This migration ensures proper access to rd_clients, rd_businesses, and rd_business_years tables

-- Enable RLS on tables if not already enabled
ALTER TABLE rd_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rd_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rd_business_years ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON rd_clients;
DROP POLICY IF EXISTS "Enable insert access for all users" ON rd_clients;
DROP POLICY IF EXISTS "Enable update access for all users" ON rd_clients;
DROP POLICY IF EXISTS "Enable delete access for all users" ON rd_clients;

DROP POLICY IF EXISTS "Enable read access for all users" ON rd_businesses;
DROP POLICY IF EXISTS "Enable insert access for all users" ON rd_businesses;
DROP POLICY IF EXISTS "Enable update access for all users" ON rd_businesses;
DROP POLICY IF EXISTS "Enable delete access for all users" ON rd_businesses;

DROP POLICY IF EXISTS "Enable read access for all users" ON rd_business_years;
DROP POLICY IF EXISTS "Enable insert access for all users" ON rd_business_years;
DROP POLICY IF EXISTS "Enable update access for all users" ON rd_business_years;
DROP POLICY IF EXISTS "Enable delete access for all users" ON rd_business_years;

-- Create new policies for rd_clients
CREATE POLICY "Enable read access for all users" ON rd_clients
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON rd_clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON rd_clients
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON rd_clients
    FOR DELETE USING (true);

-- Create new policies for rd_businesses
CREATE POLICY "Enable read access for all users" ON rd_businesses
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON rd_businesses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON rd_businesses
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON rd_businesses
    FOR DELETE USING (true);

-- Create new policies for rd_business_years
CREATE POLICY "Enable read access for all users" ON rd_business_years
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON rd_business_years
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON rd_business_years
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON rd_business_years
    FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON rd_clients TO authenticated;
GRANT ALL ON rd_businesses TO authenticated;
GRANT ALL ON rd_business_years TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE rd_clients_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE rd_businesses_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE rd_business_years_id_seq TO authenticated; 