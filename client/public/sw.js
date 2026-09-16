// BHOOMI service worker.
//
// Two independent jobs:
//  1. Cache the app shell so the installed app opens instantly (and the UI
//     still loads, offline-first, even with no connection - real API calls
//     still need a network, but the interface itself isn't a blank screen).
//  2. Listen for Web Push events and surface them as real OS/browser
//     notifications, and route a tap on one back into the app.

const CACHE_NAME = 'bhoomi-shell-v1';
const APP_SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for the app shell/static assets, network-first (no caching)
// for API and WebSocket traffic - the marketplace data should never be
// served stale.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
    return; // let the network handle it directly
  }
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() => cached)
    )
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: 'BHOOMI', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'BHOOMI', {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
