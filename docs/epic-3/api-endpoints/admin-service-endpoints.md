# Admin Service API Endpoints - Epic 3

**Document Type**: API Specification  
**Service**: admin-service Edge Function  
**Last Updated**: 2025-07-16

## Overview

This document specifies all API endpoints for the Epic 3 Admin Platform Management system. All endpoints extend the existing `admin-service` Edge Function and maintain compatibility with existing functionality.

## Authentication

All admin endpoints require:
- Valid JWT token in `Authorization: Bearer <token>` header
- Admin role verification (account.type = 'admin')
- Active session validation

## Base URL Structure

```
https://your-supabase-project.supabase.co/functions/v1/admin-service/api/admin/
```

## Phase 1: Account Management Endpoints

### Account CRUD Operations

#### List Accounts
```http
GET /api/admin/accounts
```

**Query Parameters:**
- `search` (string): Search by name or email
- `type` (string): Filter by account type (client, affiliate, expert)
- `status` (string): Filter by status (active, inactive, suspended)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 25, max: 100)
- `sort_by` (string): Sort field (default: created_at)
- `sort_order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "name": "Account Name",
      "type": "client",
      "email": "email@example.com",
      "phone": "+1234567890",
      "address": "123 Main St",
      "status": "active",
      "profile_count": 3,
      "tool_count": 5,
      "last_activity": "2025-07-16T10:30:00Z",
      "created_at": "2025-07-01T09:00:00Z",
      "updated_at": "2025-07-16T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 25,
  "total_pages": 6
}
```

#### Get Account Details
```http
GET /api/admin/accounts/{account_id}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Account Name",
  "type": "client",
  "email": "email@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "status": "active",
  "metadata": {},
  "created_at": "2025-07-01T09:00:00Z",
  "updated_at": "2025-07-16T10:30:00Z",
  "profiles": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "role": "admin"
    }
  ],
  "tools": [
    {
      "id": "uuid",
      "name": "Tax Calculator",
      "subscription_level": "premium",
      "expires_at": "2025-12-31T23:59:59Z"
    }
  ]
}
```

#### Create Account
```http
POST /api/admin/accounts
```

**Request Body:**
```json
{
  "name": "New Account Name",
  "type": "client",
  "email": "newaccount@example.com",
  "phone": "+1234567890",
  "address": "456 Oak Ave",
  "status": "active"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "New Account Name",
  "type": "client",
  "email": "newaccount@example.com",
  "phone": "+1234567890",
  "address": "456 Oak Ave",
  "status": "active",
  "created_at": "2025-07-16T10:30:00Z",
  "updated_at": "2025-07-16T10:30:00Z"
}
```

#### Update Account
```http
PUT /api/admin/accounts/{account_id}
```

**Request Body:**
```json
{
  "name": "Updated Account Name",
  "email": "updated@example.com",
  "phone": "+1987654321",
  "status": "active"
}
```

#### Delete Account
```http
DELETE /api/admin/accounts/{account_id}
```

**Response:** `204 No Content`

### Account Activity Endpoints

#### Get Account Activities
```http
GET /api/admin/accounts/{account_id}/activities
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `activity_type` (string): Filter by activity type
- `start_date` (string): Start date filter (ISO 8601)
- `end_date` (string): End date filter (ISO 8601)

**Response:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "actor_id": "uuid",
      "account_id": "uuid",
      "activity_type": "UPDATE",
      "target_type": "account",
      "target_id": "uuid",
      "description": "Account updated: Account Name",
      "metadata": {
        "updates": {
          "email": "newemail@example.com"
        }
      },
      "created_at": "2025-07-16T10:30:00Z",
      "actor_profile": {
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@example.com"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### Log Account Activity
```http
POST /api/admin/accounts/{account_id}/activities
```

**Request Body:**
```json
{
  "activity_type": "UPDATE",
  "target_type": "account",
  "target_id": "uuid",
  "description": "Manual activity log entry",
  "metadata": {
    "additional_info": "value"
  }
}
```

## Phase 2: Tool Management Endpoints

### Tool CRUD Operations

#### List Tools
```http
GET /api/admin/tools
```

**Response:**
```json
{
  "tools": [
    {
      "id": "uuid",
      "name": "Tax Calculator",
      "description": "Advanced tax calculation tool",
      "category": "tax",
      "subscription_levels": ["basic", "premium", "enterprise"],
      "status": "active",
      "created_at": "2025-07-01T09:00:00Z"
    }
  ]
}
```

#### Create Tool
```http
POST /api/admin/tools
```

### Tool Assignment Operations

#### Get Tool Assignment Matrix
```http
GET /api/admin/tools/assignments
```

**Query Parameters:**
- `account_type` (string): Filter by account type
- `tool_category` (string): Filter by tool category
- `status` (string): Filter by assignment status
- `expires_soon` (boolean): Show assignments expiring within 30 days

**Response:**
```json
{
  "matrix": [
    {
      "account_id": "uuid",
      "account_name": "Account Name",
      "assignments": [
        {
          "tool_id": "uuid",
          "tool_name": "Tax Calculator",
          "subscription_level": "premium",
          "status": "active",
          "expires_at": "2025-12-31T23:59:59Z",
          "created_at": "2025-07-01T09:00:00Z"
        }
      ]
    }
  ]
}
```

#### Assign Tool to Account
```http
POST /api/admin/tools/assign
```

**Request Body:**
```json
{
  "account_id": "uuid",
  "tool_id": "uuid",
  "subscription_level": "premium",
  "expires_at": "2025-12-31T23:59:59Z",
  "notes": "Premium access for tax season"
}
```

#### Remove Tool Assignment
```http
DELETE /api/admin/tools/unassign
```

**Request Body:**
```json
{
  "account_id": "uuid",
  "tool_id": "uuid"
}
```

#### Update Tool Assignment
```http
PUT /api/admin/tools/assignments/{assignment_id}
```

**Request Body:**
```json
{
  "subscription_level": "enterprise",
  "expires_at": "2026-12-31T23:59:59Z",
  "notes": "Upgraded to enterprise"
}
```

### Bulk Tool Operations

#### Bulk Tool Assignment
```http
POST /api/admin/tools/bulk-assign
```

**Request Body:**
```json
{
  "assignments": [
    {
      "account_id": "uuid1",
      "tool_id": "uuid",
      "subscription_level": "basic"
    },
    {
      "account_id": "uuid2",
      "tool_id": "uuid",
      "subscription_level": "premium"
    }
  ]
}
```

**Response:**
```json
{
  "successful": 2,
  "failed": 0,
  "errors": [],
  "results": [
    {
      "account_id": "uuid1",
      "tool_id": "uuid",
      "status": "success",
      "assignment_id": "uuid"
    }
  ]
}
```

### Tool Usage Analytics

#### Get Tool Usage Metrics
```http
GET /api/admin/tools/usage-metrics
```

**Query Parameters:**
- `tool_id` (string): Filter by specific tool
- `account_id` (string): Filter by specific account
- `start_date` (string): Start date for metrics
- `end_date` (string): End date for metrics
- `group_by` (string): Group by period (day, week, month)

**Response:**
```json
{
  "metrics": [
    {
      "tool_id": "uuid",
      "tool_name": "Tax Calculator",
      "total_usage": 150,
      "unique_users": 45,
      "avg_session_duration": 1200,
      "usage_trend": "increasing"
    }
  ],
  "time_series": [
    {
      "date": "2025-07-01",
      "usage_count": 25,
      "unique_users": 8
    }
  ]
}
```

## Phase 3: Profile Management Endpoints

### Profile CRUD Operations

#### List Profiles
```http
GET /api/admin/profiles
```

**Query Parameters:**
- `search` (string): Search by name or email
- `account_id` (string): Filter by account
- `role` (string): Filter by role
- `status` (string): Filter by status
- `auth_sync_status` (string): Filter by sync status

**Response:**
```json
{
  "profiles": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "role": "admin",
      "status": "active",
      "auth_sync_status": "synced",
      "last_login_at": "2025-07-16T09:00:00Z",
      "created_at": "2025-07-01T09:00:00Z"
    }
  ]
}
```

#### Create Profile
```http
POST /api/admin/profiles
```

#### Update Profile
```http
PUT /api/admin/profiles/{profile_id}
```

#### Delete Profile
```http
DELETE /api/admin/profiles/{profile_id}
```

### Auth Synchronization Endpoints

#### Sync All Profiles with Auth.Users
```http
POST /api/admin/profiles/sync-auth
```

**Request Body:**
```json
{
  "strategy": "profile_wins", // or "auth_wins", "merge"
  "force": false
}
```

#### Get Sync Status
```http
GET /api/admin/profiles/sync-status
```

**Response:**
```json
{
  "total_profiles": 150,
  "synced": 145,
  "conflicts": 3,
  "missing_auth": 2,
  "missing_profile": 0,
  "last_sync": "2025-07-16T08:00:00Z",
  "conflicts_details": [
    {
      "profile_id": "uuid",
      "conflict_type": "email_mismatch",
      "profile_email": "old@example.com",
      "auth_email": "new@example.com"
    }
  ]
}
```

#### Sync Individual Profile
```http
POST /api/admin/profiles/{profile_id}/sync
```

### Role Management Endpoints

#### Get Profile Roles
```http
GET /api/admin/profiles/{profile_id}/roles
```

#### Assign Role
```http
POST /api/admin/profiles/{profile_id}/roles
```

**Request Body:**
```json
{
  "role_name": "admin",
  "expires_at": "2026-07-16T23:59:59Z",
  "metadata": {
    "granted_reason": "Promotion to admin"
  }
}
```

#### Remove Role
```http
DELETE /api/admin/profiles/{profile_id}/roles/{role_name}
```

## Phase 4: Billing Integration Endpoints

### Invoice Management

#### List Invoices
```http
GET /api/admin/invoices
```

**Query Parameters:**
- `account_id` (string): Filter by account
- `status` (string): Filter by status
- `due_date_start` (string): Filter by due date range
- `due_date_end` (string): Filter by due date range

**Response:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "invoice_number": "INV-2025-001",
      "stripe_invoice_id": "in_xxxxx",
      "amount_cents": 10000,
      "currency": "USD",
      "status": "open",
      "due_date": "2025-08-16",
      "description": "Monthly subscription",
      "line_items": [
        {
          "description": "Premium Plan",
          "amount_cents": 10000,
          "quantity": 1
        }
      ],
      "created_at": "2025-07-16T10:00:00Z"
    }
  ]
}
```

#### Create Invoice
```http
POST /api/admin/invoices
```

**Request Body:**
```json
{
  "account_id": "uuid",
  "amount_cents": 10000,
  "currency": "USD",
  "due_date": "2025-08-16",
  "description": "Monthly subscription",
  "line_items": [
    {
      "description": "Premium Plan",
      "amount_cents": 10000,
      "quantity": 1
    }
  ],
  "auto_send": true
}
```

#### Send Invoice
```http
POST /api/admin/invoices/{invoice_id}/send
```

#### Void Invoice
```http
POST /api/admin/invoices/{invoice_id}/void
```

### Subscription Management

#### List Subscriptions
```http
GET /api/admin/subscriptions
```

#### Create Subscription
```http
POST /api/admin/subscriptions
```

**Request Body:**
```json
{
  "account_id": "uuid",
  "plan_name": "Premium Plan",
  "stripe_price_id": "price_xxxxx",
  "billing_interval": "month",
  "trial_days": 14,
  "metadata": {
    "plan_features": ["feature1", "feature2"]
  }
}
```

#### Update Subscription
```http
PUT /api/admin/subscriptions/{subscription_id}
```

#### Cancel Subscription
```http
DELETE /api/admin/subscriptions/{subscription_id}
```

### Stripe Integration

#### Sync with Stripe
```http
POST /api/admin/billing/sync
```

**Request Body:**
```json
{
  "object_type": "subscription",
  "object_id": "uuid",
  "force": false
}
```

#### Stripe Webhook Handler
```http
POST /api/admin/billing/webhook
```

### Billing Analytics

#### Get Billing Metrics
```http
GET /api/admin/billing/metrics
```

**Response:**
```json
{
  "total_revenue": 125000,
  "monthly_recurring_revenue": 45000,
  "active_subscriptions": 150,
  "churn_rate": 0.05,
  "average_revenue_per_user": 300,
  "period": {
    "start": "2025-07-01",
    "end": "2025-07-31"
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid account type provided",
    "details": {
      "field": "type",
      "allowed_values": ["client", "affiliate", "expert"]
    }
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Invalid or missing authentication
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., duplicate email)
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

- **Standard Operations**: 100 requests per minute per admin user
- **Bulk Operations**: 10 requests per minute per admin user
- **Analytics Queries**: 30 requests per minute per admin user

## Pagination

All list endpoints support pagination with:
- `page`: Page number (1-based)
- `limit`: Items per page (max 100)

Response includes:
- `total`: Total number of items
- `page`: Current page
- `limit`: Items per page
- `total_pages`: Total number of pages

## Filtering and Sorting

### Common Filter Parameters
- `search`: Text search across relevant fields
- `status`: Filter by status
- `created_at_start`: Start date filter
- `created_at_end`: End date filter

### Common Sort Parameters
- `sort_by`: Field to sort by
- `sort_order`: `asc` or `desc`

---

**API Documentation Complete**: Comprehensive API specification for all Epic 3 Admin Platform endpoints with detailed request/response examples and error handling.