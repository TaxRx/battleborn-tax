-- Create year-based income tracking tables
-- Migration: 20250119000003_create_year_based_income_tables.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to ensure clean slate)
DROP TABLE IF EXISTS business_years CASCADE;
DROP TABLE IF EXISTS personal_years CASCADE;

-- Create personal_years table for tracking personal income by year
CREATE TABLE personal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    wages_income DECIMAL(12,2) DEFAULT 0,
    passive_income DECIMAL(12,2) DEFAULT 0,
    unearned_income DECIMAL(12,2) DEFAULT 0,
    capital_gains DECIMAL(12,2) DEFAULT 0,
    other_income DECIMAL(12,2) DEFAULT 0,
    total_income DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, year)
);

-- Create business_years table for tracking business income by year
CREATE TABLE business_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    business_name TEXT,
    entity_type TEXT,
    ordinary_k1_income DECIMAL(12,2) DEFAULT 0,
    guaranteed_k1_income DECIMAL(12,2) DEFAULT 0,
    business_income DECIMAL(12,2) DEFAULT 0,
    total_business_income DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_years_user_id ON personal_years(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_years_year ON personal_years(year);
CREATE INDEX IF NOT EXISTS idx_personal_years_user_year ON personal_years(user_id, year);
CREATE INDEX IF NOT EXISTS idx_business_years_user_id ON business_years(user_id);
CREATE INDEX IF NOT EXISTS idx_business_years_year ON business_years(year);
CREATE INDEX IF NOT EXISTS idx_business_years_user_year ON business_years(user_id, year);

-- Enable Row Level Security
ALTER TABLE personal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_years ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own personal years" ON personal_years;
DROP POLICY IF EXISTS "Users can insert their own personal years" ON personal_years;
DROP POLICY IF EXISTS "Users can update their own personal years" ON personal_years;
DROP POLICY IF EXISTS "Users can delete their own personal years" ON personal_years;

DROP POLICY IF EXISTS "Users can view their own business years" ON business_years;
DROP POLICY IF EXISTS "Users can insert their own business years" ON business_years;
DROP POLICY IF EXISTS "Users can update their own business years" ON business_years;
DROP POLICY IF EXISTS "Users can delete their own business years" ON business_years;

-- Create RLS policies for personal_years
CREATE POLICY "Users can view their own personal years"
    ON personal_years FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal years"
    ON personal_years FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal years"
    ON personal_years FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal years"
    ON personal_years FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for business_years
CREATE POLICY "Users can view their own business years"
    ON business_years FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business years"
    ON business_years FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business years"
    ON business_years FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business years"
    ON business_years FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_personal_years_updated_at ON personal_years;
DROP TRIGGER IF EXISTS update_business_years_updated_at ON business_years;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_personal_years_updated_at
    BEFORE UPDATE ON personal_years
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_years_updated_at
    BEFORE UPDATE ON business_years
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS calculate_household_income(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_or_create_personal_year(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_or_create_business_year(UUID, INTEGER);

-- Create function to calculate total household income for a year
CREATE OR REPLACE FUNCTION calculate_household_income(p_user_id UUID, p_year INTEGER)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    personal_total DECIMAL(12,2) := 0;
    business_total DECIMAL(12,2) := 0;
BEGIN
    -- Get personal income for the year
    SELECT COALESCE(total_income, 0) INTO personal_total
    FROM personal_years
    WHERE user_id = p_user_id AND year = p_year;
    
    -- Get business income for the year
    SELECT COALESCE(total_business_income, 0) INTO business_total
    FROM business_years
    WHERE user_id = p_user_id AND year = p_year;
    
    RETURN COALESCE(personal_total, 0) + COALESCE(business_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get or create year data
CREATE OR REPLACE FUNCTION get_or_create_personal_year(p_user_id UUID, p_year INTEGER)
RETURNS personal_years AS $$
DECLARE
    year_record personal_years;
BEGIN
    -- Try to get existing record
    SELECT * INTO year_record
    FROM personal_years
    WHERE user_id = p_user_id AND year = p_year;
    
    -- If not found, create new record
    IF NOT FOUND THEN
        INSERT INTO personal_years (user_id, year)
        VALUES (p_user_id, p_year)
        RETURNING * INTO year_record;
    END IF;
    
    RETURN year_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_or_create_business_year(p_user_id UUID, p_year INTEGER)
RETURNS business_years AS $$
DECLARE
    year_record business_years;
BEGIN
    -- Try to get existing record
    SELECT * INTO year_record
    FROM business_years
    WHERE user_id = p_user_id AND year = p_year;
    
    -- If not found, create new record
    IF NOT FOUND THEN
        INSERT INTO business_years (user_id, year)
        VALUES (p_user_id, p_year)
        RETURNING * INTO year_record;
    END IF;
    
    RETURN year_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 