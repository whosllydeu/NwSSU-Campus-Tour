import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Distinct port so this can run alongside the user-dashboard dev
  // server (which defaults to 5173) at the same time.
  server: { port: 5174 },
  preview: { port: 4174 },
  // Set base to './' so the build works when opened from a subfolder
  // (e.g. GitHub Pages or a campus intranet path). Change to '/' for root hosting.
  base: './',
});
