-- Fix RLS policies for rd_clients table to resolve 406 error
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON rd_clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rd_clients;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON rd_clients;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON rd_clients;

-- Create more permissive policies
CREATE POLICY "Enable read access for all users" ON rd_clients
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON rd_clients
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON rd_clients
    FOR UPDATE USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Enable delete for users based on user_id" ON rd_clients
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Also ensure the table has RLS enabled
ALTER TABLE rd_clients ENABLE ROW LEVEL SECURITY;

-- Drop old FK constraint if it exists
ALTER TABLE public.rd_businesses
  DROP CONSTRAINT IF EXISTS rd_businesses_client_id_fkey;

-- Add new FK constraint to clients
ALTER TABLE public.rd_businesses
  ADD CONSTRAINT rd_businesses_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE; 