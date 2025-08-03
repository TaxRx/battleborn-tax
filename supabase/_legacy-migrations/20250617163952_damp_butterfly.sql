

-- Create custom types
CREATE TYPE strategy_type AS ENUM ('deduction', 'credit', 'shift');


CREATE TABLE IF NOT EXISTS strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  type strategy_type NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  est_savings numeric DEFAULT 0,
  est_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);


ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;


-- Users can access strategies for their proposals
CREATE POLICY "Users can access own strategies"
  ON strategies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE id = proposal_id AND created_by = auth.uid()
    )
  );


-- Admins can access all strategies
CREATE POLICY "Admins can access all strategies"
  ON strategies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- Create indexes for performance
CREATE INDEX strategies_proposal_id_idx ON strategies(proposal_id);

CREATE INDEX strategies_type_idx ON strategies(type);

CREATE INDEX strategies_created_at_idx ON strategies(created_at);
;
