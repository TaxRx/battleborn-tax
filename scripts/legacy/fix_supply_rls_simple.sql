-- Simple RLS fix for rd_supply_subcomponents
-- This creates a more permissive policy that should work

-- 1. Enable RLS on rd_supply_subcomponents
ALTER TABLE public.rd_supply_subcomponents ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents;
DROP POLICY IF EXISTS "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents;
DROP POLICY IF EXISTS "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents;
DROP POLICY IF EXISTS "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents;

-- 3. Create a simple policy that allows all operations for authenticated users
-- This is a temporary fix - in production you'd want more restrictive policies
CREATE POLICY "Allow all operations for authenticated users" ON public.rd_supply_subcomponents
FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Also fix rd_supplies RLS policies
ALTER TABLE public.rd_supplies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own supplies" ON public.rd_supplies;
DROP POLICY IF EXISTS "Users can insert their own supplies" ON public.rd_supplies;
DROP POLICY IF EXISTS "Users can update their own supplies" ON public.rd_supplies;
DROP POLICY IF EXISTS "Users can delete their own supplies" ON public.rd_supplies;

CREATE POLICY "Allow all operations for authenticated users" ON public.rd_supplies
FOR ALL USING (auth.uid() IS NOT NULL); 