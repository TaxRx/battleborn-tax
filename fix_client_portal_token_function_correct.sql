-- CORRECT Fix for generate_portal_token function - resolves ambiguous token reference
-- Run this to fix the client portal token generation error

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

-- Add comment to track this fix
COMMENT ON FUNCTION generate_portal_token IS 'Generates secure portal access tokens for clients - FULLY FIXED ambiguous token reference by using v_token variable name'; 