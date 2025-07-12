# User Story: Client Portal Support & Messaging

**Title:**  
Client Portal – Support and Messaging

**As a**  
client (end-user),

**I want to**  
be able to contact support or my assigned admin/affiliate through the portal,

**So that**  
I can get help, ask questions, and resolve issues efficiently.

---

## Acceptance Criteria

1. **Support Contact**
   - Clients can access a support/contact page from the portal navigation.
   - The page provides a form for submitting questions or requests to support/admin/affiliate.
   - The form includes fields for subject, message, and (optional) file attachment.
   - Upon submission, the message is sent to the appropriate party (admin, affiliate, or support team).
   - Clients receive confirmation that their message was sent.

2. **Messaging History**
   - Clients can view a history of their submitted support requests and responses.
   - Each message entry displays the date, subject, and status (open/closed/responded).
   - Clients can reply to ongoing conversations.

3. **Notifications**
   - Clients receive a notification (in-app or email) when a response is received.

4. **Security & Access**
   - Only authenticated clients can access support and messaging features.
   - Clients can only view their own messages (enforced by RLS).

5. **Error Handling**
   - If a message fails to send, a clear error message is shown with a retry option.
   - In development mode, detailed error messages are displayed for debugging.

6. **Testing**
   - Automated tests cover support form submission, messaging history, access control, and notifications.

---

## Implementation Notes

- **Frontend:**  
  - Create `Support.tsx` for support form and messaging history.
  - Display message status, history, and notifications.

- **Backend / Database:**  
  - Store support messages and attachments in a secure table/storage.
  - Ensure RLS policies restrict message access to the logged-in client.
  - Implement notification logic for new responses (in-app or email). 