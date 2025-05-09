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
          `default-src 'self' ${netlifyUrl} ${supabaseUrl} https://*.googleapis.com https://*.gstatic.com`,
          `connect-src 'self' ${netlifyUrl} ${supabaseUrl} wss://*.supabase.co https://*.googleapis.com https://maps.googleapis.com`,
          `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${netlifyUrl} https://*.googleapis.com https://maps.googleapis.com`,
          `style-src 'self' 'unsafe-inline' ${netlifyUrl} https://fonts.googleapis.com https://*.googleapis.com`,
          `img-src 'self' data: ${netlifyUrl} https://*.googleapis.com https://*.gstatic.com https://*.unsplash.com blob:`,
          `font-src 'self' data: ${netlifyUrl} https://fonts.gstatic.com`,
          `frame-src 'self' ${netlifyUrl} ${supabaseUrl} https://*.google.com`,
          `worker-src 'self' blob: ${netlifyUrl}`,
        ].join('; ')
      }
    },
    define: {
      'process.env': env
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              '@supabase/supabase-js',
              'zustand',
            ],
            ui: [
              '@headlessui/react',
              '@heroicons/react',
              'tailwindcss',
            ],
            utils: [
              'html2canvas',
              'jspdf',
            ],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
});
