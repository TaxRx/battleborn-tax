-- Fix infinite recursion in RLS policies
-- The issue is that client_users policies reference client_users table creating circular dependency

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own client relationships" ON client_users;
DROP POLICY IF EXISTS "Client owners can manage client users" ON client_users;
DROP POLICY IF EXISTS "Admins can manage all client users" ON client_users;
DROP POLICY IF EXISTS "Client owners can create invitations" ON invitations;
DROP POLICY IF EXISTS "Client owners can update invitations" ON invitations;
DROP POLICY IF EXISTS "Client owners can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view invitations for their clients" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON invitations;

-- Create a function to check if user has client access without recursion
CREATE OR REPLACE FUNCTION user_has_direct_client_access(user_id UUID, client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is the client creator
  IF EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_id AND c.created_by = user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is an admin
  IF EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = user_id AND p.role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is an affiliate who created the client
  IF EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_id AND c.affiliate_id = user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check client ownership without recursion
CREATE OR REPLACE FUNCTION user_is_client_owner(user_id UUID, client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.client_id = client_id 
    AND cu.user_id = user_id 
    AND cu.role = 'owner'
    AND cu.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate client_users policies without recursion
CREATE POLICY "Users can view own client relationships" ON client_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Client owners can manage client users" ON client_users
  FOR ALL USING (
    user_has_direct_client_access(auth.uid(), client_id)
  );

CREATE POLICY "Admins can manage all client users" ON client_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Recreate invitation policies without recursion
CREATE POLICY "Anyone can view invitations by token" ON invitations
  FOR SELECT USING (token IS NOT NULL);

CREATE POLICY "Client owners can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    user_has_direct_client_access(auth.uid(), client_id) OR
    user_is_client_owner(auth.uid(), client_id)
  );

CREATE POLICY "Client owners can update invitations" ON invitations
  FOR UPDATE USING (
    user_has_direct_client_access(auth.uid(), client_id) OR
    user_is_client_owner(auth.uid(), client_id)
  );

CREATE POLICY "Client owners can delete invitations" ON invitations
  FOR DELETE USING (
    user_has_direct_client_access(auth.uid(), client_id) OR
    user_is_client_owner(auth.uid(), client_id)
  );

CREATE POLICY "Users can view invitations for their clients" ON invitations
  FOR SELECT USING (
    user_has_direct_client_access(auth.uid(), client_id) OR
    user_is_client_owner(auth.uid(), client_id) OR
    invited_by = auth.uid()
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION user_has_direct_client_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_is_client_owner(UUID, UUID) TO authenticated; 