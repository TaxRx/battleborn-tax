-- Add sample personal years data for testing
-- Replace '8b81a809-c4af-448c-97ad-62ba92159e70' with the actual client ID from the logs

INSERT INTO personal_years (
    client_id,
    year,
    wages_income,
    passive_income,
    unearned_income,
    capital_gains,
    long_term_capital_gains,
    household_income,
    ordinary_income,
    is_active
) VALUES (
    '8b81a809-c4af-448c-97ad-62ba92159e70',
    2024,
    75000.00,
    25000.00,
    5000.00,
    10000.00,
    5000.00,
    115000.00,
    105000.00,
    true
), (
    '8b81a809-c4af-448c-97ad-62ba92159e70',
    2023,
    70000.00,
    20000.00,
    3000.00,
    8000.00,
    4000.00,
    101000.00,
    93000.00,
    true
);

-- Add sample business years data for testing
-- Replace 'b935b96c-0770-4cdf-b91d-419db1f161c6' with the actual business ID from the logs

INSERT INTO business_years (
    business_id,
    year,
    is_active,
    ordinary_k1_income,
    guaranteed_k1_income,
    annual_revenue,
    employee_count
) VALUES (
    'b935b96c-0770-4cdf-b91d-419db1f161c6',
    2024,
    true,
    20000.00,
    5000.00,
    150000.00,
    3
), (
    'b935b96c-0770-4cdf-b91d-419db1f161c6',
    2023,
    true,
    15000.00,
    3000.00,
    120000.00,
    2
); 