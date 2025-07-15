-- MIGRATION: Create Partner Platform Schema
-- TIMESTAMP: 2025-07-14

-- This script builds the foundational tables for the B2B SaaS platform model.

BEGIN;

-- ========= PART 1: CREATE NEW CORE TABLES =========

-- Table to store Partner organizations
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.partners IS 'Stores partner organizations who are the primary customers of the SaaS platform.';

-- Table to store the available tax tools
CREATE TABLE IF NOT EXISTS public.tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_development', 'deprecated'))
);
COMMENT ON TABLE public.tools IS 'Defines the suite of tax tools offered by the platform.';

-- Junction table for Admin -> Partner tool subscriptions
CREATE TABLE IF NOT EXISTS public.partner_tool_subscriptions (
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    subscription_level TEXT NOT NULL CHECK (subscription_level IN ('full', 'limited', 'reporting', 'none')),
    PRIMARY KEY (partner_id, tool_id)
);
COMMENT ON TABLE public.partner_tool_subscriptions IS 'Maps which tools a partner is subscribed to, as set by the platform admin.';

-- Junction table for Partner -> Affiliate tool permissions
CREATE TABLE IF NOT EXISTS public.affiliate_tool_permissions (
    affiliate_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('full', 'limited', 'reporting', 'none')),
    PRIMARY KEY (affiliate_profile_id, tool_id)
);
COMMENT ON TABLE public.affiliate_tool_permissions IS 'Maps which tools an affiliate can access, as set by their parent partner.';

-- Table to store invoices for partners (MUST BE CREATED BEFORE TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('due', 'paid', 'overdue', 'cancelled')),
    total_amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    stripe_invoice_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.invoices IS 'Stores invoices generated from transactions for partners.';

-- Table to log each billable use of a tool
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'invoiced', 'paid', 'cancelled')),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.transactions IS 'Logs each billable event when a partner uses a tool for a client.';

-- Junction table for many-to-many relationship between clients and users
CREATE TABLE IF NOT EXISTS public.client_users (
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    PRIMARY KEY (client_id, profile_id)
);
COMMENT ON TABLE public.client_users IS 'Links users (profiles) to client accounts, allowing multiple users per client.';


-- ========= PART 2: MODIFY EXISTING TABLES =========

-- Add columns to profiles table to support new hierarchy
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS access_level TEXT CHECK (access_level IN ('platform', 'partner', 'affiliate', 'client')),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add columns to clients table for organizational linking
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE;
-- Note: affiliate_id already exists, ensure it references profiles table


-- ========= PART 3: SEED INITIAL DATA =========

-- Seed the tools table with initial data
INSERT INTO public.tools (name, slug, description, status)
VALUES
    ('R&D Tax Credit', 'rd-tax-credit', 'Calculates the Research & Development Tax Credit.', 'active'),
    ('Augusta Rule', 'augusta-rule', 'Applies the Augusta Rule for tax-free rental income.', 'active'),
    ('Child Work Credit', 'child-work-credit', 'Manages tax implications of hiring your children.', 'in_development')
ON CONFLICT (slug) DO NOTHING;

-- Add unique constraint to profiles email if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_unique'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- Seed a test partner
INSERT INTO public.partners (company_name, logo_url, stripe_customer_id)
VALUES ('Test Partner Inc.', 'https://example.com/logo.png', 'cus_test123')
ON CONFLICT (company_name) DO NOTHING;

-- Update existing admin user with proper platform access
UPDATE public.profiles 
SET access_level = 'platform', role = 'admin'
WHERE email = 'admin@taxrxgroup.com';



-- ========= PART 4: CREATE INDEXES FOR PERFORMANCE =========

CREATE INDEX IF NOT EXISTS idx_partners_stripe_customer_id ON public.partners(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partner_id ON public.transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON public.invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON public.profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_clients_partner_id ON public.clients(partner_id);

COMMIT;