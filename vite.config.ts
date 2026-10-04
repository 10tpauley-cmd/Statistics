import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/katex')) return 'katex';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          if (id.includes('/src/content/')) return 'content';
          return undefined;
        },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
