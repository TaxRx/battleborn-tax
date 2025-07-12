-- Remove the foreign key constraint from rd_clients to allow flexible user_id references
-- This allows us to use tax profile IDs as user_id in rd_clients without foreign key constraints

-- First, check if the rd_clients table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rd_clients') THEN
        -- Drop the existing foreign key constraint if it exists
        ALTER TABLE rd_clients DROP CONSTRAINT IF EXISTS rd_clients_user_id_fkey;
        
        -- Add an index for better performance (without foreign key constraint)
        CREATE INDEX IF NOT EXISTS idx_rd_clients_user_id ON rd_clients(user_id);
        
        -- Add a comment to clarify the relationship
        COMMENT ON COLUMN rd_clients.user_id IS 'References tax_profiles.id - this allows R&D clients to be linked to tax planning clients (no FK constraint for flexibility)';
        
        RAISE NOTICE 'Successfully removed foreign key constraint from rd_clients.user_id';
    ELSE
        RAISE NOTICE 'rd_clients table does not exist. Skipping foreign key constraint modification.';
    END IF;
END $$; 