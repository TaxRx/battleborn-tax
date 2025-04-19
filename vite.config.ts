import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get the Netlify URL from environment or use a default for local development
  const netlifyUrl = env.NETLIFY_URL || 'https://cozy-sprite-1c6fec.netlify.app';
  const supabaseUrl = new URL(env.VITE_SUPABASE_URL || '').origin;
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization, X-Client-Info, X-Client-Site',
        'Content-Security-Policy': [
          `default-src 'self' ${netlifyUrl} ${supabaseUrl}`,
          `connect-src 'self' ${netlifyUrl} ${supabaseUrl} wss://*.supabase.co https://maps.googleapis.com`,
          `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${netlifyUrl} https://maps.googleapis.com`,
          `style-src 'self' 'unsafe-inline' ${netlifyUrl}`,
          `img-src 'self' data: ${netlifyUrl} https://*.googleapis.com https://*.gstatic.com`,
          `font-src 'self' data: ${netlifyUrl}`,
          `frame-src 'self' ${netlifyUrl} ${supabaseUrl}`,
          `worker-src 'self' blob: ${netlifyUrl}`,
        ].join('; ')
      }
    },
    define: {
      'process.env': env
    }
  }
});
