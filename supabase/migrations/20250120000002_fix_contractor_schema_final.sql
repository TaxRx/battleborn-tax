-- Fix Contractor Schema - Final Migration
-- This migration ensures all contractor-related tables have the correct structure
-- and proper foreign key relationships

-- 1. Ensure rd_contractors table has the correct structure
ALTER TABLE IF EXISTS public.rd_contractors
  DROP COLUMN IF EXISTS contractor_id;

-- Add missing columns if they don't exist
ALTER TABLE IF EXISTS public.rd_contractors
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
    ELSE first_name
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND position(' ' in name) > 0 THEN 
      substring(name from position(' ' in name) + 1)
    ELSE last_name
  END
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- 2. Create rd_contractor_subcomponents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rd_contractor_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  time_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  applied_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  baseline_applied_percent numeric(5, 2),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  practice_percentage numeric(5, 2),
  year_percentage numeric(5, 2),
  frequency_percentage numeric(5, 2),
  CONSTRAINT rd_contractor_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_contractor_subcomponents_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_subcomponents(id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_subcomponents_unique UNIQUE (contractor_id, subcomponent_id, business_year_id)
);

-- 3. Create rd_contractor_year_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rd_contractor_year_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  practice_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  time_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  baseline_practice_percentage numeric(5, 2),
  baseline_time_percentage numeric(5, 2),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_contractor_year_data_pkey PRIMARY KEY (id),
  CONSTRAINT rd_contractor_year_data_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_year_data_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
  CONSTRAINT rd_contractor_year_data_unique UNIQUE (contractor_id, business_year_id)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rd_contractor_subcomponents_contractor_id ON public.rd_contractor_subcomponents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_subcomponents_subcomponent_id ON public.rd_contractor_subcomponents(subcomponent_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_subcomponents_business_year_id ON public.rd_contractor_subcomponents(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_year_data_contractor_id ON public.rd_contractor_year_data(contractor_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_year_data_business_year_id ON public.rd_contractor_year_data(business_year_id);

-- 5. Enable Row Level Security
ALTER TABLE public.rd_contractor_subcomponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_contractor_year_data ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for rd_contractor_subcomponents
DROP POLICY IF EXISTS "Users can view their own contractor subcomponents" ON public.rd_contractor_subcomponents;
CREATE POLICY "Users can view their own contractor subcomponents" ON public.rd_contractor_subcomponents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.rd_business_years 
      WHERE id = rd_contractor_subcomponents.business_year_id
    )
  );

DROP POLICY IF EXISTS "Users can insert their own contractor subcomponents" ON public.rd_contractor_subcomponents;
CREATE POLICY "Users can insert their own contractor subcomponents" ON public.rd_contractor_subcomponents
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.rd_business_years 
      WHERE id = rd_contractor_subcomponents.business_year_id
    )
  );

DROP POLICY IF EXISTS "Users can update their own contractor subcomponents" ON public.rd_contractor_subcomponents;
CREATE POLICY "Users can update their own contractor subcomponents" ON public.rd_contractor_subcomponents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.rd_business_years 
      WHERE id = rd_contractor_subcomponents.business_year_id
    )
  );

DROP POLICY IF EXISTS "Users can delete their own contractor subcomponents" ON public.rd_contractor_subcomponents;
CREATE POLICY "Users can delete their own contractor subcomponents" ON public.rd_contractor_subcomponents
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.rd_business_years 
      WHERE id = rd_contractor_subcomponents.business_year_id
    )
  );

-- 7. Create RLS policies for rd_contractor_year_data
DROP POLICY IF EXISTS "Users can view their own contractor year data" ON public.rd_contractor_year_data;
CREATE POLICY "Users can view their own contractor year data" ON public.rd_contractor_year_data
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.rd_business_years 
      WHERE id = rd_contractor_year_data.business_year_id
    )
  );

DROP POLICY IF EXISTS "Users can insert their own contractor year data" ON public.rd_contractor_year_data;
CREATE POLICY "Users can insert their own contractor year data" ON public.rd_contractor_year_data
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.rd_business_years 
      WHERE id = rd_contractor_year_data.business_year_id
    )
  );

DROP POLICY IF EXISTS "Users can update their own contractor year data" ON public.rd_contractor_year_data;
CREATE POLICY "Users can update their own contractor year data" ON public.rd_contractor_year_data
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.rd_business_years 
      WHERE id = rd_contractor_year_data.business_year_id
    )
  );

DROP POLICY IF EXISTS "Users can delete their own contractor year data" ON public.rd_contractor_year_data;
CREATE POLICY "Users can delete their own contractor year data" ON public.rd_contractor_year_data
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.rd_business_years 
      WHERE id = rd_contractor_year_data.business_year_id
    )
  );

-- 8. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_rd_contractor_subcomponents_updated_at ON public.rd_contractor_subcomponents;
CREATE TRIGGER handle_rd_contractor_subcomponents_updated_at
  BEFORE UPDATE ON public.rd_contractor_subcomponents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_rd_contractor_year_data_updated_at ON public.rd_contractor_year_data;
CREATE TRIGGER handle_rd_contractor_year_data_updated_at
  BEFORE UPDATE ON public.rd_contractor_year_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 