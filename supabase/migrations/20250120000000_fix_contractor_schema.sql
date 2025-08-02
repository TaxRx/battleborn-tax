-- Fix contractor schema issues
-- This migration ensures the rd_contractors table has the correct structure
-- and creates the necessary related tables

-- First, let's check if rd_contractors table exists and has the right structure
DO $$
BEGIN
    -- Create rd_contractors table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rd_contractors') THEN
        CREATE TABLE public.rd_contractors (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            business_id uuid NOT NULL,
            first_name text NOT NULL,
            last_name text,
            role_id uuid,
            is_owner boolean DEFAULT false,
            amount numeric(15, 2) NOT NULL,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT rd_contractors_pkey PRIMARY KEY (id),
            CONSTRAINT rd_contractors_business_id_fkey FOREIGN KEY (business_id) REFERENCES rd_businesses (id) ON DELETE CASCADE
        );
    ELSE
        -- Add missing columns to existing table
        ALTER TABLE public.rd_contractors 
        ADD COLUMN IF NOT EXISTS first_name text,
        ADD COLUMN IF NOT EXISTS last_name text,
        ADD COLUMN IF NOT EXISTS role_id uuid,
        ADD COLUMN IF NOT EXISTS is_owner boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS amount numeric(15, 2);

        -- If the table has old columns, migrate the data
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rd_contractors' AND column_name = 'name') THEN
            UPDATE public.rd_contractors 
            SET first_name = name,
                last_name = '',
                amount = COALESCE(annual_cost, 0)
            WHERE first_name IS NULL;
            
            -- Drop old columns
            ALTER TABLE public.rd_contractors 
            DROP COLUMN IF EXISTS name,
            DROP COLUMN IF EXISTS role,
            DROP COLUMN IF EXISTS annual_cost;
        END IF;
    END IF;
END $$;

-- Add foreign key constraint for role_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_contractors_role_id_fkey'
    ) THEN
        ALTER TABLE public.rd_contractors 
        ADD CONSTRAINT rd_contractors_role_id_fkey 
        FOREIGN KEY (role_id) REFERENCES rd_roles (id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create rd_contractor_year_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rd_contractor_year_data (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    contractor_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    applied_percent numeric(5, 2) NOT NULL,
    calculated_qre numeric(15, 2) NOT NULL,
    activity_roles jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rd_contractor_year_data_pkey PRIMARY KEY (id),
    CONSTRAINT rd_contractor_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES rd_business_years (id) ON DELETE CASCADE,
    CONSTRAINT rd_contractor_year_data_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES rd_contractors (id) ON DELETE CASCADE
);

-- Create rd_contractor_subcomponents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rd_contractor_subcomponents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    contractor_id uuid NOT NULL,
    subcomponent_id uuid NOT NULL,
    business_year_id uuid NOT NULL,
    time_percentage numeric(5, 2) NOT NULL DEFAULT 0,
    applied_percentage numeric(5, 2) NOT NULL DEFAULT 0,
    is_included boolean NOT NULL DEFAULT true,
    baseline_applied_percent numeric(5, 2) NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    practice_percentage numeric NULL,
    year_percentage numeric NULL,
    frequency_percentage numeric NULL,
    baseline_practice_percentage numeric NULL,
    baseline_time_percentage numeric NULL,
    CONSTRAINT rd_contractor_subcomponents_pkey PRIMARY KEY (id),
    CONSTRAINT rd_contractor_subcomponents_unique UNIQUE (contractor_id, subcomponent_id, business_year_id),
    CONSTRAINT rd_contractor_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES rd_business_years (id) ON DELETE CASCADE,
    CONSTRAINT rd_contractor_subcomponents_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES rd_contractors (id) ON DELETE CASCADE,
    CONSTRAINT rd_contractor_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents (id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rd_contractor_year_data_contractor_year ON public.rd_contractor_year_data USING btree (contractor_id, business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_subcomponents_contractor_id ON public.rd_contractor_subcomponents USING btree (contractor_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_subcomponents_subcomponent_id ON public.rd_contractor_subcomponents USING btree (subcomponent_id);

-- Enable RLS
ALTER TABLE public.rd_contractor_year_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_contractor_subcomponents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_contractor_year_data;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_contractor_year_data;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_contractor_year_data;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_contractor_year_data;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rd_contractor_subcomponents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rd_contractor_subcomponents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rd_contractor_subcomponents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rd_contractor_subcomponents;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractor_year_data FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractor_year_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractor_year_data FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractor_year_data FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractor_subcomponents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractor_subcomponents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractor_subcomponents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractor_subcomponents FOR DELETE USING (auth.role() = 'authenticated'); 