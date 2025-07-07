import { supabase } from '../lib/supabase';

export interface Role {
  id: string;
  name: string;
  baseline_applied_percent: number | null;
  business_year_id: string;
  created_at?: string;
  updated_at?: string;
}

export class RolesService {
  static async getRolesByBusinessYear(businessYearId: string): Promise<Role[]> {
    try {
      console.log('[RolesService] Fetching roles for businessYearId:', businessYearId);
      const { data, error } = await supabase
        .from('rd_roles')
        .select('*')
        .eq('business_year_id', businessYearId)
        .order('name');

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  static async calculateRolesAppliedPercentage(
    businessYearId: string,
    selectedActivities: any[],
    selectedSubcomponents: any[] = []
  ): Promise<{ [roleName: string]: number }> {
    try {
      console.log('[RolesService] Calculating applied percentages for businessYearId:', businessYearId);
      console.log('[RolesService] Selected activities:', selectedActivities);
      console.log('[RolesService] All selected subcomponents:', selectedSubcomponents);
      
      // Get roles for this business year
      const roles = await this.getRolesByBusinessYear(businessYearId);
      console.log('[RolesService] Found roles:', roles);
      
      // Filter for only selected subcomponents (those with selected_roles)
      const activeSubcomponents = selectedSubcomponents.filter(sub => 
        sub.selected_roles && 
        Array.isArray(sub.selected_roles) && 
        sub.selected_roles.length > 0 &&
        sub.applied_percentage && 
        sub.applied_percentage > 0
      );
      
      console.log('[RolesService] Active subcomponents (with roles and applied_percentage):', activeSubcomponents);
      
      // Calculate applied percentage for each role based on subcomponent assignments
      const rolePercentages: { [roleName: string]: number } = {};
      
      roles.forEach(role => {
        console.log(`[RolesService] Calculating for role: ${role.name} (ID: ${role.id})`);
        
        let totalApplied = 0;
        let contributingSubcomponents: string[] = [];
        
        // Calculate based on subcomponent assignments
        activeSubcomponents.forEach(subcomponent => {
          const selectedRoles = subcomponent.selected_roles || [];
          const appliedPercentage = subcomponent.applied_percentage || 0;
          
          // If this role is assigned to this subcomponent, add its applied percentage
          if (selectedRoles.includes(role.id)) {
            totalApplied += appliedPercentage;
            contributingSubcomponents.push(subcomponent.subcomponent_id);
            console.log(`[RolesService] Role ${role.name} assigned to subcomponent ${subcomponent.subcomponent_id}, adding ${appliedPercentage}% (total now: ${totalApplied.toFixed(2)}%)`);
          }
        });
        
        rolePercentages[role.name] = totalApplied;
        console.log(`[RolesService] Final total applied for ${role.name}: ${totalApplied.toFixed(2)}% (from ${contributingSubcomponents.length} subcomponents: ${contributingSubcomponents.join(', ')})`);
      });
      
      console.log('[RolesService] Final role percentages:', rolePercentages);
      return rolePercentages;
    } catch (error) {
      console.error('Error calculating roles applied percentage:', error);
      return {};
    }
  }

  static async updateRoleBaselineAppliedPercent(
    roleId: string,
    baselineAppliedPercent: number
  ): Promise<boolean> {
    try {
      console.log(`[RolesService] Updating role ${roleId} baseline_applied_percent to ${baselineAppliedPercent}%`);
      
      const { error } = await supabase
        .from('rd_roles')
        .update({ baseline_applied_percent: baselineAppliedPercent })
        .eq('id', roleId);
        
      if (error) {
        console.error('Error updating role baseline applied percent:', error);
        return false;
      }
      
      console.log(`[RolesService] Successfully updated role ${roleId}`);
      return true;
    } catch (error) {
      console.error('Error updating role baseline applied percent:', error);
      return false;
    }
  }
} 