-- Add year-based income support
-- This migration adds support for year-based income tracking for both personal and business data

-- First, ensure we have the uuid-ossp extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create personal_years table for year-based personal income tracking
CREATE TABLE IF NOT EXISTS personal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL,
    year INTEGER NOT NULL,
    wages_income DECIMAL(12,2) DEFAULT 0,
    passive_income DECIMAL(12,2) DEFAULT 0,
    unearned_income DECIMAL(12,2) DEFAULT 0,
    capital_gains DECIMAL(12,2) DEFAULT 0,
    household_income DECIMAL(12,2) DEFAULT 0,
    ordinary_income_total DECIMAL(12,2) DEFAULT 0,
    long_term_capital_gains_total DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(profile_id, year)
);

-- Create business_years table for year-based business income tracking
CREATE TABLE IF NOT EXISTS business_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL,
    business_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    ordinary_k1_income DECIMAL(12,2) DEFAULT 0,
    guaranteed_k1_income DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(profile_id, business_name, year)
);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add foreign key for personal_years
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_personal_years_profile_id'
    ) THEN
        ALTER TABLE personal_years 
        ADD CONSTRAINT fk_personal_years_profile_id 
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for business_years
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_business_years_profile_id'
    ) THEN
        ALTER TABLE business_years 
        ADD CONSTRAINT fk_business_years_profile_id 
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_years_profile_id ON personal_years(profile_id);
CREATE INDEX IF NOT EXISTS idx_personal_years_year ON personal_years(year);
CREATE INDEX IF NOT EXISTS idx_business_years_profile_id ON business_years(profile_id);
CREATE INDEX IF NOT EXISTS idx_business_years_business_name ON business_years(business_name);
CREATE INDEX IF NOT EXISTS idx_business_years_year ON business_years(year);

-- Add RLS policies
ALTER TABLE personal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_years ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own personal years" ON personal_years;
DROP POLICY IF EXISTS "Users can insert own personal years" ON personal_years;
DROP POLICY IF EXISTS "Users can update own personal years" ON personal_years;
DROP POLICY IF EXISTS "Users can delete own personal years" ON personal_years;

DROP POLICY IF EXISTS "Users can view own business years" ON business_years;
DROP POLICY IF EXISTS "Users can insert own business years" ON business_years;
DROP POLICY IF EXISTS "Users can update own business years" ON business_years;
DROP POLICY IF EXISTS "Users can delete own business years" ON business_years;

-- Create RLS policies for personal_years
CREATE POLICY "Users can view own personal years" ON personal_years
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own personal years" ON personal_years
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own personal years" ON personal_years
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own personal years" ON personal_years
    FOR DELETE USING (auth.uid() = profile_id);

-- Create RLS policies for business_years
CREATE POLICY "Users can view own business years" ON business_years
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own business years" ON business_years
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own business years" ON business_years
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own business years" ON business_years
    FOR DELETE USING (auth.uid() = profile_id);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_personal_years_updated_at ON personal_years;
CREATE TRIGGER update_personal_years_updated_at
    BEFORE UPDATE ON personal_years
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_years_updated_at ON business_years;
CREATE TRIGGER update_business_years_updated_at
    BEFORE UPDATE ON business_years
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create utility functions for automatic calculations and data management

-- Function to calculate household income for a given year
CREATE OR REPLACE FUNCTION calculate_household_income(p_profile_id UUID, p_year INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    total_income DECIMAL(12,2) := 0;
BEGIN
    SELECT COALESCE(SUM(
        wages_income + 
        passive_income + 
        unearned_income + 
        capital_gains
    ), 0)
    INTO total_income
    FROM personal_years 
    WHERE profile_id = p_profile_id AND year = p_year;
    
    -- Add K-1 income from all businesses
    total_income := total_income + COALESCE((
        SELECT SUM(ordinary_k1_income + guaranteed_k1_income)
        FROM business_years 
        WHERE profile_id = p_profile_id AND year = p_year AND is_active = true
    ), 0);
    
    RETURN total_income;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically add a new year for a profile
CREATE OR REPLACE FUNCTION add_year_for_profile(p_profile_id UUID, p_year INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Add personal year if it doesn't exist
    INSERT INTO personal_years (profile_id, year)
    VALUES (p_profile_id, p_year)
    ON CONFLICT (profile_id, year) DO NOTHING;
    
    -- Add business years for all active businesses
    INSERT INTO business_years (profile_id, business_name, year)
    SELECT DISTINCT p_profile_id, business_name, p_year
    FROM business_years 
    WHERE profile_id = p_profile_id AND is_active = true
    ON CONFLICT (profile_id, business_name, year) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to copy data from one year to another
CREATE OR REPLACE FUNCTION copy_year_data(p_profile_id UUID, p_from_year INTEGER, p_to_year INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Copy personal year data
    INSERT INTO personal_years (profile_id, year, wages_income, passive_income, unearned_income, capital_gains)
    SELECT profile_id, p_to_year, wages_income, passive_income, unearned_income, capital_gains
    FROM personal_years 
    WHERE profile_id = p_profile_id AND year = p_from_year
    ON CONFLICT (profile_id, year) DO UPDATE SET
        wages_income = EXCLUDED.wages_income,
        passive_income = EXCLUDED.passive_income,
        unearned_income = EXCLUDED.unearned_income,
        capital_gains = EXCLUDED.capital_gains;
    
    -- Copy business year data
    INSERT INTO business_years (profile_id, business_name, year, ordinary_k1_income, guaranteed_k1_income)
    SELECT profile_id, business_name, p_to_year, ordinary_k1_income, guaranteed_k1_income
    FROM business_years 
    WHERE profile_id = p_profile_id AND year = p_from_year
    ON CONFLICT (profile_id, business_name, year) DO UPDATE SET
        ordinary_k1_income = EXCLUDED.ordinary_k1_income,
        guaranteed_k1_income = EXCLUDED.guaranteed_k1_income;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update household income calculations
CREATE OR REPLACE FUNCTION update_household_income_calculations()
RETURNS TRIGGER AS $$
BEGIN
    -- Update household income for the affected year
    UPDATE personal_years 
    SET household_income = calculate_household_income(NEW.profile_id, NEW.year)
    WHERE profile_id = NEW.profile_id AND year = NEW.year;
    
    -- Update ordinary income total (wages + passive + unearned + ordinary K-1)
    UPDATE personal_years 
    SET ordinary_income_total = (
        SELECT COALESCE(SUM(
            py.wages_income + 
            py.passive_income + 
            py.unearned_income
        ), 0) + COALESCE(SUM(by.ordinary_k1_income), 0)
        FROM personal_years py
        LEFT JOIN business_years by ON by.profile_id = py.profile_id AND by.year = py.year AND by.is_active = true
        WHERE py.profile_id = NEW.profile_id AND py.year = NEW.year
    )
    WHERE profile_id = NEW.profile_id AND year = NEW.year;
    
    -- Update long-term capital gains total
    UPDATE personal_years 
    SET long_term_capital_gains_total = (
        SELECT COALESCE(SUM(
            py.capital_gains
        ), 0) + COALESCE(SUM(by.guaranteed_k1_income), 0)
        FROM personal_years py
        LEFT JOIN business_years by ON by.profile_id = py.profile_id AND by.year = py.year AND by.is_active = true
        WHERE py.profile_id = NEW.profile_id AND py.year = NEW.year
    )
    WHERE profile_id = NEW.profile_id AND year = NEW.year;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update calculations
DROP TRIGGER IF EXISTS trigger_update_household_income_personal ON personal_years;
CREATE TRIGGER trigger_update_household_income_personal
    AFTER INSERT OR UPDATE ON personal_years
    FOR EACH ROW
    EXECUTE FUNCTION update_household_income_calculations();

DROP TRIGGER IF EXISTS trigger_update_household_income_business ON business_years;
CREATE TRIGGER trigger_update_household_income_business
    AFTER INSERT OR UPDATE ON business_years
    FOR EACH ROW
    EXECUTE FUNCTION update_household_income_calculations();
