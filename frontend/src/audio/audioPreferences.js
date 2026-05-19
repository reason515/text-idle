/**
 * Persistent audio preferences (client-only). ASCII keys for localStorage.
 */

export const LS_AUDIO_MUTED = 'textIdleAudioMuted'
export const LS_AUDIO_MASTER_VOLUME = 'textIdleAudioMasterVolume'

/** Default master linear gain (0–1) when no localStorage entry. */
export const DEFAULT_AUDIO_MASTER_VOLUME = 0.85

function clamp01(n) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

/**
 * @returns {boolean}
 */
export function getAudioMuted() {
  try {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(LS_AUDIO_MUTED) === '1'
  } catch {
    return false
  }
}

/**
 * @param {boolean} value
 */
export function setAudioMuted(value) {
  try {
    if (typeof localStorage === 'undefined') return
    if (value) localStorage.setItem(LS_AUDIO_MUTED, '1')
    else localStorage.removeItem(LS_AUDIO_MUTED)
  } catch {
    /* localStorage may be unavailable */
  }
}

/**
 * Master volume in 0–1 linear scale (applied in audio bus).
 * @returns {number}
 */
export function getAudioMasterVolume() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LS_AUDIO_MASTER_VOLUME)
      if (raw != null && raw !== '') {
        const n = Number.parseFloat(String(raw).trim())
        if (Number.isFinite(n)) return clamp01(n)
      }
    }
  } catch {
    /* localStorage may be unavailable */
  }
  return DEFAULT_AUDIO_MASTER_VOLUME
}

/**
 * @param {number} volume01
 */
export function setAudioMasterVolume(volume01) {
  const v = clamp01(Number(volume01))
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LS_AUDIO_MASTER_VOLUME, String(v))
    }
  } catch {
    /* localStorage may be unavailable */
  }
}
