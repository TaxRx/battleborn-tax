
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.3.1'
import { handleActivityOperations } from './activity-handler.ts'
import { handleAccountOperations } from './account-handler.ts'
import { handleSecurityOperations } from './security-handler.ts'
import { handleProfileOperations } from './profile-handler.ts'

// CORS headers to allow requests from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin, referer, user-agent, x-client-site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Expose-Headers': 'content-length, x-json',
  'Access-Control-Max-Age': '86400',
}

// Helper function to check for admin privileges
const isAdmin = async (supabaseClient, supabaseServiceClient) => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return false;

  // Use service role client to bypass RLS and avoid circular dependency
  const { data, error } = await supabaseServiceClient
    .from('profiles')
    .select(`
      account:accounts!inner(type)
    `)
    .eq('id', user.id)
    .single();

  if (error || !data) return false;

  return data.account?.type === 'admin';
}

serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the user making the request.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Create a service role client for admin operations (bypasses RLS)
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check if the user is a platform admin before proceeding
    const isPlatformAdmin = await isAdmin(supabaseClient, supabaseServiceClient);
    if (!isPlatformAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Not an admin' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Get the request body to check for pathname (only for POST/PUT/PATCH requests)
    let body = {};
    try {
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers.get('content-length') !== '0') {
        body = await req.json();
      }
    } catch (error) {
      console.warn('Failed to parse request body:', error);
      // Continue with empty body object
    }
    const pathname = body.pathname || new URL(req.url).pathname;

    // Handle security operations (highest priority for authentication/authorization)
    if (pathname.includes('/security/')) {
      return await handleSecurityOperations(req, supabaseServiceClient, corsHeaders);
    }

    // Handle activity operations (must be before other routes to catch activity endpoints)
    if (pathname.includes('/activities') || pathname.includes('/activity-summary') || pathname.includes('/recent-activities')) {
      return await handleActivityOperations(req, supabaseServiceClient, corsHeaders);
    }

    // Handle profile CRUD operations (must be before account routes to catch profile endpoints)
    if (pathname.includes('/profiles')) {
      return await handleProfileOperations(req, supabaseServiceClient, corsHeaders);
    }

    // Handle account CRUD operations (must be before legacy partner routes)
    if (pathname.includes('/accounts')) {
      return await handleAccountOperations(req, supabaseServiceClient, corsHeaders);
    }

    // Admin auth endpoints
    if (pathname === '/admin-service/get-user-by-email') {
      return await handleAdminGetUserByEmail(body, supabaseServiceClient)
    } else if (pathname === '/admin-service/generate-magic-link') {
      return await handleAdminGenerateMagicLink(body, supabaseServiceClient)
    } else if (pathname === '/admin-service/check-auth-user') {
      return await handleAdminCheckAuthUser(body, supabaseServiceClient)
    } else if (pathname === '/admin-service/create-auth-user') {
      return await handleAdminCreateAuthUser(body, supabaseServiceClient)
    } else if (pathname === '/admin-service/create-profile-with-auth') {
      return await handleAdminCreateProfileWithAuth(body, supabaseServiceClient)
    }

    // Routing logic for admin-specific actions
    if (pathname === '/admin-service/create-operator') {
      const { companyName, contactEmail, logoUrl } = body

      // 1. Create a Stripe Customer object
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_API_KEY');
      console.log('Stripe key check:', { 
        hasSecretKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
        hasApiKey: !!Deno.env.get('STRIPE_API_KEY'),
        keyLength: stripeSecretKey?.length || 0,
        keyPrefix: stripeSecretKey?.substring(0, 7) || 'none'
      });
      
      if (!stripeSecretKey) {
        throw new Error('Stripe API key not found in environment variables');
      }
      
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
      const stripeCustomer = await stripe.customers.create({
        name: companyName,
        email: contactEmail,
      })

      // 2. Create a new record in the public.accounts table
      const { data: account, error: accountError } = await supabaseServiceClient
        .from('accounts')
        .insert({
          name: companyName,
          type: 'operator',
          logo_url: logoUrl,
          stripe_customer_id: stripeCustomer.id,
        })
        .select()
        .single()

      if (accountError) {
        console.log('accountError', accountError)
        // If this fails, we should ideally delete the Stripe customer to avoid orphans
        await stripe.customers.del(stripeCustomer.id)
        return new Response(JSON.stringify({ error: accountError.message }), { status: 500 })
      }

      // // 3. Send an invitation to the primary contact email
      // // This calls our other Edge Function to handle the invitation logic
      // const { data: { user } } = await supabaseClient.auth.getUser();
      // const inviteResponse = await supabaseClient.functions.invoke('user-service', {
      //   body: {
      //     pathname: '/user-service/send-invitation',
      //     inviterId: user.id, // The admin is the inviter
      //     inviteeEmail: contactEmail,
      //     role: 'account_admin', // Assigning the primary contact as account admin
      //     accountId: account.id,
      //   },
      // })

      // if (inviteResponse.error) {
      //   // If invite fails, clean up account and stripe customer
      //   await supabaseServiceClient.from('accounts').delete().eq('id', account.id)
      //   await stripe.customers.del(stripeCustomer.id)
      //   return new Response(JSON.stringify({ error: `Failed to send invitation: ${inviteResponse.error.message}` }), { status: 500 })
      // }

      return new Response(JSON.stringify({ message: "Account created and invitation sent successfully", account }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/admin-service/create-account') {
      const { name, type, address, website_url, logo_url, contact_email } = body

      let stripeCustomerId = null;

      // Create Stripe customer for non-admin account types
      if (type !== 'admin' && contact_email) {
        try {
          const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_API_KEY');
          console.log('Stripe key check for account creation:', { 
            hasSecretKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
            hasApiKey: !!Deno.env.get('STRIPE_API_KEY'),
            keyLength: stripeSecretKey?.length || 0,
            keyPrefix: stripeSecretKey?.substring(0, 7) || 'none'
          });
          
          if (!stripeSecretKey) {
            throw new Error('Stripe API key not found in environment variables');
          }
          
          const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
          const stripeCustomer = await stripe.customers.create({
            name: name,
            email: contact_email,
            metadata: {
              account_type: type,
              created_via: 'admin_panel'
            }
          })
          stripeCustomerId = stripeCustomer.id;
        } catch (stripeError) {
          console.error('Stripe customer creation failed:', stripeError);
          // Don't fail the entire account creation if Stripe fails
          // Just log the error and continue without Stripe customer ID
        }
      }

      // Create account record in database
      const { data: account, error: accountError } = await supabaseServiceClient
        .from('accounts')
        .insert({
          name: name,
          type: type,
          address: address || null,
          website_url: website_url || null,
          logo_url: logo_url || null,
          stripe_customer_id: stripeCustomerId,
        })
        .select()
        .single()

      if (accountError) {
        console.log('accountError', accountError)
        // If account creation fails and we created a Stripe customer, clean it up
        if (stripeCustomerId) {
          try {
            const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_API_KEY');
            const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
            await stripe.customers.del(stripeCustomerId)
          } catch (cleanupError) {
            console.error('Failed to cleanup Stripe customer:', cleanupError)
          }
        }
        return new Response(JSON.stringify({ error: accountError.message }), { status: 500 })
      }

      return new Response(JSON.stringify({ 
        message: "Account created successfully", 
        account,
        stripe_customer_id: stripeCustomerId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/admin-service/list-operators') {
      // Query the public.accounts table for operator accounts
      const { data, error } = await supabaseServiceClient
        .from('accounts')
        .select('*')
        .eq('type', 'operator')
      if (error) throw error;
      
      // Transform data to match frontend expectations
      const transformedData = data.map(account => ({
        id: account.id,
        company_name: account.name,
        logo_url: account.logo_url,
        status: 'active', // Default status for accounts
        stripe_customer_id: account.stripe_customer_id,
        primary_contact_email: null, // Will need to be fetched from profiles if needed
        created_at: account.created_at,
        updated_at: account.updated_at,
      }))
      
      return new Response(JSON.stringify(transformedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/admin-service/update-operator-status') {
      // TODO: Implement logic to update an operator's status
      // 1. Get operator_id and new status from request body
      // 2. Update the record in the public.accounts table
      // ... implementation needed
      return new Response(JSON.stringify({ message: "Operator status updated" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/admin-service/update-account-tool-access') {
      // Update account tool access permissions
      const { accountId, toolAccess } = body
      
      // Delete existing access records for this account
      await supabaseServiceClient
        .from('account_tool_access')
        .delete()
        .eq('account_id', accountId)
      
      // Insert new access records
      if (toolAccess && toolAccess.length > 0) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const accessRecords = toolAccess.map(access => ({
          account_id: accountId,
          tool_id: access.tool_id,
          access_level: access.access_level,
          affiliate_id: access.affiliate_id || null,
          granted_by: user.id,
        }))
        
        const { error } = await supabaseServiceClient
          .from('account_tool_access')
          .insert(accessRecords)
          
        if (error) throw error;
      }
      
      return new Response(JSON.stringify({ message: "Account tool access updated" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Fallback for unknown routes
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// --- Additional Admin Handlers --- //

// --- Handler for Admin Get User By Email --- //
async function handleAdminGetUserByEmail(body, supabaseAdmin) {
  try {
    const { email } = body

    if (!email?.trim()) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Get user by email using admin API
    const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email.trim().toLowerCase())
    
    if (error) {
      console.error('Error getting user by email:', error)
      return new Response(JSON.stringify({ 
        error: 'Failed to get user by email',
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }
    
    console.log(`Admin retrieved user by email: ${email} - found: ${!!data.user}`)
    
    return new Response(JSON.stringify({ 
      user: data.user || null,
      email: email.toLowerCase()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in handleAdminGetUserByEmail:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to get user by email',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}

// --- Handler for Admin Generate Magic Link --- //
async function handleAdminGenerateMagicLink(body, supabaseAdmin) {
  try {
    const { email, redirectTo } = body

    if (!email?.trim()) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    if (!redirectTo?.trim()) {
      return new Response(JSON.stringify({ error: 'Redirect URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Generate magic link using admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: redirectTo.trim()
      }
    })
    
    if (error) {
      console.error('Error generating magic link:', error)
      return new Response(JSON.stringify({ 
        error: 'Failed to generate magic link',
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }
    
    console.log(`Admin generated magic link for: ${email}`)
    
    return new Response(JSON.stringify({ 
      success: true,
      magicLink: data.properties?.action_link || null,
      email: email.toLowerCase()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in handleAdminGenerateMagicLink:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate magic link',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}

// --- Handler for Admin Check Auth User --- //
async function handleAdminCheckAuthUser(body, supabaseAdmin) {
  try {
    const { email } = body

    if (!email?.trim()) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // List all users and check if email exists
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Reasonable limit for checking existence
    })
    
    if (error) {
      console.error('Error listing auth users:', error)
      return new Response(JSON.stringify({ 
        error: 'Failed to check user existence',
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }
    
    // Check if any user has the matching email (case-insensitive)
    const userExists = data.users.some(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    )
    
    console.log(`Admin checked existence of auth user: ${email} - exists: ${userExists}`)
    
    return new Response(JSON.stringify({ 
      exists: userExists,
      email: email.toLowerCase()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in handleAdminCheckAuthUser:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to check user existence',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}

// --- Handler for Admin Create Auth User --- //
async function handleAdminCreateAuthUser(body, supabaseAdmin) {
  try {
    const { email, password = 'TempPass123!' } = body

    if (!email?.trim()) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Create the auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true // Auto-confirm the email
    })

    if (error) {
      console.error('Error creating auth user:', error)
      return new Response(JSON.stringify({ 
        error: 'Failed to create user login',
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    if (!data.user) {
      return new Response(JSON.stringify({ 
        error: 'Failed to create user - no user returned' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log(`Admin created auth user: ${email} with ID: ${data.user.id}`)

    return new Response(JSON.stringify({ 
      success: true,
      userId: data.user.id,
      email: data.user.email,
      message: 'User login created successfully',
      temporaryPassword: password
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in handleAdminCreateAuthUser:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to create user login',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}

// --- Handler for Admin Create Profile With Auth --- //
async function handleAdminCreateProfileWithAuth(body, supabaseAdmin) {
  try {
    const { 
      email, 
      full_name, 
      role = 'user', 
      account_id, 
      phone, 
      status = 'pending',
      createLogin = false,
      password = 'TempPass123!'
    } = body

    // Validate required fields
    if (!email?.trim()) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    if (!account_id) {
      return new Response(JSON.stringify({ error: 'Account ID is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    let authUserId = undefined
    let temporaryPassword = undefined

    // Create auth user first if requested
    if (createLogin) {
      try {
        // Create the auth user directly without calling handleAdminCreateAuthUser
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password: password,
          email_confirm: true // Auto-confirm the email
        })

        if (authError) {
          console.error('Error creating auth user:', authError)
          return new Response(JSON.stringify({ 
            error: 'Failed to create user login',
            details: authError.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          })
        }

        if (!authData.user) {
          return new Response(JSON.stringify({ 
            error: 'Failed to create user - no user returned' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          })
        }

        authUserId = authData.user.id
        temporaryPassword = password
        console.log(`Admin created auth user: ${email} with ID: ${authData.user.id}`)

      } catch (authError) {
        console.error('Error in auth user creation:', authError)
        return new Response(JSON.stringify({ 
          error: 'Failed to create user login',
          details: authError.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }
    }

    // Create the profile
    const profileData = {
      email: email.trim().toLowerCase(),
      full_name: full_name?.trim() || null,
      role: role || 'user',
      account_id: account_id,
      phone: phone?.trim() || null,
      status: status || 'pending',
      auth_sync_status: authUserId ? 'synced' : 'pending',
      metadata: {},
      preferences: {},
      timezone: 'UTC',
      login_count: 0,
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // If auth user was created, use that ID for the profile
    if (authUserId) {
      profileData.id = authUserId
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([profileData])
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      
      // If profile creation failed but auth user was created, clean up
      if (authUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUserId)
          console.log('Cleaned up auth user after profile creation failure:', authUserId)
        } catch (cleanupError) {
          console.error('Error cleaning up auth user after profile creation failure:', cleanupError)
        }
      }
      
      return new Response(JSON.stringify({
        error: 'Failed to create profile',
        details: profileError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log(`Admin created profile: ${email} with ID: ${profile.id} (createLogin: ${createLogin})`)

    return new Response(JSON.stringify({ 
      success: true,
      profile: profile,
      message: createLogin ? 
        'Profile and user login created successfully' : 
        'Profile created successfully',
      temporaryPassword: temporaryPassword
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in handleAdminCreateProfileWithAuth:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to create profile',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}
