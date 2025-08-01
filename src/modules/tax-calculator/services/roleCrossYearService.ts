import { supabase } from '../lib/supabase';

export interface RoleCopyOptions {
  sourceBusinessYearId: string;
  targetBusinessYearId: string;
  businessId: string;
  preserveHierarchy?: boolean;
  overwriteExisting?: boolean;
}

export interface RoleMapping {
  sourceId: string;
  targetId: string;
  name: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
}

export class RoleCrossYearService {
  /**
   * Copy all roles from one business year to another
   */
  static async copyRolesAcrossYears(options: RoleCopyOptions): Promise<{
    success: boolean;
    mappings: RoleMapping[];
    errors: string[];
  }> {
    const { sourceBusinessYearId, targetBusinessYearId, businessId, preserveHierarchy = true, overwriteExisting = false } = options;
    
    const mappings: RoleMapping[] = [];
    const errors: string[] = [];
    
    try {
      console.log(`🔄 Starting role copy from year ${sourceBusinessYearId} to ${targetBusinessYearId}`);
      
      // 1. Fetch all roles from source year
      const { data: sourceRoles, error: sourceError } = await supabase
        .from('rd_roles')
        .select('*')
        .eq('business_year_id', sourceBusinessYearId)
        .eq('business_id', businessId)
        .order('name');
      
      if (sourceError) {
        errors.push(`Failed to fetch source roles: ${sourceError.message}`);
        return { success: false, mappings, errors };
      }
      
      if (!sourceRoles || sourceRoles.length === 0) {
        errors.push('No roles found in source year');
        return { success: false, mappings, errors };
      }
      
      console.log(`📋 Found ${sourceRoles.length} roles in source year`);
      
      // 2. Check for existing roles in target year
      const { data: existingTargetRoles, error: targetError } = await supabase
        .from('rd_roles')
        .select('name, id')
        .eq('business_year_id', targetBusinessYearId)
        .eq('business_id', businessId);
      
      if (targetError) {
        console.warn('Warning: Could not check existing target roles:', targetError);
      }
      
      const existingRoleNames = new Set(existingTargetRoles?.map(r => r.name.toLowerCase()) || []);
      const roleIdMapping = new Map<string, string>();
      
      // 3. First pass: Copy all roles without parent relationships
      for (const sourceRole of sourceRoles) {
        try {
          const roleName = sourceRole.name.toLowerCase();
          
          // Check if role already exists in target year
          if (existingRoleNames.has(roleName) && !overwriteExisting) {
            mappings.push({
              sourceId: sourceRole.id,
              targetId: '',
              name: sourceRole.name,
              status: 'skipped',
              message: 'Role already exists in target year'
            });
            continue;
          }
          
          // Prepare role data for target year
          const newRoleData = {
            business_id: businessId,
            business_year_id: targetBusinessYearId,
            name: sourceRole.name,
            description: sourceRole.description,
            type: sourceRole.type,
            is_default: sourceRole.is_default,
            baseline_applied_percent: sourceRole.baseline_applied_percent,
            parent_id: null // Will be set in second pass if preserveHierarchy is true
          };
          
          // Handle existing role if overwriting
          if (existingRoleNames.has(roleName) && overwriteExisting) {
            const existingRole = existingTargetRoles?.find(r => r.name.toLowerCase() === roleName);
            if (existingRole) {
              // Update existing role
              const { data: updatedRole, error: updateError } = await supabase
                .from('rd_roles')
                .update(newRoleData)
                .eq('id', existingRole.id)
                .select()
                .single();
              
              if (updateError) {
                mappings.push({
                  sourceId: sourceRole.id,
                  targetId: '',
                  name: sourceRole.name,
                  status: 'error',
                  message: `Failed to update: ${updateError.message}`
                });
                continue;
              }
              
              roleIdMapping.set(sourceRole.id, updatedRole.id);
              mappings.push({
                sourceId: sourceRole.id,
                targetId: updatedRole.id,
                name: sourceRole.name,
                status: 'success',
                message: 'Updated existing role'
              });
            }
          } else {
            // Create new role
            const { data: newRole, error: createError } = await supabase
              .from('rd_roles')
              .insert(newRoleData)
              .select()
              .single();
            
            if (createError) {
              mappings.push({
                sourceId: sourceRole.id,
                targetId: '',
                name: sourceRole.name,
                status: 'error',
                message: `Failed to create: ${createError.message}`
              });
              continue;
            }
            
            roleIdMapping.set(sourceRole.id, newRole.id);
            mappings.push({
              sourceId: sourceRole.id,
              targetId: newRole.id,
              name: sourceRole.name,
              status: 'success',
              message: 'Created new role'
            });
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          mappings.push({
            sourceId: sourceRole.id,
            targetId: '',
            name: sourceRole.name,
            status: 'error',
            message: errorMessage
          });
        }
      }
      
      // 4. Second pass: Update parent relationships if preserving hierarchy
      if (preserveHierarchy) {
        console.log('🔗 Setting up role hierarchy in target year');
        
        for (const sourceRole of sourceRoles) {
          if (sourceRole.parent_id && roleIdMapping.has(sourceRole.id) && roleIdMapping.has(sourceRole.parent_id)) {
            const targetRoleId = roleIdMapping.get(sourceRole.id);
            const targetParentId = roleIdMapping.get(sourceRole.parent_id);
            
            if (targetRoleId && targetParentId) {
              const { error: hierarchyError } = await supabase
                .from('rd_roles')
                .update({ parent_id: targetParentId })
                .eq('id', targetRoleId);
              
              if (hierarchyError) {
                console.warn(`Warning: Could not set parent for role ${sourceRole.name}:`, hierarchyError);
              }
            }
          }
        }
      }
      
      const successCount = mappings.filter(m => m.status === 'success').length;
      const errorCount = mappings.filter(m => m.status === 'error').length;
      const skippedCount = mappings.filter(m => m.status === 'skipped').length;
      
      console.log(`✅ Role copy completed: ${successCount} created/updated, ${skippedCount} skipped, ${errorCount} errors`);
      
      return {
        success: errorCount === 0,
        mappings,
        errors
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      errors.push(errorMessage);
      return { success: false, mappings, errors };
    }
  }
  
  /**
   * Get available years that can be used as source for copying roles
   */
  static async getAvailableSourceYears(currentBusinessYearId: string, businessId: string): Promise<{
    id: string;
    year: number;
    roleCount: number;
  }[]> {
    try {
      // Get all business years for this business
      const { data: businessYears, error: yearsError } = await supabase
        .from('rd_business_years')
        .select('id, year')
        .eq('business_id', businessId)
        .neq('id', currentBusinessYearId)
        .order('year', { ascending: false });
      
      if (yearsError || !businessYears) {
        console.error('Error fetching business years:', yearsError);
        return [];
      }
      
      // Get role counts for each year
      const yearsWithRoleCounts = await Promise.all(
        businessYears.map(async (year) => {
          const { data: roles, error: rolesError } = await supabase
            .from('rd_roles')
            .select('id')
            .eq('business_year_id', year.id)
            .eq('business_id', businessId);
          
          return {
            id: year.id,
            year: year.year,
            roleCount: roles?.length || 0
          };
        })
      );
      
      // Filter out years with no roles
      return yearsWithRoleCounts.filter(year => year.roleCount > 0);
      
    } catch (error) {
      console.error('Error getting available source years:', error);
      return [];
    }
  }
  
  /**
   * Check if roles can be safely copied (no name conflicts unless overwriting)
   */
  static async validateRoleCopy(sourceBusinessYearId: string, targetBusinessYearId: string, businessId: string): Promise<{
    canCopy: boolean;
    conflicts: string[];
    warnings: string[];
  }> {
    const conflicts: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Get source roles
      const { data: sourceRoles } = await supabase
        .from('rd_roles')
        .select('name')
        .eq('business_year_id', sourceBusinessYearId)
        .eq('business_id', businessId);
      
      // Get target roles
      const { data: targetRoles } = await supabase
        .from('rd_roles')
        .select('name')
        .eq('business_year_id', targetBusinessYearId)
        .eq('business_id', businessId);
      
      if (!sourceRoles || sourceRoles.length === 0) {
        conflicts.push('No roles found in source year');
        return { canCopy: false, conflicts, warnings };
      }
      
      const targetRoleNames = new Set(targetRoles?.map(r => r.name.toLowerCase()) || []);
      const sourceRoleNames = sourceRoles.map(r => r.name);
      
      // Check for name conflicts
      for (const roleName of sourceRoleNames) {
        if (targetRoleNames.has(roleName.toLowerCase())) {
          conflicts.push(`Role "${roleName}" already exists in target year`);
        }
      }
      
      if (conflicts.length > 0) {
        warnings.push(`${conflicts.length} role name conflicts found. Use "overwrite existing" option to replace them.`);
      }
      
      return {
        canCopy: true, // Can always copy with proper options
        conflicts,
        warnings
      };
      
    } catch (error) {
      conflicts.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { canCopy: false, conflicts, warnings };
    }
  }
}

export default RoleCrossYearService; 