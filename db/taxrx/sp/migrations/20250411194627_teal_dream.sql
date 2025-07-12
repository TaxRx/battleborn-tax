

DO $$ 
BEGIN
  -- Add business_address if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'business_address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN business_address text;

  END IF;


  -- Add business_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'business_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN business_name text;

  END IF;


  -- Add entity_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN entity_type text;

  END IF;


  -- Add filing_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'filing_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN filing_status text;

  END IF;


  -- Add state if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN state text;

  END IF;


  -- Add dependents if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'dependents'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN dependents integer DEFAULT 0;

  END IF;

END $$;
;
