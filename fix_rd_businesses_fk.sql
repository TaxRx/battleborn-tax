-- Fix foreign key constraint for rd_businesses table
-- Drop old FK constraint if it exists
ALTER TABLE public.rd_businesses
  DROP CONSTRAINT IF EXISTS rd_businesses_client_id_fkey;

-- Add new FK constraint to clients
ALTER TABLE public.rd_businesses
  ADD CONSTRAINT rd_businesses_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- Verify the constraint was created
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='rd_businesses'; 