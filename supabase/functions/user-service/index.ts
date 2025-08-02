import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.3.1'

// CORS headers to allow requests from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin, referer, user-agent, x-client-site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Expose-Headers': 'content-length, x-json',
  'Access-Control-Max-Age': '86400',
}

// --- Main Server --- //
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const { pathname } = url

    // Initialize the Supabase Admin Client for elevated privileges
    const supabaseAdmin = createClient(
      (Deno.env.get('SUPABASE_URL') ?? ''),
      (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    )

    console.log('path',pathname, url.origin,'url: ' +  (Deno.env.get('SUPABASE_URL') ?? ''),
    'key: ' + (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''))
    
    // --- ROUTING --- //
    if (pathname === '/user-service/register') {
      return await handleRegistration(req, supabaseAdmin)
    } else if (pathname === '/user-service/login') {
      return await handleLogin(req, supabaseAdmin)
    } else if (pathname === '/user-service/send-invitation') {
      return await handleSendInvitation(req, supabaseAdmin)
    } else if (pathname === '/user-service/get-profile') {
      return await handleGetProfile(req, supabaseAdmin)
    } else if (pathname === '/user-service/reset-password') {
      return await handlePasswordReset(req, supabaseAdmin)
    } else if (pathname === '/user-service/admin/check-auth-user') {
      return await handleAdminCheckAuthUser(req, supabaseAdmin)
    } else if (pathname === '/user-service/admin/create-auth-user') {
      return await handleAdminCreateAuthUser(req, supabaseAdmin)
    } else if (pathname === '/user-service/admin/create-profile-with-auth') {
      return await handleAdminCreateProfileWithAuth(req, supabaseAdmin)
    } else if (pathname === '/user-service/admin/delete-auth-user') {
      return await handleAdminDeleteAuthUser(req, supabaseAdmin)
    } else if (pathname === '/user-service/admin/get-user-by-email') {
      return await handleAdminGetUserByEmail(req, supabaseAdmin)
    } else if (pathname === '/user-service/admin/generate-magic-link') {
      return await handleAdminGenerateMagicLink(req, supabaseAdmin)
    }

    return new Response(JSON.stringify({ error: 'Not Found:' + pathname }), {
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

// --- Handler for User Registration --- //
async function handleRegistration(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const registrationData = await req.json()

  // Reuse validation logic from the original function
  const validation = validateRegistrationData(registrationData)
  if (!validation.isValid) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: validation.errors }), { status: 400 })
  }

  // Determine account type - default to 'client' if not 'affiliate'
  const accountType = ['affiliate','expert','admin','operator','client'].includes(registrationData.type) ? registrationData.type : 'client';
  
  // Check if we should use createUser instead of signUp (for admin creation)
  const useCreateUser = registrationData.useCreateUser === true;

  // Create the user using Supabase auth
  let authData, authError;
  if (useCreateUser) {
    // Use createUser for admin-created accounts (no email verification required)
    const result = await supabaseAdmin.auth.admin.createUser({
      email: registrationData.email,
      password: registrationData.password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: registrationData.fullName,
        personal_info: registrationData.personalInfo,
        business_info: registrationData.businessInfo,
        account_type: accountType
      }
    });
    authData = result.data;
    authError = result.error;
  } else {
    // Use signUp for self-registration (requires email verification)
    const result = await supabaseAdmin.auth.signUp({
      email: registrationData.email,
      password: registrationData.password,
      options: {
        data: {
          full_name: registrationData.fullName,
          personal_info: registrationData.personalInfo,
          business_info: registrationData.businessInfo,
          account_type: accountType
        }
      }
    });
    authData = result.data;
    authError = result.error;
  }
  if (authError) {
    console.error('Auth signUp failed:', JSON.stringify(authError, null, 2))
    console.error('Registration data:', JSON.stringify(registrationData, null, 2))
    return new Response(JSON.stringify({ 
      error: `Registration failed: ${authError.message}`,
      details: authError 
    }), { status: 400 })
  }

  if (!authData.user) {
    return new Response(JSON.stringify({ error: 'Registration failed - no user created' }), { status: 400 })
  }

  // Since the trigger approach doesn't work, manually create account and profile
  try {
    // Create Stripe customer for non-admin accounts
    let stripeCustomerId = null;
    
    if (accountType !== 'admin') {
      try {
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_API_KEY');
        console.log('Stripe key check for registration:', { 
          hasSecretKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
          hasApiKey: !!Deno.env.get('STRIPE_API_KEY'),
          keyLength: stripeSecretKey?.length || 0,
          keyPrefix: stripeSecretKey?.substring(0, 7) || 'none'
        });
        
        if (!stripeSecretKey) {
          throw new Error('Stripe API key not found in environment variables');
        }
        
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
        const accountName = registrationData.businessInfo?.businessName || registrationData.fullName || authData.user.email;
        
        const stripeCustomer = await stripe.customers.create({
          name: accountName,
          email: registrationData.email,
          metadata: {
            account_type: accountType,
            created_via: 'user_registration',
            full_name: registrationData.fullName
          }
        })
        stripeCustomerId = stripeCustomer.id;
        console.log('Stripe customer created:', stripeCustomerId);
      } catch (stripeError) {
        console.error('Stripe customer creation failed during registration:', stripeError);
        // Don't fail the entire registration if Stripe fails
        // Just log the error and continue without Stripe customer ID
      }
    }

    // Create account first
    const accountName = registrationData.businessInfo?.businessName || registrationData.fullName || authData.user.email;
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .insert({
        name: accountName,
        type: accountType,
        contact_email: registrationData.email,
        stripe_customer_id: stripeCustomerId
      })
      .select()
      .single();

    if (accountError) {
      console.error('Error creating account:', accountError);
      // If account creation fails and we created a Stripe customer, clean it up
      if (stripeCustomerId) {
        try {
          const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_API_KEY');
          const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
          await stripe.customers.del(stripeCustomerId)
          console.log('Cleaned up Stripe customer after account creation failure:', stripeCustomerId);
        } catch (cleanupError) {
          console.error('Failed to cleanup Stripe customer:', cleanupError)
        }
      }
      throw accountError;
    }

    // Create profile with account_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: registrationData.email,
        full_name: registrationData.fullName,
        role: 'admin',
        account_id: accountData.id
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    // Create corresponding record based on account type
    if (accountType === 'affiliate') {
      const { error: affiliateError } = await supabaseAdmin
        .from('affiliates')
        .insert({
          account_id: accountData.id
        });

      if (affiliateError) {
        console.error('Error creating affiliate:', accountData.id,affiliateError);
        // Don't fail registration for this
      }
    } else if (accountType === 'client') {
      const { error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          full_name: registrationData.fullName,
          email: registrationData.email,
          account_id: accountData.id,
          created_by: authData.user.id
        });

      if (clientError) {
        console.error('Error creating client:', clientError);
        // Don't fail registration for this
      }
    }
    // For admin/operator/expert types, we just create the account and profile, no additional records

  } catch (error) {
    console.error('Error in manual account/profile creation:', error);
    // Don't fail the registration, just log the error
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data: { 
      user: authData.user
    }, 
    message: 'Registration successful. Please check email for verification.' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

// --- Handler for User Login --- //
async function handleLogin(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { email, password } = await req.json()

  // Validate input
  if (!email?.trim() || !password?.trim()) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 })
  }

  try {
    console.log('Attempting login for:', email.trim())
    
    // Sign in user using Supabase auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.trim(),
      password: password
    })

    console.log('Auth result:', { authData: !!authData, authError })
    
    if (authError) {
      console.log('Auth error details:', authError)
      return new Response(JSON.stringify({ error: authError.message }), { status: 401 })
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'Login failed - no user data' }), { status: 401 })
    }

    // Get user profile first
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return new Response(JSON.stringify({ error: 'Failed to get user profile' }), { status: 500 })
    }

    // Get account information separately to avoid RLS issues
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, name, type, stripe_customer_id')
      .eq('id', profile.account_id)
      .single()

    if (accountError) {
      console.error('Error fetching account:', accountError)
      // Don't fail login for this, just continue without account info
    }

    // Attach account to profile
    profile.account = account

    // Get client user relationships
    const { data: clientUsers, error: clientUsersError } = await supabaseAdmin
      .from('client_users')
      .select(`
        *,
        client:clients (
          id,
          full_name,
          email,
          phone,
          filing_status,
          home_address,
          state,
          dependents,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', authData.user.id)
      .eq('is_active', true)

    if (clientUsersError) {
      //console.error('Error fetching client users:', clientUsersError)
      // Don't fail login for this, just log and continue
    }

    // Return login response with session token and user data
    return new Response(JSON.stringify({
      success: true,
      session: authData.session,
      user: {
        profile,
        clientUsers: clientUsers || [],
        accountType: profile.account?.type
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Login error:', error)
    return new Response(JSON.stringify({ error: 'Login failed' }), { status: 500 })
  }
}

// --- Handler for Sending Invitations --- //
async function handleSendInvitation(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { inviterId, inviteeEmail, role, accountId, clientId } = await req.json()

  // TODO: Add permission check to ensure inviterId has authority to invite

  // Generate invitation token and record
  // Note: Using partner_id column for backward compatibility, but it now stores account_id
  const { data: invitation, error } = await supabaseAdmin
    .from('invitations')
    .insert({ 
      invited_by: inviterId, 
      email: inviteeEmail, 
      role, 
      partner_id: accountId,  // Note: keeping column name for now
      client_id: clientId 
    })
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: `Failed to create invitation: ${error.message}` }), { status: 500 })
  }

  // TODO: Integrate with Resend to send a branded email
  console.log(`Sending invitation to ${inviteeEmail} for account ${accountId} with token ${invitation.token}`)

  return new Response(JSON.stringify({ success: true, message: 'Invitation sent.' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

// --- Handler for Getting User Profile --- //
async function handleGetProfile(req, supabaseAdmin) {
    const { data: { user } } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    ).auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Get user profile first
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 500 })
    }

    // Get account information separately to avoid RLS issues
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, name, type, stripe_customer_id')
      .eq('id', profile.account_id)
      .single()

    if (accountError) {
      console.error('Error fetching account:', accountError)
      // Don't fail request for this, just continue without account info
    }

    // Get client user relationships
    const { data: clientUsers, error: clientUsersError } = await supabaseAdmin
      .from('client_users')
      .select(`
        *,
        client:clients (
          id,
          full_name,
          email,
          phone,
          filing_status,
          home_address,
          state,
          dependents,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (clientUsersError) {
      console.error('Error fetching client users:', clientUsersError)
      // Don't fail request for this, just continue without client users
    }

    // Attach account to profile
    profile.account = account

    // Return complete user data
    const userData = {
      profile,
      clientUsers: clientUsers || [],
      accountType: account?.type
    }
      
    return new Response(JSON.stringify(userData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

// --- Handler for Password Reset --- //
async function handlePasswordReset(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { email } = await req.json()

  // Validate input
  if (!email?.trim()) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 })
  }

  try {
    console.log('Requesting password reset for:', email.trim())
    
    // Send password reset email using Supabase auth
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5174'}/reset-password`,
    })

    if (error) {
      console.error('Password reset error:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }

    console.log('Password reset email sent successfully for:', email.trim(), data)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Password reset email sent successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Password reset request error:', error)
    return new Response(JSON.stringify({ error: 'Failed to send password reset email' }), { status: 500 })
  }
}

// --- ADMIN USER MANAGEMENT HANDLERS --- //

// Middleware to verify admin authorization
async function verifyAdminAccess(req, supabaseAdmin) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Authorization header required', status: 401 }
    }

    // Create a client with the user's token to verify their identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return { error: 'Invalid or expired token', status: 401 }
    }

    // Get the user's profile to check admin status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, is_admin, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile for admin check:', profileError)
      return { error: 'Failed to verify user permissions', status: 500 }
    }

    // Check if user is admin
    if (!profile.is_admin && profile.role !== 'admin') {
      console.log(`Unauthorized admin access attempt by user: ${profile.email} (role: ${profile.role}, is_admin: ${profile.is_admin})`)
      return { error: 'Admin access required', status: 403 }
    }

    console.log(`Admin access verified for user: ${profile.email}`)
    return { user, profile }
  } catch (error) {
    console.error('Error in admin access verification:', error)
    return { error: 'Failed to verify admin access', status: 500 }
  }
}

// --- Handler for Admin Check Auth User --- //
async function handleAdminCheckAuthUser(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405 
    })
  }

  // Verify admin access
  const adminCheck = await verifyAdminAccess(req, supabaseAdmin)
  if (adminCheck.error) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: adminCheck.status
    })
  }

  try {
    const { email } = await req.json()

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
    
    console.log(`Admin ${adminCheck.profile.email} checked existence of auth user: ${email} - exists: ${userExists}`)
    
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
async function handleAdminCreateAuthUser(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405 
    })
  }

  // Verify admin access
  const adminCheck = await verifyAdminAccess(req, supabaseAdmin)
  if (adminCheck.error) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: adminCheck.status
    })
  }

  try {
    const { email, password = 'TempPass123!' } = await req.json()

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

    console.log(`Admin ${adminCheck.profile.email} created auth user: ${email} with ID: ${data.user.id}`)

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
async function handleAdminCreateProfileWithAuth(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405 
    })
  }

  // Verify admin access
  const adminCheck = await verifyAdminAccess(req, supabaseAdmin)
  if (adminCheck.error) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: adminCheck.status
    })
  }

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
    } = await req.json()

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
      const authResult = await handleAdminCreateAuthUser(
        new Request(req.url, {
          method: 'POST',
          headers: req.headers,
          body: JSON.stringify({ email, password })
        }),
        supabaseAdmin
      )

      const authData = await authResult.json()
      if (!authData.success) {
        return new Response(JSON.stringify({
          error: `Failed to create user login: ${authData.error}`,
          details: authData.details
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }

      authUserId = authData.userId
      temporaryPassword = authData.temporaryPassword
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

    console.log(`Admin ${adminCheck.profile.email} created profile: ${email} with ID: ${profile.id} (createLogin: ${createLogin})`)

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

// --- Handler for Admin Delete Auth User --- //
async function handleAdminDeleteAuthUser(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405 
    })
  }

  // Verify admin access
  const adminCheck = await verifyAdminAccess(req, supabaseAdmin)
  if (adminCheck.error) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: adminCheck.status
    })
  }

  try {
    const { userId } = await req.json()

    if (!userId?.trim()) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Delete the auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Error deleting auth user:', error)
      return new Response(JSON.stringify({ 
        error: 'Failed to delete auth user',
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log(`Admin ${adminCheck.profile.email} deleted auth user: ${userId}`)

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Auth user deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in handleAdminDeleteAuthUser:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to delete auth user',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}

// --- Handler for Admin Get User By Email --- //
async function handleAdminGetUserByEmail(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405 
    })
  }

  // Verify admin access
  const adminCheck = await verifyAdminAccess(req, supabaseAdmin)
  if (adminCheck.error) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: adminCheck.status
    })
  }

  try {
    const { email } = await req.json()

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
    
    console.log(`Admin ${adminCheck.profile.email} retrieved user by email: ${email} - found: ${!!data.user}`)
    
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
async function handleAdminGenerateMagicLink(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405 
    })
  }

  // Verify admin access
  const adminCheck = await verifyAdminAccess(req, supabaseAdmin)
  if (adminCheck.error) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: adminCheck.status
    })
  }

  try {
    const { email, redirectTo } = await req.json()

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
    
    console.log(`Admin ${adminCheck.profile.email} generated magic link for: ${email}`)
    
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

// --- Validation Logic (reused from original function) --- //
function validateRegistrationData(data) {
  const errors = []
  if (!data.email?.trim()) errors.push('Email is required')
  if (!data.password?.trim()) errors.push('Password is required')
  if (!data.fullName?.trim()) errors.push('Full name is required')
  // Add more detailed validation as needed from the original file
  return {
    isValid: errors.length === 0,
    errors
  }
}