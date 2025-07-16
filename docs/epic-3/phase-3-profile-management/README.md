# Phase 3: Profile Management (Weeks 7-9)

**Development Focus**: User profile and authentication management  
**Phase Duration**: 3 weeks  
**Dependencies**: Phase 1 (Account Management) and Phase 2 (Tool Management) complete  
**Deliverables**: Comprehensive profile management with auth synchronization

## Phase Overview

Phase 3 implements comprehensive profile management capabilities, including profile CRUD operations, auth.users synchronization, role and permission management, and bulk profile operations. This phase ensures seamless integration between the platform's profile system and Supabase authentication.

## Development Objectives

### Primary Goals
- ✅ **Profile CRUD Operations**: Complete profile lifecycle management
- ✅ **Auth Synchronization**: Sync profiles with Supabase auth.users
- ✅ **Role Management**: Comprehensive role and permission system
- ✅ **Bulk Operations**: Efficient bulk profile management

### Technical Deliverables
- Profile management UI components
- Auth synchronization service
- Role and permission management system
- Bulk profile operation capabilities
- Profile analytics and reporting

## User Stories (Development Ready)

### Story 3.1: Profile Listing and Management
**As an** admin user  
**I want to** view and manage all user profiles in the system  
**So that** I can maintain accurate user information and access control

**Acceptance Criteria:**
- [ ] Comprehensive profile listing with search and filters
- [ ] Profile details view with account relationship
- [ ] Edit profile information inline
- [ ] Profile status management (active, inactive, suspended)
- [ ] Profile creation for existing accounts

**Technical Requirements:**
- Profile table component with advanced filtering
- Profile details modal with edit capabilities
- Status change workflow with confirmation
- Integration with account management system

### Story 3.2: Auth.Users Synchronization
**As an** admin user  
**I want to** synchronize profiles with Supabase auth.users  
**So that** authentication and profile data remain consistent

**Acceptance Criteria:**
- [ ] Automatic sync detection for profiles vs auth.users
- [ ] Manual sync trigger for individual profiles
- [ ] Bulk sync operation for all profiles
- [ ] Sync status dashboard with discrepancy reporting
- [ ] Sync history and audit trail

**Technical Requirements:**
- Auth synchronization service with conflict resolution
- Sync status monitoring and reporting
- Background job processing for bulk sync
- Error handling and retry mechanisms

### Story 3.3: Role and Permission Management
**As an** admin user  
**I want to** manage user roles and permissions  
**So that** I can control access levels and capabilities

**Acceptance Criteria:**
- [ ] Role assignment and modification for profiles
- [ ] Permission matrix view for roles and capabilities
- [ ] Custom role creation with specific permissions
- [ ] Role hierarchy and inheritance
- [ ] Permission audit trail

**Technical Requirements:**
- Role management interface with permission matrix
- Custom role creation wizard
- Permission validation and enforcement
- Integration with existing RLS policies

### Story 3.4: Bulk Profile Operations
**As an** admin user  
**I want to** perform bulk operations on multiple profiles  
**So that** I can efficiently manage large numbers of users

**Acceptance Criteria:**
- [ ] Select multiple profiles for bulk operations
- [ ] Bulk role assignment and changes
- [ ] Bulk status updates (activate, deactivate, suspend)
- [ ] Bulk profile data updates
- [ ] Progress tracking and error reporting

**Technical Requirements:**
- Bulk selection UI with filtering capabilities
- Background job processing for large operations
- Progress indicators and status updates
- Rollback capability for failed operations

### Story 3.5: Profile Analytics and Reporting
**As an** admin user  
**I want to** view profile analytics and generate reports  
**So that** I can understand user engagement and system usage

**Acceptance Criteria:**
- [ ] Profile analytics dashboard with key metrics
- [ ] User activity and engagement reports
- [ ] Role distribution and permission usage
- [ ] Profile creation and modification trends
- [ ] Export capabilities for compliance reporting

**Technical Requirements:**
- Analytics dashboard with visualization
- Report generation with filtering options
- Export functionality (CSV, PDF)
- Historical data analysis

## Technical Implementation

### Database Schema Extensions
```sql
-- Extend existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active',
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS auth_sync_status VARCHAR DEFAULT 'synced',
ADD COLUMN IF NOT EXISTS auth_sync_last_attempted TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add constraints
ALTER TABLE profiles 
ADD CONSTRAINT check_profile_status 
CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

ALTER TABLE profiles 
ADD CONSTRAINT check_auth_sync_status 
CHECK (auth_sync_status IN ('synced', 'pending', 'conflict', 'error'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login_at);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_sync ON profiles(auth_sync_status);

-- Profile roles table (if not using existing role system)
CREATE TABLE IF NOT EXISTS profile_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_name VARCHAR NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR NOT NULL,
  permission_name VARCHAR NOT NULL,
  resource_type VARCHAR,
  resource_id VARCHAR,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_name, permission_name, resource_type, resource_id)
);

-- Profile activity tracking
CREATE TABLE IF NOT EXISTS profile_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profile_roles_profile ON profile_roles(profile_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_name);
CREATE INDEX idx_profile_activities_profile ON profile_activities(profile_id);
CREATE INDEX idx_profile_activities_created_at ON profile_activities(created_at);
```

### Component Architecture
```
src/modules/admin/components/profiles/
├── ProfileTable.tsx              # Profile listing with filters
├── ProfileDetailsModal.tsx       # Profile detail view and editing
├── CreateProfileModal.tsx        # Profile creation wizard
├── AuthSyncDashboard.tsx         # Auth synchronization status
├── RoleManagementMatrix.tsx      # Role and permission management
├── BulkProfileOperations.tsx     # Bulk profile operations
├── ProfileAnalytics.tsx          # Profile analytics dashboard
└── ProfileActivityTimeline.tsx   # Profile activity history
```

### Service Layer
```typescript
export interface AdminProfileService {
  // Profile CRUD operations
  getProfiles(filters?: ProfileFilters): Promise<ProfileListResponse>;
  getProfile(id: string): Promise<ProfileDetails>;
  createProfile(data: CreateProfileData): Promise<Profile>;
  updateProfile(id: string, data: UpdateProfileData): Promise<Profile>;
  deleteProfile(id: string): Promise<void>;
  
  // Auth synchronization
  syncProfileWithAuth(profileId: string): Promise<SyncResult>;
  bulkSyncProfiles(profileIds?: string[]): Promise<BulkSyncResult>;
  getSyncStatus(): Promise<SyncStatusReport>;
  resolveSyncConflict(profileId: string, resolution: ConflictResolution): Promise<void>;
  
  // Role management
  assignRole(profileId: string, role: string, options?: RoleOptions): Promise<void>;
  removeRole(profileId: string, role: string): Promise<void>;
  getProfileRoles(profileId: string): Promise<ProfileRole[]>;
  getRolePermissions(role: string): Promise<Permission[]>;
  
  // Bulk operations
  bulkUpdateProfiles(updates: BulkProfileUpdate[]): Promise<BulkOperationResult>;
  bulkAssignRoles(assignments: BulkRoleAssignment[]): Promise<BulkOperationResult>;
  
  // Analytics
  getProfileMetrics(filters?: MetricsFilters): Promise<ProfileMetrics>;
  getActivityAnalytics(profileId?: string): Promise<ActivityAnalytics>;
}
```

### API Endpoints
```typescript
// Profile management endpoints
GET    /api/admin/profiles                   # List all profiles
POST   /api/admin/profiles                   # Create new profile
GET    /api/admin/profiles/:id               # Get profile details
PUT    /api/admin/profiles/:id               # Update profile
DELETE /api/admin/profiles/:id               # Delete profile

POST   /api/admin/profiles/sync-auth         # Sync with auth.users
GET    /api/admin/profiles/sync-status       # Get sync status
POST   /api/admin/profiles/:id/sync          # Sync individual profile
POST   /api/admin/profiles/resolve-conflict  # Resolve sync conflict

GET    /api/admin/profiles/:id/roles         # Get profile roles
POST   /api/admin/profiles/:id/roles         # Assign role
DELETE /api/admin/profiles/:id/roles/:role   # Remove role

POST   /api/admin/profiles/bulk-update       # Bulk profile updates
POST   /api/admin/profiles/bulk-roles        # Bulk role assignments

GET    /api/admin/profiles/metrics           # Profile metrics
GET    /api/admin/profiles/analytics         # Profile analytics
GET    /api/admin/profiles/:id/activities    # Profile activities
```

## Testing Requirements

### Unit Tests
- [ ] Profile service CRUD operations
- [ ] Auth synchronization logic
- [ ] Role assignment and validation
- [ ] Bulk operation processing

### Integration Tests
- [ ] Profile-account relationship management
- [ ] Auth.users synchronization end-to-end
- [ ] Role and permission enforcement
- [ ] Bulk operation rollback scenarios

### Performance Tests
- [ ] Profile listing with large datasets
- [ ] Bulk synchronization performance
- [ ] Role matrix rendering with many permissions
- [ ] Analytics query optimization

## Security Considerations

### Access Control
```sql
-- RLS policies for profiles (extend existing)
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = auth.uid() AND a.type = 'admin'
    )
  );

-- RLS policies for profile roles
CREATE POLICY "Admins can manage profile roles" ON profile_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = auth.uid() AND a.type = 'admin'
    )
  );

-- RLS policies for profile activities
CREATE POLICY "Users can view their own activities" ON profile_activities
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all profile activities" ON profile_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = auth.uid() AND a.type = 'admin'
    )
  );
```

### Auth Synchronization Security
- Secure handling of auth.users data
- Conflict resolution with audit trail
- Role assignment validation
- Permission escalation prevention

## Performance Requirements

### Optimization Strategies
- **Profile Listing**: Indexed queries with pagination
- **Auth Sync**: Background job processing
- **Role Matrix**: Efficient permission lookups
- **Analytics**: Pre-computed metrics

### Database Performance
- Optimized joins for profile-account relationships
- Efficient role and permission queries
- Partitioned activity logs
- Cached sync status information

## Auth.Users Integration

### Synchronization Strategy
```typescript
interface AuthSyncStrategy {
  // Detect discrepancies between profiles and auth.users
  detectDiscrepancies(): Promise<SyncDiscrepancy[]>;
  
  // Sync individual profile with auth.users
  syncProfile(profileId: string, strategy: 'profile_wins' | 'auth_wins' | 'merge'): Promise<SyncResult>;
  
  // Handle sync conflicts
  resolveConflict(discrepancy: SyncDiscrepancy, resolution: ConflictResolution): Promise<void>;
  
  // Bulk sync with progress tracking
  bulkSync(options: BulkSyncOptions): Promise<BulkSyncResult>;
}
```

### Conflict Resolution
- Email mismatches between profile and auth.users
- Profile exists but no auth.users record
- Auth.users exists but no profile record
- Role discrepancies

## Deployment Checklist

### Pre-Deployment
- [ ] Database migration scripts tested
- [ ] Profile management workflows verified
- [ ] Auth synchronization tested
- [ ] Role and permission system validated
- [ ] Bulk operations performance confirmed

### Deployment Steps
1. Apply database schema extensions
2. Deploy profile management services
3. Deploy profile UI components
4. Configure auth synchronization
5. Verify profile functionality

### Post-Deployment Validation
- [ ] Profile listing and filtering working
- [ ] Profile editing functionality verified
- [ ] Auth synchronization operating correctly
- [ ] Role assignment functioning
- [ ] Bulk operations completing successfully
- [ ] No impact on existing authentication

## Integration with Previous Phases

### Phase 1 Dependencies
- **Account Management**: Profile-account relationships
- **Activity Logging**: Enhanced for profile operations
- **Admin Security**: Extended for profile management

### Phase 2 Dependencies
- **Tool Assignments**: Profile-tool access relationships
- **Usage Analytics**: Profile-based usage tracking

### Data Flow Integration
```
Account Management (Phase 1)
    ↓
Profile Management (Phase 3)
    ↓
Tool Assignments (Phase 2)
    ↓
Auth.Users Synchronization
```

## Developer Handoff

### Implementation Priority
1. **Database Extensions**: Add profile management columns and tables
2. **Profile Service**: Core profile CRUD operations
3. **Auth Sync Service**: Synchronization with auth.users
4. **Profile UI Components**: Management interface
5. **Role Management**: Permission and role system
6. **Bulk Operations**: Efficient multi-profile operations

### Key Integration Points
- **Existing Profiles Schema**: Extend current profiles table
- **Supabase Auth**: Integration with auth.users system
- **Account System**: Profile-account relationship management
- **Tool System**: Profile-tool access integration

### Critical Success Factors
- Reliable auth.users synchronization
- Efficient profile management for large user bases
- Robust role and permission system
- Seamless integration with existing authentication

---

**Phase 3 Ready**: Profile management system provides comprehensive user management, auth synchronization, and role-based access control while integrating seamlessly with the account and tool management systems from previous phases.