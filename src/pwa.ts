import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
  onRegisteredSW(swUrl: string, registration) {
    console.log('SW registered:', swUrl, registration)
  },
  onRegisterError(error: unknown) {
    console.error('SW registration error:', error)
  },
})
