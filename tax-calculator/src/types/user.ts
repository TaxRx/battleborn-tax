export interface TaxProfile {
    id: string;
    user_id: string;
    standard_deduction: boolean;
    business_owner: boolean;
    full_name?: string;
    email?: string;
    filing_status?: string;
    dependents: number;
    home_address?: string;
    state?: string;
    wages_income: number;
    passive_income: number;
    unearned_income: number;
    capital_gains: number;
    custom_deduction: number;
    charitable_deduction: number;
    business_name?: string;
    entity_type?: string;
    ordinary_k1_income: number;
    guaranteed_k1_income: number;
    business_address?: string;
    deduction_limit_reached: boolean;
    household_income: number;
    created_at: string;
    updated_at: string;
}

export interface UserPreferences {
    id: string;
    user_id: string;
    theme: string;
    notifications_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_admin: boolean;
    has_completed_tax_profile: boolean;
    created_at: string;
    updated_at: string;
    taxInfo?: TaxProfile;
    preferences?: UserPreferences;
} 