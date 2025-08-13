#!/usr/bin/env tsx

/**
 * Backfill script to save Filing Guides and Allocation Reports to rd_reports table
 * for businesses that have completed calculations but missing report records
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface BusinessYear {
  id: string;
  business_id: string;
  year: number;
  business: {
    name: string;
    id: string;
  };
  calculations?: any;
  qre_locked?: boolean;
}

// Generate Filing Guide HTML
function generateFilingGuideHTML(businessName: string, year: number, calculationResults?: any): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const federalCredit = calculationResults?.total_credit || calculationResults?.federalCredit || 0;
  const totalQRE = calculationResults?.total_qre || calculationResults?.totalQRE || 0;
  const stateCredits = calculationResults?.stateCredits || 0;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>R&D Tax Credit Filing Guide - ${businessName} - ${year}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          line-height: 1.6; 
          color: #1f2937;
          background: white;
          margin: 40px;
        }
        .header { 
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          color: white;
          padding: 24px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 40px;
        }
        .header h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .header h2 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .section { margin-bottom: 40px; }
        .section h2 { 
          color: #1f2937; 
          font-size: 22px;
          font-weight: 700;
          border-bottom: 3px solid #7c3aed; 
          padding-bottom: 8px;
          margin-bottom: 20px;
        }
        .credit-summary { 
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .credit-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 16px; 
        }
        .credit-item { 
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          text-align: center;
        }
        .credit-value { 
          font-size: 24px; 
          font-weight: 700; 
          color: #7c3aed; 
          margin-bottom: 4px;
        }
        .credit-label { 
          font-size: 14px; 
          color: #64748b; 
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .checklist { 
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
        }
        .checklist-item {
          display: flex;
          align-items: flex-start;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .checklist-item:last-child { border-bottom: none; }
        .checklist-icon { 
          color: #10b981;
          margin-right: 12px;
          margin-top: 2px;
          font-weight: bold;
        }
        .important-note {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>R&D Tax Credit Filing Guide</h1>
        <h2>${businessName}</h2>
        <h3>Tax Year ${year}</h3>
        <p>Generated on: ${currentDate}</p>
      </div>
      
      <div class="section">
        <h2>Credit Summary</h2>
        <div class="credit-summary">
          <div class="credit-grid">
            <div class="credit-item">
              <div class="credit-value">$${federalCredit.toLocaleString()}</div>
              <div class="credit-label">Federal R&D Credit</div>
            </div>
            <div class="credit-item">
              <div class="credit-value">$${totalQRE.toLocaleString()}</div>
              <div class="credit-label">Total QRE</div>
            </div>
            <div class="credit-item">
              <div class="credit-value">$${(Array.isArray(stateCredits) ? stateCredits.reduce((sum, sc) => sum + (sc.finalCredit || 0), 0) : stateCredits || 0).toLocaleString()}</div>
              <div class="credit-label">State Credits</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Filing Requirements</h2>
        <div class="checklist">
          <div class="checklist-item">
            <span class="checklist-icon">✓</span>
            <div>Complete Form 6765 - Credit for Increasing Research Activities</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-icon">✓</span>
            <div>Attach supporting documentation for qualified research expenses</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-icon">✓</span>
            <div>Include state-specific forms if applicable</div>
          </div>
          <div class="checklist-item">
            <span class="checklist-icon">✓</span>
            <div>Maintain detailed records for potential audit support</div>
          </div>
        </div>
      </div>

      <div class="important-note">
        <strong>Important:</strong> This filing guide is generated based on your R&D tax credit calculations. 
        Please consult with your tax advisor before filing to ensure compliance with all applicable regulations.
      </div>
    </body>
    </html>
  `;
}

// Generate Allocation Report HTML
function generateAllocationReportHTML(businessName: string, year: number, calculationResults?: any): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalWages = calculationResults?.total_wages || 0;
  const qreWages = calculationResults?.qre_wages || 0;
  const totalContractors = calculationResults?.total_contractors || 0;
  const qreContractors = calculationResults?.qre_contractors || 0;
  const totalSupplies = calculationResults?.total_supplies || 0;
  const qreSupplies = calculationResults?.qre_supplies || 0;
  const totalQRE = calculationResults?.total_qre || calculationResults?.totalQRE || 0;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Allocation Report - ${businessName} - ${year}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          font-size: 14px;
          line-height: 1.6; 
          color: #1f2937;
          background: white;
          margin: 40px;
        }
        .header { 
          background: linear-gradient(135deg, #10b981 0%, #047857 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
        .header h2 { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .section { margin-bottom: 30px; }
        .section h2 { 
          color: #1f2937; 
          font-size: 20px;
          font-weight: 600;
          border-bottom: 2px solid #10b981; 
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        .allocation-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .allocation-table th, .allocation-table td { 
          border: 1px solid #e5e7eb; 
          padding: 12px 16px; 
          text-align: left; 
        }
        .allocation-table th { 
          background-color: #f8fafc; 
          font-weight: 600;
          color: #374151;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .amount { text-align: right; font-weight: 600; }
        .total-row { 
          background-color: #f0fdf4; 
          font-weight: 600;
          border-top: 2px solid #10b981;
        }
        .summary-text {
          background: #f8fafc;
          padding: 16px;
          border-radius: 6px;
          color: #4b5563;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Employee & Expense Allocation Report</h1>
        <h2>${businessName}</h2>
        <h3>Tax Year ${year}</h3>
        <p>Generated on: ${currentDate}</p>
      </div>
      
      <div class="section">
        <h2>Report Summary</h2>
        <div class="summary-text">
          This report details the allocation of employee time, contractor expenses, and supply costs to qualified research activities for the ${year} tax year.
        </div>
      </div>
      
      <div class="section">
        <h2>QRE Allocation Summary</h2>
        <table class="allocation-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Total Amount</th>
              <th>Allocated to QRE</th>
              <th>Allocation %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Employee Wages</td>
              <td class="amount">$${totalWages.toLocaleString()}</td>
              <td class="amount">$${qreWages.toLocaleString()}</td>
              <td class="amount">${totalWages ? ((qreWages / totalWages) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr>
              <td>Contractor Expenses</td>
              <td class="amount">$${totalContractors.toLocaleString()}</td>
              <td class="amount">$${qreContractors.toLocaleString()}</td>
              <td class="amount">${totalContractors ? ((qreContractors / totalContractors) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr>
              <td>Supply Costs</td>
              <td class="amount">$${totalSupplies.toLocaleString()}</td>
              <td class="amount">$${qreSupplies.toLocaleString()}</td>
              <td class="amount">${totalSupplies ? ((qreSupplies / totalSupplies) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr class="total-row">
              <td><strong>TOTAL QRE</strong></td>
              <td class="amount"><strong>$${(totalWages + totalContractors + totalSupplies).toLocaleString()}</strong></td>
              <td class="amount"><strong>$${totalQRE.toLocaleString()}</strong></td>
              <td class="amount"><strong>${(totalWages + totalContractors + totalSupplies) > 0 ? ((totalQRE / (totalWages + totalContractors + totalSupplies)) * 100).toFixed(1) : '0.0'}%</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}

async function main() {
  console.log('🚀 Starting backfill process for missing Filing Guides and Allocation Reports...');

  try {
    // Get all business years with calculations but missing filing guide reports
    const { data: businessYears, error: yearError } = await supabase
      .from('rd_business_years')
      .select(`
        id,
        business_id,
        year,
        qre_locked,
        business:business_id (
          id,
          name
        )
      `)
      .order('year', { ascending: false });

    if (yearError) {
      throw new Error(`Error fetching business years: ${yearError.message}`);
    }

    console.log(`📊 Found ${businessYears?.length || 0} business years to check`);

    let filingGuidesSaved = 0;
    let allocationReportsSaved = 0;
    let errors = 0;

    for (const businessYear of businessYears || []) {
      try {
        console.log(`\n🔍 Checking ${businessYear.business.name} - ${businessYear.year}`);

        // Check if filing guide already exists
        const { data: existingFilingGuide } = await supabase
          .from('rd_reports')
          .select('id')
          .eq('business_year_id', businessYear.id)
          .eq('type', 'FILING_GUIDE')
          .single();

        // Check if allocation report already exists
        const { data: existingAllocationReport } = await supabase
          .from('rd_reports')
          .select('id')
          .eq('business_year_id', businessYear.id)
          .eq('type', 'ALLOCATION_SUMMARY')
          .not('generated_html', 'is', null)
          .single();

        // Check if there are calculation results
        const { data: calculations } = await supabase
          .from('rd_federal_credit_results')
          .select('*')
          .eq('business_year_id', businessYear.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Save Filing Guide if missing and calculations exist
        if (!existingFilingGuide && calculations) {
          console.log(`  📋 Generating Filing Guide for ${businessYear.business.name} - ${businessYear.year}`);
          
          const filingGuideHTML = generateFilingGuideHTML(
            businessYear.business.name,
            businessYear.year,
            calculations
          );

          const { error: saveError } = await supabase
            .from('rd_reports')
            .upsert({
              business_year_id: businessYear.id,
              business_id: businessYear.business_id,
              type: 'FILING_GUIDE',
              filing_guide: filingGuideHTML,
              generated_text: 'Auto-generated filing guide',
              ai_version: 'backfill_v1.0'
            }, { onConflict: 'business_year_id,type' });

          if (saveError) {
            console.error(`  ❌ Error saving Filing Guide: ${saveError.message}`);
            errors++;
          } else {
            console.log(`  ✅ Filing Guide saved successfully`);
            filingGuidesSaved++;
          }
        } else if (existingFilingGuide) {
          console.log(`  ⏭️ Filing Guide already exists`);
        } else {
          console.log(`  ⚠️ No calculations found, skipping Filing Guide`);
        }

        // Save Allocation Report if missing and calculations exist
        if (!existingAllocationReport && calculations && businessYear.qre_locked) {
          console.log(`  📊 Generating Allocation Report for ${businessYear.business.name} - ${businessYear.year}`);
          
          const allocationHTML = generateAllocationReportHTML(
            businessYear.business.name,
            businessYear.year,
            calculations
          );

          const { error: saveError } = await supabase
            .from('rd_reports')
            .upsert({
              business_year_id: businessYear.id,
              business_id: businessYear.business_id,
              type: 'ALLOCATION_SUMMARY',
              generated_html: allocationHTML,
              generated_text: 'Auto-generated allocation report',
              ai_version: 'backfill_v1.0'
            }, { 
              onConflict: 'business_year_id,type',
              ignoreDuplicates: false 
            });

          if (saveError) {
            console.error(`  ❌ Error saving Allocation Report: ${saveError.message}`);
            errors++;
          } else {
            console.log(`  ✅ Allocation Report saved successfully`);
            allocationReportsSaved++;
          }
        } else if (existingAllocationReport) {
          console.log(`  ⏭️ Allocation Report already exists`);
        } else if (!businessYear.qre_locked) {
          console.log(`  ⚠️ QRE not locked, skipping Allocation Report`);
        } else {
          console.log(`  ⚠️ No calculations found, skipping Allocation Report`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${businessYear.business.name} - ${businessYear.year}:`, error);
        errors++;
      }
    }

    console.log('\n🎉 Backfill process completed!');
    console.log(`📋 Filing Guides saved: ${filingGuidesSaved}`);
    console.log(`📊 Allocation Reports saved: ${allocationReportsSaved}`);
    console.log(`❌ Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Fatal error during backfill process:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
