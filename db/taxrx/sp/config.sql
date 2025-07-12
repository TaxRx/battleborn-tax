-- Ensure RLS policies are properly set
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Update user profiles RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
  AND is_admin = true
));

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
  AND is_admin = true
)); 