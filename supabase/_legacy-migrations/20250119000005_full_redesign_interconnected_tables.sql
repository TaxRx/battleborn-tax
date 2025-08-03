-- Full Redesign: Interconnected Tables for Multi-Business Client Management
-- This migration creates a normalized schema for better scalability and maintainability

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLIENTS TABLE (Core client information)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    filing_status TEXT CHECK (filing_status IN ('single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household', 'qualifying_widow')),
    home_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    dependents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false
);

-- 2. BUSINESSES TABLE (Multiple businesses per client)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('llc', 'corporation', 'partnership', 'sole_proprietorship', 's_corp')),
    ein TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_zip TEXT,
    start_date DATE,
    industry TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. PERSONAL_TAX_YEARS TABLE (Personal tax data by year)
CREATE TABLE IF NOT EXISTS personal_tax_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
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

-- 4. BUSINESS_TAX_YEARS TABLE (Business financial data by year)
CREATE TABLE IF NOT EXISTS business_tax_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    gross_receipts DECIMAL(15,2) DEFAULT 0,
    cost_of_goods_sold DECIMAL(15,2) DEFAULT 0,
    gross_profit DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    net_income DECIMAL(15,2) DEFAULT 0,
    wages_paid DECIMAL(15,2) DEFAULT 0,
    contract_labor DECIMAL(15,2) DEFAULT 0,
    supplies DECIMAL(15,2) DEFAULT 0,
    rent DECIMAL(15,2) DEFAULT 0,
    utilities DECIMAL(15,2) DEFAULT 0,
    insurance DECIMAL(15,2) DEFAULT 0,
    depreciation DECIMAL(15,2) DEFAULT 0,
    other_expenses DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, tax_year)
);

-- 5. K1_ALLOCATIONS TABLE (K-1 allocations from businesses to clients)
CREATE TABLE IF NOT EXISTS k1_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    ownership_percentage DECIMAL(5,2) DEFAULT 100.00,
    ordinary_income DECIMAL(15,2) DEFAULT 0,
    net_rental_income DECIMAL(15,2) DEFAULT 0,
    other_net_rental_income DECIMAL(15,2) DEFAULT 0,
    guaranteed_payments DECIMAL(15,2) DEFAULT 0,
    interest_income DECIMAL(15,2) DEFAULT 0,
    royalties DECIMAL(15,2) DEFAULT 0,
    net_short_term_capital_gain DECIMAL(15,2) DEFAULT 0,
    net_long_term_capital_gain DECIMAL(15,2) DEFAULT 0,
    collectibles_gain DECIMAL(15,2) DEFAULT 0,
    unrecaptured_section_1250_gain DECIMAL(15,2) DEFAULT 0,
    net_section_1231_gain DECIMAL(15,2) DEFAULT 0,
    other_income DECIMAL(15,2) DEFAULT 0,
    section_179_deduction DECIMAL(15,2) DEFAULT 0,
    other_deductions DECIMAL(15,2) DEFAULT 0,
    self_employment_earnings DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, client_id, tax_year)
);

-- 6. TAX_CALCULATIONS TABLE (Stored tax calculation results)
CREATE TABLE IF NOT EXISTS tax_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    calculation_type TEXT NOT NULL CHECK (calculation_type IN ('rd_credit', 'augusta_rule', 'hire_children', 'cost_segregation', 'convertible_bonds', 'fmc')),
    input_data JSONB NOT NULL,
    calculation_results JSONB NOT NULL,
    total_savings DECIMAL(15,2) DEFAULT 0,
    effective_tax_rate DECIMAL(5,2) DEFAULT 0,
    marginal_tax_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(client_id, tax_year, calculation_type)
);

-- 7. RD_CREDIT_DETAILS TABLE (R&D Credit specific data)
CREATE TABLE IF NOT EXISTS rd_credit_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_id UUID NOT NULL REFERENCES tax_calculations(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    qualified_research_expenses DECIMAL(15,2) DEFAULT 0,
    base_amount DECIMAL(15,2) DEFAULT 0,
    incremental_expenses DECIMAL(15,2) DEFAULT 0,
    credit_percentage DECIMAL(5,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    research_activities JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_clients_active ON clients(is_active) WHERE is_active = true;

CREATE INDEX idx_businesses_client_id ON businesses(client_id);
CREATE INDEX idx_businesses_active ON businesses(is_active) WHERE is_active = true;
CREATE INDEX idx_businesses_entity_type ON businesses(entity_type);

CREATE INDEX idx_personal_tax_years_client_year ON personal_tax_years(client_id, tax_year);
CREATE INDEX idx_business_tax_years_business_year ON business_tax_years(business_id, tax_year);

CREATE INDEX idx_k1_allocations_business_client_year ON k1_allocations(business_id, client_id, tax_year);
CREATE INDEX idx_k1_allocations_client_year ON k1_allocations(client_id, tax_year);

CREATE INDEX idx_tax_calculations_client_year_type ON tax_calculations(client_id, tax_year, calculation_type);
CREATE INDEX idx_tax_calculations_created_by ON tax_calculations(created_by);

CREATE INDEX idx_rd_credit_details_calculation ON rd_credit_details(calculation_id);
CREATE INDEX idx_rd_credit_details_business ON rd_credit_details(business_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_tax_years_updated_at BEFORE UPDATE ON personal_tax_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_tax_years_updated_at BEFORE UPDATE ON business_tax_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_k1_allocations_updated_at BEFORE UPDATE ON k1_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_calculations_updated_at BEFORE UPDATE ON tax_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_credit_details_updated_at BEFORE UPDATE ON rd_credit_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_tax_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_tax_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE k1_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rd_credit_details ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view their own clients" ON clients FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid() = created_by);

-- Businesses policies
CREATE POLICY "Users can view businesses for their clients" ON businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = businesses.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can insert businesses for their clients" ON businesses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = businesses.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can update businesses for their clients" ON businesses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = businesses.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can delete businesses for their clients" ON businesses FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = businesses.client_id AND clients.created_by = auth.uid())
);

-- Personal tax years policies
CREATE POLICY "Users can view personal tax years for their clients" ON personal_tax_years FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = personal_tax_years.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can insert personal tax years for their clients" ON personal_tax_years FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = personal_tax_years.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can update personal tax years for their clients" ON personal_tax_years FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = personal_tax_years.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can delete personal tax years for their clients" ON personal_tax_years FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = personal_tax_years.client_id AND clients.created_by = auth.uid())
);

-- Business tax years policies
CREATE POLICY "Users can view business tax years for their clients" ON business_tax_years FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id 
            WHERE businesses.id = business_tax_years.business_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can insert business tax years for their clients" ON business_tax_years FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id 
            WHERE businesses.id = business_tax_years.business_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can update business tax years for their clients" ON business_tax_years FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id 
            WHERE businesses.id = business_tax_years.business_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can delete business tax years for their clients" ON business_tax_years FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses 
            JOIN clients ON businesses.client_id = clients.id 
            WHERE businesses.id = business_tax_years.business_id AND clients.created_by = auth.uid())
);

-- K1 allocations policies
CREATE POLICY "Users can view K1 allocations for their clients" ON k1_allocations FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = k1_allocations.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can insert K1 allocations for their clients" ON k1_allocations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = k1_allocations.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can update K1 allocations for their clients" ON k1_allocations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = k1_allocations.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can delete K1 allocations for their clients" ON k1_allocations FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = k1_allocations.client_id AND clients.created_by = auth.uid())
);

-- Tax calculations policies
CREATE POLICY "Users can view tax calculations for their clients" ON tax_calculations FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = tax_calculations.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can insert tax calculations for their clients" ON tax_calculations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = tax_calculations.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can update tax calculations for their clients" ON tax_calculations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = tax_calculations.client_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can delete tax calculations for their clients" ON tax_calculations FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = tax_calculations.client_id AND clients.created_by = auth.uid())
);

-- RD credit details policies
CREATE POLICY "Users can view RD credit details for their clients" ON rd_credit_details FOR SELECT USING (
    EXISTS (SELECT 1 FROM tax_calculations 
            JOIN clients ON tax_calculations.client_id = clients.id 
            WHERE tax_calculations.id = rd_credit_details.calculation_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can insert RD credit details for their clients" ON rd_credit_details FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tax_calculations 
            JOIN clients ON tax_calculations.client_id = clients.id 
            WHERE tax_calculations.id = rd_credit_details.calculation_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can update RD credit details for their clients" ON rd_credit_details FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tax_calculations 
            JOIN clients ON tax_calculations.client_id = clients.id 
            WHERE tax_calculations.id = rd_credit_details.calculation_id AND clients.created_by = auth.uid())
);
CREATE POLICY "Users can delete RD credit details for their clients" ON rd_credit_details FOR DELETE USING (
    EXISTS (SELECT 1 FROM tax_calculations 
            JOIN clients ON tax_calculations.client_id = clients.id 
            WHERE tax_calculations.id = rd_credit_details.calculation_id AND clients.created_by = auth.uid())
);

-- Utility functions for data aggregation
CREATE OR REPLACE FUNCTION get_client_total_income(client_uuid UUID, year INTEGER)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    total DECIMAL(15,2) := 0;
BEGIN
    -- Personal income
    SELECT COALESCE(SUM(total_income), 0) INTO total
    FROM personal_tax_years 
    WHERE client_id = client_uuid AND tax_year = year;
    
    -- K-1 income
    SELECT total + COALESCE(SUM(ordinary_income + guaranteed_payments + interest_income + royalties + 
                                net_short_term_capital_gain + net_long_term_capital_gain + other_income), 0)
    INTO total
    FROM k1_allocations 
    WHERE client_id = client_uuid AND tax_year = year;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_business_total_income(business_uuid UUID, year INTEGER)
RETURNS DECIMAL(15,2) AS $$
BEGIN
    RETURN COALESCE((
        SELECT net_income 
        FROM business_tax_years 
        WHERE business_id = business_uuid AND tax_year = year
    ), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate household income including K-1 allocations
CREATE OR REPLACE FUNCTION calculate_household_income(client_uuid UUID, year INTEGER)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    personal_income DECIMAL(15,2);
    k1_income DECIMAL(15,2);
    total_income DECIMAL(15,2);
BEGIN
    -- Get personal income
    SELECT COALESCE(total_income, 0) INTO personal_income
    FROM personal_tax_years 
    WHERE client_id = client_uuid AND tax_year = year;
    
    -- Get K-1 income
    SELECT COALESCE(SUM(ordinary_income + guaranteed_payments + interest_income + royalties + 
                       net_short_term_capital_gain + net_long_term_capital_gain + other_income), 0)
    INTO k1_income
    FROM k1_allocations 
    WHERE client_id = client_uuid AND tax_year = year;
    
    total_income := personal_income + k1_income;
    
    result := jsonb_build_object(
        'personal_income', personal_income,
        'k1_income', k1_income,
        'total_household_income', total_income,
        'tax_year', year
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive client data for tax calculations
CREATE OR REPLACE FUNCTION get_client_tax_data(client_uuid UUID, year INTEGER)
RETURNS JSONB AS $$
DECLARE
    client_data JSONB;
    personal_data JSONB;
    businesses_data JSONB;
    k1_data JSONB;
BEGIN
    -- Get client basic info
    SELECT jsonb_build_object(
        'id', id,
        'full_name', full_name,
        'filing_status', filing_status,
        'dependents', dependents
    ) INTO client_data
    FROM clients WHERE id = client_uuid;
    
    -- Get personal tax year data
    SELECT jsonb_build_object(
        'wages_income', wages_income,
        'passive_income', passive_income,
        'unearned_income', unearned_income,
        'capital_gains', capital_gains,
        'standard_deduction', standard_deduction,
        'custom_deduction', custom_deduction,
        'total_income', total_income,
        'taxable_income', taxable_income
    ) INTO personal_data
    FROM personal_tax_years 
    WHERE client_id = client_uuid AND tax_year = year;
    
    -- Get businesses data
    SELECT jsonb_agg(jsonb_build_object(
        'business_id', b.id,
        'business_name', b.business_name,
        'entity_type', b.entity_type,
        'financial_data', jsonb_build_object(
            'gross_receipts', bty.gross_receipts,
            'cost_of_goods_sold', bty.cost_of_goods_sold,
            'gross_profit', bty.gross_profit,
            'total_expenses', bty.total_expenses,
            'net_income', bty.net_income,
            'wages_paid', bty.wages_paid,
            'contract_labor', bty.contract_labor,
            'supplies', bty.supplies,
            'rent', bty.rent,
            'utilities', bty.utilities,
            'insurance', bty.insurance,
            'depreciation', bty.depreciation,
            'other_expenses', bty.other_expenses
        )
    )) INTO businesses_data
    FROM businesses b
    LEFT JOIN business_tax_years bty ON b.id = bty.business_id AND bty.tax_year = year
    WHERE b.client_id = client_uuid AND b.is_active = true;
    
    -- Get K-1 allocations
    SELECT jsonb_agg(jsonb_build_object(
        'business_id', business_id,
        'ownership_percentage', ownership_percentage,
        'ordinary_income', ordinary_income,
        'guaranteed_payments', guaranteed_payments,
        'interest_income', interest_income,
        'royalties', royalties,
        'net_short_term_capital_gain', net_short_term_capital_gain,
        'net_long_term_capital_gain', net_long_term_capital_gain,
        'other_income', other_income,
        'self_employment_earnings', self_employment_earnings
    )) INTO k1_data
    FROM k1_allocations 
    WHERE client_id = client_uuid AND tax_year = year;
    
    RETURN jsonb_build_object(
        'client', client_data,
        'personal_tax_year', personal_data,
        'businesses', businesses_data,
        'k1_allocations', k1_data,
        'tax_year', year
    );
END;
$$ LANGUAGE plpgsql; 