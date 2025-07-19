import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
// aiService removed - using static content generation
import { SectionGQREService } from '../../services/sectionGQREService';

// Note: OpenAI API key should be configured in environment variables (VITE_OPENAI_API_KEY)

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

  useEffect(() => {
    if (!selectedYear?.id || !businessData?.id) return;
    loadSectionGData();
  }, [selectedYear?.id, businessData?.id]);

  const loadSectionGData = async () => {
    setLoading(true);
    try {
      console.log('%c[SECTION G DEBUG] Starting loadSectionGData', 'background: #0f0; color: #000; font-weight: bold;');
      console.log('%c[SECTION G DEBUG] Business year ID:', 'background: #0f0; color: #000; font-weight: bold;', selectedYear.id);
      console.log('%c[SECTION G DEBUG] Business data:', 'background: #0f0; color: #000; font-weight: bold;', businessData);
      
      // First, let's get the raw QRE data to debug
      console.log('%c[SECTION G DEBUG] Getting raw QRE data...', 'background: #0f0; color: #000; font-weight: bold;');
      const rawQREData = await SectionGQREService.getQREDataForSectionG(selectedYear.id);
      console.log('%c[SECTION G DEBUG] Raw QRE data:', 'background: #0f0; color: #000; font-weight: bold;', rawQREData);
      
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
      console.log('%c[SECTION G DEBUG] Grouped activities:', 'background: #0f0; color: #000; font-weight: bold;', activitiesWithQRE);
      
      if (!activitiesWithQRE || activitiesWithQRE.length === 0) {
        console.log('%c[SECTION G DEBUG] No activities with QRE found', 'background: #ff0; color: #000; font-weight: bold;');
        setRows([]);
        setLoading(false);
        return;
      }

      // Process each activity to build Section G rows
      const newRows = await Promise.all(
        activitiesWithQRE.map(async (activity, activityIndex) => {
          console.log(`%c[SECTION G DEBUG] Processing activity ${activityIndex + 1}:`, 'background: #0f0; color: #000; font-weight: bold;', activity);
          
          // Debug employee data
          console.log(`%c[SECTION G DEBUG] Activity ${activityIndex + 1} employees:`, 'background: #0f0; color: #000; font-weight: bold;', activity.employees);
          
          // Calculate QREs by type
          const directWages = activity.employees
            ?.filter(e => {
              const isOwner = e.is_owner;
              const isResearchLeader = e.role?.toLowerCase().includes('research leader');
              const isSupervisor = e.role?.toLowerCase().includes('supervisor');
              const isAdmin = e.role?.toLowerCase().includes('admin');
              
              console.log(`[SECTION G DEBUG] Employee ${e.name} (${e.role}):`, {
                isOwner,
                isResearchLeader,
                isSupervisor,
                isAdmin,
                calculated_qre: e.calculated_qre
              });
              
              // Include Research Leaders and owners in Direct Research Wages
              if (isOwner || isResearchLeader) {
                console.log(`[SECTION G DEBUG] Including ${e.name} in Direct Wages (owner: ${isOwner}, research leader: ${isResearchLeader})`);
                return true;
              }
              // Exclude supervisors and admins from Direct Research Wages
              if (isSupervisor || isAdmin) {
                console.log(`[SECTION G DEBUG] Excluding ${e.name} from Direct Wages (supervisor: ${isSupervisor}, admin: ${isAdmin})`);
                return false;
              }
              // Include other employees in Direct Research Wages
              console.log(`[SECTION G DEBUG] Including ${e.name} in Direct Wages (other employee)`);
              return true;
            })
            .reduce((sum, e) => {
              console.log(`[SECTION G DEBUG] Adding ${e.name} QRE to direct wages: ${e.calculated_qre}`);
              return sum + (e.calculated_qre || 0);
            }, 0) || 0;
          
          console.log(`[SECTION G DEBUG] Activity ${activityIndex + 1} direct wages total:`, directWages);
          
          const supervisionWages = activity.employees
            ?.filter(e => e.role?.toLowerCase().includes('supervisor'))
            .reduce((sum, e) => sum + (e.calculated_qre || 0), 0) || 0;
          
          const supportWages = activity.employees
            ?.filter(e => e.role?.toLowerCase().includes('admin'))
            .reduce((sum, e) => sum + (e.calculated_qre || 0), 0) || 0;
          
          const supplies = activity.supplies?.reduce((sum, s) => sum + (s.calculated_qre || 0), 0) || 0;
          const contractResearch = activity.contractors?.reduce((sum, c) => sum + (c.calculated_qre || 0), 0) || 0;
          const rentalLease = 0; // Manual entry
          
          console.log(`[SECTION G DEBUG] Activity ${activityIndex + 1} totals:`, {
            directWages,
            supervisionWages,
            supportWages,
            supplies,
            contractResearch
          });
          
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
            
            console.log('[SECTION G DEBUG] Subcomponent count calculation:', {
              employeeSubcomponents: activity.employees?.length || 0,
              contractorSubcomponents: activity.contractors?.length || 0,
              supplySubcomponents: activity.supplies?.length || 0,
              uniqueSubcomponentCount: actualSubcomponentCount
            });
            
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
            
            // Generate static description based on the line49fContext
            description = `The company evaluated ${line49fContext.subcomponent_count} ${line49fContext.subcomponent_groups} to resolve technical uncertainty in ${line49fContext.research_activity_name}. Experimental testing was conducted using systematic research methodologies within the ${line49fContext.industry} industry. ${line49fContext.guideline_notes || 'Research activities were performed in accordance with established protocols and regulatory requirements.'}`;
            
            // Save to rd_federal_credit table
            await saveToFederalCreditTable({
              business_year_id: selectedYear.id,
              client_id: clientId,
              research_activity_id: activity.activity_id,
              research_activity_name: activity.activity_title,
              direct_research_wages: activity.direct_research_wages || 0,
              supplies_expenses: activity.supplies_expenses || 0,
              contractor_expenses: activity.contractor_expenses || 0,
              total_qre: (activity.direct_research_wages || 0) + (activity.supplies_expenses || 0) + (activity.contractor_expenses || 0),
              subcomponent_count: actualSubcomponentCount,
              subcomponent_groups: line49fContext.subcomponent_groups,
              applied_percent: line49fContext.shrinkback_percent,
              line_49f_description: description,
              ai_generation_timestamp: new Date().toISOString(),
              ai_prompt_used: JSON.stringify(line49fContext),
              industry_type: businessData?.industry,
              focus_area: businessData?.focus,
              general_description: activity.general_description,
              data_snapshot: {
                activity_data: activity,
                qre_breakdown: {
                  employees: activity.employees,
                  contractors: activity.contractors,
                  supplies: activity.supplies
                },
                calculation_timestamp: new Date().toISOString()
              }
            });
            
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
      console.log('%c[SECTION G DEBUG] Final rows created:', 'background: #0f0; color: #000; font-weight: bold;', newRows);
    } catch (err) {
      console.error('%c[SECTION G ERROR] Unexpected error:', 'background: #f00; color: #fff; font-weight: bold;', err);
    }
    setLoading(false);
  };

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
      console.log('[SECTION G DEBUG] Attempting to save with business_year_id:', data.business_year_id);
      console.log('[SECTION G DEBUG] clientId:', clientId);
      
      // First, check if the business_year_id exists in the database
      const { data: businessYearCheck, error: checkError } = await supabase
        .from('business_years')
        .select('id, year')
        .eq('id', data.business_year_id)
        .single();
      
      if (checkError) {
        console.log('[SECTION G ERROR] Failed to check business_year_id:', checkError);
        console.log('[SECTION G DEBUG] Business year ID being used:', data.business_year_id);
        
        // If the business_year_id doesn't exist, try to find a valid business year for this client
        console.log('[SECTION G DEBUG] Attempting to find valid business year for client:', clientId);
        
        // Get the business_id for this client first
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('client_id', clientId)
          .single();
        
        if (businessError) {
          console.log('[SECTION G ERROR] Failed to find business for client:', businessError);
          return;
        }
        
        // Now get the business year for this business
        const { data: validBusinessYear, error: yearError } = await supabase
          .from('business_years')
          .select('id, year')
          .eq('business_id', businessData.id)
          .order('year', { ascending: false })
          .limit(1)
          .single();
        
        if (yearError) {
          console.log('[SECTION G ERROR] Failed to find valid business year:', yearError);
          return;
        }
        
        // Use the valid business year ID
        data.business_year_id = validBusinessYear.id;
        console.log('[SECTION G DEBUG] Using valid business year ID:', validBusinessYear.id);
      }
      
      // Now save to rd_federal_credit table
      const { error: insertError } = await supabase
        .from('rd_federal_credit')
        .insert({
          business_year_id: data.business_year_id,
          client_id: data.client_id,
          research_activity_id: data.research_activity_id,
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
        });
      
      if (insertError) {
        console.log('[SECTION G ERROR] Failed to save to rd_federal_credit:', insertError);
      } else {
        console.log('[SECTION G DEBUG] Successfully saved to rd_federal_credit table');
      }
    } catch (error) {
      console.error('[SECTION G ERROR] Unexpected error in saveToFederalCreditTable:', error);
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
                    research_activity_id: row.id,
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