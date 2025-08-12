BEGIN;

-- Normalize employee allocations to match Allocation Modal logic across the database.
-- For each employee/year:
--  1) Recompute per-subcomponent applied% using Practice×Year×Frequency×Time with step-level Non‑R&D reduction
--  2) Cap summed applied% at 100% proportionally and write back to rd_employee_subcomponents
--  3) Update rd_employee_year_data.applied_percent and calculated_qre (using 80% threshold for dollars)

WITH sub_map AS (
  SELECT sc.business_year_id, sc.subcomponent_id, sc.step_id,
         COALESCE(sc.practice_percent,0)  AS practice_percent,
         COALESCE(sc.year_percentage,100) AS year_percent,
         COALESCE(sc.frequency_percentage,100) AS freq_percent,
         COALESCE(sc.time_percentage,0)   AS time_percent
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
         sm.step_id,
         sm.practice_percent,
         sm.year_percent,
         sm.freq_percent,
         sm.time_percent,
         sn.non_rd,
         /* Modal formula baseline */
         ((sm.practice_percent/100.0) * (sm.year_percent/100.0) * (sm.freq_percent/100.0) * (sm.time_percent/100.0) * 100.0) AS baseline_applied,
         /* Apply Non‑R&D reduction */
         CASE WHEN COALESCE(sn.non_rd,0) > 0
              THEN ((sm.practice_percent/100.0) * (sm.year_percent/100.0) * (sm.freq_percent/100.0) * (sm.time_percent/100.0) * 100.0) * ((100.0 - sn.non_rd)/100.0)
              ELSE ((sm.practice_percent/100.0) * (sm.year_percent/100.0) * (sm.freq_percent/100.0) * (sm.time_percent/100.0) * 100.0)
          END AS applied_after_nonrd
  FROM rd_employee_subcomponents es
  JOIN sub_map sm
    ON sm.business_year_id = es.business_year_id
   AND sm.subcomponent_id   = es.subcomponent_id
  LEFT JOIN step_nonrd sn
    ON sn.business_year_id = sm.business_year_id
   AND sn.step_id          = sm.step_id
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


