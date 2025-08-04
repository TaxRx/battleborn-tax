# Client Security Model - Account-Based Access Control

## Overview

The Battle Born Capital Advisors application implements a comprehensive account-based security model that ensures clients can only access data associated with their account. This document outlines the security architecture, access patterns, and implementation details.

## Security Architecture

### Core Relationships

```
User (auth.users) 
    ↓ 1:1
Profile (profiles.id = auth.uid())
    ↓ N:1 (via profiles.account_id)
Account (accounts.id)
    ↓ 1:N (via clients.account_id)
Clients (clients)
    ↓ 1:N (via tax_proposals.client_id)
Tax Proposals (tax_proposals)
```

### Account Types

1. **Client Accounts**: Regular client users who can access all clients within their account
2. **Admin Accounts**: System administrators with access to all data across accounts
3. **Affiliate Accounts**: Sales agents who can create proposals for any client
4. **Operator Accounts**: Platform operators with service fulfillment access
5. **Expert Accounts**: Consulting experts with assigned client access

## Row-Level Security (RLS) Implementation

### Key Security Principles

1. **Account Isolation**: Users can only access data from their own account (except admins)
2. **Hierarchical Access**: Access flows from Account → Clients → Proposals → Related Data
3. **Role-Based Overrides**: Admins and certain roles have broader access patterns
4. **Defensive Programming**: All queries include account-based filtering at the application level

### RLS Policies by Table

#### Accounts Table
- `Users can view own account`: Access to user's account via `profiles.account_id`
- `Admins can view all accounts`: Admin role override
- `Users can update own account`: Update permissions for own account

#### Clients Table
- `Users can view clients from own account`: Via `profiles.account_id = clients.account_id`
- `Admins can view all clients`: Admin role override
- `Users can update clients from own account`: Update permissions within account
- `Users can insert clients to own account`: Insert permissions to own account

#### Tax Proposals Table
- `Users can view tax proposals from own account`: Via client → account relationship
- `Admins can view all tax proposals`: Admin role override
- `Users can update tax proposals from own account`: Update via account relationship
- `Users can insert tax proposals to own account`: Insert via account relationship
- `Affiliates can create proposals for any client`: Business logic override

### Security Helper Functions

#### `user_has_account_access(target_account_id UUID)`
Centralized function to check if the current authenticated user has access to a specific account.

**Returns**: `BOOLEAN`
**Logic**: 
- Returns `TRUE` if user's `profiles.account_id` matches `target_account_id`
- Returns `TRUE` if user has admin role
- Returns `FALSE` otherwise

## Application-Level Security

### AuthService Implementation

The `authService.ts` implements account-based access control:

```typescript
// Get all clients for user's account
async getClientsForAccount(accountId: string): Promise<Client[]>

// Check if user can access specific client
canAccessClient(user: AuthUser | null, clientId: string): boolean

// Get all accessible clients for user
getAccessibleClients(user: AuthUser | null): Client[]
```

### Permission System

Users receive account-wide permissions for all clients in their account:

```typescript
// Example permissions for a client in user's account
`client:${clientId}:full_access`
`client:${clientId}:manage_users`
`client:${clientId}:view_financials`
`client:${clientId}:edit_profile`
// ... etc
```

### ProposalService Security

The `proposalService.ts` includes account-based data fetching:

```typescript
// Fetch proposals for entire account
async getAccountProposals(accountId: string): Promise<ApiResponse<TaxProposal[]>>

// Fetch R&D data for entire account
async getAccountRDData(accountId: string): Promise<ApiResponse<any>>
```

## Security Verification

### Testing Access Control

1. **Account Isolation Test**: Verify users cannot access data from other accounts
2. **Admin Override Test**: Verify admins can access all data regardless of account
3. **Client Filtering Test**: Verify client lists are properly filtered by account
4. **Proposal Access Test**: Verify proposals are only accessible within account

### Database-Level Verification

Run the verification function to check policy installation:

```sql
SELECT verify_rls_policies();
```

Expected output should show policies for:
- Clients table: 4+ policies
- Tax_proposals table: 5+ policies  
- Accounts table: 3+ policies

## Migration and Deployment

### Migration File
`/taxapp/db/client_rls_policies.sql`

This migration:
1. Enables RLS on core tables
2. Creates account-based access policies
3. Implements admin overrides
4. Adds helper functions for access control
5. Handles optional related tables

### Deployment Steps

1. **Review Migration**: Ensure policies match business requirements
2. **Apply Migration**: Run the SQL migration file
3. **Verify Policies**: Use verification function to confirm installation
4. **Test Access**: Perform comprehensive access control testing
5. **Monitor Logs**: Watch for any RLS policy violations

## Security Considerations

### Data Leakage Prevention

1. **No Cross-Account Queries**: All queries must filter by account
2. **Client ID Validation**: Always verify client belongs to user's account
3. **Proposal Access**: Never allow direct proposal access without account validation
4. **API Endpoints**: All endpoints must validate account membership

### Performance Considerations

1. **Index Strategy**: Ensure `clients.account_id` and `profiles.account_id` are indexed
2. **Query Optimization**: RLS policies add WHERE clauses to all queries
3. **Connection Pooling**: Account-based filtering may affect connection patterns
4. **Caching Strategy**: Cache account relationships to reduce database queries

### Audit and Compliance

1. **Access Logging**: Log all data access with account context
2. **Policy Changes**: Track all RLS policy modifications
3. **User Actions**: Audit client data modifications with account validation
4. **Compliance Reports**: Generate account-based access reports

## Troubleshooting

### Common Issues

1. **Access Denied Errors**: Usually indicates missing account relationship
2. **Empty Result Sets**: May indicate RLS policy blocking legitimate access
3. **Performance Issues**: RLS policies add complexity to query execution
4. **Policy Conflicts**: Multiple policies may create unexpected access patterns

### Debug Queries

```sql
-- Check user's account relationship
SELECT p.id, p.email, p.account_id, a.name, a.type
FROM profiles p
LEFT JOIN accounts a ON p.account_id = a.id
WHERE p.id = auth.uid();

-- Check clients accessible to user
SELECT c.*, a.name as account_name
FROM clients c
INNER JOIN accounts a ON c.account_id = a.id
INNER JOIN profiles p ON a.id = p.account_id
WHERE p.id = auth.uid();

-- Check proposals accessible to user
SELECT tp.*, c.full_name as client_name, a.name as account_name
FROM tax_proposals tp
INNER JOIN clients c ON tp.client_id = c.id
INNER JOIN accounts a ON c.account_id = a.id
INNER JOIN profiles p ON a.id = p.account_id
WHERE p.id = auth.uid();
```

## Future Enhancements

1. **Granular Permissions**: Client-specific role assignments within accounts
2. **Temporary Access**: Time-limited access grants for consultants
3. **Data Export Controls**: Account-specific data export restrictions
4. **API Rate Limiting**: Account-based API usage limits
5. **Multi-Account Users**: Support for users with access to multiple accounts

---

**Last Updated**: August 2025  
**Version**: 1.0  
**Author**: Battle Born Capital Advisors Development Team