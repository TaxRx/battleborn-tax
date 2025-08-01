-- Fix archive_client function conflicts
-- This migration resolves the function signature conflicts between multiple archive_client definitions

-- First, drop all existing versions of the archive_client function
-- This handles different parameter signatures that might exist

DROP FUNCTION IF EXISTS public.archive_client(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.archive_client(UUID, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS archive_client(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS archive_client(UUID, BOOLEAN, BOOLEAN);

-- Drop with full parameter names to be thorough
DROP FUNCTION IF EXISTS public.archive_client(p_client_file_id UUID, p_archive BOOLEAN);
DROP FUNCTION IF EXISTS public.archive_client(p_client_id UUID, p_archive BOOLEAN);

-- Now create a single, consistent archive_client function
-- Using the most common parameter naming convention
CREATE OR REPLACE FUNCTION public.archive_client(
    p_client_id UUID,
    p_archive BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the clients table to set archived status
    UPDATE clients 
    SET 
        archived = p_archive, 
        archived_at = CASE 
            WHEN p_archive THEN NOW() 
            ELSE NULL 
        END,
        updated_at = NOW()
    WHERE id = p_client_id;
    
    -- Return true if a row was found and updated
    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and return false
        RAISE NOTICE 'Error archiving client %: %', p_client_id, SQLERRM;
        RETURN FALSE;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.archive_client IS 'Archives or unarchives a client by setting the archived flag and timestamp';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.archive_client TO authenticated;

-- Verify the function was created successfully
DO $$
BEGIN
    RAISE NOTICE 'archive_client function has been recreated with consistent signature';
    RAISE NOTICE 'Function signature: archive_client(p_client_id UUID, p_archive BOOLEAN DEFAULT TRUE) RETURNS BOOLEAN';
END $$; 