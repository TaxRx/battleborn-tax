// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// console.log("Hello from Functions!")

// Deno.serve(async (req) => {
//   const { name } = await req.json()
//   const data = {
//     message: `Hello ${name}!`,
//   }

//   return new Response(
//     JSON.stringify(data),
//     { headers: { "Content-Type": "application/json" } },
//   )
// })
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-client-site, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface PersonalInfo {
  firstName: string
  lastName: string
  homeAddress: string
  city: string
  state: string
  zipCode: string
  phone: string
  dateOfBirth: string
  ssn: string
  filingStatus: string
  dependents: number
  standardDeduction: number
  customDeduction: number
}

interface BusinessInfo {
  businessName: string
  entityType: string
  taxId: string
  businessAddress: string
  businessCity: string
  businessState: string
  businessZip: string
  businessPhone: string
  businessEmail: string
  businessDescription: string
  businessWebsite: string
  yearEstablished: number
  numberOfEmployees: number
  annualRevenue: number
  businessStructure: string
  primaryIndustry: string
  businessActivities: string[]
}

interface ClientRegistrationRequest {
  email: string
  password: string
  fullName: string
  personalInfo: PersonalInfo
  businessInfo: BusinessInfo
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

  // Required main fields
  if (!data.email?.trim()) errors.push('Email is required')
  if (!data.password?.trim()) errors.push('Password is required')
  if (!data.fullName?.trim()) errors.push('Full name is required')

  // Required personal info fields
  if (!data.personalInfo?.firstName?.trim()) errors.push('First name is required')
  if (!data.personalInfo?.lastName?.trim()) errors.push('Last name is required')
  if (!data.personalInfo?.homeAddress?.trim()) errors.push('Home address is required')
  if (!data.personalInfo?.city?.trim()) errors.push('City is required')
  if (!data.personalInfo?.state?.trim()) errors.push('State is required')
  if (!data.personalInfo?.zipCode?.trim()) errors.push('Zip code is required')
  if (!data.personalInfo?.phone?.trim()) errors.push('Phone is required')
  if (!data.personalInfo?.dateOfBirth?.trim()) errors.push('Date of birth is required')
  if (!data.personalInfo?.ssn?.trim()) errors.push('SSN is required')
  if (!data.personalInfo?.filingStatus?.trim()) errors.push('Filing status is required')

  // Required business info fields
  if (!data.businessInfo?.businessName?.trim()) errors.push('Business name is required')
  if (!data.businessInfo?.entityType?.trim()) errors.push('Entity type is required')
  if (!data.businessInfo?.taxId?.trim()) errors.push('Tax ID is required')
  if (!data.businessInfo?.businessAddress?.trim()) errors.push('Business address is required')
  if (!data.businessInfo?.businessCity?.trim()) errors.push('Business city is required')
  if (!data.businessInfo?.businessState?.trim()) errors.push('Business state is required')
  if (!data.businessInfo?.businessZip?.trim()) errors.push('Business zip is required')
  if (!data.businessInfo?.businessPhone?.trim()) errors.push('Business phone is required')
  if (!data.businessInfo?.businessEmail?.trim()) errors.push('Business email is required')

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid email format')
  }
  if (data.businessInfo?.businessEmail && !emailRegex.test(data.businessInfo.businessEmail)) {
    errors.push('Invalid business email format')
  }

  // Phone validation (basic US format)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  if (data.personalInfo?.phone && !phoneRegex.test(data.personalInfo.phone.replace(/\D/g, ''))) {
    errors.push('Invalid phone format')
  }
  if (data.businessInfo?.businessPhone && !phoneRegex.test(data.businessInfo.businessPhone.replace(/\D/g, ''))) {
    errors.push('Invalid business phone format')
  }

  // Password strength validation
  if (data.password && data.password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Tax ID validation (basic EIN format: XX-XXXXXXX)
  const taxIdRegex = /^\d{2}-\d{7}$/
  if (data.businessInfo?.taxId && !taxIdRegex.test(data.businessInfo.taxId)) {
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
    // Check if business email already exists
    const { data: existingBusiness, error: businessError } = await supabaseClient
      .from('businesses')
      .select('id')
      .eq('business_email', data.businessInfo.businessEmail)
      .single()

    if (businessError && businessError.code !== 'PGRST116') {
      console.error('Error checking existing business:', businessError)
      errors.push('Error verifying business information')
      return { isValid: false, errors }
    }

    if (existingBusiness) {
      errors.push('Business email already registered')
    }

    // Check if EIN already exists
    const { data: existingEin, error: einError } = await supabaseClient
      .from('businesses')
      .select('id')
      .eq('ein', data.businessInfo.taxId)
      .single()

    if (einError && einError.code !== 'PGRST116') {
      console.error('Error checking existing EIN:', einError)
      errors.push('Error verifying EIN')
      return { isValid: false, errors }
    }

    if (existingEin) {
      errors.push('EIN already registered')
    }

    // Check if user email already exists
    const { data: existingUser, error: userError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking existing user:', userError)
      errors.push('Error verifying user information')
      return { isValid: false, errors }
    }

    if (existingUser) {
      errors.push('Email already registered')
    }

    // Validate invitation token if provided
    if (data.invitationToken) {
      const { data: invitation, error: invitationError } = await supabaseClient
        .from('invitations')
        .select('*')
        .eq('token', data.invitationToken)
        .eq('status', 'pending')
        .single()

      if (invitationError || !invitation) {
        errors.push('Invalid or expired invitation token')
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
      errors: ['Error verifying business information']
    }
  }
}

async function createClientRegistration(data: ClientRegistrationRequest, supabaseClient: any) {
  try {
    // Create auth user with email confirmation disabled initially
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false, // We'll send verification email separately
      user_metadata: {
        full_name: data.fullName,
        role: 'client'
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return { error: `Failed to create user account: ${authError.message}` }
    }

    const userId = authUser.user.id

    try {
      // Create profile record
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: userId,  // profiles.id should match auth.users.id
          email: data.email,
          full_name: data.fullName,
          role: 'client'
        })
        .select()
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Clean up auth user
        await supabaseClient.auth.admin.deleteUser(userId)
        return { error: `Failed to create profile: ${profileError.message}` }
      }

      // Create client record
      const { data: client, error: clientError } = await supabaseClient
        .from('clients')
        .insert({
          created_by: userId,
          full_name: data.fullName,
          email: data.email,
          phone: data.personalInfo.phone,
          home_address: data.personalInfo.homeAddress,
          city: data.personalInfo.city,
          state: data.personalInfo.state,
          zip_code: data.personalInfo.zipCode,
          filing_status: data.personalInfo.filingStatus,
          dependents: data.personalInfo.dependents,
          standard_deduction: data.personalInfo.standardDeduction > 0,
          custom_deduction: data.personalInfo.customDeduction
        })
        .select()
        .single()

      if (clientError) {
        console.error('Client creation error:', clientError)
        // Clean up auth user and profile
        await supabaseClient.auth.admin.deleteUser(userId)
        return { error: `Failed to create client record: ${clientError.message}` }
      }

      // Create business record
      const { data: business, error: businessError } = await supabaseClient
        .from('businesses')
        .insert({
          client_id: client.id,
          business_name: data.businessInfo.businessName,
          entity_type: data.businessInfo.entityType,
          ein: data.businessInfo.taxId,
          business_address: data.businessInfo.businessAddress,
          business_city: data.businessInfo.businessCity,
          business_state: data.businessInfo.businessState,
          business_zip: data.businessInfo.businessZip,
          business_phone: data.businessInfo.businessPhone,
          business_email: data.businessInfo.businessEmail,
          industry: data.businessInfo.primaryIndustry,
          year_established: data.businessInfo.yearEstablished,
          employee_count: data.businessInfo.numberOfEmployees,
          annual_revenue: data.businessInfo.annualRevenue
        })
        .select()
        .single()

      if (businessError) {
        console.error('Business creation error:', businessError)
        // Clean up auth user and profile
        await supabaseClient.auth.admin.deleteUser(userId)
        return { error: `Failed to create business record: ${businessError.message}` }
      }

      // Generate email verification link
      const { data: verificationData, error: verificationError } = await supabaseClient.auth.admin.generateLink({
        type: 'signup',
        email: data.email,
        options: {
          redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5174'}/verify-email`
        }
      })

      if (verificationError) {
        console.error('Verification link generation error:', verificationError)
        // Don't fail the registration, just log the error
        console.log('Registration successful but verification email could not be sent')
      } else {
        console.log('Verification link generated:', verificationData.properties?.action_link)
        // In a real implementation, you would send this link via email
        // For now, we'll just log it for testing
      }

      return {
        success: true,
        clientId: client.id,
        userId: userId,
        verificationLink: verificationData?.properties?.action_link
      }

    } catch (error) {
      console.error('Registration cleanup error:', error)
      // Clean up auth user if anything fails
      await supabaseClient.auth.admin.deleteUser(userId)
      throw error
    }

  } catch (error) {
    console.error('Client registration error:', error)
    return { error: 'Failed to create client registration' }
  }
} 
/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/client-registration' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
