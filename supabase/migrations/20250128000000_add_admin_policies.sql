-- Add missing admin policies for clients and tax_proposals tables
-- Migration: 20250128000000_add_admin_policies.sql

-- Add admin policies for clients table
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert all clients" ON clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all clients" ON clients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin policies for tax_proposals table (if not already exists)
DROP POLICY IF EXISTS "Admins can insert tax proposals" ON tax_proposals;
DROP POLICY IF EXISTS "Admins can update tax proposals" ON tax_proposals;
DROP POLICY IF EXISTS "Admins can delete tax proposals" ON tax_proposals;

CREATE POLICY "Admins can insert tax proposals" ON tax_proposals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update tax proposals" ON tax_proposals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tax proposals" ON tax_proposals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin policies for businesses table
CREATE POLICY "Admins can view all businesses" ON businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert all businesses" ON businesses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all businesses" ON businesses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all businesses" ON businesses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure the admin user has the correct role in profiles table
-- Insert or update the admin user's profile
INSERT INTO profiles (id, role, email, created_at, updated_at)
VALUES (
  'cbd5c605-2b3c-4358-a301-64c4e05d2edc',
  'admin',
  'admin@taxrxgroup.com',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = 'admin@taxrxgroup.com',
  updated_at = NOW();

DO $$ BEGIN 
  RAISE NOTICE 'Successfully added admin policies for clients, tax_proposals, and businesses tables';
  RAISE NOTICE 'Ensured admin user has correct role in profiles table';
END $$; 