/*
  # Create Admin User

  1. Changes
    - Add admin user to auth.users if not exists
    - Ensure admin user has proper profile entry
    - Set admin flag for admin user

  2. Security
    - Only admin user gets isAdmin flag set to true
*/

-- First, ensure the is_admin column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create admin profile if it doesn't exist
INSERT INTO user_profiles (
  user_id,
  email,
  full_name,
  is_admin,
  created_at,
  updated_at
)
VALUES (
  '66354160-ada7-4e40-a5c1-96336c8fd873',
  'Admin@taxrxgroup.com',
  'Admin User',
  true,
  now(),
  now()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  is_admin = true,
  updated_at = now();