// Reglas de presentación de artículos compartidas por React y por la función que los renderiza en el servidor
// (api/articulo.js). Sin dependencias de navegador ni de import.meta.env. Reglas de indexación: seoShared.js.

export const ARTICLE_AUTHOR = 'Claudia Sánchez Urencio';

export const editorialDate = article => article.original_published_at || article.published_at;

export const formatDate = value => new Intl.DateTimeFormat('es', {dateStyle:'long',timeZone:'UTC'}).format(new Date(value));

const text = value => typeof value === 'string' ? value.trim() : '';

/** `seo_title` del CMS tal cual (lo redacta el editor completo); si falta, el título editorial con la firma del sitio. */
export const articleTitle = article => text(article.seo_title) || `${article.title} | ${ARTICLE_AUTHOR}`;

export function plainText(node) {
  if (!node || typeof node !== 'object') return '';
  return [typeof node.text === 'string' ? node.text : '', ...(Array.isArray(node.content) ? node.content.map(plainText) : [])].join(' ');
}

/** `meta_description` del CMS completa; si falta, el extracto o el comienzo del cuerpo, recortados a 160 caracteres. */
export const articleDescription = article => text(article.meta_description)
  || (article.excerpt || plainText(article.content)).replace(/\s+/g,' ').trim().slice(0,160);

/** Texto alternativo de la portada; vacío (decorativa) si el CMS no lo define. */
export const articleCoverAlt = article => text(article.cover_image_alt);

/** Ruta del bucket público `article-media` o URL https absoluta; cualquier otro valor se descarta. */
export function articleMediaUrlFrom(supabaseUrl, path) {
  if (typeof path !== 'string' || !path.trim()) return '';
  if (/^https:\/\//i.test(path)) return path;
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(path)) return '';
  const base = (supabaseUrl || '').replace(/\/$/, '');
  return base ? `${base}/storage/v1/object/public/article-media/${path.split('/').map(encodeURIComponent).join('/')}` : '';
}

export function articleJsonLd(article, { canonical, image, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    ...(description ? { description } : {}),
    datePublished: editorialDate(article),
    ...(article.updated_at ? { dateModified: article.updated_at } : {}),
    inLanguage: 'es',
    author: { '@type': 'Person', name: ARTICLE_AUTHOR },
    ...(canonical ? { mainEntityOfPage: canonical, url: canonical } : {}),
    ...(image ? { image } : {}),
  };
}
