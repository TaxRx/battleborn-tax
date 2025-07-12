-- Temporary disable RLS for testing
-- WARNING: This should only be used for testing, not in production

-- Disable RLS on rd_supply_subcomponents temporarily
ALTER TABLE public.rd_supply_subcomponents DISABLE ROW LEVEL SECURITY;

-- Disable RLS on rd_supplies temporarily  
ALTER TABLE public.rd_supplies DISABLE ROW LEVEL SECURITY; 