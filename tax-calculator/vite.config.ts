import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
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
    port: 5174,
    strictPort: true,
    host: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      'Content-Security-Policy': [
        `default-src 'self'`,
        `connect-src 'self' http://localhost:* https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://maps.googleapis.com https://fonts.gstatic.com https://*.galileo.tax`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.supabase.co`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `img-src 'self' data: https://*.googleapis.com https://*.gstatic.com https://*.supabase.co blob:`,
        `font-src 'self' data: https://fonts.gstatic.com`,
        `frame-src 'self' https://*.google.com https://*.supabase.co`,
        `worker-src 'self' blob:`,
      ].join('; ')
    }
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
});
