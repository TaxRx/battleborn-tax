import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Supabase client for JWT verification
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Authentication middleware
async function verifyAuth(req: Request): Promise<{ user: any; error?: string }> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: 'Invalid token or user not found' }
    }

    return { user }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

// OpenAI API integration
async function makeOpenAIRequest(prompt: string, systemPrompt?: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const defaultSystemPrompt = 'You are a healthcare industry expert specializing in clinical practice guidelines and R&D tax credit compliance. Provide detailed, professional responses with proper formatting using markdown. Focus on practical implementation steps that integrate specific staff roles and responsibilities. Include detailed workflows, timelines, and measurable outcomes for each step.'

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt || defaultSystemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.')
    }
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'Unable to generate content at this time.'
}

// Handle generate content requests
async function handleGenerateContent(req: Request): Promise<Response> {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: authError || 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { prompt, systemPrompt } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🤖 [AI Service] Generating content for user:', user.email)
    
    const content = await makeOpenAIRequest(prompt, systemPrompt)
    
    console.log('✅ [AI Service] Content generated successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      content 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ [AI Service] Generate content error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Handle subcomponent best practices generation
async function handleGenerateSubcomponentBestPractices(req: Request): Promise<Response> {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: authError || 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { subcomponentName, description, availableRoles = [] } = await req.json()

    if (!subcomponentName || !description) {
      return new Response(JSON.stringify({ error: 'Subcomponent name and description are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const roleNames = availableRoles && availableRoles.length > 0 
      ? availableRoles.map((role: any) => role.name).join(', ')
      : 'Medical Staff, Administrative Staff, Research Coordinators'
    
    const prompt = `Generate comprehensive clinical practice guidelines for implementing "${subcomponentName}" in a healthcare setting for R&D tax credit documentation purposes.

Subcomponent Description: ${description}

Available Staff Roles: ${roleNames}

Please provide detailed implementation guidelines that include:

1. **Pre-Implementation Planning** (### Planning Phase)
   - Risk assessment and mitigation strategies
   - Resource allocation requirements
   - Timeline development (specific weeks/months)
   - Role-specific training requirements
   - Measurable success criteria

2. **Implementation Steps** (### Step 1, ### Step 2, etc.)
   - Detailed 5-7 implementation steps with specific actions
   - For each step, specify:
     * Primary responsible roles from the available list
     * Supporting roles and their specific contributions
     * Time allocation estimates (hours/week per role)
     * Documentation requirements for R&D compliance
     * Quality control checkpoints
     * Risk factors and mitigation steps

3. **Monitoring & Documentation** (### Monitoring Phase)
   - Key performance indicators (KPIs)
   - Documentation protocols for R&D substantiation
   - Regular review schedules
   - Compliance verification methods

4. **Optimization & Continuous Improvement** (### Optimization Phase)
   - Performance review criteria
   - Feedback collection methods
   - Process refinement protocols
   - Staff development opportunities

Format requirements:
- Use markdown headings (### for main sections)
- Include specific role assignments with time commitments
- Add implementation timelines
- Focus on measurable, documentable activities
- Ensure all roles from the available list are meaningfully integrated
- Include R&D tax credit compliance considerations`

    console.log('🤖 [AI Service] Generating subcomponent best practices for user:', user.email)
    
    const content = await makeOpenAIRequest(prompt)
    
    // Format content
    let formatted = content.trim()
    formatted = formatted.replace(/^([^#\n]+)$/gm, (match, line) => {
      if (line.includes('Step ') && !line.startsWith('#')) {
        return `### ${line}`
      }
      return match
    })
    
    console.log('✅ [AI Service] Subcomponent best practices generated successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      content: formatted 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ [AI Service] Generate subcomponent best practices error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Handle Line 49f description generation
async function handleGenerateLine49fDescription(req: Request): Promise<Response> {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: authError || 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { research_activity_name, subcomponent_count, subcomponent_groups, industry } = await req.json()

    if (!research_activity_name) {
      return new Response(JSON.stringify({ error: 'Research activity name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const prompt = `Generate a professional Line 49(f) description for Form 6765 Section G Business Component Information. 

Context:
- Research Activity: ${research_activity_name}
- Number of Subcomponents: ${subcomponent_count || 'Not specified'}
- Subcomponent Types: ${subcomponent_groups || 'Not specified'}
- Industry: ${industry || 'Not specified'}

Requirements:
- Professional tone suitable for IRS filing
- Describe the systematic experimentation and research methodology
- Explain how the research resolves technical uncertainty
- Include specific mention of the subcomponents evaluated
- Keep to 2-3 sentences maximum
- Focus on the research process and technical development

Generate a concise, professional description that demonstrates qualified research activities under IRC Section 41.`

    console.log('🤖 [AI Service] Generating Line 49f description for user:', user.email)
    
    const content = await makeOpenAIRequest(prompt)
    
    console.log('✅ [AI Service] Line 49f description generated successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      content 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ [AI Service] Generate Line 49f description error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

serve(async (req) => {
  const { url, method } = req

  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname

    console.log(`🚀 [AI Service] ${method} ${path}`)

    // Route requests
    if (method === 'POST') {
      switch (path) {
        case '/ai-service/generate-content':
          return await handleGenerateContent(req)
        
        case '/ai-service/generate-subcomponent-best-practices':
          return await handleGenerateSubcomponentBestPractices(req)
        
        case '/ai-service/generate-line49f-description':
          return await handleGenerateLine49fDescription(req)
        
        default:
          return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ [AI Service] Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})