// Reglas de presentación de artículos compartidas por React y por la función de Vercel que los renderiza en el servidor
// (api/articulo.js). Sin dependencias de navegador ni de import.meta.env.

export const ARTICLE_AUTHOR = 'Claudia Sánchez Urencio';

export const editorialDate = article => article.original_published_at || article.published_at;

export const formatDate = value => new Intl.DateTimeFormat('es', {dateStyle:'long',timeZone:'UTC'}).format(new Date(value));

export const articleTitle = article => `${article.title} | ${ARTICLE_AUTHOR}`;

export function plainText(node) {
  if (!node || typeof node !== 'object') return '';
  return [typeof node.text === 'string' ? node.text : '', ...(Array.isArray(node.content) ? node.content.map(plainText) : [])].join(' ');
}

/** Descripción provisional: el extracto si existe; si no, el comienzo del cuerpo. */
export const articleDescription = article => (article.excerpt || plainText(article.content)).replace(/\s+/g,' ').trim().slice(0,160);

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
