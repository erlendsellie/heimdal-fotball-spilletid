const CACHE_NAME = 'heimdal-spilletid-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];
// Install: Open cache and add core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});
// Fetch: Apply caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  // For API calls, use a stale-while-revalidate strategy
  if (request.url.includes('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return fetch(request).then(networkResponse => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
          return cache.match(request);
        });
      })
    );
    return;
  }
  // For navigation requests, use network-first, then cache, then fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If successful, cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try the cache
          return caches.match(request)
            .then(response => {
              return response || caches.match('/index.html'); // Fallback to home
            });
        })
    );
    return;
  }
  // For other requests (CSS, JS, images), use cache-first
  event.respondWith(
    caches.match(request)
      .then(response => {
        return response || fetch(request).then(networkResponse => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
  );
});
// Activate: Clean up old caches
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
// Background Sync (conceptual - requires registration from client-side)
self.addEventListener('sync', event => {
  if (event.tag === 'oplog-sync') {
    console.log('Background sync triggered for oplog-sync');
    // In a real app, you would have a function here to read from IndexedDB
    // and send data to the server.
    // event.waitUntil(syncOplogToServer());
  }
});