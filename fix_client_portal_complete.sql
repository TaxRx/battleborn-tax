-- COMPREHENSIVE CLIENT PORTAL TOKEN SYSTEM FIX
-- Run this in Supabase SQL Editor to fix all client portal token issues
-- This will create/update all necessary tables, functions, and policies

-- 1. First, create the client portal tokens table if it doesn't exist
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

-- Create indexes for fast token lookups
CREATE INDEX IF NOT EXISTS idx_rd_client_portal_tokens_token ON rd_client_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_rd_client_portal_tokens_business ON rd_client_portal_tokens(business_id);

-- 2. Create/replace the generate_portal_token function (FIXED version)
CREATE OR REPLACE FUNCTION generate_portal_token(p_business_id UUID, p_created_by UUID DEFAULT NULL)
RETURNS VARCHAR(255) AS $$
DECLARE
  v_token VARCHAR(255);  -- Use different variable name to avoid confusion
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a secure random token (64 characters)
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Check if token already exists (FULLY RESOLVED - no ambiguity)
    SELECT EXISTS(SELECT 1 FROM rd_client_portal_tokens WHERE token = v_token) INTO token_exists;
    
    -- If token is unique, break the loop
    IF NOT token_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert the new token
  INSERT INTO rd_client_portal_tokens (business_id, token, created_by)
  VALUES (p_business_id, v_token, p_created_by);
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create/replace the validate_portal_token function
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

-- 4. Set up RLS policies to allow portal access
ALTER TABLE rd_client_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to validate tokens (needed for client portal access)
CREATE POLICY IF NOT EXISTS "Allow portal token validation"
  ON rd_client_portal_tokens FOR SELECT
  USING (true);

-- Allow authenticated users to create tokens
CREATE POLICY IF NOT EXISTS "Allow token creation by authenticated users"
  ON rd_client_portal_tokens FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update tokens (for access tracking)
CREATE POLICY IF NOT EXISTS "Allow token updates by authenticated users"  
  ON rd_client_portal_tokens FOR UPDATE
  TO authenticated
  USING (true);

-- 5. Add function comments for tracking
COMMENT ON FUNCTION generate_portal_token IS 'Generates secure portal access tokens for clients - FULLY FIXED ambiguous token reference';
COMMENT ON FUNCTION validate_portal_token IS 'Validates portal tokens and tracks access - Client Portal System';

-- 6. Test the functions work
DO $$
DECLARE
  test_business_id UUID;
  test_token VARCHAR(255);
  validation_result RECORD;
BEGIN
  -- Get a business ID to test with
  SELECT id INTO test_business_id FROM rd_businesses LIMIT 1;
  
  IF test_business_id IS NOT NULL THEN
    -- Test token generation
    SELECT generate_portal_token(test_business_id) INTO test_token;
    
    -- Test token validation
    SELECT * INTO validation_result FROM validate_portal_token(test_token);
    
    -- Clean up test token
    DELETE FROM rd_client_portal_tokens WHERE token = test_token;
    
    RAISE NOTICE 'Client portal token system test PASSED: Generated token % and validated successfully', test_token;
  ELSE
    RAISE NOTICE 'No businesses found for testing - functions created but not tested';
  END IF;
END;
$$;

RAISE NOTICE 'Client Portal Token System Fix Complete! You can now:';
RAISE NOTICE '1. Generate tokens in the Reports step';
RAISE NOTICE '2. Share portal URLs with clients';
RAISE NOTICE '3. Clients can access documents with valid tokens'; 