-- Migration: Add operator to account_type enum
-- Purpose: Add 'operator' as a valid account type
-- Date: 2025-07-17

-- Add 'operator' to the account_type enum
ALTER TYPE account_type ADD VALUE 'operator';

-- Verify the enum values
DO $$
DECLARE
    enum_values TEXT[];
BEGIN
    SELECT ARRAY_AGG(enumlabel ORDER BY enumsortorder) 
    INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = 'account_type'::regtype;
    
    RAISE NOTICE 'Updated account_type enum values: %', enum_values;
END;
$$;