-- Fix step_name population in rd_selected_subcomponents
-- Update step_name from rd_research_steps where it's missing

UPDATE rd_selected_subcomponents 
SET step_name = (
  SELECT rs.name 
  FROM rd_research_steps rs
  JOIN rd_research_subcomponents rsc ON rsc.step_id = rs.id
  WHERE rsc.id = rd_selected_subcomponents.subcomponent_id
  LIMIT 1
)
WHERE step_name IS NULL OR step_name = '';

-- Create a trigger to automatically populate step_name when rd_selected_subcomponents is created
CREATE OR REPLACE FUNCTION update_selected_subcomponent_step_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Set step_name from rd_research_steps when a new subcomponent is selected
  UPDATE rd_selected_subcomponents 
  SET step_name = (
    SELECT rs.name 
    FROM rd_research_steps rs
    JOIN rd_research_subcomponents rsc ON rsc.step_id = rs.id
    WHERE rsc.id = NEW.subcomponent_id
    LIMIT 1
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update step_name on insert
CREATE TRIGGER trigger_update_step_name
  AFTER INSERT ON rd_selected_subcomponents
  FOR EACH ROW
  EXECUTE FUNCTION update_selected_subcomponent_step_name(); 