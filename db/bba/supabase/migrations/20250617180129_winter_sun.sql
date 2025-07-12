

-- First, ensure we have the correct foreign key constraint
DO $$
BEGIN
  -- Drop any existing incorrect foreign key constraints
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;

  END IF;

  
  -- Add the correct foreign key constraint
  ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

END $$;


-- Create or update admin test user
DO $$
DECLARE
  admin_user_id uuid;

  admin_exists boolean := false;

BEGIN
  -- Check if admin user already exists
  SELECT id, true INTO admin_user_id, admin_exists 
  FROM auth.users 
  WHERE email = 'admin@battleborn.life';

  
  IF NOT admin_exists THEN
    -- Generate a new UUID for the admin user
    admin_user_id := gen_random_uuid();

    
    -- Create admin user with proper metadata
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      email_change_confirm_status
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@battleborn.life',
      crypt('Test11!!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin User"}',
      FALSE,
      NOW(),
      NOW(),
      0
    );

  END IF;


  -- Ensure admin profile exists with correct role
  INSERT INTO profiles (id, role, name, email, created_at)
  VALUES (
    admin_user_id,
    'admin'::user_role,
    'Admin User',
    'admin@battleborn.life',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::user_role,
    name = 'Admin User',
    email = 'admin@battleborn.life';

END $$;


-- Create or update affiliate test user
DO $$
DECLARE
  affiliate_user_id uuid;

  affiliate_exists boolean := false;

BEGIN
  -- Check if affiliate user already exists
  SELECT id, true INTO affiliate_user_id, affiliate_exists 
  FROM auth.users 
  WHERE email = 'ben@taxrxgroup.com';

  
  IF NOT affiliate_exists THEN
    -- Generate a new UUID for the affiliate user
    affiliate_user_id := gen_random_uuid();

    
    -- Create affiliate user with proper metadata
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      email_change_confirm_status
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      affiliate_user_id,
      'authenticated',
      'authenticated',
      'ben@taxrxgroup.com',
      crypt('Test11!!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Ben Affiliate"}',
      FALSE,
      NOW(),
      NOW(),
      0
    );

  END IF;


  -- Ensure affiliate profile exists with correct role
  INSERT INTO profiles (id, role, name, email, created_at)
  VALUES (
    affiliate_user_id,
    'affiliate'::user_role,
    'Ben Affiliate',
    'ben@taxrxgroup.com',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'affiliate'::user_role,
    name = 'Ben Affiliate',
    email = 'ben@taxrxgroup.com';

END $$;


-- Verify the setup by checking that both users and profiles exist
DO $$
DECLARE
  admin_count integer;

  affiliate_count integer;

BEGIN
  -- Count admin records
  SELECT COUNT(*) INTO admin_count
  FROM auth.users u
  JOIN profiles p ON u.id = p.id
  WHERE u.email = 'admin@battleborn.life' AND p.role = 'admin';

  
  -- Count affiliate records
  SELECT COUNT(*) INTO affiliate_count
  FROM auth.users u
  JOIN profiles p ON u.id = p.id
  WHERE u.email = 'ben@taxrxgroup.com' AND p.role = 'affiliate';

  
  -- Log the results
  RAISE NOTICE 'Admin user setup: % records found', admin_count;

  RAISE NOTICE 'Affiliate user setup: % records found', affiliate_count;

  
  -- Ensure we have the expected records
  IF admin_count != 1 THEN
    RAISE EXCEPTION 'Admin user setup failed: expected 1 record, found %', admin_count;

  END IF;

  
  IF affiliate_count != 1 THEN
    RAISE EXCEPTION 'Affiliate user setup failed: expected 1 record, found %', affiliate_count;

  END IF;

END $$;
;
