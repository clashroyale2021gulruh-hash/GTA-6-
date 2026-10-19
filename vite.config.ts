import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api/cryptobot': {
        target: 'https://pay.crypt.bot/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cryptobot/, ''),
        headers: {
          'Origin': 'https://pay.crypt.bot',
        }
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});
