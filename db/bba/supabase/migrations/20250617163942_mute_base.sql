

-- Create custom types
CREATE TYPE proposal_status AS ENUM ('draft', 'submitted', 'in_review', 'expert_sent', 'finalized');


CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status proposal_status NOT NULL DEFAULT 'draft',
  notes text DEFAULT '',
  estimated_savings numeric DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;


-- Users can access proposals for their clients
CREATE POLICY "Users can access own proposals"
  ON proposals
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());


-- Admins can access all proposals
CREATE POLICY "Admins can access all proposals"
  ON proposals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- Create indexes for performance
CREATE INDEX proposals_client_id_idx ON proposals(client_id);

CREATE INDEX proposals_created_by_idx ON proposals(created_by);

CREATE INDEX proposals_status_idx ON proposals(status);

CREATE INDEX proposals_created_at_idx ON proposals(created_at);


-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();

  RETURN NEW;

END;

$$ LANGUAGE plpgsql;


-- Trigger to automatically update updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
;
