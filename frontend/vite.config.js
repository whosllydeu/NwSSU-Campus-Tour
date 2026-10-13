import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const DAY = 60 * 60 * 24

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Keep your existing manifest (public/manifest.json + <link> in index.html).
      // Offline caching below works with or without it.
      manifest: false,
      workbox: {
        // The app itself — saved on the first visit so it opens offline.
        // (Big photos/panoramas are NOT pre-saved; they're saved when viewed.)
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2,json,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Supabase data (buildings, departments): try online first,
          // fall back to the last saved copy when offline.
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/rest/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-data',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Photos / panoramas uploaded through the Admin Dashboard.
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // OpenStreetMap tiles — saved as the user looks at the map.
          {
            urlPattern: ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 1500, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // App images (building photos, 360° panoramas, team photos).
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' && url.origin === self.location.origin,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * DAY },
            },
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: true, // allows access via the Cloudflare tunnel URL
  },
})