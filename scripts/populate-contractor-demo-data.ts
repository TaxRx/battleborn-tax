import { createClient } from '@supabase/supabase-js';

// Demo script to populate rd_contractor_year_data with sample data
// This allows testing of the Filing Guide Calculation Specifics fixes

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateContractorDemoData() {
  try {
    console.log('🚀 Starting contractor demo data population...');

    // Get a business year to use for demo data
    const { data: businessYears, error: byError } = await supabase
      .from('rd_business_years')
      .select('id, year, business_id')
      .limit(1);

    if (byError || !businessYears || businessYears.length === 0) {
      console.error('❌ No business years found. Please create a business year first.');
      return;
    }

    const businessYear = businessYears[0];
    console.log(`📅 Using business year: ${businessYear.year} (${businessYear.id})`);

    // Sample contractor data
    const contractorData = [
      {
        business_year_id: businessYear.id,
        name: 'TechFlow Solutions Inc.',
        cost_amount: 45000.00,
        applied_percent: 85.0,
        activity_link: [
          {
            activity_name: 'Software Development Research',
            activity_id: 'activity_1',
            percent: 85.0,
            subcomponent_name: 'Algorithm Development',
            subcomponent_id: 'sub_1'
          }
        ],
        contractor_id: null,
        user_id: null,
        activity_roles: null
      },
      {
        business_year_id: businessYear.id,
        name: 'DataScience Consulting LLC',
        cost_amount: 32000.00,
        applied_percent: 92.0,
        activity_link: [
          {
            activity_name: 'Machine Learning Research',
            activity_id: 'activity_2', 
            percent: 92.0,
            subcomponent_name: 'Model Training & Optimization',
            subcomponent_id: 'sub_2'
          }
        ],
        contractor_id: null,
        user_id: null,
        activity_roles: null
      },
      {
        business_year_id: businessYear.id,
        name: 'BioTech Research Partners',
        cost_amount: 78000.00,
        applied_percent: 78.0,
        activity_link: [
          {
            activity_name: 'Laboratory Equipment Testing',
            activity_id: 'activity_3',
            percent: 78.0,
            subcomponent_name: 'Equipment Calibration',
            subcomponent_id: 'sub_3'
          },
          {
            activity_name: 'Process Optimization Research',
            activity_id: 'activity_4',
            percent: 78.0,
            subcomponent_name: 'Workflow Analysis',
            subcomponent_id: 'sub_4'
          }
        ],
        contractor_id: null,
        user_id: null,
        activity_roles: null
      }
    ];

    // Calculate QRE for each contractor (80% threshold rule)
    const contractorsWithQRE = contractorData.map(contractor => {
      const effectivePercent = contractor.applied_percent >= 80 ? 100 : contractor.applied_percent;
      const calculatedQre = (contractor.cost_amount * effectivePercent) / 100;
      
      return {
        ...contractor,
        calculated_qre: calculatedQre
      };
    });

    // Insert contractor data
    const { data: insertedContractors, error: insertError } = await supabase
      .from('rd_contractor_year_data')
      .insert(contractorsWithQRE)
      .select('id, name, cost_amount, calculated_qre');

    if (insertError) {
      console.error('❌ Error inserting contractor data:', insertError);
      return;
    }

    console.log('✅ Successfully inserted contractor demo data:');
    insertedContractors?.forEach(contractor => {
      console.log(`   📋 ${contractor.name}: $${contractor.cost_amount.toLocaleString()} → $${contractor.calculated_qre.toLocaleString()} QRE`);
    });

    // Now add some sample supply data too
    const supplyData = [
      {
        business_year_id: businessYear.id,
        name: 'Advanced Testing Equipment',
        cost_amount: 15000.00,
        applied_percent: 95.0,
        activity_link: [
          {
            activity_name: 'Laboratory Equipment Testing',
            activity_id: 'activity_3',
            percent: 95.0,
            subcomponent_name: 'Equipment Setup & Testing',
            subcomponent_id: 'sub_5'
          }
        ],
        supply_id: null,
        user_id: null,
        activity_roles: null
      },
      {
        business_year_id: businessYear.id,
        name: 'Research Materials & Chemicals',
        cost_amount: 8500.00,
        applied_percent: 75.0,
        activity_link: [
          {
            activity_name: 'Chemical Analysis Research',
            activity_id: 'activity_5',
            percent: 75.0,
            subcomponent_name: 'Material Testing',
            subcomponent_id: 'sub_6'
          }
        ],
        supply_id: null,
        user_id: null,
        activity_roles: null
      }
    ];

    // Calculate QRE for supplies
    const suppliesWithQRE = supplyData.map(supply => {
      const effectivePercent = supply.applied_percent >= 80 ? 100 : supply.applied_percent;
      const calculatedQre = (supply.cost_amount * effectivePercent) / 100;
      
      return {
        ...supply,
        calculated_qre: calculatedQre
      };
    });

    // Insert supply data (assuming rd_supply_year_data table exists)
    const { data: insertedSupplies, error: supplyError } = await supabase
      .from('rd_supply_year_data')
      .insert(suppliesWithQRE)
      .select('id, name, cost_amount, calculated_qre');

    if (supplyError) {
      console.log('⚠️  Supply data insertion failed (table may not exist):', supplyError.message);
    } else {
      console.log('✅ Successfully inserted supply demo data:');
      insertedSupplies?.forEach(supply => {
        console.log(`   🧪 ${supply.name}: $${supply.cost_amount.toLocaleString()} → $${supply.calculated_qre.toLocaleString()} QRE`);
      });
    }

    console.log('\n🎉 Demo data population complete!');
    console.log('📋 You can now test the Filing Guide → Calculation Specifics section');
    console.log('📋 It should now show contractor and supply data instead of empty tables');

  } catch (error) {
    console.error('❌ Error populating demo data:', error);
  }
}

// Run the script
populateContractorDemoData(); 