import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Info, Calendar, MoveHorizontal, GitMerge } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditFocusModalProps {
  isOpen: boolean;
  focus: { id: string; name: string; area_id: string; } | null;
  onClose: () => void;
  onSave: () => void;
  categories: Array<{ id: string; name: string; }>;
  areas: Array<{ id: string; name: string; category_id: string; }>;
  businessId?: string; // For loading other focuses to merge with
}

interface AffectedBusinessYear {
  id: string;
  business_name: string;
  year: number;
  activity_count: number;
}

const EditFocusModal: React.FC<EditFocusModalProps> = ({
  isOpen,
  focus,
  onClose,
  onSave,
  categories,
  areas,
  businessId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    area_id: '',
    category_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [impactWarning, setImpactWarning] = useState<number>(0);
  const [affectedBusinessYears, setAffectedBusinessYears] = useState<AffectedBusinessYear[]>([]);
  const [updateSnapshots, setUpdateSnapshots] = useState(false);
  
  // Merge functionality states
  const [showMergeSection, setShowMergeSection] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [mergeConfirmation, setMergeConfirmation] = useState('');
  const [availableFocuses, setAvailableFocuses] = useState<Array<{ id: string; name: string; area_id: string; area_name?: string; category_name?: string; }>>([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  
  // Conflict resolution states
  const [conflictingActivities, setConflictingActivities] = useState<string[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictResolution, setConflictResolution] = useState<'merge' | 'cancel' | null>(null);

  useEffect(() => {
    if (focus) {
      const currentArea = areas.find(a => a.id === focus.area_id);
      const currentCategory = currentArea ? categories.find(c => c.id === currentArea.category_id) : null;

      setFormData({
        name: focus.name,
        area_id: focus.area_id,
        category_id: currentCategory?.id || ''
      });
      setError(null);
      setConflictWarning(null);
      checkImpact();
      checkAffectedBusinessYears();
      
      // Reset conflict states
      setShowConflictDialog(false);
      setConflictingActivities([]);
      setConflictResolution(null);
    }
  }, [focus, areas, categories]);

  // Load available focuses for merging
  useEffect(() => {
    if (isOpen && focus) {
      loadAvailableFocuses();
    }
  }, [isOpen, businessId, focus]);

  // Reset conflict states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowConflictDialog(false);
      setConflictingActivities([]);
      setConflictResolution(null);
      setMergeTargetId('');
      setMergeConfirmation('');
    }
  }, [isOpen]);

  const loadAvailableFocuses = async () => {
    if (!focus) return;
    
    try {
      // Build query for business-specific OR global focuses
      let query = supabase
        .from('rd_focuses')
        .select(`
          id, 
          name, 
          area_id,
          area:rd_areas (
            name,
            category:rd_research_categories (
              name
            )
          )
        `)
        .neq('id', focus.id); // Exclude current focus
      
      // For now, focuses don't have business_id, so load all focuses
      // In future, you might want to add business_id to rd_focuses table
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format the data with area and category names
      const formattedFocuses = (data || []).map(f => ({
        id: f.id,
        name: f.name,
        area_id: f.area_id,
        area_name: f.area?.name || 'Unknown Area',
        category_name: f.area?.category?.name || 'Unknown Category'
      }));
      
      setAvailableFocuses(formattedFocuses);
      
      // Check for duplicate focus names (potential source of confusion)
      const focusNames = formattedFocuses.map(f => f.name);
      const duplicateNames = focusNames.filter((name, index) => focusNames.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        console.warn('⚠️ DUPLICATE FOCUS NAMES DETECTED:', {
          duplicates: [...new Set(duplicateNames)],
          allFocuses: formattedFocuses.map(f => ({ id: f.id, name: f.name, area: f.area_name }))
        });
      }
    } catch (err) {
      console.error('Error loading focuses for merge:', err);
    }
  };

  // Check impact of changing focus area
  const checkImpact = async () => {
    if (!focus) return;
    
    try {
      const { data, error } = await supabase
        .from('rd_research_activities')
        .select('id')
        .eq('focus_id', focus.id);

      if (error) {
        console.error('Error checking focus impact:', error);
        return;
      }

      setImpactWarning(data?.length || 0);
    } catch (err) {
      console.error('Error checking focus impact:', err);
    }
  };

  // Check which business years have snapshots that will be affected
  const checkAffectedBusinessYears = async () => {
    if (!focus) return;

    try {
      // Get business years that have activities using this focus
      const { data, error } = await supabase
        .from('rd_selected_activities')
        .select(`
          business_year_id,
          rd_business_years!inner(
            id,
            year,
            rd_businesses!inner(
              name
            )
          ),
          rd_research_activities!inner(
            focus_id
          )
        `)
        .eq('rd_research_activities.focus_id', focus.id);

      if (error) {
        console.error('Error checking affected business years:', error);
        setAffectedBusinessYears([]);
        return;
      }

      // Group by business year and count activities
      const groupedData = data?.reduce((acc, item) => {
        const yearKey = `${item.business_year_id}`;
        if (!acc[yearKey]) {
          acc[yearKey] = {
            id: item.business_year_id,
            business_name: item.rd_business_years.rd_businesses.name,
            year: item.rd_business_years.year,
            activity_count: 0
          };
        }
        acc[yearKey].activity_count++;
        return acc;
      }, {} as Record<string, AffectedBusinessYear>);

      setAffectedBusinessYears(Object.values(groupedData || {}));
    } catch (err) {
      console.error('Error checking affected business years:', err);
    }
  };

  // Check for naming conflicts when area changes
  useEffect(() => {
    const checkConflict = async () => {
      if (!formData.name.trim() || !formData.area_id || !focus) {
        setConflictWarning(null);
        return;
      }

      // Skip check if nothing changed
      if (formData.name === focus.name && formData.area_id === focus.area_id) {
        setConflictWarning(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('rd_focuses')
          .select('id, name')
          .eq('name', formData.name.trim())
          .eq('area_id', formData.area_id)
          .neq('id', focus.id)
          .limit(1);

        if (error) {
          console.error('Error checking for conflicts:', error);
          return;
        }

        if (data && data.length > 0) {
          const currentArea = areas.find(a => a.id === formData.area_id);
          setConflictWarning(
            `A focus with the name "${formData.name}" already exists in the "${currentArea?.name}" area. Please choose a different name or area.`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.error('Error checking for conflicts:', err);
      }
    };

    const timeoutId = setTimeout(checkConflict, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.name, formData.area_id, focus, areas]);

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      area_id: ''
    }));
  };

  const handleAreaChange = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      area_id: areaId
    }));
  };

  const availableAreas = formData.category_id 
    ? areas.filter(area => area.category_id === formData.category_id)
    : areas;

  // Handle conflict resolution - merge conflicting activities
  const handleConflictResolution = async () => {
    if (conflictResolution === 'cancel') {
      setShowConflictDialog(false);
      setConflictingActivities([]);
      setConflictResolution(null);
      return;
    }

    if (conflictResolution === 'merge') {
      setMergeLoading(true);
      try {
        // Get full activity data for conflicting activities (including inactive ones)
        console.log('🔍 Getting activity data for conflicts (including inactive)...');
        const { data: sourceActivities } = await supabase
          .from('rd_research_activities')
          .select('id, title, is_active')
          .eq('focus_id', focus?.id)
          .in('title', conflictingActivities);

        const { data: targetActivities } = await supabase
          .from('rd_research_activities')
          .select('id, title, is_active')
          .eq('focus_id', mergeTargetId)
          .in('title', conflictingActivities);

        console.log('🔄 Merging conflicting activities before focus merge...');
        console.log('📋 Conflicting activity titles to merge:', conflictingActivities);
        console.log('📊 Source activities found:', sourceActivities?.map(a => `${a.title} (${a.id}, ${a.is_active ? 'active' : 'inactive'})`));
        console.log('📊 Target activities found:', targetActivities?.map(a => `${a.title} (${a.id}, ${a.is_active ? 'active' : 'inactive'})`));

        // For each conflicting activity title, resolve all conflicts
        for (const conflictTitle of conflictingActivities) {
          const sourceActivitiesForTitle = sourceActivities?.filter(a => a.title === conflictTitle) || [];
          const targetActivitiesForTitle = targetActivities?.filter(a => a.title === conflictTitle) || [];

          console.log(`🔍 Processing conflict "${conflictTitle}":`, {
            sourceCount: sourceActivitiesForTitle.length,
            targetCount: targetActivitiesForTitle.length,
            sourceActivities: sourceActivitiesForTitle.map(a => `${a.id} (${a.is_active ? 'active' : 'inactive'})`),
            targetActivities: targetActivitiesForTitle.map(a => `${a.id} (${a.is_active ? 'active' : 'inactive'})`)
          });

          if (sourceActivitiesForTitle.length === 0) {
            console.warn(`⚠️ No source activities found for "${conflictTitle}"`);
            continue;
          }

          // Find the best target activity (prefer active ones)
          let bestTargetActivity = targetActivitiesForTitle.find(a => a.is_active);
          if (!bestTargetActivity && targetActivitiesForTitle.length > 0) {
            bestTargetActivity = targetActivitiesForTitle[0]; // Use first inactive if no active
          }

          if (!bestTargetActivity) {
            console.warn(`⚠️ No target activity found for "${conflictTitle}" - this should not happen!`);
            continue;
          }

          console.log(`🎯 Using target activity: ${bestTargetActivity.id} (${bestTargetActivity.is_active ? 'active' : 'inactive'})`);

          // Merge all source activities into the best target
          for (const sourceActivity of sourceActivitiesForTitle) {
            console.log(`🔄 Merging source activity "${conflictTitle}": ${sourceActivity.id} → ${bestTargetActivity.id}`);

            // Only merge if source is different from target
            if (sourceActivity.id !== bestTargetActivity.id) {
              // Move all steps from source activity to target activity
              const { error: stepsError } = await supabase
                .from('rd_research_steps')
                .update({ research_activity_id: bestTargetActivity.id })
                .eq('research_activity_id', sourceActivity.id);

              if (stepsError) {
                console.error('❌ Error moving steps:', stepsError);
                throw stepsError;
              }
              console.log(`✅ Moved steps from ${sourceActivity.id} to ${bestTargetActivity.id}`);

              // Update selected activities references
              const { error: selectedActivitiesError } = await supabase
                .from('rd_selected_activities')
                .update({ activity_id: bestTargetActivity.id })
                .eq('activity_id', sourceActivity.id);

              if (selectedActivitiesError) {
                console.warn('Could not update selected activities:', selectedActivitiesError);
              } else {
                console.log(`✅ Updated selected activities references`);
              }

              // Update federal credit references
              const { error: federalCreditError } = await supabase
                .from('rd_federal_credit')
                .update({ research_activity_name: bestTargetActivity.title })
                .eq('research_activity_name', sourceActivity.title);

              if (federalCreditError) {
                console.warn('Could not update federal credit references:', federalCreditError);
              } else {
                console.log(`✅ Updated federal credit references`);
              }

              // Delete the source activity completely (since all data has been moved)
              // This is CRITICAL to avoid constraint violations - deactivated activities still trigger unique constraints
              console.log(`🗑️ Deleting source activity ${sourceActivity.id} (all data moved, must delete to avoid constraint violation)`);
              const { error: deleteError } = await supabase
                .from('rd_research_activities')
                .delete()
                .eq('id', sourceActivity.id);

              if (deleteError) {
                console.error('❌ Error deleting source activity:', deleteError);
                // Fall back to deactivation if deletion fails
                console.log('🔄 Falling back to deactivation...');
                const { error: deactivateError } = await supabase
                  .from('rd_research_activities')
                  .update({ 
                    is_active: false, 
                    deactivated_at: new Date().toISOString(),
                    deactivation_reason: `Merged into ${bestTargetActivity.title} (${bestTargetActivity.id}) during focus merge - deletion failed`
                  })
                  .eq('id', sourceActivity.id);
                
                if (deactivateError) {
                  console.error('❌ Error deactivating source activity as fallback:', deactivateError);
                  throw deactivateError;
                }
                console.log(`✅ Deactivated source activity ${sourceActivity.id} (fallback)`);
              } else {
                console.log(`✅ Deleted source activity ${sourceActivity.id}`);
              }
            }
          }

          // Delete all other target activities with the same title (except the best one)
          const otherTargetActivities = targetActivitiesForTitle.filter(a => a.id !== bestTargetActivity.id);
          for (const otherActivity of otherTargetActivities) {
            console.log(`🗑️ Deleting redundant target activity: ${otherActivity.id} (same title as best target)`);
            
            const { error: deleteError } = await supabase
              .from('rd_research_activities')
              .delete()
              .eq('id', otherActivity.id);

            if (deleteError) {
              console.error('❌ Error deleting redundant target activity:', deleteError);
              // Fall back to deactivation
              console.log('🔄 Falling back to deactivation for redundant target activity...');
              const { error: deactivateError } = await supabase
                .from('rd_research_activities')
                .update({ 
                  is_active: false, 
                  deactivated_at: new Date().toISOString(),
                  deactivation_reason: `Deactivated during focus merge - redundant with ${bestTargetActivity.id} - deletion failed`
                })
                .eq('id', otherActivity.id);
              
              if (deactivateError) {
                console.error('❌ Error deactivating redundant target activity as fallback:', deactivateError);
                // Don't throw - this is not critical
              } else {
                console.log(`✅ Deactivated redundant target activity ${otherActivity.id} (fallback)`);
              }
            } else {
              console.log(`✅ Deleted redundant target activity ${otherActivity.id}`);
            }
          }
        }

        console.log('✅ Successfully merged conflicting activities');
        console.log('💡 NOTE: Source activities were DELETED (not just deactivated) to avoid constraint violations');
        
        // Verify no conflicts remain after merge
        console.log('🔍 Re-checking for remaining conflicts after activity merges (checking ALL activities)...');
        const { data: remainingSourceActivities } = await supabase
          .from('rd_research_activities')
          .select('id, title, is_active')
          .eq('focus_id', focus?.id);

        const { data: remainingTargetActivities } = await supabase
          .from('rd_research_activities')
          .select('id, title, is_active')
          .eq('focus_id', mergeTargetId);

        console.log('📊 Remaining activities in source focus:', remainingSourceActivities?.map(a => `${a.title} (${a.is_active ? 'active' : 'inactive'})`));
        console.log('📊 Remaining activities in target focus:', remainingTargetActivities?.map(a => `${a.title} (${a.is_active ? 'active' : 'inactive'})`));
        console.log('💡 EXPECTED: "Robotic Partial Nephrectomy" should NO LONGER appear in source focus (deleted)');

        const remainingSourceTitles = remainingSourceActivities?.map(a => a.title) || [];
        const remainingTargetTitles = remainingTargetActivities?.map(a => a.title) || [];
        const remainingConflicts = remainingSourceTitles.filter(title => remainingTargetTitles.includes(title));

        if (remainingConflicts.length > 0) {
          console.error('❌ Conflicts still exist after merge attempt:', remainingConflicts);
          throw new Error(`Conflicts still exist after merge: ${remainingConflicts.join(', ')}`);
        }

        console.log('✅ No remaining conflicts detected, proceeding with focus merge');
        
        // Now proceed with the focus merge
        setShowConflictDialog(false);
        setConflictingActivities([]);
        setConflictResolution(null);
        
        // Call the original merge function but skip the conflict check
        await performFocusMerge(true);
        
      } catch (err: any) {
        console.error('❌ Error merging conflicting activities:', err);
        setError(`Failed to merge conflicting activities: ${err.message}`);
        setMergeLoading(false);
      }
    }
  };

  // Perform the actual focus merge (with option to skip conflict check)
  const performFocusMerge = async (skipConflictCheck = false) => {
    setMergeLoading(true);
    try {
      const targetFocus = availableFocuses.find(f => f.id === mergeTargetId);
      if (!targetFocus) {
        throw new Error('Target focus not found');
      }

      console.log(`🔄 Merging focus "${focus?.name}" into "${targetFocus.name}" in ${targetFocus.area_name}`);

      if (!skipConflictCheck) {
        // Check for conflicts (this was already done, but keeping for safety)
        // Check ALL activities since constraint applies to all
        console.log('🔍 Final conflict check before moving activities (checking ALL activities)...');
        const { data: sourceActivities } = await supabase
          .from('rd_research_activities')
          .select('title, is_active')
          .eq('focus_id', focus?.id);

        const { data: targetActivities } = await supabase
          .from('rd_research_activities')
          .select('title, is_active')
          .eq('focus_id', mergeTargetId);

        console.log('📊 Final source activities:', sourceActivities?.map(a => `${a.title} (${a.is_active ? 'active' : 'inactive'})`));
        console.log('📊 Final target activities:', targetActivities?.map(a => `${a.title} (${a.is_active ? 'active' : 'inactive'})`));

        const sourceTitles = sourceActivities?.map(a => a.title) || [];
        const targetTitles = targetActivities?.map(a => a.title) || [];
        const conflicts = sourceTitles.filter(title => targetTitles.includes(title));

        if (conflicts.length > 0) {
          console.error('❌ FINAL CONFLICT CHECK FAILED:', {
            remainingConflicts: conflicts,
            sourceActivities: sourceActivities?.filter(a => conflicts.includes(a.title)),
            targetActivities: targetActivities?.filter(a => conflicts.includes(a.title))
          });
          throw new Error(`Conflicts still exist after resolution attempt: ${conflicts.join(', ')}`);
        }
        console.log('✅ Final conflict check passed - proceeding with focus merge');
      }

      // Step 1: Move all remaining research activities from source to target focus
      // Only move activities that won't cause constraint violations
      console.log('🔄 Moving remaining activities from source to target focus...');
      
      // Get the current activities in source focus (should be conflict-free now)
      const { data: activitiesToMove } = await supabase
        .from('rd_research_activities')
        .select('id, title')
        .eq('focus_id', focus?.id);
      
      console.log('📦 Activities to move:', activitiesToMove?.map(a => `${a.title} (${a.id})`));
      
      const { error: activitiesError } = await supabase
        .from('rd_research_activities')
        .update({ focus_id: mergeTargetId })
        .eq('focus_id', focus?.id);

      if (activitiesError) {
        console.error('❌ ACTIVITY MOVE FAILED:', {
          error: activitiesError,
          sourceFocusId: focus?.id,
          targetFocusId: mergeTargetId,
          activitiesToMove: activitiesToMove?.map(a => a.title),
          errorCode: activitiesError.code,
          errorMessage: activitiesError.message
        });
        
        if (activitiesError.code === '23505') {
          throw new Error(`CONSTRAINT VIOLATION: ${activitiesError.message}. Some activities may still have duplicate titles in the target focus.`);
        }
        throw activitiesError;
      }
      
      console.log(`✅ Successfully moved ${activitiesToMove?.length || 0} activities to target focus`);

      // Step 2: Update any snapshot data that references the source focus
      const { error: snapshotsError } = await supabase
        .from('rd_business_year_snapshots')
        .update({ 
          snapshot_data: supabase.rpc('replace_focus_in_snapshots', {
            old_focus_id: focus?.id,
            new_focus_id: mergeTargetId
          })
        })
        .eq('focus_id', focus?.id);

      // Don't throw on this error as the function might not exist
      if (snapshotsError) {
        console.warn('Could not update snapshot references:', snapshotsError);
      }

      // Step 3: Delete the source focus (since focuses are simpler than activities)
      const { error: deleteError } = await supabase
        .from('rd_focuses')
        .delete()
        .eq('id', focus?.id);

      if (deleteError) throw deleteError;

      console.log(`✅ Successfully merged "${focus?.name}" into "${targetFocus.name}" (${targetFocus.area_name})`);
      
      onSave(); // Refresh the parent component
      onClose(); // Close the modal
    } catch (err: any) {
      console.error('Error merging focuses:', err);
      setError(`Failed to merge focuses: ${err.message}`);
    } finally {
      setMergeLoading(false);
    }
  };

  // Merge Focuses Functionality
  const handleMergeFocuses = async () => {
    if (!focus || !mergeTargetId || mergeConfirmation !== 'MERGE') {
      setError('Please select a target focus and type MERGE to confirm');
      return;
    }

    // Prevent merging focus into itself
    if (mergeTargetId === focus.id) {
      setError('❌ Cannot merge a focus into itself. Please select a different target focus.');
      console.error('❌ MERGE INTO SELF DETECTED:', {
        sourceFocusId: focus.id,
        sourceFocusName: focus.name,
        targetFocusId: mergeTargetId,
        availableFocuses: availableFocuses.map(f => ({ id: f.id, name: f.name }))
      });
      return;
    }

    setMergeLoading(true);
    setError(null);

    try {
      const targetFocus = availableFocuses.find(f => f.id === mergeTargetId);
      if (!targetFocus) {
        throw new Error('Target focus not found');
      }

      console.log(`🔄 Merging focus "${focus.name}" (${focus.id}) into "${targetFocus.name}" (${targetFocus.id}) in ${targetFocus.area_name}`);
      
      // Additional safety check for same name merges
      if (focus.name === targetFocus.name) {
        console.warn('⚠️ WARNING: Merging focuses with same name!', {
          sourceFocus: { id: focus.id, name: focus.name },
          targetFocus: { id: targetFocus.id, name: targetFocus.name, area: targetFocus.area_name }
        });
      }

      // Check for potential activity title conflicts before merging
      // NOTE: Check ALL activities (active and inactive) since constraint might apply to all
      console.log('🔍 Checking for conflicts (including inactive activities)...');
      const { data: sourceActivities } = await supabase
        .from('rd_research_activities')
        .select('title, is_active')
        .eq('focus_id', focus.id);

      const { data: targetActivities } = await supabase
        .from('rd_research_activities')
        .select('title, is_active')
        .eq('focus_id', mergeTargetId);
      
      console.log('📊 Source activities (all):', sourceActivities?.map(a => `${a.title} (${a.is_active ? 'active' : 'inactive'})`));
      console.log('📊 Target activities (all):', targetActivities?.map(a => `${a.title} (${a.is_active ? 'active' : 'inactive'})`));

      const sourceTitles = sourceActivities?.map(a => a.title) || [];
      const targetTitles = targetActivities?.map(a => a.title) || [];
      const conflicts = sourceTitles.filter(title => targetTitles.includes(title));

      if (conflicts.length > 0) {
        console.log(`⚠️ Found ${conflicts.length} conflicting activities:`, conflicts);
        setConflictingActivities(conflicts);
        setShowConflictDialog(true);
        setMergeLoading(false);
        return;
      }

      // No conflicts found, proceed with merge
      await performFocusMerge(false);
    } catch (err: any) {
      console.error('Error checking conflicts or merging:', err);
      setError(`Failed to merge focuses: ${err.message}`);
      setMergeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focus || !formData.name.trim() || !formData.area_id) {
      setError('Please fill in all required fields');
      return;
    }

    if (conflictWarning) {
      setError('Please resolve the naming conflict before saving');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the focus
      const { error: focusError } = await supabase
        .from('rd_focuses')
        .update({
          name: formData.name.trim(),
          area_id: formData.area_id
        })
        .eq('id', focus.id);

      if (focusError) throw focusError;

      // Optionally update snapshots if requested
      if (updateSnapshots && affectedBusinessYears.length > 0) {
        const newArea = areas.find(a => a.id === formData.area_id);
        const newCategory = newArea ? categories.find(c => c.id === newArea.category_id) : null;

        // Update snapshots for affected business years
        const { error: snapshotError } = await supabase
          .from('rd_selected_activities')
          .update({
            activity_focus_snapshot: formData.name.trim(),
            activity_area_snapshot: newArea?.name || '',
            activity_category_snapshot: newCategory?.name || ''
          })
          .eq('activity_focus_snapshot', focus.name);

        if (snapshotError) {
          console.error('Error updating snapshots:', snapshotError);
          // Don't fail the whole operation if snapshot update fails
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error updating focus:', err);
      
      if (err.code === '23505') {
        const areaName = areas.find(a => a.id === formData.area_id)?.name || 'this area';
        setError(
          `A focus with the name "${formData.name}" already exists in "${areaName}". Please choose a different name or area to avoid duplication.`
        );
      } else {
        setError(err.message || 'Failed to update focus');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !focus) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Focus</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {conflictWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">{conflictWarning}</p>
                </div>
              </div>
            )}

            {impactWarning > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex">
                  <Info className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Research Activities Impact</p>
                    <p>This focus is currently used by {impactWarning} research {impactWarning === 1 ? 'activity' : 'activities'}. The master hierarchy will be updated, but existing reports will continue to use their snapshot data.</p>
                  </div>
                </div>
              </div>
            )}

            {affectedBusinessYears.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <div className="flex">
                  <Calendar className="w-5 h-5 text-orange-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-700 flex-1">
                    <p className="font-medium mb-2">Protected Business Year Reports</p>
                    <p className="mb-3">
                      The following business years have snapshot data for this focus. Their reports are protected and will continue to show the original hierarchy:
                    </p>
                    <div className="space-y-1 mb-3">
                      {affectedBusinessYears.map(year => (
                        <div key={year.id} className="text-xs bg-orange-100 px-2 py-1 rounded">
                          {year.business_name} ({year.year}) - {year.activity_count} activities
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={updateSnapshots}
                        onChange={(e) => setUpdateSnapshots(e.target.checked)}
                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-xs">
                        Also update snapshots to new hierarchy (will change historical reports)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Move Focus Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <MoveHorizontal className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">🔄 Move Focus to Different Area</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>✅ <strong>Change Category and Area</strong> to move this focus to a different area</p>
                    <p>✅ All research activities under this focus will move with it</p>
                    <p>✅ {impactWarning > 0 ? `${impactWarning} research activities will be affected` : 'No research activities will be affected'}</p>
                  </div>
                  <div className="text-xs text-blue-600 mt-2 italic">
                    Use the dropdowns below to reorganize your research hierarchy
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Focus Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter focus name..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  conflictWarning ? 'border-yellow-300' : 'border-gray-300'
                }`}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select category...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <select
                value={formData.area_id}
                onChange={(e) => handleAreaChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  conflictWarning ? 'border-yellow-300' : 'border-gray-300'
                }`}
                required
                disabled={!formData.category_id}
              >
                <option value="">Select area...</option>
                {availableAreas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {!formData.category_id && (
                <p className="text-xs text-gray-500 mt-1">Select a category first</p>
              )}
            </div>
          </div>



          {/* Merge Focuses Section */}
          <div className="p-6 border-t-4 border-purple-500 bg-purple-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <GitMerge className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900">🔄 Merge Focuses</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMergeSection(!showMergeSection)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1 bg-blue-100 rounded"
                >
                  {showMergeSection ? 'Hide' : 'Show'} Merge Options
                </button>
              </div>

              {showMergeSection && (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-700">
                      <p className="font-medium mb-1">🔄 Merge Focus</p>
                      <p>This will move ALL research activities from "{focus?.name}" into the target focus, then delete this focus. This action cannot be undone.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merge "{focus?.name}" into:
                    </label>
                    <select
                      value={mergeTargetId}
                      onChange={(e) => setMergeTargetId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select target focus...</option>
                      {availableFocuses
                        .filter(f => f.id !== focus?.id) // Filter out current focus
                        .map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.category_name} → {f.area_name})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {availableFocuses.filter(f => f.id !== focus?.id).length} focuses available for merge
                    </p>
                  </div>

                  {mergeTargetId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type "MERGE" to confirm:
                      </label>
                      <input
                        type="text"
                        value={mergeConfirmation}
                        onChange={(e) => setMergeConfirmation(e.target.value)}
                        placeholder="Type MERGE to confirm"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {mergeTargetId && mergeConfirmation === 'MERGE' && (
                    <div className="space-y-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-700">
                          <strong>⚠️ Final Confirmation:</strong> All {impactWarning} research activities will be moved to 
                          "{availableFocuses.find(f => f.id === mergeTargetId)?.name}" 
                          in {availableFocuses.find(f => f.id === mergeTargetId)?.area_name}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleMergeFocuses}
                        disabled={mergeLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <GitMerge className="w-4 h-4" />
                        <span>{mergeLoading ? 'Merging...' : `Merge into ${availableFocuses.find(f => f.id === mergeTargetId)?.name}`}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* Conflict Resolution Dialog */}
          {showConflictDialog && (
            <div className="p-6 border-t-4 border-yellow-500 bg-yellow-50">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">
                      ⚠️ Activity Name Conflicts Detected
                    </h3>
                    <p className="text-sm text-yellow-700 mb-3">
                      The following activities exist in both focuses with the same name:
                    </p>
                    <ul className="text-sm text-yellow-700 mb-4 list-disc list-inside">
                      {conflictingActivities.map(activity => (
                        <li key={activity} className="font-medium">{activity}</li>
                      ))}
                    </ul>
                    <p className="text-sm text-yellow-700 mb-4">
                      <strong>What would you like to do?</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConflictResolution('merge')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      conflictResolution === 'merge'
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <GitMerge className="w-5 h-5" />
                      <span className="font-medium">🔄 Merge Conflicting Activities</span>
                    </div>
                    <p className="text-xs">
                      Combine activities with the same name. All steps and subcomponents will be merged together.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConflictResolution('cancel')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      conflictResolution === 'cancel'
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <X className="w-5 h-5" />
                      <span className="font-medium">❌ Cancel Merge</span>
                    </div>
                    <p className="text-xs">
                      Stop the merge process. You can rename activities first to avoid conflicts.
                    </p>
                  </button>
                </div>

                {conflictResolution && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-yellow-200">
                    <button
                      type="button"
                      onClick={() => {
                        setConflictResolution(null);
                        setShowConflictDialog(false);
                        setConflictingActivities([]);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConflictResolution}
                      disabled={mergeLoading}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        conflictResolution === 'merge'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {mergeLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          {conflictResolution === 'merge' ? <GitMerge className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>
                            {conflictResolution === 'merge' 
                              ? `Merge ${conflictingActivities.length} Activities & Continue` 
                              : 'Cancel Focus Merge'
                            }
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.area_id || !!conflictWarning}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Focus'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFocusModal; 