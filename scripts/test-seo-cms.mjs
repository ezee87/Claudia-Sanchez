// Pruebas de la Etapa 2A SEO: metadatos del CMS en artículos (api/articulo.js) y en el HTML por página del build.
import assert from 'node:assert/strict';
import { articleResponse, seoPolicy } from '../api/_lib/articlePage.js';
import { fetchPageSeoSnapshot, parsePageSeo } from './cms-snapshot-plugin.mjs';
import { loadPageSeoSources, outputFile, prerenderPages } from './seo-prerender-plugin.mjs';
import { INDEX, NOINDEX, globalIndexing, publicUrl, resolveCanonical, resolvePageSeo, resolveRobots } from '../src/integration/eze-cms/seoShared.js';

const count = (html, pattern) => (html.match(pattern) || []).length;
const SITE = 'https://claudiasanchez.example';
const LABELS = { contenido: { missingTitle: 'Artículo inexistente' } };
const MEDIA = 'https://example.supabase.co';
// Plantilla como la del build: dist/index.html ya trae los metadatos de la página de inicio.
const SHELL = '<!doctype html><html lang="es"><head><title>Claudia</title><script type="module" src="/assets/app.js"></script></head><body><div id="root"></div></body></html>';
const HOME_TAGS = '<meta name="robots" content="noindex, nofollow, noarchive" data-ssr-seo="/"><meta name="description" content="Inicio" data-ssr-seo="/"><link rel="canonical" href="https://claudiasanchez.example/" data-ssr-seo="/">';
const TEMPLATE = SHELL.replace('<title>Claudia</title>', '<title>Inicio | Claudia</title>').replace('</head>', `${HOME_TAGS}</head>`);
const BASE = {
  id: 'a1', site_id: 's1', slug: 'en-manos-de-quien-dejarias-tu-carrera', title: '¿En manos de quién dejarías tu carrera?', excerpt: null,
  cover_image: 'claudia/portada.jpg', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cuerpo del artículo.' }] }] },
  published_at: '2026-10-22T18:14:40Z', original_published_at: '2024-11-13T00:00:00Z', source_url: null, created_at: '2026-10-22T18:14:40Z', updated_at: '2026-10-23T00:00:00Z',
  seo_title: null, meta_description: null, cover_image_alt: null, canonical_url: null, noindex: false,
};
const WITH_SEO = {
  ...BASE,
  seo_title: 'Coach, advisor o headhunter: a quién confiar tu carrera',
  meta_description: 'Diferencias entre coach de empleabilidad, advisor, coach certificado y headhunter para decidir con criterio en tu transición ejecutiva.',
  cover_image_alt: 'Claudia Sánchez Urencio sonriendo junto al título "How To Thrive beyond 40"',
  canonical_url: 'https://claudiasanchez.example/articulos/a-quien-confiar-tu-carrera',
};
const finalEnv = { VITE_SITE_URL: SITE, VITE_SEO_ALLOW_INDEXING: 'true', VERCEL_ENV: 'production' };
const blocked = seoPolicy({ VITE_SITE_URL: SITE }, 'claudiasanchez.example');
const open = seoPolicy(finalEnv, 'claudiasanchez.example');
const render = (article, policy = blocked) => articleResponse({ status: 'found', article }, { template: TEMPLATE, policy, labels: LABELS, mediaBase: MEDIA });
const jsonLdOf = html => JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
const single = (html, label) => {
  for (const tag of ['<title>', '<meta name="robots"', '<meta name="description"', 'rel="canonical"', 'property="og:title"', 'type="application/ld+json"']) {
    assert.ok(count(html, new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) <= 1, `${label}: ${tag} duplicado`);
  }
};

// 1. Artículo con SEO del CMS.
{
  const html = render(WITH_SEO).body;
  single(html, 'con SEO');
  assert.ok(html.includes('<title>Coach, advisor o headhunter: a quién confiar tu carrera</title>'), 'seo_title tal cual');
  assert.ok(html.includes('<meta property="og:title" content="Coach, advisor o headhunter: a quién confiar tu carrera"'));
  assert.ok(html.includes(`<meta name="description" content="${WITH_SEO.meta_description}"`), 'meta_description completa, sin recortar');
  assert.ok(html.includes('<link rel="canonical" href="https://claudiasanchez.example/articulos/a-quien-confiar-tu-carrera"'), 'canonical_url del CMS');
  assert.ok(html.includes('alt="Claudia Sánchez Urencio sonriendo junto al título &quot;How To Thrive beyond 40&quot;"'), 'Alt de la imagen destacada');
  assert.ok(html.includes('<meta property="og:image:alt" content="Claudia Sánchez Urencio sonriendo'));
  assert.ok(html.includes('<h1>¿En manos de quién dejarías tu carrera?</h1>'), 'El h1 sigue siendo el título editorial');
  const ld = jsonLdOf(html);
  assert.equal(ld.headline, BASE.title);
  assert.equal(ld.description, WITH_SEO.meta_description);
  assert.equal(ld.mainEntityOfPage, WITH_SEO.canonical_url, 'JSON-LD sincronizado con el canonical');
  assert.ok(!html.includes('content="Inicio"') && !html.includes('href="https://claudiasanchez.example/"'), 'Sin los metadatos de inicio de la plantilla');
  console.log('SEO CMS OK: artículo con seo_title, meta_description, alt, canonical y JSON-LD sincronizados');
}

// 2. Artículo sin SEO del CMS: fallbacks de la Etapa 1.
{
  const html = render(BASE).body;
  single(html, 'sin SEO');
  assert.ok(html.includes('<title>¿En manos de quién dejarías tu carrera? | Claudia Sánchez Urencio</title>'));
  assert.ok(html.includes('<meta name="description" content="Cuerpo del artículo."'), 'Sin meta_description ni extracto: comienzo del cuerpo');
  assert.ok(render({ ...BASE, excerpt: 'Extracto editorial.' }).body.includes('<meta name="description" content="Extracto editorial."'), 'Fallback al extracto');
  assert.ok(html.includes('<img class="article-hero" src="https://example.supabase.co/storage/v1/object/public/article-media/claudia/portada.jpg" alt=""'), 'Sin alt: decorativa');
  assert.ok(!html.includes('og:image:alt'));
  assert.ok(html.includes(`<link rel="canonical" href="${SITE}/articulos/${BASE.slug}"`), 'Canonical del dominio definitivo');
  assert.ok(render({ ...BASE, seo_title: '   ', meta_description: '' }).body.includes('<title>¿En manos de quién dejarías tu carrera? | Claudia Sánchez Urencio</title>'), 'Campos vacíos no cuentan');
  console.log('SEO CMS OK: artículo sin SEO del CMS conserva los fallbacks');
}

// 3. canonical_url inválida: se ignora.
for (const url of ['https://claudia-sanchez.vercel.app/articulos/x', 'http://claudiasanchez.example/x', 'javascript:alert(1)', 'https://localhost/x', 'https://user:pw@claudiasanchez.example/x', '/articulos/x', 'no es url']) {
  const html = render({ ...BASE, canonical_url: url }, seoPolicy({}, 'x')).body;
  assert.ok(!html.includes('rel="canonical"'), `canonical rechazada: ${url}`);
}
assert.equal(publicUrl('https://claudiasanchez.example/a?b=1'), 'https://claudiasanchez.example/a?b=1');
console.log('SEO CMS OK: canonical_url solo si es https pública y no temporal');

// 4. Indexación: noindex=false nunca levanta el bloqueo global; noindex=true siempre restringe.
assert.ok(render(BASE, blocked).body.includes(`content="${NOINDEX}"`), 'Bloqueo global vigente');
assert.equal(render(BASE, blocked).headers['X-Robots-Tag'], NOINDEX);
assert.ok(render(BASE, open).body.includes(`content="${INDEX}"`), 'Con el bloqueo levantado en el dominio final se indexa');
assert.equal(render(BASE, open).headers['X-Robots-Tag'], undefined);
assert.ok(render({ ...BASE, noindex: true }, open).body.includes(`content="${NOINDEX}"`), 'noindex individual aun con indexación global');
assert.equal(render({ ...BASE, noindex: true }, open).headers['X-Robots-Tag'], NOINDEX);
for (const route of ['/404', '/gracias']) {
  assert.equal(resolveRobots({ indexing: true, noindex: false, route }), NOINDEX, `${route} siempre fuera de indexación`);
}
assert.equal(resolveRobots({ indexing: false, noindex: false, route: '/' }), NOINDEX);
assert.equal(resolveRobots({ indexing: true, noindex: false, route: '/' }), INDEX);
assert.equal(globalIndexing({ allow: 'true', siteUrl: 'https://claudia-sanchez.vercel.app', host: 'claudia-sanchez.vercel.app' }), false, 'Nunca en el dominio temporal');
assert.equal(globalIndexing({ allow: 'true', siteUrl: SITE }), true, 'En el build (sin host) cuentan autorización y dominio');
assert.equal(globalIndexing({ allow: '1', siteUrl: SITE, host: 'claudiasanchez.example' }), false, 'Solo "true" autoriza');
console.log('SEO CMS OK: bloqueo global, noindex individual y /404 y /gracias siempre fuera');

// 5. Páginas: get_public_page_seo > sección seo (si no está oculta) > nada.
const section = { title: 'Para personas | Claudia Sánchez Urencio', description: 'Descripción de la sección.' };
assert.deepEqual(resolvePageSeo({ pageSeo: null, section, hidden: false }), { title: section.title, description: section.description, canonical: null, noindex: false });
assert.deepEqual(resolvePageSeo({ pageSeo: { seo_title: 'SEO de página', meta_description: 'Desc. CMS', canonical_url: `${SITE}/p`, noindex: true }, section, hidden: false }),
  { title: 'SEO de página', description: 'Desc. CMS', canonical: `${SITE}/p`, noindex: true });
assert.deepEqual(resolvePageSeo({ pageSeo: { seo_title: '', meta_description: null, noindex: false }, section, hidden: true }), { title: undefined, description: undefined, canonical: null, noindex: false }, 'Sección oculta: sin título ni descripción');
assert.equal(resolveCanonical({ cmsCanonical: null, origin: null, path: '/personas' }), '', 'Sin dominio ni canonical_url: ninguno');
console.log('SEO CMS OK: fallbacks seguros de páginas');

// 6. HTML por página del build.
{
  const manifest = { site: { key: 'claudia-sanchez' }, pages: ['/', '/personas', '/gracias', '/articulos/:slug', '/404', '/diseno-de-carrera'].map(route => ({ route })) };
  const sources = await loadPageSeoSources(process.cwd());
  const snapshot = {
    site: 'claudia-sanchez', globals: {}, hidden: ['/diseno-de-carrera::seo'],
    sections: { '/personas::seo': { title: 'Personas (CMS) | Claudia Sánchez Urencio', description: 'Desc. de la sección en el CMS' } },
    pageSeo: {
      '/': { seo_title: 'Coaching ejecutivo | Claudia Sánchez Urencio', meta_description: 'Meta de inicio desde el CMS', canonical_url: null, noindex: false },
      '/personas': { seo_title: null, meta_description: null, canonical_url: 'https://claudia-sanchez.vercel.app/personas', noindex: false },
      '/gracias': { seo_title: null, meta_description: null, canonical_url: null, noindex: false },
      '/404': null,
      '/diseno-de-carrera': { seo_title: null, meta_description: null, canonical_url: null, noindex: true },
    },
  };
  const pages = prerenderPages({ template: SHELL, manifest, snapshot, sources, env: finalEnv });
  const byRoute = Object.fromEntries(pages.map(page => [page.route, page]));
  assert.deepEqual(pages.map(page => page.file), ['index.html', 'personas/index.html', 'gracias/index.html', '404.html', 'diseno-de-carrera/index.html'], 'Sin /articulos/:slug');
  for (const page of pages) {
    single(page.html, page.route);
    assert.ok(page.html.includes('<div id="root"></div>') && page.html.includes('/assets/app.js'), `${page.route}: la SPA monta igual`);
  }
  assert.ok(byRoute['/'].html.includes('<title>Coaching ejecutivo | Claudia Sánchez Urencio</title>') && byRoute['/'].html.includes('content="Meta de inicio desde el CMS"'), 'SEO de página del CMS');
  assert.ok(byRoute['/'].html.includes(`content="${INDEX}" data-ssr-seo="/"`) && byRoute['/'].html.includes(`<link rel="canonical" href="${SITE}/"`));
  assert.ok(byRoute['/personas'].html.includes('<title>Personas (CMS) | Claudia Sánchez Urencio</title>'), 'Sin seo_title: sección seo del CMS');
  assert.ok(byRoute['/personas'].html.includes(`<link rel="canonical" href="${SITE}/personas"`), 'canonical_url temporal ignorada: dominio definitivo');
  assert.ok(byRoute['/gracias'].html.includes(`content="${NOINDEX}"`), '/gracias fuera de indexación');
  assert.ok(byRoute['/404'].html.includes(`content="${NOINDEX}"`) && !byRoute['/404'].html.includes('rel="canonical"'), '/404 sin canonical y fuera de indexación');
  assert.ok(byRoute['/404'].html.includes('<title>Página no encontrada | Claudia Sánchez Urencio</title>'), 'Fallback local');
  const landing = byRoute['/diseno-de-carrera'].html;
  assert.ok(landing.includes(`content="${NOINDEX}"`), 'noindex de la página');
  assert.ok(landing.includes('<title>Claudia</title>') && !landing.includes('name="description"'), 'Sección seo oculta: se conserva el título de la plantilla y no hay descripción');
  const local = prerenderPages({ template: SHELL, manifest, snapshot: null, sources, env: {} });
  assert.ok(local.every(page => page.html.includes(`content="${NOINDEX}"`) && !page.html.includes('rel="canonical"')), 'Modo local y sin dominio: bloqueo y sin canonical');
  assert.ok(local.find(page => page.route === '/personas').html.includes('<title>Para personas | Claudia Sánchez Urencio</title>'), 'Modo local: fallback de content.js');
  assert.equal(outputFile('/comunidad-y-experiencias'), 'comunidad-y-experiencias/index.html');
  console.log('SEO CMS OK: HTML por página con SEO del CMS, fallbacks, robots y canonical');
}

// 7. Lectura de get_public_page_seo en el build.
assert.equal(parsePageSeo([]), null);
assert.deepEqual(parsePageSeo([{ page_key: 'inicio' }]), { page_key: 'inicio' });
assert.throws(() => parsePageSeo([{}, {}]));
assert.throws(() => parsePageSeo({}));
{
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push(JSON.parse(init.body)); return new Response(JSON.stringify(calls.at(-1).p_page_route === '/' ? [{ route: '/' }] : [])); };
  const manifest = { site: { key: 'claudia-sanchez' }, pages: [{ route: '/' }, { route: '/articulos/:slug' }, { route: '/personas' }] };
  const result = await fetchPageSeoSnapshot({ url: 'https://example.supabase.co/', key: 'sb_publishable_test', manifest, fetchImpl, attempts: 1 });
  assert.deepEqual(result, { '/': { route: '/' }, '/personas': null });
  assert.deepEqual(calls.map(call => call.p_page_route).sort(), ['/', '/personas'], 'Sin /articulos/:slug');
  assert.ok(calls.every(call => call.p_site_slug === 'claudia-sanchez'));
  await assert.rejects(fetchPageSeoSnapshot({ url: 'https://example.supabase.co', key: 'sb_publishable_test', manifest, attempts: 1, fetchImpl: async () => new Response('{}', { status: 401 }) }), /SEO de/);
  console.log('SEO CMS OK: lectura de get_public_page_seo en el build');
}
