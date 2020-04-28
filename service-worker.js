const CACHE_NAME = "files_v1";
const FILES_TO_CACHE = [
	'quest.html',
	'quest.css',
	'quest.js',
	'https://fonts.googleapis.com/css?family=PT+Mono|Roboto+Mono&display=swap',
	'https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js',
	'https://cdn.jsdelivr.net/gh/blueimp/JavaScript-MD5/js/md5.min.js',
	'https://fonts.gstatic.com/s/ptmono/v7/9oRONYoBnWILk-9AnC8zM_HxEck.woff2',
	'https://fonts.gstatic.com/s/robotomono/v7/L0x5DF4xlVMF-BfR8bXMIjhLq3-cXbKD.woff2',
];

self.addEventListener('install', (evt) => {
	// add all resources to the cache
	evt.waitUntil((async () => {
		var cache = await caches.open(CACHE_NAME);
		return cache.addAll(FILES_TO_CACHE);
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
