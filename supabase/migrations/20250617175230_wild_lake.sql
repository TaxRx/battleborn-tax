

-- Create admin test user
DO $$
DECLARE
  admin_user_id uuid;

BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@galileotax.com';

  
  IF admin_user_id IS NULL THEN
    -- Create admin user with proper metadata for the trigger
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@galileotax.com',
      crypt('Test11!!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin User"}',
      FALSE,
      NOW(),
      NOW()
      
    ) RETURNING id INTO admin_user_id;

    
    -- Update the profile role since trigger creates it with default role
    UPDATE profiles 
    SET role = 'admin'::user_role 
    WHERE id = admin_user_id;

  END IF;

END $$;


-- Create affiliate test user
DO $$
DECLARE
  affiliate_user_id uuid;

BEGIN
  -- Check if affiliate user already exists
  SELECT id INTO affiliate_user_id FROM auth.users WHERE email = 'ben@taxrxgroup.com';

  
  IF affiliate_user_id IS NULL THEN
    -- Create affiliate user with proper metadata for the trigger
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'ben@taxrxgroup.com',
      crypt('Test11!!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Ben Affiliate"}',
      FALSE,
      NOW(),
      NOW()
    ) RETURNING id INTO affiliate_user_id;

    
    -- The profile will be created with default 'affiliate' role by the trigger, so no update needed
  END IF;

END $$;
;
