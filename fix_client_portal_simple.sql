-- SIMPLE CLIENT PORTAL TOKEN SYSTEM FIX
-- Run this in Supabase SQL Editor to fix client portal token issues
-- This script checks existing structure and adds only missing pieces

-- First, let's see what we have
DO $$
BEGIN
  RAISE NOTICE '=== CHECKING EXISTING CLIENT PORTAL STRUCTURE ===';
END $$;

-- Check if table exists and show its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'rd_client_portal_tokens' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add is_active column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rd_client_portal_tokens' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column';
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rd_client_portal_tokens' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;

  -- Add access_count column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rd_client_portal_tokens' 
    AND column_name = 'access_count'
  ) THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN access_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added access_count column';
  END IF;

  -- Add last_accessed_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rd_client_portal_tokens' 
    AND column_name = 'last_accessed_at'
  ) THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN last_accessed_at TIMESTAMP;
    RAISE NOTICE 'Added last_accessed_at column';
  END IF;

  -- Add last_accessed_ip column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rd_client_portal_tokens' 
    AND column_name = 'last_accessed_ip'
  ) THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN last_accessed_ip INET;
    RAISE NOTICE 'Added last_accessed_ip column';
  END IF;

  RAISE NOTICE 'Column updates complete';
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_client_portal_tokens_token ON rd_client_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_portal_tokens_business_id ON rd_client_portal_tokens(business_id);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_portal_token(UUID);
DROP FUNCTION IF EXISTS validate_portal_token(VARCHAR, INET);

-- Create the generate_portal_token function
CREATE OR REPLACE FUNCTION generate_portal_token(p_business_id UUID)
RETURNS TABLE(token VARCHAR, expires_at TIMESTAMP) AS $$
DECLARE
  v_token VARCHAR(255);
  v_expires_at TIMESTAMP;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Set expiration to 7 days from now
  v_expires_at := NOW() + INTERVAL '7 days';
  
  -- Insert the token record
  INSERT INTO rd_client_portal_tokens (
    business_id, 
    token, 
    expires_at,
    is_active,
    access_count,
    created_at,
    updated_at
  ) VALUES (
    p_business_id,
    v_token,
    v_expires_at,
    TRUE,
    0,
    NOW(),
    NOW()
  );
  
  -- Return the token and expiration
  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the validate_portal_token function
CREATE OR REPLACE FUNCTION validate_portal_token(p_token VARCHAR, p_ip_address INET DEFAULT NULL)
RETURNS TABLE(
  is_valid BOOLEAN,
  business_id UUID,
  business_name TEXT,
  expires_at TIMESTAMP,
  message TEXT
) AS $$
DECLARE
  token_record RECORD;
  business_record RECORD;
BEGIN
  -- Find the token
  SELECT 
    t.id,
    t.business_id,
    t.is_active,
    t.expires_at
  INTO token_record
  FROM rd_client_portal_tokens t
  WHERE t.token = p_token;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TIMESTAMP, 'Invalid token'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token is active
  IF NOT token_record.is_active THEN
    RETURN QUERY SELECT FALSE, token_record.business_id, NULL::TEXT, token_record.expires_at, 'Token is disabled'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token is expired
  IF token_record.expires_at IS NOT NULL AND token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, token_record.business_id, NULL::TEXT, token_record.expires_at, 'Token has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Get business information
  SELECT name INTO business_record
  FROM rd_businesses
  WHERE id = token_record.business_id;
  
  -- Update access tracking
  UPDATE rd_client_portal_tokens 
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW(),
    last_accessed_ip = COALESCE(p_ip_address, last_accessed_ip),
    updated_at = NOW()
  WHERE id = token_record.id;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE, 
    token_record.business_id, 
    business_record.name, 
    token_record.expires_at,
    'Token is valid'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the functions
DO $$
DECLARE
  test_business_id UUID;
  test_token VARCHAR;
  test_result RECORD;
BEGIN
  -- Get a business ID for testing
  SELECT id INTO test_business_id FROM rd_businesses LIMIT 1;
  
  IF test_business_id IS NOT NULL THEN
    -- Generate a token
    SELECT token INTO test_token FROM generate_portal_token(test_business_id);
    RAISE NOTICE 'Generated test token: %', SUBSTRING(test_token, 1, 10) || '...';
    
    -- Validate the token
    SELECT * INTO test_result FROM validate_portal_token(test_token);
    
    IF test_result.is_valid THEN
      RAISE NOTICE 'Token validation: SUCCESS';
      RAISE NOTICE 'Business: %', test_result.business_name;
    ELSE
      RAISE NOTICE 'Token validation: FAILED - %', test_result.message;
    END IF;
    
    -- Clean up test token
    DELETE FROM rd_client_portal_tokens WHERE token = test_token;
    RAISE NOTICE 'Test token cleaned up';
  ELSE
    RAISE NOTICE 'No businesses found for testing';
  END IF;
  
  RAISE NOTICE '=== CLIENT PORTAL TOKEN SYSTEM IS NOW WORKING ===';
END $$; 