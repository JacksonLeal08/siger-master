const CACHE_NAME = 'siger-pwa-cache-v13';
const ASSETS_TO_CACHE = [
  '/',
  '/favicon.svg',
  '/assets/branding/logo-jimmp-info.png',
  '/assets/branding/icon-jimmp.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/login-bg.png',
];

// Instalação do Service Worker e cache estático
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker SIGER Master] Cache v13 carregado.');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.warn('[Service Worker] Erro no cache install:', err))
  );
  self.skipWaiting();
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deletando cache obsoleto:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interceptador de requisições seguro (Network First para rotas dinâmicas do Next.js)
self.addEventListener('fetch', (event) => {
  // Apenas intercepta requisições locais GET
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // Ignora APIs, manifest, rotas internas do Next.js e requisições RSC no cache para evitar conflitos de versão
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname.startsWith('/_next/') || 
    url.pathname.includes('manifest') ||
    url.searchParams.has('_rsc') ||
    event.request.headers.get('RSC') === '1' ||
    event.request.headers.get('Next-Router-State-Tree') ||
    event.request.headers.get('Next-Url')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        }).catch(console.warn);

        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === 'navigate') {
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
        }
        return new Response('Rede indisponível.', { status: 503, statusText: 'Offline' });
      })
  );
});
