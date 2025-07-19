import { supabase } from '../lib/supabase';

interface Role {
  id: string;
  name: string;
  description?: string;
  baseline_applied_percent?: number;
}

export class RolesService {
  // Get roles for a specific business year
  static async getRolesByBusinessYear(businessYearId: string): Promise<Role[]> {
    const { data: roles, error } = await supabase
      .from('rd_roles')
      .select('*')
      .eq('business_year_id', businessYearId)
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }

    return roles || [];
  }

  // CLEAN ROLES CALCULATION - Start Fresh
  static async calculateRolesAppliedPercentage(
    businessYearId: string,
    selectedActivities: any[],
    selectedSubcomponents: any[] = []
  ): Promise<{ [roleName: string]: number }> {
    try {
      console.log('🔄 [CLEAN ROLES] Starting fresh role calculation');
      console.log('🔄 [CLEAN ROLES] Business Year ID:', businessYearId);
      
      // Get roles for this business year
      const roles = await this.getRolesByBusinessYear(businessYearId);
      console.log('🔄 [CLEAN ROLES] Found roles:', roles.length);
      
      if (roles.length === 0) {
        console.log('🔄 [CLEAN ROLES] No roles found, returning empty');
        return {};
      }

      // Get ALL subcomponents with applied percentages from database
      const { data: allSubcomponents, error } = await supabase
        .from('rd_selected_subcomponents')
        .select('subcomponent_id, applied_percentage, selected_roles')
        .eq('business_year_id', businessYearId);

      if (error) {
        console.error('🔄 [CLEAN ROLES] Error fetching subcomponents:', error);
        return {};
      }

      if (!allSubcomponents || allSubcomponents.length === 0) {
        console.log('🔄 [CLEAN ROLES] No subcomponents found');
        return {};
      }

      console.log('🔄 [CLEAN ROLES] Processing', allSubcomponents.length, 'subcomponents');
      
      // Calculate total applied percentage to validate our work
      const totalApplied = allSubcomponents.reduce((sum, sub) => sum + (sub.applied_percentage || 0), 0);
      console.log('🔄 [CLEAN ROLES] Total applied across all subcomponents:', totalApplied.toFixed(2) + '%');
      console.log('🔄 [CLEAN ROLES] This should be 59.44% - MAXIMUM any role can have');

      // Calculate each role's applied percentage
      const rolePercentages: { [roleName: string]: number } = {};

      for (const role of roles) {
        console.log(`🔄 [CLEAN ROLES] Calculating for role: ${role.name}`);
        
        let roleTotal = 0;
        let subcomponentCount = 0;

        // Find all subcomponents assigned to this role
        for (const subcomponent of allSubcomponents) {
          const selectedRoles = subcomponent.selected_roles || [];
          const appliedPercentage = subcomponent.applied_percentage || 0;

          // If this role is assigned to this subcomponent
          if (selectedRoles.includes(role.id)) {
            roleTotal += appliedPercentage;
            subcomponentCount++;
            console.log(`  ✅ Subcomponent ${subcomponent.subcomponent_id}: +${appliedPercentage.toFixed(2)}% (total: ${roleTotal.toFixed(2)}%)`);
          }
        }

        rolePercentages[role.name] = roleTotal;
        console.log(`🔄 [CLEAN ROLES] ${role.name}: ${roleTotal.toFixed(2)}% from ${subcomponentCount} subcomponents`);
        
        // VALIDATION: No role should exceed total applied
        if (roleTotal > totalApplied + 0.01) { // Allow small rounding errors
          console.error(`🚨 [CLEAN ROLES] ERROR: ${role.name} (${roleTotal.toFixed(2)}%) exceeds total applied (${totalApplied.toFixed(2)}%)`);
        }
      }

      console.log('🔄 [CLEAN ROLES] Final results:', rolePercentages);
      return rolePercentages;

    } catch (error) {
      console.error('🔄 [CLEAN ROLES] Error in calculation:', error);
      return {};
    }
  }

  // Update role baseline applied percent
  static async updateRoleBaselineAppliedPercent(roleId: string, appliedPercent: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('rd_roles')
        .update({ baseline_applied_percent: appliedPercent })
        .eq('id', roleId);

      if (error) {
        console.error('Error updating role baseline applied percent:', error);
      }
    } catch (error) {
      console.error('Error updating role baseline applied percent:', error);
    }
  }
} 