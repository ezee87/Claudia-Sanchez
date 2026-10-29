// Contenido CMS generado durante el build (Etapa 5B.2).
// En `vite build` con modo CMS, lee de Supabase, mediante las RPC públicas y la clave pública, las secciones y los globales que
// declara el manifiesto, y los entrega como módulo virtual `virtual:eze-cms-snapshot`, que los hooks usan como estado inicial.
// Si falta algo o Supabase no responde, el build falla. En modo local (VITE_CMS_LOCAL_ONLY=true) y en `vite dev` no hace
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

/** Lee una fila pública. Reintenta ante fallas de red o 5xx; cualquier otra respuesta inesperada es un error. */
async function readRow({ url, key, fetchImpl, timeoutMs, attempts }, fn, args) {
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
      const data = await response.json();
      if (!Array.isArray(data) || data.length !== 1) throw new Error(`se esperaba 1 fila y llegaron ${Array.isArray(data) ? data.length : 'datos no válidos'}`);
      if (!isObject(data[0]?.content)) throw new Error('la fila no tiene un objeto content');
      return data[0].content;
    } catch (error) {
      lastError = error;
      const retry = error.retry || error.name === 'TimeoutError' || error.name === 'TypeError';
      if (!retry || attempt === attempts) break;
      await wait(500 * attempt);
    }
  }
  throw lastError;
}

/** Instantánea { site, sections: { 'ruta::clave': content }, globals: { clave: content } } de lo que declara el manifiesto. */
export async function fetchCmsSnapshot({ url, key, manifest, fetchImpl = fetch, timeoutMs = 15000, attempts = 3, concurrency = 8 }) {
  if (!url) throw new Error('Falta VITE_SUPABASE_URL.');
  const base = url.trim().replace(/\/$/, '');
  if (new URL(base).protocol !== 'https:') throw new Error('VITE_SUPABASE_URL debe utilizar HTTPS.');
  assertPublicKey(key?.trim());
  const site = manifest.site.key;
  const tasks = [
    ...manifest.pages.flatMap((page) => page.sections.map((section) => ({
      id: `${page.route}::${section.key}`, kind: 'sections', fn: 'get_public_section',
      args: { site_slug: site, page_route: page.route, section_key: section.key },
    }))),
    ...manifest.globals.map((group) => ({ id: group.key, kind: 'globals', fn: 'get_public_site_global', args: { site_slug: site, global_key: group.key } })),
  ];
  const snapshot = { site, sections: {}, globals: {} };
  const failures = [];
  const options = { url: base, key: key.trim(), fetchImpl, timeoutMs, attempts };
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      try { snapshot[task.kind][task.id] = await readRow(options, task.fn, task.args); } catch (error) { failures.push(`${task.kind === 'globals' ? 'global ' : ''}${task.id}: ${error.message}`); }
    }
  }));
  if (failures.length) throw new Error(`No se pudo obtener el contenido CMS (${failures.length} de ${tasks.length}):\n  ${failures.sort().join('\n  ')}`);
  return snapshot;
}

export function cmsSnapshotPlugin() {
  let snapshot = null;
  let config;
  return {
    name: 'eze-cms-snapshot',
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
        snapshot = await fetchCmsSnapshot({ url: config.env.VITE_SUPABASE_URL, key: config.env.VITE_SUPABASE_ANON_KEY, manifest });
      } catch (error) {
        this.error(`[eze-cms] Build detenido: el modo CMS necesita el contenido de Supabase. ${error.message}`);
      }
      config.logger.info(`[eze-cms] Contenido CMS incluido: ${Object.keys(snapshot.sections).length} secciones y ${Object.keys(snapshot.globals).length} globales.`);
    },
    resolveId(id) { return id === VIRTUAL_ID ? RESOLVED_ID : null; },
    load(id) { return id === RESOLVED_ID ? `export default ${JSON.stringify(snapshot)};` : null; },
  };
}
