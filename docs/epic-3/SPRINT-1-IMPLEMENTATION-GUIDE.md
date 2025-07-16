# Sprint 1 Implementation Guide: Account Management Foundation

**Sprint Duration**: July 16 - July 29, 2025 (2 weeks)  
**Phase**: Account Management Foundation  
**Total Story Points**: 37 points  
**Team**: 2-3 developers + 1 QA engineer + 1 PM

---

## Sprint 1 Overview

Sprint 1 establishes the foundational infrastructure for Epic 3 Admin Platform Management. This sprint focuses on creating robust account management capabilities with comprehensive audit logging, security controls, and performance optimization.

### Sprint Goals
1. **Foundation First**: Establish database schema and security framework
2. **Core CRUD**: Implement complete account management operations
3. **Activity Logging**: Create comprehensive audit trail system
4. **Performance**: Meet all benchmark requirements
5. **Security**: Implement admin access controls

---

# STORY IMPLEMENTATION ROADMAP

## Week 1: Foundation & Core Systems

### Day 1-2: Story 1.1 - Database Foundation (13 points) ⚠️ HIGH RISK

**Assigned Developer**: Senior Full-Stack Developer (Lead)  
**Priority**: CRITICAL - All other stories depend on this  
**Status**: Ready to Start

#### Implementation Steps

**Day 1 Morning: Schema Design**
```bash
# Navigate to project directory
cd /Users/admin/CodeProjects/openside/battleborn/taxapp

# Create new migration file
touch db/bba/supabase/migrations/$(date +%Y%m%d%H%M%S)_epic3_account_activities.sql
```

**Database Schema Implementation:**
```sql
-- Epic 3: Account Activities Table
-- File: db/bba/supabase/migrations/YYYYMMDDHHMMSS_epic3_account_activities.sql

-- Create account_activities table
CREATE TABLE account_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL CHECK (activity_type IN (
        'account_created', 'account_updated', 'account_deleted',
        'profile_added', 'profile_removed', 'status_changed',
        'tool_assigned', 'tool_removed', 'billing_updated'
    )),
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_account_activities_account_id ON account_activities(account_id);
CREATE INDEX idx_account_activities_actor_id ON account_activities(actor_id);
CREATE INDEX idx_account_activities_created_at ON account_activities(created_at DESC);
CREATE INDEX idx_account_activities_type ON account_activities(activity_type);
CREATE INDEX idx_account_activities_target ON account_activities(target_type, target_id);

-- Composite index for common queries
CREATE INDEX idx_account_activities_account_date ON account_activities(account_id, created_at DESC);

-- RLS Policies
ALTER TABLE account_activities ENABLE ROW LEVEL SECURITY;

-- Admin users can view all activities
CREATE POLICY "Admins can view all account activities" ON account_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() 
            AND a.type = 'admin'
        )
    );

-- Admin users can insert activities
CREATE POLICY "Admins can log activities" ON account_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() 
            AND a.type = 'admin'
        )
    );

-- Activity logging function
CREATE OR REPLACE FUNCTION log_account_activity(
    p_account_id UUID,
    p_activity_type VARCHAR,
    p_target_type VARCHAR,
    p_target_id UUID,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO account_activities (
        actor_id,
        account_id,
        activity_type,
        target_type,
        target_id,
        description,
        metadata,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        p_account_id,
        p_activity_type,
        p_target_type,
        p_target_id,
        p_description,
        p_metadata,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for automatic logging
CREATE OR REPLACE FUNCTION auto_log_account_changes() RETURNS TRIGGER AS $$
BEGIN
    -- Log account updates
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'accounts' THEN
        PERFORM log_account_activity(
            NEW.id,
            'account_updated',
            'account',
            NEW.id,
            'Account information updated',
            json_build_object(
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW),
                'changed_fields', (
                    SELECT json_object_agg(key, value)
                    FROM jsonb_each(to_jsonb(NEW))
                    WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
                )
            )
        );
    END IF;
    
    -- Log account creation
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'accounts' THEN
        PERFORM log_account_activity(
            NEW.id,
            'account_created',
            'account',
            NEW.id,
            'New account created: ' || NEW.name,
            to_jsonb(NEW)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic logging
CREATE TRIGGER trigger_auto_log_account_changes
    AFTER INSERT OR UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION auto_log_account_changes();
```

**Day 1 Afternoon: Migration Testing**
```bash
# Test migration in development
supabase migration up

# Verify tables created
supabase db reset
supabase migration up

# Test performance with sample data
psql postgresql://localhost:54322/postgres -c "
INSERT INTO account_activities (account_id, activity_type, target_type, target_id, description)
SELECT 
    (SELECT id FROM accounts LIMIT 1),
    'account_updated',
    'account',
    (SELECT id FROM accounts LIMIT 1),
    'Test activity ' || generate_series
FROM generate_series(1, 10000);
"

# Performance test
psql postgresql://localhost:54322/postgres -c "
EXPLAIN ANALYZE SELECT * FROM account_activities 
WHERE account_id = (SELECT id FROM accounts LIMIT 1)
ORDER BY created_at DESC LIMIT 50;
"
```

**Day 2: API Service Implementation**

Create admin service endpoint:
```typescript
// File: db/bba/supabase/functions/admin-service/activity-handler.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ActivityRequest {
  accountId: string;
  activityType: string;
  targetType: string;
  targetId: string;
  description: string;
  metadata?: Record<string, any>;
}

interface ActivityFilters {
  accountId?: string;
  activityType?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export async function handleActivityOperations(
  request: Request,
  supabase: any
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  // GET /api/admin/accounts/:id/activities - List activities
  if (method === 'GET' && url.pathname.includes('/activities')) {
    return await getAccountActivities(request, supabase);
  }

  // POST /api/admin/accounts/:id/activities - Log activity
  if (method === 'POST' && url.pathname.includes('/activities')) {
    return await logActivity(request, supabase);
  }

  return new Response('Not Found', { status: 404 });
}

async function getAccountActivities(
  request: Request,
  supabase: any
): Promise<Response> {
  const url = new URL(request.url);
  const accountId = url.pathname.split('/')[4]; // Extract account ID
  
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const activityType = url.searchParams.get('type');
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  try {
    let query = supabase
      .from('account_activities')
      .select(`
        id,
        actor_id,
        activity_type,
        target_type,
        target_id,
        description,
        metadata,
        created_at,
        profiles:actor_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: activities, error, count } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activities' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        activities,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil((count || 0) / limit)
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function logActivity(
  request: Request,
  supabase: any
): Promise<Response> {
  try {
    const body: ActivityRequest = await request.json();
    const { accountId, activityType, targetType, targetId, description, metadata } = body;

    // Validate required fields
    if (!accountId || !activityType || !targetType || !targetId || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call the logging function
    const { data, error } = await supabase.rpc('log_account_activity', {
      p_account_id: accountId,
      p_activity_type: activityType,
      p_target_type: targetType,
      p_target_id: targetId,
      p_description: description,
      p_metadata: metadata || {}
    });

    if (error) {
      console.error('Error logging activity:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log activity' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, activityId: data }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Day 3-4: Story 1.2 - Account CRUD Operations (8 points)

**Assigned Developer**: Mid-Level Frontend Developer + Backend support  
**Status**: Depends on Story 1.1 completion

#### Backend Implementation

**Account Service Endpoints:**
```typescript
// File: db/bba/supabase/functions/admin-service/account-handler.ts

export async function handleAccountOperations(
  request: Request,
  supabase: any
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  switch (method) {
    case 'GET':
      if (url.pathname.includes('/accounts/')) {
        return await getAccount(request, supabase);
      } else {
        return await getAccounts(request, supabase);
      }
    case 'POST':
      return await createAccount(request, supabase);
    case 'PUT':
      return await updateAccount(request, supabase);
    case 'DELETE':
      return await deleteAccount(request, supabase);
    default:
      return new Response('Method not allowed', { status: 405 });
  }
}

async function getAccounts(request: Request, supabase: any): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract query parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const search = url.searchParams.get('search');
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  const sortBy = url.searchParams.get('sortBy') || 'created_at';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';

  try {
    let query = supabase
      .from('accounts')
      .select(`
        id,
        name,
        email,
        phone,
        type,
        status,
        address,
        metadata,
        created_at,
        updated_at,
        profiles:profiles(count)
      `, { count: 'exact' });

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
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: accounts, error, count } = await query;

    if (error) {
      console.error('Error fetching accounts:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch accounts' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        accounts,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil((count || 0) / limit)
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function createAccount(request: Request, supabase: any): Promise<Response> {
  try {
    const accountData = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'type'];
    for (const field of requiredFields) {
      if (!accountData[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(accountData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing account with same email
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('email', accountData.email)
      .single();

    if (existingAccount) {
      return new Response(
        JSON.stringify({ error: 'Account with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the account
    const { data: newAccount, error } = await supabase
      .from('accounts')
      .insert([{
        name: accountData.name,
        email: accountData.email,
        phone: accountData.phone,
        type: accountData.type,
        status: accountData.status || 'active',
        address: accountData.address || {},
        metadata: accountData.metadata || {}
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create account' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ account: newAccount }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

#### Frontend Implementation

**Account Management Components:**
```typescript
// File: src/modules/admin/components/accounts/AccountTable.tsx

import React, { useState, useEffect } from 'react';
import { useAdminAccountService } from '../services/adminAccountService';

interface Account {
  id: string;
  name: string;
  email: string;
  type: string;
  status: string;
  created_at: string;
  profiles: { count: number }[];
}

interface AccountFilters {
  search?: string;
  type?: string;
  status?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const AccountTable: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AccountFilters>({
    page: 1,
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0
  });

  const { getAccounts } = useAdminAccountService();

  useEffect(() => {
    loadAccounts();
  }, [filters]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await getAccounts(filters);
      setAccounts(response.accounts);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<AccountFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search accounts..."
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.search || ''}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
        
        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.type || ''}
          onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
        >
          <option value="">All Types</option>
          <option value="client">Client</option>
          <option value="affiliate">Affiliate</option>
          <option value="expert">Expert</option>
          <option value="admin">Admin</option>
        </select>

        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.status || ''}
          onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Name
                {filters.sortBy === 'name' && (
                  <span className="ml-1">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('email')}
              >
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profiles
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                Created
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {account.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    account.type === 'admin' ? 'bg-purple-100 text-purple-800' :
                    account.type === 'client' ? 'bg-blue-100 text-blue-800' :
                    account.type === 'affiliate' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {account.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    account.status === 'active' ? 'bg-green-100 text-green-800' :
                    account.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {account.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.profiles[0]?.count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(account.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    View
                  </button>
                  <button className="text-green-600 hover:text-green-900 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            disabled={filters.page === 1}
            onClick={() => handleFilterChange({ page: filters.page - 1 })}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={filters.page === pagination.pages}
            onClick={() => handleFilterChange({ page: filters.page + 1 })}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(filters.page * filters.limit, pagination.total)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{pagination.total}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                disabled={filters.page === 1}
                onClick={() => handleFilterChange({ page: filters.page - 1 })}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handleFilterChange({ page: pageNum })}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                      filters.page === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                disabled={filters.page === pagination.pages}
                onClick={() => handleFilterChange({ page: filters.page + 1 })}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Day 5: Story 1.3 - Account Activity Logging System (5 points)

**Assigned Developer**: Backend Developer  
**Status**: Backend integration with frontend display

**Activity Timeline Component:**
```typescript
// File: src/modules/admin/components/accounts/AccountActivityTimeline.tsx

import React, { useState, useEffect } from 'react';
import { useAdminAccountService } from '../services/adminAccountService';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
  profiles: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface ActivityTimelineProps {
  accountId: string;
}

export const AccountActivityTimeline: React.FC<ActivityTimelineProps> = ({ accountId }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });

  const { getAccountActivities, exportActivities } = useAdminAccountService();

  useEffect(() => {
    loadActivities();
  }, [accountId, filters]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await getAccountActivities(accountId, filters);
      setActivities(response.activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      await exportActivities(accountId, { ...filters, format });
    } catch (error) {
      console.error('Error exporting activities:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'account_created':
        return '🆕';
      case 'account_updated':
        return '✏️';
      case 'account_deleted':
        return '🗑️';
      case 'status_changed':
        return '🔄';
      case 'tool_assigned':
        return '🔧';
      case 'tool_removed':
        return '🔧❌';
      default:
        return '📝';
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex space-x-4 items-center">
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Activities</option>
          <option value="account_created">Account Created</option>
          <option value="account_updated">Account Updated</option>
          <option value="status_changed">Status Changed</option>
          <option value="tool_assigned">Tool Assigned</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />

        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />

        <div className="space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, activityIdx) => (
            <li key={activity.id}>
              <div className="relative pb-8">
                {activityIdx !== activities.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                      {getActivityIcon(activity.activity_type)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                        {activity.profiles && (
                          <span className="font-medium text-gray-900">
                            {' '}by {activity.profiles.first_name || activity.profiles.email}
                          </span>
                        )}
                      </p>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">
                            View Details
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={activity.created_at}>
                        {new Date(activity.created_at).toLocaleString()}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {activities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No activities found for this account.</p>
        </div>
      )}
    </div>
  );
};
```

## Week 2: Search, Security & Integration

### Day 6-7: Story 1.4 - Account Search and Filtering (3 points)

**Implementation Focus**: Advanced search with real-time results and performance optimization.

### Day 8-10: Story 1.5 - Admin Security and Access Control (8 points)

**Implementation Focus**: Complete security framework with role-based access control.

---

# TESTING STRATEGY

## Daily Testing Protocol

### Unit Testing (Continuous)
```bash
# Run unit tests for new components
npm run test src/modules/admin/components/accounts/

# Test specific story implementation
npm run test:coverage -- --testNamePattern="Account Management"

# Backend function testing
supabase functions serve
npm run test:integration
```

### Integration Testing (Weekly)
```bash
# Full workflow testing
npm run test:epic3:workflow

# Performance testing
npm run test:performance

# Security testing
npm run test:security
```

### Performance Benchmarks
- **Database queries**: < 100ms for standard operations
- **Account listing**: < 2 seconds for 1000+ accounts
- **Search results**: < 500ms response time
- **Activity timeline**: < 1 second load time

---

# DAILY CHECKLIST

## Sprint 1 Daily Tasks

### Daily Standup Items
- [ ] Yesterday's completed work
- [ ] Today's planned work
- [ ] Current blockers or impediments
- [ ] Help needed from team members

### Daily Quality Gates
- [ ] Code committed and reviewed
- [ ] Unit tests passing
- [ ] Performance benchmarks met
- [ ] Security standards followed
- [ ] Documentation updated

### Daily Communication
- [ ] Progress updated in project tracking
- [ ] Blockers escalated if not resolved within 24 hours
- [ ] Stakeholder communication if needed
- [ ] Risk assessment updated

---

# SUCCESS CRITERIA TRACKING

## Sprint 1 Completion Criteria

### Week 1 Success Metrics
- [ ] Database schema deployed and tested
- [ ] Activity logging system operational
- [ ] Basic account CRUD functionality
- [ ] Performance benchmarks established

### Week 2 Success Metrics
- [ ] Complete account management system
- [ ] Advanced search and filtering
- [ ] Security access controls implemented
- [ ] Full test coverage achieved

### Final Sprint 1 Validation
- [ ] All 37 story points completed
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Ready for Sprint 2 handoff

---

This implementation guide provides detailed, actionable steps for the development team to begin Sprint 1 immediately with clear daily objectives and success criteria. The focus on database foundation first ensures a solid technical foundation for all subsequent Epic 3 development.