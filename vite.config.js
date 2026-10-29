import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cmsSnapshotPlugin } from './scripts/cms-snapshot-plugin.mjs';
import { seoPrerenderPlugin } from './scripts/seo-prerender-plugin.mjs';

export default defineConfig({
  plugins: [react(), cmsSnapshotPlugin(), seoPrerenderPlugin()],
  server: {
    port: 5174,
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
});
