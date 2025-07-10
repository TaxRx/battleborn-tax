-- Fix the missing user_id column issue
-- This script adds the user_id column to the appropriate table

-- First, let's check which table is missing user_id by adding it to common tables
-- Add user_id column to rd_contractors if it doesn't exist
ALTER TABLE public.rd_contractors 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add user_id column to rd_employees if it doesn't exist
ALTER TABLE public.rd_employees 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add user_id column to rd_contractor_year_data if it doesn't exist
ALTER TABLE public.rd_contractor_year_data 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add user_id column to rd_employee_year_data if it doesn't exist
ALTER TABLE public.rd_employee_year_data 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add user_id column to rd_contractor_subcomponents if it doesn't exist
ALTER TABLE public.rd_contractor_subcomponents 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add user_id column to rd_employee_subcomponents if it doesn't exist
ALTER TABLE public.rd_employee_subcomponents 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for rd_contractors.user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_contractors_user_id_fkey'
        AND table_name = 'rd_contractors'
    ) THEN
        ALTER TABLE public.rd_contractors 
        ADD CONSTRAINT rd_contractors_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;

    -- Add foreign key for rd_employees.user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_employees_user_id_fkey'
        AND table_name = 'rd_employees'
    ) THEN
        ALTER TABLE public.rd_employees 
        ADD CONSTRAINT rd_employees_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rd_contractors_user_id ON public.rd_contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_rd_employees_user_id ON public.rd_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_year_data_user_id ON public.rd_contractor_year_data(user_id);
CREATE INDEX IF NOT EXISTS idx_rd_employee_year_data_user_id ON public.rd_employee_year_data(user_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_subcomponents_user_id ON public.rd_contractor_subcomponents(user_id);
CREATE INDEX IF NOT EXISTS idx_rd_employee_subcomponents_user_id ON public.rd_employee_subcomponents(user_id); 