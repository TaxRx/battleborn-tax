import { Advisor, Client, Group, GroupMembership, Notification, AuditLog, CharitableDonation } from '../types/user';
import { supabase } from '../lib/supabase';
import type { Document as DocumentType } from '../types/document';
import { isDemoMode } from '../utils/demoMode';
import {
  mockClients as rawMockClients,
  mockPayments,
  mockNotifications as rawMockNotifications,
  mockActivity as rawMockActivity
} from '../data/dashboardMockData';
import { v4 as uuidv4 } from 'uuid';

// Mock advisors data
const mockAdvisors: Advisor[] = [
  {
    id: 'advisor-1',
    name: 'Dr. Smith',
    email: 'dr.smith@demo.com',
    status: 'active',
    role: 'advisor',
    clients: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'advisor-2',
    name: 'Dr. Lee',
    email: 'dr.lee@demo.com',
    status: 'active',
    role: 'advisor',
    clients: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock groups data
const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Dental Group',
    description: 'Group for dental practices',
    advisorId: 'advisor-1',
    clientIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper: map dashboard mock clients to Client type
function mapMockClients(): Client[] {
  return rawMockClients.map((c: any) => ({
    id: c.id,
    name: c.name,
    email: `${c.name.toLowerCase().replace(/ /g, '')}@demo.com`,
    status: 'in_progress',
    role: 'client',
    hasCompletedTaxProfile: true,
    advisorId: 'advisor-1',
    groupIds: [],
    documents: [],
    createdAt: c.joined,
    updatedAt: c.joined,
    strategies: [],
    donation_committed: 0,
    donation_funded: 0,
  }));
}

// Helper: map dashboard mock notifications to Notification type
function mapMockNotifications(): Notification[] {
  return rawMockNotifications.map((n: any) => ({
    id: n.id,
    type: 'info',
    message: n.message,
    read: n.read,
    createdAt: n.timestamp,
    userId: 'admin',
    metadata: {},
  }));
}

// Helper: map dashboard mock activity to AuditLog type
function mapMockAuditLogs(): AuditLog[] {
  return rawMockActivity.map((a: any) => ({
    id: a.id,
    action: a.action,
    details: a.details,
    userId: a.userId,
    createdAt: a.timestamp,
    metadata: {},
  }));
}

export const advisorService = {
    // Advisor functions
    async getAdvisors(): Promise<Advisor[]> {
        if (isDemoMode()) {
            return mockAdvisors;
        }
        try {
            const { data, error } = await supabase
                .from('advisors')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching advisors:', error);
            return [];
        }
    },
    async getAdvisorById(id: string): Promise<Advisor | null> {
        try {
            const { data, error } = await supabase
                .from('advisors')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching advisor:', error);
            return null;
        }
    },
    async createAdvisor(advisor: Partial<Advisor>): Promise<Advisor> {
        try {
            const newAdvisor: Advisor = {
                id: crypto.randomUUID(),
                name: advisor.name || '',
                email: advisor.email || '',
                status: advisor.status || 'pending',
                role: 'advisor',
                clients: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const { error } = await supabase
                .from('advisors')
                .insert([newAdvisor]);

            if (error) throw error;
            return newAdvisor;
        } catch (error) {
            console.error('Error creating advisor:', error);
            throw error;
        }
    },
    async updateAdvisor(id: string, updates: Partial<Advisor>): Promise<void> {
        try {
            const { error } = await supabase
                .from('advisors')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating advisor:', error);
            throw error;
        }
    },
    async deleteAdvisor(id: string): Promise<void> {
        if (isDemoMode()) {
            // In demo mode, just return success
            return;
        }
        try {
            const { error } = await supabase
                .from('advisors')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting advisor:', error);
            throw error;
        }
    },

    // Client functions
    async getClients(advisorId: string): Promise<Client[]> {
        if (isDemoMode()) {
            return mapMockClients();
        }
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*');
            if (error && error.code === 'PGRST116') {
                // Table not found, fallback to mock
                return mapMockClients();
            }
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching clients:', error);
            return mapMockClients(); // fallback
        }
    },
    async getClientById(id: string): Promise<Client | null> {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching client:', error);
            return null;
        }
    },
    async createClient(client: Partial<Client>): Promise<Client> {
        try {
            const newClient: Client = {
                id: crypto.randomUUID(),
                name: client.name || '',
                email: client.email || '',
                status: client.status || 'initial_contact',
                role: 'client',
                hasCompletedTaxProfile: false,
                advisorId: client.advisorId || '',
                groupIds: [],
                documents: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                strategies: []
            };

            const { error } = await supabase
                .from('clients')
                .insert([newClient]);

            if (error) throw error;
            return newClient;
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    },
    async updateClient(id: string, updates: Partial<Client>): Promise<void> {
        try {
            const { error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating client:', error);
            throw error;
        }
    },
    async deleteClient(id: string): Promise<void> {
        if (isDemoMode()) {
            // In demo mode, just return success
            return;
        }
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting client:', error);
            throw error;
        }
    },

    // Group functions
    async getGroups(advisorId: string): Promise<Group[]> {
        if (isDemoMode()) {
            return mockGroups;
        }
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching groups:', error);
            return [];
        }
    },
    async getGroupById(id: string): Promise<Group | null> {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching group:', error);
            return null;
        }
    },
    async createGroup(group: Partial<Group>): Promise<Group> {
        try {
            const newGroup: Group = {
                id: crypto.randomUUID(),
                name: group.name || '',
                description: group.description || '',
                advisorId: group.advisorId || '',
                clientIds: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const { error } = await supabase
                .from('groups')
                .insert([newGroup]);

            if (error) throw error;
            return newGroup;
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    },
    async updateGroup(id: string, updates: Partial<Group>): Promise<void> {
        try {
            const { error } = await supabase
                .from('groups')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating group:', error);
            throw error;
        }
    },
    async deleteGroup(id: string): Promise<void> {
        if (isDemoMode()) {
            // In demo mode, just return success
            return;
        }
        try {
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting group:', error);
            throw error;
        }
    },

    // Notification functions
    async getNotifications(userId: string): Promise<Notification[]> {
        if (isDemoMode()) {
            return mapMockNotifications();
        }
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('userId', userId)
                .order('createdAt', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },
    async markNotificationAsRead(id: string): Promise<void> {
        // TODO: Replace with Supabase/REST call
    },

    // Audit log functions
    async getAuditLogs(userId: string, filters?: {
        action?: string;
        targetType?: 'advisor' | 'client' | 'group' | 'document';
        startDate?: string;
        endDate?: string;
    }): Promise<AuditLog[]> {
        if (isDemoMode()) {
            return mapMockAuditLogs();
        }
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('userId', userId)
                .order('createdAt', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }
    },
    async createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
        // TODO: Replace with Supabase/REST call
        const newLog: AuditLog = {
            ...log,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            metadata: log.metadata || {}
        } as AuditLog;
        return newLog;
    },

    async getMonthlyRevenue(): Promise<number> {
        if (isDemoMode()) {
            return mockPayments.reduce((sum, payment) => sum + payment.amount, 0);
        }
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('amount')
                .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
                .lte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString());

            if (error) throw error;
            return data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        } catch (error) {
            console.error('Error fetching monthly revenue:', error);
            return 0;
        }
    },

    async getDocuments(): Promise<DocumentType[]> {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .order('uploadDate', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching documents:', error);
            return [];
        }
    },

    async uploadDocument(file: File, clientId: string): Promise<DocumentType> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            const newDocument: DocumentType = {
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type,
                size: file.size,
                url: publicUrl,
                clientName: '',
                clientId,
                groupId: '',
                uploadDate: new Date().toISOString(),
                status: 'pending',
                metadata: {},
            };

            const { error } = await supabase
                .from('documents')
                .insert([newDocument]);

            if (error) throw error;
            return newDocument;
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    },

    async deleteDocument(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    },

    // Transfer functions
    async transferAdvisor(advisorId: string, groupId: string): Promise<void> {
        if (isDemoMode()) {
            // In demo mode, just return success
            return;
        }
        try {
            const { error } = await supabase
                .from('advisors')
                .update({ groupId })
                .eq('id', advisorId);

            if (error) throw error;
        } catch (error) {
            console.error('Error transferring advisor:', error);
            throw error;
        }
    },

    async transferGroup(groupId: string, advisorId: string): Promise<void> {
        if (isDemoMode()) {
            // In demo mode, just return success
            return;
        }
        try {
            const { error } = await supabase
                .from('groups')
                .update({ advisorId })
                .eq('id', groupId);

            if (error) throw error;
        } catch (error) {
            console.error('Error transferring group:', error);
            throw error;
        }
    },

    async transferClient(clientId: string, advisorId: string): Promise<void> {
        if (isDemoMode()) {
            // In demo mode, just return success
            return;
        }
        try {
            const { error } = await supabase
                .from('clients')
                .update({ advisorId })
                .eq('id', clientId);

            if (error) throw error;
        } catch (error) {
            console.error('Error transferring client:', error);
            throw error;
        }
    },

    // Strategy functions
    async updateClientStrategyStatus(clientId: string, strategyId: string, status: string): Promise<void> {
        if (isDemoMode()) {
            // In demo mode, just return success
            return;
        }
        try {
            const { error } = await supabase
                .from('strategies')
                .update({ status })
                .eq('id', strategyId)
                .eq('clientId', clientId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating strategy status:', error);
            throw error;
        }
    },

    // Notification sending function
    async sendNotification(notification: Partial<Notification>): Promise<void> {
        if (isDemoMode()) {
            // In demo mode, just log or do nothing
            console.log('Demo: Notification sent', notification);
            return;
        }
        try {
            const { error } = await supabase
                .from('notifications')
                .insert([notification]);
            if (error) throw error;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }
};

export async function createCharitableDonation(data: Omit<CharitableDonation, 'id' | 'createdAt' | 'updatedAt'>): Promise<CharitableDonation> {
  const newDonation: CharitableDonation = {
    ...data,
    id: Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return newDonation;
}

export async function updateCharitableDonation(id: string, updates: Partial<CharitableDonation>): Promise<CharitableDonation | undefined> {
  // Implementation needed
  return undefined;
}

export async function getCharitableDonationsByClientYear(clientId: string, year: number): Promise<CharitableDonation | undefined> {
  // Implementation needed
  return undefined;
}

export async function getCharitableDonationsByAdvisorYear(advisorId: string, year: number): Promise<CharitableDonation[]> {
  // Implementation needed
  return [];
}

export async function getAllCharitableDonationsByYear(year: number): Promise<CharitableDonation[]> {
  // Implementation needed
  return [];
}

export async function updateCharitableDonationStatus(id: string, status: CharitableDonation['status'], finalAmount?: number): Promise<CharitableDonation | undefined> {
  // Implementation needed
  return undefined;
}

export const getAdvisors = advisorService.getAdvisors;
export const getAdvisorById = advisorService.getAdvisorById;
export const createAdvisor = advisorService.createAdvisor;
export const updateAdvisor = advisorService.updateAdvisor;
export const deleteAdvisor = advisorService.deleteAdvisor;

export const getClients = advisorService.getClients;
export const getClientById = advisorService.getClientById;
export const createClient = advisorService.createClient;
export const updateClient = advisorService.updateClient;
export const deleteClient = advisorService.deleteClient;

export const getGroups = advisorService.getGroups;
export const getGroupById = advisorService.getGroupById;
export const createGroup = advisorService.createGroup;
export const updateGroup = advisorService.updateGroup;
export const deleteGroup = advisorService.deleteGroup;

export const getNotifications = advisorService.getNotifications;
export const getAuditLogs = advisorService.getAuditLogs;
export const getDocuments = advisorService.getDocuments;
export const deleteDocument = advisorService.deleteDocument;
export const uploadDocument = advisorService.uploadDocument;
export const markNotificationAsRead = advisorService.markNotificationAsRead;
export const createAuditLog = advisorService.createAuditLog;
export const getMonthlyRevenue = advisorService.getMonthlyRevenue;
export const transferAdvisor = advisorService.transferAdvisor;
export const transferGroup = advisorService.transferGroup;
export const transferClient = advisorService.transferClient;
export const updateClientStrategyStatus = advisorService.updateClientStrategyStatus;
export const sendNotification = advisorService.sendNotification; 