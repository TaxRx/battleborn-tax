-- Full Redesign: Interconnected Client Management System
-- This script creates a complete normalized database structure that works with existing tool_enrollments
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DROP EXISTING TABLES AND FUNCTIONS (IF THEY EXIST) - BE CAREFUL!
-- ============================================================================

-- Drop functions first (in case they reference tables)
DROP FUNCTION IF EXISTS get_client_with_data(UUID) CASCADE;
DROP FUNCTION IF EXISTS archive_client(UUID, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS business_years CASCADE;
DROP TABLE IF EXISTS personal_years CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Clients table (main client information)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    filing_status VARCHAR(50) NOT NULL DEFAULT 'single',
    home_address TEXT,
    state VARCHAR(2),
    dependents INTEGER DEFAULT 0,
    standard_deduction BOOLEAN DEFAULT TRUE,
    custom_deduction DECIMAL(12,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Businesses table (multiple businesses per client)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'LLC',
    ein VARCHAR(20),
    business_address TEXT,
    business_city VARCHAR(100),
    business_state VARCHAR(2),
    business_zip VARCHAR(10),
    business_phone VARCHAR(50),
    business_email VARCHAR(255),
    industry VARCHAR(100),
    year_established INTEGER,
    annual_revenue DECIMAL(15,2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personal tax years table
CREATE TABLE IF NOT EXISTS personal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    wages_income DECIMAL(12,2) DEFAULT 0,
    passive_income DECIMAL(12,2) DEFAULT 0,
    unearned_income DECIMAL(12,2) DEFAULT 0,
    capital_gains DECIMAL(12,2) DEFAULT 0,
    long_term_capital_gains DECIMAL(12,2) DEFAULT 0,
    household_income DECIMAL(12,2) DEFAULT 0,
    ordinary_income DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, year)
);

-- Business tax years table
CREATE TABLE IF NOT EXISTS business_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    ordinary_k1_income DECIMAL(12,2) DEFAULT 0,
    guaranteed_k1_income DECIMAL(12,2) DEFAULT 0,
    annual_revenue DECIMAL(15,2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_archived ON clients(archived);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_businesses_client_id ON businesses(client_id);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_entity_type ON businesses(entity_type);

-- Personal years indexes
CREATE INDEX IF NOT EXISTS idx_personal_years_client_id ON personal_years(client_id);
CREATE INDEX IF NOT EXISTS idx_personal_years_year ON personal_years(year);

-- Business years indexes
CREATE INDEX IF NOT EXISTS idx_business_years_business_id ON business_years(business_id);
CREATE INDEX IF NOT EXISTS idx_business_years_year ON business_years(year);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_years ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.uid() = created_by);

-- Businesses policies
CREATE POLICY "Users can view businesses for their clients" ON businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = businesses.client_id 
            AND clients.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert businesses for their clients" ON businesses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = businesses.client_id 
            AND clients.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update businesses for their clients" ON businesses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = businesses.client_id 
            AND clients.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete businesses for their clients" ON businesses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = businesses.client_id 
            AND clients.created_by = auth.uid()
        )
    );

-- Personal years policies
CREATE POLICY "Users can view personal years for their clients" ON personal_years
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = personal_years.client_id 
            AND clients.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert personal years for their clients" ON personal_years
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = personal_years.client_id 
            AND clients.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update personal years for their clients" ON personal_years
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = personal_years.client_id 
            AND clients.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete personal years for their clients" ON personal_years
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = personal_years.client_id 
            AND clients.created_by = auth.uid()
        )
    );

-- Business years policies
CREATE POLICY "Users can view business years for their businesses" ON business_years
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id
            WHERE businesses.id = business_years.business_id 
            AND clients.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert business years for their businesses" ON business_years
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id
            WHERE businesses.id = business_years.business_id 
            AND clients.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update business years for their businesses" ON business_years
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id
            WHERE businesses.id = business_years.business_id 
            AND clients.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete business years for their businesses" ON business_years
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id
            WHERE businesses.id = business_years.business_id 
            AND clients.created_by = auth.uid()
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_years_updated_at BEFORE UPDATE ON personal_years
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_years_updated_at BEFORE UPDATE ON business_years
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get client with all related data
CREATE OR REPLACE FUNCTION get_client_with_data(client_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'client', c,
        'personal_years', COALESCE(py_data, '[]'::json),
        'businesses', COALESCE(b_data, '[]'::json)
    ) INTO result
    FROM clients c
    LEFT JOIN (
        SELECT 
            client_id,
            json_agg(py.*) as py_data
        FROM personal_years py
        WHERE py.client_id = client_uuid
        GROUP BY client_id
    ) py ON c.id = py.client_id
    LEFT JOIN (
        SELECT 
            b.client_id,
            json_agg(
                json_build_object(
                    'business', b,
                    'business_years', COALESCE(by_data, '[]'::json)
                )
            ) as b_data
        FROM businesses b
        LEFT JOIN (
            SELECT 
                business_id,
                json_agg(by.*) as by_data
            FROM business_years by
            WHERE by.business_id IN (SELECT id FROM businesses WHERE client_id = client_uuid)
            GROUP BY business_id
        ) by ON b.id = by.business_id
        WHERE b.client_id = client_uuid
        GROUP BY b.client_id
    ) b ON c.id = b.client_id
    WHERE c.id = client_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to archive/unarchive client
CREATE OR REPLACE FUNCTION archive_client(p_client_id UUID, p_archive BOOLEAN)
RETURNS VOID AS $$
BEGIN
    UPDATE clients 
    SET 
        archived = p_archive,
        archived_at = CASE WHEN p_archive THEN NOW() ELSE NULL END
    WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert sample client
INSERT INTO clients (full_name, email, phone, filing_status, home_address, state, dependents, standard_deduction, custom_deduction) 
VALUES ('John Doe', 'john@example.com', '555-1234', 'single', '123 Main St', 'CA', 0, true, 0)
ON CONFLICT (email) DO NOTHING;

-- Get the client ID for sample data
DO $$
DECLARE
    sample_client_id UUID;
BEGIN
    SELECT id INTO sample_client_id FROM clients WHERE email = 'john@example.com';
    
    IF sample_client_id IS NOT NULL THEN
        -- Insert sample personal year
        INSERT INTO personal_years (client_id, year, wages_income, passive_income, unearned_income, capital_gains, long_term_capital_gains, household_income, ordinary_income, is_active)
        VALUES (sample_client_id, 2024, 75000, 5000, 2000, 3000, 2000, 82000, 80000, true)
        ON CONFLICT (client_id, year) DO NOTHING;
        
        -- Insert sample business
        INSERT INTO businesses (client_id, business_name, entity_type, ein, business_address, business_city, business_state, business_zip, business_phone, business_email, industry, year_established, annual_revenue, employee_count, is_active)
        VALUES (sample_client_id, 'Doe Consulting LLC', 'LLC', '12-3456789', '456 Business Ave', 'Los Angeles', 'CA', '90210', '555-5678', 'john@doeconsulting.com', 'Technology', 2020, 150000, 3, true)
        ON CONFLICT DO NOTHING;
        
        -- Get the business ID for sample business year
        DECLARE
            sample_business_id UUID;
        BEGIN
            SELECT id INTO sample_business_id FROM businesses WHERE client_id = sample_client_id LIMIT 1;
            
            IF sample_business_id IS NOT NULL THEN
                -- Insert sample business year
                INSERT INTO business_years (business_id, year, is_active, ordinary_k1_income, guaranteed_k1_income, annual_revenue, employee_count)
                VALUES (sample_business_id, 2024, true, 45000, 5000, 150000, 3)
                ON CONFLICT (business_id, year) DO NOTHING;
            END IF;
        END;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show table row counts
SELECT 
    'clients' as table_name,
    COUNT(*) as row_count
FROM clients
UNION ALL
SELECT 
    'businesses' as table_name,
    COUNT(*) as row_count
FROM businesses
UNION ALL
SELECT 
    'personal_years' as table_name,
    COUNT(*) as row_count
FROM personal_years
UNION ALL
SELECT 
    'business_years' as table_name,
    COUNT(*) as row_count
FROM business_years
UNION ALL
SELECT 
    'tool_enrollments' as table_name,
    COUNT(*) as row_count
FROM tool_enrollments
ORDER BY table_name;

-- Show sample client data
SELECT 
    c.full_name,
    c.email,
    COUNT(b.id) as business_count,
    COUNT(py.id) as personal_years_count,
    COUNT(by.id) as business_years_count
FROM clients c
LEFT JOIN businesses b ON c.id = b.client_id
LEFT JOIN personal_years py ON c.id = py.client_id
LEFT JOIN business_years by ON b.id = by.business_id
GROUP BY c.id, c.full_name, c.email
ORDER BY c.created_at DESC
LIMIT 5; 