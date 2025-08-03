

-- Recreate the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$ language 'plpgsql';


-- Recreate the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'affiliate'
  );

  RETURN NEW;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- Ensure the profiles table has proper constraints
DO $$
BEGIN
  -- Check if the foreign key constraint exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

  END IF;

END $$;


-- Ensure RLS is enabled and policies are correct
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


-- Drop existing policies and recreate them to ensure they're correct
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;


-- Recreate policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);


CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );


CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );


-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT ALL ON public.profiles TO authenticated;

GRANT ALL ON public.clients TO authenticated;

GRANT ALL ON public.proposals TO authenticated;

GRANT ALL ON public.strategies TO authenticated;

GRANT ALL ON public.experts TO authenticated;
;
