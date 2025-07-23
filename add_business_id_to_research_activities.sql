-- Add business_id column to rd_research_activities for business-specific activities
-- This allows activities to be tied to specific client businesses for IP protection
-- NULL values mean the activity is global (available to all businesses)

DO $$ 
BEGIN 
    -- Add business_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_research_activities' 
                   AND column_name = 'business_id') THEN
        ALTER TABLE rd_research_activities 
        ADD COLUMN business_id UUID REFERENCES rd_businesses(id) ON DELETE CASCADE;
        
        -- Add comment to explain the column purpose
        COMMENT ON COLUMN rd_research_activities.business_id IS 
        'Foreign key to rd_businesses. NULL = global activity available to all businesses. 
        Non-NULL = business-specific activity for IP protection.';
        
        -- Add index for performance
        CREATE INDEX idx_rd_research_activities_business_id 
        ON rd_research_activities(business_id);
        
        -- Add partial index for global activities (where business_id IS NULL)
        CREATE INDEX idx_rd_research_activities_global 
        ON rd_research_activities(id) WHERE business_id IS NULL;
        
        RAISE NOTICE 'Added business_id column to rd_research_activities table';
    ELSE
        RAISE NOTICE 'business_id column already exists in rd_research_activities table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'rd_research_activities' 
AND column_name = 'business_id'; 