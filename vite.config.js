import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
    //   '/sepay': 'http://localhost:3000',
        '/sepay': 'https://api.alowork.com',
},
  },
});
