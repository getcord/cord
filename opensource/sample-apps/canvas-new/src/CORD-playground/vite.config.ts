import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { index: resolve(__dirname, 'index.tsx') },
      output: {
        assetFileNames: '[name][extname]',
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js',
      },
    },
  },
  define: {
    'process.env.API_SERVER_HOST': JSON.stringify(process.env.API_SERVER_HOST),
    'process.env.APP_SERVER_HOST': JSON.stringify(process.env.APP_SERVER_HOST),
  },
});
