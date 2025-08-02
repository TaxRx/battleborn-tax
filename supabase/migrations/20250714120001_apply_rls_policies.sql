-- MIGRATION: Apply Row Level Security (RLS) Policies
-- TIMESTAMP: 2025-07-08

BEGIN;

-- STEP 1: Solidify Data Model for Ownership

-- Add affiliate_id to clients to track ownership by affiliates.
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.profiles(id);

-- Add user_id to clients to prepare for the client portal.
-- This will link a client record to their actual user account.
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add created_by to tax_proposals to track ownership by affiliates.
ALTER TABLE public.tax_proposals
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create indexes for the new foreign key columns
CREATE INDEX IF NOT EXISTS idx_clients_affiliate_id ON public.clients(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_proposals_created_by ON public.tax_proposals(created_by);

-- STEP 2: Create SQL Helper Functions for Policies

-- Checks if the currently authenticated user has the 'admin' role.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Checks if the currently authenticated user is the affiliate linked to a specific client.
CREATE OR REPLACE FUNCTION public.is_affiliated_with_client(client_id_to_check UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_id_to_check AND affiliate_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Define and Apply RLS Policies

-- Purge existing policies to start fresh
DROP POLICY IF EXISTS "Admins can access all clients" ON public.clients;
DROP POLICY IF EXISTS "Affiliates can access their own clients" ON public.clients;
-- ... (repeat for all other tables and policies)

-- == clients table ==
CREATE POLICY "Admins can access all clients" ON public.clients FOR ALL USING (is_admin());
CREATE POLICY "Affiliates can access their own clients" ON public.clients FOR ALL USING (is_affiliated_with_client(id));

-- == businesses table ==
CREATE POLICY "Admins can access all business data" ON public.businesses FOR ALL USING (is_admin());
CREATE POLICY "Affiliates can access their clients' business data" ON public.businesses FOR ALL USING (is_affiliated_with_client(client_id));

-- == personal_years table ==
CREATE POLICY "Admins can access all personal_years data" ON public.personal_years FOR ALL USING (is_admin());
CREATE POLICY "Affiliates can access their clients' personal_years data" ON public.personal_years FOR ALL USING (is_affiliated_with_client(client_id));

-- == business_years table ==
CREATE POLICY "Admins can access all business_years data" ON public.business_years FOR ALL USING (is_admin());
CREATE POLICY "Affiliates can access their clients' business_years data" ON public.business_years FOR ALL USING (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND is_affiliated_with_client(client_id)));

-- == tax_proposals table ==
CREATE POLICY "Admins can access all proposals" ON public.tax_proposals FOR ALL USING (is_admin());
CREATE POLICY "Affiliates can access their own proposals" ON public.tax_proposals FOR ALL USING (created_by = auth.uid());

-- == client_documents table (from client portal architecture) ==
-- Note: This table does not exist yet, but the policy is defined here for completeness.
-- CREATE POLICY "Admins can access all client_documents" ON public.client_documents FOR ALL USING (is_admin());
-- CREATE POLICY "Affiliates can access their clients' documents" ON public.client_documents FOR ALL USING (is_affiliated_with_client(client_id));

-- STEP 4: Enable RLS on All Tables

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_proposals ENABLE ROW LEVEL SECURITY;

COMMIT;
