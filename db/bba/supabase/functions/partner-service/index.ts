
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers to allow requests from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to get the user's profile and partner_id
const getUserProfile = async (supabaseClient) => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('partner_id, access_level, role')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data;
}

serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user's profile and verify they belong to a partner organization
    const userProfile = await getUserProfile(supabaseClient);
    if (!userProfile || !userProfile.partner_id) {
      return new Response(JSON.stringify({ error: 'Forbidden: User is not part of a partner organization' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }
    const { partner_id } = userProfile;

    const url = new URL(req.url)
    const { pathname } = url

    // Routing logic for partner-specific actions
    if (pathname === '/partner-service/dashboard') {
      // TODO: Implement logic to fetch dashboard data for the partner
      // This would involve aggregating client counts, recent activity, etc.
      return new Response(JSON.stringify({ message: `Dashboard data for partner ${partner_id}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/partner-service/list-clients') {
      // TODO: Implement logic to list clients for the partner
      // 1. Query public.clients where partner_id matches the user's partner_id
      const { data, error } = await supabaseClient.from('clients').select('*').eq('partner_id', partner_id)
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/partner-service/create-client') {
      // The user's partner_id is automatically used, ensuring they can only create clients for their own organization.
      const clientData = await req.json()

      const { data, error } = await supabaseClient
        .from('clients')
        .insert({ ...clientData, partner_id: partner_id })
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      return new Response(JSON.stringify({ message: "Client created successfully", client: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/partner-service/list-affiliates') {
      // TODO: Implement logic to list affiliates for the partner
      // 1. Query public.profiles where partner_id matches and access_level is 'affiliate'
      const { data, error } = await supabaseClient.from('profiles').select('*').eq('partner_id', partner_id).eq('access_level', 'affiliate')
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/partner-service/create-affiliate') {
      // TODO: Implement affiliate creation logic
      // 1. Check if the current user has permission to create affiliates (e.g., role is 'partner_admin')
      // 2. Get affiliate data from request body
      // 3. Send an invitation to the affiliate's email via the user-service
      const body = await req.json()
      // ... implementation needed
      return new Response(JSON.stringify({ message: "Affiliate invited successfully" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/partner-service/update-affiliate-permissions') {
      // TODO: Implement logic to update affiliate's tool permissions
      // 1. Check if the current user has permission to update affiliates
      // 2. Get affiliate_id and tool permissions from request body
      // 3. Upsert records into the public.affiliate_tool_permissions table
      const body = await req.json()
      // ... implementation needed
      return new Response(JSON.stringify({ message: "Affiliate permissions updated" }), {
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
