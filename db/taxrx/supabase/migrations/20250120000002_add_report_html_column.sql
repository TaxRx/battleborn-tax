-- Migration: Add HTML column to rd_reports table for storing complete generated report HTML
-- Created: 2025-01-20
-- Purpose: Enable saving of complete HTML reports for client access and archival

-- Add the HTML column to store complete generated report HTML
ALTER TABLE public.rd_reports 
ADD COLUMN IF NOT EXISTS generated_html TEXT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN public.rd_reports.generated_html IS 'Complete HTML of the generated research report for client access and archival';

-- Create index for better performance when querying reports by business_year and type
CREATE INDEX IF NOT EXISTS idx_rd_reports_html_not_null 
ON public.rd_reports (business_year_id, type) 
WHERE generated_html IS NOT NULL;

-- Update the updated_at timestamp function for the table (if not already set)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists for rd_reports table
DROP TRIGGER IF EXISTS update_rd_reports_updated_at ON public.rd_reports;
CREATE TRIGGER update_rd_reports_updated_at
    BEFORE UPDATE ON public.rd_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 