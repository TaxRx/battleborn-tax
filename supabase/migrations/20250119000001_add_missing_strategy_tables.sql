-- Add missing strategy detail tables

-- Create charitable_donation_details table
CREATE TABLE charitable_donation_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_detail_id UUID NOT NULL REFERENCES strategy_details(id) ON DELETE CASCADE,
  donation_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  fmv_multiplier DECIMAL(5,2) NOT NULL DEFAULT 5.0,
  agi_limit DECIMAL(3,2) NOT NULL DEFAULT 0.6,
  deduction_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  federal_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
  state_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hire_children_details table
CREATE TABLE hire_children_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_detail_id UUID NOT NULL REFERENCES strategy_details(id) ON DELETE CASCADE,
  children JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_salaries DECIMAL(12,2) NOT NULL DEFAULT 0,
  state_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  federal_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  fica_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_benefit DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cost_segregation_details table
CREATE TABLE cost_segregation_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_detail_id UUID NOT NULL REFERENCES strategy_details(id) ON DELETE CASCADE,
  property_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  land_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  improvement_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  bonus_depreciation_rate DECIMAL(5,4) NOT NULL DEFAULT 0.8,
  year_acquired INTEGER NOT NULL DEFAULT 2024,
  current_year_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
  years_2_to_5_annual DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_charitable_donation_details_strategy_detail_id ON charitable_donation_details(strategy_detail_id);
CREATE INDEX idx_hire_children_details_strategy_detail_id ON hire_children_details(strategy_detail_id);
CREATE INDEX idx_cost_segregation_details_strategy_detail_id ON cost_segregation_details(strategy_detail_id);

-- Add updated_at triggers
CREATE TRIGGER update_charitable_donation_details_updated_at 
  BEFORE UPDATE ON charitable_donation_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hire_children_details_updated_at 
  BEFORE UPDATE ON hire_children_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_segregation_details_updated_at 
  BEFORE UPDATE ON cost_segregation_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE charitable_donation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE hire_children_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_segregation_details ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (inherit from strategy_details)
CREATE POLICY "Users can view their own charitable donation details" ON charitable_donation_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = charitable_donation_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own charitable donation details" ON charitable_donation_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = charitable_donation_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own charitable donation details" ON charitable_donation_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = charitable_donation_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own hire children details" ON hire_children_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = hire_children_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own hire children details" ON hire_children_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = hire_children_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own hire children details" ON hire_children_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = hire_children_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own cost segregation details" ON cost_segregation_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = cost_segregation_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own cost segregation details" ON cost_segregation_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = cost_segregation_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own cost segregation details" ON cost_segregation_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM strategy_details sd
      JOIN tax_proposals tp ON tp.id = sd.proposal_id
      WHERE sd.id = cost_segregation_details.strategy_detail_id 
      AND tp.user_id = auth.uid()
    )
  ); 