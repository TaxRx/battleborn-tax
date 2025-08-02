import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { SectionGQREService } from '../../services/sectionGQREService';
import { AIService } from "../../../../services/aiService";


interface SectionGTableProps {
  businessData: any;
  selectedYear: any;
  clientId: string;
}

const BUSINESS_COMPONENT_TYPES = ['Product', 'Process', 'Software', 'Technique', 'Formula', 'Invention'];
const SOFTWARE_TYPES = ['CRM', 'EHR', 'Scheduling', 'Data Analytics', 'Other'];

// Helper function to format numbers as $12,1234
const formatCurrency = (amount: number): string => {
  if (!amount || amount === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const SectionGTable: React.FC<SectionGTableProps> = ({ businessData, selectedYear, clientId }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadSectionGData = useCallback(async () => {
    // Prevent duplicate executions
    if (isProcessing) {
      console.log('%c🚫 [SECTION G] Already processing, skipping duplicate call', 'background: #f90; color: #000; font-weight: bold;');
      return;
    }
    
    setIsProcessing(true);
    setLoading(true);
    try {
      console.log('%c✅ [SECTION G] Starting loadSectionGData', 'background: #0f0; color: #000; font-weight: bold;', {
        businessYearId: selectedYear.id,
        businessId: businessData.id,
        clientId
      });
      const rawQREData = await SectionGQREService.getQREDataForSectionG(selectedYear.id);
      // QRE data loaded
      
      // Group by activity
      const activitiesMap = new Map();
      rawQREData.forEach(entry => {
        if (!activitiesMap.has(entry.activity_id)) {
          activitiesMap.set(entry.activity_id, {
            activity_id: entry.activity_id,
            activity_title: entry.activity_title,
            employees: [],
            contractors: [],
            supplies: []
          });
        }
        
        const activity = activitiesMap.get(entry.activity_id);
        if (entry.category === 'Employee') {
          activity.employees.push(entry);
        } else if (entry.category === 'Contractor') {
          activity.contractors.push(entry);
        } else if (entry.category === 'Supply') {
          activity.supplies.push(entry);
        }
      });
      
      const activitiesWithQRE = Array.from(activitiesMap.values());
      
      if (!activitiesWithQRE || activitiesWithQRE.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // Process each activity to build Section G rows
      const newRows = await Promise.all(
        activitiesWithQRE.map(async (activity, activityIndex) => {
          // Process activity QRE data
          
          // Calculate QREs by type
          const directWages = activity.employees
            ?.filter(e => {
              const isOwner = e.is_owner;
              const isResearchLeader = e.role?.toLowerCase().includes('research leader');
              const isSupervisor = e.role?.toLowerCase().includes('supervisor');
              const isAdmin = e.role?.toLowerCase().includes('admin');
              
              // Debug: Employee role classification (reduced logging)
              
              // Include Research Leaders and owners in Direct Research Wages
              if (isOwner || isResearchLeader) {
                // Performance optimization: Reduced excessive employee logging
                return true;
              }
              // Exclude supervisors and admins from Direct Research Wages
              if (isSupervisor || isAdmin) {
                console.log(`[SECTION G DEBUG] Excluding ${e.name} from Direct Wages (supervisor: ${isSupervisor}, admin: ${isAdmin})`);
                return false;
              }
              // Include other employees in Direct Research Wages
              // Performance optimization: Reduced excessive employee logging
              return true;
            })
            .reduce((sum, e) => {
              // Performance optimization: reduced excessive employee QRE logging
              return sum + (e.calculated_qre || 0);
            }, 0) || 0;
          
          // Activity direct wages calculated
          
          const supervisionWages = activity.employees
            ?.filter(e => e.role?.toLowerCase().includes('supervisor'))
            .reduce((sum, e) => sum + (e.calculated_qre || 0), 0) || 0;
          
          const supportWages = activity.employees
            ?.filter(e => e.role?.toLowerCase().includes('admin'))
            .reduce((sum, e) => sum + (e.calculated_qre || 0), 0) || 0;
          
          const supplies = activity.supplies?.reduce((sum, s) => sum + (s.calculated_qre || 0), 0) || 0;
          const contractResearch = activity.contractors?.reduce((sum, c) => sum + (c.calculated_qre || 0), 0) || 0;
          const rentalLease = 0; // Manual entry
          
          // Activity totals calculated
          
          // EIN/NAICS from business data
          const ein = businessData?.ein || '';
          const naics = businessData?.naics_code || '';
          
          // Type from research guidelines (default to Technique)
          const type = 'Technique'; // We can enhance this later if needed
          
          // Software type (only if type includes Software)
          const softwareType = type.includes('Software') ? '' : undefined;
          
          // Generate AI description
          let description = '';
          try {
            // Get the actual subcomponent count from the QRE data by counting unique subcomponent IDs
            const uniqueSubcomponentIds = new Set();
            activity.employees?.forEach(e => uniqueSubcomponentIds.add(e.subcomponent_id));
            activity.contractors?.forEach(c => uniqueSubcomponentIds.add(c.subcomponent_id));
            activity.supplies?.forEach(s => uniqueSubcomponentIds.add(s.subcomponent_id));
            const actualSubcomponentCount = uniqueSubcomponentIds.size;
            
            // Subcomponent count calculated
            
            // Use the new Section G Line 49(f) specific method with correct field names
            const line49fContext = {
              research_activity_name: activity.activity_title || 'Research Activity',
              subcomponent_count: actualSubcomponentCount,
              subcomponent_groups: 'procedural subcomponents, diagnostic tools, workflow protocols',
              shrinkback_percent: 100, // Default to 100% for Section G
              guideline_notes: activity.general_description || `Research activity for ${businessData.name} in ${selectedYear.year}`,
              industry: businessData?.industry || 'Business'
            };
            
            console.log('[SECTION G DEBUG] AI Context for Line 49(f):', line49fContext);
            
            // Generate AI description using the AI service
            try {
              console.log('[SECTION G DEBUG] Calling AI service for Line 49(f) description...');
              description = await AIService.getInstance().generateLine49fDescription(line49fContext);
              console.log('[SECTION G DEBUG] AI-generated description:', description);
            } catch (aiError) {
              console.warn('[SECTION G WARNING] AI service failed, using fallback description:', aiError);
              // Fallback to static description if AI service fails
              description = `The company evaluated ${line49fContext.subcomponent_count} ${line49fContext.subcomponent_groups} to resolve technical uncertainty in ${line49fContext.research_activity_name}. Experimental testing was conducted using systematic research methodologies within the ${line49fContext.industry} industry. ${line49fContext.guideline_notes || 'Research activities were performed in accordance with established protocols and regulatory requirements.'}`;
            }
            
            // NOTE: Removed automatic save from loadSectionGData
            // Save should only happen when user clicks the "Save" button
            // This prevents circular behavior where every activity gets saved on component load
            
          } catch (error) {
            console.error('[SECTION G ERROR] Failed to generate AI description:', error);
            description = `The company evaluated ${activity.subcomponents?.length || 0} subcomponents to resolve technical uncertainty in ${activity.activity_title}. Experimental testing was conducted to determine optimal configurations.`;
          }
          
          return {
            id: activity.activity_id,
            ein,
            naics,
            name: `${activity.activity_title || 'Activity'} ${selectedYear.year}`,
            type,
            softwareType,
            aiDescription: description,
            wages: directWages,
            supervision: supervisionWages,
            support: supportWages,
            totalWages: directWages + supervisionWages + supportWages,
            supplies,
            rentalLease,
            contractResearch,
          };
        })
      );
      
      setRows(newRows);
      // Section G rows generated
    } catch (err) {
      console.error('%c[SECTION G ERROR] Unexpected error:', 'background: #f00; color: #fff; font-weight: bold;', err);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }, [selectedYear?.id, businessData?.id, clientId]);

  useEffect(() => {
    if (!selectedYear?.id || !businessData?.id) return;
    loadSectionGData();
  }, [selectedYear?.id, businessData?.id, loadSectionGData]);

  // Method to save data to rd_federal_credit table
  const saveToFederalCreditTable = async (data: {
    business_year_id: string;
    client_id: string;
    research_activity_id?: string;
    research_activity_name: string;
    direct_research_wages: number;
    supplies_expenses: number;
    contractor_expenses: number;
    total_qre: number;
    subcomponent_count: number;
    subcomponent_groups: string;
    applied_percent: number;
    line_49f_description: string;
    ai_generation_timestamp: string;
    ai_prompt_used: string;
    industry_type?: string;
    focus_area?: string;
    general_description?: string;
    data_snapshot: any;
  }): Promise<void> => {
    try {
      console.log('🔍 [SECTION G SAVE] Starting save operation...');
      console.log('🔍 [SECTION G SAVE] Data to save:', {
        business_year_id: data.business_year_id,
        client_id: data.client_id,
        research_activity_id: data.research_activity_id,
        research_activity_name: data.research_activity_name,
        line_49f_description_length: data.line_49f_description?.length || 0,
        has_ai_description: !!data.line_49f_description,
        total_qre: data.total_qre
      });
      
      console.log('[SECTION G DEBUG] Attempting to save with business_year_id:', data.business_year_id);
      console.log('[SECTION G DEBUG] clientId:', clientId);
      
      // CRITICAL FIX: First validate that business_year_id exists in rd_business_years table
      const { data: businessYearCheck, error: checkError } = await supabase
        .from('rd_business_years')
        .select('id, year, business_id')
        .eq('id', data.business_year_id)
        .single();
      
      let validBusinessYearId = data.business_year_id;
      
      if (checkError || !businessYearCheck) {
        console.error('❌ [SECTION G SAVE] Business year ID does not exist:', data.business_year_id);
        console.log('[SECTION G DEBUG] Error details:', checkError);
        
        // If the business_year_id doesn't exist, try to find/create a valid business year
        console.log('[SECTION G DEBUG] Attempting to find/create valid business year for client:', clientId);
        
        // Get the business for this client
        const { data: clientBusiness, error: businessError } = await supabase
          .from('rd_businesses')
          .select('id, name')
          .eq('client_id', clientId)
          .single();
        
        if (businessError || !clientBusiness) {
          console.error('❌ [SECTION G SAVE] Failed to find business for client:', businessError);
          alert('❌ Cannot save Section G data: No business found for this client. Please ensure the business is properly set up.');
          return;
        }
        
        console.log('✅ [SECTION G SAVE] Found business for client:', clientBusiness);
        
        // Try to find any existing business year for this business
        const { data: existingBusinessYears, error: yearError } = await supabase
          .from('rd_business_years')
          .select('id, year')
          .eq('business_id', clientBusiness.id)
          .order('year', { ascending: false });
        
        if (yearError) {
          console.error('❌ [SECTION G SAVE] Failed to fetch business years:', yearError);
          alert('❌ Cannot save Section G data: Failed to fetch business years. Please try again.');
          return;
        }
        
        if (existingBusinessYears && existingBusinessYears.length > 0) {
          // Use the most recent business year
          validBusinessYearId = existingBusinessYears[0].id;
          console.log('✅ [SECTION G SAVE] Using existing business year ID:', validBusinessYearId, 'for year:', existingBusinessYears[0].year);
        } else {
          // No business years exist - create one for the current year
          const currentYear = new Date().getFullYear();
          console.log('⚠️ [SECTION G SAVE] No business years found, creating one for year:', currentYear);
          
          const { data: newBusinessYear, error: createError } = await supabase
            .from('rd_business_years')
            .insert({
              business_id: clientBusiness.id,
              year: currentYear,
              gross_receipts: 0,
              total_qre: 0
            })
            .select()
            .single();
          
          if (createError || !newBusinessYear) {
            console.error('❌ [SECTION G SAVE] Failed to create business year:', createError);
            alert('❌ Cannot save Section G data: Failed to create business year. Please try again.');
            return;
          }
          
          validBusinessYearId = newBusinessYear.id;
          console.log('✅ [SECTION G SAVE] Created new business year ID:', validBusinessYearId);
        }
      } else {
        console.log('✅ [SECTION G SAVE] Business year ID is valid:', businessYearCheck);
      }
      
      // Validate research_activity_id if provided
      let validResearchActivityId = data.research_activity_id;
      if (data.research_activity_id) {
        const { data: researchActivityCheck, error: researchActivityError } = await supabase
          .from('rd_research_activities')
          .select('id')
          .eq('id', data.research_activity_id)
          .single();
        
        if (researchActivityError || !researchActivityCheck) {
          console.log('⚠️ [SECTION G SAVE] research_activity_id does not exist:', data.research_activity_id);
          console.log('[SECTION G WARNING] Saving without research_activity_id reference');
          validResearchActivityId = null; // Set to null to avoid foreign key violation
        } else {
          console.log('✅ [SECTION G SAVE] Research activity ID is valid');
        }
      }
      
      // Check if a record already exists and update instead of insert to avoid conflicts
      const { data: existingRecord, error: existingError } = await supabase
        .from('rd_federal_credit')
        .select('id')
        .eq('business_year_id', validBusinessYearId)
        .eq('client_id', data.client_id)
        .eq('research_activity_name', data.research_activity_name)
        .single();
      
      console.log('🔍 [SECTION G SAVE] Checking for existing record:', {
        found: !!existingRecord,
        error: !!existingError,
        existingId: existingRecord?.id
      });
      
      const recordData = {
        business_year_id: validBusinessYearId,
        client_id: data.client_id,
        research_activity_id: validResearchActivityId,
        research_activity_name: data.research_activity_name,
        direct_research_wages: data.direct_research_wages,
        supplies_expenses: data.supplies_expenses,
        contractor_expenses: data.contractor_expenses,
        total_qre: data.total_qre,
        subcomponent_count: data.subcomponent_count,
        subcomponent_groups: data.subcomponent_groups,
        applied_percent: data.applied_percent,
        line_49f_description: data.line_49f_description,
        ai_generation_timestamp: data.ai_generation_timestamp,
        ai_prompt_used: data.ai_prompt_used,
        industry_type: data.industry_type,
        focus_area: data.focus_area,
        general_description: data.general_description,
        data_snapshot: data.data_snapshot,
        is_latest: true
      };
      
      console.log('📝 [SECTION G SAVE] Record data prepared:', {
        hasDescription: !!recordData.line_49f_description,
        descriptionLength: recordData.line_49f_description?.length || 0,
        totalQre: recordData.total_qre,
        activityName: recordData.research_activity_name
      });
      
      if (existingRecord && !existingError) {
        // Update existing record
        console.log('🔄 [SECTION G SAVE] Updating existing record...');
        const { error: updateError } = await supabase
          .from('rd_federal_credit')
          .update(recordData)
          .eq('id', existingRecord.id);
        
        if (updateError) {
          console.error('❌ [SECTION G SAVE] Failed to update rd_federal_credit:', updateError);
          alert('❌ Failed to update Section G data. Please try again.');
        } else {
          console.log('✅ [SECTION G SAVE] Updated existing rd_federal_credit record successfully');
          alert('✅ Section G data updated successfully!');
        }
      } else {
        // Insert new record
        console.log('➕ [SECTION G SAVE] Inserting new record...');
        const { error: insertError } = await supabase
          .from('rd_federal_credit')
          .insert(recordData);
        
        if (insertError) {
          console.error('❌ [SECTION G SAVE] Failed to insert to rd_federal_credit:', insertError);
          alert('❌ Failed to save Section G data. Please try again.');
        } else {
          console.log('✅ [SECTION G SAVE] Inserted new rd_federal_credit record successfully');
          alert('✅ Section G data saved successfully!');
        }
      }
      
    } catch (error) {
      console.error('❌ [SECTION G SAVE] Unexpected error in saveToFederalCreditTable:', error);
      alert('❌ Unexpected error saving Section G data. Please try again.');
    }
  };

  if (loading) return <div>Loading Section G...</div>;

  // Helper to render only as many rows as there are activities
  const renderRows = (renderCells: (row: any, idx: number) => React.ReactNode) => {
    return rows.map((row, idx) => (
      <tr key={idx}>
        <td>{idx + 1}</td>
        {renderCells(row, idx)}
      </tr>
    ));
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <h4 style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Section G — Business Component Information</h4>
      {/* Section 1: 49(a)-(d) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>BC</th>
            <th>49(a)<br />EIN</th>
            <th>49(b)<br />NAICS</th>
            <th>49(c)<br />Name/ID</th>
            <th>49(d)<br />Type</th>
          </tr>
        </thead>
        <tbody>
          {renderRows((row, idx) => [
            <td key="ein"><input value={row.ein || ''} onChange={e => {}} style={{ width: 100 }} /></td>,
            <td key="naics"><input value={row.naics || ''} onChange={e => {}} style={{ width: 80 }} /></td>,
            <td key="name"><input value={row.name || ''} onChange={e => {}} style={{ width: 180 }} /></td>,
            <td key="type">
              <select value={row.type || 'Technique'} onChange={e => {}} style={{ width: 140 }}>
                {BUSINESS_COMPONENT_TYPES.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </td>
          ])}
        </tbody>
      </table>
      {/* Section 2: 49(e)-(f) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>BC</th>
            <th>49(e)<br />Software Type</th>
            <th>49(f)<br />Description</th>
          </tr>
        </thead>
        <tbody>
          {renderRows((row, idx) => [
            <td key="software">
              {row.type && row.type.includes('Software') ? (
                <select value={row.softwareType || ''} onChange={e => {}} style={{ width: 120 }}>
                  <option value=""></option>
                  {SOFTWARE_TYPES.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : null}
            </td>,
            <td key="description" style={{ minWidth: 700 }}>
              <textarea
                value={row.aiDescription || ''}
                onChange={e => {
                  const newRows = [...rows];
                  newRows[idx] = { ...newRows[idx], aiDescription: e.target.value };
                  setRows(newRows);
                }}
                maxLength={400}
                style={{ width: '100%', minWidth: 700, height: 64, resize: 'vertical' }}
              />
              <button
                style={{ marginTop: 4, padding: '4px 12px', fontSize: 14 }}
                onClick={async () => {
                  await saveToFederalCreditTable({
                    business_year_id: selectedYear.id,
                    client_id: clientId,
                    research_activity_id: row.id, // This will be validated in saveToFederalCreditTable
                    research_activity_name: row.name,
                    direct_research_wages: row.wages || 0,
                    supplies_expenses: row.supplies || 0,
                    contractor_expenses: row.contractResearch || 0,
                    total_qre: (row.wages || 0) + (row.supplies || 0) + (row.contractResearch || 0),
                    subcomponent_count: row.subcomponent_count || 0,
                    subcomponent_groups: row.subcomponent_groups || '',
                    applied_percent: row.applied_percent || 0,
                    line_49f_description: row.aiDescription || '',
                    ai_generation_timestamp: new Date().toISOString(),
                    ai_prompt_used: '',
                    industry_type: businessData?.industry,
                    focus_area: businessData?.focus,
                    general_description: row.general_description || '',
                    data_snapshot: row.data_snapshot || {},
                  });
                }}
              >Save</button>
            </td>
          ])}
        </tbody>
      </table>
      {/* Section 3: 50-53 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>BC</th>
            <th>50<br />Direct Research Wages</th>
            <th>51<br />Supervision Wages</th>
            <th>52<br />Support Wages</th>
            <th>53<br />Total Wages</th>
          </tr>
        </thead>
        <tbody>
          {renderRows((row, idx) => [
            <td key="wages"><input value={formatCurrency(row.wages)} onChange={e => {}} style={{ width: 100 }} /></td>,
            <td key="supervision"><input value={formatCurrency(row.supervision)} onChange={e => {}} style={{ width: 100 }} /></td>,
            <td key="support"><input value={formatCurrency(row.support)} onChange={e => {}} style={{ width: 100 }} /></td>,
            <td key="totalWages"><input value={formatCurrency((row.wages || 0) + (row.supervision || 0) + (row.support || 0))} onChange={e => {}} style={{ width: 100, fontWeight: 'bold' }} /></td>
          ])}
        </tbody>
      </table>
      {/* Section 4: 54-56 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>BC</th>
            <th>54<br />Supplies</th>
            <th>55<br />Rental/Lease</th>
            <th>56<br />Contract Research</th>
          </tr>
        </thead>
        <tbody>
          {renderRows((row, idx) => [
            <td key="supplies"><input type="text" value={formatCurrency(row.supplies || 0)} onChange={e => {}} style={{ width: 100 }} /></td>,
            <td key="rental"><input type="text" value={formatCurrency(row.rentalLease || 0)} onChange={e => {}} style={{ width: 100 }} /></td>,
            <td key="contract"><input type="text" value={formatCurrency(row.contractResearch || 0)} onChange={e => {}} style={{ width: 100 }} /></td>
          ])}
        </tbody>
      </table>
    </div>
  );
};

export default SectionGTable; 