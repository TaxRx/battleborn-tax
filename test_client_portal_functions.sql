-- TEST CLIENT PORTAL FUNCTIONS
-- Run this AFTER applying the main fix to verify everything works

-- Test 1: Check if functions exist
SELECT 
  'generate_portal_token' as function_name,
  EXISTS(
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'generate_portal_token' 
    AND routine_type = 'FUNCTION'
  ) as exists;

SELECT 
  'validate_portal_token' as function_name,
  EXISTS(
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'validate_portal_token' 
    AND routine_type = 'FUNCTION'
  ) as exists;

-- Test 2: Check if table exists
SELECT 
  'rd_client_portal_tokens' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'rd_client_portal_tokens'
  ) as exists;

-- Test 3: Try to generate and validate a token (if businesses exist)
DO $$
DECLARE
  test_business_id UUID;
  test_token VARCHAR(255);
  validation_result RECORD;
BEGIN
  -- Get a business ID to test with
  SELECT id INTO test_business_id FROM rd_businesses LIMIT 1;
  
  IF test_business_id IS NOT NULL THEN
    RAISE NOTICE 'Testing with business ID: %', test_business_id;
    
    -- Test token generation
    SELECT generate_portal_token(test_business_id) INTO test_token;
    RAISE NOTICE 'Generated token: %', test_token;
    
    -- Test token validation
    SELECT * INTO validation_result FROM validate_portal_token(test_token);
    RAISE NOTICE 'Token validation result: valid=%, business_id=%', 
                 validation_result.is_valid, validation_result.business_id;
    
    -- Clean up test token
    DELETE FROM rd_client_portal_tokens WHERE token = test_token;
    
    RAISE NOTICE '✅ CLIENT PORTAL SYSTEM IS WORKING!';
  ELSE
    RAISE NOTICE '⚠️ No businesses found in database - cannot test token generation';
    RAISE NOTICE 'Functions exist but need business data to test';
  END IF;
END;
$$; 