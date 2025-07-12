# User Story: Client Portal Authentication

**Title:**  
Client Portal – User Signup and Login

**As a**  
client (end-user),

**I want to**  
be able to sign up for and log in to the client portal,

**So that**  
I can securely access my tax information and documents.

---

## Acceptance Criteria

1. **Signup Page**
   - There is a dedicated signup page for clients.
   - Clients can register using their email address and a secure password.
   - The system validates email format and password strength.
   - On successful signup, a new user is created in Supabase `auth.users`.
   - The new user is linked to a `client` record in the `clients` table (via `user_id`).
   - If the email is already registered, the user is prompted to log in instead.

2. **Login Page**
   - There is a dedicated login page for clients.
   - Clients can log in using their email and password.
   - On successful login, the client is redirected to their dashboard.
   - If login fails, an appropriate error message is displayed.

3. **Security**
   - All authentication flows use Supabase Auth.
   - RLS (Row Level Security) is enabled and enforced for all client data.
   - Clients can only access their own data.

4. **Error Handling**
   - All errors (invalid email, weak password, duplicate email, etc.) are clearly displayed to the user.
   - In development mode, detailed error messages are shown for debugging.

5. **Testing**
   - Automated tests cover signup, login, and RLS enforcement.

---

## Implementation Notes

- **Frontend:**  
  - Create `Signup.tsx` and `Login.tsx` pages/components.
  - Use Supabase JS client for authentication.
  - Add form validation and error display.
  - Update navigation to include links to signup/login.

- **Backend / Database:**  
  - Ensure `clients` table has a `user_id` column.
  - Enforce RLS policies so clients can only access their own records.
  - (Optional) Create a Supabase Edge Function to link new users to client records on signup.

- **Security:**  
  - Double-check that RLS is enabled on all relevant tables before launch. 