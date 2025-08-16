-- Fix W-2 extracted data constraint
-- This migration fixes the incorrect unique constraint on w2_document_id
-- and adds the correct constraint on (employee_id, business_year_id)

-- Remove incorrect unique constraint on w2_document_id
-- This constraint was preventing multiple W-2s from being extracted from a single document
ALTER TABLE w2_extracted_data DROP CONSTRAINT IF EXISTS unique_w2_document;

-- Add correct unique constraint on employee_id and business_year_id
-- This ensures one W-2 record per employee per business year and enables upsert operations
ALTER TABLE w2_extracted_data 
ADD CONSTRAINT unique_employee_business_year 
UNIQUE (employee_id, business_year_id);

-- Add helpful comment explaining the constraint purpose
COMMENT ON CONSTRAINT unique_employee_business_year ON w2_extracted_data 
IS 'Ensures one W-2 record per employee per business year, enables upsert operations for data updates, allows multiple W-2s per document';

-- Update table comment to reflect the corrected constraint behavior
COMMENT ON TABLE w2_extracted_data IS 'Stores AI-extracted data from W-2 documents with validation and review workflow. Multiple records can reference the same w2_document_id (for multi-W2 PDFs), but only one record per employee per business year is allowed.';