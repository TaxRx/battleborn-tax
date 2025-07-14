
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

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
    .select('id, partner_id, access_level, role')
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

    const userProfile = await getUserProfile(supabaseClient);
    if (!userProfile) {
      return new Response(JSON.stringify({ error: 'Forbidden: User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const url = new URL(req.url)
    const { pathname } = url

    // Initialize Stripe client
    const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Routing logic for billing-specific actions
    if (pathname === '/billing-service/create-billable-transaction') {
      // This endpoint can be called by a partner after using a tool.
      // Security is implicit: the transaction will be logged for the user's own partner_id.
      if (!userProfile.partner_id) {
        return new Response(JSON.stringify({ error: 'Forbidden: User is not part of a partner organization' }), { status: 403 })
      }
      
      const { tool_id, client_id, amount } = await req.json()

      // Validate input
      if (!tool_id || !client_id || !amount) {
        return new Response(JSON.stringify({ error: 'Missing required fields: tool_id, client_id, amount' }), { status: 400 })
      }

      const { data, error } = await supabaseClient
        .from('transactions')
        .insert({
          partner_id: userProfile.partner_id,
          tool_id: tool_id,
          client_id: client_id,
          amount: amount,
          status: 'draft',
        })
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: `Failed to create transaction: ${error.message}` }), { status: 500 })
      }

      return new Response(JSON.stringify({ message: "Transaction created successfully", transaction: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/billing-service/list-invoices') {
      // This endpoint is for partners to view their own invoices.
      if (!userProfile.partner_id) {
        return new Response(JSON.stringify({ error: 'Forbidden: User is not part of a partner organization' }), { status: 403 })
      }

      // TODO: Implement logic to list invoices for the partner
      // 1. Query public.invoices where partner_id matches userProfile.partner_id
      const { data, error } = await supabaseClient.from('invoices').select('*').eq('partner_id', userProfile.partner_id)
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (pathname === '/billing-service/create-stripe-checkout') {
      // This endpoint is for partners to pay an invoice.
      if (!userProfile.partner_id) {
        return new Response(JSON.stringify({ error: 'Forbidden: User is not part of a partner organization' }), { status: 403 })
      }

      const { invoice_id } = await req.json();
      if (!invoice_id) {
        return new Response(JSON.stringify({ error: 'invoice_id is required' }), { status: 400 })
      }

      // 1. Fetch the invoice and the partner's stripe_customer_id
      const { data: invoice, error: invoiceError } = await supabaseClient
        .from('invoices')
        .select('*, partners(stripe_customer_id)')
        .eq('id', invoice_id)
        .eq('partner_id', userProfile.partner_id) // Security check
        .single();

      if (invoiceError || !invoice) {
        return new Response(JSON.stringify({ error: 'Invoice not found or access denied' }), { status: 404 })
      }

      // 2. Create a Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        customer: invoice.partners.stripe_customer_id,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Invoice #${invoice.id.substring(0, 8)}`,
              },
              unit_amount: Math.round(invoice.total_amount * 100), // Amount in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${Deno.env.get('SITE_URL')}/partner/billing?payment=success`,
        cancel_url: `${Deno.env.get('SITE_URL')}/partner/billing?payment=cancelled`,
        metadata: {
          invoice_id: invoice.id,
          partner_id: userProfile.partner_id,
        }
      });

      return new Response(JSON.stringify({ checkoutUrl: session.url }), {
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
