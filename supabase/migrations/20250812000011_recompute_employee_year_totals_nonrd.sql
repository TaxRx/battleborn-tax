BEGIN;

/* 1) Cleanup: drop employee allocations not active in the year’s research design */
DELETE FROM rd_employee_subcomponents s
WHERE NOT EXISTS (
  SELECT 1
  FROM rd_selected_subcomponents t
  WHERE t.business_year_id = s.business_year_id
    AND t.subcomponent_id   = s.subcomponent_id
);

/* 2) Recompute per-employee applied% using Non‑R&D reduction and 80% rule, then update/insert year rows */
WITH sub_map AS (
  SELECT sc.business_year_id, sc.subcomponent_id, sc.step_id
  FROM rd_selected_subcomponents sc
),
step_nonrd AS (
  SELECT st.business_year_id, st.step_id, COALESCE(st.non_rd_percentage,0) AS non_rd
  FROM rd_selected_steps st
),
totals AS (
  /* Non‑R&D aware applied% per employee, per year */
  SELECT s.business_year_id,
         s.employee_id,
         CASE
           WHEN SUM( s.applied_percentage * (100.0 - COALESCE(sn.non_rd,0)) / 100.0 ) >= 80
             THEN 100.0
           ELSE SUM( s.applied_percentage * (100.0 - COALESCE(sn.non_rd,0)) / 100.0 )
         END AS applied_percent
  FROM rd_employee_subcomponents s
  JOIN sub_map sm
    ON sm.business_year_id = s.business_year_id
   AND sm.subcomponent_id   = s.subcomponent_id
  LEFT JOIN step_nonrd sn
    ON sn.business_year_id = sm.business_year_id
   AND sn.step_id          = sm.step_id
  WHERE s.is_included = true
  GROUP BY s.business_year_id, s.employee_id
)

/* UPDATE existing year rows */
UPDATE rd_employee_year_data y
SET applied_percent = COALESCE(t.applied_percent, 0),
    calculated_qre  = ROUND((COALESCE(e.annual_wage,0) * COALESCE(t.applied_percent,0)) / 100.0),
    activity_roles  = COALESCE(y.activity_roles, '[]'::jsonb)
FROM totals t
JOIN rd_employees e ON e.id = t.employee_id
WHERE y.business_year_id = t.business_year_id
  AND y.employee_id      = t.employee_id;

/* INSERT missing year rows */
WITH sub_map AS (
  SELECT sc.business_year_id, sc.subcomponent_id, sc.step_id
  FROM rd_selected_subcomponents sc
),
step_nonrd AS (
  SELECT st.business_year_id, st.step_id, COALESCE(st.non_rd_percentage,0) AS non_rd
  FROM rd_selected_steps st
),
totals AS (
  SELECT s.business_year_id,
         s.employee_id,
         CASE
           WHEN SUM( s.applied_percentage * (100.0 - COALESCE(sn.non_rd,0)) / 100.0 ) >= 80
             THEN 100.0
           ELSE SUM( s.applied_percentage * (100.0 - COALESCE(sn.non_rd,0)) / 100.0 )
         END AS applied_percent
  FROM rd_employee_subcomponents s
  JOIN sub_map sm
    ON sm.business_year_id = s.business_year_id
   AND sm.subcomponent_id   = s.subcomponent_id
  LEFT JOIN step_nonrd sn
    ON sn.business_year_id = sm.business_year_id
   AND sn.step_id          = sm.step_id
  WHERE s.is_included = true
  GROUP BY s.business_year_id, s.employee_id
)
INSERT INTO rd_employee_year_data (employee_id, business_year_id, applied_percent, calculated_qre, activity_roles)
SELECT t.employee_id,
       t.business_year_id,
       t.applied_percent,
       ROUND((COALESCE(e.annual_wage,0) * t.applied_percent) / 100.0),
       '[]'::jsonb
FROM totals t
JOIN rd_employees e
  ON e.id = t.employee_id
LEFT JOIN rd_employee_year_data y
  ON y.employee_id      = t.employee_id
 AND y.business_year_id = t.business_year_id
WHERE y.employee_id IS NULL;

COMMIT;
