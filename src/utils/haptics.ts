/**
 * Haptic feedback utility providing subtle, native tactile responses for mobile devices.
 * Gracefully no-ops on desktop or unsupported browsers.
 */

export function triggerHaptic(durationMs: number = 10) {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
  } catch {
    // Graceful no-op if vibration API is restricted by iframe or permission policy
  }
}

export function triggerSuccessHaptic() {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      navigator.vibrate([8, 30, 12]);
    }
  } catch {}
}

export function triggerSelectionHaptic() {
  triggerHaptic(8);
}
