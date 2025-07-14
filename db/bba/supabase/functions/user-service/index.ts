import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers to allow requests from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // --- ROUTING --- //
    if (pathname === '/user-service/register') {
      return await handleRegistration(req, supabaseAdmin)
    } else if (pathname === '/user-service/send-invitation') {
      return await handleSendInvitation(req, supabaseAdmin)
    } else if (pathname === '/user-service/get-profile') {
      return await handleGetProfile(req, supabaseAdmin)
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

  // Create the user and all related records in a single transaction
  const { data, error } = await supabaseAdmin.rpc('create_user_with_profile_and_business', { 
      p_email: registrationData.email,
      p_password: registrationData.password,
      p_full_name: registrationData.fullName,
      p_personal_info: registrationData.personalInfo,
      p_business_info: registrationData.businessInfo
  })

  if (error) {
    return new Response(JSON.stringify({ error: `Registration failed: ${error.message}` }), { status: 400 })
  }

  return new Response(JSON.stringify({ success: true, data, message: 'Registration successful. Please check email for verification.' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

// --- Handler for Sending Invitations --- //
async function handleSendInvitation(req, supabaseAdmin) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { inviterId, inviteeEmail, role, partnerId, clientId } = await req.json()

  // TODO: Add permission check to ensure inviterId has authority to invite

  // Generate invitation token and record
  const { data: invitation, error } = await supabaseAdmin
    .from('invitations')
    .insert({ invited_by: inviterId, email: inviteeEmail, role, partner_id: partnerId, client_id: clientId })
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: `Failed to create invitation: ${error.message}` }), { status: 500 })
  }

  // TODO: Integrate with Resend to send a branded email
  console.log(`Sending invitation to ${inviteeEmail} with token ${invitation.token}`)

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

    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single()
    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
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