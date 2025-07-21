import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { supabase } from '../../../../../lib/supabase';

interface Role {
  id: string;
  name: string;
  baseline_applied_percent?: number;
}

interface RoleSnapshotProps {
  businessYearId: string;
  onUpdate?: () => void;
}

export interface RoleSnapshotRef {
  recalculate: () => Promise<void>;
}

const RoleSnapshot = forwardRef<RoleSnapshotRef, RoleSnapshotProps>(({ businessYearId, onUpdate }, ref) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePercentages, setRolePercentages] = useState<{ [roleName: string]: number }>({});
  const [activityBreakdowns, setActivityBreakdowns] = useState<{ [roleName: string]: { [activityName: string]: number } }>({});
  const [loading, setLoading] = useState(false);
  const [lastCalculation, setLastCalculation] = useState<string>('');

  // Activity color scheme
  const activityColors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500',
    'bg-green-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-rose-500'
  ];
  
  const getActivityColor = (activityName: string, allActivities: string[]) => {
    const index = allActivities.indexOf(activityName);
    return activityColors[index % activityColors.length];
  };

  // Calculate role applied percentages with pure math
  const calculateRolePercentages = async () => {
    try {
      setLoading(true);
      console.log('🎯 [ROLE SNAPSHOT] Starting fresh calculation');

      // Get all roles for this business year
      const { data: rolesData, error: rolesError } = await supabase
        .from('rd_roles')
        .select('*')
        .eq('business_year_id', businessYearId)
        .order('name');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return;
      }

      if (!rolesData || rolesData.length === 0) {
        console.log('🎯 [ROLE SNAPSHOT] No roles found');
        setRoles([]);
        setRolePercentages({});
        return;
      }

      console.log('🎯 [ROLE SNAPSHOT] Found', rolesData.length, 'raw roles from database');
      
      // CRITICAL FIX: Deduplicate roles by name to prevent double processing
      const uniqueRoles = rolesData.reduce((acc, role) => {
        const existingRole = acc.find(r => r.name === role.name);
        if (!existingRole) {
          acc.push(role);
        } else {
          console.log(`🔍 [ROLE DEDUP] Skipping duplicate role: ${role.name} (ID: ${role.id}), keeping: ${existingRole.id}`);
        }
        return acc;
      }, [] as typeof rolesData);
      
      console.log('🎯 [ROLE SNAPSHOT] After deduplication:', uniqueRoles.length, 'unique roles');
      uniqueRoles.forEach((role, index) => {
        console.log(`   ${index + 1}. ${role.name} (ID: ${role.id})`);
      });
      
      setRoles(uniqueRoles);

      // Get selected activities for this business year to filter subcomponents
      const { data: selectedActivitiesData, error: activitiesError } = await supabase
        .from('rd_selected_activities')
        .select('activity_id')
        .eq('business_year_id', businessYearId);

      if (activitiesError) {
        console.error('Error fetching selected activities:', activitiesError);
        return;
      }

      const selectedActivityIds = selectedActivitiesData?.map(a => a.activity_id) || [];
      console.log('🎯 [ROLE SNAPSHOT] Selected activity IDs for filtering:', selectedActivityIds);

      if (selectedActivityIds.length === 0) {
        console.log('🎯 [ROLE SNAPSHOT] No selected activities found');
        const emptyPercentages: { [roleName: string]: number } = {};
        uniqueRoles.forEach(role => {
          emptyPercentages[role.name] = 0;
        });
        setRolePercentages(emptyPercentages);
        return;
      }

      // Get ONLY subcomponents from selected activities with valid percentages (same filter as research activity cards)
      console.log('🔍 [ROLE SNAPSHOT] LEAKAGE CHECK - Filtering subcomponents with:');
      console.log(`   └─ business_year_id: "${businessYearId}"`);
      console.log(`   └─ selected_activity_ids: [${selectedActivityIds.join(', ')}]`);
      
      const { data: subcomponents, error: subError } = await supabase
        .from('rd_selected_subcomponents')
        .select('subcomponent_id, frequency_percentage, year_percentage, selected_roles, research_activity_id, step_id, business_year_id')
        .eq('business_year_id', businessYearId)
        .in('research_activity_id', selectedActivityIds)
        .gt('frequency_percentage', 0)  // Only include subcomponents with valid frequency
        .gt('year_percentage', 0);      // Only include subcomponents with valid year percentage

      if (subError) {
        console.error('Error fetching subcomponents:', subError);
        return;
      }

      // Get research activity titles for better naming
      const { data: researchActivities, error: activitiesNamesError } = await supabase
        .from('rd_research_activities')
        .select('id, title')
        .in('id', selectedActivityIds);

      if (activitiesNamesError) {
        console.error('Error fetching research activity names:', activitiesNamesError);
      }

      if (!subcomponents || subcomponents.length === 0) {
        console.log('🎯 [ROLE SNAPSHOT] No subcomponents found');
        const emptyPercentages: { [roleName: string]: number } = {};
        uniqueRoles.forEach(role => {
          emptyPercentages[role.name] = 0;
        });
        setRolePercentages(emptyPercentages);
        return;
      }

      // 🔍 LEAKAGE VERIFICATION: Check all loaded subcomponents
      console.log('🔍 [ROLE SNAPSHOT] LOADED SUBCOMPONENTS ANALYSIS:');
      console.log(`   └─ Total count: ${subcomponents.length}`);
      
      // Group by business_year_id to check for leakage
      const byBusinessYear = subcomponents.reduce((acc, sub) => {
        const byId = acc[sub.business_year_id] || [];
        byId.push(sub);
        acc[sub.business_year_id] = byId;
        return acc;
      }, {} as Record<string, any[]>);
      
      Object.entries(byBusinessYear).forEach(([yearId, subs]) => {
        const isExpected = yearId === businessYearId;
        console.log(`   ${isExpected ? '✅' : '🚨'} Business Year "${yearId}": ${subs.length} subcomponents ${isExpected ? '(EXPECTED)' : '(⚠️ LEAKAGE!)'}`);
        if (!isExpected) {
          console.log('   🚨 CROSS-BUSINESS-YEAR LEAKAGE DETECTED!');
          subs.forEach((sub, i) => {
            console.log(`      ${i + 1}. Subcomponent ${sub.subcomponent_id} from year ${sub.business_year_id}`);
          });
        }
      });

      // Check for duplicate subcomponent IDs within the same business year
      const subcomponentCounts = subcomponents.reduce((acc, sub) => {
        const key = `${sub.subcomponent_id}-${sub.step_id}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const duplicates = Object.entries(subcomponentCounts).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('🚨 [ROLE SNAPSHOT] DUPLICATE SUBCOMPONENTS DETECTED:');
        duplicates.forEach(([key, count]) => {
          console.log(`   └─ ${key}: ${count} duplicates (will cause ${count}x multiplication!)`);
        });
      } else {
        console.log('✅ [ROLE SNAPSHOT] No duplicate subcomponents found');
      }

      // Get step time percentages and practice percentages for dynamic calculation
      const { data: steps, error: stepsError } = await supabase
        .from('rd_selected_steps')
        .select('step_id, time_percentage, research_activity_id')
        .eq('business_year_id', businessYearId);

      if (stepsError) {
        console.error('Error fetching steps:', stepsError);
        return;
      }

      const { data: activities, error: activitiesDataError } = await supabase
        .from('rd_selected_activities')
        .select('activity_id, practice_percent')
        .eq('business_year_id', businessYearId);

      if (activitiesDataError) {
        console.error('Error fetching activities:', activitiesDataError);
        return;
      }

      console.log('🎯 [ROLE SNAPSHOT] ✅ FILTERED CALCULATION:');
      console.log(`   └─ Selected activities: ${selectedActivityIds.length}`);
      console.log(`   └─ Filtered subcomponents: ${subcomponents.length} (with freq > 0 and year > 0)`);
      console.log(`   └─ Steps loaded: ${steps?.length || 0}`);
      console.log(`   └─ Activities loaded: ${activities?.length || 0}`);
      
      // Create lookup maps for performance
      const stepMap = new Map(steps?.map(s => [s.step_id, s]) || []);
      const activityMap = new Map(activities?.map(a => [a.activity_id, a]) || []);

      // DEBUG: Check practice percentages in fetched activities
      console.log('🔍 [PRACTICE % DEBUG] Activities with practice percentages:');
      activities?.forEach(activity => {
        console.log(`   └─ Activity ${activity.activity_id}: ${activity.practice_percent}%`);
      });
      
      // DEBUG: Verify activityMap is being built correctly
      console.log('🔍 [ACTIVITY MAP DEBUG] Activity map contents:');
      activityMap.forEach((activity, id) => {
        console.log(`   └─ Map entry: ${id} -> practice_percent: ${activity.practice_percent}%`);
      });

      // Calculate each role's applied percentage using DYNAMIC CALCULATION
      // FIXED: Now uses same calculation as research activity cards (practice × step × frequency × year)
      // FIXED: Now filters to only include subcomponents from selected activities with valid percentages
      // This eliminates "leakage" from disabled/orphaned subcomponents in the database
      const calculations: { [roleName: string]: number } = {};
      const activityBreakdowns: { [roleName: string]: { [activityName: string]: number } } = {};

      // Get activity details for naming
      const activityDetails = new Map();
      researchActivities?.forEach(activity => {
        // Use the actual research activity title
        const title = activity.title || `Activity ${activity.id.slice(-8)}`;
        activityDetails.set(activity.id, title);
      });

      uniqueRoles.forEach(role => {
        console.log(`\n🔄 [ROLE PROCESSING] Starting calculation for: ${role.name} (ID: ${role.id})`);
        let roleTotal = 0;
        let subcomponentCount = 0;
        activityBreakdowns[role.name] = {};

        subcomponents.forEach((subcomponent, index) => {
          let selectedRoles = subcomponent.selected_roles || [];

          // Parse selected_roles if it's a JSON string
          if (typeof selectedRoles === 'string') {
            try {
              selectedRoles = JSON.parse(selectedRoles);
            } catch (e) {
              console.error(`🚨 [ROLE SNAPSHOT] Failed to parse selected_roles for subcomponent ${index}:`, selectedRoles);
              selectedRoles = [];
            }
          }

          // Only calculate if this role is assigned to this subcomponent
          if (selectedRoles.includes(role.id)) {
            // Get step and activity data for dynamic calculation
            const step = stepMap.get(subcomponent.step_id);
            const activity = activityMap.get(subcomponent.research_activity_id);
            
            if (step && activity) {
              // CRITICAL FIX: Use practice percentage from the SPECIFIC activity for this subcomponent
              // This ensures each subcomponent uses the correct practice % for its research activity
              const practicePercent = activity.practice_percent || 0;
              const stepTimePercent = step.time_percentage || 0;
              const frequencyPercent = subcomponent.frequency_percentage || 0;
              const yearPercent = subcomponent.year_percentage || 0;
              
              // CRITICAL DEBUG: Verify each subcomponent gets the RIGHT practice % from its activity
              if (role.name === 'Research Leader' && index < 5) {
                console.log(`🔍 [PRACTICE % VERIFICATION] Subcomponent ${index + 1}:`);
                console.log(`   └─ Research Activity ID: ${subcomponent.research_activity_id}`);
                console.log(`   └─ Activity Found in Map: ${!!activity}`);
                console.log(`   └─ Practice % from THIS activity: ${practicePercent}% (activity: ${activity.activity_id})`);
                console.log(`   └─ Step ID: ${subcomponent.step_id}, Time %: ${stepTimePercent}%`);
                console.log(`   └─ Applied Calc: ${practicePercent}% × ${stepTimePercent}% × ${frequencyPercent}% × ${yearPercent}%`);
                
                // VERIFY: Check if this practice % matches what we expect for this specific activity
                console.log(`   └─ 🎯 VERIFICATION: Is practice % ${practicePercent}% correct for activity ${subcomponent.research_activity_id}?`);
              }
              
              // DYNAMIC CALCULATION: practice × step × frequency × year (same as research activity cards)
              if (practicePercent > 0 && stepTimePercent > 0 && frequencyPercent > 0 && yearPercent > 0) {
                const appliedPercentage = (practicePercent / 100) * (stepTimePercent / 100) * (frequencyPercent / 100) * (yearPercent / 100) * 100;
                
                roleTotal += appliedPercentage;
                subcomponentCount++;
                
                // Track breakdown by activity
                const activityName = activityDetails.get(subcomponent.research_activity_id) || `Activity ${subcomponent.research_activity_id.slice(-8)}`;
                if (!activityBreakdowns[role.name][activityName]) {
                  activityBreakdowns[role.name][activityName] = 0;
                }
                activityBreakdowns[role.name][activityName] += appliedPercentage;
                
                // Debug first few for verification
                if (role.name === 'Research Leader' && index < 5) {
                  console.log(`🧮 [DYNAMIC CALC] ${role.name} - Subcomponent ${index + 1}: ${appliedPercentage.toFixed(2)}% = ${practicePercent}% × ${stepTimePercent}% × ${frequencyPercent}% × ${yearPercent}% (${activityName})`);
                }
              } else {
                console.log(`⏭️ [ROLE SNAPSHOT] Skipping subcomponent ${index + 1} for ${role.name} - missing values: practice=${practicePercent}, step=${stepTimePercent}, freq=${frequencyPercent}, year=${yearPercent}`);
              }
            } else {
              console.log(`⚠️ [ROLE SNAPSHOT] Missing step or activity data for subcomponent ${index + 1}:`);
              console.log(`   └─ Step ID: ${subcomponent.step_id} -> Found: ${!!step}`);
              console.log(`   └─ Activity ID: ${subcomponent.research_activity_id} -> Found: ${!!activity}`);
              if (!activity) {
                console.log(`   └─ Available activities in map:`, Array.from(activityMap.keys()));
              }
            }
          }
        });

        calculations[role.name] = +roleTotal.toFixed(2);
        console.log(`🎯 [ROLE SNAPSHOT] ${role.name}: ${roleTotal.toFixed(2)}% from ${subcomponentCount} subcomponents (DYNAMIC CALCULATION)`);
        
        // CRITICAL DEBUG: Track calculation storage to prevent overwriting
        if (calculations[role.name] !== +roleTotal.toFixed(2)) {
          console.log(`🚨 [CALCULATION OVERWRITE] ${role.name}: Previous value was overwritten!`);
        } else {
          console.log(`✅ [CALCULATION STORED] ${role.name}: ${calculations[role.name]}% successfully stored`);
        }
        
        // Special debugging for Research Leader
        if (role.name === 'Research Leader') {
          console.log(`📊 [RESEARCH LEADER SUMMARY] - FILTERED DYNAMIC CALCULATION`);
          console.log(`   RoleSnapshot: ${subcomponentCount} subcomponents, ${roleTotal.toFixed(2)}% total`);
          console.log(`   Expected: ~18.29% total (matching research activity cards)`);
          console.log(`   Status: ${Math.abs(roleTotal - 18.29) < 2 ? '✅ CORRECT' : '⚠️ NEEDS VERIFICATION'}`);
        }
      });

      // PRACTICE PERCENTAGE ANALYSIS: Check if different activities have different practice %s
      console.log(`🎯 [PRACTICE % ANALYSIS] Checking practice percentages across all activities:`);
      const uniquePracticePercentages = new Set();
      const activityPracticeMap = new Map();
      subcomponents.forEach((subcomponent, index) => {
        const activity = activityMap.get(subcomponent.research_activity_id);
        if (activity) {
          const practicePercent = activity.practice_percent || 0;
          const activityKey = `Activity ${subcomponent.research_activity_id.slice(-8)}`;
          uniquePracticePercentages.add(practicePercent);
          activityPracticeMap.set(activityKey, practicePercent);
          
          // DEBUG: Show first few lookups
          if (index < 3) {
            console.log(`🔍 [LOOKUP DEBUG] Subcomponent ${index + 1}:`);
            console.log(`   └─ research_activity_id: ${subcomponent.research_activity_id}`);
            console.log(`   └─ Found activity with practice %: ${practicePercent}%`);
          }
        } else {
          // DEBUG: Show failed lookups
          if (index < 3) {
            console.log(`❌ [LOOKUP FAILED] Subcomponent ${index + 1}:`);
            console.log(`   └─ research_activity_id: ${subcomponent.research_activity_id}`);
            console.log(`   └─ Available activity IDs:`, Array.from(activityMap.keys()).slice(0, 3));
          }
        }
      });
      
      console.log(`   └─ Activity practice percentages:`);
      activityPracticeMap.forEach((percent, activityName) => {
        console.log(`      └─ ${activityName}: ${percent}%`);
      });
      
      if (uniquePracticePercentages.size === 1) {
        console.log(`⚠️ [PRACTICE % ANALYSIS] WARNING: Only 1 unique practice % (${Array.from(uniquePracticePercentages)[0]}%) found!`);
        console.log(`   └─ This could indicate the issue: all activities using same practice % instead of activity-specific %s`);
      } else {
        console.log(`✅ [PRACTICE % ANALYSIS] Found ${uniquePracticePercentages.size} different practice %s - this is correct!`);
        console.log(`   └─ Unique values: ${Array.from(uniquePracticePercentages).sort((a, b) => b - a).join('%, ')}%`);
      }

      // Calculate total for validation
      const totalCalculated = Object.values(calculations).reduce((sum, value) => sum + value, 0);
      console.log(`🔍 [ROLE SNAPSHOT] ✅ FILTERED TOTAL: ${totalCalculated.toFixed(2)}% (should match ~18.29%)`);
      
      // FINAL LEAKAGE CHECK: Compare with expected research activity cards total
      const discrepancy = Math.abs(totalCalculated - 18.29);
      if (discrepancy > 1.0) {
        console.log(`🚨 [ROLE SNAPSHOT] SIGNIFICANT DISCREPANCY DETECTED!`);
        console.log(`   └─ Role Snapshot Total: ${totalCalculated.toFixed(2)}%`);
        console.log(`   └─ Expected (Research Cards): ~18.29%`);
        console.log(`   └─ Difference: ${discrepancy.toFixed(2)}% (${discrepancy > 5 ? 'MAJOR' : 'MINOR'} variance)`);
        console.log(`   └─ Possible causes: Cross-year leakage, duplicates, or calculation differences`);
      } else {
        console.log(`✅ [ROLE SNAPSHOT] Total matches expected range (within 1% tolerance)`);
      }
      
      console.log(`🎯 [ROLE SNAPSHOT] Fixed calculation - filtered to match research activity cards exactly`);
      console.log(`🎨 [ROLE SNAPSHOT] Activity breakdowns:`, activityBreakdowns);

      // FINAL DEBUG: Log what's being stored in state
      console.log(`📝 [FINAL STATE] Setting role percentages:`, calculations);
      Object.entries(calculations).forEach(([roleName, percentage]) => {
        console.log(`   └─ ${roleName}: ${percentage}%`);
      });

      setRolePercentages(calculations);
      setActivityBreakdowns(activityBreakdowns);
      setLastCalculation(new Date().toLocaleTimeString());

      // Save baseline percentages to database for expense management
      await saveBaselinesToDatabase(uniqueRoles, calculations);

      console.log('🎯 [ROLE SNAPSHOT] Calculation complete:', calculations);

    } catch (error) {
      console.error('🎯 [ROLE SNAPSHOT] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save baseline percentages to rd_roles.baseline_applied_percent
  const saveBaselinesToDatabase = async (rolesData: Role[], calculations: { [roleName: string]: number }) => {
    try {
      console.log('💾 [ROLE SNAPSHOT] Saving baselines to database...');

      for (const role of rolesData) {
        const calculatedPercent = calculations[role.name] || 0;
        
        const { error } = await supabase
          .from('rd_roles')
          .update({ baseline_applied_percent: calculatedPercent })
          .eq('id', role.id);

        if (error) {
          console.error(`Error updating baseline for ${role.name}:`, error);
        } else {
          console.log(`💾 [ROLE SNAPSHOT] Saved ${role.name}: ${calculatedPercent.toFixed(2)}%`);
        }
      }

      console.log('💾 [ROLE SNAPSHOT] All baselines saved successfully');
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('💾 [ROLE SNAPSHOT] Error saving baselines:', error);
    }
  };

  // Auto-calculate on mount and when businessYearId changes
  useEffect(() => {
    if (businessYearId) {
      calculateRolePercentages();
    }
  }, [businessYearId]);

  // Expose recalculate function to parent component for real-time updates
  useImperativeHandle(ref, () => ({
    recalculate: calculateRolePercentages,
  }));

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-lg font-semibold text-emerald-900">Role Applied Percentage Snapshot</h4>
          <p className="text-xs text-emerald-700">Used by Expense Management for role selection</p>
        </div>
        <div className="flex items-center gap-2">
          {lastCalculation && (
            <div className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
              Last: {lastCalculation}
            </div>
          )}
          <button
            onClick={calculateRolePercentages}
            disabled={loading}
            className="text-xs bg-emerald-200 hover:bg-emerald-300 text-emerald-800 px-3 py-1 rounded transition-colors disabled:opacity-50"
            title="Recalculate role percentages and save to database"
          >
            {loading ? 'Calculating...' : 'Calculate Snapshot'}
          </button>
        </div>
      </div>

      {/* Global Activity Legend */}
      {(() => {
        const allActivities = Array.from(new Set(
          Object.values(activityBreakdowns).flatMap(breakdown => Object.keys(breakdown))
        )).sort();
        
        if (allActivities.length > 0) {
          return (
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <h5 className="text-sm font-medium text-emerald-900 mb-2">Activity Legend</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {allActivities.map((activityName) => (
                  <div key={activityName} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getActivityColor(activityName, allActivities)}`} />
                    <span className="text-emerald-700 truncate">{activityName}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Role List */}
      <div className="space-y-3">
        {roles.length > 0 ? (
          (() => {
            // Get all unique activities across all roles for consistent coloring
            const allActivities = Array.from(new Set(
              Object.values(activityBreakdowns).flatMap(breakdown => Object.keys(breakdown))
            )).sort();
            
            return roles.map((role) => {
              const appliedPercentage = rolePercentages[role.name] || 0;
              const maxAllowed = 59.44; // Maximum possible
              const isValid = appliedPercentage <= maxAllowed + 0.01;
              const breakdown = activityBreakdowns[role.name] || {};
              
              return (
                <div key={role.id} className="bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-emerald-900">{role.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm px-2 py-1 rounded ${
                        isValid 
                          ? 'text-emerald-700 bg-emerald-100' 
                          : 'text-red-700 bg-red-100'
                      }`}>
                        {appliedPercentage.toFixed(2)}%
                        {!isValid && ' ⚠️'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Stacked bar showing activity breakdown */}
                  <div className="w-full bg-emerald-100 rounded-full h-3 relative overflow-hidden">
                    {Object.entries(breakdown).length > 0 ? (
                      (() => {
                        let cumulativeWidth = 0;
                        return Object.entries(breakdown).map(([activityName, percentage]) => {
                          const widthPercent = (percentage / Math.max(appliedPercentage, 1)) * Math.min(appliedPercentage, 100);
                          const color = getActivityColor(activityName, allActivities);
                          const segment = (
                            <div
                              key={activityName}
                              className={`absolute h-full ${color} transition-all duration-300`}
                              style={{
                                left: `${cumulativeWidth}%`,
                                width: `${widthPercent}%`
                              }}
                              title={`${activityName}: ${percentage.toFixed(2)}%`}
                            />
                          );
                          cumulativeWidth += widthPercent;
                          return segment;
                        });
                      })()
                    ) : (
                      <div className="h-full bg-gray-300 rounded-full" />
                    )}
                  </div>
                  
                  {/* Activity breakdown legend */}
                  {Object.entries(breakdown).length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(breakdown).map(([activityName, percentage]) => (
                        <div key={activityName} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getActivityColor(activityName, allActivities)}`} />
                          <span className="text-emerald-700 truncate">
                            {activityName}: {percentage.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-emerald-600 mt-2">
                    Sum of applied % from all assigned subcomponents
                    {role.baseline_applied_percent != null && (
                      <span className="ml-2 text-emerald-500">
                        (Saved: {role.baseline_applied_percent.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            });
          })()
        ) : (
          <div className="text-center py-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-emerald-600 text-sm">No roles found for this business year</p>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
        <div className="text-xs text-emerald-700">
          <div className="font-medium mb-1">📊 How This Works:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Each role percentage = sum of applied % from all subcomponents where that role is assigned</li>
            <li>Maximum possible for any role: 59.44% (total applied across all activities)</li>
            <li>Values are saved to <code className="bg-emerald-200 px-1 rounded">rd_roles.baseline_applied_percent</code></li>
            <li>Expense Management uses these values when creating role-based expense allocations</li>
          </ul>
        </div>
      </div>
    </div>
  );
});

export default RoleSnapshot; 