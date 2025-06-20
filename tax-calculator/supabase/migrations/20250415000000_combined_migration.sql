-- Force drop the tax_profiles table first
DROP TABLE IF EXISTS tax_profiles CASCADE;

-- Combined migration for fixing table names, cleaning up old tables, and setting up new structure
BEGIN;

-- Step 1: Drop all existing policies first
DO $$ 
BEGIN
    -- Drop all policies for all tables
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can view own tax profiles" ON tax_profiles;
    DROP POLICY IF EXISTS "Users can update own tax profiles" ON tax_profiles;
    DROP POLICY IF EXISTS "Users can insert own tax profiles" ON tax_profiles;
    DROP POLICY IF EXISTS "Admins can view all tax profiles" ON tax_profiles;
    DROP POLICY IF EXISTS "Users can view own user preferences" ON user_preferences;
    DROP POLICY IF EXISTS "Users can update own user preferences" ON user_preferences;
    DROP POLICY IF EXISTS "Users can insert own user preferences" ON user_preferences;
    DROP POLICY IF EXISTS "Admins can view all user preferences" ON user_preferences;
    DROP POLICY IF EXISTS "Users can view own tax calculations" ON tax_calculations;
    DROP POLICY IF EXISTS "Users can update own tax calculations" ON tax_calculations;
    DROP POLICY IF EXISTS "Users can insert own tax calculations" ON tax_calculations;
    DROP POLICY IF EXISTS "Admins can view all tax calculations" ON tax_calculations;
    DROP POLICY IF EXISTS "Users can view own leads" ON leads;
    DROP POLICY IF EXISTS "Users can update own leads" ON leads;
    DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
    DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
END $$;

-- Step 2: Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_tax_profiles_updated_at ON tax_profiles;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_tax_calculations_updated_at ON tax_calculations;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;

-- Step 3: Drop all functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 4: Drop all tables
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS tax_calculations CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS tax_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Step 5: Create new tables
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    is_admin BOOLEAN DEFAULT FALSE,
    has_completed_tax_profile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Enable RLS and create policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

-- Step 7: Create related tables with proper foreign keys
CREATE TABLE tax_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    -- Basic tax information
    standard_deduction BOOLEAN DEFAULT FALSE,
    business_owner BOOLEAN DEFAULT FALSE,
    full_name TEXT,
    email TEXT,
    filing_status TEXT,
    dependents INTEGER DEFAULT 0,
    home_address TEXT,
    state TEXT,
    
    -- Income types
    wages_income DECIMAL DEFAULT 0,
    passive_income DECIMAL DEFAULT 0,
    unearned_income DECIMAL DEFAULT 0,
    capital_gains DECIMAL DEFAULT 0,
    custom_deduction DECIMAL DEFAULT 0,
    charitable_deduction DECIMAL DEFAULT 0,
    business_name TEXT,
    entity_type TEXT,
    ordinary_k1_income DECIMAL DEFAULT 0,
    guaranteed_k1_income DECIMAL DEFAULT 0,
    business_address TEXT,
    deduction_limit_reached BOOLEAN DEFAULT FALSE,
    household_income DECIMAL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tax_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    calculation_type TEXT NOT NULL,
    calculation_data JSONB,
    result DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS tax_profiles_user_id_idx ON tax_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS tax_calculations_user_id_idx ON tax_calculations(user_id);
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON profiles(updated_at);

-- Step 9: Create policies for related tables
-- Tax Profiles policies
CREATE POLICY "Users can view own tax profiles"
    ON tax_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tax profiles"
    ON tax_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax profiles"
    ON tax_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User Preferences policies
CREATE POLICY "Users can view own user preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own user preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Tax Calculations policies
CREATE POLICY "Users can view own tax calculations"
    ON tax_calculations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tax calculations"
    ON tax_calculations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax calculations"
    ON tax_calculations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Leads policies
CREATE POLICY "Users can view own leads"
    ON leads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
    ON leads FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
    ON leads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin policies for all tables
CREATE POLICY "Admins can view all tax profiles"
    ON tax_profiles FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can view all user preferences"
    ON user_preferences FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can view all tax calculations"
    ON tax_calculations FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can view all leads"
    ON leads FOR SELECT
    USING (is_admin());

-- Step 10: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_profiles_updated_at
    BEFORE UPDATE ON tax_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_calculations_updated_at
    BEFORE UPDATE ON tax_calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Create handle_new_user function and trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

COMMIT; 