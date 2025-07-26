-- Add github_token column to rd_businesses table
-- This allows businesses to store their own GitHub access tokens for Software R&D reports

-- Add the github_token column
ALTER TABLE rd_businesses
ADD COLUMN IF NOT EXISTS github_token TEXT;

-- Add comment for documentation
COMMENT ON COLUMN rd_businesses.github_token IS 'Client-specific GitHub access token for Software R&D repository analysis';

-- Add index for better query performance when filtering by businesses with GitHub tokens
CREATE INDEX IF NOT EXISTS idx_rd_businesses_github_token_exists
ON rd_businesses(github_token) WHERE github_token IS NOT NULL;

-- Note: Existing RLS policies on rd_businesses are already permissive ("Enable access for all users")
-- so we don't need to add specific GitHub token policies at this time 