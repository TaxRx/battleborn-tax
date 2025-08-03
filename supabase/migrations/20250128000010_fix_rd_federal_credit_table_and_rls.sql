-- Migration: Comprehensive fix for rd_federal_credit table and RLS policies
-- Issue: Table might not exist or RLS policies are too restrictive causing 406 errors
-- Purpose: Ensure table exists with proper structure and permissive RLS policies

-- First, ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS public.rd_federal_credit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core identification
    business_year_id UUID NOT NULL REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    
    -- Research activity details
    research_activity_id UUID REFERENCES public.rd_research_activities(id),
    research_activity_name TEXT,
    
    -- QRE breakdown
    direct_research_wages NUMERIC(15,2) DEFAULT 0,
    supplies_expenses NUMERIC(15,2) DEFAULT 0,
    contractor_expenses NUMERIC(15,2) DEFAULT 0,
    total_qre NUMERIC(15,2) DEFAULT 0,
    
    -- Subcomponent details
    subcomponent_count INTEGER DEFAULT 0,
    subcomponent_groups TEXT,
    applied_percent NUMERIC(5,2) DEFAULT 0,
    
    -- AI-generated descriptions
    line_49f_description TEXT,
    ai_generation_timestamp TIMESTAMP,
    ai_prompt_used TEXT,
    ai_response_raw TEXT,
    
    -- Calculation details
    federal_credit_amount NUMERIC(15,2) DEFAULT 0,
    federal_credit_percentage NUMERIC(5,2) DEFAULT 0,
    calculation_method TEXT,
    
    -- Industry and context
    industry_type TEXT,
    focus_area TEXT,
    general_description TEXT,
    
    -- Audit trail
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Version control
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT TRUE,
    previous_version_id UUID REFERENCES public.rd_federal_credit(id),
    
    -- Metadata
    calculation_timestamp TIMESTAMP DEFAULT NOW(),
    data_snapshot JSONB,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_percentages CHECK (applied_percent >= 0 AND applied_percent <= 100),
    CONSTRAINT valid_amounts CHECK (direct_research_wages >= 0 AND supplies_expenses >= 0 AND contractor_expenses >= 0),
    CONSTRAINT valid_subcomponent_count CHECK (subcomponent_count >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_business_year_id ON public.rd_federal_credit(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_client_id ON public.rd_federal_credit(client_id);
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_research_activity_name ON public.rd_federal_credit(research_activity_name);

-- Temporarily disable RLS to ensure we can modify policies
ALTER TABLE public.rd_federal_credit DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (including any potential ones with different names)
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'rd_federal_credit' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.rd_federal_credit';
        RAISE NOTICE 'Dropped policy: %', pol_name;
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.rd_federal_credit ENABLE ROW LEVEL SECURITY;

-- Create simplified, more permissive policies for authenticated users
-- These policies allow all authenticated users to read/write rd_federal_credit records
-- This matches the pattern used in other rd_* tables

CREATE POLICY "Enable read access for authenticated users" ON public.rd_federal_credit
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.rd_federal_credit
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.rd_federal_credit
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.rd_federal_credit
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_rd_federal_credit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rd_federal_credit_updated_at_trigger
    BEFORE UPDATE ON public.rd_federal_credit
    FOR EACH ROW
    EXECUTE FUNCTION update_rd_federal_credit_updated_at();

-- Verify the policies were created successfully
DO $$
BEGIN
    -- Check if the policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rd_federal_credit' 
        AND schemaname = 'public'
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        RAISE EXCEPTION 'Failed to create read policy for rd_federal_credit';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rd_federal_credit' 
        AND schemaname = 'public'
        AND policyname = 'Enable insert access for authenticated users'
    ) THEN
        RAISE EXCEPTION 'Failed to create insert policy for rd_federal_credit';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rd_federal_credit' 
        AND schemaname = 'public'
        AND policyname = 'Enable update access for authenticated users'
    ) THEN
        RAISE EXCEPTION 'Failed to create update policy for rd_federal_credit';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rd_federal_credit' 
        AND schemaname = 'public'
        AND policyname = 'Enable delete access for authenticated users'
    ) THEN
        RAISE EXCEPTION 'Failed to create delete policy for rd_federal_credit';
    END IF;
    
    RAISE NOTICE 'Successfully updated rd_federal_credit table and RLS policies';
    RAISE NOTICE '✅ All authenticated users can now read/write rd_federal_credit records';
    RAISE NOTICE '✅ Table structure ensured with proper indexes and triggers';
END $$;