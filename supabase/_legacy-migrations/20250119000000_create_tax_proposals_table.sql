-- Create tax_proposals table
CREATE TABLE tax_proposals (
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

-- Create strategy_details table for storing detailed strategy information
CREATE TABLE strategy_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES tax_proposals(id) ON DELETE CASCADE,
  strategy_id TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  strategy_category TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimated_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(proposal_id, strategy_id)
);

-- Create augusta_rule_details table for specific Augusta Rule data
CREATE TABLE augusta_rule_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_detail_id UUID NOT NULL REFERENCES strategy_details(id) ON DELETE CASCADE,
  days_rented INTEGER NOT NULL DEFAULT 14,
  daily_rate DECIMAL(10,2) NOT NULL DEFAULT 1500,
  total_rent DECIMAL(12,2) NOT NULL DEFAULT 21000,
  state_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  federal_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  fica_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  rental_dates JSONB,
  parties_info JSONB,
  rental_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create convertible_tax_bonds_details table for CTB data
CREATE TABLE convertible_tax_bonds_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_detail_id UUID NOT NULL REFERENCES strategy_details(id) ON DELETE CASCADE,
  ctb_payment DECIMAL(12,2) NOT NULL DEFAULT 0,
  ctb_tax_offset DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
  remaining_tax_after_ctb DECIMAL(12,2) NOT NULL DEFAULT 0,
  reduction_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.75,
  total_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_management_company_details table
CREATE TABLE family_management_company_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_detail_id UUID NOT NULL REFERENCES strategy_details(id) ON DELETE CASCADE,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_salaries DECIMAL(12,2) NOT NULL DEFAULT 0,
  state_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  federal_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  fica_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reinsurance_details table
CREATE TABLE reinsurance_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_detail_id UUID NOT NULL REFERENCES strategy_details(id) ON DELETE CASCADE,
  user_contribution DECIMAL(12,2) NOT NULL DEFAULT 0,
  agi_reduction DECIMAL(12,2) NOT NULL DEFAULT 0,
  federal_tax_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  state_tax_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_tax_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_year1_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  breakeven_years DECIMAL(5,2) NOT NULL DEFAULT 0,
  future_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  capital_gains_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  setup_admin_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_tax_proposals_user_id ON tax_proposals(user_id);
CREATE INDEX idx_tax_proposals_affiliate_id ON tax_proposals(affiliate_id);
CREATE INDEX idx_tax_proposals_status ON tax_proposals(status);
CREATE INDEX idx_strategy_details_proposal_id ON strategy_details(proposal_id);
CREATE INDEX idx_strategy_details_strategy_id ON strategy_details(strategy_id);
CREATE INDEX idx_augusta_rule_details_strategy_detail_id ON augusta_rule_details(strategy_detail_id);
CREATE INDEX idx_convertible_tax_bonds_details_strategy_detail_id ON convertible_tax_bonds_details(strategy_detail_id);
CREATE INDEX idx_family_management_company_details_strategy_detail_id ON family_management_company_details(strategy_detail_id);
CREATE INDEX idx_reinsurance_details_strategy_detail_id ON reinsurance_details(strategy_detail_id);

-- Add updated_at triggers
CREATE TRIGGER update_tax_proposals_updated_at 
  BEFORE UPDATE ON tax_proposals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_details_updated_at 
  BEFORE UPDATE ON strategy_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_augusta_rule_details_updated_at 
  BEFORE UPDATE ON augusta_rule_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_convertible_tax_bonds_details_updated_at 
  BEFORE UPDATE ON convertible_tax_bonds_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_management_company_details_updated_at 
  BEFORE UPDATE ON family_management_company_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reinsurance_details_updated_at 
  BEFORE UPDATE ON reinsurance_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE tax_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE augusta_rule_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE convertible_tax_bonds_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_management_company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE reinsurance_details ENABLE ROW LEVEL SECURITY;

-- Tax proposals policies
CREATE POLICY "Users can view their own tax proposals" ON tax_proposals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax proposals" ON tax_proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax proposals" ON tax_proposals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tax proposals" ON tax_proposals
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Strategy details policies
CREATE POLICY "Users can view their own strategy details" ON strategy_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tax_proposals tp 
      WHERE tp.id = strategy_details.proposal_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own strategy details" ON strategy_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tax_proposals tp 
      WHERE tp.id = strategy_details.proposal_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own strategy details" ON strategy_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tax_proposals tp 
      WHERE tp.id = strategy_details.proposal_id 
      AND tp.user_id = auth.uid()
    )
  );

-- Strategy-specific detail tables policies (inherit from strategy_details)
CREATE POLICY "Users can view their own augusta rule details" ON augusta_rule_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = augusta_rule_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own augusta rule details" ON augusta_rule_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = augusta_rule_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own augusta rule details" ON augusta_rule_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = augusta_rule_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

-- Similar policies for other strategy detail tables
CREATE POLICY "Users can view their own ctb details" ON convertible_tax_bonds_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = convertible_tax_bonds_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own ctb details" ON convertible_tax_bonds_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = convertible_tax_bonds_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ctb details" ON convertible_tax_bonds_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = convertible_tax_bonds_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

-- Admin policies for all tables
CREATE POLICY "Admins can view all strategy details" ON strategy_details
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert strategy details" ON strategy_details
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update strategy details" ON strategy_details
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Function to automatically create strategy details when a proposal is created
CREATE OR REPLACE FUNCTION create_strategy_details_for_proposal()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called when a proposal is created
  -- It will parse the proposed_strategies JSON and create corresponding strategy_details records
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create strategy details
CREATE TRIGGER trigger_create_strategy_details
  AFTER INSERT ON tax_proposals
  FOR EACH ROW
  EXECUTE FUNCTION create_strategy_details_for_proposal(); 