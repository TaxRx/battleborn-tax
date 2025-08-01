import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zafkhfnuuxtwgfmhgawz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZmtoZm51dXh0d2dmbWhnYXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNDY4NjYsImV4cCI6MjA0OTYyMjg2Nn0.YtTvSHsm9G4VKD15zMjj81ovGIE9EfrKBHPEaUTWRjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppliedPercentages() {
  try {
    console.log('🔍 Checking applied percentages in rd_selected_subcomponents...');
    
    // Get all selected subcomponents with their applied percentages
    const { data: subcomponents, error } = await supabase
      .from('rd_selected_subcomponents')
      .select('business_year_id, subcomponent_id, applied_percentage, frequency_percentage, year_percentage, selected_roles')
      .limit(20);
    
    if (error) {
      console.error('❌ Error fetching subcomponents:', error);
      return;
    }
    
    if (!subcomponents || subcomponents.length === 0) {
      console.log('⚠️ No subcomponents found in database');
      return;
    }
    
    console.log(`📊 Found ${subcomponents.length} subcomponents:`);
    
    let zeroAppliedCount = 0;
    let nonZeroAppliedCount = 0;
    let nullAppliedCount = 0;
    
    subcomponents.forEach((sub, index) => {
      const applied = sub.applied_percentage;
      const freq = sub.frequency_percentage;
      const year = sub.year_percentage;
      const roles = sub.selected_roles;
      
      if (applied === null || applied === undefined) {
        nullAppliedCount++;
      } else if (applied === 0) {
        zeroAppliedCount++;
      } else {
        nonZeroAppliedCount++;
      }
      
      if (index < 5) {
        console.log(`   ${index + 1}. Subcomponent ${sub.subcomponent_id}:`);
        console.log(`      Applied %: ${applied}`);
        console.log(`      Frequency %: ${freq}`);
        console.log(`      Year %: ${year}`);
        console.log(`      Selected Roles: ${JSON.stringify(roles)}`);
        console.log(`      Business Year: ${sub.business_year_id}`);
      }
    });
    
    console.log('\n📈 Summary:');
    console.log(`   Null applied %: ${nullAppliedCount}`);
    console.log(`   Zero applied %: ${zeroAppliedCount}`);
    console.log(`   Non-zero applied %: ${nonZeroAppliedCount}`);
    
    if (zeroAppliedCount > nonZeroAppliedCount) {
      console.log('\n🚨 ISSUE FOUND: Most subcomponents have 0% applied percentage!');
      console.log('   This explains why Role Snapshot shows 0.00% for all roles.');
      console.log('   The applied percentages need to be recalculated and saved.');
    } else if (nullAppliedCount > 0) {
      console.log('\n⚠️ Some subcomponents have null applied percentages');
    } else {
      console.log('\n✅ Applied percentages look good');
    }
    
  } catch (error) {
    console.error('❌ Error in diagnostic:', error);
  }
}

// Run the check
checkAppliedPercentages().then(() => {
  console.log('\n🏁 Diagnostic complete');
  process.exit(0);
}); 