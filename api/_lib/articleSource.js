// Lectura pública de un artículo para api/articulo.js: misma RPC y misma clave pública que usa el sitio en el navegador.
// Solo devuelve artículos publicados (la RPC no expone borradores).
import { assertPublicKey } from '../../scripts/cms-snapshot-plugin.mjs';

export const SITE_SLUG = 'claudia-sanchez';

/**
 * { status: 'found', article } | { status: 'missing' }
 * | { status: 'unavailable', error }  → Supabase no respondió o falló temporalmente (503)
 * | { status: 'misconfigured', error } → faltan variables o la RPC rechazó la consulta (500)
 */
export async function fetchPublishedArticle(slug, { env, fetchImpl = fetch, timeoutMs = 6000 }) {
  const url = env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const key = env.VITE_SUPABASE_ANON_KEY?.trim();
  try {
    if (!url) throw new Error('Falta VITE_SUPABASE_URL.');
    if (new URL(url).protocol !== 'https:') throw new Error('VITE_SUPABASE_URL debe utilizar HTTPS.');
    assertPublicKey(key);
  } catch (error) {
    return { status: 'misconfigured', error };
  }
  let response;
  try {
    response = await fetchImpl(`${url}/rest/v1/rpc/get_published_articles`, {
      method: 'POST',
      headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ p_site_slug: SITE_SLUG, p_article_slug: slug }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    return { status: 'unavailable', error };
  }
  if (response.status >= 500 || response.status === 408 || response.status === 429) {
    return { status: 'unavailable', error: new Error(`HTTP ${response.status}`) };
  }
  if (!response.ok) return { status: 'misconfigured', error: new Error(`HTTP ${response.status}`) };
  let data;
  try {
    data = await response.json();
  } catch (error) {
    return { status: 'unavailable', error };
  }
  if (!Array.isArray(data)) return { status: 'unavailable', error: new Error('Respuesta inesperada de get_published_articles.') };
  const article = data.find(row => row && row.slug === slug && typeof row.title === 'string' && row.title.trim()
    && Number.isFinite(Date.parse(row.published_at)));
  return article ? { status: 'found', article } : { status: 'missing' };
}
