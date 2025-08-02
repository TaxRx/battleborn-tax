-- Add archived column to admin_client_files table
ALTER TABLE admin_client_files 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries on archived status
CREATE INDEX IF NOT EXISTS idx_admin_client_files_archived 
ON admin_client_files(archived);

-- Add comment for documentation
COMMENT ON COLUMN admin_client_files.archived IS 'Whether this client file has been archived (soft delete)';
COMMENT ON COLUMN admin_client_files.archived_at IS 'Timestamp when this client file was archived'; 