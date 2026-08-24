import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set base to './' so the build works when opened from a subfolder
  // (e.g. GitHub Pages or a campus intranet path). Change to '/' for root hosting.
  base: './',
});
