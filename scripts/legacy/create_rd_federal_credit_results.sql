-- Create table for storing R&D federal credit calculation results
CREATE TABLE IF NOT EXISTS public.rd_federal_credit_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL,
  
  -- Standard Credit fields
  standard_credit numeric(15, 2),
  standard_adjusted_credit numeric(15, 2),
  standard_base_percentage numeric(5, 4),
  standard_fixed_base_amount numeric(15, 2),
  standard_incremental_qre numeric(15, 2),
  standard_is_eligible boolean DEFAULT false,
  standard_missing_data jsonb,
  
  -- ASC Credit fields
  asc_credit numeric(15, 2),
  asc_adjusted_credit numeric(15, 2),
  asc_avg_prior_qre numeric(15, 2),
  asc_incremental_qre numeric(15, 2),
  asc_is_startup boolean DEFAULT false,
  asc_missing_data jsonb,
  
  -- Method selection and settings
  selected_method text CHECK (selected_method IN ('standard', 'asc')),
  use_280c boolean DEFAULT false,
  corporate_tax_rate numeric(5, 4) DEFAULT 0.21,
  
  -- Totals
  total_federal_credit numeric(15, 2),
  total_state_credits numeric(15, 2),
  total_credits numeric(15, 2),
  
  -- Metadata
  calculation_date timestamp with time zone DEFAULT now(),
  qre_breakdown jsonb,
  historical_data jsonb,
  state_credits jsonb,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT rd_federal_credit_results_pkey PRIMARY KEY (id),
  CONSTRAINT rd_federal_credit_results_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
  CONSTRAINT rd_federal_credit_results_unique UNIQUE (business_year_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_results_business_year_id ON public.rd_federal_credit_results(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_results_calculation_date ON public.rd_federal_credit_results(calculation_date);

-- Enable RLS
ALTER TABLE public.rd_federal_credit_results ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies that work with any authenticated user
DROP POLICY IF EXISTS "Users can view their own federal credit results" ON public.rd_federal_credit_results;
CREATE POLICY "Users can view their own federal credit results" ON public.rd_federal_credit_results
FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert their own federal credit results" ON public.rd_federal_credit_results;
CREATE POLICY "Users can insert their own federal credit results" ON public.rd_federal_credit_results
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own federal credit results" ON public.rd_federal_credit_results;
CREATE POLICY "Users can update their own federal credit results" ON public.rd_federal_credit_results
FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own federal credit results" ON public.rd_federal_credit_results;
CREATE POLICY "Users can delete their own federal credit results" ON public.rd_federal_credit_results
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS handle_rd_federal_credit_results_updated_at ON public.rd_federal_credit_results;
CREATE TRIGGER handle_rd_federal_credit_results_updated_at
BEFORE UPDATE ON public.rd_federal_credit_results
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); 