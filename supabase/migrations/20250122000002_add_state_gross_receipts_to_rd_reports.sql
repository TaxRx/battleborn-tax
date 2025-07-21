-- Add state gross receipts column to rd_reports table
-- This column stores state-specific gross receipts data required for state credit calculations

-- Add the state_gross_receipts column as JSONB to store multiple years of data
ALTER TABLE rd_reports 
ADD COLUMN IF NOT EXISTS state_gross_receipts JSONB DEFAULT '{}';

-- Add a comment explaining the column
COMMENT ON COLUMN rd_reports.state_gross_receipts IS 'Stores state-specific gross receipts data by year for state credit calculations. Format: {"2024": 1000000, "2023": 950000, "2022": 900000, "2021": 850000}';

-- Create an index for efficient queries on the state_gross_receipts column
CREATE INDEX IF NOT EXISTS idx_rd_reports_state_gross_receipts 
ON rd_reports USING GIN (state_gross_receipts); 