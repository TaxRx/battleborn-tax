

-- First, drop triggers that depend on functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;


-- Now we can safely drop and recreate functions
DROP FUNCTION IF EXISTS handle_new_user();

DROP FUNCTION IF EXISTS update_updated_at_column();


-- Recreate the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$ LANGUAGE plpgsql;


-- Recreate the trigger for proposals
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Create a robust user profile creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user profile
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE 
      WHEN NEW.email ILIKE '%admin%' THEN 'admin'::user_role
      ELSE 'affiliate'::user_role
    END
  );

  RETURN NEW;

EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, that's fine
    RETURN NEW;

  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;

    RETURN NEW;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create the auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- Ensure all tables have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

ALTER TABLE experts ENABLE ROW LEVEL SECURITY;


-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Users can access own clients" ON clients;

DROP POLICY IF EXISTS "Admins can access all clients" ON clients;

DROP POLICY IF EXISTS "Users can access own proposals" ON proposals;

DROP POLICY IF EXISTS "Admins can access all proposals" ON proposals;

DROP POLICY IF EXISTS "Users can access own strategies" ON strategies;

DROP POLICY IF EXISTS "Admins can access all strategies" ON strategies;

DROP POLICY IF EXISTS "Admins can access all experts" ON experts;


-- Create comprehensive policies for profiles
CREATE POLICY "Enable read access for own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);


CREATE POLICY "Enable update for own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


CREATE POLICY "Enable admin read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- Create policies for clients
CREATE POLICY "Enable all operations for own clients"
  ON clients FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());


CREATE POLICY "Enable admin access to all clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- Create policies for proposals
CREATE POLICY "Enable all operations for own proposals"
  ON proposals FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());


CREATE POLICY "Enable admin access to all proposals"
  ON proposals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- Create policies for strategies
CREATE POLICY "Enable access for own strategies"
  ON strategies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = strategies.proposal_id AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = strategies.proposal_id AND p.created_by = auth.uid()
    )
  );


CREATE POLICY "Enable admin access to all strategies"
  ON strategies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- Create policies for experts
CREATE POLICY "Enable admin access to all experts"
  ON experts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;


-- Ensure the foreign key constraint exists
DO $$
BEGIN
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


-- Add some sample experts if they don't exist
INSERT INTO experts (name, email, specialization, active) VALUES
  ('John Tax Expert', 'expert1@galileotax.com', 'Business Tax Strategy', true),
  ('Sarah CPA', 'expert2@galileotax.com', 'Individual Tax Planning', true),
  ('Mike Financial Advisor', 'expert3@galileotax.com', 'Estate Planning', true)
ON CONFLICT (email) DO NOTHING;
;
