// Self-destructing cache cleaner Service Worker to free iPad Home Screen WebClips from old cached versions
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        clients.forEach(client => {
          if ('navigate' in client) {
            client.navigate(client.url);
          }
        });
      })
  );
});
