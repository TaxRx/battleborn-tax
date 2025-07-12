

DO $$ 
BEGIN
  -- Add business_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN business_name text;

  END IF;


  -- Add business_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'business_address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN business_address text;

  END IF;


  -- Add entity_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN entity_type text;

  END IF;

END $$;
;
