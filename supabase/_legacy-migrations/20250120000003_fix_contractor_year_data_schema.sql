-- Fix rd_contractor_year_data table schema to match code expectations
-- The code expects: name, cost_amount, applied_percent, calculated_qre, activity_link, activity_roles

-- Drop the current table and recreate it with the correct schema
DROP TABLE IF EXISTS public.rd_contractor_year_data;

CREATE TABLE public.rd_contractor_year_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_year_id UUID NOT NULL REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES public.rd_contractors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cost_amount DECIMAL(15,2) NOT NULL,
    applied_percent DECIMAL(5,2) NOT NULL,
    calculated_qre DECIMAL(15,2) NOT NULL DEFAULT 0,
    activity_link JSONB NOT NULL DEFAULT '{}',
    activity_roles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT rd_contractor_year_data_unique UNIQUE (contractor_id, business_year_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rd_contractor_year_data_contractor_id ON public.rd_contractor_year_data(contractor_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractor_year_data_business_year_id ON public.rd_contractor_year_data(business_year_id);

-- Enable RLS
ALTER TABLE public.rd_contractor_year_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create updated_at trigger
DROP TRIGGER IF EXISTS handle_rd_contractor_year_data_updated_at ON public.rd_contractor_year_data;
CREATE TRIGGER handle_rd_contractor_year_data_updated_at
  BEFORE UPDATE ON public.rd_contractor_year_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 