-- Fix rd_supply_subcomponents foreign key constraint to reference rd_research_subcomponents
-- This aligns with the contractor subcomponents table and the actual data being used

-- Drop the existing foreign key constraint
ALTER TABLE public.rd_supply_subcomponents 
DROP CONSTRAINT IF EXISTS rd_supply_subcomponents_subcomponent_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.rd_supply_subcomponents 
ADD CONSTRAINT rd_supply_subcomponents_subcomponent_id_fkey 
FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE;

-- Update the comment to reflect the change
COMMENT ON CONSTRAINT rd_supply_subcomponents_subcomponent_id_fkey ON public.rd_supply_subcomponents IS 'References rd_research_subcomponents.id instead of rd_subcomponents.id to align with contractor allocations';

-- Update RLS policies to use client_id (not user_id)
DROP POLICY IF EXISTS "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents;
CREATE POLICY "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.rd_business_years
    WHERE id = rd_supply_subcomponents.business_year_id
    AND business_id IN (
      SELECT business_id FROM public.rd_businesses 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents;
CREATE POLICY "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rd_business_years
    WHERE id = rd_supply_subcomponents.business_year_id
    AND business_id IN (
      SELECT business_id FROM public.rd_businesses 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents;
CREATE POLICY "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.rd_business_years
    WHERE id = rd_supply_subcomponents.business_year_id
    AND business_id IN (
      SELECT business_id FROM public.rd_businesses 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents;
CREATE POLICY "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.rd_business_years
    WHERE id = rd_supply_subcomponents.business_year_id
    AND business_id IN (
      SELECT business_id FROM public.rd_businesses 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  )
); 