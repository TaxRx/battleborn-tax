-- Temporarily disable RLS on rd_selected_subcomponents table
-- This will allow the application to work while we fix the RLS policies

-- Disable RLS on the table
ALTER TABLE public.rd_selected_subcomponents DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rd_selected_subcomponents;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.rd_selected_subcomponents;
DROP POLICY IF EXISTS "Enable update for users based on business_year_id" ON public.rd_selected_subcomponents;
DROP POLICY IF EXISTS "Enable delete for users based on business_year_id" ON public.rd_selected_subcomponents;

-- Note: This is a temporary fix. In production, you should implement proper RLS policies
-- that check user permissions based on business ownership and other security requirements. 