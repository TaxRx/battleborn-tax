# AI Integration Guide for Tax Calculator

## Why Not Hard-code API Keys?

### Security Risks
1. **Public Exposure**: 
   - Code gets pushed to GitHub/version control
   - Visible in browser DevTools
   - Exposed in client-side JavaScript bundles
   - Anyone can view page source and steal the key

2. **Financial Risk**:
   - Stolen keys can be used to make API calls on your account
   - OpenAI charges per token/request
   - No way to track who's using your key

3. **No Access Control**:
   - Can't revoke access for specific users
   - Can't set usage limits per user
   - Can't track usage patterns

## Current Implementation

### Short-term Solution (Development Only)
```bash
# Create .env file
echo 'VITE_OPENAI_API_KEY=your_key_here' > .env

# Add to .gitignore
echo '.env' >> .gitignore
```

This works for development but is NOT suitable for production.

## Better Architecture Solutions

### 1. Backend API Proxy (Recommended)
Create a backend service that handles OpenAI requests:

```typescript
// Backend API endpoint
app.post('/api/ai/generate', authenticate, async (req, res) => {
  const { context, type } = req.body;
  
  // Validate user permissions
  if (!req.user.canUseAI) {
    return res.status(403).json({ error: 'AI access not permitted' });
  }
  
  // Track usage
  await trackUsage(req.user.id, type);
  
  // Make OpenAI call with server-side key
  const result = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: context }],
  });
  
  return res.json({ result: result.choices[0].message.content });
});
```

### 2. Supabase Edge Functions
Use Supabase Edge Functions to handle AI requests:

```typescript
// supabase/functions/generate-ai-content/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

serve(async (req) => {
  const { context, type } = await req.json()
  
  // Verify authentication
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY')
  )
  
  const { data: { user } } = await supabase.auth.getUser(
    req.headers.get('Authorization')?.replace('Bearer ', '')
  )
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Initialize OpenAI with server-side key
  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY')
  })
  
  // Generate content
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: context }],
  })
  
  return new Response(
    JSON.stringify({ result: response.choices[0].message.content }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### 3. Usage Tracking & Rate Limiting
Implement usage tracking in your database:

```sql
-- Create usage tracking table
CREATE TABLE ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  request_type TEXT,
  tokens_used INTEGER,
  cost_estimate DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_ai_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM ai_usage
  WHERE user_id = p_user_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  RETURN request_count < 100; -- 100 requests per hour
END;
$$ LANGUAGE plpgsql;
```

### 4. Frontend Implementation
Update the AI service to use the backend:

```typescript
// src/services/ai/aiService.ts
export class AIService {
  static async generateContent(
    type: 'hypothesis' | 'development' | 'sectionG',
    context: AIGenerationContext
  ): Promise<string> {
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ type, context })
      });
      
      if (!response.ok) {
        throw new Error('AI generation failed');
      }
      
      const { result } = await response.json();
      return result;
    } catch (error) {
      console.error('AI generation error:', error);
      return FALLBACK_CONTENT[type];
    }
  }
}
```

## Implementation Checklist

1. **Immediate Actions**:
   - [x] Move API key to environment variables
   - [x] Add fallback content for when AI is unavailable
   - [x] Implement error handling

2. **Before Production**:
   - [ ] Set up backend API proxy or Edge Functions
   - [ ] Implement authentication checks
   - [ ] Add usage tracking and rate limiting
   - [ ] Set up monitoring and alerts
   - [ ] Create usage dashboard for admins

3. **Security Measures**:
   - [ ] Rotate API keys regularly
   - [ ] Use separate keys for dev/staging/production
   - [ ] Implement IP whitelisting if possible
   - [ ] Add request signing/validation
   - [ ] Monitor for unusual usage patterns

## Cost Management

### Strategies to Reduce OpenAI Costs:
1. **Caching**: Store generated content and reuse when possible
2. **Batch Processing**: Group similar requests
3. **Model Selection**: Use GPT-3.5 for simpler tasks
4. **Token Limits**: Set maximum token limits per request
5. **User Tiers**: Different limits for different subscription levels

### Example Caching Implementation:
```typescript
// Cache AI responses in database
const cached = await supabase
  .from('ai_cache')
  .select('response')
  .eq('context_hash', hashContext(context))
  .single();

if (cached?.data) {
  return cached.data.response;
}

// Generate new response and cache it
const response = await generateAIContent(context);
await supabase
  .from('ai_cache')
  .insert({
    context_hash: hashContext(context),
    response,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
```

## Monitoring & Debugging

### Add logging for AI requests:
```typescript
// Log all AI requests
await supabase
  .from('ai_logs')
  .insert({
    user_id: user.id,
    request_type: type,
    context: JSON.stringify(context),
    response_length: response.length,
    duration_ms: Date.now() - startTime,
    error: error?.message
  });
```

## Alternative AI Solutions

Consider these alternatives to reduce dependency on OpenAI:
1. **Self-hosted Models**: Llama 2, Mistral, etc.
2. **Other Providers**: Anthropic Claude, Google PaLM
3. **Hybrid Approach**: Use simpler models for basic tasks
4. **Template System**: Pre-written templates with variable substitution

## Support & Resources

- [OpenAI Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist) 