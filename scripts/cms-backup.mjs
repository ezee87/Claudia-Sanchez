// Respaldo de SOLO LECTURA del contenido de Claudia en Eze CMS (Supabase). No escribe nada remoto.
//
//   node scripts/cms-backup.mjs                  → instantánea pública (RPC con la clave anon de .env.local)
//   node scripts/cms-backup.mjs --owner          → filas completas de sites/pages/sections/site_globals como owner
//                                                  (credenciales en CMS_OWNER_EMAIL y CMS_OWNER_PASSWORD; no se guardan)
//   --out <carpeta>                              → destino (por defecto ../claudia-sanchez-cms-backups/<fecha>_<modo>)
//
// Nunca sobrescribe: la carpeta de destino no debe existir y cada archivo se crea con la bandera `wx`.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SITE_SLUG = 'claudia-sanchez';
const SITE_ID = '1875d747-0758-4c09-b5b3-935a6ace0249';
// Claves que ya no están en el manifiesto pero pueden existir en Supabase (página antigua y secciones retiradas).
const LEGACY_SECTIONS = {
  '/disena-tu-futuro': ['hero', 'situations', 'testimonials', 'approach', 'life', 'about', 'closing', 'site-header', 'site-footer', 'impact', 'seo'],
  '/diseno-de-carrera': ['testimonials', 'impact', 'footer'],
  '/': ['navbar', 'footer'],
  '/newsletter': ['intro', 'listado', 'seo'],
};

const args = process.argv.slice(2);
const owner = args.includes('--owner');
const outArg = args.indexOf('--out') >= 0 ? args[args.indexOf('--out') + 1] : null;
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(outArg ?? path.join('..', 'claudia-sanchez-cms-backups', `${stamp}_${owner ? 'owner' : 'publico'}`));

const fileEnv = fs.existsSync('.env.local') ? Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter(line => line.includes('=') && !line.trim().startsWith('#')).map(line => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()])) : {};
const env = (name) => process.env[name] ?? fileEnv[name];
const url = env('VITE_SUPABASE_URL'), key = env('VITE_SUPABASE_ANON_KEY');
if (!url || !key) throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.');
if (fs.existsSync(outDir)) throw new Error(`La carpeta de destino ya existe; no se sobrescribe: ${outDir}`);

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data; };
const files = {};

if (owner) {
  const email = process.env.CMS_OWNER_EMAIL, password = process.env.CMS_OWNER_PASSWORD;
  if (!email || !password) throw new Error('Definí CMS_OWNER_EMAIL y CMS_OWNER_PASSWORD en el entorno (no se guardan en disco).');
  must(await client.auth.signInWithPassword({ email, password }), 'Inicio de sesión');
  try {
    const sites = must(await client.from('sites').select('*').eq('slug', SITE_SLUG), 'sites');
    if (sites.length !== 1 || sites[0].id !== SITE_ID) throw new Error(`El sitio ${SITE_SLUG} no coincide con ${SITE_ID}; se aborta.`);
    const pages = must(await client.from('pages').select('*').eq('site_id', SITE_ID).order('route'), 'pages');
    const sections = pages.length ? must(await client.from('sections').select('*').in('page_id', pages.map(p => p.id)).order('page_id').order('position'), 'sections') : [];
    const globals = must(await client.from('site_globals').select('*').eq('site_id', SITE_ID).order('key'), 'site_globals');
    const modules = must(await client.from('site_modules').select('*').eq('site_id', SITE_ID), 'site_modules');
    if ([...pages, ...globals, ...modules].some(row => row.site_id !== SITE_ID)) throw new Error('Se leyó una fila de otro sitio; se aborta.');
    Object.assign(files, { 'sites.json': sites, 'pages.json': pages, 'sections.json': sections, 'site_globals.json': globals, 'site_modules.json': modules });
  } finally {
    await client.auth.signOut();
  }
}

// Instantánea pública: lo que hoy ve el sitio publicado, sección por sección.
const manifest = JSON.parse(fs.readFileSync('src/integration/eze-cms/claudia-sanchez.manifest.json', 'utf8'));
const targets = manifest.pages.flatMap(page => page.sections.map(section => [page.route, section.key]));
for (const [route, keys] of Object.entries(LEGACY_SECTIONS)) for (const sectionKey of keys) if (!targets.some(([r, s]) => r === route && s === sectionKey)) targets.push([route, sectionKey]);
const publicSections = {};
for (const [route, sectionKey] of targets) {
  const { data, error } = await client.rpc('get_public_section', { site_slug: SITE_SLUG, page_route: route, section_key: sectionKey });
  publicSections[`${route}::${sectionKey}`] = error ? { error: error.message } : (Array.isArray(data) && data.length ? data[0] : null);
}
const publicGlobals = {};
for (const group of manifest.globals) {
  const { data, error } = await client.rpc('get_public_site_global', { site_slug: SITE_SLUG, global_key: group.key });
  publicGlobals[group.key] = error ? { error: error.message } : (Array.isArray(data) && data.length ? data[0] : null);
}
const articles = must(await client.rpc('get_published_articles', { p_site_slug: SITE_SLUG, p_article_slug: null }), 'get_published_articles');
Object.assign(files, {
  'public-sections.json': publicSections,
  'public-globals.json': publicGlobals,
  // Solo identificación: los artículos no se respaldan ni se tocan en esta reconciliación.
  'published-articles.json': articles.map(({ id, slug, title, published_at, updated_at }) => ({ id, slug, title, published_at, updated_at })),
});

fs.mkdirSync(path.dirname(outDir), { recursive: true });
fs.mkdirSync(outDir);
const sums = [];
const write = (name, text) => { fs.writeFileSync(path.join(outDir, name), text, { flag: 'wx' }); sums.push(`${crypto.createHash('sha256').update(text).digest('hex')}  ${name}`); };
for (const [name, value] of Object.entries(files)) write(name, JSON.stringify(value, null, 2) + '\n');
write('README.txt', [
  `Respaldo ${owner ? 'owner (filas completas)' : 'público (RPC anon)'} de ${SITE_SLUG} · ${SITE_ID}`,
  `Leído: ${new Date().toISOString()} · Supabase: ${new URL(url).host}`,
  `Secciones públicas leídas: ${targets.length} · con contenido: ${Object.values(publicSections).filter(v => v && !v.error).length}`,
  `Artículos publicados: ${articles.length}`,
  'Generado por scripts/cms-backup.mjs. Solo lectura; no modificar estos archivos.', '',
].join('\n'));
fs.writeFileSync(path.join(outDir, 'SHA256SUMS.txt'), sums.join('\n') + '\n', { flag: 'wx' });
console.log(`Respaldo ${owner ? 'owner' : 'público'} guardado en ${outDir} (${Object.keys(files).length} archivos de datos).`);
