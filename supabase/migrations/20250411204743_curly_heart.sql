/*
  # Add business information columns to user_profiles

  1. Changes
    - Add new columns to `user_profiles` table:
      - `business_name` (text, nullable) - Name of the user's business
      - `business_address` (text, nullable) - Address of the user's business
      - `entity_type` (text, nullable) - Type of business entity (LLC, S-Corp, etc.)

  2. Notes
    - All columns are nullable since not all users will have business information
    - No default values are set as these are optional fields
*/

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