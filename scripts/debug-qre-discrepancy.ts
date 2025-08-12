#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kiogxpdjhopdlxhttprg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

interface QREComparisonResult {
  businessYearId: string;
  year: number;
  businessName: string;
  sectionGQRE: {
    employeeQRE: number;
    contractorQRE: number;
    supplyQRE: number;
    total: number;
    source: 'rd_employee_subcomponents + calculations';
  };
  expenseStepQRE: {
    employeeQRE: number;
    contractorQRE: number;
    supplyQRE: number;
    total: number;
    source: 'rd_employee_year_data.calculated_qre';
  };
  lockedQRE?: {
    employeeQRE: number;
    contractorQRE: number;
    supplyQRE: number;
    total: number;
    isLocked: boolean;
    source: 'rd_business_years (locked)';
  };
  difference: {
    employeeQRE: number;
    contractorQRE: number;
    supplyQRE: number;
    total: number;
  };
}

async function compareQRECalculations(businessYearId: string): Promise<QREComparisonResult> {
  console.log(`\n🔍 Comparing QRE calculations for business year: ${businessYearId}`);

  // Get business year info
  const { data: businessYear } = await supabase
    .from('rd_business_years')
    .select(`
      id, year, business_id,
      employee_qre, contractor_qre, supply_qre, qre_locked,
      business:rd_businesses(name)
    `)
    .eq('id', businessYearId)
    .single();

  if (!businessYear) {
    throw new Error(`Business year not found: ${businessYearId}`);
  }

  const businessName = (businessYear.business as any)?.name || 'Unknown Business';
  console.log(`📊 Analyzing: ${businessName} - Year ${businessYear.year}`);

  // METHOD 1: SectionGQREService approach (rd_employee_subcomponents)
  console.log('\n📝 METHOD 1: SectionGQREService calculation (subcomponent-level)');
  
  // Get employees
  const { data: employees } = await supabase
    .from('rd_employees')
    .select('id, first_name, last_name, annual_wage')
    .eq('business_id', businessYear.business_id);

  // Get employee subcomponents for this year
  const { data: employeeSubcomponents } = await supabase
    .from('rd_employee_subcomponents')
    .select('employee_id, applied_percentage')
    .eq('business_year_id', businessYearId);

  const sectionGEmployeeQRE = (employees || []).reduce((sum, employee) => {
    const subcomponents = (employeeSubcomponents || []).filter(sub => sub.employee_id === employee.id);
    const totalAppliedPercentage = subcomponents.reduce((total, sub) => total + (sub.applied_percentage || 0), 0);
    const employeeQRE = Math.round((employee.annual_wage || 0) * totalAppliedPercentage / 100);
    
    if (subcomponents.length > 0) {
      console.log(`  👤 ${employee.first_name} ${employee.last_name}: $${(employee.annual_wage || 0).toLocaleString()} × ${totalAppliedPercentage.toFixed(2)}% = $${employeeQRE.toLocaleString()}`);
    }
    
    return sum + employeeQRE;
  }, 0);

  // Get contractors and contractor subcomponents
  const { data: contractors } = await supabase
    .from('rd_contractors')
    .select('id, first_name, last_name, amount')
    .eq('business_id', businessYear.business_id);

  const { data: contractorSubcomponents } = await supabase
    .from('rd_contractor_subcomponents')
    .select('contractor_id, applied_percentage')
    .eq('business_year_id', businessYearId);

  const sectionGContractorQRE = (contractors || []).reduce((sum, contractor) => {
    const subcomponents = (contractorSubcomponents || []).filter(sub => sub.contractor_id === contractor.id);
    const totalAppliedPercentage = subcomponents.reduce((total, sub) => total + (sub.applied_percentage || 0), 0);
    const contractorQRE = Math.round((contractor.amount || 0) * totalAppliedPercentage / 100 * 0.65); // 65% contractor factor
    return sum + contractorQRE;
  }, 0);

  // Get supplies and supply subcomponents
  const { data: supplies } = await supabase
    .from('rd_supplies')
    .select('id, name, annual_cost')
    .eq('business_id', businessYear.business_id);

  const { data: supplySubcomponents } = await supabase
    .from('rd_supply_subcomponents')
    .select('supply_id, amount_applied')
    .eq('business_year_id', businessYearId);

  const sectionGSupplyQRE = (supplies || []).reduce((sum, supply) => {
    const subcomponents = (supplySubcomponents || []).filter(sub => sub.supply_id === supply.id);
    const totalAmountApplied = subcomponents.reduce((total, sub) => total + (sub.amount_applied || 0), 0);
    return sum + totalAmountApplied;
  }, 0);

  // METHOD 2: Expense Step approach (rd_employee_year_data.calculated_qre)
  console.log('\n💰 METHOD 2: Expense Step calculation (calculated_qre column)');
  
  const { data: employeeYearData } = await supabase
    .from('rd_employee_year_data')
    .select('employee_id, calculated_qre')
    .eq('business_year_id', businessYearId);

  const expenseStepEmployeeQRE = (employeeYearData || []).reduce((sum, data) => {
    const qre = data.calculated_qre || 0;
    return sum + qre;
  }, 0);

  const { data: contractorYearData } = await supabase
    .from('rd_contractor_year_data')
    .select('contractor_id, calculated_qre')
    .eq('business_year_id', businessYearId);

  const expenseStepContractorQRE = (contractorYearData || []).reduce((sum, data) => sum + (data.calculated_qre || 0), 0);

  const { data: supplyYearData } = await supabase
    .from('rd_supply_year_data')
    .select('supply_id, calculated_qre')
    .eq('business_year_id', businessYearId);

  const expenseStepSupplyQRE = (supplyYearData || []).reduce((sum, data) => sum + (data.calculated_qre || 0), 0);

  // METHOD 3: Locked values (if applicable)
  const lockedQRE = businessYear.qre_locked ? {
    employeeQRE: businessYear.employee_qre || 0,
    contractorQRE: businessYear.contractor_qre || 0,
    supplyQRE: businessYear.supply_qre || 0,
    total: (businessYear.employee_qre || 0) + (businessYear.contractor_qre || 0) + (businessYear.supply_qre || 0),
    isLocked: true,
    source: 'rd_business_years (locked)' as const
  } : undefined;

  // Calculate totals and differences
  const sectionGTotal = sectionGEmployeeQRE + sectionGContractorQRE + sectionGSupplyQRE;
  const expenseStepTotal = expenseStepEmployeeQRE + expenseStepContractorQRE + expenseStepSupplyQRE;

  const result: QREComparisonResult = {
    businessYearId,
    year: businessYear.year,
    businessName,
    sectionGQRE: {
      employeeQRE: sectionGEmployeeQRE,
      contractorQRE: sectionGContractorQRE,
      supplyQRE: sectionGSupplyQRE,
      total: sectionGTotal,
      source: 'rd_employee_subcomponents + calculations'
    },
    expenseStepQRE: {
      employeeQRE: expenseStepEmployeeQRE,
      contractorQRE: expenseStepContractorQRE,
      supplyQRE: expenseStepSupplyQRE,
      total: expenseStepTotal,
      source: 'rd_employee_year_data.calculated_qre'
    },
    lockedQRE,
    difference: {
      employeeQRE: sectionGEmployeeQRE - expenseStepEmployeeQRE,
      contractorQRE: sectionGContractorQRE - expenseStepContractorQRE,
      supplyQRE: sectionGSupplyQRE - expenseStepSupplyQRE,
      total: sectionGTotal - expenseStepTotal
    }
  };

  // Display results
  console.log('\n📊 COMPARISON RESULTS:');
  console.log('┌─────────────────────────┬─────────────────┬─────────────────┬─────────────────┐');
  console.log('│ Method                  │ Employee QRE    │ Contractor QRE  │ Supply QRE      │');
  console.log('├─────────────────────────┼─────────────────┼─────────────────┼─────────────────┤');
  console.log(`│ SectionGQREService      │ $${sectionGEmployeeQRE.toLocaleString().padStart(13)} │ $${sectionGContractorQRE.toLocaleString().padStart(13)} │ $${sectionGSupplyQRE.toLocaleString().padStart(13)} │`);
  console.log(`│ Expense Step            │ $${expenseStepEmployeeQRE.toLocaleString().padStart(13)} │ $${expenseStepContractorQRE.toLocaleString().padStart(13)} │ $${expenseStepSupplyQRE.toLocaleString().padStart(13)} │`);
  if (lockedQRE) {
    console.log(`│ Locked Values           │ $${lockedQRE.employeeQRE.toLocaleString().padStart(13)} │ $${lockedQRE.contractorQRE.toLocaleString().padStart(13)} │ $${lockedQRE.supplyQRE.toLocaleString().padStart(13)} │`);
  }
  console.log('├─────────────────────────┼─────────────────┼─────────────────┼─────────────────┤');
  console.log(`│ DIFFERENCE              │ $${result.difference.employeeQRE.toLocaleString().padStart(13)} │ $${result.difference.contractorQRE.toLocaleString().padStart(13)} │ $${result.difference.supplyQRE.toLocaleString().padStart(13)} │`);
  console.log('└─────────────────────────┴─────────────────┴─────────────────┴─────────────────┘');
  
  console.log(`\n🎯 TOTAL QRE COMPARISON:`);
  console.log(`   SectionGQREService: $${sectionGTotal.toLocaleString()}`);
  console.log(`   Expense Step:       $${expenseStepTotal.toLocaleString()}`);
  if (lockedQRE) {
    console.log(`   Locked Values:      $${lockedQRE.total.toLocaleString()}`);
  }
  console.log(`   Difference:         $${result.difference.total.toLocaleString()}`);

  if (Math.abs(result.difference.total) > 1000) {
    console.log(`\n⚠️  SIGNIFICANT DISCREPANCY DETECTED! ($${Math.abs(result.difference.total).toLocaleString()} difference)`);
    
    if (Math.abs(result.difference.employeeQRE) > 1000) {
      console.log(`   📝 Employee QRE differs by $${Math.abs(result.difference.employeeQRE).toLocaleString()}`);
      console.log(`   🔍 This suggests rd_employee_subcomponents and rd_employee_year_data.calculated_qre are out of sync`);
    }
  } else {
    console.log(`\n✅ QRE calculations are reasonably consistent (difference < $1,000)`);
  }

  return result;
}

// Example usage - replace with actual business year ID
async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: ts-node debug-qre-discrepancy.ts <business_year_id>');
    console.log('Example: ts-node debug-qre-discrepancy.ts 1465d219-c5c1-4301-a88d-ddf858bcef45');
    process.exit(1);
  }

  const businessYearId = process.argv[2];
  
  try {
    const result = await compareQRECalculations(businessYearId);
    
    console.log('\n🎯 RECOMMENDATION:');
    if (result.lockedQRE?.isLocked) {
      console.log('   ✅ QRE values are LOCKED - Business Setup should use locked values');
      console.log('   💡 The Expense Step locked values should be the authoritative source');
    } else if (Math.abs(result.difference.total) > 1000) {
      console.log('   ⚠️  Large discrepancy detected between calculation methods');
      console.log('   💡 Consider investigating rd_employee_year_data.calculated_qre synchronization');
      console.log('   💡 The Expense Step (calculated_qre) is likely more accurate for current allocations');
    } else {
      console.log('   ✅ Both methods produce similar results');
    }
    
  } catch (error) {
    console.error('❌ Error during comparison:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
