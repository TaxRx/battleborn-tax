# Client Portal Architecture Document

**Project**: TaxApp Client Portal
**Author**: BMad Architect
**Created**: 2025-07-08
**Version**: 1.0

## 1. System Overview

This document outlines the technical architecture for the new client-facing portal. The portal will be a secure, mobile-first web application that extends the existing TaxApp functionality to clients, allowing them to manage their documents, pay invoices, and interact with the service.

This architecture is designed to be built upon the successful implementation of the **Security Hardening Plan** detailed in the Brownfield Architecture Document.

## 2. Technology Stack

*   **Frontend**: React (Vite), Zustand for state management, Tailwind CSS for styling.
*   **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
*   **File Uploader**: [Uppy](https://uppy.io/) for a robust and user-friendly file upload experience.
*   **Payment Processing**: [Stax](https://staxpayments.com/)
*   **Transactional Email**: [Resend](https://resend.com/)
*   **E-Signature**: [SignWell](https://www.signwell.com/) (recommended due to its developer-friendly API and free tier).

## 3. Database & Data Model Changes

The existing database schema will be extended to support the portal's functionality.

### 3.1. New Tables

*   `invoices`:
    *   `id`: UUID, Primary Key
    *   `client_id`: UUID, Foreign Key to `clients.id`
    *   `amount`: DECIMAL
    *   `status`: VARCHAR (e.g., 'due', 'paid', 'overdue')
    *   `due_date`: DATE
    *   `stax_transaction_id`: VARCHAR (to link to the payment processor)
*   `client_documents`:
    *   `id`: UUID, Primary Key
    *   `client_id`: UUID, Foreign Key to `clients.id`
    *   `file_name`: VARCHAR
    *   `storage_path`: VARCHAR (path in Supabase Storage)
    *   `document_type`: VARCHAR (e.g., 'w2', '1099', 'engagement_letter')
    *   `e_signature_request_id`: VARCHAR (to link to SignWell)

### 3.2. Table Modifications

*   `clients`: Add a `user_id` column to link the client record to their `auth.users` entry.

## 4. Security Architecture

Security is paramount. The portal's security will be built on two layers:

### 4.1. Row Level Security (RLS)

*   **Client Data Access**: A strict RLS policy will be implemented on all tables containing client data. The core principle is: `auth.uid() = user_id`. A client will only ever be able to see records that are directly associated with their own user ID.

### 4.2. API Layer (Supabase Edge Functions)

To avoid exposing the database directly to the client-side, we will use Supabase Edge Functions as a secure API layer.

*   **Function-Based Access**: The frontend will not call the database directly. Instead, it will call specific, single-purpose Edge Functions, such as:
    *   `getClientDashboard()`: Fetches the data needed for the client's dashboard.
    *   `uploadDocument()`: Handles the logic for uploading a file to Supabase Storage and creating a corresponding entry in the `client_documents` table.
    *   `initiatePayment()`: Creates a payment session with Stax.
    *   `sendEsignRequest()`: Initiates an e-signature request with SignWell.
*   **Benefits**: This approach provides a secure, controlled interface that abstracts the database, enhances security, and allows for more complex backend logic.

## 5. Frontend Architecture

The portal will be a single-page application (SPA) built with React and Vite.

*   **Component Structure**: The UI will be broken down into a series of reusable components (e.g., `InvoiceList`, `DocumentUploader`, `DashboardNotification`).
*   **State Management**: Zustand will be used to manage global application state, such as the logged-in user's profile and notifications.
*   **Routing**: A routing library (like React Router) will be used to manage navigation between the different sections of the portal (Dashboard, Documents, Billing, etc.).

## 6. Third-Party Integrations

*   **Stax Payments**: The payment flow will involve the client-side calling a Supabase Edge Function to create a payment intent. The client will then be redirected to a secure Stax-hosted page to complete the payment. Webhooks will be used to notify our backend when a payment is successful.
*   **SignWell E-Signature**: The application will use the SignWell API to send signature requests to clients. Webhooks will be used to update the status of the document in our database when it is signed.
*   **Resend**: Transactional emails (e.g., welcome email, password reset, payment receipt) will be sent via the Resend API, called from Supabase Edge Functions.

## 7. File Management

*   **Uppy Uploader**: The Uppy file uploader will be integrated into the frontend to provide a seamless and robust file upload experience.
*   **Supabase Storage**: All client documents will be securely stored in a dedicated Supabase Storage bucket. Access to this bucket will be controlled by strict storage policies to ensure clients can only access their own files.
