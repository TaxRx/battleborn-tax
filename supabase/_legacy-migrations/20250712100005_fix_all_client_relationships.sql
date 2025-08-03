-- Fix all tables with improper client/affiliate ID relationships
-- Migration: 20250111000005_fix_all_client_relationships.sql

-- This migration ensures all client and affiliate relationships use proper UUID foreign keys
-- instead of TEXT fields, and updates related tables to reference the normalized clients table

-- 1. Fix commissions table (from strategy workflow)
-- Update commissions table to reference proper client and affiliate tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commissions') THEN
        -- Drop existing TEXT columns and add proper UUID foreign keys
        ALTER TABLE commissions DROP COLUMN IF EXISTS client_id CASCADE;
        ALTER TABLE commissions DROP COLUMN IF EXISTS client_name CASCADE;
        ALTER TABLE commissions DROP COLUMN IF EXISTS affiliate_id CASCADE;
        ALTER TABLE commissions DROP COLUMN IF EXISTS affiliate_name CASCADE;
        
        -- Add proper foreign key columns
        ALTER TABLE commissions ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
        ALTER TABLE commissions ADD COLUMN affiliate_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_commissions_client_id ON commissions(client_id);
        CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id);
        
        -- Update RLS policies
        DROP POLICY IF EXISTS "Affiliates can view their own commissions" ON commissions;
        CREATE POLICY "Affiliates can view their own commissions" ON commissions
          FOR SELECT USING (affiliate_id = auth.uid());
    END IF;
END $$;

-- 2. Fix strategy_notes table (admin_id should reference profiles)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'strategy_notes') THEN
        -- Drop TEXT admin fields and add proper UUID foreign key
        ALTER TABLE strategy_notes DROP COLUMN IF EXISTS admin_id CASCADE;
        ALTER TABLE strategy_notes DROP COLUMN IF EXISTS admin_name CASCADE;
        
        -- Add proper foreign key column
        ALTER TABLE strategy_notes ADD COLUMN admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_strategy_notes_admin_id ON strategy_notes(admin_id);
    END IF;
END $$;

-- 3. Fix expert_referrals table (expert_id should be UUID)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expert_referrals') THEN
        -- Drop TEXT expert fields and add proper UUID foreign key
        ALTER TABLE expert_referrals DROP COLUMN IF EXISTS expert_id CASCADE;
        ALTER TABLE expert_referrals DROP COLUMN IF EXISTS expert_name CASCADE;
        ALTER TABLE expert_referrals DROP COLUMN IF EXISTS expert_email CASCADE;
        
        -- Add proper foreign key column
        ALTER TABLE expert_referrals ADD COLUMN expert_id UUID REFERENCES experts(id) ON DELETE CASCADE;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_expert_referrals_expert_id ON expert_referrals(expert_id);
    END IF;
END $$;

-- 4. Fix commission_transactions table to reference proper tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commission_transactions') THEN
        -- Ensure proposal_id references tax_proposals properly
        -- (This should already be correct, but let's verify the foreign key exists)
        
        -- Drop and recreate the foreign key constraint to ensure it's correct
        ALTER TABLE commission_transactions DROP CONSTRAINT IF EXISTS commission_transactions_proposal_id_fkey;
        ALTER TABLE commission_transactions ADD CONSTRAINT commission_transactions_proposal_id_fkey 
          FOREIGN KEY (proposal_id) REFERENCES tax_proposals(id) ON DELETE CASCADE;
        
        -- Create index if it doesn't exist
        CREATE INDEX IF NOT EXISTS idx_commission_transactions_proposal_id ON commission_transactions(proposal_id);
    END IF;
END $$;

-- 5. Fix proposal_timeline table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proposal_timeline') THEN
        -- Ensure proposal_id references tax_proposals properly
        ALTER TABLE proposal_timeline DROP CONSTRAINT IF EXISTS proposal_timeline_proposal_id_fkey;
        ALTER TABLE proposal_timeline ADD CONSTRAINT proposal_timeline_proposal_id_fkey 
          FOREIGN KEY (proposal_id) REFERENCES tax_proposals(id) ON DELETE CASCADE;
        
        -- Create index if it doesn't exist
        CREATE INDEX IF NOT EXISTS idx_proposal_timeline_proposal_id ON proposal_timeline(proposal_id);
    END IF;
END $$;

-- 6. Fix proposal_assignments table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proposal_assignments') THEN
        -- Update to reference tax_proposals properly
        ALTER TABLE proposal_assignments DROP CONSTRAINT IF EXISTS proposal_assignments_proposal_id_fkey;
        ALTER TABLE proposal_assignments ADD CONSTRAINT proposal_assignments_proposal_id_fkey 
          FOREIGN KEY (proposal_id) REFERENCES tax_proposals(id) ON DELETE CASCADE;
        
        -- Create index if it doesn't exist
        CREATE INDEX IF NOT EXISTS idx_proposal_assignments_proposal_id ON proposal_assignments(proposal_id);
    END IF;
END $$;

-- 7. Create helper views to get client and affiliate information easily (if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commissions') THEN
        CREATE OR REPLACE VIEW commissions_with_details AS
        SELECT 
          c.*,
          cl.full_name as client_name,
          cl.email as client_email,
          p.full_name as affiliate_name,
          p.email as affiliate_email
        FROM commissions c
        LEFT JOIN clients cl ON c.client_id = cl.id
        LEFT JOIN profiles p ON c.affiliate_id = p.id;
    END IF;
END $$;

-- 8. Create helper function to get client info from any table that references clients
CREATE OR REPLACE FUNCTION get_client_info(client_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  affiliate_id UUID,
  affiliate_name TEXT,
  affiliate_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.full_name,
    c.email,
    c.phone,
    c.affiliate_id,
    p.full_name as affiliate_name,
    p.email as affiliate_email
  FROM clients c
  LEFT JOIN profiles p ON c.affiliate_id = p.id
  WHERE c.id = get_client_info.client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create helper function to get affiliate info from client
CREATE OR REPLACE FUNCTION get_affiliate_from_client(client_id UUID)
RETURNS TABLE (
  affiliate_id UUID,
  affiliate_name TEXT,
  affiliate_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.affiliate_id,
    p.full_name as affiliate_name,
    p.email as affiliate_email
  FROM clients c
  LEFT JOIN profiles p ON c.affiliate_id = p.id
  WHERE c.id = get_affiliate_from_client.client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update any remaining RLS policies that might be affected
-- Update commissions policies to work with the new structure
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commissions') THEN
        -- Drop old policies
        DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;
        DROP POLICY IF EXISTS "Admins can insert commissions" ON commissions;
        DROP POLICY IF EXISTS "Admins can update commissions" ON commissions;
        
        -- Create new policies
        CREATE POLICY "Admins can view all commissions" ON commissions
          FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
        
        CREATE POLICY "Admins can insert commissions" ON commissions
          FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
        
        CREATE POLICY "Admins can update commissions" ON commissions
          FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
        
        -- Policy for affiliates to see commissions for their clients
        CREATE POLICY "Affiliates can view commissions for their clients" ON commissions
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM clients c 
              WHERE c.id = commissions.client_id 
              AND c.affiliate_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 11. Add comments to document the changes
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'commissions_with_details') THEN
        COMMENT ON VIEW commissions_with_details IS 'View that joins commissions with client and affiliate details for easy querying';
    END IF;
END $$;

COMMENT ON FUNCTION get_client_info(UUID) IS 'Helper function to get complete client information including affiliate details';
COMMENT ON FUNCTION get_affiliate_from_client(UUID) IS 'Helper function to get affiliate information from a client ID';

-- 12. Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated all client/affiliate relationships to use proper UUID foreign keys';
    RAISE NOTICE 'All tables now reference the normalized clients table structure';
    RAISE NOTICE 'Helper functions and views created for easy data access';
END $$; 