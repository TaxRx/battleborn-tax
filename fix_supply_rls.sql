-- Fix RLS policies for rd_supply_subcomponents

-- Enable RLS on rd_supply_subcomponents
ALTER TABLE public.rd_supply_subcomponents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents;
DROP POLICY IF EXISTS "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents;
DROP POLICY IF EXISTS "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents;
DROP POLICY IF EXISTS "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents;

-- Create simple RLS policies for rd_supply_subcomponents
-- Allow authenticated users to access their own supply subcomponents
CREATE POLICY "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents
FOR DELETE USING (auth.uid() IS NOT NULL); 