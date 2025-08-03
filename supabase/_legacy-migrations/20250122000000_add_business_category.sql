-- Add category_id column to rd_businesses table
-- This allows businesses to explicitly specify their research category (Healthcare, Software, etc.)

-- First, ensure we have the core categories in rd_research_categories
INSERT INTO rd_research_categories (name) VALUES ('Healthcare') ON CONFLICT (name) DO NOTHING;
INSERT INTO rd_research_categories (name) VALUES ('Software') ON CONFLICT (name) DO NOTHING;

-- Add the category_id column to rd_businesses table
ALTER TABLE rd_businesses 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES rd_research_categories(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN rd_businesses.category_id IS 'Business research category - determines report type (Healthcare vs Software)';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_rd_businesses_category_id 
ON rd_businesses(category_id);

-- Update existing businesses to have a default category (Healthcare) if none specified
-- This ensures backward compatibility
UPDATE rd_businesses 
SET category_id = (SELECT id FROM rd_research_categories WHERE name = 'Healthcare' LIMIT 1)
WHERE category_id IS NULL;

-- Verify the changes
SELECT 
  b.name as business_name,
  c.name as category_name
FROM rd_businesses b
LEFT JOIN rd_research_categories c ON b.category_id = c.id
LIMIT 5; 