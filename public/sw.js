const CACHE_PREFIX = 'sa3aty-runtime';
const CACHE_NAME = `${CACHE_PREFIX}-v3`;
const SCOPE_URL = new URL(self.registration.scope);
const OFFLINE_FALLBACK = `${SCOPE_URL.pathname}index.html`;
const PRECACHE_URLS = [
  `${SCOPE_URL.pathname}manifest.json`,
  `${SCOPE_URL.pathname}logo.png`,
  `${SCOPE_URL.pathname}icon-192.png`,
  `${SCOPE_URL.pathname}icon-512.png`,
  OFFLINE_FALLBACK,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request, { cache: 'no-store' });
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const destination = event.request.destination;
  const isNavigation = event.request.mode === 'navigate' || destination === 'document';
  const shouldUseNetworkFirst = isNavigation || destination === 'script' || destination === 'style' || destination === 'worker';

  if (shouldUseNetworkFirst) {
    event.respondWith(networkFirst(event.request, OFFLINE_FALLBACK));
    return;
  }

  if (destination === 'image' || destination === 'font' || destination === 'audio') {
    event.respondWith(cacheFirst(event.request));
  }
});
