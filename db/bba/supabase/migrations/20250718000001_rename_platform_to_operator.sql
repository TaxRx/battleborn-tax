-- Migration: Add 'operator' to account_type enum
-- Date: 2025-07-18
-- Purpose: Step 1 - Add 'operator' value to enum (must be in separate transaction from usage)

-- Step 1: Add 'operator' to the account_type enum
-- ALTER TYPE account_type ADD VALUE 'operator';