// Documento HTML y respuesta HTTP de /articulos/:slug (api/articulo.js), a partir de dist/index.html del mismo build.
import { safeImage } from '../../src/utils/safeUrl.js';
import { ARTICLE_AUTHOR, articleCoverAlt, articleDescription, articleJsonLd, articleMediaUrlFrom, articleTitle } from '../../src/integration/eze-cms/articleShared.js';
import { NOINDEX, globalIndexing, resolveCanonical, resolveRobots, siteOrigin } from '../../src/integration/eze-cms/seoShared.js';
import { jsonForScript, renderArticleMain } from './articleHtml.js';
import { fillTemplate, seoHeadTags, stripSeoTags } from './seoDocument.js';

export { assertTemplate } from './seoDocument.js';

/** Dominio definitivo (canonical) y bloqueo global de indexación para esta petición. Reglas: seoShared.js. */
export function seoPolicy(env, requestHost) {
  return {
    origin: siteOrigin(env.VITE_SITE_URL),
    indexing: globalIndexing({ allow: env.VITE_SEO_ALLOW_INDEXING, siteUrl: env.VITE_SITE_URL, host: requestHost || '', deployEnv: env.VERCEL_ENV }),
  };
}

// Misma estructura que Layout (.claudia-root.institutional define variables, anchos y tipografías) y una cabecera vacía
// con sus clases reales: el CSS le da la altura de la navbar en cada breakpoint, así el artículo no se mueve cuando
// React monta la cabecera y el pie. No replica el contenido de la navbar ni del footer.
const layoutShell = main => '<div class="claudia-root institutional">'
  + '<header class="institutional-header" aria-hidden="true"><div class="site-container header-row"></div></header>'
  + `<main id="contenido" tabindex="-1">${main}</main></div>`;

/** Metadatos del artículo: CMS (seo_title, meta_description, canonical_url, noindex, cover_image_alt) con sus fallbacks. */
export function articleSeo(article, { policy, mediaBase }) {
  const path = `/articulos/${encodeURIComponent(article.slug)}`;
  const canonical = resolveCanonical({ cmsCanonical: article.canonical_url, origin: policy.origin, path });
  const cover = safeImage(articleMediaUrlFrom(mediaBase, article.cover_image));
  const image = cover && (canonical || cover.startsWith('http')) ? new URL(cover, canonical || undefined).href : '';
  const description = articleDescription(article);
  return {
    path,
    canonical,
    image,
    description,
    title: articleTitle(article),
    robots: resolveRobots({ indexing: policy.indexing, noindex: article.noindex, route: '/articulos/:slug' }),
  };
}

export function renderArticleDocument(template, { article, policy, labels, mediaBase }) {
  const seo = articleSeo(article, { policy, mediaBase });
  const head = seoHeadTags({
    ...seo,
    type: 'article',
    siteName: ARTICLE_AUTHOR,
    imageAlt: articleCoverAlt(article),
    jsonLd: articleJsonLd(article, seo),
  });
  return fillTemplate(stripSeoTags(template), {
    title: seo.title,
    head,
    root: layoutShell(renderArticleMain(article, { labels, mediaBase })),
    // useCmsArticles lo toma como estado inicial: React monta el artículo sin pasar por "Cargando".
    body: `<script type="application/json" id="ssr-article">${jsonForScript(article)}</script>`,
  });
}

/** 404 y errores: la SPA de siempre (React muestra su vista de inexistente o reintenta), con el estado HTTP correcto. */
export function renderStatusDocument(template, { status, labels }) {
  const missingTitle = labels.contenido?.missingTitle;
  const title = status === 404 && missingTitle ? `${missingTitle} | ${ARTICLE_AUTHOR}` : ARTICLE_AUTHOR;
  return fillTemplate(stripSeoTags(template), { title, head: `<meta name="robots" content="${NOINDEX}">` });
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
    const indexable = articleSeo(result.article, { policy, mediaBase }).robots !== NOINDEX;
    return {
      status: 200,
      headers: { ...html, 'Cache-Control': CACHE.found, ...(indexable ? {} : { 'X-Robots-Tag': NOINDEX }) },
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
