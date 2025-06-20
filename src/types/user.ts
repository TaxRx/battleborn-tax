import type { Document } from './document';

export interface TaxProfile {
    id: string;
    userId: string;
    standardDeduction: boolean;
    customDeduction: number;
    businessOwner: boolean;
    filingStatus: string;
    dependents: number;
    homeAddress?: string;
    homeLatitude?: number;
    homeLongitude?: number;
    state?: string;
    wagesIncome: number;
    passiveIncome: number;
    unearnedIncome: number;
    capitalGains: number;
    businessName?: string;
    entityType?: string;
    businessAddress?: string;
    businessLatitude?: number;
    businessLongitude?: number;
    ordinaryK1Income: number;
    guaranteedK1Income: number;
    createdAt: string;
    updatedAt: string;
}

export interface UserPreferences {
    id: string;
    userId: string;
    theme: string;
    notifications: boolean;
    defaultView: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    hasCompletedTaxProfile: boolean;
    taxInfo?: TaxProfile;
    preferences?: UserPreferences;
    createdAt: string;
    updatedAt: string;
}

export interface Advisor {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'inactive' | 'pending';
    role: string;
    clients: Client[];
    createdAt: string;
    updatedAt: string;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    status: 'initial_contact' | 'documentation' | 'processing' | 'completed' | 'in_progress';
    role: string;
    hasCompletedTaxProfile: boolean;
    advisorId: string;
    groupIds: string[];
    documents: Document[];
    createdAt: string;
    updatedAt: string;
    strategies: any[];
    donation_committed?: number;
    donation_funded?: number;
}

export interface Group {
    id: string;
    name: string;
    description: string;
    advisorId: string;
    clientIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface GroupKPI {
    year: number;
    totalCredits: number;
    totalClients: number;
    totalDocuments: number;
}

export interface GroupMembership {
    id: string;
    groupId: string;
    clientId: string;
    joinedAt: string;
}

export interface Notification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    createdAt: string;
    userId: string;
    metadata?: {
        [key: string]: any;
    };
}

export interface AuditLog {
    id: string;
    action: string;
    details: string;
    userId: string;
    createdAt: string;
    metadata?: {
        [key: string]: any;
    };
}

export interface CharitableDonation {
    id: string;
    clientId: string;
    advisorId: string;
    year: number;
    initialAmount: number;
    finalAmount?: number;
    status: 'Invited' | 'In Progress' | 'Documents Complete' | 'Funding Complete' | 'Documents Delivered';
    dueDiligenceRequested: boolean;
    createdAt: string;
    updatedAt: string;
}

export type Document = {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    clientId?: string;
    groupId?: string;
    uploadDate: string;
    status: string;
    metadata?: Record<string, any>;
}; 