# User Story: Client Portal Dashboard

**Title:**  
Client Portal – Dashboard View

**As a**  
client (end-user),

**I want to**  
see a personalized dashboard after logging in,

**So that**  
I can easily view my tax information, documents, and the status of my cases.

---

## Acceptance Criteria

1. **Dashboard Landing Page**
   - After login, clients are taken to a dashboard page.
   - The dashboard displays a welcome message with the client’s name.
   - The dashboard shows a summary of the client’s tax profile (e.g., filing status, last year filed, outstanding actions).
   - The dashboard lists recent documents (uploaded or received) with download/view links.
   - The dashboard displays the status of any open cases or tax credit applications.

2. **Navigation**
   - The dashboard provides clear navigation to other portal features (e.g., documents, profile, support).
   - There is a visible logout button.

3. **Security & Access**
   - Only authenticated clients can access the dashboard.
   - Clients can only see their own data (enforced by RLS).

4. **Error Handling**
   - If data fails to load, a clear error message is shown with a retry option.
   - In development mode, detailed error messages are displayed for debugging.

5. **Testing**
   - Automated tests cover dashboard rendering, data loading, and access control.

---

## Implementation Notes

- **Frontend:**  
  - Create `Dashboard.tsx` for the client dashboard view.
  - Fetch client data and documents from Supabase (using authenticated session).
  - Display loading and error states.
  - Add navigation and logout functionality.

- **Backend / Database:**  
  - Ensure RLS policies restrict data access to the logged-in client.
  - Provide endpoints or queries for fetching client profile, documents, and case status. 