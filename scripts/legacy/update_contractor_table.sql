-- Update existing rd_contractors table to match employee structure
ALTER TABLE public.rd_contractors 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS role_id uuid,
ADD COLUMN IF NOT EXISTS is_owner boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS amount numeric(15, 2);

-- Update existing data to split name into first_name and last_name
UPDATE public.rd_contractors 
SET first_name = name,
    last_name = '',
    amount = annual_cost
WHERE first_name IS NULL;

-- Add foreign key constraint for role_id
ALTER TABLE public.rd_contractors 
ADD CONSTRAINT rd_contractors_role_id_fkey 
FOREIGN KEY (role_id) REFERENCES rd_roles (id) ON DELETE CASCADE;

-- Drop old columns
ALTER TABLE public.rd_contractors 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS role,
DROP COLUMN IF EXISTS annual_cost;

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

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractor_year_data FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractor_year_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractor_year_data FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractor_year_data FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractor_subcomponents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractor_subcomponents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractor_subcomponents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractor_subcomponents FOR DELETE USING (auth.role() = 'authenticated'); 