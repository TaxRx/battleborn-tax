# Phase 1: Account Management (Weeks 1-3)

**Development Focus**: Core account CRUD operations and management infrastructure  
**Phase Duration**: 3 weeks  
**Dependencies**: None (Foundation phase)  
**Deliverables**: Account management system with audit logging

## Phase Overview

Phase 1 establishes the foundation for the Epic 3 Admin Platform by implementing comprehensive account management capabilities. This phase creates the infrastructure for admin operations while maintaining full compatibility with existing systems.

## Development Objectives

### Primary Goals
- ✅ **Account CRUD Operations**: Complete create, read, update, delete functionality for accounts
- ✅ **Audit Logging System**: Comprehensive activity tracking for all admin actions
- ✅ **Database Foundation**: New tables and schema extensions for admin operations
- ✅ **Security Framework**: Admin-specific security policies and validation

### Technical Deliverables
- Account management UI components
- Admin account service backend
- Database schema enhancements
- Account activity logging system
- Basic admin security policies

## User Stories (Development Ready)

### Story 1.1: Account Creation Wizard
**As an** admin user  
**I want to** create new accounts through a guided wizard  
**So that** I can efficiently onboard new clients with proper data validation

**Acceptance Criteria:**
- [ ] Wizard includes account type selection (client, affiliate, expert)
- [ ] Form validation for required fields (name, email, phone, address)
- [ ] Integration with existing accounts schema
- [ ] Success confirmation with account ID
- [ ] Activity logging for account creation

**Technical Requirements:**
- React wizard component with step validation
- Form state management with Zustand
- Supabase integration for account creation
- Automatic activity log entry

### Story 1.2: Account Listing and Search
**As an** admin user  
**I want to** view and search all accounts in the system  
**So that** I can efficiently locate and manage client accounts

**Acceptance Criteria:**
- [ ] Paginated table view of all accounts
- [ ] Search by name, email, account type
- [ ] Filter by account status and type
- [ ] Sort by creation date, last activity
- [ ] Click-through to account details

**Technical Requirements:**
- DataTable component with sorting/filtering
- Server-side pagination implementation
- Search API with indexed queries
- Role-based account visibility

### Story 1.3: Account Details and Editing
**As an** admin user  
**I want to** view and edit detailed account information  
**So that** I can maintain accurate client data and resolve issues

**Acceptance Criteria:**
- [ ] Comprehensive account information display
- [ ] Inline editing for account fields
- [ ] Validation before saving changes
- [ ] Activity history for the account
- [ ] Related profiles and tools display

**Technical Requirements:**
- Account details modal/page component
- Inline editing with form validation
- Optimistic updates with error handling
- Activity timeline component

### Story 1.4: Account Activity Logging
**As an** admin user  
**I want to** see a complete audit trail of account activities  
**So that** I can track changes and maintain compliance

**Acceptance Criteria:**
- [ ] All account modifications logged automatically
- [ ] Activity timeline with actor, action, timestamp
- [ ] Searchable and filterable activity log
- [ ] Export capability for compliance reporting
- [ ] Real-time activity updates

**Technical Requirements:**
- Database trigger for automatic logging
- Activity service for manual logging
- Timeline component with pagination
- Export functionality (CSV/PDF)

## Technical Implementation

### Database Schema Changes
```sql
-- Account activity logging table
CREATE TABLE account_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  account_id UUID REFERENCES accounts(id),
  activity_type VARCHAR NOT NULL,
  target_type VARCHAR NOT NULL,
  target_id UUID NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_account_activities_account ON account_activities(account_id);
CREATE INDEX idx_account_activities_actor ON account_activities(actor_id);
CREATE INDEX idx_account_activities_created_at ON account_activities(created_at);
```

### Component Architecture
```
src/modules/admin/components/accounts/
├── AccountTable.tsx              # Account listing with filters
├── CreateAccountModal.tsx        # Account creation wizard
├── EditAccountModal.tsx          # Account editing interface
├── AccountDetailsPanel.tsx       # Account detail view
├── AccountActivityTimeline.tsx   # Activity logging display
└── AccountSearch.tsx             # Search and filter component
```

### Service Layer
```typescript
// Account management service
export interface AdminAccountService {
  // Account CRUD operations
  getAccounts(filters?: AccountFilters): Promise<AccountListResponse>;
  getAccount(id: string): Promise<AccountDetails>;
  createAccount(data: CreateAccountData): Promise<Account>;
  updateAccount(id: string, data: UpdateAccountData): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
  
  // Activity logging
  logActivity(activity: AccountActivity): Promise<void>;
  getAccountActivities(accountId: string): Promise<AccountActivity[]>;
}
```

### API Endpoints
```typescript
// Account management endpoints
GET    /api/admin/accounts              # List accounts with filters
POST   /api/admin/accounts              # Create new account
GET    /api/admin/accounts/:id          # Get account details
PUT    /api/admin/accounts/:id          # Update account
DELETE /api/admin/accounts/:id          # Delete account
GET    /api/admin/accounts/:id/activities # Get account activities
POST   /api/admin/accounts/:id/activities # Log manual activity
```

## Testing Requirements

### Unit Tests
- [ ] Account service CRUD operations
- [ ] Account form validation logic
- [ ] Activity logging functionality
- [ ] Search and filter logic

### Integration Tests
- [ ] Account creation workflow
- [ ] Account editing workflow
- [ ] Activity logging integration
- [ ] Database constraint validation

### E2E Tests
- [ ] Complete account creation process
- [ ] Account search and navigation
- [ ] Account editing and validation
- [ ] Activity timeline functionality

## Security Considerations

### Authentication
- Admin role verification for all account operations
- JWT token validation on all API endpoints
- Session management for admin users

### Authorization
```sql
-- RLS policy for account activities
CREATE POLICY "Admins can view all account activities" ON account_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = auth.uid() AND a.type = 'admin'
    )
  );
```

### Data Validation
- Server-side validation for all account data
- Input sanitization for XSS prevention
- SQL injection prevention through parameterized queries

## Performance Requirements

### Database Performance
- Indexed queries for account listing
- Pagination for large account sets
- Optimized joins for account details

### UI Performance
- Virtualized tables for large datasets
- Lazy loading for account details
- Optimistic updates for better UX

## Deployment Checklist

### Pre-Deployment
- [ ] Database migration scripts tested
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security policies validated
- [ ] Performance benchmarks met

### Deployment Steps
1. Run database migrations
2. Deploy updated Edge Functions
3. Deploy frontend changes
4. Verify admin functionality
5. Run regression tests

### Post-Deployment Validation
- [ ] Account creation workflow tested
- [ ] Account listing and search verified
- [ ] Activity logging functioning
- [ ] Existing functionality unaffected
- [ ] Performance metrics within range

## Developer Handoff

### Implementation Priority
1. **Database Setup**: Create account_activities table and indexes
2. **Backend Service**: Implement admin account service endpoints
3. **UI Components**: Build account management components
4. **Integration Testing**: Ensure all workflows function correctly

### Key Integration Points
- **Existing Accounts Schema**: Build on existing accounts table
- **Current Admin Service**: Extend existing admin-service Edge Function
- **Authentication System**: Use existing JWT validation
- **UI Component Library**: Follow existing component patterns

### Critical Success Factors
- Zero disruption to existing account functionality
- Comprehensive audit logging for compliance
- Intuitive admin user experience
- Robust error handling and validation

---

**Phase 1 Ready**: This account management foundation provides the core infrastructure for all subsequent Epic 3 phases while maintaining complete compatibility with existing Battle Born Capital Advisors platform functionality.