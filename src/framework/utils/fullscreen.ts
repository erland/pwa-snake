// src/framework/utils/fullscreen.ts
/**
 * Best-effort fullscreen request. Safe to call inside a user gesture.
 * No-ops on platforms that don't support fullscreen (e.g., iOS Safari).
 */
export function requestFullscreenIfPossible(): void {
  try {
    const doc: any = document as any;
    const el: any = document.documentElement as any;

    const already = (doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
    if (already) return;

    const req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.msRequestFullscreen;

    if (typeof req === "function") {
      try {
        const p = req.call(el, { navigationUI: "hide" });
        if (p && typeof p.then === "function") p.catch(() => {});
      } catch {}
    }
  } catch {}
}
