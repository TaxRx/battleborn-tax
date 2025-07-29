// vite.config.ts
import { defineConfig } from "file:///Users/ben/Downloads/project%202/node_modules/vite/dist/node/index.js";
import react from "file:///Users/ben/Downloads/project%202/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/Users/ben/Downloads/project 2";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  server: {
    port: 5174,
    strictPort: true,
    host: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
      // Temporarily disabled CSP for development
      // 'Content-Security-Policy': [
      //   `default-src 'self'`,
      //   `connect-src 'self' http://localhost:* https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://maps.googleapis.com https://fonts.gstatic.com https://api.openai.com`,
      //   `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.supabase.co`,
      //   `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      //   `img-src 'self' data: https://*.googleapis.com https://*.gstatic.com https://*.supabase.co blob:`,
      //   `font-src 'self' data: https://fonts.gstatic.com`,
      //   `frame-src 'self' https://*.google.com https://*.supabase.co`,
      //   `worker-src 'self' blob:`,
      // ].join('; ')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@supabase/supabase-js",
            "zustand"
          ],
          ui: [
            "@headlessui/react",
            "@heroicons/react",
            "tailwindcss"
          ],
          utils: [
            "html2canvas",
            "jspdf"
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1e3
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYmVuL0Rvd25sb2Fkcy9wcm9qZWN0IDJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9iZW4vRG93bmxvYWRzL3Byb2plY3QgMi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYmVuL0Rvd25sb2Fkcy9wcm9qZWN0JTIwMi92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3NCxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcbiAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ0dFVCwgUE9TVCwgUFVULCBERUxFVEUsIFBBVENILCBPUFRJT05TJyxcbiAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ1gtUmVxdWVzdGVkLVdpdGgsIGNvbnRlbnQtdHlwZSwgQXV0aG9yaXphdGlvbicsXG4gICAgICAvLyBUZW1wb3JhcmlseSBkaXNhYmxlZCBDU1AgZm9yIGRldmVsb3BtZW50XG4gICAgICAvLyAnQ29udGVudC1TZWN1cml0eS1Qb2xpY3knOiBbXG4gICAgICAvLyAgIGBkZWZhdWx0LXNyYyAnc2VsZidgLFxuICAgICAgLy8gICBgY29ubmVjdC1zcmMgJ3NlbGYnIGh0dHA6Ly9sb2NhbGhvc3Q6KiBodHRwczovLyouc3VwYWJhc2UuY28gd3NzOi8vKi5zdXBhYmFzZS5jbyBodHRwczovLyouZ29vZ2xlYXBpcy5jb20gaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tIGh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb20gaHR0cHM6Ly9hcGkub3BlbmFpLmNvbWAsXG4gICAgICAvLyAgIGBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJyBodHRwczovLyouZ29vZ2xlYXBpcy5jb20gaHR0cHM6Ly8qLnN1cGFiYXNlLmNvYCxcbiAgICAgIC8vICAgYHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnIGh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb21gLFxuICAgICAgLy8gICBgaW1nLXNyYyAnc2VsZicgZGF0YTogaHR0cHM6Ly8qLmdvb2dsZWFwaXMuY29tIGh0dHBzOi8vKi5nc3RhdGljLmNvbSBodHRwczovLyouc3VwYWJhc2UuY28gYmxvYjpgLFxuICAgICAgLy8gICBgZm9udC1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb21gLFxuICAgICAgLy8gICBgZnJhbWUtc3JjICdzZWxmJyBodHRwczovLyouZ29vZ2xlLmNvbSBodHRwczovLyouc3VwYWJhc2UuY29gLFxuICAgICAgLy8gICBgd29ya2VyLXNyYyAnc2VsZicgYmxvYjpgLFxuICAgICAgLy8gXS5qb2luKCc7ICcpXG4gICAgfVxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFtcbiAgICAgICAgICAgICdyZWFjdCcsXG4gICAgICAgICAgICAncmVhY3QtZG9tJyxcbiAgICAgICAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICAgICAgICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnLFxuICAgICAgICAgICAgJ3p1c3RhbmQnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdWk6IFtcbiAgICAgICAgICAgICdAaGVhZGxlc3N1aS9yZWFjdCcsXG4gICAgICAgICAgICAnQGhlcm9pY29ucy9yZWFjdCcsXG4gICAgICAgICAgICAndGFpbHdpbmRjc3MnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdXRpbHM6IFtcbiAgICAgICAgICAgICdodG1sMmNhbnZhcycsXG4gICAgICAgICAgICAnanNwZGYnLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThRLFNBQVMsb0JBQW9CO0FBQzNTLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLCtCQUErQjtBQUFBLE1BQy9CLGdDQUFnQztBQUFBLE1BQ2hDLGdDQUFnQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVlsQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVE7QUFBQSxZQUNOO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLElBQUk7QUFBQSxZQUNGO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxPQUFPO0FBQUEsWUFDTDtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
