import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Uses a separate public/manifest.webmanifest file.
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
      },
      devOptions: {
        enabled: true // test PWA during `npm run dev`
      }
    })
  ]
})
