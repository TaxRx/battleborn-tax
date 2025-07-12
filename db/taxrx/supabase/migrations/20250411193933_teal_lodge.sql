/*
  # Add business address column

  1. Changes
    - Add `business_address` column to `user_profiles` table
    
  2. Notes
    - Column is nullable to maintain compatibility with existing records
    - Uses text type for flexible address storage
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'business_address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN business_address text;
  END IF;
END $$;