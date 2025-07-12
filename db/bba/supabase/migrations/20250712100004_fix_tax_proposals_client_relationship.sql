-- Fix tax_proposals to properly reference clients table
-- Migration: 20250111000004_fix_tax_proposals_client_relationship.sql

-- 1. First, ensure the tax_proposals table exists (in case it hasn't been created yet)
CREATE TABLE IF NOT EXISTS tax_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_id TEXT,
  client_id TEXT,
  client_name TEXT,
  year INTEGER NOT NULL,
  tax_info JSONB NOT NULL,
  proposed_strategies JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'accepted', 'rejected', 'implemented')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Drop existing indexes that reference affiliate_id
DROP INDEX IF EXISTS idx_tax_proposals_affiliate_id;

-- 3. Alter the table to fix the client relationship
-- Change client_id from TEXT to UUID and add proper foreign key
ALTER TABLE tax_proposals 
  DROP COLUMN IF EXISTS client_id CASCADE;

ALTER TABLE tax_proposals 
  ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 4. Remove direct affiliate_id since we'll get it through client
ALTER TABLE tax_proposals 
  DROP COLUMN IF EXISTS affiliate_id;

-- 5. Remove client_name since we'll get it from the clients table
ALTER TABLE tax_proposals 
  DROP COLUMN IF EXISTS client_name;

-- 6. Add new indexes
CREATE INDEX idx_tax_proposals_client_id ON tax_proposals(client_id);

-- 7. Update RLS policies to work with the new structure
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tax proposals" ON tax_proposals;
DROP POLICY IF EXISTS "Users can insert their own tax proposals" ON tax_proposals;
DROP POLICY IF EXISTS "Users can update their own tax proposals" ON tax_proposals;
DROP POLICY IF EXISTS "Admins can view all tax proposals" ON tax_proposals;

-- Create new policies that consider client access
CREATE POLICY "Users can view tax proposals for their clients" ON tax_proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = tax_proposals.client_id 
      AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert tax proposals for their clients" ON tax_proposals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = tax_proposals.client_id 
      AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update tax proposals for their clients" ON tax_proposals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = tax_proposals.client_id 
      AND c.created_by = auth.uid()
    )
  );

-- Multi-user client access policy (uses our new client_users junction table)
CREATE POLICY "Client users can view tax proposals" ON tax_proposals
  FOR SELECT USING (
    user_has_client_access(auth.uid(), tax_proposals.client_id)
  );

CREATE POLICY "Client users can insert tax proposals" ON tax_proposals
  FOR INSERT WITH CHECK (
    user_has_client_access(auth.uid(), tax_proposals.client_id)
  );

CREATE POLICY "Client users can update tax proposals" ON tax_proposals
  FOR UPDATE USING (
    user_has_client_access(auth.uid(), tax_proposals.client_id)
  );

-- Admin policies
CREATE POLICY "Admins can view all tax proposals" ON tax_proposals
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert tax proposals" ON tax_proposals
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update tax proposals" ON tax_proposals
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- 8. Create a view to get tax proposals with client and affiliate information
CREATE OR REPLACE VIEW tax_proposals_with_client_info AS
SELECT 
  tp.*,
  c.full_name as client_name,
  c.email as client_email,
  c.affiliate_id,
  p.full_name as affiliate_name,
  p.email as affiliate_email
FROM tax_proposals tp
JOIN clients c ON tp.client_id = c.id
LEFT JOIN profiles p ON c.affiliate_id = p.id;

-- 9. Create helper function to get affiliate info from tax proposal
CREATE OR REPLACE FUNCTION get_tax_proposal_affiliate(proposal_id UUID)
RETURNS TABLE (
  affiliate_id UUID,
  affiliate_name TEXT,
  affiliate_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.affiliate_id,
    p.full_name,
    p.email
  FROM tax_proposals tp
  JOIN clients c ON tp.client_id = c.id
  LEFT JOIN profiles p ON c.affiliate_id = p.id
  WHERE tp.id = proposal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add comment to document the new structure
COMMENT ON TABLE tax_proposals IS 'Tax proposals are now associated with clients. Affiliate information is accessed through the client relationship.';
COMMENT ON COLUMN tax_proposals.client_id IS 'References clients.id - get affiliate via clients.affiliate_id'; 