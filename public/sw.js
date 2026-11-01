// Goraph service worker。路径一律相对于本文件所在目录，以支持部署在子路径（如 /goraph/）。
// __SW_VERSION__ 由 scripts/deploy.sh 替换为 git 提交号（Taro 复制时会压缩本文件，所以用占位符而非匹配整行），新版本激活时清掉旧缓存。
const VERSION = '__SW_VERSION__';
const CACHE_NAME = `goraph-${VERSION}`;
const BASE = new URL('./', self.location).href;
const INDEX = new URL('index.html', BASE).href;
const STATIC_ASSETS = [BASE, INDEX, new URL('manifest.json', BASE).href];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('goraph-') && k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

const put = (req, res) => caches.open(CACHE_NAME).then((c) => c.put(req, res));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(BASE)) return;

  // 页面：网络优先，离线时回退缓存
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) put(req, res.clone());
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(INDEX))),
    );
    return;
  }

  // 带 hash 的静态资源：缓存优先
  if (['script', 'style', 'image', 'font'].includes(req.destination)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) put(req, res.clone());
            return res;
          }),
      ),
    );
  }
});
