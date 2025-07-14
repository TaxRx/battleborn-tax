# Product Requirements Document (PRD): B2B Partner Platform

**Project**: TaxApp B2B SaaS Platform
**Author**: BMad Product Manager
**Version**: 2.0
**Last Updated**: 2025-07-14

## 1. Strategic Vision & Business Model

This document outlines the requirements for a strategic pivot of the TaxApp application into a B2B SaaS platform. The primary goal is to empower tax professionals (Partners) by providing them with our proprietary suite of tax strategy tools. The business model is usage-based, charging Partners a per-transaction fee for each tax strategy they execute for their clients.

## 2. User Hierarchy & Roles

The platform supports a multi-layered user hierarchy:

*   **Admin (Platform Owner)**: Manages the entire platform, including partners, tool subscriptions, and billing.
*   **Partner (The Customer)**: A professional firm that subscribes to the service. They manage their own clients and affiliates within their isolated workspace.
*   **Affiliate (Partner's Agent)**: An individual user belonging to a Partner organization, with restricted access to assigned clients.
*   **Client (The End-User)**: The taxpayer whose data is being processed by a Partner. A client-facing portal is planned for a future phase.

## 3. Core Platform Features (MVP)

### Epic 1: Partner Lifecycle Management
*   **Admin View**: Admins can onboard, view, and manage Partner accounts from the existing `/admin` panel.
*   **Admin View**: Admins can control which tax tools each Partner is subscribed to.

### Epic 2: Partner Workspace
*   **Partner View**: Partners have a dedicated, isolated workspace to manage their clients and affiliates.
*   **Partner View**: Partners can use the tax tools they are subscribed to for their clients.

### Epic 3: Granular Permissions
*   **Partner View**: Partners can set tool-level permissions for their affiliates (`full`, `limited`, `reporting`, `none`).

### Epic 4: Transactional Billing & Payments
*   **System**: Every use of a tax tool is logged as a billable transaction.
*   **System**: Invoices are generated periodically for each Partner, aggregating their transactions.
*   **Partner View**: Partners can view their invoices and securely pay them via Stripe.

## 4. Required Third-Party Integrations

*   **Payment Processing**: Stripe
*   **Transactional Email**: Resend
*   **File Management**: Supabase Storage with Uppy