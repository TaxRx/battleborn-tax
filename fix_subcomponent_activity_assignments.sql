-- Fix incorrect research_activity_id assignments in rd_selected_subcomponents
-- This updates subcomponents to have the correct activity based on their step

UPDATE rd_selected_subcomponents 
SET research_activity_id = rd_research_steps.research_activity_id
FROM rd_research_steps
WHERE rd_selected_subcomponents.step_id = rd_research_steps.id
  AND rd_selected_subcomponents.research_activity_id != rd_research_steps.research_activity_id;

-- Verify the fix by showing the updated records
SELECT 
  rss.subcomponent_id,
  rss.research_activity_id as fixed_activity_id,
  rra.title as activity_name,
  rrs.name as step_name
FROM rd_selected_subcomponents rss
JOIN rd_research_steps rrs ON rss.step_id = rrs.id
JOIN rd_research_activities rra ON rss.research_activity_id = rra.id
ORDER BY rra.title, rrs.name; 