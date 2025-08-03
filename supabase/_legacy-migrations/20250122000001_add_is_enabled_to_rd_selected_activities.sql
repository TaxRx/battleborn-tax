-- Add is_enabled column to rd_selected_activities table
-- This column stores whether a research activity is enabled/disabled in the allocation modal

-- Add the is_enabled column with default value of true
ALTER TABLE rd_selected_activities 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true NOT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN rd_selected_activities.is_enabled IS 'Indicates whether this research activity is enabled/disabled in allocation modals. When false, activity allocations are not included in calculations.'; 