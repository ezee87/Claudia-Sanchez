// HTML inicial con metadatos SEO, común a la función de artículos (api/articulo.js) y al HTML por ruta que genera el
// build (scripts/seo-prerender-plugin.mjs). Las etiquetas llevan data-ssr-seo="<ruta>": Seo.jsx y usePrivateDocument
// las conservan mientras la URL no cambia y las retiran al navegar a otra.
import { escapeHtml, jsonForScript } from './articleHtml.js';

const ROOT = '<div id="root"></div>';
const TITLE = /<title>[\s\S]*?<\/title>/;

export function assertTemplate(template) {
  if (typeof template !== 'string' || !template.includes(ROOT) || !TITLE.test(template) || !template.includes('</head>')) {
    throw new Error('La plantilla HTML no tiene la estructura esperada (<title>, </head> y <div id="root"></div>).');
  }
}

/** Retira las etiquetas SEO que ya traiga la plantilla (dist/index.html lleva las de la página de inicio). */
export const stripSeoTags = html => html
  .replace(/<script\b[^>]*\sdata-ssr-seo="[^"]*"[^>]*>[\s\S]*?<\/script>/g, '')
  .replace(/<(?:meta|link)\b[^>]*\sdata-ssr-seo="[^"]*"[^>]*>/g, '');

/** Sin `title`, se conserva el de la plantilla. */
export function fillTemplate(template, { title, head = '', root = '', body = '' }) {
  return template
    .replace(TITLE, match => title ? `<title>${escapeHtml(title)}</title>` : match)
    .replace('</head>', () => `${head}</head>`)
    .replace(ROOT, () => `<div id="root">${root}</div>${body}`);
}

/** Etiquetas SEO del `<head>`. Las vacías se omiten (sin canonical si no hay dominio ni canonical_url válida). */
export function seoHeadTags({ path, robots, title, description, canonical, type = 'website', siteName, image, imageAlt, jsonLd }) {
  const mark = ` data-ssr-seo="${escapeHtml(path)}"`;
  const meta = (attr, key, value) => value ? `<meta ${attr}="${key}" content="${escapeHtml(value)}"${mark}>` : '';
  return [
    meta('name', 'robots', robots),
    meta('name', 'description', description),
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}"${mark}>` : '',
    meta('property', 'og:type', type),
    meta('property', 'og:site_name', siteName),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('property', 'og:url', canonical),
    meta('property', 'og:image', image),
    meta('property', 'og:image:alt', image && imageAlt),
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary'),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', description),
    meta('name', 'twitter:image', image),
    meta('name', 'twitter:image:alt', image && imageAlt),
    jsonLd ? `<script type="application/ld+json"${mark}>${jsonForScript(jsonLd)}</script>` : '',
  ].filter(Boolean).join('');
}

/** HTML inicial de una página normal: solo metadatos; el contenido lo monta React como siempre. */
export function renderPageDocument(template, { path, title, description, robots, canonical, siteName }) {
  return fillTemplate(stripSeoTags(template), { title, head: seoHeadTags({ path, robots, title, description, canonical, siteName }) });
}
