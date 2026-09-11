import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:5000';
  const apiTarget = apiUrl.replace(/\/api\/?$/, '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: parseInt(env.PORT || process.env.PORT, 10) || 5173,
      strictPort: false,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

