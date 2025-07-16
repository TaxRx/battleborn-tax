# Architecture Document: B2B Partner Platform

**Project**: TaxApp B2B SaaS Platform
**Author**: BMad Architect
**Version**: 2.0
**Last Updated**: 2025-07-15

## 1. System Overview

This document outlines the technical architecture for the TaxApp B2B SaaS platform. The system is a multi-tenant application built on a Supabase backend and a React frontend. The architecture is designed to provide isolated, secure workspaces for our Partners and to support a usage-based billing model.

## 2. Technology Stack

*   **Frontend**: React (Vite), Zustand, Tailwind CSS
*   **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
*   **Payment Processing**: Stripe
*   **Transactional Email**: Resend
*   **File Uploader**: Uppy

## 3. Database Architecture

The database is designed with a unified accounts-centric architecture that consolidates all entities (admins, platforms, affiliates, clients, experts) into a single, normalized structure.

### 3.1. Core Architecture Principles

The new architecture follows these key principles:
- **Single Source of Truth**: All entities are represented in the `accounts` table
- **Type-Based Extensions**: Specialized data is stored in extension tables based on account type
- **Unified Access Control**: All permissions and tool access are managed consistently
- **Account-Level Billing**: All transactions and invoicing happen at the account level

### 3.2. Key Tables

#### Central Tables
*   **`accounts`**: Central table for all entities with types: admin, platform, affiliate, client, expert
*   **`profiles`**: User login accounts linked to a single account (many profiles can belong to one account)
*   **`account_tool_access`**: Unified tool access permissions with granular levels and affiliate overrides

#### Extension Tables
*   **`affiliates`**: Extension data for affiliate accounts (commission rates, territories, etc.)
*   **`clients`**: Extension data for client accounts (tax-specific information)
*   **`experts`**: External consultants (may optionally have accounts for login access)

#### Supporting Tables
*   **`tools`**: Defines the suite of tax tools offered
*   **`client_users`**: Junction table for multiple user logins per client account
*   **`transactions`**: Logs billable tool usage (now account-based)
*   **`invoices`**: Account-level billing aggregation
*   **`invitations`**: User invitation management system

### 3.3. Key Relationships

```
auth.users → profiles → accounts
                     ↓
            account_tool_access → tools
                     ↓
              affiliate overrides
                     ↓
              clients.primary_affiliate_id
```

### 3.4. Account Types & Access Levels

- **admin**: Single super-admin account managing the entire platform
- **platform**: Service fulfillment accounts (former partners) with full tool access
- **affiliate**: Sales/referral partners with limited tool access
- **client**: End customers with client-level tool access
- **expert**: External consultants with expert-level tool access

*(For the complete schema, refer to the `20250715200000_consolidate_accounts_schema.sql` migration file.)*

## 4. API Layer: Supabase Edge Functions

To ensure security and control, the frontend will not interact directly with the database. All data access is handled by a secure API layer built with Supabase Edge Functions, following a "fat function" service-based approach.

### 4.1. Core API Services

*   **`user-service`**: Handles user registration, login, invitations, and profile management.
*   **`admin-service`**: Handles all platform admin actions, such as creating and managing partners.
*   **`partner-service`**: Handles all actions for logged-in partners, such as managing their clients and affiliates.
*   **`billing-service`**: Handles the creation of billable transactions and integration with Stripe.

## 5. Frontend Architecture

The frontend is a single-page application (SPA) built with React and Vite.

*   **Entry Point**: `NewApp.tsx` is the primary entry point for the application.
*   **Routing**: The application uses a centralized, role-based routing system. After login, users are directed to the appropriate workspace (`/admin` for admins, `/partner` for partners) based on their `access_level`.
*   **State Management**: Zustand is used for global application state.

## 6. Third-Party Integrations

*   **Stripe**: Used for all payment processing. The integration is handled via the `billing-service` Edge Function, which creates Stripe Customer objects and Checkout sessions.
*   **Resend**: Used for all transactional emails, called from the `user-service` and `billing-service`.
*   **Uppy & Supabase Storage**: Used for secure file uploads.