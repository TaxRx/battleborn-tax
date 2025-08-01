-- Test data for UT state calculations
-- Run this in your Supabase SQL Editor to add UT state data

-- First, delete any existing UT entries to avoid conflicts
DELETE FROM rd_state_calculations WHERE state = 'UT';

-- Insert the first UT calculation option
INSERT INTO rd_state_calculations (
    state,
    calculation_method,
    refundable,
    carryforward,
    eligible_entities,
    calculation_formula,
    special_notes,
    start_year,
    end_year,
    is_active,
    formula_correct
) VALUES (
    'UT',
    'Choice of fixed or incremental',
    'No',
    '14 years',
    ARRAY['corporations', 'partnerships', 'llcs'],
    'Credit = 0.05 × (QREs − Base) + 0.05 × basic payments',
    'Can elect either method annually',
    2022,
    NULL,
    true,
    'Credit = 0.05 × (QREs − Base) + 0.05 × basic payments'
);

-- Insert the second UT calculation option
INSERT INTO rd_state_calculations (
    state,
    calculation_method,
    refundable,
    carryforward,
    eligible_entities,
    calculation_formula,
    special_notes,
    start_year,
    end_year,
    is_active,
    formula_correct
) VALUES (
    'UT',
    'Direct percentage of QREs',
    'No',
    '14 years',
    ARRAY['corporations', 'partnerships', 'llcs'],
    'Credit = 0.075 × QREs direct',
    'Alternative calculation method',
    2022,
    NULL,
    true,
    'Credit = 0.075 × QREs direct'
);

-- Check if the data was inserted
SELECT * FROM rd_state_calculations WHERE state = 'UT' AND is_active = true ORDER BY calculation_method; 