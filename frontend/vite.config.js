import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy /api/* → http://localhost:5050/api/* so frontend never hardcodes the backend URL
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
    },
  },
});
