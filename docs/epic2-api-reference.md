# Epic 2 API Reference

## Overview

This document provides detailed API reference for Epic 2: Client Dashboard Enhancement features, including database functions, REST endpoints, and data structures.

## Database Functions

### `get_client_dashboard_metrics(client_id UUID)`

Retrieves comprehensive dashboard metrics for a specific client.

#### Parameters
- `client_id` (UUID): The unique identifier of the client

#### Returns
JSON object containing:
```json
{
  "total_proposals": 15,
  "active_proposals": 8,
  "total_savings": 125000,
  "completion_rate": 75,
  "trend_data": [
    {
      "date": "2025-01-06",
      "proposals": 2
    },
    {
      "date": "2025-01-07", 
      "proposals": 3
    }
  ],
  "savings_breakdown": {
    "tax_credits": 75000,
    "federal_savings": 30000,
    "state_savings": 20000
  }
}
```

#### Usage Example
```typescript
const { data, error } = await supabase.rpc('get_client_dashboard_metrics', {
  client_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
});
```

#### Error Handling
- Returns `null` if client not found
- Returns empty metrics if no proposals exist
- Handles database connection errors gracefully

## REST API Endpoints

### Client Activities

#### GET `/rest/v1/client_activities`

Retrieves recent activities for a client.

##### Query Parameters
- `client_id=eq.{uuid}` (required): Filter by client ID
- `order=created_at.desc` (optional): Sort by creation date
- `limit={number}` (optional): Limit number of results (default: 10)
- `offset={number}` (optional): Pagination offset

##### Response
```json
[
  {
    "id": 1,
    "client_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
    "activity_type": "proposal_created",
    "description": "New tax proposal created",
    "metadata": {
      "proposal_id": "prop-123",
      "proposal_type": "business_tax"
    },
    "created_at": "2025-01-12T10:00:00Z"
  }
]
```

##### Usage Example
```typescript
const { data, error } = await supabase
  .from('client_activities')
  .select('*')
  .eq('client_id', clientId)
  .order('created_at', { ascending: false })
  .limit(10);
```

#### POST `/rest/v1/client_activities`

Creates a new activity entry.

##### Request Body
```json
{
  "client_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
  "activity_type": "document_uploaded",
  "description": "Tax document uploaded for review",
  "metadata": {
    "document_name": "tax_return_2024.pdf",
    "file_size": 2048576,
    "document_type": "tax_return"
  }
}
```

##### Response
```json
{
  "id": 2,
  "client_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
  "activity_type": "document_uploaded",
  "description": "Tax document uploaded for review",
  "metadata": {
    "document_name": "tax_return_2024.pdf",
    "file_size": 2048576,
    "document_type": "tax_return"
  },
  "created_at": "2025-01-12T15:30:00Z"
}
```

### Client Engagement Metrics

#### GET `/rest/v1/client_engagement_metrics`

Retrieves engagement metrics for a client.

##### Query Parameters
- `client_id=eq.{uuid}` (required): Filter by client ID
- `date=eq.{date}` (optional): Filter by specific date

##### Response
```json
[
  {
    "id": 1,
    "client_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "session_duration": 1800,
    "pages_viewed": 5,
    "actions_taken": 3,
    "last_activity": "2025-01-12T16:45:00Z",
    "date": "2025-01-12",
    "created_at": "2025-01-12T09:00:00Z",
    "updated_at": "2025-01-12T16:45:00Z"
  }
]
```

#### POST `/rest/v1/client_engagement_metrics`

Creates or updates engagement metrics (upsert operation).

##### Request Body
```json
{
  "client_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "session_duration": 2100,
  "pages_viewed": 7,
  "actions_taken": 4,
  "last_activity": "2025-01-12T17:00:00Z"
}
```

## Data Structures

### Activity Types

Supported activity types and their descriptions:

| Type | Description | Metadata Fields |
|------|-------------|----------------|
| `proposal_created` | New tax proposal created | `proposal_id`, `proposal_type` |
| `document_uploaded` | Document uploaded | `document_name`, `file_size`, `document_type` |
| `meeting_scheduled` | Meeting scheduled | `meeting_date`, `meeting_type`, `duration` |
| `payment_processed` | Payment completed | `amount`, `payment_method`, `transaction_id` |
| `status_updated` | Proposal status changed | `old_status`, `new_status`, `proposal_id` |
| `user_invited` | User invited to client | `invited_email`, `role` |
| `profile_updated` | Client profile updated | `fields_changed` |

### Dashboard Metrics Interface

```typescript
interface DashboardMetrics {
  total_proposals: number;
  active_proposals: number;
  total_savings: number;
  completion_rate: number;
  trend_data: TrendData[];
  savings_breakdown: SavingsBreakdown;
}

interface TrendData {
  date: string; // ISO date format
  proposals: number;
}

interface SavingsBreakdown {
  tax_credits: number;
  federal_savings: number;
  state_savings: number;
}
```

### Activity Interface

```typescript
interface Activity {
  id: number;
  client_id: string;
  user_id?: string;
  activity_type: ActivityType;
  description: string;
  metadata: Record<string, any>;
  created_at: string; // ISO timestamp
}

type ActivityType = 
  | 'proposal_created'
  | 'document_uploaded'
  | 'meeting_scheduled'
  | 'payment_processed'
  | 'status_updated'
  | 'user_invited'
  | 'profile_updated';
```

### Engagement Metrics Interface

```typescript
interface EngagementMetrics {
  id: number;
  client_id: string;
  session_duration: number; // seconds
  pages_viewed: number;
  actions_taken: number;
  last_activity: string; // ISO timestamp
  date: string; // ISO date
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

## Authentication & Authorization

### Row Level Security (RLS)

All Epic 2 tables implement RLS policies:

#### `client_activities` Policies
```sql
-- Users can only see activities for their own clients
CREATE POLICY "Users can view own client activities" ON client_activities
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN client_users cu ON c.id = cu.client_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- Users can create activities for their own clients
CREATE POLICY "Users can create activities for own clients" ON client_activities
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN client_users cu ON c.id = cu.client_id
      WHERE cu.user_id = auth.uid()
    )
  );
```

#### `client_engagement_metrics` Policies
```sql
-- Similar policies apply for engagement metrics
CREATE POLICY "Users can view own client engagement" ON client_engagement_metrics
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN client_users cu ON c.id = cu.client_id
      WHERE cu.user_id = auth.uid()
    )
  );
```

### API Authentication

All API calls require authentication:

```typescript
// Include auth header
const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// User must be authenticated
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  throw new Error('Authentication required');
}
```

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "code": "PGRST301",
  "details": null,
  "hint": null,
  "message": "JWT expired"
}
```

#### 403 Forbidden
```json
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"client_activities\""
}
```

#### 400 Bad Request
```json
{
  "code": "23502",
  "details": "Failing row contains (null, ...)",
  "hint": null,
  "message": "null value in column \"client_id\" violates not-null constraint"
}
```

### Error Handling Best Practices

```typescript
try {
  const { data, error } = await supabase.rpc('get_client_dashboard_metrics', {
    client_id: clientId
  });
  
  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }
  
  return data;
} catch (error) {
  console.error('API error:', error);
  throw error;
}
```

## Rate Limiting

### Default Limits
- Dashboard metrics: 60 requests/minute per user
- Activity creation: 30 requests/minute per user
- Activity retrieval: 120 requests/minute per user

### Handling Rate Limits
```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(fn: () => Promise<any>, retries = 3): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.message.includes('rate limit')) {
      await delay(1000); // Wait 1 second
      return fetchWithRetry(fn, retries - 1);
    }
    throw error;
  }
}
```

## Performance Optimization

### Caching Strategies

#### Client-side Caching
```typescript
// Cache dashboard metrics for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class DashboardCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  get(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }
  
  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
```

#### Database Optimization
- Indexes on frequently queried columns
- Materialized views for complex aggregations
- Connection pooling for high traffic

### Pagination

```typescript
// Implement cursor-based pagination for activities
async function getActivities(clientId: string, cursor?: string, limit = 10) {
  let query = supabase
    .from('client_activities')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  
  return query;
}
```

## Testing

### API Testing Examples

```typescript
// Test dashboard metrics endpoint
describe('Dashboard Metrics API', () => {
  test('should return valid metrics structure', async () => {
    const { data, error } = await supabase.rpc('get_client_dashboard_metrics', {
      client_id: testClientId
    });
    
    expect(error).toBeNull();
    expect(data).toHaveProperty('total_proposals');
    expect(data).toHaveProperty('active_proposals');
    expect(data).toHaveProperty('total_savings');
    expect(data).toHaveProperty('completion_rate');
    expect(Array.isArray(data.trend_data)).toBe(true);
  });
});

// Test activity creation
describe('Activity Creation API', () => {
  test('should create activity successfully', async () => {
    const activityData = {
      client_id: testClientId,
      activity_type: 'proposal_created',
      description: 'Test proposal created',
      metadata: { test: true }
    };
    
    const { data, error } = await supabase
      .from('client_activities')
      .insert(activityData)
      .select()
      .single();
      
    expect(error).toBeNull();
    expect(data.id).toBeDefined();
    expect(data.activity_type).toBe('proposal_created');
  });
});
```

## Migration Guide

### Database Migrations

To apply Epic 2 database changes:

```sql
-- Run migration file
\i db/bba/supabase/migrations/20250112200000_epic2_client_activities.sql
```

### API Integration

Update existing code to use new endpoints:

```typescript
// Before (Epic 1)
const activities = await getBasicActivities(clientId);

// After (Epic 2)
const { data: activities } = await supabase
  .from('client_activities')
  .select('*')
  .eq('client_id', clientId)
  .order('created_at', { ascending: false })
  .limit(10);
```

## Support

For API support and questions:
- Check error logs in browser console
- Verify authentication status
- Test API endpoints directly using Supabase dashboard
- Review RLS policies for data access issues

For additional help, refer to the main Epic 2 documentation or contact the development team. 