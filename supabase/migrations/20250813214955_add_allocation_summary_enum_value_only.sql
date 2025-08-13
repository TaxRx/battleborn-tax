-- Add ALLOCATION_SUMMARY to rd_report_type enum
-- Split into separate migration to avoid PostgreSQL enum transaction limitations

-- Step 1: Add the new enum value only (if it doesn't exist)
DO $$
BEGIN
    -- Check if ALLOCATION_SUMMARY value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ALLOCATION_SUMMARY' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'rd_report_type'
        )
    ) THEN
        ALTER TYPE public.rd_report_type ADD VALUE 'ALLOCATION_SUMMARY';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TYPE public.rd_report_type IS 'Types of R&D reports: RESEARCH_DESIGN (initial), RESEARCH_SUMMARY (main research report), FILING_GUIDE (filing instructions), ALLOCATION_SUMMARY (allocation reports)';