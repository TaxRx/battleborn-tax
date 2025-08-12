BEGIN;

DELETE FROM rd_employee_subcomponents s
WHERE NOT EXISTS (
  SELECT 1
  FROM rd_selected_subcomponents t
  WHERE t.business_year_id = s.business_year_id
    AND t.subcomponent_id   = s.subcomponent_id
);

COMMIT;
