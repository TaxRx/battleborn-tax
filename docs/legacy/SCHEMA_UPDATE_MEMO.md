# Schema Update Memo - admin_client_files Table

## Date: January 19, 2025

## Changes Made to admin_client_files Table

The following columns were added to the `admin_client_files` table to support comprehensive tax planning data:

### Personal Information
- `phone` (text) - Client phone number
- `filing_status` (text) - Tax filing status (single, married, etc.)
- `home_address` (text) - Client's home address
- `state` (text) - Client's state of residence
- `dependents` (numeric) - Number of dependents (KEY DATA POINT for tax calculator)

### Income Information
- `wages_income` (numeric) - W-2 wages income
- `passive_income` (numeric) - Passive income
- `unearned_income` (numeric) - Unearned income
- `capital_gains` (numeric) - Capital gains income
- `standard_deduction` (boolean) - Whether using standard deduction
- `custom_deduction` (numeric) - Custom deduction amount

### Business Information
- `business_owner` (boolean) - Whether client owns a business
- `business_name` (text) - Business name
- `entity_type` (text) - Business entity type (LLC, S-Corp, etc.)
- `business_address` (text) - Business address

## Important Notes

1. **Dependents Field**: This is a critical data point for the tax calculator and must be included in all client creation flows.

2. **Data Storage Strategy**: 
   - The `admin_client_files` table stores the primary client data
   - The `centralized_businesses` table is an aggregator/normalized table for business information
   - Business data is stored in both tables for redundancy and different query patterns

3. **Function Updates**: The `create_client_with_business` function has been updated to handle all these new fields.

4. **Frontend Integration**: The frontend service (`centralizedClientService.ts`) needs to be updated to include the dependents field in all client creation calls.

## Migration Files Created
- `20250119000011_create_client_with_business_function.sql` - Ensures the function exists with correct signature

## Next Steps
1. Apply the new migration to create the function
2. Update frontend to include dependents field
3. Test client creation with all new fields
4. Verify data flows correctly to tax calculator 