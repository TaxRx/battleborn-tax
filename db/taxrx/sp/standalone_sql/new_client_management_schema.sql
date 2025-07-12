-- New Client Management System Database Schema
-- This script creates a complete normalized database structure for client management
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DROP OLD TABLES IF THEY EXIST (BE CAREFUL - THIS WILL DELETE DATA)
-- ============================================================================

-- Drop old tables if they exist (uncomment if you want to start fresh)
-- DROP TABLE IF EXISTS tool_enrollments CASCADE;
-- DROP TABLE IF EXISTS business_years CASCADE;
-- DROP TABLE IF EXISTS personal_years CASCADE;
-- DROP TABLE IF EXISTS businesses CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Clients table (main client information)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    filing_status VARCHAR(50) NOT NULL DEFAULT 'Single',
    home_address TEXT,
    state VARCHAR(2),
    dependents INTEGER DEFAULT 0,
    standard_deduction BOOLEAN DEFAULT true,
    custom_deduction DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Businesses table (business information)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
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
    is_active BOOLEAN DEFAULT true,
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
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, year)
);

-- Business tax years table
CREATE TABLE IF NOT EXISTS business_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    ordinary_k1_income DECIMAL(12,2) DEFAULT 0,
    guaranteed_k1_income DECIMAL(12,2) DEFAULT 0,
    annual_revenue DECIMAL(15,2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year)
);

-- Tool enrollments table
CREATE TABLE IF NOT EXISTS tool_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    tool_slug VARCHAR(50) NOT NULL,
    enrolled_by UUID NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_archived ON clients(archived);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_businesses_client_id ON businesses(client_id);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_entity_type ON businesses(entity_type);

-- Personal years indexes
CREATE INDEX IF NOT EXISTS idx_personal_years_client_id ON personal_years(client_id);
CREATE INDEX IF NOT EXISTS idx_personal_years_year ON personal_years(year);
CREATE INDEX IF NOT EXISTS idx_personal_years_active ON personal_years(is_active);

-- Business years indexes
CREATE INDEX IF NOT EXISTS idx_business_years_business_id ON business_years(business_id);
CREATE INDEX IF NOT EXISTS idx_business_years_year ON business_years(year);
CREATE INDEX IF NOT EXISTS idx_business_years_active ON business_years(is_active);

-- Tool enrollments indexes
CREATE INDEX IF NOT EXISTS idx_tool_enrollments_client_id ON tool_enrollments(client_id);
CREATE INDEX IF NOT EXISTS idx_tool_enrollments_business_id ON tool_enrollments(business_id);
CREATE INDEX IF NOT EXISTS idx_tool_enrollments_tool_slug ON tool_enrollments(tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_enrollments_status ON tool_enrollments(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

DROP POLICY IF EXISTS "Users can view businesses for their clients" ON businesses;
DROP POLICY IF EXISTS "Users can insert businesses for their clients" ON businesses;
DROP POLICY IF EXISTS "Users can update businesses for their clients" ON businesses;
DROP POLICY IF EXISTS "Users can delete businesses for their clients" ON businesses;

DROP POLICY IF EXISTS "Users can view personal years for their clients" ON personal_years;
DROP POLICY IF EXISTS "Users can insert personal years for their clients" ON personal_years;
DROP POLICY IF EXISTS "Users can update personal years for their clients" ON personal_years;
DROP POLICY IF EXISTS "Users can delete personal years for their clients" ON personal_years;

DROP POLICY IF EXISTS "Users can view business years for their businesses" ON business_years;
DROP POLICY IF EXISTS "Users can insert business years for their businesses" ON business_years;
DROP POLICY IF EXISTS "Users can update business years for their businesses" ON business_years;
DROP POLICY IF EXISTS "Users can delete business years for their businesses" ON business_years;

DROP POLICY IF EXISTS "Users can view tool enrollments for their clients" ON tool_enrollments;
DROP POLICY IF EXISTS "Users can insert tool enrollments for their clients" ON tool_enrollments;
DROP POLICY IF EXISTS "Users can update tool enrollments for their clients" ON tool_enrollments;
DROP POLICY IF EXISTS "Users can delete tool enrollments for their clients" ON tool_enrollments;

-- Clients policies
CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Users can view businesses for their clients" ON businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = businesses.client_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert businesses for their clients" ON businesses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = businesses.client_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can update businesses for their clients" ON businesses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = businesses.client_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete businesses for their clients" ON businesses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = businesses.client_id 
            AND clients.id = auth.uid()
        )
    );

-- Personal years policies
CREATE POLICY "Users can view personal years for their clients" ON personal_years
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = personal_years.client_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert personal years for their clients" ON personal_years
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = personal_years.client_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can update personal years for their clients" ON personal_years
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = personal_years.client_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete personal years for their clients" ON personal_years
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = personal_years.client_id 
            AND clients.id = auth.uid()
        )
    );

-- Business years policies
CREATE POLICY "Users can view business years for their businesses" ON business_years
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id
            WHERE businesses.id = business_years.business_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert business years for their businesses" ON business_years
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id
            WHERE businesses.id = business_years.business_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can update business years for their businesses" ON business_years
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id
            WHERE businesses.id = business_years.business_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete business years for their businesses" ON business_years
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id
            WHERE businesses.id = business_years.business_id 
            AND clients.id = auth.uid()
        )
    );

-- Tool enrollments policies
CREATE POLICY "Users can view tool enrollments for their clients" ON tool_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = tool_enrollments.client_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tool enrollments for their clients" ON tool_enrollments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = tool_enrollments.client_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can update tool enrollments for their clients" ON tool_enrollments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = tool_enrollments.client_id 
            AND clients.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tool enrollments for their clients" ON tool_enrollments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = tool_enrollments.client_id 
            AND clients.id = auth.uid()
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

CREATE TRIGGER update_tool_enrollments_updated_at BEFORE UPDATE ON tool_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to create a client with all related data
CREATE OR REPLACE FUNCTION create_client_with_data(
    p_full_name VARCHAR(255),
    p_email VARCHAR(255),
    p_phone VARCHAR(50) DEFAULT NULL,
    p_filing_status VARCHAR(50) DEFAULT 'Single',
    p_home_address TEXT DEFAULT NULL,
    p_state VARCHAR(2) DEFAULT NULL,
    p_dependents INTEGER DEFAULT 0,
    p_standard_deduction BOOLEAN DEFAULT true,
    p_custom_deduction DECIMAL(12,2) DEFAULT 0,
    p_personal_years JSON DEFAULT NULL,
    p_businesses JSON DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_client_id UUID;
    v_business_id UUID;
    v_personal_year JSON;
    v_business JSON;
    v_business_year JSON;
BEGIN
    -- Create the client
    INSERT INTO clients (
        full_name, email, phone, filing_status, home_address, state,
        dependents, standard_deduction, custom_deduction
    ) VALUES (
        p_full_name, p_email, p_phone, p_filing_status, p_home_address, p_state,
        p_dependents, p_standard_deduction, p_custom_deduction
    ) RETURNING id INTO v_client_id;

    -- Create personal years if provided
    IF p_personal_years IS NOT NULL THEN
        FOR v_personal_year IN SELECT * FROM json_array_elements(p_personal_years)
        LOOP
            INSERT INTO personal_years (
                client_id, year, wages_income, passive_income, unearned_income,
                capital_gains, long_term_capital_gains, is_active
            ) VALUES (
                v_client_id,
                (v_personal_year->>'year')::INTEGER,
                COALESCE((v_personal_year->>'wages_income')::DECIMAL(12,2), 0),
                COALESCE((v_personal_year->>'passive_income')::DECIMAL(12,2), 0),
                COALESCE((v_personal_year->>'unearned_income')::DECIMAL(12,2), 0),
                COALESCE((v_personal_year->>'capital_gains')::DECIMAL(12,2), 0),
                COALESCE((v_personal_year->>'long_term_capital_gains')::DECIMAL(12,2), 0),
                COALESCE((v_personal_year->>'is_active')::BOOLEAN, true)
            );
        END LOOP;
    END IF;

    -- Create businesses if provided
    IF p_businesses IS NOT NULL THEN
        FOR v_business IN SELECT * FROM json_array_elements(p_businesses)
        LOOP
            -- Create the business
            INSERT INTO businesses (
                client_id, business_name, entity_type, ein, business_address,
                business_city, business_state, business_zip, business_phone,
                business_email, industry, year_established, annual_revenue,
                employee_count, is_active
            ) VALUES (
                v_client_id,
                v_business->>'business_name',
                v_business->>'entity_type',
                v_business->>'ein',
                v_business->>'business_address',
                v_business->>'business_city',
                v_business->>'business_state',
                v_business->>'business_zip',
                v_business->>'business_phone',
                v_business->>'business_email',
                v_business->>'industry',
                (v_business->>'year_established')::INTEGER,
                COALESCE((v_business->>'annual_revenue')::DECIMAL(15,2), 0),
                COALESCE((v_business->>'employee_count')::INTEGER, 0),
                COALESCE((v_business->>'is_active')::BOOLEAN, true)
            ) RETURNING id INTO v_business_id;

            -- Create business years if provided
            IF v_business->'business_years' IS NOT NULL THEN
                FOR v_business_year IN SELECT * FROM json_array_elements(v_business->'business_years')
                LOOP
                    INSERT INTO business_years (
                        business_id, year, is_active, ordinary_k1_income,
                        guaranteed_k1_income, annual_revenue, employee_count
                    ) VALUES (
                        v_business_id,
                        (v_business_year->>'year')::INTEGER,
                        COALESCE((v_business_year->>'is_active')::BOOLEAN, true),
                        COALESCE((v_business_year->>'ordinary_k1_income')::DECIMAL(12,2), 0),
                        COALESCE((v_business_year->>'guaranteed_k1_income')::DECIMAL(12,2), 0),
                        COALESCE((v_business_year->>'annual_revenue')::DECIMAL(15,2), 0),
                        COALESCE((v_business_year->>'employee_count')::INTEGER, 0)
                    );
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a client with all related data
CREATE OR REPLACE FUNCTION get_client_with_data(p_client_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'client', row_to_json(c),
        'personal_years', COALESCE(
            (SELECT json_agg(row_to_json(py)) FROM personal_years py WHERE py.client_id = c.id),
            '[]'::json
        ),
        'businesses', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'business', row_to_json(b),
                    'business_years', COALESCE(
                        (SELECT json_agg(row_to_json(by)) FROM business_years by WHERE by.business_id = b.id),
                        '[]'::json
                    )
                )
            ) FROM businesses b WHERE b.client_id = c.id),
            '[]'::json
        )
    ) INTO v_result
    FROM clients c
    WHERE c.id = p_client_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive/unarchive a client
CREATE OR REPLACE FUNCTION archive_client(p_client_id UUID, p_archive BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE clients 
    SET archived = p_archive, archived_at = CASE WHEN p_archive THEN NOW() ELSE NULL END
    WHERE id = p_client_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enroll a client in a tool
CREATE OR REPLACE FUNCTION enroll_client_in_tool(
    p_client_id UUID,
    p_business_id UUID DEFAULT NULL,
    p_tool_slug VARCHAR(50),
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_enrollment_id UUID;
BEGIN
    INSERT INTO tool_enrollments (
        client_id, business_id, tool_slug, enrolled_by, notes
    ) VALUES (
        p_client_id, p_business_id, p_tool_slug, auth.uid(), p_notes
    ) RETURNING id INTO v_enrollment_id;
    
    RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client tools
CREATE OR REPLACE FUNCTION get_client_tools(p_client_id UUID, p_business_id UUID DEFAULT NULL)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(row_to_json(te))
        FROM tool_enrollments te
        WHERE te.client_id = p_client_id
        AND (p_business_id IS NULL OR te.business_id = p_business_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert sample client data (uncomment if you want sample data)
/*
INSERT INTO clients (id, full_name, email, phone, filing_status, state, dependents) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'John Smith', 'john@example.com', '555-1234', 'Single', 'CA', 0),
('550e8400-e29b-41d4-a716-446655440001', 'Jane Doe', 'jane@example.com', '555-5678', 'Married', 'NY', 2);

INSERT INTO businesses (client_id, business_name, entity_type, ein, business_address, business_city, business_state, annual_revenue, employee_count) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Smith Consulting LLC', 'LLC', '12-3456789', '123 Business St', 'Los Angeles', 'CA', 500000, 5),
('550e8400-e29b-41d4-a716-446655440001', 'Doe Enterprises Inc', 'S-Corp', '98-7654321', '456 Corporate Ave', 'New York', 'NY', 750000, 8);
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables were created
SELECT 'clients' as table_name, COUNT(*) as row_count FROM clients
UNION ALL
SELECT 'businesses' as table_name, COUNT(*) as row_count FROM businesses
UNION ALL
SELECT 'personal_years' as table_name, COUNT(*) as row_count FROM personal_years
UNION ALL
SELECT 'business_years' as table_name, COUNT(*) as row_count FROM business_years
UNION ALL
SELECT 'tool_enrollments' as table_name, COUNT(*) as row_count FROM tool_enrollments; 