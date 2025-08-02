-- Add is_default column to existing rd_roles table and handle business_id requirement
DO $$ 
BEGIN
    -- Check if the column doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rd_roles' 
        AND column_name = 'is_default'
    ) THEN
        -- Add the column
        ALTER TABLE rd_roles ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
        
        -- Add index for the new column
        CREATE INDEX IF NOT EXISTS idx_rd_roles_is_default ON rd_roles(is_default);
        
        RAISE NOTICE 'Added is_default column to rd_roles table';
    ELSE
        RAISE NOTICE 'is_default column already exists in rd_roles table';
    END IF;
    
    -- Check if business_id column exists and is NOT NULL
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rd_roles' 
        AND column_name = 'business_id'
        AND is_nullable = 'NO'
    ) THEN
        -- If business_id is required, we need to handle it for the default role
        -- First, check if we have any businesses to reference
        IF EXISTS (SELECT 1 FROM rd_businesses LIMIT 1) THEN
            -- Get the first business ID to use for the default role
            INSERT INTO rd_roles (business_id, name, description, is_default) 
            SELECT 
                (SELECT id FROM rd_businesses LIMIT 1),
                'Research Leader', 
                'Primary research coordinator and decision maker', 
                TRUE
            WHERE NOT EXISTS (
                SELECT 1 FROM rd_roles WHERE is_default = TRUE
            );
        ELSE
            -- If no businesses exist, we can't create the default role
            RAISE NOTICE 'No businesses exist, skipping default role creation';
        END IF;
    ELSE
        -- If business_id is not required or doesn't exist, create default role normally
        INSERT INTO rd_roles (name, description, is_default) 
        VALUES ('Research Leader', 'Primary research coordinator and decision maker', TRUE)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Add the unique constraint
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rd_roles_unique_default ON rd_roles(is_default) WHERE is_default = TRUE;
END $$; 