-- Minimal Client Management Tables
-- This creates just the basic tables needed for client creation to work
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- ============================================================================
-- BASIC INDEXES
-- ============================================================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_archived ON clients(archived);

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_businesses_client_id ON businesses(client_id);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active);

-- Personal years indexes
CREATE INDEX IF NOT EXISTS idx_personal_years_client_id ON personal_years(client_id);
CREATE INDEX IF NOT EXISTS idx_personal_years_year ON personal_years(year);

-- Business years indexes
CREATE INDEX IF NOT EXISTS idx_business_years_business_id ON business_years(business_id);
CREATE INDEX IF NOT EXISTS idx_business_years_year ON business_years(year);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show the tables that were created
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
ORDER BY table_name; 