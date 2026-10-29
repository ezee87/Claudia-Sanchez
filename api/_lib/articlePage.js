// Documento HTML y respuesta HTTP de /articulos/:slug (api/articulo.js), a partir de dist/index.html del mismo build.
import { safeImage } from '../../src/utils/safeUrl.js';
import { ARTICLE_AUTHOR, articleDescription, articleJsonLd, articleMediaUrlFrom, articleTitle } from '../../src/integration/eze-cms/articleShared.js';
import { escapeHtml, jsonForScript, renderArticleMain } from './articleHtml.js';

const NOINDEX = 'noindex, nofollow, noarchive';
const ROOT = '<div id="root"></div>';

/**
 * Canonical: solo con VITE_SITE_URL https y un dominio que no sea localhost, una IP ni *.vercel.app.
 * Indexable: además, despliegue de producción, SEO_ALLOW_INDEXING=true y la petición llega por ese mismo dominio.
 */
export function seoPolicy(env, requestHost) {
  let origin = null;
  try {
    const url = new URL(env.VITE_SITE_URL);
    const host = url.hostname;
    const temporary = host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.vercel.app')
      || /^[\d.]+$/.test(host) || host.startsWith('[');
    if (url.protocol === 'https:' && !temporary) origin = url.origin;
  } catch { /* sin dominio definitivo configurado */ }
  const indexable = Boolean(origin) && env.VERCEL_ENV === 'production' && env.SEO_ALLOW_INDEXING === 'true'
    && String(requestHost || '').toLowerCase() === new URL(origin).host;
  return { origin, indexable, robots: indexable ? 'index, follow, max-image-preview:large' : NOINDEX };
}

export function assertTemplate(template) {
  if (typeof template !== 'string' || !template.includes(ROOT) || !/<title>[\s\S]*?<\/title>/.test(template) || !template.includes('</head>')) {
    throw new Error('dist/index.html no tiene la estructura esperada (<title>, </head> y <div id="root"></div>).');
  }
}

/** Sin `title`, se conserva el de la plantilla. */
function fillTemplate(template, { title, head, root = '', body = '' }) {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, match => title ? `<title>${escapeHtml(title)}</title>` : match)
    .replace('</head>', () => `${head}</head>`)
    .replace(ROOT, () => `<div id="root">${root}</div>${body}`);
}

// Misma estructura que Layout (.claudia-root.institutional define variables, anchos y tipografías) y una cabecera vacía
// con sus clases reales: el CSS le da la altura de la navbar en cada breakpoint, así el artículo no se mueve cuando
// React monta la cabecera y el pie. No replica el contenido de la navbar ni del footer.
const layoutShell = main => '<div class="claudia-root institutional">'
  + '<header class="institutional-header" aria-hidden="true"><div class="site-container header-row"></div></header>'
  + `<main id="contenido" tabindex="-1">${main}</main></div>`;

export function renderArticleDocument(template, { article, policy, labels, mediaBase }) {
  const path = `/articulos/${encodeURIComponent(article.slug)}`;
  const canonical = policy.origin ? `${policy.origin}${path}` : '';
  const title = articleTitle(article);
  const description = articleDescription(article);
  const cover = safeImage(articleMediaUrlFrom(mediaBase, article.cover_image));
  const image = cover && (canonical || cover.startsWith('http')) ? new URL(cover, canonical || undefined).href : '';
  // data-ssr-seo: Seo.jsx conserva estas etiquetas mientras la URL no cambie y las retira al navegar.
  const mark = ` data-ssr-seo="${escapeHtml(path)}"`;
  const meta = (attr, key, value) => value ? `<meta ${attr}="${key}" content="${escapeHtml(value)}"${mark}>` : '';
  const head = [
    meta('name', 'robots', policy.robots),
    meta('name', 'description', description),
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}"${mark}>` : '',
    meta('property', 'og:type', 'article'),
    meta('property', 'og:site_name', ARTICLE_AUTHOR),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('property', 'og:url', canonical),
    meta('property', 'og:image', image),
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary'),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', description),
    meta('name', 'twitter:image', image),
    `<script type="application/ld+json"${mark}>${jsonForScript(articleJsonLd(article, { canonical, image, description }))}</script>`,
  ].filter(Boolean).join('');
  return fillTemplate(template, {
    title,
    head,
    root: layoutShell(renderArticleMain(article, { labels, mediaBase })),
    // useCmsArticles lo toma como estado inicial: React monta el artículo sin pasar por "Cargando".
    body: `<script type="application/json" id="ssr-article">${jsonForScript(article)}</script>`,
  });
}

/** 404 y errores: la SPA de siempre (React muestra su vista de inexistente o reintenta), con el estado HTTP correcto. */
export function renderStatusDocument(template, { status, labels }) {
  const missingTitle = labels.contenido?.missingTitle;
  const title = status === 404 && missingTitle ? `${missingTitle} | ${ARTICLE_AUTHOR}` : '';
  return fillTemplate(template, { title, head: `<meta name="robots" content="${NOINDEX}">` });
}

const CACHE = {
  found: 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  missing: 'public, max-age=0, s-maxage=60',
  error: 'no-store',
};

/** { status, headers, body } según el resultado de fetchPublishedArticle. */
export function articleResponse(result, { template, policy, labels, mediaBase }) {
  const html = { 'Content-Type': 'text/html; charset=utf-8' };
  if (result.status === 'found') {
    return {
      status: 200,
      headers: { ...html, 'Cache-Control': CACHE.found, ...(policy.indexable ? {} : { 'X-Robots-Tag': NOINDEX }) },
      body: renderArticleDocument(template, { article: result.article, policy, labels, mediaBase }),
    };
  }
  if (result.status === 'missing') {
    return { status: 404, headers: { ...html, 'Cache-Control': CACHE.missing, 'X-Robots-Tag': NOINDEX }, body: renderStatusDocument(template, { status: 404, labels }) };
  }
  const status = result.status === 'unavailable' ? 503 : 500;
  return {
    status,
    headers: { ...html, 'Cache-Control': CACHE.error, 'X-Robots-Tag': NOINDEX, ...(status === 503 ? { 'Retry-After': '30' } : {}) },
    body: renderStatusDocument(template, { status, labels }),
  };
}
