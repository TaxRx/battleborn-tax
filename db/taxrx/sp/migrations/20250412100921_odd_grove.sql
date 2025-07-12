

-- Create admin user in auth.users if it doesn't exist
DO $$
DECLARE
  admin_uid uuid := '66354160-ada7-4e40-a5c1-96336c8fd873';

BEGIN
  -- Insert admin user into auth.users if not exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = admin_uid
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    )
    VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'Admin@taxrxgroup.com',
      crypt('Test11!!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin User"}',
      false,
      'authenticated'
    );

  END IF;


  -- Ensure admin profile exists and has admin privileges
  INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    is_admin,
    created_at,
    updated_at
  )
  VALUES (
    admin_uid,
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

END $$;
;
