const CACHE_NAME = "files_v10";

// Local files — must all succeed or SW install fails
const FILES_TO_CACHE = [
    'index.html',
    'quest.css',
    'quest.js',
    'manifest.json',
];

// CDN resources — cached opportunistically; a fetch failure is non-fatal
const CDN_TO_CACHE = [
    'https://fonts.googleapis.com/css?family=Inconsolata|Roboto+Mono&display=swap',
    'https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js',
    'https://cdn.jsdelivr.net/gh/blueimp/JavaScript-MD5/js/md5.min.js',
];

self.addEventListener('install', (evt) => {
    evt.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        // Cache local files atomically
        await cache.addAll(FILES_TO_CACHE);
        // Cache CDN files best-effort — don't abort install on failure
        await Promise.allSettled(
            CDN_TO_CACHE.map(url =>
                fetch(url).then(res => res.ok ? cache.put(url, res) : null)
            )
        );
    })());
    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    // delete old caches
    evt.waitUntil((async () => {
        const keys = await caches.keys();
        return Promise.all(keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)));
    })());
    self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
    // cache then network policy
    evt.respondWith((async () => {
        const response = await caches.match(evt.request);
        console.log('[service-worker] Cache', response ? 'hit' : 'miss', 'for', evt.request.url);
        return response || fetch(evt.request);
    })());
});
