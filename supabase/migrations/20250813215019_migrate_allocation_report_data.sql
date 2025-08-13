-- Migrate existing allocation report data to use ALLOCATION_SUMMARY type
-- This migration runs after the enum value has been added

-- Step 1: Update existing allocation reports to use the new type
-- This handles records that have allocation_report content but no generated_html
-- Only update if not already migrated
UPDATE rd_reports 
SET type = 'ALLOCATION_SUMMARY',
    generated_html = allocation_report,
    allocation_report = NULL
WHERE type = 'RESEARCH_SUMMARY' 
AND allocation_report IS NOT NULL 
AND generated_html IS NULL;

-- Step 2: Handle records that have both types of content
-- Create separate ALLOCATION_SUMMARY records for cases where both generated_html and allocation_report exist
-- Only create if not already created
INSERT INTO rd_reports (
    business_year_id, business_id, type, generated_html, 
    generated_text, ai_version, created_at, updated_at
)
SELECT 
    r.business_year_id, r.business_id, 'ALLOCATION_SUMMARY', r.allocation_report,
    'Migrated allocation report', COALESCE(r.ai_version, 'migration-v1'), NOW(), NOW()
FROM rd_reports r
WHERE r.type = 'RESEARCH_SUMMARY' 
AND r.allocation_report IS NOT NULL 
AND r.generated_html IS NOT NULL
AND NOT EXISTS (
    -- Check if ALLOCATION_SUMMARY record already exists for this business_year_id
    SELECT 1 FROM rd_reports existing
    WHERE existing.business_year_id = r.business_year_id
    AND existing.business_id = r.business_id
    AND existing.type = 'ALLOCATION_SUMMARY'
    AND existing.generated_html = r.allocation_report
);

-- Step 3: Clear allocation_report column for records that now have separate ALLOCATION_SUMMARY entries
-- Only clear if data has been successfully migrated
UPDATE rd_reports 
SET allocation_report = NULL 
WHERE type = 'RESEARCH_SUMMARY' 
AND allocation_report IS NOT NULL
AND EXISTS (
    -- Verify corresponding ALLOCATION_SUMMARY record exists
    SELECT 1 FROM rd_reports existing
    WHERE existing.business_year_id = rd_reports.business_year_id
    AND existing.business_id = rd_reports.business_id
    AND existing.type = 'ALLOCATION_SUMMARY'
    AND existing.generated_html = rd_reports.allocation_report
);