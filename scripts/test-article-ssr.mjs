// Pruebas de api/articulo.js (HTML de artículos en el servidor) sin red ni despliegue.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fetchPublishedArticle, SITE_SLUG } from '../api/_lib/articleSource.js';
import { renderArticleBody } from '../api/_lib/articleHtml.js';
import { articleResponse, assertTemplate, seoPolicy } from '../api/_lib/articlePage.js';

const LS = String.fromCharCode(0x2028);
const TEMPLATE = '<!doctype html>\n<html lang="es">\n  <head>\n    <title>Claudia Sánchez Urencio · Executive Career Coach &amp; Advisor</title>\n    <script type="module" crossorigin src="/assets/index-test.js"></script>\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>\n';
const LABELS = {
  encabezado: { collection: 'How to Thrive Beyond 40', backLabel: 'Volver a artículos' },
  contenido: { missingTitle: 'Artículo inexistente' },
  'pie-articulo': { signature: 'Por Claudia Sánchez Urencio', sourceLabel: 'Ver publicación original en LinkedIn', back: { label: 'Volver a Artículos', href: '/articulos' } },
};
const MEDIA = 'https://example.supabase.co';
const text = (value, marks) => ({ type: 'text', text: value, ...(marks ? { marks } : {}) });
const DOC = { type: 'doc', content: [
  { type: 'paragraph', content: [text('Ñandú «comillas» "dobles" \'simples\' & <b>no es HTML</b> </script><!-- ' + LS), { type: 'hardBreak' }, text('negrita', [{ type: 'bold' }, { type: 'italic' }])] },
  { type: 'heading', attrs: { level: 1 }, content: [text('Nivel 1 baja a h2')] },
  { type: 'heading', attrs: { level: 7 }, content: [text('Nivel 7 queda en h4')] },
  { type: 'paragraph', content: [text('interno', [{ type: 'link', attrs: { href: '/contacto' } }]), text(' externo', [{ type: 'link', attrs: { href: 'https://example.com/?a=1&b="2"' } }]), text(' peligroso', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]), text(' tachado', [{ type: 'strike' }, { type: 'code' }])] },
  { type: 'blockquote', content: [{ type: 'paragraph', content: [text('cita')] }] },
  { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [text('tres')] }] }] },
  { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [text('punto')] }] }] },
  { type: 'horizontalRule' },
  { type: 'image', attrs: { src: 'claudia/foto_1.jpg', alt: 'Retrato "Claudia"', title: 'Pie <b>' } },
  { type: 'image', attrs: { storagePath: 'claudia/foto.jpg', alt: '' } },
  { type: 'image', attrs: { src: 'javascript:alert(1)' } },
  { type: 'image', attrs: { src: 'https://cdn.example.com/a.png' } },
  { type: 'desconocido', content: [text('contenido de nodo desconocido')] },
  null,
] };
const ARTICLE = {
  id: 'a1', site_id: 's1', slug: 'liminalidad-el-espacio-que-nadie-te-enseno-a-cruzar-en-una-transicion-de-ca',
  title: '</title><script>alert("x")</script> Liminalidad : el espacio que nadie te enseñó a cruzar en una transición de carrera & más',
  excerpt: null, cover_image: 'claudia/portada.jpg', content: DOC,
  published_at: '2026-10-22T18:14:36.273464+00:00', original_published_at: '2026-10-19T04:00:00+00:00',
  source_url: 'https://www.linkedin.com/pulse/x', created_at: '2026-10-22T18:14:36Z', updated_at: '2026-10-23T10:00:00Z',
};
const count = (html, pattern) => (html.match(pattern) || []).length;

// 1. Cuerpo: idéntico a ArticleBody de React.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { ArticleBody } = await server.ssrLoadModule('/src/components/institutional/articles.jsx');
  const { cmsRuntimeConfig } = await server.ssrLoadModule('/src/integration/eze-cms/cmsRuntime.ts');
  assert.equal(SITE_SLUG, cmsRuntimeConfig.siteSlug, 'La función debe leer el mismo sitio que el navegador');
  const base = cmsRuntimeConfig.supabaseUrl;
  for (const content of [DOC, ARTICLE.content, { type: 'doc' }, null, { type: 'paragraph', content: [text('')] }]) {
    assert.equal(renderArticleBody(content, base), renderToStaticMarkup(React.createElement(ArticleBody, { content })), 'El HTML del servidor debe coincidir con ArticleBody');
  }
  // Con VITE_SUPABASE_URL configurada, la paridad también cubre las imágenes del bucket (sin ella, ambos lados las omiten).
  if (base) assert.ok(renderArticleBody(DOC, base).includes('/storage/v1/object/public/article-media/claudia/foto_1.jpg'));
  console.log(`SSR artículos OK: cuerpo idéntico a ArticleBody${base ? ', imágenes del bucket incluidas' : ' (sin VITE_SUPABASE_URL: imágenes del bucket omitidas)'}`);
} finally {
  await server.close();
}

// 2. Documento completo: escape, un único h1, metadatos, JSON-LD y estado inicial para React.
const preview = seoPolicy({ VITE_SITE_URL: 'https://claudiasanchez.example', VERCEL_ENV: 'preview' }, 'claudia-sanchez.vercel.app');
const page = articleResponse({ status: 'found', article: ARTICLE }, { template: TEMPLATE, policy: preview, labels: LABELS, mediaBase: MEDIA });
assert.equal(page.status, 200);
assert.equal(page.headers['X-Robots-Tag'], 'noindex, nofollow, noarchive');
assert.match(page.headers['Cache-Control'], /s-maxage=300/);
const html = page.body;
assert.equal(count(html, /<h1[ >]/g), 1, 'Un solo h1');
assert.equal(count(html, /<title>/g), 1);
assert.ok(html.includes('<title>&lt;/title&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; Liminalidad'), 'Título escapado');
assert.ok(!html.includes('<script>alert'), 'Sin scripts inyectados');
assert.equal(count(html, /<script[ >]/g), count(html, /<\/script>/g), 'Cada script cierra donde corresponde');
assert.equal(count(html, /<\/script>/g), 3, 'Solo los scripts esperados: módulo, JSON-LD y estado inicial');
assert.ok(html.includes('<meta name="robots" content="noindex, nofollow, noarchive" data-ssr-seo="/articulos/liminalidad-el-espacio-que-nadie-te-enseno-a-cruzar-en-una-transicion-de-ca">'));
assert.ok(html.includes('<link rel="canonical" href="https://claudiasanchez.example/articulos/liminalidad-el-espacio-que-nadie-te-enseno-a-cruzar-en-una-transicion-de-ca"'));
assert.ok(html.includes('<meta property="og:type" content="article"'));
assert.ok(html.includes(`<meta property="og:image" content="${MEDIA}/storage/v1/object/public/article-media/claudia/portada.jpg"`));
assert.ok(html.includes('<meta name="description" content="Ñandú «comillas» &quot;dobles&quot; &#x27;simples&#x27; &amp; &lt;b&gt;'), 'Descripción derivada del cuerpo y escapada');
assert.ok(html.includes('<time datetime="2026-10-19T04:00:00+00:00">19 de octubre de 2026</time>'), 'Fecha editorial');
assert.ok(html.includes('<span>Claudia Sánchez Urencio</span>'), 'Autoría');
assert.ok(html.includes('href="https://www.linkedin.com/pulse/x"'));
assert.ok(html.includes('<a class="article-back" href="/articulos">'), 'Enlace interno rastreable');
const scripts = [...html.matchAll(/<script type="application\/(ld\+)?json"[^>]*>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.every(match => !match[2].includes(LS) && !match[2].includes('<')), 'JSON en scripts sin < ni separadores de línea crudos');
const jsonLd = JSON.parse(scripts.find(match => match[1])[2]);
assert.equal(jsonLd['@type'], 'BlogPosting');
assert.equal(jsonLd.headline, ARTICLE.title);
assert.equal(jsonLd.datePublished, ARTICLE.original_published_at);
assert.equal(jsonLd.dateModified, ARTICLE.updated_at);
assert.equal(jsonLd.author.name, 'Claudia Sánchez Urencio');
assert.equal(jsonLd.mainEntityOfPage, 'https://claudiasanchez.example/articulos/liminalidad-el-espacio-que-nadie-te-enseno-a-cruzar-en-una-transicion-de-ca');
assert.deepEqual(JSON.parse(scripts.find(match => !match[1])[2]), ARTICLE, 'El estado inicial de React conserva el artículo exacto');
console.log('SSR artículos OK: documento escapado, h1 único, metadatos y JSON-LD');

// 3. Canonical e indexación.
const policy = (env, host = 'claudiasanchez.example') => seoPolicy(env, host);
assert.equal(policy({}).origin, null, 'Sin dominio configurado no hay canonical');
for (const url of ['https://claudia-sanchez.vercel.app', 'http://localhost:5174', 'https://localhost', 'http://claudiasanchez.example', 'https://127.0.0.1', 'no-es-url']) {
  assert.equal(policy({ VITE_SITE_URL: url }).origin, null, `Canonical rechazado: ${url}`);
}
const finalSite = { VITE_SITE_URL: 'https://claudiasanchez.example/', VITE_SEO_ALLOW_INDEXING: 'true', VERCEL_ENV: 'production' };
assert.equal(policy(finalSite).indexing, true);
assert.equal(policy({ ...finalSite, VERCEL_ENV: undefined }).indexing, true, 'Sin VERCEL_ENV (otro hosting) decide el dominio');
assert.equal(policy({ ...finalSite, VITE_SEO_ALLOW_INDEXING: undefined }).indexing, false, 'Indexar requiere autorización explícita');
assert.equal(policy({ ...finalSite, VERCEL_ENV: 'preview' }).indexing, false, 'Preview nunca indexa');
assert.equal(policy(finalSite, 'claudia-sanchez.vercel.app').indexing, false, 'El dominio temporal nunca indexa');
assert.equal(policy(finalSite, 'www.claudiasanchez.example').indexing, false, 'Solo el host exacto del dominio final');
assert.equal(policy(finalSite, '').indexing, false, 'Sin host conocido no se indexa');
const indexed = articleResponse({ status: 'found', article: ARTICLE }, { template: TEMPLATE, policy: policy(finalSite), labels: LABELS, mediaBase: MEDIA });
assert.equal(indexed.headers['X-Robots-Tag'], undefined);
assert.ok(indexed.body.includes('content="index, follow, max-image-preview:large"'));
const noDomain = articleResponse({ status: 'found', article: ARTICLE }, { template: TEMPLATE, policy: policy({}), labels: LABELS, mediaBase: MEDIA }).body;
assert.ok(!noDomain.includes('rel="canonical"') && !noDomain.includes('og:url'), 'Sin dominio: ni canonical ni og:url');
assert.ok(!noDomain.includes('"mainEntityOfPage"'));
console.log('SSR artículos OK: canonical e indexación solo en el dominio final autorizado');

// 4. Estados HTTP.
const missing = articleResponse({ status: 'missing' }, { template: TEMPLATE, policy: preview, labels: LABELS, mediaBase: MEDIA });
assert.equal(missing.status, 404);
assert.ok(missing.body.includes('<title>Artículo inexistente | Claudia Sánchez Urencio</title>'));
assert.ok(missing.body.includes('<meta name="robots" content="noindex, nofollow, noarchive">'));
assert.ok(missing.body.includes('<div id="root"></div>') && missing.body.includes('/assets/index-test.js'), 'La SPA sigue cargando para mostrar su vista');
assert.ok(!missing.body.includes('data-ssr-seo'), 'React puede reemplazar los metadatos de un 404');
const unavailable = articleResponse({ status: 'unavailable', error: new Error('x') }, { template: TEMPLATE, policy: preview, labels: LABELS, mediaBase: MEDIA });
assert.equal(unavailable.status, 503);
assert.equal(unavailable.headers['Retry-After'], '30');
assert.equal(unavailable.headers['Cache-Control'], 'no-store');
assert.ok(unavailable.body.includes('<title>Claudia Sánchez Urencio</title>'), 'Título neutro, no el de la plantilla');
assert.equal(articleResponse({ status: 'misconfigured', error: new Error('x') }, { template: TEMPLATE, policy: preview, labels: LABELS, mediaBase: MEDIA }).status, 500);
assert.throws(() => assertTemplate('<html><head></head><body></body></html>'));
assertTemplate(TEMPLATE);
console.log('SSR artículos OK: 200 / 404 / 503 / 500');

// 5. Lectura pública desde Supabase (fetch simulado).
const env = { VITE_SUPABASE_URL: 'https://example.supabase.co/', VITE_SUPABASE_ANON_KEY: 'sb_publishable_test' };
const reply = (status, body) => async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
let request;
const found = await fetchPublishedArticle(ARTICLE.slug, { env, fetchImpl: async (url, init) => { request = { url, init }; return new Response(JSON.stringify([ARTICLE])); } });
assert.equal(found.status, 'found');
assert.equal(request.url, 'https://example.supabase.co/rest/v1/rpc/get_published_articles');
assert.deepEqual(JSON.parse(request.init.body), { p_site_slug: 'claudia-sanchez', p_article_slug: ARTICLE.slug });
assert.equal((await fetchPublishedArticle('otro', { env, fetchImpl: reply(200, []) })).status, 'missing');
assert.equal((await fetchPublishedArticle('otro', { env, fetchImpl: reply(200, [ARTICLE]) })).status, 'missing', 'Solo el slug exacto');
assert.equal((await fetchPublishedArticle(ARTICLE.slug, { env, fetchImpl: reply(200, [{ ...ARTICLE, published_at: null }]) })).status, 'missing', 'Sin fecha de publicación no es público');
assert.equal((await fetchPublishedArticle(ARTICLE.slug, { env, fetchImpl: reply(503, {}) })).status, 'unavailable');
assert.equal((await fetchPublishedArticle(ARTICLE.slug, { env, fetchImpl: reply(200, 'no es json') })).status, 'unavailable');
assert.equal((await fetchPublishedArticle(ARTICLE.slug, { env, fetchImpl: async () => { throw new TypeError('fetch failed'); } })).status, 'unavailable');
assert.equal((await fetchPublishedArticle(ARTICLE.slug, { env, fetchImpl: reply(401, {}) })).status, 'misconfigured');
assert.equal((await fetchPublishedArticle(ARTICLE.slug, { env: {}, fetchImpl: reply(200, [ARTICLE]) })).status, 'misconfigured');
assert.equal((await fetchPublishedArticle(ARTICLE.slug, { env: { ...env, VITE_SUPABASE_ANON_KEY: 'sb_secret_x' }, fetchImpl: reply(200, [ARTICLE]) })).status, 'misconfigured', 'Nunca con una clave secreta');
console.log('SSR artículos OK: lectura pública, slug exacto y errores temporales distinguidos');

// 6. React: con el estado inicial del HTML, el primer render ya es el artículo (sin "Cargando" ni segundo h1).
globalThis.document = { getElementById: id => id === 'ssr-article' ? { textContent: JSON.stringify(ARTICLE) } : null };
const seededServer = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { MemoryRouter } = await import('react-router-dom');
  const { default: App } = await seededServer.ssrLoadModule('/src/App.jsx');
  const render = route => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(App)));
  const seeded = render(`/articulos/${ARTICLE.slug}`);
  assert.equal(count(seeded, /<h1[ >]/g), 1, 'Un solo h1 con el artículo inicial');
  assert.ok(seeded.includes('Liminalidad : el espacio que nadie te enseñó a cruzar'), 'React muestra el artículo en el primer render');
  assert.ok(!seeded.includes('Cargando artículo'), 'Sin estado de carga');
  assert.ok(seeded.includes(renderArticleBody(DOC, '').slice(0, 60)), 'El cuerpo de React coincide con el del servidor');
  assert.ok(render('/articulos/otro-slug').includes('Cargando artículo'), 'Otro slug no usa el estado inicial');
  console.log('SSR artículos OK: React arranca con el artículo del HTML');
} finally {
  await seededServer.close();
  delete globalThis.document;
}

// 7. Layout reservado y enrutado de Vercel.
assert.ok(html.includes('<div id="root"><div class="claudia-root institutional"><header class="institutional-header" aria-hidden="true"><div class="site-container header-row"></div></header><main id="contenido" tabindex="-1"><main class="site-container article-detail">'),
  'El artículo va dentro de la misma estructura que Layout, con la altura de la navbar reservada');
const { readFileSync } = await import('node:fs');
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
assert.deepEqual(vercel.redirects.find(r => r.source === '/articulos/:slug/'), { source: '/articulos/:slug/', destination: '/articulos/:slug', permanent: true }, 'Barra final: 308 a la URL sin barra');
const rewrites = vercel.rewrites.map(r => r.source);
assert.ok(rewrites.indexOf('/articulos/:slug') >= 0 && rewrites.indexOf('/articulos/:slug') < rewrites.indexOf('/(.*)'), 'El rewrite de artículos va antes del fallback de la SPA');
console.log('SSR artículos OK: layout reservado, barra final 308 y orden de rewrites');
