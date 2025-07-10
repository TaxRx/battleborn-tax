-- Update existing rd_contractors table to match the expected schema
-- This migration updates the existing table structure to support the new contractor setup

-- First, add the new columns
ALTER TABLE public.rd_contractors 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS role_id uuid,
ADD COLUMN IF NOT EXISTS is_owner boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS amount numeric(15, 2);

-- Update existing records to split the name field
UPDATE public.rd_contractors 
SET 
  first_name = CASE 
    WHEN name IS NOT NULL THEN 
      CASE 
        WHEN position(' ' in name) > 0 THEN substring(name from 1 for position(' ' in name) - 1)
        ELSE name
      END
    ELSE NULL
  END,
  last_name = CASE 
    WHEN name IS NOT NULL THEN 
      CASE 
        WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
        ELSE NULL
      END
    ELSE NULL
  END,
  amount = annual_cost
WHERE first_name IS NULL;

-- Add foreign key constraint for role_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'rd_contractors_role_id_fkey'
  ) THEN
    ALTER TABLE public.rd_contractors 
    ADD CONSTRAINT rd_contractors_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES public.rd_roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create rd_contractor_year_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rd_contractor_year_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  practice_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  time_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  baseline_practice_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  baseline_time_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_contractor_year_data_pkey PRIMARY KEY (id),
  CONSTRAINT rd_contractor_year_data_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors (id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years (id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_year_data_unique UNIQUE (contractor_id, business_year_id)
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
  practice_percentage numeric(5, 2) NULL,
  year_percentage numeric(5, 2) NULL,
  frequency_percentage numeric(5, 2) NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_contractor_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_contractor_subcomponents_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors (id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents (id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years (id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_subcomponents_unique UNIQUE (contractor_id, subcomponent_id, business_year_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rd_contractor_year_data_contractor_id ON public.rd_contractor_year_data(contractor_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_year_data_business_year_id ON public.rd_contractor_year_data(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_subcomponents_contractor_id ON public.rd_contractor_subcomponents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_subcomponents_subcomponent_id ON public.rd_contractor_subcomponents(subcomponent_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_subcomponents_business_year_id ON public.rd_contractor_subcomponents(business_year_id);

-- Enable RLS on new tables
ALTER TABLE public.rd_contractor_year_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_contractor_subcomponents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractor_year_data FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractor_year_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractor_year_data FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractor_year_data FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractor_subcomponents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractor_subcomponents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractor_subcomponents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractor_subcomponents FOR DELETE USING (auth.role() = 'authenticated'); 