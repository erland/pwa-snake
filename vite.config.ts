// vite.config.ts
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const isCI = process.env.GITHUB_ACTIONS === 'true'
const base = isCI ? '/pwa-game-snake/' : '/'

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
      },
      devOptions: { enabled: true },
      // Keep PWA scope aligned with base
      manifest: {
        name: 'Snake',
        short_name: 'Snake',
        description: 'Minimal Snake PWA built with TypeScript + Phaser + Vite',
        start_url: base,              // IMPORTANT for GH Pages
        scope: base,                  // IMPORTANT for SW scope
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
