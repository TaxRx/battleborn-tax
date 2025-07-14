# Architecture Document: B2B Partner Platform

**Project**: TaxApp B2B SaaS Platform
**Author**: BMad Architect
**Version**: 2.0
**Last Updated**: 2025-07-14

## 1. System Overview

This document outlines the technical architecture for the TaxApp B2B SaaS platform. The system is a multi-tenant application built on a Supabase backend and a React frontend. The architecture is designed to provide isolated, secure workspaces for our Partners and to support a usage-based billing model.

## 2. Technology Stack

*   **Frontend**: React (Vite), Zustand, Tailwind CSS
*   **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
*   **Payment Processing**: Stripe
*   **Transactional Email**: Resend
*   **File Uploader**: Uppy

## 3. Database Architecture

The database is designed with a multi-layered hierarchy to support platform admins, partners, affiliates, and clients.

### 3.1. Key Tables

*   **`partners`**: Stores partner organizations (our customers).
*   **`tools`**: Defines the suite of tax tools offered.
*   **`partner_tool_subscriptions`**: Maps which tools a partner is subscribed to.
*   **`affiliate_tool_permissions`**: Maps which tools a partner's affiliates can access.
*   **`transactions`**: Logs each billable use of a tool.
*   **`invoices`**: Aggregates transactions for partner billing.
*   **`profiles`**: Stores user data, with `access_level` and `role` fields to manage permissions.
*   **`clients`**: Stores end-user data, linked to a partner and an affiliate.
*   **`client_users`**: A junction table to enable multiple user logins for a single client account.

*(For the complete schema, refer to the `20250714120000_create_partner_platform_schema.sql` migration file.)*

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