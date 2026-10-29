// Estados HTTP reales del sitio publicado: páginas existentes 200, rutas inexistentes 404 (con la página 404 y noindex),
// artículos 200/404 y redirecciones 308. Sirve un dist de prueba, generado con el mismo prerenderizado del build, por un
// servidor HTTP que aplica vercel.json con el orden de rutas que compila Vercel (`vercel build`, .vercel/output/config.json):
// redirects → archivos estáticos (con índice de directorio) → rewrites → si nada coincide, 404.html con estado 404.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { articleResponse, seoPolicy } from '../api/_lib/articlePage.js';
import { fetchPublishedArticle } from '../api/_lib/articleSource.js';
import { loadPageSeoSources, prerenderPages } from './seo-prerender-plugin.mjs';
import { NOINDEX } from '../src/integration/eze-cms/seoShared.js';

const root = process.cwd();
// VERCEL_CONFIG permite comprobar otra versión de la configuración (p. ej. que la anterior fallaba).
const vercel = JSON.parse(fs.readFileSync(path.resolve(root, process.env.VERCEL_CONFIG ?? 'vercel.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/integration/eze-cms/claudia-sanchez.manifest.json'), 'utf8'));
const SHELL = '<!doctype html><html lang="es"><head><title>Claudia</title><script type="module" src="/assets/app.js"></script></head><body><div id="root"></div></body></html>';
const ARTICLE = {
  id: 'a1', site_id: 's1', slug: 'en-manos-de-quien-dejarias-tu-carrera', title: '¿En manos de quién dejarías tu carrera?', excerpt: null, cover_image: null,
  content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cuerpo.' }] }] },
  published_at: '2026-10-22T18:14:40Z', original_published_at: null, source_url: null, created_at: '2026-10-22T18:14:40Z', updated_at: '2026-10-22T18:14:40Z',
  seo_title: null, meta_description: null, cover_image_alt: null, canonical_url: null, noindex: false,
};

// dist de prueba: el mismo HTML por página que escribe el build, más un recurso estático.
const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'claudia-dist-'));
const pages = prerenderPages({ template: SHELL, manifest, snapshot: null, sources: await loadPageSeoSources(root), env: {} });
for (const page of pages) {
  fs.mkdirSync(path.dirname(path.join(dist, page.file)), { recursive: true });
  fs.writeFileSync(path.join(dist, page.file), page.html);
}
fs.mkdirSync(path.join(dist, 'assets'));
fs.writeFileSync(path.join(dist, 'assets/app.js'), 'export {};');
fs.copyFileSync(path.join(root, 'public/robots.txt'), path.join(dist, 'robots.txt'));
assert.ok(fs.existsSync(path.join(dist, '404.html')), 'El build genera 404.html');

// Patrón de vercel.json (`/articulos/:slug/`, `/(.*)`) → expresión regular con grupos por parámetro.
const compile = source => source === '/(.*)' ? /^\/(.*)$/
  : new RegExp(`^${source.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`);
const fill = (destination, groups) => destination.replace(/:(\w+)/g, (_, name) => groups[name]);
const redirects = vercel.redirects.map(rule => ({ ...rule, pattern: compile(rule.source) }));
const rewrites = vercel.rewrites.map(rule => ({ ...rule, pattern: compile(rule.source) }));

// La función de artículos con la plantilla de prueba y Supabase simulado (solo existe ARTICLE).
async function articleFunction(slug) {
  const fetchImpl = async () => new Response(JSON.stringify(slug === ARTICLE.slug ? [ARTICLE] : []));
  const result = await fetchPublishedArticle(slug, { env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_test' }, fetchImpl });
  return articleResponse(result, { template: SHELL, policy: seoPolicy({}, 'localhost'), labels: {}, mediaBase: '' });
}

const staticFile = pathname => {
  const target = path.join(dist, decodeURIComponent(pathname));
  if (!target.startsWith(dist)) return null;
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;
  const index = path.join(target, 'index.html');
  return fs.existsSync(index) ? index : null;
};

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  for (const rule of redirects) {
    const match = pathname.match(rule.pattern);
    if (match) { res.writeHead(rule.permanent ? 308 : 307, { Location: fill(rule.destination, match.groups ?? {}) }); res.end(); return; }
  }
  const file = staticFile(pathname);
  if (file) { res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain' }); res.end(fs.readFileSync(file)); return; }
  for (const rule of rewrites) {
    const match = pathname.match(rule.pattern);
    if (!match) continue;
    if (rule.destination.startsWith('/api/articulo')) {
      const { status, headers, body } = await articleFunction(decodeURIComponent(match.groups.slug));
      res.writeHead(status, headers); res.end(body); return;
    }
    // Rewrite a un archivo estático: Vercel lo sirve con 200, sea cual sea el archivo (así se perdía el 404).
    const target = staticFile(rule.destination);
    if (target) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(fs.readFileSync(target)); return; }
  }
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(path.join(dist, '404.html')));
});
await new Promise(resolve => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;
const get = async pathname => {
  const response = await fetch(base + pathname, { redirect: 'manual' });
  return { status: response.status, location: response.headers.get('location'), robots: response.headers.get('x-robots-tag'), body: await response.text() };
};
const title = html => html.match(/<title>([^<]*)<\/title>/)?.[1];

try {
  // Páginas existentes: 200 con su HTML prerenderizado.
  for (const page of pages.filter(page => page.route !== '/404')) {
    const response = await get(page.route);
    assert.equal(response.status, 200, `${page.route} debe responder 200`);
    assert.equal(response.body, page.html, `${page.route}: su HTML prerenderizado`);
  }
  for (const pathname of ['/personas/', '/contacto?tipo=empresa', '/assets/app.js', '/robots.txt']) assert.equal((await get(pathname)).status, 200, pathname);
  console.log(`HTTP OK: ${pages.length - 1} páginas existentes responden 200 con su HTML prerenderizado`);

  // Rutas inexistentes: 404 real con la página 404 actual y noindex.
  const notFound = pages.find(page => page.route === '/404').html;
  for (const pathname of ['/ruta-inexistente', '/personas/otra', '/articulos/a/b', '/404', '/servicios', '/index.php']) {
    const response = await get(pathname);
    assert.equal(response.status, 404, `${pathname} debe responder 404`);
    assert.equal(response.body, notFound, `${pathname}: la página 404 de siempre`);
    assert.ok(response.body.includes(`<meta name="robots" content="${NOINDEX}"`), `${pathname}: noindex`);
    assert.equal(title(response.body), 'Página no encontrada | Claudia Sánchez Urencio');
  }
  console.log('HTTP OK: rutas inexistentes responden 404 con la página 404 y noindex');

  // Artículos y redirecciones.
  assert.equal((await get(`/articulos/${ARTICLE.slug}`)).status, 200);
  const missingArticle = await get('/articulos/no-existe-xyz');
  assert.equal(missingArticle.status, 404);
  assert.equal(missingArticle.robots, NOINDEX);
  assert.deepEqual(await get(`/articulos/${ARTICLE.slug}/`).then(r => [r.status, r.location]), [308, `/articulos/${ARTICLE.slug}`]);
  assert.deepEqual(await get('/newsletter/algo').then(r => [r.status, r.location]), [308, '/articulos/algo'], 'Enlace legacy: redirección del servidor');
  assert.equal((await get('/articulos/algo')).status, 404, '…que termina en 404 si el artículo no existe');
  assert.deepEqual(await get(`/newsletter/${ARTICLE.slug}`).then(r => [r.status, r.location]), [308, `/articulos/${ARTICLE.slug}`]);
  assert.deepEqual(await get('/newsletter').then(r => [r.status, r.location]), [308, '/articulos']);
  assert.deepEqual(await get('/disena-tu-futuro').then(r => [r.status, r.location]), [308, '/diseno-de-carrera']);
  console.log('HTTP OK: artículos 200/404 y redirecciones 308 (barra final, newsletter, diseña tu futuro)');
} finally {
  server.close();
  fs.rmSync(dist, { recursive: true, force: true });
}
