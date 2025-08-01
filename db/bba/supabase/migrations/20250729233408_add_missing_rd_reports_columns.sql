-- Add Missing Columns to rd_reports for Remote Data Import Compatibility
-- Purpose: Add QC and additional columns present in remote database
-- Date: 2025-07-29

BEGIN;

-- Add missing columns to rd_reports table
ALTER TABLE public.rd_reports 
ADD COLUMN IF NOT EXISTS generated_html TEXT,
ADD COLUMN IF NOT EXISTS filing_guide TEXT,
ADD COLUMN IF NOT EXISTS state_gross_receipts NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS qc_approved_by UUID,
ADD COLUMN IF NOT EXISTS qc_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS qc_approver_ip TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.rd_reports.generated_html IS 'HTML version of generated report content';
COMMENT ON COLUMN public.rd_reports.filing_guide IS 'Filing guide content for the report';
COMMENT ON COLUMN public.rd_reports.state_gross_receipts IS 'State gross receipts amount';
COMMENT ON COLUMN public.rd_reports.qc_approved_by IS 'User who performed QC approval';
COMMENT ON COLUMN public.rd_reports.qc_approved_at IS 'Timestamp of QC approval';
COMMENT ON COLUMN public.rd_reports.qc_approver_ip IS 'IP address of QC approver';

-- Add foreign key constraint for qc_approved_by if needed
-- Note: We don't add FK constraint since it could reference different tables

COMMIT;