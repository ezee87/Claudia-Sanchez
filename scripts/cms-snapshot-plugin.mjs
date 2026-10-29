// Contenido CMS generado durante el build (Etapa 5B.2).
// En `vite build` con modo CMS, lee de Supabase, mediante las RPC públicas y la clave pública, las secciones y los globales que
// declara el manifiesto, y los entrega como módulo virtual `virtual:eze-cms-snapshot`, que los hooks usan como estado inicial.
// El índice público (get_public_section_index) distingue las secciones ocultas, que se registran como tales y no se leen,
// de las inexistentes. Si falta algo o Supabase no responde, el build falla. En modo local (VITE_CMS_LOCAL_ONLY=true) y en `vite dev` no hace
// ninguna consulta y el módulo vale null. Nunca escribe en Supabase.
import fs from 'node:fs';
import path from 'node:path';

const VIRTUAL_ID = 'virtual:eze-cms-snapshot';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const MANIFEST = 'src/integration/eze-cms/claudia-sanchez.manifest.json';

/** Misma regla que `resolveCmsLocalOnly` de src/integration/eze-cms/cmsMode.ts (el test verifica que coincidan). */
export function resolveCmsLocalOnly(value, dev) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return dev;
}

/** Solo admite la clave publicable o un JWT con rol anon: una clave de servicio nunca debe llegar al bundle. */
export function assertPublicKey(key) {
  if (!key) throw new Error('Falta VITE_SUPABASE_ANON_KEY.');
  if (key.startsWith('sb_publishable_')) return;
  if (key.startsWith('sb_secret_')) throw new Error('VITE_SUPABASE_ANON_KEY es una clave secreta; solo se admite la clave pública.');
  const parts = key.split('.');
  let role;
  try { role = parts.length === 3 ? JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role : undefined; } catch { role = undefined; }
  if (role !== 'anon') throw new Error(`VITE_SUPABASE_ANON_KEY no es una clave pública (rol: ${role ?? 'desconocido'}).`);
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Llama a una RPC pública. Reintenta ante fallas de red o 5xx; cualquier otra respuesta inesperada es un error. */
async function callRpc({ url, key, fetchImpl, timeoutMs, attempts }, fn, args, parse) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchImpl(`${url}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status >= 500) throw Object.assign(new Error(`HTTP ${response.status}`), { retry: true });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return parse(await response.json());
    } catch (error) {
      lastError = error;
      const retry = error.retry || error.name === 'TimeoutError' || error.name === 'TypeError';
      if (!retry || attempt === attempts) break;
      await wait(500 * attempt);
    }
  }
  throw lastError;
}

function parseRow(data) {
  if (!Array.isArray(data) || data.length !== 1) throw new Error(`se esperaba 1 fila y llegaron ${Array.isArray(data) ? data.length : 'datos no válidos'}`);
  if (!isObject(data[0]?.content)) throw new Error('la fila no tiene un objeto content');
  return data[0].content;
}

/**
 * Índice 'ruta::clave' → visible de las secciones del sitio. Solo `visible === true` es visible: false, null o cualquier otro
 * valor cuenta como oculta. Misma regla que `parseSectionIndex` de src/integration/eze-cms/cmsClient.ts (el test lo verifica).
 */
export function parseSectionIndex(data) {
  if (!Array.isArray(data)) throw new Error('el índice de secciones no es una lista');
  const index = new Map();
  for (const row of data) {
    if (!isObject(row) || typeof row.page_route !== 'string' || typeof row.section_key !== 'string') throw new Error('fila del índice de secciones no válida');
    const id = `${row.page_route}::${row.section_key}`;
    if (index.has(id)) throw new Error(`el índice de secciones repite ${id}`);
    index.set(id, row.visible === true);
  }
  return index;
}

/** Instantánea { site, sections: { 'ruta::clave': content }, hidden: ['ruta::clave'], globals: { clave: content } } del manifiesto. */
export async function fetchCmsSnapshot({ url, key, manifest, fetchImpl = fetch, timeoutMs = 15000, attempts = 3, concurrency = 8 }) {
  if (!url) throw new Error('Falta VITE_SUPABASE_URL.');
  const base = url.trim().replace(/\/$/, '');
  if (new URL(base).protocol !== 'https:') throw new Error('VITE_SUPABASE_URL debe utilizar HTTPS.');
  assertPublicKey(key?.trim());
  const site = manifest.site.key;
  const options = { url: base, key: key.trim(), fetchImpl, timeoutMs, attempts };
  let index;
  try { index = await callRpc(options, 'get_public_section_index', { site_slug: site }, parseSectionIndex); } catch (error) { throw new Error(`No se pudo obtener el índice de secciones: ${error.message}`); }
  const snapshot = { site, sections: {}, hidden: [], globals: {} };
  const failures = [];
  // Visible: se lee su contenido (y debe existir). Oculta: se registra y no se lee. Ausente del índice: error de integridad.
  const sections = manifest.pages.flatMap((page) => page.sections.map((section) => ({ page, section, id: `${page.route}::${section.key}` })));
  for (const { id } of sections) {
    if (!index.has(id)) failures.push(`${id}: no existe en Supabase`);
    else if (!index.get(id)) snapshot.hidden.push(id);
  }
  snapshot.hidden.sort();
  const tasks = [
    ...sections.filter(({ id }) => index.get(id) === true).map(({ page, section, id }) => ({
      id, kind: 'sections', fn: 'get_public_section',
      args: { site_slug: site, page_route: page.route, section_key: section.key },
    })),
    ...manifest.globals.map((group) => ({ id: group.key, kind: 'globals', fn: 'get_public_site_global', args: { site_slug: site, global_key: group.key } })),
  ];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      try { snapshot[task.kind][task.id] = await callRpc(options, task.fn, task.args, parseRow); } catch (error) { failures.push(`${task.kind === 'globals' ? 'global ' : ''}${task.id}: ${error.message}`); }
    }
  }));
  if (failures.length) throw new Error(`No se pudo obtener el contenido CMS (${failures.length} de ${sections.length + manifest.globals.length}):\n  ${failures.sort().join('\n  ')}`);
  return snapshot;
}

/** Fila de get_public_page_seo, o null si la ruta no está registrada. Más de una fila o datos no válidos son un error. */
export function parsePageSeo(data) {
  if (!Array.isArray(data) || data.length > 1) throw new Error(`se esperaba 0 o 1 fila y llegaron ${Array.isArray(data) ? data.length : 'datos no válidos'}`);
  if (data.length && !isObject(data[0])) throw new Error('la fila de SEO no es un objeto');
  return data[0] ?? null;
}

/** { ruta: fila de get_public_page_seo | null } de las páginas del manifiesto (sin /articulos/:slug: cada artículo trae el suyo). */
export async function fetchPageSeoSnapshot({ url, key, manifest, fetchImpl = fetch, timeoutMs = 15000, attempts = 3 }) {
  const options = { url: url.trim().replace(/\/$/, ''), key: key.trim(), fetchImpl, timeoutMs, attempts };
  const routes = manifest.pages.map((page) => page.route).filter((route) => route !== '/articulos/:slug');
  const rows = await Promise.all(routes.map(async (route) => {
    try { return [route, await callRpc(options, 'get_public_page_seo', { p_site_slug: manifest.site.key, p_page_route: route }, parsePageSeo)]; }
    catch (error) { throw new Error(`SEO de ${route}: ${error.message}`); }
  }));
  return Object.fromEntries(rows);
}

export function cmsSnapshotPlugin() {
  let snapshot = null;
  let config;
  return {
    name: 'eze-cms-snapshot',
    // Lo lee scripts/seo-prerender-plugin.mjs para escribir los metadatos de cada ruta con los mismos datos del build.
    api: { getSnapshot: () => snapshot },
    configResolved(resolved) { config = resolved; },
    async buildStart() {
      snapshot = null;
      if (config.command !== 'build') return;
      if (resolveCmsLocalOnly(config.env.VITE_CMS_LOCAL_ONLY, false)) {
        config.logger.info('[eze-cms] Modo local (VITE_CMS_LOCAL_ONLY=true): sin consultas a Supabase ni contenido CMS en el build.');
        return;
      }
      const manifest = JSON.parse(fs.readFileSync(path.resolve(config.root, MANIFEST), 'utf8'));
      try {
        const source = { url: config.env.VITE_SUPABASE_URL, key: config.env.VITE_SUPABASE_ANON_KEY, manifest };
        snapshot = await fetchCmsSnapshot(source);
        snapshot.pageSeo = await fetchPageSeoSnapshot(source);
      } catch (error) {
        this.error(`[eze-cms] Build detenido: el modo CMS necesita el contenido de Supabase. ${error.message}`);
      }
      config.logger.info(`[eze-cms] Contenido CMS incluido: ${Object.keys(snapshot.sections).length} secciones visibles, ${snapshot.hidden.length} ocultas, ${Object.keys(snapshot.globals).length} globales y SEO de ${Object.keys(snapshot.pageSeo).length} páginas.`);
    },
    resolveId(id) { return id === VIRTUAL_ID ? RESOLVED_ID : null; },
    load(id) { return id === RESOLVED_ID ? `export default ${JSON.stringify(snapshot)};` : null; },
  };
}
