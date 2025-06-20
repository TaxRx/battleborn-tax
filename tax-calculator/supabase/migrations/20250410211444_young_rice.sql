-- Add isAdmin column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN is_admin boolean DEFAULT false;

-- Create admin access policy
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin = true);

CREATE POLICY "Admins can view all calculations"
  ON tax_calculations
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  ));