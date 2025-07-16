
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers to allow requests from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to get the user's profile and account info
const getUserProfile = async (supabaseClient, supabaseServiceClient) => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;

  // Use service role client to bypass RLS for account lookup
  const { data, error } = await supabaseServiceClient
    .from('profiles')
    .select(`
      id,
      account_id,
      role,
      account:accounts!inner(type, name)
    `)
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

    // Create a service role client for privileged operations
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the user's profile and verify they belong to a platform account
    const userProfile = await getUserProfile(supabaseClient, supabaseServiceClient);
    if (!userProfile || !userProfile.account_id || userProfile.account?.type !== 'platform') {
      return new Response(JSON.stringify({ error: 'Forbidden: User is not part of a platform organization' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }
    const { account_id } = userProfile;

    const url = new URL(req.url)
    const { pathname } = url

    // Routing logic for partner-specific actions
    if (pathname === '/partner-service/dashboard') {
      // TODO: Implement logic to fetch dashboard data for the platform account
      // This would involve aggregating client counts, recent activity, etc.
      return new Response(JSON.stringify({ message: `Dashboard data for account ${account_id}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/partner-service/list-clients') {
      // List clients for the platform account
      // Query clients where account_id matches the user's account_id
      const { data, error } = await supabaseServiceClient
        .from('clients')
        .select(`
          *,
          account:accounts!inner(name)
        `)
        .eq('account_id', account_id)
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/partner-service/create-client') {
      // The user's account_id is automatically used, ensuring they can only create clients for their own organization.
      const clientData = await req.json()

      // First create a client account
      const { data: clientAccount, error: accountError } = await supabaseServiceClient
        .from('accounts')
        .insert({
          name: clientData.full_name || clientData.company_name,
          type: 'client'
        })
        .select()
        .single()

      if (accountError) {
        return new Response(JSON.stringify({ error: accountError.message }), { status: 500 })
      }

      // Then create the client record
      const { data, error } = await supabaseServiceClient
        .from('clients')
        .insert({ 
          ...clientData, 
          account_id: clientAccount.id,
          primary_affiliate_id: account_id  // Set platform as primary affiliate
        })
        .select()
        .single()

      if (error) {
        // Clean up the account if client creation fails
        await supabaseServiceClient.from('accounts').delete().eq('id', clientAccount.id)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      return new Response(JSON.stringify({ message: "Client created successfully", client: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/partner-service/list-affiliates') {
      // List affiliate accounts that this platform works with
      // Query accounts table for affiliate type accounts
      const { data, error } = await supabaseServiceClient
        .from('accounts')
        .select(`
          *,
          affiliates(*)
        `)
        .eq('type', 'affiliate')
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
      // Update affiliate's tool permissions in account_tool_access table
      const { affiliateAccountId, toolAccess } = await req.json()
      
      // Delete existing access records for this affiliate
      await supabaseServiceClient
        .from('account_tool_access')
        .delete()
        .eq('account_id', affiliateAccountId)
        .eq('affiliate_id', account_id)  // Only update records granted by this platform
      
      // Insert new access records
      if (toolAccess && toolAccess.length > 0) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const accessRecords = toolAccess.map(access => ({
          account_id: affiliateAccountId,
          tool_id: access.tool_id,
          access_level: access.access_level,
          affiliate_id: account_id,  // This platform is granting the access
          granted_by: user.id,
        }))
        
        const { error } = await supabaseServiceClient
          .from('account_tool_access')
          .insert(accessRecords)
          
        if (error) throw error;
      }
      
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
