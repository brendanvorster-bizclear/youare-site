// Keeps the money view page usable offline. Covers this folder only.
// The page fetches key.json and view.json itself and keeps its own saved copies, so this worker leaves them alone.
const SHELL = 'mv-shell-v2';
const FILES = ['./', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mv-shell-') && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith('.json')) return;
  if (req.mode === 'navigate') {
    // The page itself: the newest from the site, or the saved one when offline.
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put('./', copy)); }
          return res;
        })
        .catch(() => caches.match('./', { cacheName: SHELL }))
    );
    return;
  }
  e.respondWith(caches.match(req, { cacheName: SHELL }).then((hit) => hit || fetch(req)));
});
