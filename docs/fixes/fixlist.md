Database Fixes
on registration, we need to modify the handle_new_user db function to create an account first, then create the profile and link the profile to the new account. the account type should be client.
there is a user table in the public schema that we should delete as it shouldn't be used. The auth.user table is what is used.  If any fk points to public.users, it should be modified to point to auth.users.
profiles table - delete partner_id, admin_role, access_level; move has_completed_tax_profile to clients table; make account_id be required field
delete partners table. (these will be in accounts)
delete user_preferences table; move theme, notifications_enabled into profiles table
UI Changes
/admin page
MakeProfile Full Name and Role in the upper left sidebar area be dynamic based on current logged in profile.  Include the account type as well in that area
Update Logout button to logout  user and take to /login page
/admin/accounts page
getting CORS error on http://127.0.0.1:54321/functions/v1/admin-service request. Getting strict-origin-when-cross-origin
The Types filter is missing Platform type from its dropdown
Getting Bad Request 400 error on this api call to sort accounts: http://127.0.0.1:54321/rest/v1/accounts?select=id%2Cname%2Ctype%2Caddress%2Clogo_url%2Cwebsite_url%2Cstripe_customer_id%2Ccreated_at%2Cupdated_at%2Cprofiles%28count%29&order=created.desc&offset=0&limit=25
/admin/tool-management page
Getting error: 
Error: An invalid "width" prop has been specified. Grids must specify a number for width. "undefined" was specified.



/admin/partners page
rename the labels to be 'Platform Partners' instead of just Partners
Getting error when trying to create new Partner submission:
POST http://127.0.0.1:54321/functions/v1/admin-service
Payload: {"pathname":"/admin-service/create-partner","companyName":"Specialists Group","contactEmail":"main@group.com","logoUrl":""}
error: error: "You did not provide an API key. You need to provide your API key in the Authorization header, using Bearer auth (e.g. 'Authorization: Bearer YOUR_SECRET_KEY'). See https://stripe.com/docs/api#authentication for details, or we can help at https://support.stripe.com/."
move Partners menu item up under neath Tool Management
Question:
Where is billing/invoicing pages? I don't see them.

New Requirements:
modify the /register page to have a selection between registering as a Client (default), or as an Affiliate (CPA Firm, Wealth Management Firm, etc), and that determines the 'type' value of client or affiliate.
add rule to our database rules we created that says to use standard UUID for ids, you always seem to use an invalid UUID when inserting into db.

