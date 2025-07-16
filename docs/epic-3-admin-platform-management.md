# Epic 3: Admin Platform Management

**Project**: TaxApp Admin Platform  
**Epic Owner**: Development Team  
**Created**: 2025-07-15  
**Priority**: HIGH - Core Platform Administration  
**Status**: 📋 **PLANNING**  
**Dependencies**: Epic 0 (Security Hardening) ✅, Epic 1 (Authentication) ✅, Account Schema Consolidation ✅

## Overview

Create a comprehensive admin platform that leverages the new consolidated accounts schema to provide centralized management of all platform entities. This epic implements core administrative functionality for managing accounts, tools, profiles, and billing across the entire Battle Born Capital Advisors ecosystem.

## Business Value

**Primary Value**: Enable platform administrators to efficiently manage all aspects of the multi-tenant system from a centralized interface, reducing operational overhead and improving system governance.

**Secondary Value**: 
- Streamline account creation and management processes
- Provide visibility into tool usage and subscription management
- Enable efficient user management across all account types
- Facilitate billing and subscription administration through Stripe integration
- Create foundation for platform scaling and automation

## Success Criteria

- [ ] Admin can create and manage accounts of all types (admin, platform, affiliate, client, expert)
- [ ] Complete CRUD operations for tools with subscription level management
- [ ] Full profile management with auth.users synchronization
- [ ] Integrated Stripe billing and subscription management
- [ ] Role-based admin access with audit logging
- [ ] Mobile-responsive admin interface
- [ ] Performance benchmarks met (< 3 second page loads)
- [ ] Complete audit trail for all administrative actions

## User Stories

### Story 3.1: Account Management Interface
**As an** admin  
**I want to** manage all platform accounts from a centralized interface  
**So that** I can efficiently create, update, and oversee all account types across the platform

#### Acceptance Criteria
- [ ] View all accounts in a filterable, searchable table
- [ ] Create new accounts of any type (admin, platform, affiliate, client, expert)
- [ ] Edit account information (name, type, contact details, status)
- [ ] View account hierarchy and relationships
- [ ] Bulk operations for account management
- [ ] Account status management (active, inactive, suspended)
- [ ] Account audit history and activity logs

#### Technical Tasks
- [ ] Create `AdminAccountsPage.tsx` with comprehensive account management
- [ ] Implement `AccountManagementTable.tsx` with filtering and search
- [ ] Create `CreateAccountModal.tsx` for new account creation
- [ ] Add `EditAccountModal.tsx` for account editing
- [ ] Implement account validation and business rules
- [ ] Create account activity tracking and audit logs
- [ ] Add bulk operation capabilities

### Story 3.2: Account Creation Workflow
**As an** admin  
**I want to** create new accounts with proper setup and configuration  
**So that** new entities can be onboarded efficiently with all necessary access and permissions

#### Acceptance Criteria
- [ ] Guided account creation wizard with account type selection
- [ ] Dynamic form fields based on account type
- [ ] Automatic generation of initial configurations
- [ ] Optional initial user creation for the account
- [ ] Email notifications to new account contacts
- [ ] Account setup validation and verification
- [ ] Integration with tool assignments and permissions

#### Technical Tasks
- [ ] Create `AccountCreationWizard.tsx` component
- [ ] Implement account type-specific form validation
- [ ] Add account initialization workflows
- [ ] Create notification system for new accounts
- [ ] Implement account verification processes
- [ ] Add account setup completion tracking

### Story 3.3: Tools Management Interface
**As an** admin  
**I want to** manage all platform tools and their configurations  
**So that** I can control tool availability and access across the platform

#### Acceptance Criteria
- [ ] View all tools in a comprehensive management interface
- [ ] Create new tools with detailed configurations
- [ ] Edit tool properties, descriptions, and settings
- [ ] Delete or archive tools with dependency checking
- [ ] Tool categorization and tagging system
- [ ] Version management for tool updates
- [ ] Tool usage analytics and reporting

#### Technical Tasks
- [ ] Create `AdminToolsPage.tsx` for tool management
- [ ] Implement `ToolManagementTable.tsx` with CRUD operations
- [ ] Create `CreateToolModal.tsx` for new tool creation
- [ ] Add `EditToolModal.tsx` for tool editing
- [ ] Implement tool categorization system
- [ ] Add tool usage tracking and analytics
- [ ] Create tool version management system

### Story 3.4: Tool-Account Assignment Management
**As an** admin  
**I want to** assign tools to accounts with specific subscription levels  
**So that** I can control access and billing for tool usage across the platform

#### Acceptance Criteria
- [ ] View tool assignments by account or by tool
- [ ] Assign tools to accounts with subscription level selection
- [ ] Bulk tool assignment operations
- [ ] Subscription level management (full, limited, reporting, none)
- [ ] Assignment effective dates and expiration
- [ ] Tool access validation and enforcement
- [ ] Assignment audit trail and change history

#### Technical Tasks
- [ ] Create `ToolAssignmentPage.tsx` for assignment management
- [ ] Implement `AssignmentMatrix.tsx` for visual assignment overview
- [ ] Create `AssignToolModal.tsx` for new assignments
- [ ] Add subscription level validation logic
- [ ] Implement assignment scheduling and automation
- [ ] Create assignment analytics and reporting
- [ ] Add assignment change tracking

### Story 3.5: Profile Management Interface
**As an** admin  
**I want to** manage user profiles across all accounts  
**So that** I can oversee user access, roles, and account associations throughout the platform

#### Acceptance Criteria
- [ ] View all profiles organized by account
- [ ] Search and filter profiles across all accounts
- [ ] Create new profiles and associate with accounts
- [ ] Edit profile information and account associations
- [ ] Manage profile roles and permissions
- [ ] View profile activity and login history
- [ ] Bulk profile operations and user management

#### Technical Tasks
- [ ] Create `AdminProfilesPage.tsx` for profile management
- [ ] Implement `ProfileManagementTable.tsx` with account grouping
- [ ] Create `CreateProfileModal.tsx` for new profile creation
- [ ] Add `EditProfileModal.tsx` for profile editing
- [ ] Implement profile role management system
- [ ] Add profile activity tracking and reporting
- [ ] Create bulk profile operation tools

### Story 3.6: Auth.Users Synchronization
**As an** admin  
**I want to** manage auth.users in sync with profiles  
**So that** authentication remains consistent with profile data and access permissions

#### Acceptance Criteria
- [ ] View auth.users status alongside profile information
- [ ] Create auth.users when creating new profiles
- [ ] Update auth.users when modifying profiles
- [ ] Handle auth.users email changes and verification
- [ ] Manage password resets and security settings
- [ ] Monitor auth.users synchronization status
- [ ] Resolve auth/profile synchronization conflicts

#### Technical Tasks
- [ ] Create auth.users synchronization service
- [ ] Implement profile-auth sync validation
- [ ] Add conflict resolution workflows
- [ ] Create auth.users management interface
- [ ] Implement email verification management
- [ ] Add password management tools
- [ ] Create sync status monitoring

### Story 3.7: Invoice Management Interface
**As an** admin  
**I want to** manage invoices and billing for all accounts  
**So that** I can handle billing operations and account financial management

#### Acceptance Criteria
- [ ] View all invoices across all accounts
- [ ] Create new invoices for any account
- [ ] Edit invoice details and line items
- [ ] Send invoices and track payment status
- [ ] View payment history and account balance
- [ ] Handle invoice disputes and adjustments
- [ ] Generate billing reports and analytics

#### Technical Tasks
- [ ] Create `AdminInvoicesPage.tsx` for invoice management
- [ ] Implement `InvoiceManagementTable.tsx` with account filtering
- [ ] Create `CreateInvoiceModal.tsx` for new invoice creation
- [ ] Add `EditInvoiceModal.tsx` for invoice editing
- [ ] Implement Stripe invoice integration
- [ ] Add payment tracking and status management
- [ ] Create billing analytics and reporting

### Story 3.8: Stripe Integration & Subscription Management
**As an** admin  
**I want to** manage Stripe subscriptions and customer data  
**So that** I can handle recurring billing and subscription lifecycle management

#### Acceptance Criteria
- [ ] View Stripe customer data synced with accounts
- [ ] Create and manage Stripe subscriptions
- [ ] Handle subscription upgrades and downgrades
- [ ] Process subscription cancellations and pauses
- [ ] Sync subscription status with tool access
- [ ] Handle failed payments and dunning management
- [ ] View subscription analytics and revenue reporting

#### Technical Tasks
- [ ] Create `AdminSubscriptionsPage.tsx` for subscription management
- [ ] Implement Stripe customer synchronization
- [ ] Add subscription lifecycle management
- [ ] Create subscription plan management
- [ ] Implement failed payment handling
- [ ] Add subscription analytics dashboard
- [ ] Create revenue reporting tools

## Technical Requirements

### Frontend Requirements
- [ ] React-based admin interface with TypeScript
- [ ] Responsive design for desktop and tablet use
- [ ] Component-based architecture with reusable admin components
- [ ] State management with Zustand for admin data
- [ ] Advanced table components with sorting, filtering, pagination
- [ ] Form validation and error handling
- [ ] Loading states and optimistic updates

### Backend Requirements
- [ ] Admin-specific API endpoints with proper authorization
- [ ] Integration with consolidated accounts schema
- [ ] Stripe API integration for billing operations
- [ ] Bulk operation support for efficiency
- [ ] Advanced querying and filtering capabilities
- [ ] Audit logging for all administrative actions
- [ ] Real-time updates for collaborative admin work

### Security Requirements
- [ ] Admin-only access with proper role validation
- [ ] Audit logging for all administrative actions
- [ ] Secure handling of sensitive account information
- [ ] Rate limiting for admin API endpoints
- [ ] Multi-factor authentication for admin access
- [ ] Session management and timeout handling
- [ ] Secure Stripe token and webhook handling

### Performance Requirements
- [ ] Admin page load times < 3 seconds
- [ ] Efficient bulk operations for large datasets
- [ ] Optimized database queries with proper indexing
- [ ] Caching for frequently accessed admin data
- [ ] Real-time updates without performance degradation

## Architecture & Design

### Admin Component Structure
```
src/components/admin/
├── AdminDashboard.tsx           # Main admin dashboard
├── accounts/
│   ├── AdminAccountsPage.tsx    # Account management page
│   ├── AccountManagementTable.tsx
│   ├── CreateAccountModal.tsx
│   ├── EditAccountModal.tsx
│   └── AccountCreationWizard.tsx
├── tools/
│   ├── AdminToolsPage.tsx       # Tool management page
│   ├── ToolManagementTable.tsx
│   ├── CreateToolModal.tsx
│   ├── EditToolModal.tsx
│   └── ToolAssignmentPage.tsx
├── profiles/
│   ├── AdminProfilesPage.tsx    # Profile management page
│   ├── ProfileManagementTable.tsx
│   ├── CreateProfileModal.tsx
│   └── EditProfileModal.tsx
├── billing/
│   ├── AdminInvoicesPage.tsx    # Invoice management page
│   ├── AdminSubscriptionsPage.tsx
│   ├── InvoiceManagementTable.tsx
│   └── StripeIntegration.tsx
└── shared/
    ├── AdminLayout.tsx          # Admin layout wrapper
    ├── AdminNavigation.tsx      # Admin navigation
    ├── AdminTable.tsx           # Reusable admin table
    └── AdminModal.tsx           # Reusable admin modal
```

### Database Schema Extensions
```sql
-- Admin activity logging
CREATE TABLE admin_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  activity_type VARCHAR NOT NULL,
  target_type VARCHAR NOT NULL, -- 'account', 'tool', 'profile', 'invoice'
  target_id UUID NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool assignment tracking with subscription levels
CREATE TABLE account_tool_access (
  account_id UUID REFERENCES accounts(id),
  tool_id UUID REFERENCES tools(id),
  access_level access_level_type NOT NULL,
  affiliate_id UUID REFERENCES accounts(id),
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (account_id, tool_id)
);

-- Invoice tracking with Stripe integration
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id),
  stripe_invoice_id VARCHAR UNIQUE,
  amount_cents INTEGER NOT NULL,
  status VARCHAR NOT NULL,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);
```

### API Endpoints
```typescript
// Admin Account Management
GET    /api/admin/accounts              # List all accounts
POST   /api/admin/accounts              # Create new account
PUT    /api/admin/accounts/:id          # Update account
DELETE /api/admin/accounts/:id          # Delete account
POST   /api/admin/accounts/bulk         # Bulk account operations

// Admin Tool Management
GET    /api/admin/tools                 # List all tools
POST   /api/admin/tools                 # Create new tool
PUT    /api/admin/tools/:id             # Update tool
DELETE /api/admin/tools/:id             # Delete tool
GET    /api/admin/tools/assignments     # List tool assignments
POST   /api/admin/tools/assign          # Assign tool to account

// Admin Profile Management
GET    /api/admin/profiles              # List all profiles
POST   /api/admin/profiles              # Create new profile
PUT    /api/admin/profiles/:id          # Update profile
DELETE /api/admin/profiles/:id          # Delete profile
POST   /api/admin/profiles/sync-auth    # Sync with auth.users

// Admin Billing Management
GET    /api/admin/invoices              # List all invoices
POST   /api/admin/invoices              # Create new invoice
PUT    /api/admin/invoices/:id          # Update invoice
GET    /api/admin/subscriptions         # List all subscriptions
POST   /api/admin/subscriptions         # Create subscription
```

## Integration Points

### Epic 0 & 1 Integration
- [ ] Leverage existing authentication and security framework
- [ ] Use established RLS policies for admin access control
- [ ] Integrate with existing audit logging system
- [ ] Build on consolidated accounts schema

### Future Epic Integration
- [ ] Foundation for partner management (Epic 4)
- [ ] Support for client document management (Epic 5)
- [ ] Integration with reporting and analytics (Epic 6)
- [ ] Support for advanced billing features (Epic 7)

### External Integrations
- [ ] Stripe API for billing and subscription management
- [ ] Email notifications for account and billing events
- [ ] Analytics tracking for admin platform usage
- [ ] External backup and data export capabilities

## Testing Strategy

### Unit Testing
- [ ] Component rendering and interaction testing
- [ ] Form validation and error handling
- [ ] State management and data flow
- [ ] API integration and error handling

### Integration Testing
- [ ] End-to-end admin workflows
- [ ] Stripe integration testing
- [ ] Auth.users synchronization testing
- [ ] Bulk operation testing

### Security Testing
- [ ] Admin access control validation
- [ ] Audit logging verification
- [ ] Data security and privacy compliance
- [ ] Stripe integration security testing

### Performance Testing
- [ ] Large dataset handling
- [ ] Bulk operation performance
- [ ] Concurrent admin user support
- [ ] Database query optimization

## Risk Assessment

### High Risk
- **Data integrity** during bulk operations
- **Stripe integration complexity** with error handling
- **Auth.users synchronization** edge cases

### Medium Risk
- **Performance degradation** with large datasets
- **Complex admin UI** usability issues
- **Audit trail completeness** for compliance

### Mitigation Strategies
- Implement comprehensive validation and rollback procedures
- Create extensive error handling and recovery mechanisms
- Design intuitive admin interfaces with clear workflows
- Establish complete audit logging for all admin actions

## Success Metrics

### Primary KPIs
- **Admin Task Completion Time**: 50% reduction in common admin tasks
- **Platform Account Growth**: Support for 10x increase in accounts
- **Billing Accuracy**: 99.9% accuracy in billing operations
- **Admin User Satisfaction**: > 4.5/5 rating for admin platform

### Secondary KPIs
- **Tool Assignment Efficiency**: 75% reduction in tool assignment time
- **Profile Management Speed**: 60% faster profile operations
- **Audit Compliance**: 100% audit trail coverage
- **System Reliability**: 99.9% uptime for admin operations

## Timeline & Milestones

### Phase 1: Account Management (Weeks 1-3)
- [ ] Account management interface and CRUD operations
- [ ] Account creation wizard and validation
- [ ] Account audit logging and activity tracking

### Phase 2: Tool Management (Weeks 4-6)
- [ ] Tool management interface and operations
- [ ] Tool-account assignment system
- [ ] Subscription level management

### Phase 3: Profile Management (Weeks 7-9)
- [ ] Profile management interface
- [ ] Auth.users synchronization
- [ ] Profile audit and activity tracking

### Phase 4: Billing Integration (Weeks 10-12)
- [ ] Invoice management interface
- [ ] Stripe integration and subscription management
- [ ] Billing analytics and reporting

**Total Estimated Time**: 12 weeks

## Dependencies

### Blocking Dependencies
- **Account Schema Consolidation**: Must be completed ✅
- **Stripe Account Setup**: Production Stripe account configuration
- **Admin Role Definition**: Clear admin permission structure

### Supporting Dependencies
- **Design System**: Admin-specific design patterns
- **Testing Environment**: Admin testing and staging setup
- **Documentation Standards**: Admin platform documentation

## Definition of Done

### Technical DoD
- [ ] All user stories completed with acceptance criteria met
- [ ] Admin interface works on desktop and tablet devices
- [ ] All admin operations have audit logging
- [ ] Stripe integration fully functional and tested
- [ ] Performance benchmarks met (< 3 second page loads)
- [ ] Security testing passed with admin access validation
- [ ] Comprehensive test coverage (>90%)

### Business DoD
- [ ] Admin user acceptance testing completed
- [ ] Billing operations validated with accounting team
- [ ] Audit logging meets compliance requirements
- [ ] Documentation complete for all admin functions
- [ ] Support procedures established for admin platform
- [ ] Deployment and rollback procedures tested

## Next Steps

1. **Immediate**: Finalize admin role permissions and access structure
2. **Week 1**: Design admin interface mockups and user workflows
3. **Week 2**: Set up development environment and database extensions
4. **Week 3**: Begin account management interface development
5. **Week 4**: Implement account creation and editing workflows
6. **Week 5**: Start tool management interface development
7. **Week 6**: Add tool assignment and subscription management

---

**Epic 3 Status**: 📋 **PLANNING**  
**Estimated Completion**: 12 weeks  
**Next Review**: Epic 3 design review and admin permissions workshop  
**Dependencies**: Account schema consolidation ✅, Stripe setup needed