const CACHE_NAME = 'flashcard-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon.svg'
];
const FONT_CACHE = 'flashcard-fonts-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Fonts: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          const network = fetch(event.request).then(res => {
            cache.put(event.request, res.clone());
            return res;
          });
          return cached || network;
        })
      )
    );
    return;
  }

  // App shell: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, res.clone()));
        }
        return res;
      });
    })
  );
});
