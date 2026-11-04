'use strict';
// Relative URLs keep this worker inside its GitHub Pages repository.
const PREFIX = 'misluli-hatzdaka-' + self.registration.scope + '-';
const CACHE = PREFIX + 'v26';
const FILES = ['index.html', 'pwa.js', 'i18n.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png'];
const base = self.registration.scope;
const allowed = new Set(FILES.map(path => new URL(path, base).href));
const home = new URL('index.html', base).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(path => new Request(new URL(path, base), { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Never cache routing, location queries or third-party map tiles.
  const isHome = url.pathname === new URL(base).pathname || url.pathname === new URL(home).pathname;
  const key = isHome ? home : url.origin + url.pathname;
  const isPhoto = url.pathname.startsWith(new URL('photos/', base).pathname) && /\/\d+\.webp$/.test(url.pathname);
  if (!isHome && !allowed.has(key) && !isPhoto) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Prefer current site contents; query strings are not separate offline versions.
      const response = await fetch(request, { cache: 'no-cache' });
      if (response.ok && response.type !== 'opaque') {
        const copy = response.clone();
        event.waitUntil(cache.put(key, copy).catch(() => {}));
        return response;
      }
      return (await cache.match(key)) || response;
    } catch (error) {
      const saved = await cache.match(key);
      if (saved) return saved;
      throw error;
    }
  })());
});
