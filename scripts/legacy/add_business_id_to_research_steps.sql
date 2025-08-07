-- Add business_id column to rd_research_steps table if it doesn't exist
-- This supports business-specific steps and helps with RLS policies

DO $$ 
BEGIN
    -- Check if business_id column exists in rd_research_steps
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rd_research_steps' 
        AND column_name = 'business_id'
    ) THEN
        -- Add the column
        ALTER TABLE rd_research_steps ADD COLUMN business_id UUID REFERENCES rd_businesses(id) ON DELETE SET NULL;
        
        -- Add index for the new column
        CREATE INDEX IF NOT EXISTS idx_rd_research_steps_business_id ON rd_research_steps(business_id);
        
        RAISE NOTICE 'Added business_id column to rd_research_steps table';
    ELSE
        RAISE NOTICE 'business_id column already exists in rd_research_steps table';
    END IF;

    -- Check if business_id column exists in rd_research_subcomponents
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rd_research_subcomponents' 
        AND column_name = 'business_id'
    ) THEN
        -- Add the column
        ALTER TABLE rd_research_subcomponents ADD COLUMN business_id UUID REFERENCES rd_businesses(id) ON DELETE SET NULL;
        
        -- Add index for the new column
        CREATE INDEX IF NOT EXISTS idx_rd_research_subcomponents_business_id ON rd_research_subcomponents(business_id);
        
        RAISE NOTICE 'Added business_id column to rd_research_subcomponents table';
    ELSE
        RAISE NOTICE 'business_id column already exists in rd_research_subcomponents table';
    END IF;
END $$;

-- Enable RLS on rd_research_steps if not already enabled
ALTER TABLE rd_research_steps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Enable read access for all users" ON rd_research_steps;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON rd_research_steps;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON rd_research_steps;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON rd_research_steps;

-- Create RLS policies for rd_research_steps
CREATE POLICY "Enable read access for all users" ON rd_research_steps
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON rd_research_steps
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON rd_research_steps
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON rd_research_steps
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON rd_research_steps TO authenticated;
GRANT SELECT ON rd_research_steps TO anon; 