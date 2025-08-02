

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Users can access own clients" ON clients;

DROP POLICY IF EXISTS "Admins can access all clients" ON clients;

DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;

DROP POLICY IF EXISTS "Users can access own proposals" ON proposals;

DROP POLICY IF EXISTS "Admins can access all proposals" ON proposals;

DROP POLICY IF EXISTS "Users can access own strategies" ON strategies;

DROP POLICY IF EXISTS "Admins can access all strategies" ON strategies;

DROP POLICY IF EXISTS "Admins can access all experts" ON experts;


-- Ensure the handle_new_user function exists and works properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email LIKE '%admin%' THEN 'admin'::user_role
      ELSE 'affiliate'::user_role
    END
  );

  RETURN NEW;

EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- Fix profiles table policies
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
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- Fix clients table policies
CREATE POLICY "Users can access own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());


CREATE POLICY "Admins can access all clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- Fix proposals table policies
CREATE POLICY "Users can access own proposals"
  ON proposals
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());


CREATE POLICY "Admins can access all proposals"
  ON proposals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- Fix strategies table policies
CREATE POLICY "Users can access own strategies"
  ON strategies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE id = strategies.proposal_id AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE id = strategies.proposal_id AND created_by = auth.uid()
    )
  );


CREATE POLICY "Admins can access all strategies"
  ON strategies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- Fix experts table policies
CREATE POLICY "Admins can access all experts"
  ON experts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- Ensure all tables have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

ALTER TABLE experts ENABLE ROW LEVEL SECURITY;


-- Add some sample experts for development
INSERT INTO experts (name, email, specialization, active) VALUES
  ('John Tax Expert', 'expert1@galileotax.com', 'Business Tax Strategy', true),
  ('Sarah CPA', 'expert2@galileotax.com', 'Individual Tax Planning', true),
  ('Mike Financial Advisor', 'expert3@galileotax.com', 'Estate Planning', true)
ON CONFLICT (email) DO NOTHING;
;
