-- MIGRATION: Consolidate Partners, Affiliates, and Clients into Accounts Schema
-- TIMESTAMP: 2025-07-15
-- PURPOSE: Centralize all entity management around a single accounts table

BEGIN;

-- ========= PART 1: CREATE NEW ACCOUNT-CENTRIC STRUCTURE =========

-- Create account type enum
CREATE TYPE account_type AS ENUM ('admin', 'platform', 'affiliate', 'client', 'expert');

-- Create access level enum with expanded options
CREATE TYPE access_level_type AS ENUM ('full', 'limited', 'reporting', 'none', 'client', 'expert');

-- Create central accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type account_type NOT NULL,
    address TEXT,
    logo_url TEXT,
    website_url TEXT,
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.accounts IS 'Central table for all entities: admin, platform, affiliate, client, and expert accounts';

-- Create affiliates extension table for affiliate-specific data
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5,4) DEFAULT 0.10,
    territory TEXT,
    specializations TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.affiliates IS 'Extension table for affiliate-specific data when account.type = affiliate';

-- Create account_tool_access table (replaces partner_tool_subscriptions + affiliate_tool_permissions)
CREATE TABLE IF NOT EXISTS public.account_tool_access (
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    access_level access_level_type NOT NULL DEFAULT 'none',
    affiliate_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    granted_by UUID REFERENCES public.profiles(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, tool_id)
);

COMMENT ON TABLE public.account_tool_access IS 'Manages tool access permissions for accounts, with optional affiliate override';

-- Note: Will add constraint via trigger or application logic since CHECK constraints don't support subqueries

-- ========= PART 2: MODIFY EXISTING TABLES =========

-- Add account_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Add account_id to clients table and primary_affiliate_id
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS primary_affiliate_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Note: Will add constraint via trigger or application logic since CHECK constraints don't support subqueries

-- Add account_id to experts table (nullable for experts without logins)
ALTER TABLE public.experts 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

-- ========= PART 3: MIGRATE EXISTING DATA =========

-- Create admin account (there should only be one)
INSERT INTO public.accounts (id, name, type, created_at, updated_at)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Platform Administration',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Migrate existing partners to platform accounts
INSERT INTO public.accounts (id, name, type, stripe_customer_id, created_at, updated_at)
SELECT 
    id,
    company_name,
    'platform'::account_type,
    stripe_customer_id,
    created_at,
    updated_at
FROM public.partners
ON CONFLICT (id) DO NOTHING;

-- Update profiles to link to accounts
-- Link admin profiles to admin account
UPDATE public.profiles 
SET account_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
WHERE access_level = 'platform' AND is_admin = true;

-- Link other profiles to appropriate accounts based on partner_id
UPDATE public.profiles 
SET account_id = partner_id
WHERE partner_id IS NOT NULL AND account_id IS NULL;

-- For profiles without partner_id, create individual accounts based on access_level
DO $$
DECLARE
    profile_record RECORD;
    new_account_id UUID;
    account_type_val account_type;
BEGIN
    FOR profile_record IN 
        SELECT id, email, full_name, access_level 
        FROM public.profiles 
        WHERE account_id IS NULL
    LOOP
        -- Determine account type based on access_level
        CASE profile_record.access_level
            WHEN 'client' THEN account_type_val := 'client';
            WHEN 'affiliate' THEN account_type_val := 'affiliate';
            WHEN 'partner' THEN account_type_val := 'platform';
            ELSE account_type_val := 'client'; -- default
        END CASE;
        
        -- Create new account
        new_account_id := uuid_generate_v4();
        INSERT INTO public.accounts (id, name, type, created_at, updated_at)
        VALUES (
            new_account_id,
            COALESCE(profile_record.full_name, profile_record.email),
            account_type_val,
            NOW(),
            NOW()
        );
        
        -- Link profile to new account
        UPDATE public.profiles 
        SET account_id = new_account_id
        WHERE id = profile_record.id;
    END LOOP;
END $$;

-- Migrate client data to use accounts
-- Create client accounts for existing clients that don't have associated profiles
DO $$
DECLARE
    client_record RECORD;
    new_account_id UUID;
BEGIN
    FOR client_record IN 
        SELECT id, full_name, email 
        FROM public.clients 
        WHERE account_id IS NULL
    LOOP
        -- Create new client account
        new_account_id := uuid_generate_v4();
        INSERT INTO public.accounts (id, name, type, created_at, updated_at)
        VALUES (
            new_account_id,
            client_record.full_name,
            'client',
            NOW(),
            NOW()
        );
        
        -- Link client to new account
        UPDATE public.clients 
        SET account_id = new_account_id
        WHERE id = client_record.id;
    END LOOP;
END $$;

-- Set primary_affiliate_id for clients based on existing affiliate_id
UPDATE public.clients 
SET primary_affiliate_id = (
    SELECT p.account_id 
    FROM public.profiles p 
    WHERE p.id = clients.affiliate_id
)
WHERE affiliate_id IS NOT NULL 
AND primary_affiliate_id IS NULL;

-- Migrate partner_tool_subscriptions to account_tool_access
INSERT INTO public.account_tool_access (account_id, tool_id, access_level, granted_at)
SELECT 
    partner_id,
    tool_id,
    CASE subscription_level
        WHEN 'full' THEN 'full'::access_level_type
        WHEN 'limited' THEN 'limited'::access_level_type
        WHEN 'reporting' THEN 'reporting'::access_level_type
        WHEN 'none' THEN 'none'::access_level_type
        ELSE 'none'::access_level_type
    END,
    NOW()
FROM public.partner_tool_subscriptions
ON CONFLICT (account_id, tool_id) DO NOTHING;

-- ========= PART 4: UPDATE FOREIGN KEY REFERENCES =========

-- Update transactions table
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_partner_id_fkey;
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_account_id_fkey 
FOREIGN KEY (partner_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Update invoices table  
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_partner_id_fkey;
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_account_id_fkey 
FOREIGN KEY (partner_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Note: We're keeping the column names as partner_id for now to avoid breaking existing code
-- These can be renamed in a future migration after code updates

-- ========= PART 5: CREATE INDEXES FOR PERFORMANCE =========

CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_customer_id ON public.accounts(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON public.accounts(name);

CREATE INDEX IF NOT EXISTS idx_affiliates_account_id ON public.affiliates(account_id);

CREATE INDEX IF NOT EXISTS idx_account_tool_access_account_id ON public.account_tool_access(account_id);
CREATE INDEX IF NOT EXISTS idx_account_tool_access_tool_id ON public.account_tool_access(tool_id);
CREATE INDEX IF NOT EXISTS idx_account_tool_access_affiliate_id ON public.account_tool_access(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_profiles_account_id ON public.profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_clients_account_id ON public.clients(account_id);
CREATE INDEX IF NOT EXISTS idx_clients_primary_affiliate_id ON public.clients(primary_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_experts_account_id ON public.experts(account_id);

-- ========= PART 6: ADD CONSTRAINTS =========

-- Make account_id required for profiles (after migration)
-- Note: Commented out for now, will enable after verifying all profiles have accounts
-- ALTER TABLE public.profiles ALTER COLUMN account_id SET NOT NULL;

-- Make account_id required for clients (after migration)
-- Note: Commented out for now, will enable after verifying all clients have accounts
-- ALTER TABLE public.clients ALTER COLUMN account_id SET NOT NULL;

-- ========= PART 7: ENABLE ROW LEVEL SECURITY =========

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_tool_access ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for accounts
CREATE POLICY "Users can view their own account" ON public.accounts
    FOR SELECT USING (
        id IN (SELECT account_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins can view all accounts" ON public.accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- Basic RLS policies for account_tool_access
CREATE POLICY "Users can view their account tool access" ON public.account_tool_access
    FOR SELECT USING (
        account_id IN (SELECT account_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins can manage all tool access" ON public.account_tool_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

COMMIT;