const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
  try {
    console.log('Testing database schema...');
    
    // Test 1: Check if rd_contractors table exists and get its structure
    const { data: contractors, error: contractorsError } = await supabase
      .from('rd_contractors')
      .select('*')
      .limit(1);
    
    if (contractorsError) {
      console.error('Error querying rd_contractors:', contractorsError);
    } else {
      console.log('rd_contractors table exists');
      if (contractors && contractors.length > 0) {
        console.log('Columns in rd_contractors:', Object.keys(contractors[0]));
      }
    }
    
    // Test 2: Check if rd_contractor_subcomponents table exists
    const { data: subcomponents, error: subcomponentsError } = await supabase
      .from('rd_contractor_subcomponents')
      .select('*')
      .limit(1);
    
    if (subcomponentsError) {
      console.error('Error querying rd_contractor_subcomponents:', subcomponentsError);
    } else {
      console.log('rd_contractor_subcomponents table exists');
      if (subcomponents && subcomponents.length > 0) {
        console.log('Columns in rd_contractor_subcomponents:', Object.keys(subcomponents[0]));
      }
    }
    
    // Test 3: Check if rd_contractor_year_data table exists
    const { data: yearData, error: yearDataError } = await supabase
      .from('rd_contractor_year_data')
      .select('*')
      .limit(1);
    
    if (yearDataError) {
      console.error('Error querying rd_contractor_year_data:', yearDataError);
    } else {
      console.log('rd_contractor_year_data table exists');
      if (yearData && yearData.length > 0) {
        console.log('Columns in rd_contractor_year_data:', Object.keys(yearData[0]));
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSchema(); 