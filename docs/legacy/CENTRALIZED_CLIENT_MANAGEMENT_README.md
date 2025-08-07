# Centralized Tax Planning Client Management System

## Overview

This system provides a unified client management solution that centralizes all client records across multiple tax tools (R&D, Augusta Rule, Hire Children, Cost Segregation, Convertible Bonds, and Tax Planning). It replaces tool-specific client tables with a single, normalized approach.

## 🗃️ Database Schema

### Core Tables

#### 1. `businesses` - Centralized Business Information
```sql
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('LLC', 'S-Corp', 'C-Corp', 'Partnership', 'Sole Proprietorship', 'Other')),
    ein TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_zip TEXT,
    business_phone TEXT,
    business_email TEXT,
    industry TEXT,
    year_established INTEGER,
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES auth.users(id)
);
```

#### 2. `tool_enrollments` - Tool Participation Tracking
```sql
CREATE TABLE public.tool_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    tool_slug TEXT NOT NULL CHECK (tool_slug IN ('rd', 'augusta', 'hire_children', 'cost_segregation', 'convertible_bonds', 'tax_planning')),
    enrolled_by UUID REFERENCES auth.users(id),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
    notes TEXT,
    UNIQUE(client_id, business_id, tool_slug)
);
```

#### 3. Updated `admin_client_files` - Enhanced with Business Link
```sql
ALTER TABLE public.admin_client_files 
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;
```

## 🔧 Implementation Steps

### 1. Database Migration

Run the SQL migration file:
```bash
# Execute the migration in your Supabase dashboard or via CLI
supabase db push
```

### 2. TypeScript Service Integration

The `CentralizedClientService` provides all necessary methods:

```typescript
import { CentralizedClientService } from '../services/centralizedClientService';

// Create business and enroll in tool
const businessId = await CentralizedClientService.createBusinessWithEnrollment(
  'My Business LLC',
  'LLC',
  clientId,
  'rd',
  { ein: '12-3456789', annualRevenue: 1000000 }
);

// Get unified client list
const clients = await CentralizedClientService.getUnifiedClientList({
  toolFilter: 'rd',
  adminId: adminUserId
});

// Launch tool for client
const launchUrl = CentralizedClientService.getToolLaunchUrl('rd', clientId, businessId);
```

### 3. React Component Usage

```typescript
import UnifiedClientDashboard from '../components/UnifiedClientDashboard';

// For Tax Planning (all clients)
<UnifiedClientDashboard />

// For R&D tool (filtered view)
<UnifiedClientDashboard toolFilter="rd" />

// For specific admin
<UnifiedClientDashboard adminId={adminUserId} />
```

## 🎯 Key Features

### 1. Unified Client Dashboard
- **Single Source of Truth**: All clients from all tools appear in one list
- **Tool Filtering**: Filter by specific tool (`rd`, `augusta`, etc.)
- **Admin/Affiliate Filtering**: Show clients by admin or affiliate
- **Search & Status Filtering**: Real-time search and status filtering

### 2. Tool Management
- **Enrollment Tracking**: Track which clients are enrolled in which tools
- **Status Management**: Active, inactive, completed, cancelled statuses
- **Dynamic Tool Launching**: Launch tools directly from client profile
- **Tool Enrollment**: Enroll clients in new tools on-demand

### 3. Business Management
- **Normalized Business Data**: Single business record shared across tools
- **Multiple Businesses per Client**: Support for multiple businesses per client
- **Business-Client Relationships**: Clear relationships between businesses and clients

### 4. Archive System
- **Soft Delete**: Archive clients instead of hard delete
- **Archive Tracking**: Track who archived and when
- **Unarchive Capability**: Restore archived clients

## 🔄 Data Flow

### Creating a New Client

1. **Create Business**: Use `createBusinessWithEnrollment()` to create business and enroll in tool
2. **Create Client File**: Create entry in `admin_client_files` with `business_id`
3. **Tool Enrollment**: Automatic enrollment in specified tool via `tool_enrollments`

### Loading Client List

1. **Unified Query**: `get_unified_client_list()` joins all relevant tables
2. **Filtering**: Apply tool, admin, affiliate filters
3. **Display**: Show in `UnifiedClientDashboard` component

### Tool Launching

1. **Check Enrollment**: Verify client is enrolled in tool
2. **Generate URL**: Create tool-specific URL with client/business parameters
3. **Launch**: Open tool in new tab or navigate

## 🛡️ Security & Permissions

### Row Level Security (RLS)

- **Admins**: Can see and manage all clients/businesses
- **Users**: Can only see their own clients and businesses they're enrolled in
- **Tool Enrollments**: Users can only see their own enrollments

### Function Permissions

All database functions are `SECURITY DEFINER` and include proper permission checks.

## 📊 Migration from Existing System

### 1. Data Migration Strategy

```sql
-- Migrate existing business data to new businesses table
INSERT INTO businesses (business_name, entity_type, created_by, created_at)
SELECT DISTINCT 
  tax_profile_data->>'business_name',
  tax_profile_data->>'entity_type',
  admin_id,
  created_at
FROM admin_client_files 
WHERE tax_profile_data->>'business_name' IS NOT NULL;

-- Create tool enrollments for existing clients
INSERT INTO tool_enrollments (client_id, business_id, tool_slug, enrolled_by)
SELECT 
  tax_profile_id,
  b.id,
  'tax_planning', -- or appropriate tool
  admin_id
FROM admin_client_files acf
JOIN businesses b ON b.business_name = acf.tax_profile_data->>'business_name'
WHERE acf.tax_profile_data->>'business_name' IS NOT NULL;
```

### 2. Update Existing Components

Replace existing client loading logic:

```typescript
// OLD: Direct admin_client_files query
const { data: clients } = await supabase
  .from('admin_client_files')
  .select('*')
  .eq('admin_id', adminId);

// NEW: Use unified service
const clients = await CentralizedClientService.getUnifiedClientList({
  adminId: adminId
});
```

## 🚀 Usage Examples

### Admin Dashboard Integration

```typescript
// In AdminDashboard.tsx
import UnifiedClientDashboard from '../components/UnifiedClientDashboard';

function AdminDashboard() {
  return (
    <div>
      <h1>Tax Planning Dashboard</h1>
      <UnifiedClientDashboard 
        onClientSelect={(client) => {
          console.log('Selected client:', client);
          // Handle client selection
        }}
      />
    </div>
  );
}
```

### Tool-Specific Dashboard

```typescript
// In RDDashboard.tsx
function RDDashboard() {
  return (
    <div>
      <h1>R&D Tax Calculator Dashboard</h1>
      <UnifiedClientDashboard 
        toolFilter="rd"
        onClientSelect={(client) => {
          // Launch R&D calculator for this client
          const url = CentralizedClientService.getToolLaunchUrl(
            'rd', 
            client.client_id, 
            client.business_id
          );
          window.open(url, '_blank');
        }}
      />
    </div>
  );
}
```

### Business Management

```typescript
// Create new business and enroll in multiple tools
async function createMultiToolBusiness() {
  const businessId = await CentralizedClientService.createBusinessWithEnrollment(
    'Tech Startup Inc',
    'S-Corp',
    clientId,
    'rd'
  );

  // Enroll in additional tools
  await CentralizedClientService.enrollClientInTool(clientId, businessId, 'augusta');
  await CentralizedClientService.enrollClientInTool(clientId, businessId, 'hire_children');
}
```

## 🔧 Configuration

### Tool Configuration

Add new tools by updating the `tool_slug` check constraint:

```sql
ALTER TABLE tool_enrollments 
DROP CONSTRAINT tool_enrollments_tool_slug_check;

ALTER TABLE tool_enrollments 
ADD CONSTRAINT tool_enrollments_tool_slug_check 
CHECK (tool_slug IN ('rd', 'augusta', 'hire_children', 'cost_segregation', 'convertible_bonds', 'tax_planning', 'new_tool'));
```

### URL Configuration

Update tool launch URLs in `CentralizedClientService.getToolLaunchUrl()`:

```typescript
case 'new_tool':
  return `${baseUrl}/new-tool?clientId=${clientId}&businessId=${businessId}`;
```

## 📈 Benefits

1. **Unified Experience**: Single client list across all tools
2. **Reduced Duplication**: No more duplicate client records
3. **Better Relationships**: Clear business-client-tool relationships
4. **Scalable**: Easy to add new tools
5. **Consistent**: Same client management across all tools
6. **Auditable**: Track all tool enrollments and changes

## 🐛 Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure RLS policies are correctly applied
2. **Missing Business Data**: Check that `business_id` is set in `admin_client_files`
3. **Tool Launch Issues**: Verify tool enrollment status is 'active'

### Debug Queries

```sql
-- Check client enrollments
SELECT * FROM tool_enrollments WHERE client_id = 'client-uuid';

-- Check business relationships
SELECT acf.*, b.business_name 
FROM admin_client_files acf 
LEFT JOIN businesses b ON acf.business_id = b.id;

-- Check unified client list
SELECT * FROM get_unified_client_list();
```

## 📝 Next Steps

1. **Execute Migration**: Run the SQL migration in your Supabase instance
2. **Update Components**: Replace existing client loading with `UnifiedClientDashboard`
3. **Test Integration**: Verify tool launching and enrollment work correctly
4. **Migrate Data**: Run data migration scripts for existing clients
5. **Update Documentation**: Update tool-specific documentation to reference unified system 