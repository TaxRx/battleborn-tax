-- Quick migration to add business_id column to rd_research_activities
-- This enables business-specific activities for IP protection

DO $$ 
BEGIN 
    -- Add business_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_research_activities' 
                   AND column_name = 'business_id') THEN
        
        -- Add the column
        ALTER TABLE rd_research_activities 
        ADD COLUMN business_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE rd_research_activities 
        ADD CONSTRAINT fk_rd_research_activities_business_id 
        FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE;
        
        -- Add comment
        COMMENT ON COLUMN rd_research_activities.business_id IS 
        'Foreign key to rd_businesses. NULL = global activity available to all businesses. Non-NULL = business-specific activity for IP protection.';
        
        -- Add index for performance
        CREATE INDEX idx_rd_research_activities_business_id 
        ON rd_research_activities(business_id);
        
        RAISE NOTICE 'Successfully added business_id column to rd_research_activities with foreign key constraint and index.';
        
    ELSE
        RAISE NOTICE 'Column business_id already exists in rd_research_activities.';
    END IF;
    
END $$; 