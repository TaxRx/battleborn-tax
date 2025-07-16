# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys
3. Create a new key or use existing one
4. Copy it to `VITE_OPENAI_API_KEY`

## Important Notes

- **Never commit the `.env` file** to version control
- Add `.env` to your `.gitignore` file
- All environment variables must start with `VITE_` to be accessible in Vite
- Restart the dev server after changing environment variables

## Troubleshooting

### "Missing Supabase environment variables" Error

If you see this error in the console:
```
Missing Supabase environment variables: {hasUrl: false, hasAnonKey: false}
```

1. Check that your `.env` file exists in the project root
2. Verify all required variables are set
3. Ensure there are no line breaks in the middle of keys
4. Restart the development server: `npm run dev`

### Multiple Supabase Client Instances Warning

If you see:
```
Multiple GoTrueClient instances detected in the same browser context
```

This is a warning (not an error) that occurs when multiple parts of the app initialize Supabase. It's safe to ignore, but we've implemented a singleton pattern to minimize this.

## Example .env File

```bash
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxxxxxxxx
```

Make sure each key is on a single line without breaks! 