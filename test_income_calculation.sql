-- Test script to verify income calculation
-- Run this in your Supabase SQL Editor

-- First, let's check if we have any clients with personal tax years
SELECT 
  c.id,
  c.full_name,
  c.email,
  pty.tax_year,
  pty.wages_income,
  pty.passive_income,
  pty.unearned_income,
  pty.capital_gains,
  pty.total_income,
  COALESCE(pty.total_income, 
    (pty.wages_income + pty.passive_income + pty.unearned_income + pty.capital_gains)
  ) as calculated_total_income
FROM clients c
LEFT JOIN personal_tax_years pty ON c.id = pty.client_id
ORDER BY c.created_at DESC
LIMIT 10;

-- Test the get_unified_client_list function
SELECT * FROM get_unified_client_list() LIMIT 5; 