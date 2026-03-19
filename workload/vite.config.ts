import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import pkg from './package.json';

// Strips type="module" so the built index.html works when opened via file://
// apply: 'build' ensures this does NOT run in dev mode (which would break the dev server)
const fileProtocolPlugin = {
  name: 'file-protocol-compat',
  apply: 'build' as const,
  transformIndexHtml(html: string) {
    return html
      .replace(/ type="module"/g, ' defer')
      .replace(/ crossorigin/g, '')
      .replace('href="/vite.svg"', 'href="./vite.svg"');
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fileProtocolPlugin],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  base: './',
  resolve: {
    alias: {
      '@rn': resolve(__dirname, 'src'),
      '@rsh': resolve(__dirname, '../src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
      },
    },
  },
  server: {
    port: 5174,
  },
  test: {
    environment: 'node',
    alias: {
      '@rn/': resolve(__dirname, 'src') + '/',
      '@rsh/': resolve(__dirname, '../src') + '/',
    },
  },
});
