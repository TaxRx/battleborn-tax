import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClientRegistrationRequest {
  businessName: string
  businessEmail: string
  businessPhone: string
  businessAddress: string
  taxId: string
  businessType: string
  ownerFirstName: string
  ownerLastName: string
  ownerEmail: string
  ownerPhone: string
  password: string
  invitationToken?: string
  affiliateId?: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const registrationData: ClientRegistrationRequest = await req.json()

    // Validate required fields
    const validation = validateRegistrationData(registrationData)
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify business legitimacy
    const businessVerification = await verifyBusiness(registrationData, supabaseClient)
    if (!businessVerification.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Business verification failed', 
          details: businessVerification.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create the client registration
    const result = await createClientRegistration(registrationData, supabaseClient)
    
    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        clientId: result.clientId,
        userId: result.userId,
        message: 'Client registration successful. Please check your email for verification.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Client registration error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function validateRegistrationData(data: ClientRegistrationRequest): ValidationResult {
  const errors: string[] = []

  // Required business fields
  if (!data.businessName?.trim()) errors.push('Business name is required')
  if (!data.businessEmail?.trim()) errors.push('Business email is required')
  if (!data.businessPhone?.trim()) errors.push('Business phone is required')
  if (!data.businessAddress?.trim()) errors.push('Business address is required')
  if (!data.taxId?.trim()) errors.push('Tax ID is required')
  if (!data.businessType?.trim()) errors.push('Business type is required')

  // Required owner fields
  if (!data.ownerFirstName?.trim()) errors.push('Owner first name is required')
  if (!data.ownerLastName?.trim()) errors.push('Owner last name is required')
  if (!data.ownerEmail?.trim()) errors.push('Owner email is required')
  if (!data.ownerPhone?.trim()) errors.push('Owner phone is required')
  if (!data.password?.trim()) errors.push('Password is required')

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (data.businessEmail && !emailRegex.test(data.businessEmail)) {
    errors.push('Invalid business email format')
  }
  if (data.ownerEmail && !emailRegex.test(data.ownerEmail)) {
    errors.push('Invalid owner email format')
  }

  // Phone validation (basic US format)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  if (data.businessPhone && !phoneRegex.test(data.businessPhone.replace(/\D/g, ''))) {
    errors.push('Invalid business phone format')
  }
  if (data.ownerPhone && !phoneRegex.test(data.ownerPhone.replace(/\D/g, ''))) {
    errors.push('Invalid owner phone format')
  }

  // Password strength validation
  if (data.password && data.password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Tax ID validation (basic EIN format: XX-XXXXXXX)
  const taxIdRegex = /^\d{2}-\d{7}$/
  if (data.taxId && !taxIdRegex.test(data.taxId)) {
    errors.push('Tax ID must be in format XX-XXXXXXX (EIN)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

async function verifyBusiness(data: ClientRegistrationRequest, supabaseClient: any): Promise<ValidationResult> {
  const errors: string[] = []

  try {
    // Check if business with same Tax ID already exists
    const { data: existingClient, error: checkError } = await supabaseClient
      .from('clients')
      .select('id, business_name')
      .eq('tax_id', data.taxId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing client:', checkError)
      errors.push('Unable to verify business registration')
      return { isValid: false, errors }
    }

    if (existingClient) {
      errors.push(`Business with Tax ID ${data.taxId} is already registered`)
    }

    // Check if business email is already in use
    const { data: existingEmail, error: emailError } = await supabaseClient
      .from('clients')
      .select('id, business_name')
      .eq('business_email', data.businessEmail)
      .single()

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Error checking existing email:', emailError)
      errors.push('Unable to verify business email')
      return { isValid: false, errors }
    }

    if (existingEmail) {
      errors.push(`Business email ${data.businessEmail} is already registered`)
    }

    // If invitation token is provided, verify it
    if (data.invitationToken) {
      const { data: invitation, error: inviteError } = await supabaseClient
        .from('client_invitations')
        .select('*')
        .eq('token', data.invitationToken)
        .eq('status', 'pending')
        .single()

      if (inviteError || !invitation) {
        errors.push('Invalid or expired invitation token')
      } else {
        // Check if invitation is not expired
        const expiresAt = new Date(invitation.expires_at)
        if (expiresAt < new Date()) {
          errors.push('Invitation token has expired')
        }
      }
    }

    // Verify affiliate exists if provided
    if (data.affiliateId) {
      const { data: affiliate, error: affiliateError } = await supabaseClient
        .from('profiles')
        .select('id, role')
        .eq('id', data.affiliateId)
        .eq('role', 'affiliate')
        .single()

      if (affiliateError || !affiliate) {
        errors.push('Invalid affiliate ID')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }

  } catch (error) {
    console.error('Business verification error:', error)
    return {
      isValid: false,
      errors: ['Business verification failed']
    }
  }
}

async function createClientRegistration(data: ClientRegistrationRequest, supabaseClient: any) {
  try {
    // Start a transaction-like operation
    let clientId: string
    let userId: string

    // 1. Create the client record
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .insert({
        business_name: data.businessName,
        business_email: data.businessEmail,
        business_phone: data.businessPhone,
        business_address: data.businessAddress,
        tax_id: data.taxId,
        business_type: data.businessType,
        affiliate_id: data.affiliateId || null,
        status: 'pending_verification',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (clientError) {
      console.error('Error creating client:', clientError)
      return { error: 'Failed to create client record' }
    }

    clientId = client.id

    // 2. Create the user account in Supabase Auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: data.ownerEmail,
      password: data.password,
      email_confirm: false, // We'll handle email verification separately
      user_metadata: {
        first_name: data.ownerFirstName,
        last_name: data.ownerLastName,
        phone: data.ownerPhone,
        role: 'client_owner'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      // Cleanup: remove the client record
      await supabaseClient.from('clients').delete().eq('id', clientId)
      return { error: 'Failed to create user account' }
    }

    userId = authUser.user.id

    // 3. Create the profile record
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: userId,
        first_name: data.ownerFirstName,
        last_name: data.ownerLastName,
        email: data.ownerEmail,
        phone: data.ownerPhone,
        role: 'client_owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Cleanup: remove auth user and client
      await supabaseClient.auth.admin.deleteUser(userId)
      await supabaseClient.from('clients').delete().eq('id', clientId)
      return { error: 'Failed to create user profile' }
    }

    // 4. Create the client_users junction record
    const { error: junctionError } = await supabaseClient
      .from('client_users')
      .insert({
        client_id: clientId,
        user_id: userId,
        role: 'owner',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (junctionError) {
      console.error('Error creating client_users junction:', junctionError)
      // Cleanup: remove all created records
      await supabaseClient.from('profiles').delete().eq('id', userId)
      await supabaseClient.auth.admin.deleteUser(userId)
      await supabaseClient.from('clients').delete().eq('id', clientId)
      return { error: 'Failed to create client-user relationship' }
    }

    // 5. Mark invitation as used if provided
    if (data.invitationToken) {
      await supabaseClient
        .from('client_invitations')
        .update({ 
          status: 'used', 
          used_at: new Date().toISOString(),
          used_by: userId 
        })
        .eq('token', data.invitationToken)
    }

    // 6. Send verification email (this would typically be handled by Supabase Auth)
    // For now, we'll just log that verification is needed
    console.log(`Verification email needed for user ${userId} at ${data.ownerEmail}`)

    return {
      clientId,
      userId,
      error: null
    }

  } catch (error) {
    console.error('Client registration transaction error:', error)
    return { error: 'Registration failed due to unexpected error' }
  }
} 