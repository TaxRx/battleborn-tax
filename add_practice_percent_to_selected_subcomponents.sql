-- Add practice_percent column to rd_selected_subcomponents
ALTER TABLE rd_selected_subcomponents 
ADD COLUMN practice_percent numeric(5,2) DEFAULT 0;

-- Update existing records with practice_percent from rd_selected_activities
UPDATE rd_selected_subcomponents 
SET practice_percent = (
  SELECT rsa.practice_percent 
  FROM rd_selected_activities rsa
  JOIN rd_research_subcomponents rsc ON rsc.step_id = rsa.activity_id
  WHERE rsc.id = rd_selected_subcomponents.subcomponent_id
  AND rsa.business_year_id = rd_selected_subcomponents.business_year_id
  LIMIT 1
)
WHERE practice_percent = 0;

-- Create a trigger to automatically update practice_percent when rd_selected_subcomponents is created
CREATE OR REPLACE FUNCTION update_selected_subcomponent_practice_percent()
RETURNS TRIGGER AS $$
BEGIN
  -- Set practice_percent from rd_selected_activities when a new subcomponent is selected
  UPDATE rd_selected_subcomponents 
  SET practice_percent = (
    SELECT rsa.practice_percent 
    FROM rd_selected_activities rsa
    JOIN rd_research_subcomponents rsc ON rsc.step_id = rsa.activity_id
    WHERE rsc.id = NEW.subcomponent_id
    AND rsa.business_year_id = NEW.business_year_id
    LIMIT 1
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update practice_percent on insert
CREATE TRIGGER trigger_update_practice_percent
  AFTER INSERT ON rd_selected_subcomponents
  FOR EACH ROW
  EXECUTE FUNCTION update_selected_subcomponent_practice_percent(); 