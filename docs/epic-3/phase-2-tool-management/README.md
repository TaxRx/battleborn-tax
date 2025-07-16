# Phase 2: Tool Management (Weeks 4-6)

**Development Focus**: Tool assignment and subscription management  
**Phase Duration**: 3 weeks  
**Dependencies**: Phase 1 (Account Management) complete  
**Deliverables**: Comprehensive tool-account assignment system

## Phase Overview

Phase 2 builds on the account management foundation to implement comprehensive tool management capabilities. This phase enables admins to assign tools to accounts, manage subscription levels, perform bulk operations, and track tool usage analytics.

## Development Objectives

### Primary Goals
- ✅ **Tool Assignment System**: Assign/unassign tools to accounts with subscription levels
- ✅ **Bulk Operations**: Efficient bulk tool assignment and management
- ✅ **Subscription Management**: Tool access levels and expiration handling
- ✅ **Tool Analytics**: Usage tracking and reporting capabilities

### Technical Deliverables
- Tool management UI components
- Tool assignment service backend
- Enhanced database schema for tool management
- Bulk operation capabilities
- Tool usage analytics

## User Stories (Development Ready)

### Story 2.1: Tool Assignment Matrix
**As an** admin user  
**I want to** view and manage tool assignments across all accounts  
**So that** I can efficiently control access to platform tools

**Acceptance Criteria:**
- [ ] Matrix view showing accounts vs tools with assignment status
- [ ] Quick assign/unassign functionality from matrix view
- [ ] Filter by account type, tool category, assignment status
- [ ] Visual indicators for expired or expiring access
- [ ] Bulk selection capabilities

**Technical Requirements:**
- Responsive matrix component with virtualization
- Efficient data loading with pagination
- Real-time updates for assignment changes
- Visual status indicators

### Story 2.2: Individual Tool Assignment
**As an** admin user  
**I want to** assign specific tools to individual accounts  
**So that** I can provide customized tool access based on client needs

**Acceptance Criteria:**
- [ ] Account-specific tool assignment interface
- [ ] Subscription level selection (basic, premium, enterprise)
- [ ] Expiration date setting for time-limited access
- [ ] Notes field for assignment context
- [ ] Activity logging for all tool assignments

**Technical Requirements:**
- Tool assignment modal with validation
- Subscription level management
- Date picker for expiration dates
- Integration with activity logging system

### Story 2.3: Bulk Tool Operations
**As an** admin user  
**I want to** perform bulk tool assignments and modifications  
**So that** I can efficiently manage tool access for multiple accounts

**Acceptance Criteria:**
- [ ] Select multiple accounts for bulk operations
- [ ] Assign/unassign tools to selected accounts
- [ ] Bulk subscription level changes
- [ ] Bulk expiration date updates
- [ ] Progress indicator for bulk operations

**Technical Requirements:**
- Bulk selection UI with select all functionality
- Background job processing for large operations
- Progress tracking and error handling
- Rollback capability for failed operations

### Story 2.4: Tool Usage Analytics
**As an** admin user  
**I want to** view tool usage analytics and reports  
**So that** I can understand tool adoption and optimize offerings

**Acceptance Criteria:**
- [ ] Tool usage dashboard with key metrics
- [ ] Usage trends over time (daily, weekly, monthly)
- [ ] Account-specific tool usage reports
- [ ] Export capabilities for usage data
- [ ] Filter by date range, account type, tool category

**Technical Requirements:**
- Analytics dashboard with charts and graphs
- Time-series data visualization
- Export functionality (CSV, PDF)
- Caching for performance

### Story 2.5: Tool Subscription Management
**As an** admin user  
**I want to** manage tool subscription levels and access periods  
**So that** I can control feature access and billing accurately

**Acceptance Criteria:**
- [ ] View all tool subscriptions with status
- [ ] Upgrade/downgrade subscription levels
- [ ] Extend or modify expiration dates
- [ ] Handle expired subscriptions
- [ ] Integration with billing system

**Technical Requirements:**
- Subscription status tracking
- Automated expiration handling
- Integration with billing service
- Notification system for expiring access

## Technical Implementation

### Database Schema Extensions
```sql
-- Extend existing account_tool_access table
ALTER TABLE account_tool_access 
ADD COLUMN IF NOT EXISTS subscription_level VARCHAR DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active';

-- Add constraints
ALTER TABLE account_tool_access 
ADD CONSTRAINT check_subscription_level 
CHECK (subscription_level IN ('basic', 'premium', 'enterprise'));

ALTER TABLE account_tool_access 
ADD CONSTRAINT check_status 
CHECK (status IN ('active', 'inactive', 'expired'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_tool_access_expires ON account_tool_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_account_tool_access_status ON account_tool_access(status);
CREATE INDEX IF NOT EXISTS idx_account_tool_access_subscription ON account_tool_access(subscription_level);

-- Tool usage tracking table
CREATE TABLE tool_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  tool_id UUID REFERENCES tools(id) NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  action VARCHAR NOT NULL, -- 'access', 'feature_use', 'export', etc.
  feature_used VARCHAR,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_tool_usage_logs_account ON tool_usage_logs(account_id);
CREATE INDEX idx_tool_usage_logs_tool ON tool_usage_logs(tool_id);
CREATE INDEX idx_tool_usage_logs_created_at ON tool_usage_logs(created_at);
CREATE INDEX idx_tool_usage_logs_action ON tool_usage_logs(action);
```

### Component Architecture
```
src/modules/admin/components/tools/
├── ToolAssignmentMatrix.tsx      # Matrix view of tool assignments
├── ToolAssignmentModal.tsx       # Individual tool assignment
├── BulkToolOperations.tsx        # Bulk assignment operations
├── ToolUsageAnalytics.tsx        # Usage analytics dashboard
├── ToolSubscriptionTable.tsx     # Subscription management
├── ToolUsageChart.tsx            # Usage visualization
└── ToolAssignmentHistory.tsx     # Assignment history
```

### Service Layer
```typescript
export interface AdminToolService {
  // Tool assignment operations
  getToolAssignments(filters?: ToolAssignmentFilters): Promise<ToolAssignmentMatrix>;
  assignTool(assignment: ToolAssignmentData): Promise<ToolAssignment>;
  unassignTool(accountId: string, toolId: string): Promise<void>;
  updateAssignment(id: string, updates: ToolAssignmentUpdate): Promise<ToolAssignment>;
  
  // Bulk operations
  bulkAssignTools(assignments: BulkToolAssignment[]): Promise<BulkOperationResult>;
  bulkUpdateAssignments(updates: BulkAssignmentUpdate[]): Promise<BulkOperationResult>;
  
  // Analytics
  getToolUsageMetrics(filters?: UsageMetricsFilters): Promise<ToolUsageMetrics>;
  getUsageAnalytics(accountId?: string, timeRange?: TimeRange): Promise<UsageAnalytics>;
  
  // Subscription management
  getToolSubscriptions(filters?: SubscriptionFilters): Promise<ToolSubscription[]>;
  updateSubscriptionLevel(assignmentId: string, level: SubscriptionLevel): Promise<void>;
  extendAccess(assignmentId: string, newExpiration: Date): Promise<void>;
}
```

### API Endpoints
```typescript
// Tool management endpoints
GET    /api/admin/tools                      # List all tools
POST   /api/admin/tools                      # Create new tool
PUT    /api/admin/tools/:id                  # Update tool
DELETE /api/admin/tools/:id                  # Delete tool

GET    /api/admin/tools/assignments          # Get assignment matrix
POST   /api/admin/tools/assign               # Assign tool to account
DELETE /api/admin/tools/unassign             # Remove tool assignment
PUT    /api/admin/tools/assignments/:id      # Update assignment

POST   /api/admin/tools/bulk-assign          # Bulk tool assignments
POST   /api/admin/tools/bulk-update          # Bulk assignment updates

GET    /api/admin/tools/usage-metrics        # Tool usage metrics
GET    /api/admin/tools/usage-analytics      # Detailed usage analytics
POST   /api/admin/tools/log-usage            # Log tool usage event

GET    /api/admin/tools/subscriptions        # Tool subscriptions
PUT    /api/admin/tools/subscriptions/:id    # Update subscription
```

## Testing Requirements

### Unit Tests
- [ ] Tool assignment service operations
- [ ] Bulk operation logic and error handling
- [ ] Usage analytics calculations
- [ ] Subscription level validation

### Integration Tests
- [ ] Tool assignment workflow end-to-end
- [ ] Bulk operation performance and rollback
- [ ] Usage logging integration
- [ ] Expiration handling automation

### Performance Tests
- [ ] Matrix view with large datasets
- [ ] Bulk operations with 100+ assignments
- [ ] Analytics queries with historical data
- [ ] Real-time usage tracking

## Security Considerations

### Access Control
```sql
-- RLS policies for tool assignments
CREATE POLICY "Admins can manage all tool assignments" ON account_tool_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = auth.uid() AND a.type = 'admin'
    )
  );

-- RLS policies for usage logs
CREATE POLICY "Users can view their own usage logs" ON tool_usage_logs
  FOR SELECT USING (
    account_id IN (SELECT account_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can view all usage logs" ON tool_usage_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = auth.uid() AND a.type = 'admin'
    )
  );
```

### Data Validation
- Server-side validation for all tool assignments
- Subscription level enforcement
- Expiration date validation
- Usage data integrity checks

## Performance Requirements

### Optimization Strategies
- **Matrix View**: Virtualization for large datasets
- **Bulk Operations**: Background job processing
- **Analytics**: Pre-computed metrics and caching
- **Real-time Updates**: WebSocket for live assignment changes

### Database Performance
- Indexed queries for assignment lookups
- Partitioned usage logs for time-series data
- Optimized joins for analytics queries
- Efficient bulk insert operations

## Deployment Checklist

### Pre-Deployment
- [ ] Database migration scripts tested
- [ ] Tool assignment workflows verified
- [ ] Bulk operation performance validated
- [ ] Usage analytics accuracy confirmed
- [ ] Security policies tested

### Deployment Steps
1. Apply database schema extensions
2. Deploy updated admin service endpoints
3. Deploy tool management components
4. Configure usage tracking
5. Verify assignment functionality

### Post-Deployment Validation
- [ ] Tool assignment matrix functioning
- [ ] Individual assignments working
- [ ] Bulk operations completing successfully
- [ ] Usage analytics displaying correctly
- [ ] No impact on existing tool access

## Integration with Phase 1

### Dependencies
- **Account Management**: Uses account listing and activity logging
- **Audit System**: Extends activity logging for tool operations
- **Admin Security**: Builds on admin authentication framework

### Data Flow
```
Account Management (Phase 1)
    ↓
Tool Assignment Operations
    ↓
Activity Logging (Enhanced)
    ↓
Usage Analytics
```

## Developer Handoff

### Implementation Priority
1. **Database Extensions**: Add tool assignment columns and usage tracking
2. **Tool Assignment Service**: Core assignment operations
3. **Matrix UI Component**: Visual assignment management
4. **Bulk Operations**: Efficient multi-account operations
5. **Usage Analytics**: Tracking and reporting system

### Key Integration Points
- **Existing Tools Schema**: Extend account_tool_access table
- **Account System**: Integration with Phase 1 account management
- **Activity Logging**: Enhanced logging for tool operations
- **Authentication**: Use existing admin security framework

### Critical Success Factors
- Efficient handling of large assignment matrices
- Reliable bulk operations with error recovery
- Accurate usage tracking and analytics
- Seamless integration with existing tool access

---

**Phase 2 Ready**: Tool management system provides comprehensive tool assignment, bulk operations, and usage analytics while building on the Phase 1 account management foundation.