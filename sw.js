// Guarda la app en el teléfono para que abra sin internet.
// Si cambias algún archivo de la app, sube también este con el número de VERSION aumentado.
const VERSION = "osito-v1";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./logo.png", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon.png"];
const CDN = ["https://www.gstatic.com/firebasejs/", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/", "https://cdnjs.cloudflare.com/"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = req.url;
  const same = url.startsWith(self.location.origin);
  if (!same && !CDN.some(p => url.startsWith(p))) return; // Firebase (datos y login) va directo a internet
  // Primero lo guardado; en segundo plano se actualiza.
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: same});
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (req.mode === "navigate") return (await cache.match("./index.html")) || Response.error();
    return Response.error();
  }));
});
