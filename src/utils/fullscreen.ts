// src/utils/fullscreen.ts
let tried = false;

export function requestFullscreenIfPossible() {
  if (tried) return;
  tried = true;

  const doc = document as any;
  const el = document.documentElement as any;

  // Standard Fullscreen API (iOS Safari supports since iOS 16)
  if (document.fullscreenEnabled && !document.fullscreenElement) {
    el.requestFullscreen?.().catch(() => {});
  }

  // Best-effort viewport tweaks (harmless no-ops where unsupported)
  try {
    screen.orientation?.unlock?.();
    // iOS doesn't support orientation.lock reliably; we just ignore errors.
  } catch {}
}