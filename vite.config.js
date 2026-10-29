import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cmsSnapshotPlugin } from './scripts/cms-snapshot-plugin.mjs';

export default defineConfig({
  plugins: [react(), cmsSnapshotPlugin()],
  server: {
    port: 5174,
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
});
