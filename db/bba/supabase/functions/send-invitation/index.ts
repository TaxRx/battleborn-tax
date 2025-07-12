import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-client-site, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface InvitationRequest {
  clientId: string
  email: string
  role: 'owner' | 'member' | 'viewer' | 'accountant'
  message?: string
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

    const invitationData: InvitationRequest = await req.json()

    // Get the current user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate the invitation data
    const validation = validateInvitationData(invitationData)
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user has permission to invite for this client
    const hasPermission = await checkInvitationPermission(
      supabaseClient, 
      user.id, 
      invitationData.clientId
    )

    if (!hasPermission.isValid) {
      return new Response(
        JSON.stringify({ error: 'Permission denied', details: hasPermission.errors }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if invitation already exists
    const existingInvitation = await checkExistingInvitation(
      supabaseClient,
      invitationData.clientId,
      invitationData.email
    )

    if (existingInvitation.exists) {
      return new Response(
        JSON.stringify({ 
          error: 'Invitation already exists', 
          details: existingInvitation.message 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create the invitation
    const result = await createInvitation(supabaseClient, user.id, invitationData)
    
    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send the invitation email (in development, this will be logged)
    const emailResult = await sendInvitationEmail(
      supabaseClient,
      result.invitation,
      result.client,
      result.inviter
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: result.invitation.id,
        message: 'Invitation sent successfully',
        emailSent: emailResult.success,
        invitationLink: emailResult.invitationLink
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Send invitation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function validateInvitationData(data: InvitationRequest): ValidationResult {
  const errors: string[] = []

  if (!data.clientId?.trim()) {
    errors.push('Client ID is required')
  }

  if (!data.email?.trim()) {
    errors.push('Email is required')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format')
    }
  }

  if (!data.role?.trim()) {
    errors.push('Role is required')
  } else {
    const validRoles = ['owner', 'member', 'viewer', 'accountant']
    if (!validRoles.includes(data.role)) {
      errors.push('Invalid role. Must be one of: ' + validRoles.join(', '))
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

async function checkInvitationPermission(
  supabaseClient: any, 
  userId: string, 
  clientId: string
): Promise<ValidationResult> {
  try {
    // Check if user is the owner of the client
    const { data: clientUser, error } = await supabaseClient
      .from('client_users')
      .select('role')
      .eq('client_id', clientId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking client permission:', error)
      return {
        isValid: false,
        errors: ['Error checking permissions']
      }
    }

    if (!clientUser || clientUser.role !== 'owner') {
      return {
        isValid: false,
        errors: ['Only client owners can send invitations']
      }
    }

    return {
      isValid: true,
      errors: []
    }

  } catch (error) {
    console.error('Permission check error:', error)
    return {
      isValid: false,
      errors: ['Error checking permissions']
    }
  }
}

async function checkExistingInvitation(
  supabaseClient: any,
  clientId: string,
  email: string
): Promise<{ exists: boolean; message?: string }> {
  try {
    // Check for pending invitations
    const { data: pendingInvitation, error: pendingError } = await supabaseClient
      .from('invitations')
      .select('id, expires_at')
      .eq('client_id', clientId)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (pendingError && pendingError.code !== 'PGRST116') {
      console.error('Error checking pending invitations:', pendingError)
      return { exists: false }
    }

    if (pendingInvitation) {
      const expiresAt = new Date(pendingInvitation.expires_at)
      const now = new Date()
      
      if (expiresAt > now) {
        return { 
          exists: true, 
          message: 'A pending invitation already exists for this email' 
        }
      }
    }

    // Check if user is already a member
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError)
      return { exists: false }
    }

    if (profile) {
      const { data: existingMember, error: memberError } = await supabaseClient
        .from('client_users')
        .select('id')
        .eq('client_id', clientId)
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .single()

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error checking existing member:', memberError)
        return { exists: false }
      }

      if (existingMember) {
        return { 
          exists: true, 
          message: 'User is already a member of this client' 
        }
      }
    }

    return { exists: false }

  } catch (error) {
    console.error('Error checking existing invitation:', error)
    return { exists: false }
  }
}

async function createInvitation(
  supabaseClient: any,
  inviterId: string,
  invitationData: InvitationRequest
) {
  try {
    // Get inviter profile
    const { data: inviterProfile, error: inviterError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', inviterId)
      .single()

    if (inviterError) {
      console.error('Error fetching inviter profile:', inviterError)
      return { error: 'Error fetching inviter information' }
    }

    // Get client information
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id, full_name, email')
      .eq('id', invitationData.clientId)
      .single()

    if (clientError) {
      console.error('Error fetching client:', clientError)
      return { error: 'Error fetching client information' }
    }

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitations')
      .insert({
        client_id: invitationData.clientId,
        invited_by: inviterId,
        email: invitationData.email,
        role: invitationData.role,
        message: invitationData.message
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return { error: 'Error creating invitation' }
    }

    return {
      invitation,
      client,
      inviter: inviterProfile
    }

  } catch (error) {
    console.error('Create invitation error:', error)
    return { error: 'Error creating invitation' }
  }
}

async function sendInvitationEmail(
  supabaseClient: any,
  invitation: any,
  client: any,
  inviter: any
): Promise<{ success: boolean; invitationLink?: string }> {
  try {
    // In development, we'll generate the invitation link and log it
    // In production, this would integrate with an email service
    
    const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:5174'
    const invitationLink = `${baseUrl}/accept-invitation?token=${invitation.token}`
    
    // Generate email template
    const emailContent = generateInvitationEmailTemplate(
      invitation,
      client,
      inviter,
      invitationLink
    )

    // Log the invitation details for development
    console.log('=== INVITATION EMAIL ===')
    console.log(`To: ${invitation.email}`)
    console.log(`Subject: ${emailContent.subject}`)
    console.log(`Invitation Link: ${invitationLink}`)
    console.log(`Email Body:`)
    console.log(emailContent.body)
    console.log('========================')

    // In production, you would send the actual email here
    // For now, we'll just return success with the link
    
    return {
      success: true,
      invitationLink
    }

  } catch (error) {
    console.error('Send email error:', error)
    return { success: false }
  }
}

function generateInvitationEmailTemplate(
  invitation: any,
  client: any,
  inviter: any,
  invitationLink: string
) {
  const subject = `You've been invited to join ${client.full_name}'s account`
  
  const body = `
Hello,

${inviter.full_name} has invited you to join their client account "${client.full_name}" as a ${invitation.role}.

${invitation.message ? `Personal message: "${invitation.message}"` : ''}

To accept this invitation, click the link below:
${invitationLink}

This invitation will expire in 48 hours.

If you don't have an account yet, you'll be able to create one when you accept the invitation.

Best regards,
The BattleBorn Tax Team
  `.trim()

  return { subject, body }
}
