# ✅ CSV IMPORT ROLE ASSIGNMENT FIXES APPLIED

## 🚨 **ISSUES IDENTIFIED AND RESOLVED**

### **1. Role Assignment Lost on Import** ❌➡️✅
**Problem**: When importing employees via CSV with roles assigned, the roles were being lost after reload.

**Root Cause**: CSV import was assigning the role_id to the employee record but NOT creating the necessary subcomponent relationships that link the employee to the role's activities.

**Fix Applied**: 
- Modified CSV import to properly fetch role baseline percentages
- Added automatic subcomponent relationship creation when roles are assigned during import
- Ensured proper QRE calculations based on role baseline percentages

### **2. Low Applied Percentage After Manual Role Assignment** ❌➡️✅
**Problem**: When manually re-adding roles after import, employees showed much lower applied percentages than expected.

**Root Cause**: Role assignment was not properly updating the calculated_qre in rd_employee_year_data table.

**Fix Applied**:
- Enhanced `updateEmployeeRole` function to calculate and update QRE when roles are assigned
- Added proper wage-based QRE calculation: `(Annual Wage × Baseline Percentage) / 100`
- Added comprehensive debugging logs to track percentage calculations

### **3. Missing Subcomponent Creation During Import** ❌➡️✅
**Problem**: CSV import with roles wasn't creating the employee-subcomponent relationships needed for proper calculations.

**Root Cause**: Import code had comment "Note: Skipping subcomponent relationships - these will be created when roles are assigned later" but this wasn't happening automatically.

**Fix Applied**:
- Added automatic subcomponent relationship creation during CSV import when roles are assigned
- Fetches all selected subcomponents for the role and business year
- Creates rd_employee_subcomponents entries with proper baseline values
- Preserves time_percentage, applied_percentage, and practice_percentage from research design

### **4. Calculation Inconsistency with Baseline** ❌➡️✅
**Problem**: Calculations were higher than baseline after opening allocation modal.

**Root Cause**: Subcomponent relationships weren't preserving baseline values correctly.

**Fix Applied**:
- Ensured baseline_applied_percent, baseline_practice_percentage, and baseline_time_percentage are properly stored
- Added detailed logging to track value preservation during subcomponent creation
- Fixed QRE calculation consistency between import and manual assignment

## 🔧 **TECHNICAL CHANGES MADE**

### **CSV Import Enhancement** (Lines ~2815-2895):

**Before ❌:**
```javascript
// Create minimal employee year data (no role-based calculations)
const { error: yearDataError } = await supabase
  .from('rd_employee_year_data')
  .insert({
    employee_id: newEmployee.id,
    business_year_id: targetBusinessYearId,
    applied_percent: 0, // Will be set later when roles are assigned
    calculated_qre: 0,  // Will be calculated later when roles are assigned
    activity_roles: assignedRoleId ? [assignedRoleId] : []
  });

// Note: Skipping subcomponent relationships - these will be created when roles are assigned later
```

**After ✅:**
```javascript
// Create employee year data with proper role-based calculations
let baselinePercent = 0;
let calculatedQRE = 0;

if (assignedRoleId) {
  // Get the role's baseline percentage for proper QRE calculation
  const { data: roleData, error: roleError } = await supabase
    .from('rd_roles')
    .select('baseline_applied_percent')
    .eq('id', assignedRoleId)
    .single();
  
  if (roleData && !roleError) {
    baselinePercent = roleData.baseline_applied_percent || 0;
    calculatedQRE = Math.round((annualWage * baselinePercent) / 100);
  }
}

const { error: yearDataError } = await supabase
  .from('rd_employee_year_data')
  .insert({
    employee_id: newEmployee.id,
    business_year_id: targetBusinessYearId,
    applied_percent: baselinePercent,
    calculated_qre: calculatedQRE,
    activity_roles: assignedRoleId ? [assignedRoleId] : []
  });

// Create subcomponent relationships if role was assigned during import
if (assignedRoleId) {
  // Fetch all selected subcomponents for this business year and role
  const { data: selectedSubcomponents } = await supabase
    .from('rd_selected_subcomponents')
    .select('*')
    .eq('business_year_id', targetBusinessYearId)
    .filter('selected_roles', 'cs', `[\"${String(assignedRoleId)}\"]`);

  if (selectedSubcomponents && selectedSubcomponents.length > 0) {
    // Create employee subcomponent relationships with baseline values
    const employeeSubcomponentData = selectedSubcomponents.map((subcomponent) => ({
      employee_id: newEmployee.id,
      subcomponent_id: subcomponent.subcomponent_id,
      business_year_id: targetBusinessYearId,
      time_percentage: subcomponent.time_percentage || 0,
      applied_percentage: subcomponent.applied_percentage || 0,
      is_included: true,
      baseline_applied_percent: subcomponent.applied_percentage || 0,
      practice_percentage: subcomponent.practice_percent || 0,
      year_percentage: subcomponent.year_percentage || 0,
      frequency_percentage: subcomponent.frequency_percentage || 0,
      baseline_practice_percentage: subcomponent.practice_percent || 0,
      baseline_time_percentage: subcomponent.time_percentage || 0,
      user_id: userId
    }));

    await supabase
      .from('rd_employee_subcomponents')
      .insert(employeeSubcomponentData);
  }
}
```

### **Manual Role Assignment Enhancement** (Lines ~2390-2410):

**Before ❌:**
```javascript
await supabase
  .from('rd_employee_year_data')
  .update({ 
    activity_roles: [newRoleId],
    applied_percent: baselinePercent
  })
  .eq('employee_id', employeeId)
  .eq('business_year_id', businessYearId);
```

**After ✅:**
```javascript
// Get employee's wage for QRE calculation
const { data: employeeData } = await supabase
  .from('rd_employees')
  .select('annual_wage')
  .eq('id', employeeId)
  .single();

const annualWage = employeeData?.annual_wage || 0;
const calculatedQRE = Math.round((annualWage * baselinePercent) / 100);

console.log(`📊 Updating employee year data: baselinePercent=${baselinePercent}%, QRE=${calculatedQRE}`);

await supabase
  .from('rd_employee_year_data')
  .update({ 
    activity_roles: [newRoleId],
    applied_percent: baselinePercent,
    calculated_qre: calculatedQRE
  })
  .eq('employee_id', employeeId)
  .eq('business_year_id', businessYearId);
```

### **Enhanced Debugging** (Throughout):

Added comprehensive logging for:
- Role baseline percentage retrieval
- QRE calculation steps
- Subcomponent relationship creation
- Applied percentage tracking
- Baseline value preservation

## 🎯 **EXPECTED BEHAVIOR AFTER FIXES**

### **CSV Import with Roles**:
1. ✅ Employee created with proper role_id
2. ✅ Employee year data created with baseline applied_percent and calculated_qre
3. ✅ Subcomponent relationships automatically created for the assigned role
4. ✅ Baseline percentages preserved from research design configuration
5. ✅ Role assignment persists after page reload

### **Manual Role Assignment**:
1. ✅ Role properly assigned to employee record
2. ✅ Activity roles updated in year data
3. ✅ Applied percentage set to role's baseline percentage
4. ✅ QRE recalculated based on wage and baseline percentage
5. ✅ Old subcomponent relationships removed
6. ✅ New subcomponent relationships created with baseline values
7. ✅ Calculations consistent with research design configuration

### **Calculation Consistency**:
1. ✅ Applied percentages match role baseline percentages
2. ✅ QRE calculations are consistent between import and manual assignment
3. ✅ Baseline values are preserved and not modified by allocation modal
4. ✅ Opening allocation modal shows correct baseline values, not higher calculations

## 🧪 **TESTING CHECKLIST**

### **CSV Import Testing**:
- [ ] Import CSV with roles assigned - verify roles persist after reload
- [ ] Check applied percentages match role baseline percentages
- [ ] Verify subcomponent relationships are created automatically
- [ ] Confirm QRE calculations are correct based on wage × baseline%

### **Manual Role Assignment Testing**:
- [ ] Assign role to imported employee without role
- [ ] Verify applied percentage shows role's baseline percentage
- [ ] Check that QRE is recalculated correctly
- [ ] Confirm subcomponent relationships are created

### **Allocation Modal Testing**:
- [ ] Open allocation modal for employee with assigned role
- [ ] Verify baseline values are displayed correctly
- [ ] Confirm calculations don't exceed baseline unexpectedly
- [ ] Save modal and verify values remain consistent

### **Multi-Year Testing**:
- [ ] Import employees into different years with roles
- [ ] Verify roles and subcomponents are created for correct business year
- [ ] Test role assignment across different business years

## ✅ **STATUS: READY FOR TESTING**

All fixes have been applied to resolve the employee role assignment issues during CSV import. The system now properly:

1. **Preserves role assignments** during CSV import
2. **Creates subcomponent relationships** automatically when roles are assigned
3. **Maintains baseline percentages** throughout the process
4. **Calculates QRE consistently** based on wage and role baseline
5. **Provides detailed debugging** to track the process

The next step is user testing to confirm the fixes resolve the reported issues. 