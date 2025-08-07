-- Migration: Add QC approver credentials tracking to rd_qc_document_controls
-- Purpose: Track approver credentials, date, and IP address when QC switches are toggled

-- Add QC approver credential columns
ALTER TABLE rd_qc_document_controls 
ADD COLUMN IF NOT EXISTS qc_approver_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS qc_approver_credentials VARCHAR(255),
ADD COLUMN IF NOT EXISTS qc_approved_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS qc_approver_ip_address INET,
ADD COLUMN IF NOT EXISTS qc_approval_required BOOLEAN DEFAULT TRUE;

-- Add comments for the new columns
COMMENT ON COLUMN rd_qc_document_controls.qc_approver_name IS 'Name of the person who approved the QC release';
COMMENT ON COLUMN rd_qc_document_controls.qc_approver_credentials IS 'Credentials/ID of the QC approver for verification';
COMMENT ON COLUMN rd_qc_document_controls.qc_approved_date IS 'Date and time when QC approval was granted';
COMMENT ON COLUMN rd_qc_document_controls.qc_approver_ip_address IS 'IP address of the approver for audit trail';
COMMENT ON COLUMN rd_qc_document_controls.qc_approval_required IS 'Whether this document type requires QC approval before release';

-- Create index for QC approver queries
CREATE INDEX IF NOT EXISTS idx_rd_qc_document_controls_approver 
ON rd_qc_document_controls(qc_approver_credentials, qc_approved_date);

-- Add the HTML generation column to rd_reports if not exists (backup)
ALTER TABLE rd_reports 
ADD COLUMN IF NOT EXISTS generated_html TEXT;

-- Add QC approver columns to rd_reports for report-specific approval tracking
ALTER TABLE rd_reports
ADD COLUMN IF NOT EXISTS qc_approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS qc_approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS qc_approver_ip INET;

-- Comments for rd_reports QC columns
COMMENT ON COLUMN rd_reports.qc_approved_by IS 'QC approver who approved this specific report';
COMMENT ON COLUMN rd_reports.qc_approved_at IS 'Timestamp when this report was QC approved';
COMMENT ON COLUMN rd_reports.qc_approver_ip IS 'IP address of QC approver for this report';

-- Create index for rd_reports QC approval queries
CREATE INDEX IF NOT EXISTS idx_rd_reports_qc_approval 
ON rd_reports(qc_approved_by, qc_approved_at); 