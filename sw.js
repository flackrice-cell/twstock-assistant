/* PWA service worker：離線開啟外殼（外部行情 API 一律走網路） */
var CACHE = 'twstock-v4';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
    .catch(function () {})
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  var u;
  try { u = new URL(req.url); } catch (err) { return; }
  if (u.origin !== location.origin) return;                 // 行情 API 不攔
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      var copy = r.clone();
      caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
      return r;
    }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (r) { return r || fetch(req); }));
});
