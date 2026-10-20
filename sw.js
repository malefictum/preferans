// Сервис-воркер игры. Генерируется build.py из store/sw.template.js — правьте шаблон.
// Сборка 20.10 18:01. Новая сборка = новое имя кэша, старый удаляется.
var CACHE = 'pref-20.10 18:01';
var CORE = ["./", "index.html", "manifest.webmanifest", "img/JC.webp", "img/JD.webp", "img/JH.webp", "img/JS.webp", "img/KC.webp", "img/KD.webp", "img/KH.webp", "img/KS.webp", "img/QC.webp", "img/QD.webp", "img/QH.webp", "img/QS.webp", "img/back.webp", "img/icons/icon-150.png", "img/icons/icon-180.png", "img/icons/icon-192.png", "img/icons/icon-32.png", "img/icons/icon-44.png", "img/icons/icon-512.png", "img/icons/maskable-512.png", "img/icons/splash-620x300.png", "img/icons/wide-310x150.png"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('pref-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return; // PeerJS, cdn — мимо
  // Страница — сперва из сети (чтобы не застревать на старой сборке), без сети — из кэша.
  if (r.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(r.url).pathname)) {
    e.respondWith(fetch(r).then(function (res) {
      var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); return res;
    }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match('index.html'); }); }));
    return;
  }
  // Картинки и звуки — из кэша, недостающее (портреты, столы) докладывается по мере игры.
  e.respondWith(caches.match(r).then(function (m) {
    return m || fetch(r).then(function (res) {
      if (res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); }
      return res;
    });
  }));
});
