-- Create strategy implementation tracking table
CREATE TABLE strategy_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES tax_proposals(id) ON DELETE CASCADE,
  strategy_id TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'referred', 'engaged', 'in_process', 'completed', 'cancelled')),
  estimated_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_savings DECIMAL(12,2),
  transaction_value DECIMAL(12,2),
  commission_amount DECIMAL(12,2),
  commission_status TEXT NOT NULL DEFAULT 'pending' CHECK (commission_status IN ('pending', 'earned', 'paid', 'cancelled')),
  
  -- Timeline fields
  referred_at TIMESTAMP WITH TIME ZONE,
  engaged_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expert referrals table
CREATE TABLE expert_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_implementation_id UUID NOT NULL REFERENCES strategy_implementations(id) ON DELETE CASCADE,
  expert_id TEXT NOT NULL,
  expert_name TEXT NOT NULL,
  expert_email TEXT NOT NULL,
  expert_specialties TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'accepted', 'declined', 'expired')),
  referral_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  response_date TIMESTAMP WITH TIME ZONE,
  response_notes TEXT,
  commission_rate DECIMAL(5,2) NOT NULL,
  estimated_commission DECIMAL(12,2) NOT NULL,
  actual_commission DECIMAL(12,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create strategy notes table
CREATE TABLE strategy_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_implementation_id UUID NOT NULL REFERENCES strategy_implementations(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  note TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('general', 'referral', 'progress', 'completion', 'cancellation')),
  is_internal BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create commissions table
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id TEXT NOT NULL,
  affiliate_name TEXT NOT NULL,
  proposal_id UUID NOT NULL REFERENCES tax_proposals(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  strategy_implementation_id UUID NOT NULL REFERENCES strategy_implementations(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  transaction_value DECIMAL(12,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'earned', 'paid', 'cancelled')),
  earned_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_strategy_implementations_proposal_id ON strategy_implementations(proposal_id);
CREATE INDEX idx_strategy_implementations_status ON strategy_implementations(status);
CREATE INDEX idx_expert_referrals_implementation_id ON expert_referrals(strategy_implementation_id);
CREATE INDEX idx_expert_referrals_status ON expert_referrals(status);
CREATE INDEX idx_strategy_notes_implementation_id ON strategy_notes(strategy_implementation_id);
CREATE INDEX idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX idx_commissions_proposal_id ON commissions(proposal_id);
CREATE INDEX idx_commissions_status ON commissions(status);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_strategy_implementations_updated_at 
  BEFORE UPDATE ON strategy_implementations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expert_referrals_updated_at 
  BEFORE UPDATE ON expert_referrals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at 
  BEFORE UPDATE ON commissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE strategy_implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Strategy implementations policies
CREATE POLICY "Admins can view all strategy implementations" ON strategy_implementations
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Affiliates can view their own strategy implementations" ON strategy_implementations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tax_proposals tp 
      WHERE tp.id = strategy_implementations.proposal_id 
      AND tp.affiliate_id = auth.jwt() ->> 'user_id'
    )
  );

CREATE POLICY "Admins can insert strategy implementations" ON strategy_implementations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update strategy implementations" ON strategy_implementations
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Expert referrals policies
CREATE POLICY "Admins can view all expert referrals" ON expert_referrals
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert expert referrals" ON expert_referrals
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update expert referrals" ON expert_referrals
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Strategy notes policies
CREATE POLICY "Admins can view all strategy notes" ON strategy_notes
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert strategy notes" ON strategy_notes
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Commissions policies
CREATE POLICY "Admins can view all commissions" ON commissions
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Affiliates can view their own commissions" ON commissions
  FOR SELECT USING (affiliate_id = auth.jwt() ->> 'user_id');

CREATE POLICY "Admins can insert commissions" ON commissions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update commissions" ON commissions
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Add strategy_implementations array to tax_proposals table
ALTER TABLE tax_proposals 
ADD COLUMN strategy_implementations JSONB DEFAULT '[]'::jsonb;

-- Create function to automatically create strategy implementations when proposal is created
CREATE OR REPLACE FUNCTION create_strategy_implementations_for_proposal()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called when a proposal is created
  -- In a real implementation, you would parse the proposed_strategies JSON
  -- and create corresponding strategy_implementations records
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create strategy implementations
CREATE TRIGGER trigger_create_strategy_implementations
  AFTER INSERT ON tax_proposals
  FOR EACH ROW
  EXECUTE FUNCTION create_strategy_implementations_for_proposal(); 