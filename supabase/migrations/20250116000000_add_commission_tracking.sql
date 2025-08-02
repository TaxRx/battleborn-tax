-- Add commission tracking and expert management tables

-- Create experts table
CREATE TABLE IF NOT EXISTS public.experts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company TEXT,
    specialties TEXT[] DEFAULT '{}',
    current_workload INTEGER DEFAULT 0,
    max_capacity INTEGER DEFAULT 10,
    commission_rate DECIMAL(5,4) DEFAULT 0.10, -- Default 10%
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create strategy_commission_rates table (per strategy, per affiliate rates)
CREATE TABLE IF NOT EXISTS public.strategy_commission_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    strategy_name TEXT NOT NULL,
    affiliate_rate DECIMAL(5,4) NOT NULL, -- Affiliate's share of commission (0.0-1.0)
    admin_rate DECIMAL(5,4) NOT NULL,     -- Admin's share of commission (0.0-1.0)
    expert_fee_percentage DECIMAL(5,4),   -- What expert charges client (0.0-1.0)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT rates_sum_check CHECK (affiliate_rate + admin_rate <= 1.0)
);

-- Create proposal_assignments table (linking proposals to experts)
CREATE TABLE IF NOT EXISTS public.proposal_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL, -- Will reference tax_proposals when that table exists
    expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    submitted_to_expert_at TIMESTAMP WITH TIME ZONE,
    expert_response_at TIMESTAMP WITH TIME ZONE,
    expert_status TEXT DEFAULT 'assigned' CHECK (expert_status IN ('assigned', 'contacted', 'in_progress', 'completed', 'declined')),
    notes TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create commission_transactions table
CREATE TABLE IF NOT EXISTS public.commission_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL, -- Will reference tax_proposals
    affiliate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('expert_payment_received', 'affiliate_payment_due', 'affiliate_payment_sent', 'admin_commission')),
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    payment_method TEXT,
    reference_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create proposal_timeline table for tracking all status changes
CREATE TABLE IF NOT EXISTS public.proposal_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL, -- Will reference tax_proposals
    status_from TEXT,
    status_to TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS experts_email_idx ON public.experts(email);
CREATE INDEX IF NOT EXISTS experts_specialties_idx ON public.experts USING GIN(specialties);
CREATE INDEX IF NOT EXISTS strategy_commission_rates_affiliate_idx ON public.strategy_commission_rates(affiliate_id);
CREATE INDEX IF NOT EXISTS strategy_commission_rates_strategy_idx ON public.strategy_commission_rates(strategy_name);
CREATE INDEX IF NOT EXISTS proposal_assignments_proposal_idx ON public.proposal_assignments(proposal_id);
CREATE INDEX IF NOT EXISTS proposal_assignments_expert_idx ON public.proposal_assignments(expert_id);
CREATE INDEX IF NOT EXISTS commission_transactions_proposal_idx ON public.commission_transactions(proposal_id);
CREATE INDEX IF NOT EXISTS commission_transactions_affiliate_idx ON public.commission_transactions(affiliate_id);
CREATE INDEX IF NOT EXISTS commission_transactions_type_idx ON public.commission_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS proposal_timeline_proposal_idx ON public.proposal_timeline(proposal_id);

-- Enable RLS
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_timeline ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Experts: Admins can manage, others can view active experts
CREATE POLICY "Admins can manage experts"
    ON public.experts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view active experts"
    ON public.experts FOR SELECT
    USING (is_active = true);

-- Strategy Commission Rates: Admins can manage, affiliates can view their own
CREATE POLICY "Admins can manage strategy rates"
    ON public.strategy_commission_rates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Affiliates can view their own rates"
    ON public.strategy_commission_rates FOR SELECT
    USING (affiliate_id = auth.uid());

-- Proposal Assignments: Admins can manage, affiliates can view their own
CREATE POLICY "Admins can manage assignments"
    ON public.proposal_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Commission Transactions: Admins can manage, affiliates can view their own
CREATE POLICY "Admins can manage transactions"
    ON public.commission_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Affiliates can view their own transactions"
    ON public.commission_transactions FOR SELECT
    USING (affiliate_id = auth.uid());

-- Proposal Timeline: Admins can manage, users can view relevant timelines
CREATE POLICY "Admins can manage timeline"
    ON public.proposal_timeline FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add updated_at triggers
CREATE TRIGGER update_experts_updated_at
    BEFORE UPDATE ON public.experts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategy_commission_rates_updated_at
    BEFORE UPDATE ON public.strategy_commission_rates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposal_assignments_updated_at
    BEFORE UPDATE ON public.proposal_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_transactions_updated_at
    BEFORE UPDATE ON public.commission_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 