-- Add missing columns and tables for supply management

-- 1. Add supply_id to rd_supply_year_data to link to rd_supplies
ALTER TABLE public.rd_supply_year_data 
ADD COLUMN IF NOT EXISTS supply_id uuid REFERENCES public.rd_supplies(id) ON DELETE CASCADE;

-- 2. Add calculated_qre column to rd_supply_year_data
ALTER TABLE public.rd_supply_year_data 
ADD COLUMN IF NOT EXISTS calculated_qre numeric(15, 2);

-- 3. Create rd_supply_subcomponents table for allocation tracking
CREATE TABLE IF NOT EXISTS public.rd_supply_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  supply_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  applied_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_supply_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_supply_subcomponents_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.rd_supplies(id) ON DELETE CASCADE,
  CONSTRAINT rd_supply_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_subcomponents(id) ON DELETE CASCADE,
  CONSTRAINT rd_supply_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
  CONSTRAINT rd_supply_subcomponents_unique UNIQUE (supply_id, subcomponent_id, business_year_id)
);

-- 4. Create indexes for rd_supply_subcomponents
CREATE INDEX IF NOT EXISTS idx_rd_supply_subcomponents_supply_id ON public.rd_supply_subcomponents(supply_id);
CREATE INDEX IF NOT EXISTS idx_rd_supply_subcomponents_subcomponent_id ON public.rd_supply_subcomponents(subcomponent_id);
CREATE INDEX IF NOT EXISTS idx_rd_supply_subcomponents_business_year_id ON public.rd_supply_subcomponents(business_year_id);

-- 5. Enable RLS on rd_supply_subcomponents
ALTER TABLE public.rd_supply_subcomponents ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for rd_supply_subcomponents using client_id (not user_id)
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

-- 7. Create updated_at trigger for rd_supply_subcomponents
DROP TRIGGER IF EXISTS handle_rd_supply_subcomponents_updated_at ON public.rd_supply_subcomponents;
CREATE TRIGGER handle_rd_supply_subcomponents_updated_at
BEFORE UPDATE ON public.rd_supply_subcomponents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 8. Add RLS policies for rd_supplies if not already present
ALTER TABLE public.rd_supplies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own supplies" ON public.rd_supplies;
CREATE POLICY "Users can view their own supplies" ON public.rd_supplies
FOR SELECT USING (
  business_id IN (
    SELECT business_id FROM public.rd_businesses 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can insert their own supplies" ON public.rd_supplies;
CREATE POLICY "Users can insert their own supplies" ON public.rd_supplies
FOR INSERT WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.rd_businesses 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own supplies" ON public.rd_supplies;
CREATE POLICY "Users can update their own supplies" ON public.rd_supplies
FOR UPDATE USING (
  business_id IN (
    SELECT business_id FROM public.rd_businesses 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own supplies" ON public.rd_supplies;
CREATE POLICY "Users can delete their own supplies" ON public.rd_supplies
FOR DELETE USING (
  business_id IN (
    SELECT business_id FROM public.rd_businesses 
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

-- 9. Add RLS policies for rd_supply_year_data if not already present
ALTER TABLE public.rd_supply_year_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own supply year data" ON public.rd_supply_year_data;
CREATE POLICY "Users can view their own supply year data" ON public.rd_supply_year_data
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.rd_business_years
    WHERE id = rd_supply_year_data.business_year_id
    AND business_id IN (
      SELECT business_id FROM public.rd_businesses 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can insert their own supply year data" ON public.rd_supply_year_data;
CREATE POLICY "Users can insert their own supply year data" ON public.rd_supply_year_data
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rd_business_years
    WHERE id = rd_supply_year_data.business_year_id
    AND business_id IN (
      SELECT business_id FROM public.rd_businesses 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own supply year data" ON public.rd_supply_year_data;
CREATE POLICY "Users can update their own supply year data" ON public.rd_supply_year_data
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.rd_business_years
    WHERE id = rd_supply_year_data.business_year_id
    AND business_id IN (
      SELECT business_id FROM public.rd_businesses 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own supply year data" ON public.rd_supply_year_data;
CREATE POLICY "Users can delete their own supply year data" ON public.rd_supply_year_data
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.rd_business_years
    WHERE id = rd_supply_year_data.business_year_id
    AND business_id IN (
      SELECT business_id FROM public.rd_businesses 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  )
);

-- 10. Create updated_at trigger for rd_supply_year_data if not already present
DROP TRIGGER IF EXISTS handle_rd_supply_year_data_updated_at ON public.rd_supply_year_data;
CREATE TRIGGER handle_rd_supply_year_data_updated_at
BEFORE UPDATE ON public.rd_supply_year_data
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); 