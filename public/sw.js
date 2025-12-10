// This is a basic service worker. For production, use Workbox for more robustness.
const CACHE_NAME = 'heimdal-spilletid-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add paths to your JS, CSS, and image assets here
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});
self.addEventListener('fetch', event => {
  // For API calls, use a network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Optional: return a generic offline response for API calls
        return new Response(JSON.stringify({ success: false, error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  // For other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});