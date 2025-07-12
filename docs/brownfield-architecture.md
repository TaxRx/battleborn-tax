# Brownfield Architecture Document

**Project**: TaxApp
**Author**: BMad Architect
**Created**: 2025-07-08
**Version**: 1.0

## 1. System Overview

This document describes the current architecture of the TaxApp application. It is a web-based system built on a modern stack, with a Supabase backend and a React frontend. The application is designed to be a multi-tenant system, with data access controlled by user roles.

## 2. Technology Stack

*   **Backend**: Supabase (PostgreSQL)
*   **Frontend**: React (Vite)
*   **Styling**: Tailwind CSS
*   **Languages**: TypeScript, SQL

## 3. Database Architecture

The database is the core of the application and has a complex, normalized structure. The following is a summary of the key tables and their relationships, based on the provided SQL files:

### 3.1. Core Tables

*   `clients`: Stores primary client information.
*   `businesses`: Stores business information, linked to clients.
*   `personal_years`: Stores personal tax information for each client, on a yearly basis.
*   `business_years`: Stores business tax information for each business, on a yearly basis.
*   `profiles`: Stores user profile information, linked to `auth.users`.
*   `tax_profiles`: A detailed breakdown of a user's tax situation.
*   `tool_enrollments`: Tracks which clients are enrolled in which tax tools.

### 3.2. Key Relationships

*   A `client` can have multiple `businesses`.
*   A `client` can have multiple `personal_years` records.
*   A `business` can have multiple `business_years` records.
*   A `profile` is created for each user in the `auth.users` table.

### 3.3. Data Access & Security

*   **Row Level Security (RLS)**: The database makes extensive use of RLS policies to control data access based on user roles. This is a critical part of the application's security model.
*   **SQL Functions**: The database uses several SQL functions to perform complex operations, such as creating a new client with their associated business.

## 4. Security Architecture

**CURRENT STATE: CRITICAL RISK**

The application currently allows direct database access from the frontend without Row Level Security (RLS) enabled. This is a critical security vulnerability that MUST be addressed before any new features, especially a client-facing portal, are developed.

### 4.1. Security Hardening Plan

This plan outlines the necessary steps to secure the application.

#### Step 1: Solidify Data Model for Ownership

*   **`clients` table**: Ensure a non-nullable `affiliate_id` column exists to link each client to their creator.
*   **`tax_proposals` table**: Ensure a `created_by` column links each proposal to the affiliate who submitted it.
*   **Prepare for Client Portal**: Add a `user_id` column to the `clients` table to link clients to their future user accounts.

#### Step 2: Create SQL Helper Functions

*   `is_admin()`: Checks if the currently authenticated user has the 'admin' role.
*   `is_affiliated_with_client(client_id UUID)`: Checks if the current user is the affiliate associated with a given client.

#### Step 3: Define and Apply RLS Policies

*   **`clients` table**:
    *   Admins: Full access.
    *   Affiliates: Access to their own clients only.
*   **Child tables (`businesses`, `personal_years`, etc.)**:
    *   Access is inherited from the parent `clients` record.
*   **`tax_proposals` table**:
    *   Admins: Full access.
    *   Affiliates: Access to their own proposals only.

#### Step 4: Enable RLS on All Tables

*   Run `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;` on all tables containing sensitive data.

### 4.2. Future Enhancement: Secure API Layer

For a more robust and secure architecture, we recommend migrating from direct database calls to a dedicated API layer using **Supabase Edge Functions**.

*   **Abstraction**: This will abstract the database from the client, preventing direct access and reducing the attack surface.
*   **Controlled Operations**: We can create specific, single-purpose functions (e.g., `createClient`, `getReport`) that handle data validation and database interaction on the server, rather than in the client.
*   **Improved Security**: This approach moves complex business logic and security checks to the backend, where they are more secure and easier to maintain.

The frontend is a React application built with Vite. Based on the file structure, it appears to follow a standard component-based architecture.

*   **State Management**: The specific state management library is not immediately clear from the file list, but it is likely a standard React library like Redux or Zustand, or React's built-in Context API.
*   **Component Library**: The use of Tailwind CSS suggests that the application uses a utility-first approach to styling. It is likely that the application has a custom component library built with these utilities.

## 5. Deployment & Infrastructure

*   **Hosting**: The use of a `netlify.toml` file suggests that the frontend is deployed on Netlify.
*   **Backend**: The backend is hosted on Supabase.

## 6. Future Architectural Considerations

The addition of a client-facing portal will require several architectural changes:

*   **Authentication**: A new authentication flow will be needed for clients.
*   **API Layer**: New API endpoints will be required to support the client portal's functionality.
*   **File Storage**: A solution for securely storing and retrieving client documents will be needed. Supabase Storage is a likely candidate.
*   **E-signature**: An integration with an e-signature service will be required.

## Database Migration Structure

**IMPORTANT**: The project now uses a **separate testing environment** to avoid interfering with production:

### Migration Paths
- **Production Environment**: `taxapp/supabase/migrations/` (DO NOT MODIFY)
- **Testing/Development Environment**: `taxapp/db/bba/supabase/migrations/` (CURRENT ACTIVE)

### Current Setup
- **Testing Database**: Separate Supabase project for development and testing
- **Migration Location**: All new migrations should be created in `taxapp/db/bba/supabase/migrations/`
- **Schema File**: Current schema snapshot at `taxapp/db/bba/db-20250711.sql`

### Development Workflow
1. Create new migrations in `taxapp/db/bba/supabase/migrations/`
2. Test migrations against the testing database
3. Once validated, migrations can be applied to production environment
4. Keep both environments in sync through careful migration management
