-- W-2 Document Processing Tables
-- This migration creates tables for storing W-2 documents and extracted data

-- Create W-2 documents table to store metadata and file paths
DROP TABLE IF EXISTS w2_extracted_data;
DROP TABLE IF EXISTS w2_documents;
CREATE TABLE IF NOT EXISTS w2_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_year_id UUID NOT NULL REFERENCES rd_business_years(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Storage path in Supabase Storage
    file_size INTEGER,
    file_type TEXT, -- MIME type (e.g., 'application/pdf', 'image/png')
    tax_year INTEGER NOT NULL,
    upload_status TEXT DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'processing', 'processed', 'failed')),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_error TEXT,
    extracted_data JSONB, -- Temporary storage for AI extracted data before employee matching
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800) -- 50MB max
);

-- Create W-2 extracted data table to store AI-extracted tax information

CREATE TABLE IF NOT EXISTS w2_extracted_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    w2_document_id UUID NOT NULL REFERENCES w2_documents(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES rd_employees(id) ON DELETE CASCADE,
    business_year_id UUID NOT NULL REFERENCES rd_business_years(id) ON DELETE CASCADE,
    
    -- Tax year information
    tax_year INTEGER NOT NULL,
    
    -- Employer information
    employer_name TEXT,
    employer_ein TEXT,
    employer_address_street TEXT,
    employer_address_city TEXT,
    employer_address_state TEXT,
    employer_address_zip TEXT,
    
    -- Employee information (extracted from W-2, may differ from rd_employees)
    employee_name_on_w2 TEXT,
    employee_ssn TEXT, -- Encrypted/masked for security
    employee_address_street TEXT,
    employee_address_city TEXT,
    employee_address_state TEXT,
    employee_address_zip TEXT,
    
    -- Box 1-14 wage and tax information (stored as DECIMAL for precision)
    box_1_wages DECIMAL(12,2), -- Wages, tips, other compensation
    box_2_federal_tax_withheld DECIMAL(12,2), -- Federal income tax withheld
    box_3_social_security_wages DECIMAL(12,2), -- Social security wages
    box_4_social_security_tax_withheld DECIMAL(12,2), -- Social security tax withheld
    box_5_medicare_wages DECIMAL(12,2), -- Medicare wages and tips
    box_6_medicare_tax_withheld DECIMAL(12,2), -- Medicare tax withheld
    box_7_social_security_tips DECIMAL(12,2), -- Social security tips
    box_8_allocated_tips DECIMAL(12,2), -- Allocated tips
    box_9_verification_code TEXT, -- Verification code
    box_10_dependent_care_benefits DECIMAL(12,2), -- Dependent care benefits
    box_11_nonqualified_plans DECIMAL(12,2), -- Nonqualified plans
    
    -- Box 12 codes (stored as JSONB array)
    box_12_codes JSONB, -- [{"code": "A", "amount": "1000.00"}, ...]
    
    -- Box 13 checkboxes
    box_13_statutory_employee BOOLEAN DEFAULT false,
    box_13_retirement_plan BOOLEAN DEFAULT false,
    box_13_third_party_sick_pay BOOLEAN DEFAULT false,
    
    -- Box 14 other information (stored as JSONB array)
    box_14_other JSONB, -- [{"description": "Group term life", "amount": "500.00"}, ...]
    
    -- State and local tax information (stored as JSONB array)
    state_and_local JSONB, -- [{"state": "CA", "state_wages": "50000.00", "state_tax_withheld": "2500.00", "locality": "San Francisco", "local_wages": "50000.00", "local_tax_withheld": "500.00"}, ...]
    
    -- AI extraction metadata
    extraction_confidence DECIMAL(3,2), -- 0.00 to 1.00 confidence score
    extraction_model TEXT, -- AI model used for extraction
    extraction_prompt_version TEXT, -- Version of extraction prompt used
    raw_ai_response JSONB, -- Store full AI response for debugging
    validation_errors JSONB, -- Store any validation errors found
    manual_review_required BOOLEAN DEFAULT false,
    manual_review_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_extraction_confidence CHECK (extraction_confidence >= 0.00 AND extraction_confidence <= 1.00)
   
    
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_w2_documents_business_year_id ON w2_documents(business_year_id);
CREATE INDEX IF NOT EXISTS idx_w2_documents_tax_year ON w2_documents(tax_year);
CREATE INDEX IF NOT EXISTS idx_w2_documents_upload_status ON w2_documents(upload_status);
CREATE INDEX IF NOT EXISTS idx_w2_documents_created_at ON w2_documents(created_at);

CREATE INDEX IF NOT EXISTS idx_w2_extracted_data_employee_id ON w2_extracted_data(employee_id);
CREATE INDEX IF NOT EXISTS idx_w2_extracted_data_business_year_id ON w2_extracted_data(business_year_id);
CREATE INDEX IF NOT EXISTS idx_w2_extracted_data_tax_year ON w2_extracted_data(tax_year);
CREATE INDEX IF NOT EXISTS idx_w2_extracted_data_manual_review ON w2_extracted_data(manual_review_required);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at timestamps (idempotent)
DROP TRIGGER IF EXISTS update_w2_documents_updated_at ON w2_documents;
CREATE TRIGGER update_w2_documents_updated_at 
    BEFORE UPDATE ON w2_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_w2_extracted_data_updated_at ON w2_extracted_data;
CREATE TRIGGER update_w2_extracted_data_updated_at 
    BEFORE UPDATE ON w2_extracted_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Note: RLS policies will be handled by the new RLS strategy implementation

-- Create storage bucket for W-2 documents (if it doesn't exist)
-- Note: This will be handled in the next step via Supabase Storage setup

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON w2_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON w2_extracted_data TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON TABLE w2_documents IS 'Stores W-2 document metadata and file references';
COMMENT ON TABLE w2_extracted_data IS 'Stores AI-extracted data from W-2 documents with validation and review workflow. Multiple records can reference the same w2_document_id (for multi-W2 PDFs).';
COMMENT ON COLUMN w2_documents.file_path IS 'Path to the document file in Supabase Storage';
COMMENT ON COLUMN w2_extracted_data.box_12_codes IS 'JSON array of box 12 codes and amounts';
COMMENT ON COLUMN w2_extracted_data.box_14_other IS 'JSON array of box 14 other compensation items';
COMMENT ON COLUMN w2_extracted_data.state_and_local IS 'JSON array of state and local tax information';
COMMENT ON COLUMN w2_extracted_data.raw_ai_response IS 'Full AI response for debugging and audit purposes';