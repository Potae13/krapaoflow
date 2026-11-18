const CACHE_NAME = 'krapaoflow-v8-no-native-date';
const ASSETS = ['./', './index.html', './styles.css?v=8', './app.js?v=8', './manifest.json?v=8', './icon.svg'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.includes('/api/') || url.hostname.includes('ntfy.sh') || url.hostname.includes('cloudflare.com')) {
    return;
  }
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
