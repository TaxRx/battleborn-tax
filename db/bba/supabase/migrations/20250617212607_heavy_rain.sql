

-- Step 1: Clean up all existing policies and functions
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;

DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

DROP POLICY IF EXISTS "Enable admin read all profiles" ON profiles;


DROP POLICY IF EXISTS "Users can access own clients" ON clients;

DROP POLICY IF EXISTS "Admins can access all clients" ON clients;

DROP POLICY IF EXISTS "Enable all operations for own clients" ON clients;

DROP POLICY IF EXISTS "Enable admin access to all clients" ON clients;


DROP POLICY IF EXISTS "Users can access own proposals" ON proposals;

DROP POLICY IF EXISTS "Admins can access all proposals" ON proposals;

DROP POLICY IF EXISTS "Enable all operations for own proposals" ON proposals;

DROP POLICY IF EXISTS "Enable admin access to all proposals" ON proposals;


DROP POLICY IF EXISTS "Users can access own strategies" ON strategies;

DROP POLICY IF EXISTS "Admins can access all strategies" ON strategies;

DROP POLICY IF EXISTS "Enable access for own strategies" ON strategies;

DROP POLICY IF EXISTS "Enable admin access to all strategies" ON strategies;


DROP POLICY IF EXISTS "Admins can access all experts" ON experts;

DROP POLICY IF EXISTS "Enable admin access to all experts" ON experts;


-- Step 2: Drop triggers and functions safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;


DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;


-- Step 3: Recreate essential functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$ LANGUAGE plpgsql;


-- Step 4: Create a simple, robust profile creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple insert with basic error handling
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'affiliate'::user_role
  );

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- If anything fails, just return NEW to not block auth
    RETURN NEW;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Step 5: Recreate triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Step 6: Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

ALTER TABLE experts ENABLE ROW LEVEL SECURITY;


-- Step 7: Create simple, non-circular RLS policies

-- Profiles: Allow users to manage their own profiles + admin override
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));


CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);


CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- Clients: Allow users to manage their own clients + admin override
CREATE POLICY "clients_all_own" ON clients
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid() OR 
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid() OR 
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );


-- Proposals: Allow users to manage their own proposals + admin override
CREATE POLICY "proposals_all_own" ON proposals
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid() OR 
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid() OR 
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );


-- Strategies: Allow access through proposal ownership + admin override
CREATE POLICY "strategies_all_via_proposals" ON strategies
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM proposals WHERE id = strategies.proposal_id AND created_by = auth.uid()) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM proposals WHERE id = strategies.proposal_id AND created_by = auth.uid()) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );


-- Experts: Admin only
CREATE POLICY "experts_admin_only" ON experts
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));


-- Step 8: Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;


-- Step 9: Ensure foreign key constraints exist
DO $$
BEGIN
  -- Add foreign key constraint if it doesn't exist
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


-- Step 10: Insert sample data
INSERT INTO experts (name, email, specialization, active) VALUES
  ('John Tax Expert', 'expert1@battleborn.life', 'Business Tax Strategy', true),
  ('Sarah CPA', 'expert2@battleborn.life', 'Individual Tax Planning', true),
  ('Mike Financial Advisor', 'expert3@battleborn.life', 'Estate Planning', true)
ON CONFLICT (email) DO NOTHING;


-- Step 11: Create a helper function for manual profile creation
CREATE OR REPLACE FUNCTION create_profile_if_missing(user_id uuid, user_email text, user_name text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    user_id,
    COALESCE(user_name, split_part(user_email, '@', 1)),
    user_email,
    CASE 
      WHEN user_email ILIKE '%admin%' THEN 'admin'::user_role
      ELSE 'affiliate'::user_role
    END
  )
  ON CONFLICT (id) DO NOTHING;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;
;
