# Database Entity Relationship Diagram (ERD)

## Current Schema Overview
This ERD represents the database schema after applying all security hardening migrations (Epic 0).

```mermaid
erDiagram
    auth_users {
        uuid id PK
        string email
        timestamp created_at
        timestamp updated_at
    }
    
    profiles {
        uuid id PK
        uuid user_id FK
        string full_name
        string role
        timestamp created_at
        timestamp updated_at
    }
    
    clients {
        uuid id PK
        uuid affiliate_id FK
        string full_name
        string email
        string phone
        string address
        string city
        string state
        string zip
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    client_users {
        uuid id PK
        uuid client_id FK
        uuid user_id FK
        string role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    tax_proposals {
        uuid id PK
        uuid client_id FK
        string proposal_name
        decimal estimated_savings
        string status
        json proposal_data
        timestamp created_at
        timestamp updated_at
    }
    
    tax_calculations {
        uuid id PK
        uuid client_id FK
        uuid proposal_id FK
        string calculation_type
        decimal amount
        json calculation_data
        timestamp created_at
        timestamp updated_at
    }
    
    businesses {
        uuid id PK
        uuid client_id FK
        string business_name
        string ein
        string business_type
        string industry
        decimal annual_revenue
        integer employee_count
        timestamp created_at
        timestamp updated_at
    }
    
    personal_years {
        uuid id PK
        uuid client_id FK
        integer tax_year
        decimal income
        string filing_status
        json tax_data
        timestamp created_at
        timestamp updated_at
    }
    
    admin_clients {
        uuid id PK
        uuid admin_id FK
        uuid client_id FK
        string access_level
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    %% Relationships
    auth_users ||--|| profiles : "has profile"
    profiles ||--o{ client_users : "can access multiple clients"
    clients ||--o{ client_users : "can have multiple users"
    profiles ||--o{ clients : "affiliate relationship"
    clients ||--o{ tax_proposals : "has proposals"
    clients ||--o{ tax_calculations : "has calculations"
    clients ||--o{ businesses : "owns businesses"
    clients ||--o{ personal_years : "has tax years"
    tax_proposals ||--o{ tax_calculations : "generates calculations"
    profiles ||--o{ admin_clients : "admin access"
    clients ||--o{ admin_clients : "admin oversight"
```

## Key Relationships

### User Management
- **auth_users** ↔ **profiles**: One-to-one relationship for user authentication and profile data
- **profiles** ↔ **client_users**: Many-to-many through junction table for multi-client access
- **clients** ↔ **client_users**: Many-to-many allowing multiple users per client

### Client Hierarchy
- **profiles** (affiliates) ↔ **clients**: One-to-many relationship where affiliates can have multiple clients
- **clients** serve as the central entity connecting all client-related data

### Tax Data Structure
- **clients** ↔ **tax_proposals**: One-to-many for proposal management
- **clients** ↔ **tax_calculations**: One-to-many for all calculations
- **tax_proposals** ↔ **tax_calculations**: One-to-many linking proposals to their calculations
- **clients** ↔ **businesses**: One-to-many for business entities
- **clients** ↔ **personal_years**: One-to-many for personal tax years

### Administrative Access
- **admin_clients**: Junction table providing admin users oversight of specific clients
- Allows granular admin access control per client

## Security Features

### Row Level Security (RLS)
All tables implement RLS policies ensuring:
- Users can only access data for clients they're associated with
- Admins have appropriate oversight capabilities
- Affiliate users can access their clients' data
- Client users can only access their own client's data

### Data Isolation
- **client_id** serves as the primary isolation boundary
- All client-related data is properly scoped through foreign key relationships
- Junction tables ensure proper many-to-many relationships without data leakage

## Migration History
This schema represents the state after applying:
1. **Migration 0**: Add affiliate_id to clients
2. **Migration 1**: Create client_users junction table
3. **Migration 2**: Update client RLS policies
4. **Migration 3**: Security cleanup and policy refinement
5. **Migration 4**: Fix tax_proposals client relationship
6. **Migration 5**: Normalize all client relationships

## Helper Views and Functions

### Views
- **client_with_affiliate_info**: Joins clients with affiliate profile data
- **user_accessible_clients**: Shows which clients each user can access
- **admin_client_overview**: Provides admin view of client relationships

### Functions
- **get_user_clients()**: Returns clients accessible to current user
- **check_client_access()**: Validates user access to specific client
- **get_affiliate_clients()**: Returns clients for affiliate users

## Notes
- All foreign keys use UUID type for consistency
- Timestamps are automatically managed with triggers
- JSON columns store flexible data structures for extensibility
- Boolean flags control active/inactive states throughout the system 