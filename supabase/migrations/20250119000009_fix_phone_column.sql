-- Fix missing columns in admin_client_files table
-- Migration: 20250119000009_fix_phone_column.sql

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN phone TEXT;
    END IF;

    -- Add filing_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'filing_status'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN filing_status TEXT DEFAULT 'single';
    END IF;

    -- Add dependents column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'dependents'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN dependents INTEGER DEFAULT 0;
    END IF;

    -- Add home_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'home_address'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN home_address TEXT;
    END IF;

    -- Add state column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN state TEXT DEFAULT 'NV';
    END IF;

    -- Add wages_income column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'wages_income'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN wages_income DECIMAL(12,2) DEFAULT 0;
    END IF;

    -- Add passive_income column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'passive_income'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN passive_income DECIMAL(12,2) DEFAULT 0;
    END IF;

    -- Add unearned_income column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'unearned_income'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN unearned_income DECIMAL(12,2) DEFAULT 0;
    END IF;

    -- Add capital_gains column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'capital_gains'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN capital_gains DECIMAL(12,2) DEFAULT 0;
    END IF;

    -- Add household_income column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'household_income'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN household_income DECIMAL(12,2) DEFAULT 0;
    END IF;

    -- Add standard_deduction column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'standard_deduction'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN standard_deduction BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add custom_deduction column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'custom_deduction'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN custom_deduction DECIMAL(12,2) DEFAULT 0;
    END IF;

    -- Add business_owner column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'business_owner'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN business_owner BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add business_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'business_name'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN business_name TEXT;
    END IF;

    -- Add entity_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'entity_type'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN entity_type TEXT;
    END IF;

    -- Add business_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'business_address'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN business_address TEXT;
    END IF;

    -- Add ordinary_k1_income column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'ordinary_k1_income'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN ordinary_k1_income DECIMAL(12,2) DEFAULT 0;
    END IF;

    -- Add guaranteed_k1_income column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'guaranteed_k1_income'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN guaranteed_k1_income DECIMAL(12,2) DEFAULT 0;
    END IF;

    -- Add business_annual_revenue column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_client_files' 
        AND column_name = 'business_annual_revenue'
    ) THEN
        ALTER TABLE public.admin_client_files ADD COLUMN business_annual_revenue DECIMAL(12,2) DEFAULT 0;
    END IF;

END $$;

-- Add comments for the columns
COMMENT ON COLUMN public.admin_client_files.phone IS 'Phone number of the client';
COMMENT ON COLUMN public.admin_client_files.filing_status IS 'Tax filing status (single, married, etc.)';
COMMENT ON COLUMN public.admin_client_files.dependents IS 'Number of dependents';
COMMENT ON COLUMN public.admin_client_files.home_address IS 'Home address of the client';
COMMENT ON COLUMN public.admin_client_files.state IS 'State of residence';
COMMENT ON COLUMN public.admin_client_files.wages_income IS 'Wages and salary income';
COMMENT ON COLUMN public.admin_client_files.passive_income IS 'Passive income';
COMMENT ON COLUMN public.admin_client_files.unearned_income IS 'Unearned income';
COMMENT ON COLUMN public.admin_client_files.capital_gains IS 'Capital gains income';
COMMENT ON COLUMN public.admin_client_files.household_income IS 'Total household income';
COMMENT ON COLUMN public.admin_client_files.standard_deduction IS 'Whether to use standard deduction';
COMMENT ON COLUMN public.admin_client_files.custom_deduction IS 'Custom deduction amount';
COMMENT ON COLUMN public.admin_client_files.business_owner IS 'Whether the client owns a business';
COMMENT ON COLUMN public.admin_client_files.business_name IS 'Name of the business';
COMMENT ON COLUMN public.admin_client_files.entity_type IS 'Type of business entity';
COMMENT ON COLUMN public.admin_client_files.business_address IS 'Business address';
COMMENT ON COLUMN public.admin_client_files.ordinary_k1_income IS 'Ordinary K-1 income';
COMMENT ON COLUMN public.admin_client_files.guaranteed_k1_income IS 'Guaranteed K-1 income';
COMMENT ON COLUMN public.admin_client_files.business_annual_revenue IS 'Annual business revenue'; 