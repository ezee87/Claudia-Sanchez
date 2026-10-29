// Vista previa LOCAL de lo que haría `sync_site_manifest` con el manifiesto de Claudia. No se conecta a Supabase.
// Emula las reglas de las migraciones 002/005/007 de Eze CMS sobre un respaldo ya descargado:
//   node scripts/cms-sync-preview.mjs --public <carpeta de respaldo público> [--out archivo.md]
//   node scripts/cms-sync-preview.mjs --owner <carpeta de respaldo owner | backup.json del SQL 01> [--out archivo.md]
// Con --owner se verifican además claves de página, conflictos de ruta y field_schema; con --public se infiere.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : null);
const manifest = JSON.parse(fs.readFileSync('src/integration/eze-cms/claudia-sanchez.manifest.json', 'utf8'));
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
// El SQL Editor exporta Q6 como [{ "backup": {...} }]; también se acepta { backup } o el objeto directo.
const unwrapBackup = (raw) => { const row = Array.isArray(raw) ? raw[0] : raw; const b = row?.backup ?? row; return typeof b === 'string' ? JSON.parse(b) : b; };

// ---- Estado remoto normalizado: pages[{key,route,slug,name,id}], sections[route::key] = {content, field_schema?}, globals[key] = content
let mode, pages = null, sections = {}, globals = {};
if (opt('--owner')) {
  mode = 'owner';
  const source = opt('--owner');
  const data = fs.statSync(source).isDirectory()
    ? { pages: readJson(path.join(source, 'pages.json')), sections: readJson(path.join(source, 'sections.json')), site_globals: readJson(path.join(source, 'site_globals.json')) }
    : unwrapBackup(readJson(source));
  pages = data.pages;
  const routeById = Object.fromEntries(pages.map(p => [p.id, p.route]));
  for (const s of data.sections) sections[`${routeById[s.page_id]}::${s.key}`] = s;
  for (const g of data.site_globals) globals[g.key] = g.content;
} else if (opt('--public')) {
  mode = 'public';
  const dir = opt('--public');
  for (const [k, row] of Object.entries(readJson(path.join(dir, 'public-sections.json')))) if (row && !row.error) sections[k] = row;
  for (const [k, row] of Object.entries(readJson(path.join(dir, 'public-globals.json')))) if (row?.content) globals[k] = row.content;
} else throw new Error('Indicá --public <carpeta> o --owner <carpeta|archivo>.');

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const has = (value, p) => { let cur = value; for (const part of p.split('.')) { if (Array.isArray(cur)) { if (!/^\d+$/.test(part) || +part >= cur.length) return false; cur = cur[+part]; } else if (isObject(cur) && Object.prototype.hasOwnProperty.call(cur, part)) cur = cur[part]; else return false; } return true; };
const at = (value, p) => p.split('.').reduce((cur, part) => cur?.[part], value);
// _eze_jsonb_set_missing: only creates a path when every missing step can be created (objects) and never past an array's end.
function wouldCreate(content, p) {
  let cur = content;
  for (const part of p.split('.')) {
    if (Array.isArray(cur)) { if (!/^\d+$/.test(part) || +part >= cur.length) return false; cur = cur[+part]; continue; }
    if (!isObject(cur)) return false;
    if (!Object.prototype.hasOwnProperty.call(cur, part)) return true;
    cur = cur[part];
  }
  return false;
}
const typeOk = (field, v) => field.type === 'collection' ? Array.isArray(v)
  : field.type === 'link' ? isObject(v) && typeof v.label === 'string' && typeof v.href === 'string'
  : field.type === 'number' ? typeof v === 'number' : typeof v === 'string';
// jsonb reorders object keys, so values are compared with sorted keys.
const canonical = v => Array.isArray(v) ? v.map(canonical) : isObject(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const short = v => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s.length > 70 ? `${s.slice(0, 67)}…` : s; };

const out = [];
const totals = { newPages: 0, existingPages: 0, newSections: 0, existingSections: 0, addedFields: 0, keptEqual: 0, keptDifferent: 0, conflicts: 0, undeclared: 0 };
const conflicts = [], differing = [], obsolete = [];
out.push(`# Vista previa de sincronización · ${manifest.site.key}`, '', `Generada localmente el ${new Date().toISOString().slice(0, 10)} con \`scripts/cms-sync-preview.mjs\` (modo **${mode}**). No modifica Supabase.`, '');
if (mode === 'public') out.push('> Modo público: la existencia de páginas y secciones se infiere de `get_public_section` (no se ven claves, `field_schema` ni secciones ocultas por la RPC). Repetir con `--owner` antes de sincronizar.', '');

// ---- Páginas
out.push('## Páginas', '', '| Clave | Ruta | Estado | Detalle |', '|---|---|---|---|');
for (const page of manifest.pages) {
  let state, detail = '';
  if (pages) {
    const existing = pages.find(p => p.key === page.key);
    const routeOwner = pages.find(p => p.route === page.route && p.key !== page.key);
    if (routeOwner) { state = '**CONFLICTO**'; detail = `la ruta ya pertenece a la clave \`${routeOwner.key}\`: la sync aborta completa`; conflicts.push(`Ruta ${page.route} asignada a la clave ${routeOwner.key} (manifiesto: ${page.key})`); }
    else if (existing) { state = 'existe'; detail = ['name', 'route', 'slug'].filter(k => existing[k] !== page[k]).map(k => `${k}: «${existing[k]}» → «${page[k]}»`).join(' · ') || 'sin cambios'; }
    else state = 'NUEVA';
  } else state = manifest.pages.length && page.sections.some(s => sections[`${page.route}::${s.key}`]) ? 'existe (inferido)' : 'NUEVA (inferido)';
  if (state.startsWith('NUEVA')) totals.newPages++; else totals.existingPages++;
  out.push(`| ${page.key} | ${page.route} | ${state} | ${detail} |`);
}
if (pages) for (const p of pages.filter(p => !manifest.pages.some(m => m.key === p.key))) { obsolete.push(`Página \`${p.key}\` (${p.route}): no está en el manifiesto; la sync no la toca`); }

// ---- Secciones y campos
out.push('', '## Secciones', '');
for (const page of manifest.pages) {
  out.push(`### ${page.name} · \`${page.route}\``, '', '| Sección | Estado | Campos nuevos (se crean con el valor local) | Conservan valor remoto distinto | Observaciones |', '|---|---|---|---|---|');
  for (const section of page.sections) {
    const remote = sections[`${page.route}::${section.key}`];
    if (!remote) { totals.newSections++; out.push(`| ${section.key} | NUEVA | toda la sección (${section.fields.length} campos) | — | se crea con \`initialContent\` |`); continue; }
    totals.existingSections++;
    const content = remote.content ?? {};
    const added = [], different = [], notes = [];
    for (const field of section.fields) {
      const initial = at(section.initialContent, field.path);
      if (!has(content, field.path)) {
        if (initial !== undefined && wouldCreate(content, field.path)) { added.push(field.path); totals.addedFields++; }
        else if (initial !== undefined) { notes.push(`\`${field.path}\` no se puede crear (ruta incompatible)`); conflicts.push(`${page.route} › ${section.key}.${field.path}: ruta incompatible con el contenido existente`); totals.conflicts++; }
        continue;
      }
      const value = at(content, field.path);
      if (!typeOk(field, value)) { notes.push(`**tipo**: \`${field.path}\` es ${Array.isArray(value) ? 'array' : typeof value} y se declara ${field.type}`); conflicts.push(`${page.route} › ${section.key}.${field.path}: valor remoto de tipo incompatible (${field.type})`); totals.conflicts++; continue; }
      if (same(value, initial)) { totals.keptEqual++; continue; }
      totals.keptDifferent++;
      if (field.type === 'collection') {
        const ids = value.map(i => i?._id ?? '(sin _id)'), localIds = initial.map(i => i._id);
        const missingItemFields = field.itemFields.map(f => f.path).filter(p => value.length && value.every(i => !isObject(i) || !has(i, p)));
        different.push(`\`${field.path}[]\``);
        differing.push(`${page.route} › ${section.key}.${field.path}[]: remoto ${ids.join(', ')} · local ${localIds.join(', ')}${missingItemFields.length ? ` · sin ${missingItemFields.join(', ')}` : ''}`);
        if (missingItemFields.length) notes.push(`ítems remotos sin ${missingItemFields.map(p => `\`${p}\``).join(', ')} (React usa su valor por defecto)`);
      } else { different.push(`\`${field.path}\``); differing.push(`${page.route} › ${section.key}.${field.path}: «${short(value)}» (local «${short(initial)}»)`); }
    }
    const declared = new Set(section.fields.map(f => f.path.split('.')[0]));
    const undeclared = Object.keys(content).filter(k => !declared.has(k));
    if (undeclared.length) { totals.undeclared += undeclared.length; notes.push(`fuera del esquema (se conservan, no se editan): ${undeclared.map(k => `\`${k}\``).join(', ')}`); obsolete.push(`${page.route} › ${section.key}: ${undeclared.join(', ')}`); }
    if (remote.field_schema) { const stored = (remote.field_schema || []).map(f => f.path).filter(p => !section.fields.some(f => f.path === p)); if (stored.length) notes.push(`dejan de mostrarse en el CMS: ${stored.map(p => `\`${p}\``).join(', ')}`); }
    out.push(`| ${section.key} | existe | ${added.map(p => `\`${p}\``).join(', ') || '—'} | ${different.join(', ') || '—'} | ${notes.join('; ') || '—'} |`);
  }
  out.push('');
}
for (const key of Object.keys(sections)) { const [route, sectionKey] = key.split('::'); const page = manifest.pages.find(p => p.route === route); if (!page || !page.sections.some(s => s.key === sectionKey)) obsolete.push(`Sección ${route} › ${sectionKey}: no está en el manifiesto; la sync no la toca`); }

// ---- Globales (_eze_sync_manifest_globals: los valores existentes se validan; los ausentes se crean)
out.push('## Globales', '', '| Grupo | Estado | Campos nuevos | Conservan valor remoto distinto | Observaciones |', '|---|---|---|---|---|');
for (const group of manifest.globals) {
  const remote = globals[group.key];
  if (!remote) { out.push(`| ${group.key} | NUEVO | todos | — | se crea con \`initialContent\` |`); continue; }
  const added = [], different = [], notes = [];
  for (const field of group.fields) {
    if (!has(remote, field.path)) { added.push(`\`${field.path}\``); totals.addedFields++; continue; }
    const value = at(remote, field.path);
    if (!typeOk(field, value)) { notes.push(`**tipo**: \`${field.path}\` (la sync aborta)`); conflicts.push(`GLOBAL ${group.key}.${field.path}: valor existente inválido para ${field.type}; _eze_sync_manifest_globals aborta`); totals.conflicts++; continue; }
    if (!same(value, group.initialContent[field.path])) { different.push(`\`${field.path}\``); differing.push(`GLOBAL ${group.key}.${field.path}: «${short(value)}» (local «${short(group.initialContent[field.path])}»)`); totals.keptDifferent++; } else totals.keptEqual++;
  }
  out.push(`| ${group.key} | existe | ${added.join(', ') || '—'} | ${different.join(', ') || '—'} | ${notes.join('; ') || '—'} |`);
}

out.splice(4, 0, '## Resumen', '', '| | Cantidad |', '|---|---|',
  `| Páginas nuevas / existentes | ${totals.newPages} / ${totals.existingPages} |`,
  `| Secciones nuevas / existentes | ${totals.newSections} / ${totals.existingSections} |`,
  `| Campos que se crearán en secciones y globales existentes | ${totals.addedFields} |`,
  `| Campos existentes iguales al local | ${totals.keptEqual} |`,
  `| Campos existentes con valor distinto (la sync **no** los cambia; etapa 4) | ${totals.keptDifferent} |`,
  `| Conflictos | ${conflicts.length} |`, `| Claves remotas fuera del esquema | ${totals.undeclared} |`, '');
out.push('', '## Conflictos', '', ...(conflicts.length ? conflicts.map(c => `- ${c}`) : ['Ninguno.']));
out.push('', '## Valores que se conservan distintos del local (para la etapa 4)', '', ...differing.map(d => `- ${d}`));
out.push('', '## Obsoletos (no se tocan)', '', ...obsolete.map(o => `- ${o}`), '');

const text = out.join('\n');
if (opt('--out')) { fs.writeFileSync(opt('--out'), text); console.log(`Vista previa (${mode}) escrita en ${opt('--out')}: ${totals.newPages} páginas nuevas, ${totals.newSections} secciones nuevas, ${totals.addedFields} campos nuevos, ${totals.keptDifferent} valores distintos conservados, ${conflicts.length} conflictos.`); }
else console.log(text);
if (conflicts.length) process.exitCode = 2;
