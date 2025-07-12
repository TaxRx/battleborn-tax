# User Story: Client Portal Document Upload & E-Signature

**Title:**  
Client Portal – Document Upload and E-Signature

**As a**  
client (end-user),

**I want to**  
be able to upload documents and electronically sign required forms through the portal,

**So that**  
I can securely provide necessary paperwork and complete required authorizations online.

---

## Acceptance Criteria

1. **Document Upload**
   - Clients can upload PDF, JPG, or PNG files via the portal.
   - Uploaded documents are securely stored in Supabase Storage and linked to the client’s record.
   - The UI displays a list of uploaded documents with upload date and file type.
   - Clients can download or view their uploaded documents.
   - The system validates file type and size before upload.

2. **E-Signature**
   - Clients can electronically sign required forms (e.g., engagement letter, authorization forms) directly in the portal.
   - The UI provides a clear workflow for reviewing and signing documents.
   - Signed documents are stored securely and marked as signed in the client’s record.
   - The system records the date/time and IP address of the signature for compliance.

3. **Security & Access**
   - Only authenticated clients can upload, view, or sign documents.
   - Clients can only access their own documents (enforced by RLS).

4. **Error Handling**
   - If upload or signing fails, a clear error message is shown with a retry option.
   - In development mode, detailed error messages are displayed for debugging.

5. **Testing**
   - Automated tests cover document upload, e-signature, and access control.

---

## Implementation Notes

- **Frontend:**  
  - Create `Documents.tsx` for document management and e-signature workflow.
  - Integrate with Supabase Storage for file uploads.
  - Integrate with an e-signature service (e.g., DocuSign, HelloSign, or open-source alternative).
  - Display upload progress, error states, and signed status.

- **Backend / Database:**  
  - Ensure RLS policies restrict document access to the logged-in client.
  - Store metadata for uploaded and signed documents (file name, type, upload date, signed status, etc.).
  - Record signature events for compliance. 