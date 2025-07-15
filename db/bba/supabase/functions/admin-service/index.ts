
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers to allow requests from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to check for admin privileges
const isAdmin = async (supabaseClient) => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('access_level')
    .eq('id', user.id)
    .single();

  if (error || !data) return false;

  return data.access_level === 'platform';
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

    // Check if the user is a platform admin before proceeding
    const isPlatformAdmin = await isAdmin(supabaseClient);
    if (!isPlatformAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Not an admin' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Get the request body to check for pathname
    const body = await req.json();
    const pathname = body.pathname || new URL(req.url).pathname;

    // Routing logic for admin-specific actions
    if (pathname === '/admin-service/create-partner') {
      const { companyName, contactEmail, logoUrl } = body

      // 1. Create a Stripe Customer object
      const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') ?? '', { apiVersion: '2023-10-16' })
      const stripeCustomer = await stripe.customers.create({
        name: companyName,
        email: contactEmail,
      })

      // 2. Create a new record in the public.partners table
      const { data: partner, error: partnerError } = await supabaseClient
        .from('partners')
        .insert({
          company_name: companyName,
          logo_url: logoUrl,
          primary_contact_email: contactEmail,
          stripe_customer_id: stripeCustomer.id,
        })
        .select()
        .single()

      if (partnerError) {
        // If this fails, we should ideally delete the Stripe customer to avoid orphans
        await stripe.customers.del(stripeCustomer.id)
        return new Response(JSON.stringify({ error: partnerError.message }), { status: 500 })
      }

      // 3. Send an invitation to the primary contact email
      // This calls our other Edge Function to handle the invitation logic
      const inviteResponse = await supabaseClient.functions.invoke('user-service', {
        body: {
          pathname: '/user-service/send-invitation',
          inviterId: user.id, // The admin is the inviter
          inviteeEmail: contactEmail,
          role: 'partner_admin', // Assigning the primary contact as a partner admin
          partnerId: partner.id,
        },
      })

      if (inviteResponse.error) {
        // If invite fails, clean up partner and stripe customer
        await supabaseClient.from('partners').delete().eq('id', partner.id)
        await stripe.customers.del(stripeCustomer.id)
        return new Response(JSON.stringify({ error: `Failed to send invitation: ${inviteResponse.error.message}` }), { status: 500 })
      }

      return new Response(JSON.stringify({ message: "Partner created and invitation sent successfully", partner }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/admin-service/list-partners') {
      // TODO: Implement logic to list all partners
      // 1. Query the public.partners table
      const { data, error } = await supabaseClient.from('partners').select('*')
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/admin-service/update-partner-status') {
      // TODO: Implement logic to update a partner's status
      // 1. Get partner_id and new status from request body
      // 2. Update the record in the public.partners table
      // ... implementation needed
      return new Response(JSON.stringify({ message: "Partner status updated" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/admin-service/update-partner-subscriptions') {
      // TODO: Implement logic to update a partner's tool subscriptions
      // 1. Get partner_id and a list of tool subscriptions from request body
      // 2. Upsert records into the public.partner_tool_subscriptions table
      // ... implementation needed
      return new Response(JSON.stringify({ message: "Partner subscriptions updated" }), {
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
