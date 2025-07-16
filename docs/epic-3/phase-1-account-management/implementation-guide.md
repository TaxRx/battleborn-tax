# Phase 1 Implementation Guide - Account Management

**Phase**: Account Management (Weeks 1-3)  
**Developer Focus**: Core account CRUD operations and audit logging  
**Last Updated**: 2025-07-16

## Implementation Overview

This guide provides step-by-step implementation instructions for Phase 1 of Epic 3: Account Management. Follow this guide to build the foundation for the admin platform while preserving all existing functionality.

## Pre-Implementation Setup

### Development Environment Verification
```bash
# Verify existing setup
cd /Users/admin/CodeProjects/openside/battleborn/taxapp
npm install                    # Ensure dependencies are installed
npm run type-check            # Verify TypeScript compilation
npm run test                  # Run existing tests
```

### Database Preparation
```bash
# Backup current database (safety measure)
supabase db dump > backup_pre_epic3_phase1.sql

# Verify current schema
supabase db diff
```

## Step 1: Database Schema Implementation

### 1.1 Create Account Activities Table
**File**: `supabase/migrations/20250716000001_create_account_activities.sql`

```sql
-- Epic 3 Phase 1: Account Activities Logging
CREATE TABLE account_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  activity_type VARCHAR NOT NULL CHECK (activity_type IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')),
  target_type VARCHAR NOT NULL CHECK (target_type IN ('account', 'tool', 'profile', 'invoice', 'user')),
  target_id UUID NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_account_activities_actor ON account_activities(actor_id);
CREATE INDEX idx_account_activities_account ON account_activities(account_id);
CREATE INDEX idx_account_activities_created_at ON account_activities(created_at DESC);
CREATE INDEX idx_account_activities_type ON account_activities(activity_type, target_type);

-- RLS policies
ALTER TABLE account_activities ENABLE ROW LEVEL SECURITY;

-- Users can view activities for their own account
CREATE POLICY "Users can view their account activities" ON account_activities
  FOR SELECT USING (
    account_id IN (SELECT account_id FROM profiles WHERE id = auth.uid())
  );

-- Admins can view all activities
CREATE POLICY "Admins can view all account activities" ON account_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = auth.uid() AND a.type = 'admin'
    )
  );

-- Only admins can insert activities (system generated)
CREATE POLICY "Admins can insert account activities" ON account_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = auth.uid() AND a.type = 'admin'
    )
  );
```

### 1.2 Create Activity Logging Function
**File**: `supabase/migrations/20250716000002_create_activity_logging.sql`

```sql
-- Activity logging function
CREATE OR REPLACE FUNCTION log_account_activity()
RETURNS TRIGGER AS $$
DECLARE
  affected_account_id UUID;
  activity_description TEXT;
BEGIN
  -- Determine affected account
  affected_account_id := COALESCE(NEW.id, OLD.id);
  
  -- Create description based on operation
  activity_description := CASE TG_OP
    WHEN 'INSERT' THEN 'Account created: ' || NEW.name
    WHEN 'UPDATE' THEN 'Account updated: ' || NEW.name
    WHEN 'DELETE' THEN 'Account deleted: ' || OLD.name
  END;
  
  -- Log the activity
  INSERT INTO account_activities (
    actor_id, 
    account_id, 
    activity_type, 
    target_type, 
    target_id, 
    description, 
    metadata
  ) VALUES (
    auth.uid(),
    affected_account_id,
    TG_OP,
    'account',
    affected_account_id,
    activity_description,
    CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
      ELSE row_to_json(NEW)
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on accounts table
CREATE TRIGGER account_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON accounts
  FOR EACH ROW EXECUTE FUNCTION log_account_activity();
```

### 1.3 Run Migrations
```bash
# Apply migrations
supabase db push

# Verify migrations
supabase db diff    # Should show no differences
```

## Step 2: Backend Service Implementation

### 2.1 Extend Admin Service Types
**File**: `src/types/admin.ts`

```typescript
// Epic 3 Phase 1: Admin account types
export interface AdminAccount {
  id: string;
  name: string;
  type: 'client' | 'affiliate' | 'expert' | 'admin';
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  profile_count?: number;
  tool_count?: number;
  last_activity?: string;
}

export interface AccountActivity {
  id: string;
  actor_id: string;
  account_id: string;
  activity_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  target_type: 'account' | 'tool' | 'profile' | 'invoice' | 'user';
  target_id: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  actor_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AccountFilters {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateAccountData {
  name: string;
  type: 'client' | 'affiliate' | 'expert';
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateAccountData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface AccountListResponse {
  accounts: AdminAccount[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
```

### 2.2 Implement Account Service
**File**: `src/modules/admin/services/adminAccountService.ts`

```typescript
import { supabase } from '@/lib/supabase';
import type { 
  AdminAccount, 
  AccountActivity, 
  AccountFilters, 
  CreateAccountData, 
  UpdateAccountData, 
  AccountListResponse 
} from '@/types/admin';

export class AdminAccountService {
  
  async getAccounts(filters: AccountFilters = {}): Promise<AccountListResponse> {
    const {
      search = '',
      type,
      status,
      page = 1,
      limit = 25,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    let query = supabase
      .from('accounts')
      .select(`
        *,
        profiles:profiles(count),
        account_tool_access:account_tool_access(count),
        last_activity:account_activities(created_at)
      `, { count: 'exact' })
      .neq('type', 'admin'); // Exclude admin accounts from listing

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    // Transform data to include computed fields
    const accounts: AdminAccount[] = (data || []).map(account => ({
      ...account,
      profile_count: account.profiles?.[0]?.count || 0,
      tool_count: account.account_tool_access?.[0]?.count || 0,
      last_activity: account.last_activity?.[0]?.created_at
    }));

    return {
      accounts,
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    };
  }

  async getAccount(id: string): Promise<AdminAccount> {
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles:profiles(*),
        account_tool_access:account_tool_access(
          *,
          tools:tools(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch account: ${error.message}`);
    }

    return data;
  }

  async createAccount(accountData: CreateAccountData): Promise<AdminAccount> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        ...accountData,
        status: accountData.status || 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }

    // Log the creation activity
    await this.logActivity({
      account_id: data.id,
      activity_type: 'CREATE',
      target_type: 'account',
      target_id: data.id,
      description: `Account created: ${data.name}`,
      metadata: { account_data: accountData }
    });

    return data;
  }

  async updateAccount(id: string, accountData: UpdateAccountData): Promise<AdminAccount> {
    const { data, error } = await supabase
      .from('accounts')
      .update(accountData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update account: ${error.message}`);
    }

    // Log the update activity
    await this.logActivity({
      account_id: id,
      activity_type: 'UPDATE',
      target_type: 'account',
      target_id: id,
      description: `Account updated: ${data.name}`,
      metadata: { updates: accountData }
    });

    return data;
  }

  async deleteAccount(id: string): Promise<void> {
    // First get account name for logging
    const { data: account } = await supabase
      .from('accounts')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }

    // Log the deletion activity
    await this.logActivity({
      account_id: id,
      activity_type: 'DELETE',
      target_type: 'account',
      target_id: id,
      description: `Account deleted: ${account?.name || 'Unknown'}`,
      metadata: { deleted_account_id: id }
    });
  }

  async getAccountActivities(accountId: string): Promise<AccountActivity[]> {
    const { data, error } = await supabase
      .from('account_activities')
      .select(`
        *,
        actor_profile:profiles!actor_id(
          first_name,
          last_name,
          email
        )
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch account activities: ${error.message}`);
    }

    return data || [];
  }

  async logActivity(activity: Omit<AccountActivity, 'id' | 'created_at' | 'actor_id'>): Promise<void> {
    const { error } = await supabase
      .from('account_activities')
      .insert({
        ...activity,
        actor_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error for logging failures
    }
  }
}

export const adminAccountService = new AdminAccountService();
```

### 2.3 Extend Admin Service Edge Function
**File**: `supabase/functions/admin-service/index.ts` (extend existing)

```typescript
// Add to existing admin-service Edge Function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ... existing imports and setup ...

serve(async (req) => {
  try {
    const { url, method } = req;
    const pathname = new URL(url).pathname;

    // ... existing routes ...

    // NEW: Account management routes
    if (pathname.startsWith('/api/admin/accounts')) {
      return handleAccountManagement(req);
    }

    // ... existing routes ...

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function handleAccountManagement(req: Request): Promise<Response> {
  const { method } = req;
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  // Extract account ID if present
  const pathParts = pathname.split('/');
  const accountId = pathParts[4]; // /api/admin/accounts/{id}
  
  switch (method) {
    case 'GET':
      if (accountId) {
        if (pathname.endsWith('/activities')) {
          return getAccountActivities(accountId);
        } else {
          return getAccount(accountId);
        }
      } else {
        return getAccounts(url.searchParams);
      }
    
    case 'POST':
      if (accountId && pathname.endsWith('/activities')) {
        return logAccountActivity(req, accountId);
      } else {
        return createAccount(req);
      }
    
    case 'PUT':
      if (accountId) {
        return updateAccount(req, accountId);
      }
      break;
    
    case 'DELETE':
      if (accountId) {
        return deleteAccount(accountId);
      }
      break;
  }
  
  return new Response('Not Found', { status: 404 });
}

// Implementation functions for account operations
async function getAccounts(searchParams: URLSearchParams): Promise<Response> {
  // Implementation using AdminAccountService logic
}

async function getAccount(accountId: string): Promise<Response> {
  // Implementation using AdminAccountService logic
}

async function createAccount(req: Request): Promise<Response> {
  // Implementation using AdminAccountService logic
}

async function updateAccount(req: Request, accountId: string): Promise<Response> {
  // Implementation using AdminAccountService logic
}

async function deleteAccount(accountId: string): Promise<Response> {
  // Implementation using AdminAccountService logic
}

async function getAccountActivities(accountId: string): Promise<Response> {
  // Implementation using AdminAccountService logic
}

async function logAccountActivity(req: Request, accountId: string): Promise<Response> {
  // Implementation using AdminAccountService logic
}
```

## Step 3: Frontend Component Implementation

### 3.1 Account Management Hook
**File**: `src/modules/admin/hooks/useAdminAccounts.ts`

```typescript
import { useState, useEffect } from 'react';
import { adminAccountService } from '@/modules/admin/services/adminAccountService';
import type { AdminAccount, AccountFilters, AccountListResponse } from '@/types/admin';

export function useAdminAccounts(filters: AccountFilters = {}) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    total_pages: 0
  });

  const fetchAccounts = async (newFilters: AccountFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminAccountService.getAccounts({
        ...filters,
        ...newFilters
      });
      
      setAccounts(response.accounts);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        total_pages: response.total_pages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (accountData: any) => {
    try {
      const newAccount = await adminAccountService.createAccount(accountData);
      await fetchAccounts(); // Refresh list
      return newAccount;
    } catch (err) {
      throw err;
    }
  };

  const updateAccount = async (id: string, accountData: any) => {
    try {
      const updatedAccount = await adminAccountService.updateAccount(id, accountData);
      await fetchAccounts(); // Refresh list
      return updatedAccount;
    } catch (err) {
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await adminAccountService.deleteAccount(id);
      await fetchAccounts(); // Refresh list
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    accounts,
    loading,
    error,
    pagination,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount
  };
}
```

### 3.2 Account Table Component
**File**: `src/modules/admin/components/accounts/AccountTable.tsx`

```typescript
import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { useAdminAccounts } from '@/modules/admin/hooks/useAdminAccounts';
import type { AdminAccount, AccountFilters } from '@/types/admin';

interface AccountTableProps {
  onCreateAccount: () => void;
  onEditAccount: (account: AdminAccount) => void;
  onDeleteAccount: (account: AdminAccount) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  onCreateAccount,
  onEditAccount,
  onDeleteAccount
}) => {
  const [filters, setFilters] = useState<AccountFilters>({});
  const { accounts, loading, error, pagination, fetchAccounts } = useAdminAccounts(filters);

  const handleFilterChange = (newFilters: Partial<AccountFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchAccounts(updatedFilters);
  };

  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    fetchAccounts(updatedFilters);
  };

  if (loading) return <div>Loading accounts...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Account Management</h1>
        <button
          onClick={onCreateAccount}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Create Account
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search accounts..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filters.type || ''}
            onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
          >
            <option value="">All Types</option>
            <option value="client">Client</option>
            <option value="affiliate">Affiliate</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profiles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tools
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{account.name}</div>
                    {account.email && (
                      <div className="text-sm text-gray-500">{account.email}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {account.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    account.status === 'active' ? 'bg-green-100 text-green-800' :
                    account.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {account.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {account.profile_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {account.tool_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.last_activity ? new Date(account.last_activity).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEditAccount(account)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteAccount(account)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

## Step 4: Testing Implementation

### 4.1 Unit Tests
**File**: `src/modules/admin/services/__tests__/adminAccountService.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminAccountService } from '../adminAccountService';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } })
    }
  }
}));

describe('AdminAccountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAccounts', () => {
    it('should fetch accounts with filters', async () => {
      // Test implementation
    });

    it('should handle pagination correctly', async () => {
      // Test implementation
    });

    it('should exclude admin accounts from listing', async () => {
      // Test implementation
    });
  });

  describe('createAccount', () => {
    it('should create account and log activity', async () => {
      // Test implementation
    });

    it('should validate required fields', async () => {
      // Test implementation
    });
  });

  describe('updateAccount', () => {
    it('should update account and log activity', async () => {
      // Test implementation
    });
  });

  describe('deleteAccount', () => {
    it('should delete account and log activity', async () => {
      // Test implementation
    });
  });
});
```

### 4.2 Integration Tests
**File**: `src/modules/admin/components/__tests__/AccountTable.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountTable } from '../accounts/AccountTable';

// Mock hooks
vi.mock('../../hooks/useAdminAccounts', () => ({
  useAdminAccounts: vi.fn(() => ({
    accounts: [
      {
        id: '1',
        name: 'Test Account',
        type: 'client',
        status: 'active',
        profile_count: 2,
        tool_count: 3,
        last_activity: '2025-07-16T00:00:00Z'
      }
    ],
    loading: false,
    error: null,
    pagination: { total: 1, page: 1, limit: 25, total_pages: 1 },
    fetchAccounts: vi.fn()
  }))
}));

describe('AccountTable', () => {
  const mockProps = {
    onCreateAccount: vi.fn(),
    onEditAccount: vi.fn(),
    onDeleteAccount: vi.fn()
  };

  it('should render account list correctly', () => {
    render(<AccountTable {...mockProps} />);
    
    expect(screen.getByText('Test Account')).toBeInTheDocument();
    expect(screen.getByText('client')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should handle search filter', async () => {
    render(<AccountTable {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search accounts...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Verify filter was applied
    await waitFor(() => {
      // Assert search functionality
    });
  });

  it('should handle create account action', () => {
    render(<AccountTable {...mockProps} />);
    
    const createButton = screen.getByText('Create Account');
    fireEvent.click(createButton);
    
    expect(mockProps.onCreateAccount).toHaveBeenCalled();
  });
});
```

## Step 5: Integration and Testing

### 5.1 Integration Testing Checklist
- [ ] Database migrations applied successfully
- [ ] Account creation workflow functioning
- [ ] Account listing and filtering working
- [ ] Account editing and deletion working
- [ ] Activity logging capturing all actions
- [ ] RLS policies enforcing admin access
- [ ] Existing functionality unaffected

### 5.2 Performance Testing
```bash
# Database performance testing
EXPLAIN ANALYZE SELECT * FROM accounts WHERE name ILIKE '%test%';
EXPLAIN ANALYZE SELECT * FROM account_activities WHERE account_id = 'uuid';

# Load testing
npm run test:load
```

### 5.3 Security Testing
- [ ] Admin role validation enforced
- [ ] RLS policies preventing unauthorized access
- [ ] Input validation preventing injection attacks
- [ ] Activity logging cannot be tampered with

## Deployment

### 5.1 Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Database migrations tested on staging
- [ ] Performance benchmarks met
- [ ] Security validation completed
- [ ] Code review completed

### 5.2 Deployment Steps
```bash
# 1. Deploy database migrations
supabase db push --linked

# 2. Deploy Edge Function updates
supabase functions deploy admin-service

# 3. Deploy frontend changes
npm run build
npm run deploy

# 4. Verify deployment
npm run test:e2e
```

### 5.3 Post-Deployment Validation
- [ ] Account management functionality verified
- [ ] Activity logging working correctly
- [ ] Performance within acceptable range
- [ ] No regression in existing functionality

---

**Phase 1 Implementation Complete**: Account management foundation established with comprehensive audit logging and admin security, ready for Phase 2 development.