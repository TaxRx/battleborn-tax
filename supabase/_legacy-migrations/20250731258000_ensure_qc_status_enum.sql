-- Ensure qc_status_enum data type exists
-- Safe creation with duplicate handling
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: Create qc_status_enum if it doesn't exist
-- =============================================================================

-- Create qc_status_enum with safe handling for existing type
DO $$ BEGIN
    CREATE TYPE public.qc_status_enum AS ENUM (
        'pending',
        'in_review',
        'ready_for_review',
        'approved',
        'requires_changes',
        'complete'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Note: _qc_status_enum (array type) is automatically created by PostgreSQL
-- when the base enum type is created, so no separate creation is needed