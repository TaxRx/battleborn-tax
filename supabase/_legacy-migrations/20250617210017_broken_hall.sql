

-- Drop the existing INSERT policy that might be causing issues
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;


-- Create a new INSERT policy that allows authenticated users to insert clients
-- where they set themselves as the created_by user
CREATE POLICY "Authenticated users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);


-- Ensure the other policies are still in place (these should already exist)
-- But let's make sure they're correctly defined

-- Policy for users to access their own clients
DROP POLICY IF EXISTS "Users can access own clients" ON clients;

CREATE POLICY "Users can access own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());


-- Policy for admins to access all clients  
DROP POLICY IF EXISTS "Admins can access all clients" ON clients;

CREATE POLICY "Admins can access all clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  );
;
