-- =============================================
-- CLIENT PORTAL TOKEN SYSTEM COMPREHENSIVE FIX
-- This script will diagnose and fix all token-related issues
-- =============================================

-- STEP 1: Diagnostic Information
DO $$
BEGIN
  RAISE NOTICE '=== STARTING CLIENT PORTAL DIAGNOSTIC ===';
  RAISE NOTICE 'Current timestamp: %', NOW();
END $$;

-- STEP 2: Check if table exists and show current structure
DO $$
DECLARE
  table_exists BOOLEAN;
  column_record RECORD;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'rd_client_portal_tokens'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Table rd_client_portal_tokens EXISTS';
    RAISE NOTICE 'Current columns:';
    FOR column_record IN
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'rd_client_portal_tokens'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '  - %: % (nullable: %, default: %)', 
        column_record.column_name, 
        column_record.data_type, 
        column_record.is_nullable,
        column_record.column_default;
    END LOOP;
  ELSE
    RAISE NOTICE 'Table rd_client_portal_tokens DOES NOT EXIST';
  END IF;
END $$;

-- STEP 3: Check existing functions
DO $$
DECLARE
  func_record RECORD;
BEGIN
  RAISE NOTICE '=== EXISTING FUNCTIONS ===';
  
  FOR func_record IN 
    SELECT n.nspname as schema_name, p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname IN ('generate_portal_token', 'validate_portal_token')
    ORDER BY p.proname, arguments
  LOOP
    RAISE NOTICE 'Found function: %.%(%)', func_record.schema_name, func_record.function_name, func_record.arguments;
  END LOOP;
END $$;

-- STEP 4: Drop ALL existing portal token functions
DO $$
DECLARE
  func_record RECORD;
BEGIN
  RAISE NOTICE '=== DROPPING EXISTING FUNCTIONS ===';
  
  -- Drop all generate_portal_token functions
  FOR func_record IN 
    SELECT n.nspname as schema_name, p.proname as function_name, p.oid,
           pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'generate_portal_token'
  LOOP
    EXECUTE format('DROP FUNCTION %I.%I(%s) CASCADE', 
      func_record.schema_name, func_record.function_name, func_record.arguments);
    RAISE NOTICE 'Dropped function: %.%(%)', func_record.schema_name, func_record.function_name, func_record.arguments;
  END LOOP;
  
  -- Drop all validate_portal_token functions
  FOR func_record IN 
    SELECT n.nspname as schema_name, p.proname as function_name, p.oid,
           pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'validate_portal_token'
  LOOP
    EXECUTE format('DROP FUNCTION %I.%I(%s) CASCADE', 
      func_record.schema_name, func_record.function_name, func_record.arguments);
    RAISE NOTICE 'Dropped function: %.%(%)', func_record.schema_name, func_record.function_name, func_record.arguments;
  END LOOP;
  
  RAISE NOTICE 'All portal token functions have been dropped';
END $$;

-- STEP 5: Create or update table schema
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rd_client_portal_tokens') THEN
    CREATE TABLE rd_client_portal_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES rd_businesses(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE,
      access_count INTEGER DEFAULT 0,
      last_accessed_at TIMESTAMP,
      last_accessed_ip INET
    );
    RAISE NOTICE 'Created rd_client_portal_tokens table';
  END IF;

  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_client_portal_tokens' AND column_name = 'is_active') THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_client_portal_tokens' AND column_name = 'updated_at') THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_client_portal_tokens' AND column_name = 'access_count') THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN access_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added access_count column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_client_portal_tokens' AND column_name = 'last_accessed_at') THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN last_accessed_at TIMESTAMP;
    RAISE NOTICE 'Added last_accessed_at column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_client_portal_tokens' AND column_name = 'last_accessed_ip') THEN
    ALTER TABLE rd_client_portal_tokens ADD COLUMN last_accessed_ip INET;
    RAISE NOTICE 'Added last_accessed_ip column';
  END IF;

  RAISE NOTICE 'Table schema updates complete';
END $$;

-- STEP 6: Create the generate_portal_token function
CREATE OR REPLACE FUNCTION generate_portal_token(p_business_id UUID)
RETURNS TABLE(token VARCHAR, expires_at TIMESTAMP) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  new_token VARCHAR(64);
  new_expires_at TIMESTAMP;
BEGIN
  -- Generate a secure random token
  new_token := encode(gen_random_bytes(32), 'hex');
  
  -- Set expiration to 30 days from now
  new_expires_at := NOW() + INTERVAL '30 days';
  
  -- Deactivate any existing tokens for this business
  UPDATE rd_client_portal_tokens 
  SET is_active = FALSE, updated_at = NOW()
  WHERE business_id = p_business_id AND is_active = TRUE;
  
  -- Insert new token
  INSERT INTO rd_client_portal_tokens (
    business_id, 
    token, 
    expires_at, 
    created_at, 
    updated_at,
    is_active,
    access_count
  ) VALUES (
    p_business_id, 
    new_token, 
    new_expires_at, 
    NOW(), 
    NOW(),
    TRUE,
    0
  );
  
  -- Return the new token
  RETURN QUERY SELECT new_token, new_expires_at;
END $$;

-- STEP 7: Create the validate_portal_token function
CREATE OR REPLACE FUNCTION validate_portal_token(p_token VARCHAR, p_ip_address INET DEFAULT NULL)
RETURNS TABLE(
  is_valid BOOLEAN,
  business_id UUID,
  business_name TEXT,
  expires_at TIMESTAMP,
  message TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Look up the token
  SELECT t.id, t.business_id, t.expires_at, t.is_active, b.name as business_name
  INTO token_record
  FROM rd_client_portal_tokens t
  JOIN rd_businesses b ON t.business_id = b.id
  WHERE t.token = p_token;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TIMESTAMP, 'Invalid token'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token is active
  IF NOT token_record.is_active THEN
    RETURN QUERY SELECT FALSE, token_record.business_id, token_record.business_name, token_record.expires_at, 'Token has been deactivated'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token has expired
  IF token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, token_record.business_id, token_record.business_name, token_record.expires_at, 'Token has expired'::TEXT;
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
  
  -- Return success
  RETURN QUERY SELECT TRUE, token_record.business_id, token_record.business_name, token_record.expires_at, 'Valid token'::TEXT;
END $$;

-- STEP 8: Create indexes for performance
DO $$
BEGIN
  -- Index on token for fast lookups
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'rd_client_portal_tokens' AND indexname = 'idx_rd_client_portal_tokens_token') THEN
    CREATE INDEX idx_rd_client_portal_tokens_token ON rd_client_portal_tokens(token);
    RAISE NOTICE 'Created index on token column';
  END IF;
  
  -- Index on business_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'rd_client_portal_tokens' AND indexname = 'idx_rd_client_portal_tokens_business_id') THEN
    CREATE INDEX idx_rd_client_portal_tokens_business_id ON rd_client_portal_tokens(business_id);
    RAISE NOTICE 'Created index on business_id column';
  END IF;
  
  -- Index on active tokens
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'rd_client_portal_tokens' AND indexname = 'idx_rd_client_portal_tokens_active') THEN
    CREATE INDEX idx_rd_client_portal_tokens_active ON rd_client_portal_tokens(business_id, is_active, expires_at) WHERE is_active = TRUE;
    RAISE NOTICE 'Created index on active tokens';
  END IF;
END $$;

-- STEP 9: Test the functions
DO $$
DECLARE
  test_business_id UUID;
  test_token VARCHAR;
  test_expires_at TIMESTAMP;
  validation_result RECORD;
BEGIN
  RAISE NOTICE '=== TESTING FUNCTIONS ===';
  
  -- Get a sample business ID for testing
  SELECT id INTO test_business_id FROM rd_businesses LIMIT 1;
  
  IF test_business_id IS NULL THEN
    RAISE NOTICE 'No businesses found for testing';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testing with business ID: %', test_business_id;
  
  -- Test token generation
  SELECT token, expires_at INTO test_token, test_expires_at 
  FROM generate_portal_token(test_business_id);
  
  RAISE NOTICE 'Generated token: % (expires: %)', test_token, test_expires_at;
  
  -- Test token validation
  SELECT is_valid, business_id, business_name, expires_at, message 
  INTO validation_result
  FROM validate_portal_token(test_token);
  
  RAISE NOTICE 'Validation result: valid=%, business=%, message=%', 
    validation_result.is_valid, validation_result.business_name, validation_result.message;
  
  -- Test invalid token
  SELECT is_valid, message INTO validation_result
  FROM validate_portal_token('invalid_token_12345');
  
  RAISE NOTICE 'Invalid token test: valid=%, message=%', 
    validation_result.is_valid, validation_result.message;
    
  RAISE NOTICE '=== TESTING COMPLETE ===';
END $$;

-- STEP 10: Final summary
DO $$
BEGIN
  RAISE NOTICE '=== CLIENT PORTAL FIX COMPLETE ===';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  - generate_portal_token(UUID) -> TABLE(VARCHAR, TIMESTAMP)';
  RAISE NOTICE '  - validate_portal_token(VARCHAR, INET) -> TABLE(BOOLEAN, UUID, TEXT, TIMESTAMP, TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Generate a new token in your application';
  RAISE NOTICE '2. Test the client portal URL: http://localhost:5174/client-portal/BUSINESS_ID/TOKEN';
  RAISE NOTICE '3. Check that documents are properly displayed';
  RAISE NOTICE '';
  RAISE NOTICE 'If issues persist, check:';
  RAISE NOTICE '- Frontend ClientPortal.tsx component is calling validate_portal_token correctly';
  RAISE NOTICE '- URL routing is working properly';
  RAISE NOTICE '- Business has documents in rd_documents table';
  RAISE NOTICE '=== END SUMMARY ===';
END $$; 