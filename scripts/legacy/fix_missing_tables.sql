-- Fix missing tables and constraints
-- Run this in your Supabase SQL Editor

-- 1. Create the missing personal_tax_years table
CREATE TABLE IF NOT EXISTS personal_tax_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    tax_year INTEGER NOT NULL,
    wages_income DECIMAL(15,2) DEFAULT 0,
    passive_income DECIMAL(15,2) DEFAULT 0,
    unearned_income DECIMAL(15,2) DEFAULT 0,
    capital_gains DECIMAL(15,2) DEFAULT 0,
    standard_deduction DECIMAL(15,2) DEFAULT 0,
    custom_deduction DECIMAL(15,2) DEFAULT 0,
    total_income DECIMAL(15,2) DEFAULT 0,
    taxable_income DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, tax_year)
);

-- 2. Create the missing clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    filing_status TEXT DEFAULT 'single' CHECK (filing_status IN ('single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household', 'qualifying_widow')),
    home_address TEXT,
    state TEXT,
    dependents INTEGER DEFAULT 0,
    standard_deduction DECIMAL(15,2) DEFAULT 0,
    custom_deduction DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Create the missing businesses table if it doesn't exist
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('LLC', 'S-Corp', 'C-Corp', 'Partnership', 'Sole Proprietorship', 'Other')),
    business_address TEXT,
    ein TEXT,
    year_established INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add foreign key constraint to personal_tax_years if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'personal_tax_years_client_id_fkey'
    ) THEN
        ALTER TABLE personal_tax_years 
        ADD CONSTRAINT personal_tax_years_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_tax_years_client_year ON personal_tax_years(client_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_businesses_client_id ON businesses(client_id);

-- 6. Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_tax_years ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
CREATE POLICY "Users can view their own clients" ON clients FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
CREATE POLICY "Users can insert their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid() = created_by);

-- 8. Create RLS policies for businesses
DROP POLICY IF EXISTS "Users can view businesses for their clients" ON businesses;
CREATE POLICY "Users can view businesses for their clients" ON businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = businesses.client_id AND clients.created_by = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert businesses for their clients" ON businesses;
CREATE POLICY "Users can insert businesses for their clients" ON businesses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = businesses.client_id AND clients.created_by = auth.uid())
);

DROP POLICY IF EXISTS "Users can update businesses for their clients" ON businesses;
CREATE POLICY "Users can update businesses for their clients" ON businesses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = businesses.client_id AND clients.created_by = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete businesses for their clients" ON businesses;
CREATE POLICY "Users can delete businesses for their clients" ON businesses FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = businesses.client_id AND clients.created_by = auth.uid())
);

-- 9. Create RLS policies for personal_tax_years
DROP POLICY IF EXISTS "Users can view personal tax years for their clients" ON personal_tax_years;
CREATE POLICY "Users can view personal tax years for their clients" ON personal_tax_years FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = personal_tax_years.client_id AND clients.created_by = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert personal tax years for their clients" ON personal_tax_years;
CREATE POLICY "Users can insert personal tax years for their clients" ON personal_tax_years FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = personal_tax_years.client_id AND clients.created_by = auth.uid())
);

DROP POLICY IF EXISTS "Users can update personal tax years for their clients" ON personal_tax_years;
CREATE POLICY "Users can update personal tax years for their clients" ON personal_tax_years FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = personal_tax_years.client_id AND clients.created_by = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete personal tax years for their clients" ON personal_tax_years;
CREATE POLICY "Users can delete personal tax years for their clients" ON personal_tax_years FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = personal_tax_years.client_id AND clients.created_by = auth.uid())
);

-- 10. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personal_tax_years_updated_at ON personal_tax_years;
CREATE TRIGGER update_personal_tax_years_updated_at BEFORE UPDATE ON personal_tax_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Fix the get_unified_client_list function to work with the new table structure
CREATE OR REPLACE FUNCTION public.get_unified_client_list(
    p_tool_filter TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL,
    p_affiliate_id UUID DEFAULT NULL
)
RETURNS TABLE (
    client_file_id UUID,
    business_id UUID,
    admin_id UUID,
    affiliate_id UUID,
    archived BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    email TEXT,
    business_name TEXT,
    entity_type TEXT,
    tool_slug TEXT,
    tool_status TEXT,
    total_income DECIMAL(15,2),
    filing_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        c.id AS client_file_id,
        b.id AS business_id,
        c.created_by AS admin_id,
        NULL::UUID AS affiliate_id,
        NOT c.is_active AS archived,
        c.created_at,
        c.full_name,
        c.email,
        b.business_name,
        b.entity_type,
        'rd'::TEXT AS tool_slug,
        'active'::TEXT AS tool_status,
        COALESCE(
            (SELECT total_income FROM personal_tax_years pty 
             WHERE pty.client_id = c.id 
             ORDER BY pty.tax_year DESC 
             LIMIT 1),
            0
        ) AS total_income,
        c.filing_status
    FROM public.clients c
    LEFT JOIN public.businesses b ON c.id = b.client_id
    WHERE c.is_active = true
    AND (p_admin_id IS NULL OR c.created_by = p_admin_id)
    ORDER BY c.created_at DESC;
END;
$$; 