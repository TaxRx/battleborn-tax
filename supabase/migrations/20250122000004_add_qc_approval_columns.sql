-- Migration: Add missing QC approval columns
-- Created: 2025-01-22
-- Purpose: Add missing columns for QC approval functionality in Reports section

-- Add missing columns to rd_reports table
DO $$
BEGIN
  -- Add QC approval columns to rd_reports if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_reports' AND column_name = 'qc_approved_by') THEN
    ALTER TABLE public.rd_reports ADD COLUMN qc_approved_by TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_reports' AND column_name = 'qc_approved_at') THEN
    ALTER TABLE public.rd_reports ADD COLUMN qc_approved_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_reports' AND column_name = 'qc_approver_ip') THEN
    ALTER TABLE public.rd_reports ADD COLUMN qc_approver_ip TEXT;
  END IF;
END $$;

-- Add missing columns to rd_qc_document_controls table
DO $$
BEGIN
  -- Add QC approver information columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_qc_document_controls' AND column_name = 'qc_approver_name') THEN
    ALTER TABLE public.rd_qc_document_controls ADD COLUMN qc_approver_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_qc_document_controls' AND column_name = 'qc_approver_credentials') THEN
    ALTER TABLE public.rd_qc_document_controls ADD COLUMN qc_approver_credentials TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_qc_document_controls' AND column_name = 'qc_approved_date') THEN
    ALTER TABLE public.rd_qc_document_controls ADD COLUMN qc_approved_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_qc_document_controls' AND column_name = 'qc_approver_ip_address') THEN
    ALTER TABLE public.rd_qc_document_controls ADD COLUMN qc_approver_ip_address TEXT;
  END IF;
END $$;

-- Add comments to document the columns
COMMENT ON COLUMN public.rd_reports.qc_approved_by IS 'Name of the person who approved the QC';
COMMENT ON COLUMN public.rd_reports.qc_approved_at IS 'Timestamp when QC was approved';
COMMENT ON COLUMN public.rd_reports.qc_approver_ip IS 'IP address of the QC approver for audit trail';

COMMENT ON COLUMN public.rd_qc_document_controls.qc_approver_name IS 'Name of the QC approver';
COMMENT ON COLUMN public.rd_qc_document_controls.qc_approver_credentials IS 'Credentials/title of the QC approver';
COMMENT ON COLUMN public.rd_qc_document_controls.qc_approved_date IS 'Date when QC was approved';
COMMENT ON COLUMN public.rd_qc_document_controls.qc_approver_ip_address IS 'IP address of the QC approver for audit trail';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rd_reports_qc_approved_at ON public.rd_reports(qc_approved_at) WHERE qc_approved_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rd_qc_document_controls_qc_approved_date ON public.rd_qc_document_controls(qc_approved_date) WHERE qc_approved_date IS NOT NULL; 