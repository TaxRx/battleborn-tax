import { supabase } from '../lib/supabaseClient';
import { User, UserProfile, TaxProfile, UserPreferences } from '../types/user';

export class UserService {
    static async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            
            // Transform the data to match the UserProfile interface
            return data ? {
                id: data.id,
                email: data.email,
                full_name: data.full_name,
                role: data.role || 'user',
                created_at: data.created_at,
                updated_at: data.updated_at
            } : null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    static async getTaxProfile(userId: string): Promise<TaxProfile | null> {
        try {
            const { data, error } = await supabase
                .from('tax_profiles')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Return the most recent tax profile or null if none exist
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error fetching tax profile:', error);
            return null;
        }
    }

    static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('userId', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user preferences:', error);
            return null;
        }
    }

    static async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating user profile:', error);
            return null;
        }
    }

    static async updateTaxProfile(userId: string, updates: Partial<TaxProfile>): Promise<TaxProfile | null> {
        try {
            // First, get the most recent tax profile
            const { data: existingProfiles, error: fetchError } = await supabase
                .from('tax_profiles')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const existingProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;
            let result;

            if (!existingProfile) {
                // Create new tax profile
                const { data, error } = await supabase
                    .from('tax_profiles')
                    .insert([{
                        user_id: userId,
                        ...updates,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select();

                if (error) throw error;
                result = data && data.length > 0 ? data[0] : null;
            } else {
                // Update existing tax profile
                const { data, error } = await supabase
                    .from('tax_profiles')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingProfile.id)
                    .select();

                if (error) throw error;
                result = data && data.length > 0 ? data[0] : null;
            }

            return result;
        } catch (error) {
            console.error('Error updating tax profile:', error);
            return null;
        }
    }

    static async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences | null> {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .update(updates)
                .eq('userId', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating user preferences:', error);
            return null;
        }
    }

    static async getUser(userId: string): Promise<User | null> {
        try {
            const [profile, taxProfile, preferences] = await Promise.all([
                this.getUserProfile(userId),
                this.getTaxProfile(userId),
                this.getUserPreferences(userId)
            ]);

            if (!profile || !preferences) {
                throw new Error('Required user data not found');
            }

            return {
                profile,
                taxProfile: taxProfile || undefined,
                preferences
            };
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }
} 