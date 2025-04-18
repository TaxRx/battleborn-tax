/*
  # User Data Schema Update

  1. Changes
    - Create user_profiles and tax_calculations tables if they don't exist
    - Add policies with existence checks
    - Enable RLS on both tables
    
  2. Notes
    - Uses DO blocks to safely check for existing policies
    - Maintains all original functionality while avoiding conflicts
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  full_name text,
  email text,
  home_address text,
  business_name text,
  business_address text,
  entity_type text,
  filing_status text,
  household_income numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create tax_calculations table
CREATE TABLE IF NOT EXISTS tax_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  year integer NOT NULL,
  tax_info jsonb NOT NULL,
  breakdown jsonb NOT NULL,
  strategies jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

-- Safely create policies for user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON user_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Safely create policies for tax_calculations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tax_calculations' 
    AND policyname = 'Users can view own calculations'
  ) THEN
    CREATE POLICY "Users can view own calculations"
      ON tax_calculations
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tax_calculations' 
    AND policyname = 'Users can insert own calculations'
  ) THEN
    CREATE POLICY "Users can insert own calculations"
      ON tax_calculations
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tax_calculations' 
    AND policyname = 'Users can update own calculations'
  ) THEN
    CREATE POLICY "Users can update own calculations"
      ON tax_calculations
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tax_calculations' 
    AND policyname = 'Users can delete own calculations'
  ) THEN
    CREATE POLICY "Users can delete own calculations"
      ON tax_calculations
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;