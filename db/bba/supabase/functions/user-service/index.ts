import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('path',pathname, url)

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
    }

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

  // Create the user using Supabase auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
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
  })
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
    // Create account
    const accountName = registrationData.businessInfo?.businessName || registrationData.fullName || authData.user.email;
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .insert({
        name: accountName,
        type: accountType
      })
      .select()
      .single();

    if (accountError) {
      console.error('Error creating account:', accountError);
      throw accountError;
    }

    // Create profile
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
        console.error('Error creating affiliate:', affiliateError);
        // Don't fail registration for this
      }
    } else if (accountType === 'client') {
      const { error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          full_name: registrationData.fullName,
          email: registrationData.email,
          account_id: accountData.id,
          user_id: authData.user.id,
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
      console.error('Error fetching client users:', clientUsersError)
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