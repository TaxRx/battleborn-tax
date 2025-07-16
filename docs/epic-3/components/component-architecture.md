# Component Architecture - Epic 3 Admin Platform

**Document Type**: Frontend Architecture Specification  
**Framework**: React 18 + TypeScript + Tailwind CSS  
**Last Updated**: 2025-07-16

## Overview

This document defines the complete React component architecture for the Epic 3 Admin Platform Management system. All components follow existing Battle Born Capital Advisors patterns and integrate seamlessly with the current codebase.

## Architecture Principles

### Component Design Philosophy
- ✅ **Reusability**: Components designed for maximum reuse across phases
- ✅ **Composability**: Small, focused components that compose into larger features
- ✅ **Consistency**: Follow existing design patterns and conventions
- ✅ **Performance**: Optimized for large datasets and complex operations
- ✅ **Accessibility**: WCAG 2.1 AA compliant components

### Integration Strategy
- **Extend Existing**: Build on existing admin module structure
- **Pattern Consistency**: Follow established component patterns
- **State Management**: Use existing Zustand patterns
- **Styling**: Maintain Tailwind CSS consistency

## Directory Structure

```
src/modules/admin/
├── components/
│   ├── shared/                    # Reusable admin components
│   │   ├── AdminTable.tsx
│   │   ├── AdminModal.tsx
│   │   ├── AdminForm.tsx
│   │   ├── AdminButton.tsx
│   │   ├── AdminInput.tsx
│   │   ├── AdminSelect.tsx
│   │   ├── AdminDatePicker.tsx
│   │   ├── AdminMetrics.tsx
│   │   ├── AdminPagination.tsx
│   │   ├── AdminSearch.tsx
│   │   ├── AdminFilters.tsx
│   │   └── AdminBreadcrumbs.tsx
│   ├── accounts/                  # Phase 1: Account Management
│   │   ├── AccountTable.tsx
│   │   ├── CreateAccountModal.tsx
│   │   ├── EditAccountModal.tsx
│   │   ├── AccountDetailsPanel.tsx
│   │   ├── AccountActivityTimeline.tsx
│   │   ├── AccountSearch.tsx
│   │   └── AccountStatusBadge.tsx
│   ├── tools/                     # Phase 2: Tool Management
│   │   ├── ToolTable.tsx
│   │   ├── ToolAssignmentMatrix.tsx
│   │   ├── AssignToolModal.tsx
│   │   ├── BulkToolOperations.tsx
│   │   ├── ToolUsageAnalytics.tsx
│   │   ├── ToolSubscriptionBadge.tsx
│   │   └── ToolAssignmentHistory.tsx
│   ├── profiles/                  # Phase 3: Profile Management
│   │   ├── ProfileTable.tsx
│   │   ├── CreateProfileModal.tsx
│   │   ├── EditProfileModal.tsx
│   │   ├── AuthSyncDashboard.tsx
│   │   ├── RoleManagementMatrix.tsx
│   │   ├── BulkProfileOperations.tsx
│   │   ├── ProfileActivityTimeline.tsx
│   │   └── ProfileSyncStatus.tsx
│   ├── billing/                   # Phase 4: Billing Integration
│   │   ├── InvoiceTable.tsx
│   │   ├── CreateInvoiceModal.tsx
│   │   ├── InvoiceDetailsModal.tsx
│   │   ├── SubscriptionTable.tsx
│   │   ├── CreateSubscriptionModal.tsx
│   │   ├── PaymentMethodsTable.tsx
│   │   ├── BillingAnalytics.tsx
│   │   ├── BillingEventsLog.tsx
│   │   └── StripeIntegrationStatus.tsx
│   └── layout/                    # Layout components
│       ├── AdminSidebar.tsx
│       ├── AdminHeader.tsx
│       ├── AdminLayout.tsx
│       ├── AdminNavigation.tsx
│       └── AdminBreadcrumbs.tsx
├── pages/                         # Page-level components
│   ├── AdminDashboard.tsx         # Enhanced main dashboard
│   ├── AccountManagement.tsx      # Account management page
│   ├── ToolManagement.tsx         # Tool management page
│   ├── ProfileManagement.tsx      # Profile management page
│   ├── BillingManagement.tsx      # Billing management page
│   └── AdminAnalytics.tsx         # Analytics and reporting
├── hooks/                         # Custom hooks
│   ├── useAdminAccounts.ts
│   ├── useAdminTools.ts
│   ├── useAdminProfiles.ts
│   ├── useAdminBilling.ts
│   ├── useAdminMetrics.ts
│   └── useAdminPermissions.ts
├── services/                      # Service layer
│   ├── adminAccountService.ts
│   ├── adminToolService.ts
│   ├── adminProfileService.ts
│   ├── adminBillingService.ts
│   └── adminAnalyticsService.ts
├── store/                         # State management
│   ├── adminStore.ts
│   ├── accountStore.ts
│   ├── toolStore.ts
│   ├── profileStore.ts
│   └── billingStore.ts
└── types/                         # Type definitions
    ├── admin.ts
    ├── account.ts
    ├── tool.ts
    ├── profile.ts
    └── billing.ts
```

## Shared Components

### AdminTable Component
**Purpose**: Reusable data table with sorting, filtering, and pagination

```typescript
interface AdminTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string | null;
  pagination?: PaginationConfig;
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  onRowClick?: (row: T) => void;
  selection?: {
    enabled: boolean;
    selectedRows: string[];
    onSelectionChange: (selectedIds: string[]) => void;
  };
  actions?: TableAction<T>[];
}

export const AdminTable = <T extends { id: string }>({
  data,
  columns,
  loading = false,
  error = null,
  pagination,
  onSort,
  onFilter,
  onRowClick,
  selection,
  actions
}: AdminTableProps<T>) => {
  // Table implementation with virtualization for large datasets
  // Sorting, filtering, and pagination
  // Row selection capabilities
  // Action buttons per row
};
```

### AdminModal Component
**Purpose**: Reusable modal with consistent styling and behavior

```typescript
interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true
}) => {
  // Modal implementation with backdrop
  // Keyboard navigation (ESC to close)
  // Focus management
  // Animation transitions
};
```

### AdminForm Component
**Purpose**: Form wrapper with validation and error handling

```typescript
interface AdminFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  validation?: ValidationSchema;
}

export const AdminForm: React.FC<AdminFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
  children,
  className,
  validation
}) => {
  // Form handling with react-hook-form
  // Validation with error display
  // Loading states
  // Error handling and display
};
```

## Phase 1: Account Management Components

### AccountTable Component
```typescript
interface AccountTableProps {
  onCreateAccount: () => void;
  onEditAccount: (account: AdminAccount) => void;
  onDeleteAccount: (account: AdminAccount) => void;
  onViewDetails: (account: AdminAccount) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  onCreateAccount,
  onEditAccount,
  onDeleteAccount,
  onViewDetails
}) => {
  const [filters, setFilters] = useState<AccountFilters>({});
  const { accounts, loading, error, pagination, fetchAccounts } = useAdminAccounts(filters);

  // Account listing with search and filters
  // Pagination and sorting
  // Action buttons for each account
  // Bulk operations support
};
```

### CreateAccountModal Component
```typescript
interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: AdminAccount) => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState(1);
  const { createAccount, loading, error } = useAdminAccounts();

  // Multi-step wizard for account creation
  // Form validation at each step
  // Account type selection
  // Contact information collection
  // Success confirmation
};
```

### AccountActivityTimeline Component
```typescript
interface AccountActivityTimelineProps {
  accountId: string;
  maxItems?: number;
  showFilters?: boolean;
}

export const AccountActivityTimeline: React.FC<AccountActivityTimelineProps> = ({
  accountId,
  maxItems = 50,
  showFilters = true
}) => {
  const { activities, loading, fetchActivities } = useAccountActivities(accountId);

  // Chronological activity display
  // Activity type filtering
  // Pagination for large activity lists
  // Activity detail expansion
};
```

## Phase 2: Tool Management Components

### ToolAssignmentMatrix Component
```typescript
interface ToolAssignmentMatrixProps {
  onAssignTool: (accountId: string, toolId: string) => void;
  onUnassignTool: (accountId: string, toolId: string) => void;
  onBulkAssign: (assignments: BulkAssignment[]) => void;
}

export const ToolAssignmentMatrix: React.FC<ToolAssignmentMatrixProps> = ({
  onAssignTool,
  onUnassignTool,
  onBulkAssign
}) => {
  const { matrix, loading, updateMatrix } = useToolAssignmentMatrix();
  const [selectedCells, setSelectedCells] = useState<string[]>([]);

  // Matrix view with accounts vs tools
  // Quick assign/unassign functionality
  // Visual status indicators
  // Bulk selection and operations
  // Filter by account type, tool category
};
```

### BulkToolOperations Component
```typescript
interface BulkToolOperationsProps {
  selectedAccounts: string[];
  onComplete: () => void;
}

export const BulkToolOperations: React.FC<BulkToolOperationsProps> = ({
  selectedAccounts,
  onComplete
}) => {
  const [operation, setOperation] = useState<'assign' | 'unassign' | 'update'>('assign');
  const { bulkAssignTools, bulkUpdateAssignments, loading, progress } = useAdminTools();

  // Operation type selection
  // Tool and subscription level selection
  // Progress tracking with cancellation
  // Error handling and rollback
  // Results summary
};
```

## Phase 3: Profile Management Components

### ProfileTable Component
```typescript
interface ProfileTableProps {
  onCreateProfile: () => void;
  onEditProfile: (profile: AdminProfile) => void;
  onSyncProfile: (profile: AdminProfile) => void;
  onBulkOperations: (profiles: AdminProfile[]) => void;
}

export const ProfileTable: React.FC<ProfileTableProps> = ({
  onCreateProfile,
  onEditProfile,
  onSyncProfile,
  onBulkOperations
}) => {
  const [filters, setFilters] = useState<ProfileFilters>({});
  const { profiles, loading, error, pagination } = useAdminProfiles(filters);

  // Profile listing with account relationships
  // Auth sync status indicators
  // Role and permission display
  // Bulk selection for operations
};
```

### AuthSyncDashboard Component
```typescript
interface AuthSyncDashboardProps {
  onSyncAll: () => void;
  onSyncIndividual: (profileId: string) => void;
  onResolveConflict: (conflict: SyncConflict, resolution: ConflictResolution) => void;
}

export const AuthSyncDashboard: React.FC<AuthSyncDashboardProps> = ({
  onSyncAll,
  onSyncIndividual,
  onResolveConflict
}) => {
  const { syncStatus, conflicts, loading } = useAuthSync();

  // Sync status overview with metrics
  // Conflict resolution interface
  // Manual sync triggers
  // Sync history and logs
};
```

### RoleManagementMatrix Component
```typescript
interface RoleManagementMatrixProps {
  onAssignRole: (profileId: string, role: string) => void;
  onRemoveRole: (profileId: string, role: string) => void;
  onCreateRole: (roleData: CreateRoleData) => void;
}

export const RoleManagementMatrix: React.FC<RoleManagementMatrixProps> = ({
  onAssignRole,
  onRemoveRole,
  onCreateRole
}) => {
  const { roleMatrix, permissions, loading } = useRoleManagement();

  // Role-permission matrix view
  // Role assignment interface
  // Custom role creation
  // Permission inheritance display
};
```

## Phase 4: Billing Management Components

### InvoiceTable Component
```typescript
interface InvoiceTableProps {
  onCreateInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onSendInvoice: (invoice: Invoice) => void;
  onVoidInvoice: (invoice: Invoice) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  onCreateInvoice,
  onEditInvoice,
  onSendInvoice,
  onVoidInvoice
}) => {
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const { invoices, loading, error, pagination } = useAdminBilling(filters);

  // Invoice listing with status indicators
  // Payment status tracking
  // Due date highlighting
  // Stripe integration status
};
```

### CreateInvoiceModal Component
```typescript
interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  onSuccess: (invoice: Invoice) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onSuccess
}) => {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const { createInvoice, loading, error } = useAdminBilling();

  // Account selection (if not pre-selected)
  // Line item management
  // Amount calculations
  // Due date setting
  // Stripe integration options
};
```

### BillingAnalytics Component
```typescript
interface BillingAnalyticsProps {
  timeRange?: TimeRange;
  accountId?: string;
}

export const BillingAnalytics: React.FC<BillingAnalyticsProps> = ({
  timeRange,
  accountId
}) => {
  const { metrics, analytics, loading } = useBillingAnalytics({ timeRange, accountId });

  // Revenue metrics dashboard
  // Subscription analytics
  // Payment success/failure rates
  // Churn and growth metrics
  // Exportable reports
};
```

## Performance Optimization

### Virtualization Strategy
```typescript
// Large dataset handling with react-window
import { FixedSizeList as List } from 'react-window';

export const VirtualizedTable = ({ items, rowHeight = 50 }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={rowHeight}
  >
    {({ index, style }) => (
      <div style={style}>
        <TableRow data={items[index]} />
      </div>
    )}
  </List>
);
```

### Lazy Loading
```typescript
// Lazy loading for large component trees
const LazyBillingAnalytics = lazy(() => import('./BillingAnalytics'));

export const BillingManagement = () => (
  <Suspense fallback={<AdminSpinner />}>
    <LazyBillingAnalytics />
  </Suspense>
);
```

### Memoization
```typescript
// Expensive calculations memoization
const expensiveMetrics = useMemo(() => {
  return calculateComplexMetrics(rawData);
}, [rawData]);

// Component memoization for stable props
export const MemoizedAccountRow = memo(AccountRow, (prevProps, nextProps) => {
  return prevProps.account.id === nextProps.account.id &&
         prevProps.account.updated_at === nextProps.account.updated_at;
});
```

## State Management Integration

### Zustand Store Pattern
```typescript
// Admin store following existing patterns
interface AdminStore {
  // Account state
  accounts: AdminAccount[];
  selectedAccountId: string | null;
  accountFilters: AccountFilters;
  
  // Tool state
  tools: AdminTool[];
  toolAssignments: ToolAssignment[];
  
  // Profile state
  profiles: AdminProfile[];
  syncStatus: AuthSyncStatus;
  
  // Billing state
  invoices: Invoice[];
  subscriptions: Subscription[];
  
  // Actions
  setAccounts: (accounts: AdminAccount[]) => void;
  updateAccount: (id: string, account: Partial<AdminAccount>) => void;
  setSelectedAccountId: (id: string | null) => void;
  // ... additional actions
}
```

## Testing Strategy

### Component Testing
```typescript
// Example component test
describe('AccountTable', () => {
  it('renders account list correctly', () => {
    render(<AccountTable {...mockProps} />);
    expect(screen.getByText('Test Account')).toBeInTheDocument();
  });

  it('handles search filtering', async () => {
    render(<AccountTable {...mockProps} />);
    const searchInput = screen.getByPlaceholderText('Search accounts...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    // Assert search functionality
  });

  it('supports bulk operations', () => {
    render(<AccountTable {...mockProps} />);
    // Test bulk selection and operations
  });
});
```

### Hook Testing
```typescript
// Example hook test
describe('useAdminAccounts', () => {
  it('fetches accounts correctly', async () => {
    const { result } = renderHook(() => useAdminAccounts());
    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(3);
    });
  });
});
```

## Accessibility Compliance

### WCAG 2.1 AA Requirements
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Management**: Visible focus indicators and logical tab order
- **Error Handling**: Clear error messages and validation feedback

### Implementation Example
```typescript
export const AccessibleButton = ({ children, onClick, disabled, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`focus:outline-none focus:ring-2 focus:ring-indigo-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-disabled={disabled}
    {...props}
  >
    {children}
  </button>
);
```

---

**Component Architecture Complete**: Comprehensive React component architecture providing scalable, reusable, and accessible components for the Epic 3 Admin Platform while maintaining consistency with existing Battle Born Capital Advisors patterns.