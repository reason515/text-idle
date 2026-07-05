/**
 * Server combat WebSocket client and event polling (Path B).
 */

import { isE2ePollOnlyMode } from './combatPacing.js'

function apiBase() {
  return import.meta.env.DEV ? '/api' : ''
}

function wsBase() {
  if (typeof window === 'undefined') return ''
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  if (import.meta.env.DEV) {
    return `${proto}//${window.location.hostname}:8080`
  }
  return `${proto}//${window.location.host}`
}

/**
 * Within a server tick, replay log_batch before cycle_complete even when legacy
 * event rows used the opposite seq order.
 * @param {Array<{ seq: number, type: string }>} events
 */
export function sortCombatStreamEvents(events) {
  return [...events].sort((a, b) => {
    const aSeq = Number(a.seq) || 0
    const bSeq = Number(b.seq) || 0
    const aIsLog = a.type === 'combat.log_batch'
    const bIsLog = b.type === 'combat.log_batch'
    const aIsComplete = a.type === 'combat.cycle_complete'
    const bIsComplete = b.type === 'combat.cycle_complete'

    if (Math.abs(aSeq - bSeq) === 1 && aIsLog && bIsComplete && aSeq > bSeq) {
      return -1
    }
    if (Math.abs(aSeq - bSeq) === 1 && aIsComplete && bIsLog && aSeq < bSeq) {
      return 1
    }
    if (aSeq !== bSeq) return aSeq - bSeq
    const rank = (type) => (type === 'combat.log_batch' ? 0 : type === 'combat.cycle_complete' ? 1 : 2)
    return rank(a.type) - rank(b.type)
  })
}

/**
 * @param {{
 *   token: string,
 *   onEvent: (msg: { seq: number, type: string, event?: object }) => void | Promise<void>,
 *   onOpen?: () => void,
 *   onClose?: () => void,
 * }} opts
 */
export function createCombatStream(opts) {
  /** @type {WebSocket | null} */
  let ws = null
  /** @type {ReturnType<typeof setInterval> | null} */
  let pollTimer = null
  let lastSeq = 0
  let closed = false
  /** @type {Promise<void>} */
  let pollChain = Promise.resolve()
  let lastProcessedSeq = 0
  const pollMs = isE2ePollOnlyMode() ? 250 : 5000

  async function deliverEvent(msg) {
    const seq = Number(msg?.seq) || 0
    const allowRedelivery =
      seq > 0 &&
      seq <= lastProcessedSeq &&
      (msg.type === 'combat.cycle_complete' || msg.type === 'combat.pending_expansion')
    if (seq > 0 && seq <= lastProcessedSeq && !allowRedelivery) return
    const ack = await opts.onEvent(msg)
    if (ack === false) return
    if (seq > lastProcessedSeq) lastProcessedSeq = seq
    if (seq > lastSeq) lastSeq = seq
  }

  async function pollEventsBody() {
    if (!opts.token) return
    try {
      const res = await fetch(`${apiBase()}/combat/events?since=${lastSeq}`, {
        headers: { Authorization: `Bearer ${opts.token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const events = sortCombatStreamEvents(Array.isArray(data.events) ? data.events : [])
      for (const row of events) {
        let eventBody = null
        try {
          eventBody = row.payload ? JSON.parse(row.payload) : null
        } catch {
          eventBody = null
        }
        await deliverEvent({
          seq: row.seq,
          type: row.type,
          event: eventBody,
        })
      }
      if (typeof opts.onAfterPoll === 'function') {
        await opts.onAfterPoll()
      }
    } catch {
      /* ignore poll errors */
    }
  }

  function pollEvents() {
    pollChain = pollChain.then(() => pollEventsBody()).catch(() => {})
    return pollChain
  }

  function connect() {
    closed = false
    const e2ePollOnly = isE2ePollOnlyMode()
    if (e2ePollOnly) {
      pollTimer = setInterval(pollEvents, pollMs)
      pollEvents()
      return
    }
    const url = `${wsBase()}/combat/ws?token=${encodeURIComponent(opts.token)}`
    ws = new WebSocket(url)
    ws.onopen = () => {
      if (opts.onOpen) opts.onOpen()
    }
    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(String(ev.data))
        pollChain = pollChain.then(() => deliverEvent(msg)).catch(() => {})
        await pollChain
      } catch {
        /* ignore */
      }
    }
    ws.onclose = () => {
      if (opts.onClose) opts.onClose()
      if (!closed) {
        setTimeout(connect, 2000)
      }
    }
    pollTimer = setInterval(pollEvents, pollMs)
    pollEvents()
  }

  function disconnect() {
    closed = true
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
  }

  /** Poll cursor only; does not skip undelivered events. @param {number} seq */
  function setLastSeq(seq) {
    const n = Math.max(0, Math.floor(Number(seq) || 0))
    lastSeq = Math.max(lastSeq, n)
  }

  /** Ack cursor: events with seq <= this are skipped unless shouldRedeliver allows retry. @param {number} seq */
  function setLastProcessedSeq(seq) {
    const n = Math.max(0, Math.floor(Number(seq) || 0))
    lastProcessedSeq = Math.max(lastProcessedSeq, n)
  }

  function getLastProcessedSeq() {
    return lastProcessedSeq
  }

  return { connect, disconnect, pollEvents, setLastSeq, setLastProcessedSeq, getLastProcessedSeq }
}

/** Force one server tick (E2E / debug only). */
export async function debugCombatTick(token) {
  const res = await fetch(`${apiBase()}/debug/combat/tick`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok || res.status === 204
}

export async function pauseServerCombat(token) {
  const res = await fetch(`${apiBase()}/combat/pause`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok || res.status === 204
}

export async function resumeServerCombat(token) {
  const res = await fetch(`${apiBase()}/combat/resume`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok || res.status === 204
}

/** Run the next server combat cycle after client log replay completes. */
export async function advanceServerCombat(token) {
  const res = await fetch(`${apiBase()}/combat/advance`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 204) {
    throw new Error(`combat advance failed: ${res.status}`)
  }
  return true
}
