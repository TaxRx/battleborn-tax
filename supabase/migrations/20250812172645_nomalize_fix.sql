BEGIN;

/* 0) Remove subcomponents not present in the year’s research design */
DELETE FROM rd_employee_subcomponents s
WHERE NOT EXISTS (
  SELECT 1
  FROM rd_selected_subcomponents t
  WHERE t.business_year_id = s.business_year_id
    AND t.subcomponent_id   = s.subcomponent_id
);

/* 0b) Deduplicate: keep the most recent row per (employee, year, subcomponent) */
WITH d AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY employee_id, business_year_id, subcomponent_id
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM rd_employee_subcomponents
)
DELETE FROM rd_employee_subcomponents s
USING d
WHERE s.id = d.id
  AND d.rn > 1;

/* 1) Recompute applied% from per-employee sliders (NO extra non‑R&D) and cap totals at 100% */
WITH base AS (
  SELECT s.id,
         s.employee_id,
         s.business_year_id,
         /* modal formula: Practice × Year × Frequency × Time */
         ((COALESCE(s.practice_percentage,0)/100.0) *
          (COALESCE(s.year_percentage,100)/100.0) *
          (COALESCE(s.frequency_percentage,100)/100.0) *
          (COALESCE(s.time_percentage,0)/100.0) * 100.0) AS calc_applied
  FROM rd_employee_subcomponents s
  WHERE s.is_included = true
),
totals AS (
  SELECT business_year_id, employee_id, SUM(calc_applied) AS raw_total
  FROM base
  GROUP BY business_year_id, employee_id
),
norm AS (
  SELECT b.id,
         b.employee_id,
         b.business_year_id,
         b.calc_applied,
         CASE WHEN t.raw_total > 100 THEN 100.0/NULLIF(t.raw_total,0) ELSE 1.0 END AS scale
  FROM base b
  JOIN totals t
    ON t.employee_id = b.employee_id
   AND t.business_year_id = b.business_year_id
)
UPDATE rd_employee_subcomponents s
SET applied_percentage = ROUND(n.calc_applied * n.scale, 6)
FROM norm n
WHERE s.id = n.id;

/* 2) Update existing year rows */
WITH sums AS (
  SELECT business_year_id, employee_id, SUM(applied_percentage) AS applied_percent
  FROM rd_employee_subcomponents
  WHERE is_included = true
  GROUP BY business_year_id, employee_id
)
UPDATE rd_employee_year_data y
SET applied_percent = s.applied_percent,
    calculated_qre  = ROUND(
      (COALESCE(e.annual_wage,0) *
       CASE WHEN s.applied_percent >= 80 THEN 100 ELSE s.applied_percent END) / 100.0
    )
FROM sums s
JOIN rd_employees e ON e.id = s.employee_id
WHERE y.business_year_id = s.business_year_id
  AND y.employee_id      = s.employee_id;

/* 2b) Insert missing year rows */
WITH sums AS (
  SELECT business_year_id, employee_id, SUM(applied_percentage) AS applied_percent
  FROM rd_employee_subcomponents
  WHERE is_included = true
  GROUP BY business_year_id, employee_id
)
INSERT INTO rd_employee_year_data (employee_id, business_year_id, applied_percent, calculated_qre, activity_roles, updated_at)
SELECT s.employee_id,
       s.business_year_id,
       s.applied_percent,
       ROUND((COALESCE(e.annual_wage,0) *
              CASE WHEN s.applied_percent >= 80 THEN 100 ELSE s.applied_percent END) / 100.0),
       '[]'::jsonb,
       NOW()
FROM sums s
JOIN rd_employees e
  ON e.id = s.employee_id
LEFT JOIN rd_employee_year_data y
  ON y.employee_id      = s.employee_id
 AND y.business_year_id = s.business_year_id
WHERE y.employee_id IS NULL;

COMMIT;