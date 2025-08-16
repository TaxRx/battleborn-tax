-- Rename W-2 tables to use rd_ prefix for consistency
-- This migration renames w2_documents and w2_extracted_data to rd_w2_documents and rd_w2_extracted_data

-- First, drop the constraint that references the old table name
ALTER TABLE w2_extracted_data DROP CONSTRAINT IF EXISTS unique_employee_business_year;

-- Rename the tables
ALTER TABLE w2_documents RENAME TO rd_w2_documents;
ALTER TABLE w2_extracted_data RENAME TO rd_w2_extracted_data;

-- Update the foreign key constraint to reference the new table name
ALTER TABLE rd_w2_extracted_data DROP CONSTRAINT IF EXISTS w2_extracted_data_w2_document_id_fkey;
ALTER TABLE rd_w2_extracted_data 
ADD CONSTRAINT rd_w2_extracted_data_w2_document_id_fkey 
FOREIGN KEY (w2_document_id) REFERENCES rd_w2_documents(id) ON DELETE CASCADE;

-- Re-add the unique constraint with the new table name
ALTER TABLE rd_w2_extracted_data 
ADD CONSTRAINT unique_employee_business_year 
UNIQUE (employee_id, business_year_id);

-- Update index names to match the new table names
DROP INDEX IF EXISTS idx_w2_documents_business_year_id;
DROP INDEX IF EXISTS idx_w2_documents_tax_year;
DROP INDEX IF EXISTS idx_w2_documents_upload_status;
DROP INDEX IF EXISTS idx_w2_documents_created_at;

CREATE INDEX IF NOT EXISTS idx_rd_w2_documents_business_year_id ON rd_w2_documents(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_w2_documents_tax_year ON rd_w2_documents(tax_year);
CREATE INDEX IF NOT EXISTS idx_rd_w2_documents_upload_status ON rd_w2_documents(upload_status);
CREATE INDEX IF NOT EXISTS idx_rd_w2_documents_created_at ON rd_w2_documents(created_at);

DROP INDEX IF EXISTS idx_w2_extracted_data_employee_id;
DROP INDEX IF EXISTS idx_w2_extracted_data_business_year_id;
DROP INDEX IF EXISTS idx_w2_extracted_data_tax_year;
DROP INDEX IF EXISTS idx_w2_extracted_data_manual_review;

CREATE INDEX IF NOT EXISTS idx_rd_w2_extracted_data_employee_id ON rd_w2_extracted_data(employee_id);
CREATE INDEX IF NOT EXISTS idx_rd_w2_extracted_data_business_year_id ON rd_w2_extracted_data(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_w2_extracted_data_tax_year ON rd_w2_extracted_data(tax_year);
CREATE INDEX IF NOT EXISTS idx_rd_w2_extracted_data_manual_review ON rd_w2_extracted_data(manual_review_required);

-- Update trigger names to match the new table names
DROP TRIGGER IF EXISTS update_w2_documents_updated_at ON rd_w2_documents;
DROP TRIGGER IF EXISTS update_w2_extracted_data_updated_at ON rd_w2_extracted_data;

CREATE TRIGGER update_rd_w2_documents_updated_at 
    BEFORE UPDATE ON rd_w2_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rd_w2_extracted_data_updated_at 
    BEFORE UPDATE ON rd_w2_extracted_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update table comments
COMMENT ON TABLE rd_w2_documents IS 'Stores W-2 document metadata and file references';
COMMENT ON TABLE rd_w2_extracted_data IS 'Stores AI-extracted data from W-2 documents with validation and review workflow. Multiple records can reference the same w2_document_id (for multi-W2 PDFs), but only one record per employee per business year is allowed.';
COMMENT ON COLUMN rd_w2_documents.file_path IS 'Path to the document file in Supabase Storage';
COMMENT ON COLUMN rd_w2_extracted_data.box_12_codes IS 'JSON array of box 12 codes and amounts';
COMMENT ON COLUMN rd_w2_extracted_data.box_14_other IS 'JSON array of box 14 other compensation items';
COMMENT ON COLUMN rd_w2_extracted_data.state_and_local IS 'JSON array of state and local tax information';
COMMENT ON COLUMN rd_w2_extracted_data.raw_ai_response IS 'Full AI response for debugging and audit purposes';

-- Grant permissions to the renamed tables
GRANT SELECT, INSERT, UPDATE, DELETE ON rd_w2_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rd_w2_extracted_data TO authenticated;