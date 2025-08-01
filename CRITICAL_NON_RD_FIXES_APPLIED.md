# ✅ CRITICAL NON-R&D FIXES APPLIED

## 🚨 **MANUAL DATABASE MIGRATION REQUIRED**

You must run this SQL on your database **FIRST** before the fixes will work:

```sql
-- Add non_rd_percentage column to rd_selected_steps table
ALTER TABLE rd_selected_steps 
ADD COLUMN IF NOT EXISTS non_rd_percentage numeric(5,2) DEFAULT 0;

-- Add comment to document the new column
COMMENT ON COLUMN rd_selected_steps.non_rd_percentage IS 'Percentage of step time allocated to non-R&D activities (0-100)';

-- Update existing records to have 0% non-R&D time by default
UPDATE rd_selected_steps 
SET non_rd_percentage = 0 
WHERE non_rd_percentage IS NULL;

-- Add constraint to ensure percentage is between 0 and 100
ALTER TABLE rd_selected_steps 
ADD CONSTRAINT rd_selected_steps_non_rd_percentage_check 
CHECK (non_rd_percentage >= 0 AND non_rd_percentage <= 100);
```

## 🔧 **FRONTEND FIXES APPLIED**

### **1. Fixed Non-R&D Loading Logic**
- **File**: `src/modules/tax-calculator/components/RDTaxWizard/steps/ResearchDesignStep.tsx`
- **Function**: `loadStepsFromSavedData()`
- **Fix**: Now correctly loads `non_rd_percentage` from database and displays in UI
- **Before**: Always defaulted to 0%
- **After**: Loads saved values from `rd_selected_steps.non_rd_percentage`

### **2. Fixed Non-R&D Saving Logic**
- **File**: `src/modules/tax-calculator/components/RDTaxWizard/steps/ResearchDesignStep.tsx`
- **Function**: `handleStepNonRdChange()`
- **Fix**: Uses correct `selectedActivityYearId` instead of `businessYearId`
- **Fix**: Updates local `selectedSteps` state to reflect changes
- **Before**: Failed to save due to wrong business year ID
- **After**: Correctly saves to `rd_selected_steps` table

### **3. Enhanced Overwrite Warning Detection**
- **File**: `src/modules/tax-calculator/components/RDTaxWizard/steps/ResearchExplorerStep.tsx`
- **Function**: `copyAllDataFromYear()`
- **Fix**: Added comprehensive logging to debug overwrite detection
- **Fix**: Clearer warning messages with better formatting
- **Before**: Might not show warning consistently
- **After**: Better detection and logging of existing data

### **4. Fixed Non-R&D Paste Logic (Backwards Pasting)**
- **File**: `src/modules/tax-calculator/components/RDTaxWizard/steps/ResearchExplorerStep.tsx`
- **Function**: `copyAllDataFromYear()` - step copying section
- **Fix**: Random 5-15% increase now applies even when source is 0%
- **Before**: Only applied increase when source > 0%
- **After**: Always applies random increase when pasting backwards

## 🧪 **TESTING INSTRUCTIONS**

### **Step 1: Apply Database Migration**
Run the SQL above in your database (Supabase SQL Editor or pgAdmin)

### **Step 2: Test Non-R&D Time Functionality**
1. Go to Research Design step
2. Click a step's Non-R&D chip 
3. Adjust the percentage slider
4. Save and navigate away, then back
5. **Expected**: Percentage should be preserved

### **Step 3: Test Overwrite Warning**
1. Set up research data in Year A
2. Try to paste into Year A from Year B
3. **Expected**: Warning dialog should appear

### **Step 4: Test Backwards Pasting Non-R&D Increase**
1. Set up 2024 with some non-R&D percentages
2. Paste from 2024 into 2023
3. **Expected**: 2023 should have 5-15% higher non-R&D percentages

## 🚨 **TROUBLESHOOTING**

### **If Non-R&D Still Shows 0%:**
1. Check database migration was applied: `\d rd_selected_steps` (should show `non_rd_percentage` column)
2. Check console logs for "[NON-R&D UPDATE]" messages
3. Verify data exists: `SELECT step_id, non_rd_percentage FROM rd_selected_steps LIMIT 10;`

### **If Overwrite Warning Doesn't Appear:**
1. Check console logs for "[OVERWRITE CHECK]" messages
2. Verify target year has existing data: `SELECT COUNT(*) FROM rd_selected_activities WHERE business_year_id = 'your-year-id';`

### **If Paste Functionality Fails:**
1. Check console logs for copy process messages
2. Verify business years exist in database
3. Check for any SQL constraint violations

## 🎯 **VERIFICATION QUERIES**

```sql
-- Check if migration was applied
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'rd_selected_steps' AND column_name = 'non_rd_percentage';

-- Check current non-R&D data
SELECT step_id, time_percentage, non_rd_percentage 
FROM rd_selected_steps 
WHERE non_rd_percentage > 0;

-- Check which years have research data
SELECT business_year_id, COUNT(*) as activity_count 
FROM rd_selected_activities 
GROUP BY business_year_id;
```

## ✅ **EXPECTED BEHAVIOR AFTER FIXES**

1. **Non-R&D percentages preserve** when navigating between pages
2. **Overwrite warnings appear** when pasting into years with existing data
3. **Backwards pasting increases** non-R&D time by 5-15% randomly
4. **UI consistently shows** non-R&D percentages from database
5. **All step modifications save** to correct database tables 