import { supabase } from '../lib/supabase';
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
                fullName: data.full_name,
                role: data.role || 'user',
                createdAt: data.created_at,
                updatedAt: data.updated_at
            } : null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    static async getTaxProfile(userId: string, email?: string): Promise<TaxProfile | null> {
        // Skip tax profile fetch for admin users
        if (email === 'admin@taxrxgroup.com') {
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('tax_profiles')
                .select('*')
                .eq('uuid', userId)
                .single();

            if (error) throw error;
            return data;
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

    static async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.fullName,
                    email: profile.email,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            
            return data ? {
                id: data.id,
                email: data.email,
                fullName: data.full_name,
                role: data.role || 'user',
                createdAt: data.created_at,
                updatedAt: data.updated_at
            } : null;
        } catch (error) {
            console.error('Error updating user profile:', error);
            return null;
        }
    }

    static async updateTaxProfile(userId: string, email: string, updates: Partial<TaxProfile>): Promise<TaxProfile | null> {
        // Skip tax profile update for admin users
        if (email === 'admin@taxrxgroup.com') {
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('tax_profiles')
                .update(updates)
                .eq('uuid', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
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

    static async getUser(userId: string, email?: string): Promise<User | null> {
        try {
            const [profile, taxProfile, preferences] = await Promise.all([
                this.getUserProfile(userId),
                this.getTaxProfile(userId, email),
                this.getUserPreferences(userId)
            ]);

            if (!profile || !preferences) {
                throw new Error('Required user data not found');
            }

            return {
                id: profile.id,
                email: profile.email,
                fullName: profile.fullName,
                role: profile.role,
                hasCompletedTaxProfile: !!taxProfile,
                taxInfo: taxProfile || undefined,
                preferences,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt
            };
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }
} 