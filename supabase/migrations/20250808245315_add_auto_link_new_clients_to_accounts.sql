-- Add auto_link_new_clients column to accounts table
-- This column determines if accounts of type (operator, affiliate, expert) 
-- should automatically link to new clients when they are created

ALTER TABLE accounts 
ADD COLUMN auto_link_new_clients BOOLEAN NOT NULL DEFAULT false;

-- Add index for performance when querying accounts that auto-link
CREATE INDEX idx_accounts_auto_link_type 
ON accounts(auto_link_new_clients, type) 
WHERE auto_link_new_clients = true AND type IN ('operator', 'affiliate', 'expert');

-- Add comment explaining the column purpose
COMMENT ON COLUMN accounts.auto_link_new_clients IS 
'When true, this account will automatically link to all new clients created in the system. Only applicable for operator, affiliate, and expert account types.';