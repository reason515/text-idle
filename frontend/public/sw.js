/* 挂机英雄团 Service Worker — Phase 7.2 PWA shell.
 * Caches the SPA shell + static assets for offline open; the game itself
 * is server-authoritative (offline combat settles server-side), so the SW
 * only needs to serve the cached shell while the network is unavailable.
 */
const CACHE = 'text-idle-v1'

const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/vite.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  // Only handle GET same-origin requests; let API/WS pass through untouched.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  // Never cache API calls.
  if (req.url.includes('/api/') || req.url.includes('/combat/')) return

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, clone))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
