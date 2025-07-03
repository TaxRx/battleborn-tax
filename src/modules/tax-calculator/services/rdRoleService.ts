import { supabase } from '../../lib/supabase';

export interface ResearchRole {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleHierarchy {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_default?: boolean;
  level: number;
  path: string;
}

export class RDRoleService {
  private static instance: RDRoleService;

  private constructor() {}

  public static getInstance(): RDRoleService {
    if (!RDRoleService.instance) {
      RDRoleService.instance = new RDRoleService();
    }
    return RDRoleService.instance;
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<ResearchRole[]> {
    try {
      const { data, error } = await supabase
        .from('rd_roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<ResearchRole | null> {
    try {
      const { data, error } = await supabase
        .from('rd_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  }

  /**
   * Get default role
   */
  async getDefaultRole(): Promise<ResearchRole | null> {
    try {
      const { data, error } = await supabase
        .from('rd_roles')
        .select('*')
        .eq('is_default', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching default role:', error);
      throw error;
    }
  }

  /**
   * Get role hierarchy
   */
  async getRoleHierarchy(roleId?: string): Promise<RoleHierarchy[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_role_hierarchy', { role_id: roleId || null });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching role hierarchy:', error);
      throw error;
    }
  }

  /**
   * Get child roles
   */
  async getChildRoles(parentId: string): Promise<ResearchRole[]> {
    try {
      const { data, error } = await supabase
        .from('rd_roles')
        .select('*')
        .eq('parent_id', parentId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching child roles:', error);
      throw error;
    }
  }

  /**
   * Get parent roles (ancestors)
   */
  async getParentRoles(roleId: string): Promise<ResearchRole[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_role_hierarchy', { role_id: roleId });

      if (error) throw error;
      
      // Filter out the current role and return only ancestors
      return (data || []).filter(role => role.id !== roleId);
    } catch (error) {
      console.error('Error fetching parent roles:', error);
      throw error;
    }
  }

  /**
   * Create new role
   */
  async createRole(role: Omit<ResearchRole, 'id' | 'created_at' | 'updated_at'>): Promise<ResearchRole> {
    try {
      const { data, error } = await supabase
        .from('rd_roles')
        .insert({
          name: role.name,
          description: role.description,
          parent_id: role.parent_id || null,
          is_default: role.is_default || false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(id: string, updates: Partial<Omit<ResearchRole, 'id' | 'created_at' | 'updated_at'>>): Promise<ResearchRole> {
    try {
      const { data, error } = await supabase
        .from('rd_roles')
        .update({
          name: updates.name,
          description: updates.description,
          parent_id: updates.parent_id,
          is_default: updates.is_default
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    try {
      // First, update any child roles to have no parent
      await supabase
        .from('rd_roles')
        .update({ parent_id: null })
        .eq('parent_id', id);

      // Then delete the role
      const { error } = await supabase
        .from('rd_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Set default role
   */
  async setDefaultRole(id: string): Promise<void> {
    try {
      // First, unset any existing default role
      await supabase
        .from('rd_roles')
        .update({ is_default: false })
        .eq('is_default', true);

      // Then set the new default role
      const { error } = await supabase
        .from('rd_roles')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting default role:', error);
      throw error;
    }
  }

  /**
   * Check if role can be deleted (no children and not default)
   */
  async canDeleteRole(id: string): Promise<boolean> {
    try {
      const [childrenResult, roleResult] = await Promise.all([
        this.getChildRoles(id),
        this.getRoleById(id)
      ]);

      const hasChildren = childrenResult.length > 0;
      const isDefault = roleResult?.is_default || false;

      return !hasChildren && !isDefault;
    } catch (error) {
      console.error('Error checking if role can be deleted:', error);
      return false;
    }
  }

  /**
   * Get roles tree for display
   */
  async getRolesTree(): Promise<Array<ResearchRole & { children: ResearchRole[] }>> {
    try {
      const allRoles = await this.getAllRoles();
      const rootRoles = allRoles.filter(role => !role.parent_id);
      
      const buildTree = (parentId: string | null): Array<ResearchRole & { children: ResearchRole[] }> => {
        return allRoles
          .filter(role => role.parent_id === parentId)
          .map(role => ({
            ...role,
            children: buildTree(role.id)
          }));
      };

      return buildTree(null);
    } catch (error) {
      console.error('Error building roles tree:', error);
      throw error;
    }
  }

  /**
   * Validate role data
   */
  validateRole(role: Partial<ResearchRole>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!role.name || role.name.trim().length === 0) {
      errors.push('Role name is required');
    }

    if (role.name && role.name.trim().length > 255) {
      errors.push('Role name must be 255 characters or less');
    }

    if (role.description && role.description.length > 1000) {
      errors.push('Role description must be 1000 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default RDRoleService.getInstance(); 