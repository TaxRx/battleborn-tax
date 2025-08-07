-- Fix the missing contractor_id column issue
-- This script adds the contractor_id column to the rd_contractor_subcomponents table

-- Add contractor_id column to rd_contractor_subcomponents if it doesn't exist
ALTER TABLE public.rd_contractor_subcomponents 
ADD COLUMN IF NOT EXISTS contractor_id uuid;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_contractor_subcomponents_contractor_id_fkey'
        AND table_name = 'rd_contractor_subcomponents'
    ) THEN
        ALTER TABLE public.rd_contractor_subcomponents 
        ADD CONSTRAINT rd_contractor_subcomponents_contractor_id_fkey 
        FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id);
    END IF;
END $$;

-- Add contractor_id column to rd_contractor_year_data if it doesn't exist
ALTER TABLE public.rd_contractor_year_data 
ADD COLUMN IF NOT EXISTS contractor_id uuid;

-- Add foreign key constraint for rd_contractor_year_data if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_contractor_year_data_contractor_id_fkey'
        AND table_name = 'rd_contractor_year_data'
    ) THEN
        ALTER TABLE public.rd_contractor_year_data 
        ADD CONSTRAINT rd_contractor_year_data_contractor_id_fkey 
        FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id);
    END IF;
END $$;

-- Verify the columns exist
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('rd_contractor_subcomponents', 'rd_contractor_year_data')
AND column_name = 'contractor_id'
ORDER BY table_name; 