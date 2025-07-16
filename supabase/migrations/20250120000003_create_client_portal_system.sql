-- Client Portal System: QC Controls, Signatures, and Portal Tokens
-- Migration: 20250120000003_create_client_portal_system.sql

-- Portal access tokens for secure client access
CREATE TABLE IF NOT EXISTS rd_client_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES rd_businesses(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  last_accessed_ip INET
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_rd_client_portal_tokens_token ON rd_client_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_rd_client_portal_tokens_business ON rd_client_portal_tokens(business_id);

-- Document signatures for jurat and other required signatures
CREATE TABLE IF NOT EXISTS rd_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_year_id UUID NOT NULL REFERENCES rd_business_years(id) ON DELETE CASCADE,
  signature_type VARCHAR(50) NOT NULL, -- 'jurat', 'allocation_approval', etc.
  signer_name VARCHAR(255) NOT NULL,
  signer_title VARCHAR(255),
  signer_email VARCHAR(255),
  signed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  signature_data JSONB, -- DocuSign response, coordinates, etc.
  ip_address INET,
  user_agent TEXT,
  jurat_text TEXT, -- The actual jurat text that was signed
  verification_hash VARCHAR(255), -- For tamper detection
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for signatures
CREATE INDEX IF NOT EXISTS idx_rd_signatures_business_year ON rd_signatures(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_signatures_type ON rd_signatures(signature_type);
CREATE INDEX IF NOT EXISTS idx_rd_signatures_signed_at ON rd_signatures(signed_at);

-- Create enum for QC status first
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qc_status_enum') THEN
    CREATE TYPE qc_status_enum AS ENUM (
      'pending',
      'in_review', 
      'ready_for_review',
      'approved',
      'requires_changes',
      'complete'
    );
  END IF;
END $$;

-- QC status tracking and controls
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'qc_status') THEN
    ALTER TABLE rd_business_years ADD COLUMN qc_status qc_status_enum DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'qc_approved_by') THEN
    ALTER TABLE rd_business_years ADD COLUMN qc_approved_by UUID REFERENCES profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'qc_approved_at') THEN
    ALTER TABLE rd_business_years ADD COLUMN qc_approved_at TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'qc_notes') THEN
    ALTER TABLE rd_business_years ADD COLUMN qc_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'payment_received') THEN
    ALTER TABLE rd_business_years ADD COLUMN payment_received BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'payment_received_at') THEN
    ALTER TABLE rd_business_years ADD COLUMN payment_received_at TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'payment_amount') THEN
    ALTER TABLE rd_business_years ADD COLUMN payment_amount DECIMAL(15,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'documents_released') THEN
    ALTER TABLE rd_business_years ADD COLUMN documents_released BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'documents_released_at') THEN
    ALTER TABLE rd_business_years ADD COLUMN documents_released_at TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_business_years' AND column_name = 'documents_released_by') THEN
    ALTER TABLE rd_business_years ADD COLUMN documents_released_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- QC document release controls
CREATE TABLE IF NOT EXISTS rd_qc_document_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_year_id UUID NOT NULL REFERENCES rd_business_years(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'research_report', 'filing_guide', 'allocation_report'
  is_released BOOLEAN DEFAULT FALSE,
  released_at TIMESTAMP,
  released_by UUID REFERENCES profiles(id),
  release_notes TEXT,
  requires_jurat BOOLEAN DEFAULT FALSE,
  requires_payment BOOLEAN DEFAULT FALSE,
  qc_reviewer UUID REFERENCES profiles(id),
  qc_reviewed_at TIMESTAMP,
  qc_review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_year_id, document_type)
);

-- Create indexes for QC controls
CREATE INDEX IF NOT EXISTS idx_rd_qc_document_controls_business_year ON rd_qc_document_controls(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_qc_document_controls_type ON rd_qc_document_controls(document_type);
CREATE INDEX IF NOT EXISTS idx_rd_qc_document_controls_released ON rd_qc_document_controls(is_released);

-- Function to generate secure portal tokens
CREATE OR REPLACE FUNCTION generate_portal_token(p_business_id UUID, p_created_by UUID DEFAULT NULL)
RETURNS VARCHAR(255) AS $$
DECLARE
  token VARCHAR(255);
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a secure random token (64 characters)
    token := encode(gen_random_bytes(32), 'hex');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM rd_client_portal_tokens WHERE token = token) INTO token_exists;
    
    -- If token is unique, break the loop
    IF NOT token_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert the new token
  INSERT INTO rd_client_portal_tokens (business_id, token, created_by)
  VALUES (p_business_id, token, p_created_by);
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate portal token and track access
CREATE OR REPLACE FUNCTION validate_portal_token(p_token VARCHAR(255), p_ip_address INET DEFAULT NULL)
RETURNS TABLE(
  is_valid BOOLEAN,
  business_id UUID,
  business_name VARCHAR(255),
  token_id UUID
) AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Look up the token
  SELECT 
    t.id,
    t.business_id,
    t.is_active,
    t.expires_at,
    b.name as business_name
  INTO token_record
  FROM rd_client_portal_tokens t
  JOIN rd_businesses b ON t.business_id = b.id
  WHERE t.token = p_token;
  
  -- Check if token exists and is valid
  IF token_record.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR(255), NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if token is active
  IF NOT token_record.is_active THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR(255), NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if token has expired
  IF token_record.expires_at IS NOT NULL AND token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR(255), NULL::UUID;
    RETURN;
  END IF;
  
  -- Update access tracking
  UPDATE rd_client_portal_tokens 
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW(),
    last_accessed_ip = p_ip_address,
    updated_at = NOW()
  WHERE id = token_record.id;
  
  -- Return valid token info
  RETURN QUERY SELECT TRUE, token_record.business_id, token_record.business_name, token_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check document release eligibility
CREATE OR REPLACE FUNCTION check_document_release_eligibility(
  p_business_year_id UUID,
  p_document_type VARCHAR(50)
)
RETURNS TABLE(
  can_release BOOLEAN,
  reason TEXT,
  jurat_signed BOOLEAN,
  payment_received BOOLEAN,
  qc_approved BOOLEAN
) AS $$
DECLARE
  business_year_record RECORD;
  control_record RECORD;
  jurat_exists BOOLEAN;
BEGIN
  -- Get business year info
  SELECT * INTO business_year_record
  FROM rd_business_years
  WHERE id = p_business_year_id;
  
  -- Get document control info
  SELECT * INTO control_record
  FROM rd_qc_document_controls
  WHERE business_year_id = p_business_year_id 
  AND document_type = p_document_type;
  
  -- Check if jurat is signed (if required)
  SELECT EXISTS(
    SELECT 1 FROM rd_signatures 
    WHERE business_year_id = p_business_year_id 
    AND signature_type = 'jurat'
  ) INTO jurat_exists;
  
  -- Determine if document can be released based on type and requirements
  CASE p_document_type
    WHEN 'research_report' THEN
      -- Research Report: Available when QC marks as ready
      RETURN QUERY SELECT 
        (business_year_record.qc_status IN ('ready_for_review', 'approved', 'complete')),
        CASE 
          WHEN business_year_record.qc_status IN ('ready_for_review', 'approved', 'complete') THEN 'Document approved for release'
          ELSE 'Document pending QC approval'
        END,
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
        
    WHEN 'filing_guide' THEN
      -- Filing Guide: Available after jurat signed + QC approval + payment
      RETURN QUERY SELECT 
        (jurat_exists AND business_year_record.qc_status = 'complete' AND COALESCE(business_year_record.payment_received, FALSE)),
        CASE 
          WHEN NOT jurat_exists THEN 'Jurat must be signed first'
          WHEN business_year_record.qc_status != 'complete' THEN 'QC approval required'
          WHEN NOT COALESCE(business_year_record.payment_received, FALSE) THEN 'Payment required'
          ELSE 'Document approved for release'
        END,
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status = 'complete');
        
    WHEN 'allocation_report' THEN
      -- Allocation Report: Available after QC approval  
      RETURN QUERY SELECT 
        (business_year_record.qc_status IN ('approved', 'complete')),
        CASE 
          WHEN business_year_record.qc_status IN ('approved', 'complete') THEN 'Document approved for release'
          ELSE 'Document pending QC approval'
        END,
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
        
    ELSE
      -- Default: Require QC approval
      RETURN QUERY SELECT 
        (business_year_record.qc_status IN ('approved', 'complete')),
        'Document pending QC approval',
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default jurat text
INSERT INTO rd_qc_document_controls (business_year_id, document_type, requires_jurat, requires_payment)
SELECT 
  id,
  'research_report',
  FALSE,
  FALSE
FROM rd_business_years
WHERE NOT EXISTS (
  SELECT 1 FROM rd_qc_document_controls 
  WHERE business_year_id = rd_business_years.id 
  AND document_type = 'research_report'
);

INSERT INTO rd_qc_document_controls (business_year_id, document_type, requires_jurat, requires_payment)
SELECT 
  id,
  'filing_guide',
  TRUE,
  TRUE
FROM rd_business_years
WHERE NOT EXISTS (
  SELECT 1 FROM rd_qc_document_controls 
  WHERE business_year_id = rd_business_years.id 
  AND document_type = 'filing_guide'
);

INSERT INTO rd_qc_document_controls (business_year_id, document_type, requires_jurat, requires_payment)
SELECT 
  id,
  'allocation_report',
  FALSE,
  FALSE
FROM rd_business_years
WHERE NOT EXISTS (
  SELECT 1 FROM rd_qc_document_controls 
  WHERE business_year_id = rd_business_years.id 
  AND document_type = 'allocation_report'
);

-- Create RLS policies for portal tokens (admin only)
ALTER TABLE rd_client_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage portal tokens" ON rd_client_portal_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create RLS policies for signatures  
ALTER TABLE rd_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all signatures" ON rd_signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Anyone can create signatures via portal" ON rd_signatures
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for QC controls
ALTER TABLE rd_qc_document_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage QC controls" ON rd_qc_document_controls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Add helpful comments
COMMENT ON TABLE rd_client_portal_tokens IS 'Secure tokens for client portal access';
COMMENT ON TABLE rd_signatures IS 'Digital signatures for jurat and other documents';
COMMENT ON TABLE rd_qc_document_controls IS 'Quality control and document release management';
COMMENT ON FUNCTION generate_portal_token IS 'Generates secure portal access tokens for clients';
COMMENT ON FUNCTION validate_portal_token IS 'Validates portal tokens and tracks access';
COMMENT ON FUNCTION check_document_release_eligibility IS 'Checks if documents can be released based on business rules'; 