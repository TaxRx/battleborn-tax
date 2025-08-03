-- Create invitations table for user invitation system
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES profiles(id),
    email VARCHAR(255) NOT NULL,
    role client_role NOT NULL DEFAULT 'member',
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '48 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES profiles(id),
    message TEXT,
    resent_count INTEGER DEFAULT 0,
    last_resent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_invitations_client_id ON invitations(client_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX idx_invitations_invited_by ON invitations(invited_by);

-- Create unique constraint to prevent duplicate pending invitations
CREATE UNIQUE INDEX idx_invitations_unique_pending 
ON invitations(client_id, email) 
WHERE status = 'pending';

-- Create function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS VARCHAR(255) AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically set token on insert
CREATE OR REPLACE FUNCTION set_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.token IS NULL OR NEW.token = '' THEN
        NEW.token := generate_invitation_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set token
CREATE TRIGGER trigger_set_invitation_token
    BEFORE INSERT ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION set_invitation_token();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER trigger_invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_invitations_updated_at();

-- Create function to expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE invitations 
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending' AND expires_at < now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations for their clients
CREATE POLICY "Users can view invitations for their clients"
ON invitations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM client_users cu
        WHERE cu.client_id = invitations.client_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('owner', 'member')
        AND cu.is_active = true
    )
    OR invited_by = auth.uid()
);

-- Policy: Client owners can create invitations
CREATE POLICY "Client owners can create invitations"
ON invitations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM client_users cu
        WHERE cu.client_id = invitations.client_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'owner'
        AND cu.is_active = true
    )
);

-- Policy: Client owners can update invitations
CREATE POLICY "Client owners can update invitations"
ON invitations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM client_users cu
        WHERE cu.client_id = invitations.client_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'owner'
        AND cu.is_active = true
    )
);

-- Policy: Client owners can delete invitations
CREATE POLICY "Client owners can delete invitations"
ON invitations FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM client_users cu
        WHERE cu.client_id = invitations.client_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'owner'
        AND cu.is_active = true
    )
);

-- Policy: Anyone can view invitations by token (for acceptance)
CREATE POLICY "Anyone can view invitations by token"
ON invitations FOR SELECT
USING (token IS NOT NULL);

-- Create function to accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(
    invitation_token VARCHAR(255),
    user_id UUID
)
RETURNS JSON AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
    client_record clients%ROWTYPE;
    result JSON;
BEGIN
    -- Get the invitation
    SELECT * INTO invitation_record
    FROM invitations
    WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired invitation'
        );
    END IF;
    
    -- Get the client
    SELECT * INTO client_record
    FROM clients
    WHERE id = invitation_record.client_id;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM client_users
        WHERE client_id = invitation_record.client_id
        AND user_id = user_id
        AND is_active = true
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User is already a member of this client'
        );
    END IF;
    
    -- Create client_users relationship
    INSERT INTO client_users (client_id, user_id, role, invited_by, accepted_at)
    VALUES (
        invitation_record.client_id,
        user_id,
        invitation_record.role,
        invitation_record.invited_by,
        now()
    );
    
    -- Update invitation status
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = now(),
        accepted_by = user_id,
        updated_at = now()
    WHERE id = invitation_record.id;
    
    RETURN json_build_object(
        'success', true,
        'client_id', invitation_record.client_id,
        'client_name', client_record.full_name,
        'role', invitation_record.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION accept_invitation(VARCHAR(255), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invitation_token() TO authenticated;
