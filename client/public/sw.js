// Parvaz Pulse - Service Worker
// Clean: no Firebase importScripts (breaks deployment)
// Handles: offline caching + scheduled notifications

const CACHE_NAME = 'parvaz-pulse-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-180x180.png',
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && (
          request.url.includes('.js') ||
          request.url.includes('.css') ||
          request.url.includes('.png') ||
          request.url.includes('.woff')
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Notification click -> open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});

// Scheduled notifications (7PM reminder + any future timers)
const scheduledTimers = new Map();

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || !msg.type) return;

  if (msg.type === 'SCHEDULE_LOG_REMINDER') {
    // Clear existing if any
    if (scheduledTimers.has('log-reminder')) {
      clearTimeout(scheduledTimers.get('log-reminder'));
    }
    if (msg.delayMs <= 0) return;
    const id = setTimeout(() => {
      self.registration.showNotification('Parvaz Pulse 🌙', {
        body: "Don't forget to log your day! Take 2 minutes to reflect before the night slips away.",
        icon: '/icon-192x192.png',
        badge: '/icon-32x32.png',
        tag: 'log-reminder',
        requireInteraction: false,
        vibrate: [200, 100, 200],
      });
      scheduledTimers.delete('log-reminder');
    }, msg.delayMs);
    scheduledTimers.set('log-reminder', id);
  }

  if (msg.type === 'CANCEL_LOG_REMINDER') {
    if (scheduledTimers.has('log-reminder')) {
      clearTimeout(scheduledTimers.get('log-reminder'));
      scheduledTimers.delete('log-reminder');
    }
  }

  if (msg.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
