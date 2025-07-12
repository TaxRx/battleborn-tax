-- Create the archive_client function
-- Migration: 20250119000014_create_archive_client.sql

-- Drop the function if it exists
DROP FUNCTION IF EXISTS archive_client(UUID, BOOLEAN);

-- Create the function to archive/unarchive a client
CREATE OR REPLACE FUNCTION archive_client(p_client_id UUID, p_archive BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE clients 
    SET archived = p_archive, 
        archived_at = CASE WHEN p_archive THEN NOW() ELSE NULL END
    WHERE id = p_client_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 