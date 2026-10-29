// Función de Vercel para /articulos/:slug (rewrite en vercel.json): entrega el artículo publicado como HTML completo
// (título, metadatos, JSON-LD y cuerpo) sobre el index.html del build, y React monta encima como en el resto del sitio.
// 200 publicado · 404 inexistente o no publicado · 503 Supabase no disponible · 500 configuración incompleta.
import { readFile } from 'node:fs/promises';
import { fetchPublishedArticle } from './_lib/articleSource.js';
import { articleResponse, assertTemplate, seoPolicy } from './_lib/articlePage.js';

// Las rutas deben quedar literales: el trazado de archivos de Vercel copia así dist/index.html (generado por
// `vite build`, que corre antes) y content.json dentro de la función. `includeFiles` no sirve para dist/: se resuelve
// sobre los archivos previos al build.
let template;
const readTemplate = () => template ??= readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
  .then(html => { assertTemplate(html); return html; })
  .catch(error => { template = undefined; throw error; });

// Textos fijos de la vista (volver, colección, firma): los de respaldo local; React aplica los del CMS al montar.
let labels;
const readLabels = () => labels ??= readFile(new URL('../src/data/institutional/content.json', import.meta.url), 'utf8')
  .then(json => JSON.parse(json)['/articulos/:slug'] || {})
  .catch(() => ({}));

const isValidSlug = slug => typeof slug === 'string' && slug.length > 0 && slug.length <= 200
  && ![...slug].some(char => char.charCodeAt(0) < 32 || char === '/' || char.charCodeAt(0) === 92);

function send(res, method, { status, headers, body }) {
  res.statusCode = status;
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(method === 'HEAD' ? undefined : body);
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, req.method, { status: 405, headers: { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Method Not Allowed' });
    return;
  }
  let html;
  try {
    html = await readTemplate();
  } catch (error) {
    console.error('[articulo] No se pudo leer dist/index.html:', error.message);
    send(res, req.method, { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, body: 'Error interno' });
    return;
  }
  const slug = new URL(req.url, 'http://localhost').searchParams.get('slug');
  const result = isValidSlug(slug) ? await fetchPublishedArticle(slug, { env: process.env }) : { status: 'missing' };
  if (result.error) console.error(`[articulo] ${result.status} (${slug}):`, result.error.message);
  const policy = seoPolicy(process.env, req.headers['x-forwarded-host'] || req.headers.host);
  send(res, req.method, articleResponse(result, { template: html, policy, labels: await readLabels(), mediaBase: process.env.VITE_SUPABASE_URL?.trim() }));
}
