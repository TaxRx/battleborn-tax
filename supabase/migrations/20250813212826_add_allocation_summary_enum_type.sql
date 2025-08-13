-- Add ALLOCATION_SUMMARY to rd_report_type enum
-- This allows allocation reports to have their own distinct type instead of sharing RESEARCH_SUMMARY

-- Step 1: Add the new enum value
ALTER TYPE public.rd_report_type ADD VALUE 'ALLOCATION_SUMMARY';

-- Step 2: Update existing allocation reports to use the new type
-- This handles records that have allocation_report content but no generated_html
UPDATE rd_reports 
SET type = 'ALLOCATION_SUMMARY',
    generated_html = allocation_report,
    allocation_report = NULL
WHERE type = 'RESEARCH_SUMMARY' 
AND allocation_report IS NOT NULL 
AND generated_html IS NULL;

-- Step 3: Handle records that have both types of content
-- Create separate ALLOCATION_SUMMARY records for cases where both generated_html and allocation_report exist
INSERT INTO rd_reports (
    business_year_id, business_id, type, generated_html, 
    generated_text, ai_version, created_at, updated_at
)
SELECT 
    business_year_id, business_id, 'ALLOCATION_SUMMARY', allocation_report,
    'Migrated allocation report', COALESCE(ai_version, 'migration-v1'), NOW(), NOW()
FROM rd_reports 
WHERE type = 'RESEARCH_SUMMARY' 
AND allocation_report IS NOT NULL 
AND generated_html IS NOT NULL;

-- Step 4: Clear allocation_report column for records that now have separate ALLOCATION_SUMMARY entries
UPDATE rd_reports 
SET allocation_report = NULL 
WHERE type = 'RESEARCH_SUMMARY' 
AND allocation_report IS NOT NULL;

-- Add comment for documentation
COMMENT ON TYPE public.rd_report_type IS 'Types of R&D reports: RESEARCH_DESIGN (initial), RESEARCH_SUMMARY (main research report), FILING_GUIDE (filing instructions), ALLOCATION_SUMMARY (allocation reports)';