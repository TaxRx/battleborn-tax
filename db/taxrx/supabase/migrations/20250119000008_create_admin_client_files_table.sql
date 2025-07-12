-- Create admin_client_files table
-- Migration: 20250119000008_create_admin_client_files_table.sql

-- Create the admin_client_files table with all required columns
CREATE TABLE IF NOT EXISTS public.admin_client_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    affiliate_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    filing_status TEXT DEFAULT 'single',
    dependents INTEGER DEFAULT 0,
    home_address TEXT,
    state TEXT DEFAULT 'NV',
    wages_income DECIMAL(12,2) DEFAULT 0,
    passive_income DECIMAL(12,2) DEFAULT 0,
    unearned_income DECIMAL(12,2) DEFAULT 0,
    capital_gains DECIMAL(12,2) DEFAULT 0,
    household_income DECIMAL(12,2) DEFAULT 0,
    standard_deduction BOOLEAN DEFAULT TRUE,
    custom_deduction DECIMAL(12,2) DEFAULT 0,
    business_owner BOOLEAN DEFAULT FALSE,
    business_name TEXT,
    entity_type TEXT,
    business_address TEXT,
    ordinary_k1_income DECIMAL(12,2) DEFAULT 0,
    guaranteed_k1_income DECIMAL(12,2) DEFAULT 0,
    business_annual_revenue DECIMAL(12,2) DEFAULT 0,
    tax_profile_data JSONB,
    business_id UUID REFERENCES public.centralized_businesses(id) ON DELETE SET NULL,
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_client_files_admin_id ON public.admin_client_files(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_client_files_affiliate_id ON public.admin_client_files(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_admin_client_files_email ON public.admin_client_files(email);
CREATE INDEX IF NOT EXISTS idx_admin_client_files_business_id ON public.admin_client_files(business_id);
CREATE INDEX IF NOT EXISTS idx_admin_client_files_archived ON public.admin_client_files(archived);
CREATE INDEX IF NOT EXISTS idx_admin_client_files_created_at ON public.admin_client_files(created_at);

-- Enable Row Level Security
ALTER TABLE public.admin_client_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can see all client files
CREATE POLICY "Admins can view all client files" ON public.admin_client_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can see their own client files
CREATE POLICY "Users can view their own client files" ON public.admin_client_files
    FOR SELECT USING (admin_id = auth.uid());

-- Admins can manage all client files
CREATE POLICY "Admins can manage all client files" ON public.admin_client_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can manage their own client files
CREATE POLICY "Users can manage their own client files" ON public.admin_client_files
    FOR ALL USING (admin_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_admin_client_files_updated_at
    BEFORE UPDATE ON public.admin_client_files
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.admin_client_files IS 'Stores client files managed by admins';
COMMENT ON COLUMN public.admin_client_files.admin_id IS 'The admin who created/manages this client file';
COMMENT ON COLUMN public.admin_client_files.affiliate_id IS 'The affiliate associated with this client (if any)';
COMMENT ON COLUMN public.admin_client_files.full_name IS 'Full name of the client';
COMMENT ON COLUMN public.admin_client_files.email IS 'Email address of the client';
COMMENT ON COLUMN public.admin_client_files.tax_profile_data IS 'JSON data containing the complete tax profile';
COMMENT ON COLUMN public.admin_client_files.business_id IS 'Reference to the primary business for this client';
COMMENT ON COLUMN public.admin_client_files.archived IS 'Whether this client file has been archived (soft delete)'; 