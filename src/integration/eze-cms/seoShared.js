// Reglas SEO compartidas por React (Seo.jsx, usePrivateDocument), la función de artículos (api/articulo.js) y el HTML
// por ruta que se genera en el build (scripts/seo-prerender-plugin.mjs). Sin dependencias de navegador ni de import.meta.env.

export const NOINDEX = 'noindex, nofollow, noarchive';
export const INDEX = 'index, follow, max-image-preview:large';

/** Fuera de indexación siempre, cualquiera sea la configuración global o la del CMS. */
export const ALWAYS_NOINDEX_ROUTES = new Set(['/404', '/gracias']);

const text = value => typeof value === 'string' ? value.trim() : '';

const isTemporaryHost = host => host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.vercel.app')
  || /^[\d.]+$/.test(host) || host.startsWith('[');

/** URL absoluta https, sin credenciales, en un dominio que no sea localhost, una IP ni *.vercel.app. Si no, ''. */
export function publicUrl(value) {
  try {
    const url = new URL(text(value));
    return url.protocol === 'https:' && !url.username && !url.password && !isTemporaryHost(url.hostname) ? url.href : '';
  } catch {
    return '';
  }
}

/** Origen del dominio definitivo (VITE_SITE_URL), o null mientras no esté configurado. */
export function siteOrigin(siteUrl) {
  const url = publicUrl(siteUrl);
  return url ? new URL(url).origin : null;
}

/**
 * Bloqueo global de indexación. Solo se levanta con autorización explícita (VITE_SEO_ALLOW_INDEXING=true), el dominio
 * definitivo configurado y la petición llegando por ese mismo host. En el build no hay host: cuenta la autorización y
 * el dominio, y el navegador vuelve a bloquear si el sitio se sirve desde otro host. `deployEnv` (p. ej. VERCEL_ENV)
 * bloquea los entornos que no son de producción cuando el hosting lo informa.
 */
export function globalIndexing({ allow, siteUrl, host, deployEnv }) {
  const origin = siteOrigin(siteUrl);
  if (allow !== 'true' || !origin) return false;
  if (deployEnv && deployEnv !== 'production') return false;
  return host === undefined || String(host).toLowerCase() === new URL(origin).host;
}

/** El `noindex` del CMS solo restringe: `noindex = false` nunca levanta el bloqueo global ni el de /404 y /gracias. */
export const resolveRobots = ({ indexing, noindex, route }) =>
  indexing === true && noindex !== true && !ALWAYS_NOINDEX_ROUTES.has(route) ? INDEX : NOINDEX;

/** `canonical_url` del CMS si es pública y válida; si no, dominio definitivo + ruta; si no hay dominio, ninguno. */
export const resolveCanonical = ({ cmsCanonical, origin, path }) =>
  publicUrl(cmsCanonical) || (origin ? new URL(path, origin).href : '');

/**
 * Título y descripción de una página: los de get_public_page_seo y, si faltan, los de la sección `seo` (salvo que esté
 * oculta en el CMS). Sin ninguno, `undefined`: se conserva lo que ya tenga el documento.
 */
export function resolvePageSeo({ pageSeo, section, hidden }) {
  const local = hidden ? {} : section || {};
  return {
    title: text(pageSeo?.seo_title) || text(local.title) || undefined,
    description: text(pageSeo?.meta_description) || text(local.description) || undefined,
    canonical: pageSeo?.canonical_url ?? null,
    noindex: pageSeo?.noindex === true,
  };
}
