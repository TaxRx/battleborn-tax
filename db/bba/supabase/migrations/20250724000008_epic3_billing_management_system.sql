-- Epic 3 Sprint 4: Billing Management System
-- File: 20250724000008_epic3_billing_management_system.sql
-- Purpose: Comprehensive billing, subscription, and payment management system
-- Story: 4.1 - Billing Management System (10 points)

BEGIN;

-- ========= PART 1: SUBSCRIPTION MANAGEMENT TABLES =========

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    plan_name VARCHAR(200) NOT NULL,
    description TEXT,
    plan_type VARCHAR(20) DEFAULT 'recurring',
    billing_interval VARCHAR(20) DEFAULT 'monthly',
    interval_count INTEGER DEFAULT 1,
    price_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    trial_period_days INTEGER DEFAULT 0,
    max_users INTEGER,
    max_tools INTEGER,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    stripe_price_id VARCHAR(100),
    square_catalog_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.subscription_plans IS 'Subscription plan definitions with pricing and feature configurations';

-- Add constraints for subscription plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_plan_type' 
    AND conrelid = 'public.subscription_plans'::regclass
  ) THEN
    ALTER TABLE public.subscription_plans
    ADD CONSTRAINT check_plan_type 
    CHECK (plan_type IN ('one_time', 'recurring', 'usage_based'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_billing_interval' 
    AND conrelid = 'public.subscription_plans'::regclass
  ) THEN
    ALTER TABLE public.subscription_plans
    ADD CONSTRAINT check_billing_interval 
    CHECK (billing_interval IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));
  END IF;
END $$;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(100),
    square_subscription_id VARCHAR(100),
    payment_method_id UUID,
    billing_contact_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.subscriptions IS 'Active subscription records with billing cycle and status tracking';

-- Add constraints for subscriptions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_subscription_status' 
    AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
    ADD CONSTRAINT check_subscription_status 
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'));
  END IF;
END $$;

-- ========= PART 2: PAYMENT MANAGEMENT TABLES =========

-- Create payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    method_type VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    stripe_payment_method_id VARCHAR(100),
    square_card_id VARCHAR(100),
    last_four VARCHAR(4),
    brand VARCHAR(20),
    exp_month INTEGER,
    exp_year INTEGER,
    billing_address JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.payment_methods IS 'Customer payment methods with secure tokenized storage';

-- Add constraints for payment methods
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_payment_method_type' 
    AND conrelid = 'public.payment_methods'::regclass
  ) THEN
    ALTER TABLE public.payment_methods
    ADD CONSTRAINT check_payment_method_type 
    CHECK (method_type IN ('card', 'bank_account', 'paypal', 'apple_pay', 'google_pay'));
  END IF;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    invoice_id UUID,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    payment_type VARCHAR(20) DEFAULT 'subscription',
    description TEXT,
    stripe_payment_intent_id VARCHAR(100),
    stripe_charge_id VARCHAR(100),
    square_payment_id VARCHAR(100),
    gateway_response JSONB DEFAULT '{}',
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount_cents INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Payment transaction records with gateway tracking';

-- Add constraints for payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_payment_status' 
    AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT check_payment_status 
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_payment_type' 
    AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT check_payment_type 
    CHECK (payment_type IN ('subscription', 'invoice', 'one_time', 'setup', 'refund'));
  END IF;
END $$;

-- ========= PART 3: INVOICE MANAGEMENT TABLES =========

-- Create billing_invoices table (avoiding conflict with existing invoices table)
CREATE TABLE IF NOT EXISTS public.billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER DEFAULT 0,
    discount_cents INTEGER DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    billing_period_start DATE,
    billing_period_end DATE,
    billing_address JSONB DEFAULT '{}',
    notes TEXT,
    pdf_url TEXT,
    stripe_invoice_id VARCHAR(100),
    square_invoice_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.billing_invoices IS 'Invoice records with billing details and PDF generation';

-- Add constraints for billing_invoices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_billing_invoice_status' 
    AND conrelid = 'public.billing_invoices'::regclass
  ) THEN
    ALTER TABLE public.billing_invoices
    ADD CONSTRAINT check_billing_invoice_status 
    CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible'));
  END IF;
END $$;

-- Create invoice line items table
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    period_start DATE,
    period_end DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.invoice_line_items IS 'Individual line items for invoice billing details';

-- ========= PART 4: BILLING EVENTS AND AUDIT TRAIL =========

-- Create billing events table
CREATE TABLE IF NOT EXISTS public.billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    gateway_event_id VARCHAR(100),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.billing_events IS 'Billing system events and webhook processing queue';

-- Add constraints for billing events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_billing_event_type' 
    AND conrelid = 'public.billing_events'::regclass
  ) THEN
    ALTER TABLE public.billing_events
    ADD CONSTRAINT check_billing_event_type 
    CHECK (event_type IN (
        'subscription_created', 'subscription_updated', 'subscription_canceled',
        'payment_succeeded', 'payment_failed', 'payment_refunded',
        'invoice_created', 'invoice_paid', 'invoice_payment_failed',
        'customer_created', 'customer_updated', 'payment_method_attached',
        'trial_will_end', 'subscription_will_renew'
    ));
  END IF;
END $$;

-- ========= PART 5: INDEXES FOR PERFORMANCE =========

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id ON public.subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period ON public.subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_account_id ON public.payments(account_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON public.payments(amount_cents DESC);

-- Billing invoice indexes
CREATE INDEX IF NOT EXISTS idx_billing_invoices_account_id ON public.billing_invoices(account_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription_id ON public.billing_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON public.billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_due_date ON public.billing_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_number ON public.billing_invoices(invoice_number);

-- Payment method indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_account_id ON public.payment_methods(account_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON public.payment_methods(account_id, is_default) WHERE is_default = TRUE;

-- Billing events indexes
CREATE INDEX IF NOT EXISTS idx_billing_events_account_id ON public.billing_events(account_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON public.billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_processed ON public.billing_events(processed, created_at) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON public.billing_events(created_at DESC);

-- ========= PART 6: BILLING MANAGEMENT FUNCTIONS =========

-- Function to create subscription
CREATE OR REPLACE FUNCTION create_subscription(
    p_account_id UUID,
    p_plan_id UUID,
    p_payment_method_id UUID DEFAULT NULL,
    p_trial_days INTEGER DEFAULT NULL,
    p_billing_contact_profile_id UUID DEFAULT NULL
) RETURNS TABLE (
    subscription_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_subscription_id UUID;
    v_plan_record RECORD;
    v_trial_end TIMESTAMP WITH TIME ZONE;
    v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get plan details
    SELECT * INTO v_plan_record FROM public.subscription_plans WHERE id = p_plan_id AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Invalid or inactive subscription plan';
        RETURN;
    END IF;
    
    -- Calculate trial and billing periods
    IF p_trial_days IS NOT NULL AND p_trial_days > 0 THEN
        v_trial_end := NOW() + (p_trial_days || ' days')::INTERVAL;
        v_period_end := v_trial_end;
    ELSE
        v_trial_end := NULL;
        v_period_end := NOW() + (v_plan_record.interval_count || ' ' || v_plan_record.billing_interval)::INTERVAL;
    END IF;
    
    -- Create subscription
    INSERT INTO public.subscriptions (
        account_id,
        plan_id,
        payment_method_id,
        billing_contact_profile_id,
        current_period_end,
        trial_end,
        status
    ) VALUES (
        p_account_id,
        p_plan_id,
        p_payment_method_id,
        p_billing_contact_profile_id,
        v_period_end,
        v_trial_end,
        CASE WHEN v_trial_end IS NOT NULL THEN 'trialing' ELSE 'active' END
    ) RETURNING id INTO v_subscription_id;
    
    -- Log billing event
    INSERT INTO public.billing_events (
        account_id,
        event_type,
        subscription_id,
        event_data
    ) VALUES (
        p_account_id,
        'subscription_created',
        v_subscription_id,
        jsonb_build_object(
            'plan_code', v_plan_record.plan_code,
            'trial_days', p_trial_days,
            'status', CASE WHEN v_trial_end IS NOT NULL THEN 'trialing' ELSE 'active' END
        )
    );
    
    RETURN QUERY SELECT v_subscription_id, TRUE, 'Subscription created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_subscription IS 'Create a new subscription for an account with trial period support';

-- Function to process payment
CREATE OR REPLACE FUNCTION process_payment(
    p_account_id UUID,
    p_amount_cents INTEGER,
    p_currency VARCHAR DEFAULT 'USD',
    p_payment_method_id UUID DEFAULT NULL,
    p_subscription_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS TABLE (
    payment_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_payment_id UUID;
BEGIN
    -- Create payment record
    INSERT INTO public.payments (
        account_id,
        subscription_id,
        payment_method_id,
        amount_cents,
        currency,
        description,
        status
    ) VALUES (
        p_account_id,
        p_subscription_id,
        p_payment_method_id,
        p_amount_cents,
        p_currency,
        p_description,
        'pending'
    ) RETURNING id INTO v_payment_id;
    
    -- Log billing event
    INSERT INTO public.billing_events (
        account_id,
        event_type,
        payment_id,
        event_data
    ) VALUES (
        p_account_id,
        'payment_created',
        v_payment_id,
        jsonb_build_object(
            'amount_cents', p_amount_cents,
            'currency', p_currency,
            'description', p_description
        )
    );
    
    RETURN QUERY SELECT v_payment_id, TRUE, 'Payment created and pending processing';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_payment IS 'Create a payment record for processing';

-- Function to generate invoice
CREATE OR REPLACE FUNCTION generate_invoice(
    p_subscription_id UUID,
    p_billing_period_start DATE DEFAULT NULL,
    p_billing_period_end DATE DEFAULT NULL
) RETURNS TABLE (
    invoice_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_invoice_id UUID;
    v_subscription RECORD;
    v_plan RECORD;
    v_invoice_number VARCHAR(50);
    v_subtotal_cents INTEGER;
    v_total_cents INTEGER;
BEGIN
    -- Get subscription and plan details
    SELECT s.*, sp.* INTO v_subscription
    FROM public.subscriptions s
    JOIN public.subscription_plans sp ON s.plan_id = sp.id
    WHERE s.id = p_subscription_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Subscription not found';
        RETURN;
    END IF;
    
    -- Generate invoice number
    v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(p_subscription_id::TEXT, 1, 8);
    
    -- Calculate amounts
    v_subtotal_cents := v_subscription.price_cents * v_subscription.quantity;
    v_total_cents := v_subtotal_cents; -- Add tax calculation here if needed
    
    -- Create invoice
    INSERT INTO public.billing_invoices (
        account_id,
        subscription_id,
        invoice_number,
        subtotal_cents,
        total_cents,
        currency,
        billing_period_start,
        billing_period_end,
        due_date,
        status
    ) VALUES (
        v_subscription.account_id,
        p_subscription_id,
        v_invoice_number,
        v_subtotal_cents,
        v_total_cents,
        v_subscription.currency,
        COALESCE(p_billing_period_start, v_subscription.current_period_start::DATE),
        COALESCE(p_billing_period_end, v_subscription.current_period_end::DATE),
        CURRENT_DATE + INTERVAL '30 days',
        'open'
    ) RETURNING id INTO v_invoice_id;
    
    -- Add line items
    INSERT INTO public.invoice_line_items (
        invoice_id,
        description,
        quantity,
        unit_price_cents,
        total_cents,
        period_start,
        period_end
    ) VALUES (
        v_invoice_id,
        v_subscription.plan_name,
        v_subscription.quantity,
        v_subscription.price_cents,
        v_subtotal_cents,
        COALESCE(p_billing_period_start, v_subscription.current_period_start::DATE),
        COALESCE(p_billing_period_end, v_subscription.current_period_end::DATE)
    );
    
    -- Log billing event
    INSERT INTO public.billing_events (
        account_id,
        event_type,
        invoice_id,
        subscription_id,
        event_data
    ) VALUES (
        v_subscription.account_id,
        'invoice_created',
        v_invoice_id,
        p_subscription_id,
        jsonb_build_object(
            'invoice_number', v_invoice_number,
            'total_cents', v_total_cents,
            'currency', v_subscription.currency
        )
    );
    
    RETURN QUERY SELECT v_invoice_id, TRUE, 'Invoice generated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_invoice IS 'Generate invoice for subscription billing period';

-- ========= PART 7: ENABLE ROW LEVEL SECURITY =========

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- ========= PART 8: CREATE RLS POLICIES =========

-- Subscription plans policies (public read for active plans)
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- Subscriptions policies
CREATE POLICY "Users can view own account subscriptions" ON public.subscriptions
    FOR SELECT USING (
        account_id = get_user_account_id(auth.uid())
    );

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- Payment methods policies
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
    FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (account_id = get_user_account_id(auth.uid()));

-- Billing invoices policies
CREATE POLICY "Users can view own billing invoices" ON public.billing_invoices
    FOR SELECT USING (account_id = get_user_account_id(auth.uid()));

-- Invoice line items policies
CREATE POLICY "Users can view own invoice line items" ON public.invoice_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.billing_invoices i
            WHERE i.id = invoice_id AND i.account_id = get_user_account_id(auth.uid())
        )
    );

-- Billing events policies
CREATE POLICY "Admins can view billing events" ON public.billing_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- ========= PART 9: GRANT PERMISSIONS =========

-- Grant execute permissions for billing functions
GRANT EXECUTE ON FUNCTION create_subscription(UUID, UUID, UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment(UUID, INTEGER, VARCHAR, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice(UUID, DATE, DATE) TO authenticated;

-- Grant table permissions
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_invoices TO authenticated;
GRANT SELECT ON public.invoice_line_items TO authenticated;
GRANT SELECT, INSERT ON public.billing_events TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;