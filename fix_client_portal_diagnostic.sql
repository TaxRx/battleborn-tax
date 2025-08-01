-- DIAGNOSTIC AND COMPLETE CLIENT PORTAL TOKEN CLEANUP
-- Run this step by step to identify and fix all function conflicts

-- STEP 1: Show all existing portal token functions
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%portal_token%'
ORDER BY p.proname, p.oid;

-- STEP 2: Show all functions with exact names we need to drop
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  'DROP FUNCTION ' || n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') CASCADE;' as drop_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('generate_portal_token', 'validate_portal_token')
ORDER BY p.proname, p.oid;

-- STEP 3: Drop ALL functions with these names using a more comprehensive approach
DO $$
DECLARE
  func_record RECORD;
BEGIN
  -- Drop all generate_portal_token functions
  FOR func_record IN 
    SELECT n.nspname as schema_name, p.proname as function_name, p.oid,
           pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'generate_portal_token'
  LOOP
    EXECUTE 'DROP FUNCTION ' || func_record.schema_name || '.' || func_record.function_name || '(' || func_record.arguments || ') CASCADE';
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
    EXECUTE 'DROP FUNCTION ' || func_record.schema_name || '.' || func_record.function_name || '(' || func_record.arguments || ') CASCADE';
    RAISE NOTICE 'Dropped function: %.%(%)', func_record.schema_name, func_record.function_name, func_record.arguments;
  END LOOP;
  
  RAISE NOTICE 'All portal token functions have been dropped';
END $$;

-- STEP 4: Verify all functions are gone
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('generate_portal_token', 'validate_portal_token');

-- STEP 5: Add missing table columns if needed
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

-- STEP 6: Create the SINGLE generate_portal_token function
CREATE FUNCTION generate_portal_token(p_business_id UUID)
RETURNS TABLE(token VARCHAR, expires_at TIMESTAMP) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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
$$;

-- STEP 7: Create the SINGLE validate_portal_token function
CREATE FUNCTION validate_portal_token(p_token VARCHAR, p_ip_address INET DEFAULT NULL)
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
$$;

-- STEP 8: Verify only one of each function exists
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('generate_portal_token', 'validate_portal_token')
ORDER BY p.proname;

-- STEP 9: Test the functions
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
    SELECT token INTO test_token 
    FROM generate_portal_token(test_business_id);
    
    RAISE NOTICE 'Generated test token: %', SUBSTRING(test_token, 1, 10) || '...';
    
    -- Validate the token
    SELECT * INTO test_result 
    FROM validate_portal_token(test_token);
    
    IF test_result.is_valid THEN
      RAISE NOTICE 'Token validation: SUCCESS';
      RAISE NOTICE 'Business: %', test_result.business_name;
    ELSE
      RAISE NOTICE 'Token validation: FAILED - %', test_result.message;
    END IF;
    
    -- Clean up test token
    DELETE FROM rd_client_portal_tokens WHERE token = test_token;
    RAISE NOTICE 'Test token cleaned up';
    RAISE NOTICE '=== CLIENT PORTAL TOKEN SYSTEM IS NOW WORKING ===';
  ELSE
    RAISE NOTICE 'No businesses found for testing';
  END IF;
END $$; 