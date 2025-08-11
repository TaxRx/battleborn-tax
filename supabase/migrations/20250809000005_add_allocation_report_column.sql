-- Add allocation_report column to rd_reports table
-- This allows us to store allocation report HTML separately from other report types
-- while maintaining the complete dataset for each business year

ALTER TABLE public.rd_reports 
ADD COLUMN allocation_report TEXT;

-- Add comment to explain the column usage
COMMENT ON COLUMN public.rd_reports.allocation_report IS 'Stores the generated HTML content for allocation reports. Used separately from generated_html to avoid conflicts with research reports.';
