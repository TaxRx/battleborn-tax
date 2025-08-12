BEGIN;

-- Normalize employee allocations to match Allocation Modal logic across the database.
-- Uses per-employee saved sliders in rd_employee_subcomponents to preserve Actualization.
-- For each employee/year:
--  1) Recompute per-subcomponent applied% using employee-level Practice×Year×Frequency×Time with step-level Non‑R&D reduction
--  2) Cap summed applied% at 100% proportionally and write back to rd_employee_subcomponents
--  3) Update rd_employee_year_data.applied_percent and calculated_qre (using 80% threshold for dollars)

WITH sub_to_step AS (
  SELECT sc.business_year_id, sc.subcomponent_id, sc.step_id
  FROM rd_selected_subcomponents sc
),
step_nonrd AS (
  SELECT st.business_year_id, st.step_id, COALESCE(st.non_rd_percentage,0) AS non_rd
  FROM rd_selected_steps st
),
base AS (
  SELECT es.id AS es_id,
         es.employee_id,
         es.business_year_id,
         es.subcomponent_id,
         sts.step_id,
         COALESCE(es.practice_percentage,0)  AS practice_percent,
         COALESCE(es.year_percentage,100)    AS year_percent,
         COALESCE(es.frequency_percentage,100) AS freq_percent,
         COALESCE(es.time_percentage,0)      AS time_percent,
         /* Modal formula baseline from employee-level values */
         ((COALESCE(es.practice_percentage,0)/100.0) *
          (COALESCE(es.year_percentage,100)/100.0) *
          (COALESCE(es.frequency_percentage,100)/100.0) *
          (COALESCE(es.time_percentage,0)/100.0) * 100.0) AS baseline_applied,
         /* Do NOT re-apply Non‑R&D here; RD step time already reflects non‑R&D adjustments */
         ((COALESCE(es.practice_percentage,0)/100.0) *
          (COALESCE(es.year_percentage,100)/100.0) *
          (COALESCE(es.frequency_percentage,100)/100.0) *
          (COALESCE(es.time_percentage,0)/100.0) * 100.0) AS applied_after_nonrd
  FROM rd_employee_subcomponents es
  LEFT JOIN sub_to_step sts
    ON sts.business_year_id = es.business_year_id
   AND sts.subcomponent_id   = es.subcomponent_id
  -- Intentionally not joining step_nonrd to avoid double-counting non‑R&D
  WHERE es.is_included = true
),
totals AS (
  SELECT business_year_id, employee_id,
         SUM(applied_after_nonrd) AS raw_total
  FROM base
  GROUP BY business_year_id, employee_id
),
norm AS (
  SELECT b.es_id,
         b.employee_id,
         b.business_year_id,
         b.subcomponent_id,
         b.applied_after_nonrd,
         t.raw_total,
         CASE WHEN t.raw_total > 100 THEN 100.0 / NULLIF(t.raw_total,0) ELSE 1.0 END AS scale
  FROM base b
  JOIN totals t
    ON t.employee_id = b.employee_id
   AND t.business_year_id = b.business_year_id
),
updates AS (
  UPDATE rd_employee_subcomponents es
     SET applied_percentage = ROUND(n.applied_after_nonrd * n.scale, 6)
  FROM norm n
  WHERE es.id = n.es_id
  RETURNING n.business_year_id, n.employee_id
),
final_totals AS (
  SELECT es.business_year_id, es.employee_id,
         SUM(es.applied_percentage) AS applied_percent_capped
  FROM rd_employee_subcomponents es
  WHERE es.is_included = true
  GROUP BY es.business_year_id, es.employee_id
)
UPDATE rd_employee_year_data y
   SET applied_percent = COALESCE(f.applied_percent_capped,0),
       calculated_qre  = ROUND(
         (COALESCE(e.annual_wage,0) *
          CASE WHEN COALESCE(f.applied_percent_capped,0) >= 80 THEN 100 ELSE COALESCE(f.applied_percent_capped,0) END) / 100.0
       )
FROM final_totals f
JOIN rd_employees e ON e.id = f.employee_id
WHERE y.employee_id      = f.employee_id
  AND y.business_year_id = f.business_year_id;

COMMIT;


