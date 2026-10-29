// Etapa 4 · Plan LOCAL de reconciliación del contenido de Supabase con el contenido aprobado (initialContent del manifiesto,
// que `npm test` garantiza igual a los fallbacks de React). No se conecta a Supabase ni escribe nada remoto.
//   node scripts/cms-content-plan.mjs --owner <backup.json del SQL 05/Q1> --out <carpeta>   → inventario + plan + SQL (termina en ROLLBACK)
//   node scripts/cms-content-plan.mjs --public <carpeta de respaldo público> --out <carpeta> → inventario + plan provisional (sin SQL)
// Reglas: solo se tocan campos del manifiesto cuyo valor difiere; las claves fuera del esquema se conservan; las colecciones
// quedan con los ítems y el orden locales, conservando el _id remoto cuando es el mismo elemento (mismo _id o, en testimonios,
// misma persona). No toca páginas, rutas, field_schema, settings, artículos ni otros sitios.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SITE_ID = '1875d747-0758-4c09-b5b3-935a6ace0249';
const SITE_SLUG = 'claudia-sanchez';
const args = process.argv.slice(2);
const opt = (name) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : null);
const outDir = opt('--out');
if (!outDir) throw new Error('Indicá --out <carpeta>.');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
const unwrapBackup = (raw) => { const row = Array.isArray(raw) ? raw[0] : raw; const b = row?.backup ?? row; return typeof b === 'string' ? JSON.parse(b) : b; };
const manifestText = fs.readFileSync('src/integration/eze-cms/claudia-sanchez.manifest.json', 'utf8');
const manifest = JSON.parse(manifestText);

// ---- Estado remoto: sections[route::key] = { id?, content }, globals[key] = { id?, content }
let mode, backup = null;
const sections = {}, globals = {};
if (opt('--owner')) {
  mode = 'owner';
  backup = unwrapBackup(readJson(opt('--owner')));
  if (backup.site?.id !== SITE_ID || backup.site?.slug !== SITE_SLUG) throw new Error('El respaldo no es del sitio de Claudia.');
  for (const row of [...backup.pages, ...backup.site_globals]) if (row.site_id !== SITE_ID) throw new Error(`Fila de otro sitio en el respaldo (${row.id}).`);
  const routeById = Object.fromEntries(backup.pages.map(p => [p.id, p.route]));
  for (const s of backup.sections) { if (!routeById[s.page_id]) throw new Error(`Sección ${s.id} sin página del sitio.`); sections[`${routeById[s.page_id]}::${s.key}`] = s; }
  for (const g of backup.site_globals) globals[g.key] = g;
} else if (opt('--public')) {
  mode = 'public';
  const dir = opt('--public');
  for (const [k, row] of Object.entries(readJson(path.join(dir, 'public-sections.json')))) if (row && !row.error) sections[k] = row;
  for (const [k, row] of Object.entries(readJson(path.join(dir, 'public-globals.json')))) if (row?.content) globals[k] = row;
} else throw new Error('Indicá --owner <backup.json> o --public <carpeta>.');

// ---- Utilidades
const canon = (v) => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);
const same = (a, b) => canon(a) === canon(b);
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const get = (o, p) => p.reduce((a, k) => (a == null ? undefined : a[k]), o);
const set = (o, p, v) => { let cur = o; for (const k of p.slice(0, -1)) { if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k]; } cur[p.at(-1)] = clone(v); };
const short = (v, n = 90) => { if (v === undefined) return '—'; const t = typeof v === 'string' ? v : canon(v); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const md = (v) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/).slice(0, 2).join(' ');
const isTestimonial = (field) => (field.itemFields || []).some(f => f.key === 'author') && (field.itemFields || []).some(f => f.key === 'quote');

// Colección: ítems y orden locales; conserva el _id remoto del mismo elemento.
function planCollection(field, remoteItems, localItems) {
  const remote = Array.isArray(remoteItems) ? remoteItems : [];
  const used = new Set(), ops = [];
  const target = localItems.map((local) => {
    let match = remote.find(r => !used.has(r._id) && r._id === local._id && (!isTestimonial(field) || norm(r.author) === norm(local.author)));
    let how = 'mismo _id';
    if (!match && isTestimonial(field)) { match = remote.find(r => !used.has(r._id) && norm(r.author) && norm(r.author) === norm(local.author)); how = 'misma persona'; }
    if (match) used.add(match._id);
    return { local, match, how };
  });
  // Un _id conservado no puede repetir el _id local de otro ítem.
  const preserved = new Set(target.filter(t => t.match).map(t => t.match._id));
  const items = target.map(({ local, match, how }, index) => {
    const id = match ? match._id : (preserved.has(local._id) ? `${local._id}-local` : local._id);
    const item = { ...clone(local), _id: id };
    if (!match) ops.push({ op: 'alta', index, _id: id, label: local.author ?? local.title ?? local.label ?? id });
    else {
      const changed = [...new Set([...Object.keys(local), ...Object.keys(match)])].filter(k => k !== '_id' && !same(local[k], match[k]));
      const removedKeys = Object.keys(match).filter(k => !(k in local));
      const from = remote.indexOf(match);
      ops.push({ op: changed.length ? 'modificación' : 'sin cambios', index, from, _id: id, how, localId: local._id, label: local.author ?? local.title ?? local.label ?? id, changed, removedKeys, before: match, after: item });
    }
    return item;
  });
  for (const r of remote) if (!used.has(r._id)) ops.push({ op: 'baja', _id: r._id, label: r.author ?? r.title ?? r.label ?? r._id, before: r });
  const order = remote.filter(r => used.has(r._id)).map(r => r._id);
  const newOrder = items.filter(i => used.has(i._id)).map(i => i._id);
  return { items, ops, reordered: order.join() !== newOrder.join() };
}

// ---- Comparación campo por campo
const rows = [], plans = [];
const counts = { igual: 0, actualizar: 0, crear: 0, coleccion: 0, sinLocal: 0, fueraDeEsquema: 0 };
function compareTarget(label, route, sectionKey, remoteRow, schema, initial, kind) {
  const before = remoteRow?.content ?? {};
  const after = clone(before);
  const fieldsChanged = [];
  for (const field of schema) {
    const p = field.path.split('.');
    const local = get(initial, p), remote = get(before, p);
    if (local === undefined) { counts.sinLocal++; continue; }
    if (same(local, remote)) { counts.igual++; rows.push({ label, route, sectionKey, field: field.path, type: field.type, remote, local, action: 'mantener' }); continue; }
    if (field.type === 'collection' && Array.isArray(local)) {
      const plan = planCollection(field, remote, local);
      set(after, p, plan.items);
      counts.coleccion++; fieldsChanged.push(field.path);
      rows.push({ label, route, sectionKey, field: field.path, type: field.type, remote, local, action: 'reemplazar colección', collection: plan, final: plan.items });
      continue;
    }
    set(after, p, local);
    remote === undefined ? counts.crear++ : counts.actualizar++;
    fieldsChanged.push(field.path);
    rows.push({ label, route, sectionKey, field: field.path, type: field.type, remote, local, action: remote === undefined ? 'crear' : 'actualizar' });
  }
  // Claves remotas fuera del esquema que no existen en el contenido aprobado: React puede leerlas igual (p. ej. Enfoque
  // muestra paragraph1..4 si existen), así que se quitan. Quedan en el respaldo para la reversión.
  const known = new Set(schema.map(f => f.path.split('.')[0]));
  const outside = Object.keys(before).filter(k => !known.has(k) && k !== '_eze' && !(k in (initial ?? {})));
  for (const k of outside) {
    delete after[k];
    fieldsChanged.push(`-${k}`);
    rows.push({ label, route, sectionKey, field: k, type: 'fuera de esquema', remote: before[k], local: undefined, action: 'quitar (fuera del esquema, no aprobado)' });
  }
  counts.fueraDeEsquema += outside.length;
  if (fieldsChanged.length) plans.push({ kind, label, route, sectionKey, id: remoteRow?.id ?? null, fieldsChanged, before, after, outside });
  return outside;
}
const outsideByTarget = {};
for (const page of manifest.pages) for (const section of page.sections) {
  const key = `${page.route}::${section.key}`;
  if (!sections[key]) throw new Error(`Falta la sección ${key} en Supabase: la estructura no coincide con la Etapa 3B. Se aborta.`);
  outsideByTarget[key] = compareTarget(page.name, page.route, section.key, sections[key], section.fields, section.initialContent, 'section');
}
for (const g of manifest.globals) {
  if (!globals[g.key]) throw new Error(`Falta el global ${g.key}. Se aborta.`);
  outsideByTarget[`GLOBAL::${g.key}`] = compareTarget('Global', 'GLOBAL', g.key, globals[g.key], g.fields, g.initialContent, 'global');
}

// ---- Salidas
fs.mkdirSync(outDir, { recursive: true });
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const plan = {
  generated_at: new Date().toISOString(), mode, site_id: SITE_ID, backup_read_at: backup?.read_at ?? null, manifest_sha256: sha(manifestText),
  counts, targets: plans.map(({ before, ...rest }) => rest),
};
fs.writeFileSync(path.join(outDir, 'plan.json'), JSON.stringify(plan, null, 2));

// Snapshot público simulado (estado posterior a aplicar), para validar el render en modo CMS.
const afterSections = {}, afterGlobals = {};
const planByKey = Object.fromEntries(plans.map(p => [`${p.route}::${p.sectionKey}`, p]));
for (const [k, row] of Object.entries(sections)) afterSections[k] = { content: planByKey[k]?.after ?? row.content, settings: row.settings ?? {} };
for (const [k, row] of Object.entries(globals)) { const c = planByKey[`GLOBAL::${k}`]?.after ?? row.content; afterGlobals[k] = { content: c }; }
fs.mkdirSync(path.join(outDir, 'estado-objetivo'), { recursive: true });
fs.writeFileSync(path.join(outDir, 'estado-objetivo', 'public-sections.json'), JSON.stringify(afterSections, null, 2));
fs.writeFileSync(path.join(outDir, 'estado-objetivo', 'public-globals.json'), JSON.stringify(afterGlobals, null, 2));

// Inventario Markdown
const out = [];
out.push('# Etapa 4 · Inventario de diferencias de contenido · claudia-sanchez', '');
out.push(`Generado localmente el ${plan.generated_at.slice(0, 10)} con \`scripts/cms-content-plan.mjs\` (modo **${mode}**${backup ? `, respaldo leído el ${backup.read_at}` : ''}). Fuente de verdad: \`initialContent\` del manifiesto (= fallbacks de React). No modifica Supabase.`, '');
out.push('| | Cantidad |', '|---|---|');
out.push(`| Campos que ya coinciden (**no se tocan**) | ${counts.igual} |`);
out.push(`| Campos a actualizar | ${counts.actualizar} |`);
out.push(`| Colecciones a reemplazar | ${counts.coleccion} |`);
out.push(`| Campos a crear | ${counts.crear} |`);
out.push(`| Secciones/globales que cambian | ${plans.length} |`);
out.push(`| Claves remotas fuera del esquema y no aprobadas (se quitan) | ${counts.fueraDeEsquema} |`, '');
out.push('## Cambios propuestos', '', '| Página | Sección | Campo | Valor actual en Supabase | Valor local aprobado | Acción |', '|---|---|---|---|---|---|');
const describeItems = (items) => (Array.isArray(items) ? items.map(i => `${i._id}${i.author ? '=' + i.author : i.title ? '=' + short(i.title, 28) : ''}`).join(', ') : short(items));
for (const r of rows.filter(r => r.action !== 'mantener')) {
  const remote = r.type === 'collection' ? describeItems(r.remote) : short(r.remote);
  const local = r.type === 'collection' ? describeItems(r.final) : short(r.local);
  out.push(`| ${md(r.label)} \`${r.route}\` | ${r.sectionKey} | \`${r.field}\` | ${md(remote)} | ${md(local)} | ${r.action}${r.collection?.reordered ? ' (cambia el orden)' : ''} |`);
}
out.push('', '## Colecciones: detalle por ítem', '');
for (const r of rows.filter(r => r.collection)) {
  out.push(`### ${r.label} · \`${r.route}\` › ${r.sectionKey}.${r.field}`, '');
  out.push(`Remoto: ${describeItems(r.remote)} → Final: ${describeItems(r.final)}${r.collection.reordered ? ' · **cambia el orden**' : ''}`, '');
  out.push('| Posición final | Operación | _id final | Elemento | Detalle |', '|---|---|---|---|---|');
  const reusedIds = new Set(r.collection.ops.filter(o => o.op === 'alta').map(o => o._id).filter(id => r.collection.ops.some(o => o.op === 'baja' && o._id === id)));
  for (const op of r.collection.ops) {
    const detail = op.op === 'alta' ? (reusedIds.has(op._id) ? 'ítem local nuevo; reutiliza el _id de un ítem remoto distinto (sustitución)' : 'ítem local nuevo')
      : op.op === 'baja' ? (reusedIds.has(op._id) ? 'no forma parte del contenido aprobado; su _id lo pasa a usar el ítem local nuevo' : 'no forma parte del contenido aprobado') :
      [`${op.how}${op.localId !== op._id ? ` (local \`${op.localId}\`)` : ''}`, op.from !== op.index ? `posición ${op.from + 1} → ${op.index + 1}` : '', op.changed.length ? `campos: ${op.changed.map(k => `\`${k}\``).join(', ')}` : '', op.removedKeys.length ? `claves remotas que se quitan: ${op.removedKeys.map(k => `\`${k}\``).join(', ')}` : ''].filter(Boolean).join(' · ');
    out.push(`| ${op.index === undefined ? '—' : op.index + 1} | ${op.op} | \`${op._id}\` | ${md(op.label)} | ${md(detail)} |`);
  }
  out.push('');
}
out.push('## Claves remotas fuera del esquema y no aprobadas (se quitan; quedan en el respaldo)', '');
const outsideList = Object.entries(outsideByTarget).filter(([, v]) => v.length);
out.push(...(outsideList.length ? outsideList.map(([k, v]) => `- ${k.replace('::', ' › ')}: ${v.map(x => `\`${x}\``).join(', ')}`) : ['Ninguna.']), '');
out.push('## Campos que ya coinciden (no se tocan)', '');
const keep = {};
for (const r of rows.filter(r => r.action === 'mantener')) (keep[`${r.route} › ${r.sectionKey}`] ??= []).push(`\`${r.field}\``);
for (const [k, v] of Object.entries(keep)) out.push(`- ${k}: ${v.join(', ')}`);
out.push('');
fs.writeFileSync(path.join(outDir, 'inventario.md'), out.join('\n'));

// SQL de aplicación (solo con respaldo owner: necesita los ids y el contenido exacto de todas las filas)
if (mode === 'owner') {
  const TAG = '$eze_patch$';
  const json = (v) => { const t = JSON.stringify(v); if (t.includes(TAG)) throw new Error('El contenido incluye el delimitador SQL.'); return `${TAG}${t}${TAG}::jsonb`; };
  const sectionRows = backup.sections, globalRows = backup.site_globals;
  const sectionTargets = plans.filter(p => p.kind === 'section'), globalTargets = plans.filter(p => p.kind === 'global');
  const sql = [
    `-- Etapa 4B · Reconciliación de contenido de ${SITE_SLUG} (${SITE_ID}).`,
    `-- Generado por scripts/cms-content-plan.mjs desde el respaldo leído el ${backup.read_at}. Manifiesto sha256 ${plan.manifest_sha256}.`,
    `-- Actualiza ${sectionTargets.length} secciones y ${globalTargets.length} globales (solo la columna content). No toca pages, rutas, field_schema,`,
    '-- settings, articles ni otros sitios. Se detiene si cualquier fila del sitio cambió desde el respaldo.',
    '-- ENSAYO: termina obligatoriamente en ROLLBACK; no contiene ninguna confirmación. Las tablas temporales se descartan con el ROLLBACK.',
    'begin;',
    `do $$ begin if not exists (select 1 from public.sites where id = '${SITE_ID}' and slug = '${SITE_SLUG}') then raise exception 'Sitio inesperado'; end if; end $$;`,
    '',
    '-- 1) Estado esperado (respaldo) de TODAS las secciones y globales del sitio.',
    '-- Tablas de trabajo solo en el esquema temporal de la sesión (pg_temp); nunca afecta tablas reales.',
    'drop table if exists pg_temp._eze_expected, pg_temp._eze_target;',
    'create temporary table _eze_expected (kind text not null, id uuid primary key, content jsonb);',
    ...sectionRows.map(s => `insert into _eze_expected values ('section', '${s.id}', ${json(s.content)});`),
    ...globalRows.map(g => `insert into _eze_expected values ('global', '${g.id}', ${json(g.content)});`),
    '',
    '-- 2) Detección de cambios concurrentes: mismas filas y mismo contenido que en el respaldo.',
    'do $$',
    'declare drift integer;',
    'begin',
    `  select count(*) into drift from (`,
    `    select s.id, s.content from public.sections s join public.pages p on p.id = s.page_id where p.site_id = '${SITE_ID}'`,
    `    union all select g.id, g.content from public.site_globals g where g.site_id = '${SITE_ID}'`,
    '  ) cur full join _eze_expected e on e.id = cur.id',
    '  where cur.id is null or e.id is null or cur.content is distinct from e.content;',
    `  if drift > 0 then raise exception 'El contenido cambió desde el respaldo (% filas). No se aplica nada: tomar un respaldo nuevo y regenerar el plan.', drift; end if;`,
    `  if (select count(*) from public.pages where site_id = '${SITE_ID}') <> ${backup.pages.length} then raise exception 'Cambió la cantidad de páginas.'; end if;`,
    'end $$;',
    '',
    '-- 3) Contenido objetivo (solo las filas que cambian).',
    'create temporary table _eze_target (kind text not null, id uuid primary key, content jsonb not null);',
    ...sectionTargets.map(t => `insert into _eze_target values ('section', '${t.id}', ${json(t.after)}); -- ${t.route} › ${t.sectionKey}: ${t.fieldsChanged.join(', ')}`),
    ...globalTargets.map(t => `insert into _eze_target values ('global', '${t.id}', ${json(t.after)}); -- ${t.sectionKey}: ${t.fieldsChanged.join(', ')}`),
    '',
    '-- 4) Aplicación, acotada al sitio y comprobando la cantidad exacta de filas.',
    'do $$',
    'declare n integer;',
    'begin',
    `  update public.sections s set content = t.content from _eze_target t, public.pages p`,
    `    where t.kind = 'section' and s.id = t.id and p.id = s.page_id and p.site_id = '${SITE_ID}';`,
    '  get diagnostics n = row_count;',
    `  if n <> ${sectionTargets.length} then raise exception 'Se esperaban ${sectionTargets.length} secciones actualizadas y fueron %', n; end if;`,
    `  update public.site_globals g set content = t.content, updated_at = statement_timestamp() from _eze_target t`,
    `    where t.kind = 'global' and g.id = t.id and g.site_id = '${SITE_ID}';`,
    '  get diagnostics n = row_count;',
    `  if n <> ${globalTargets.length} then raise exception 'Se esperaban ${globalTargets.length} globales actualizados y fueron %', n; end if;`,
    'end $$;',
    '',
    '-- 5) Validación dentro de la transacción: objetivo aplicado y resto del sitio intacto.',
    'select',
    `  (select count(*) from _eze_target t left join public.sections s on s.id = t.id left join public.site_globals g on g.id = t.id where coalesce(s.content, g.content) is distinct from t.content) as objetivo_no_aplicado,`,
    `  (select count(*) from _eze_expected e left join _eze_target t on t.id = e.id left join public.sections s on s.id = e.id left join public.site_globals g on g.id = e.id where t.id is null and coalesce(s.content, g.content) is distinct from e.content) as otras_filas_modificadas,`,
    `  (select count(*) from _eze_target) as filas_objetivo;`,
    '-- Esperado: objetivo_no_aplicado = 0, otras_filas_modificadas = 0, filas_objetivo = ' + (sectionTargets.length + globalTargets.length) + '.',
    '-- El SQL Editor muestra solo la última sentencia: la misma validación se exige aquí con un error explícito.',
    'do $$ begin',
    `  if exists (select 1 from _eze_target t left join public.sections s on s.id = t.id left join public.site_globals g on g.id = t.id where coalesce(s.content, g.content) is distinct from t.content)`,
    `    or exists (select 1 from _eze_expected e left join _eze_target t on t.id = e.id left join public.sections s on s.id = e.id left join public.site_globals g on g.id = e.id where t.id is null and coalesce(s.content, g.content) is distinct from e.content)`,
    `    or (select count(*) from _eze_target) <> ${sectionTargets.length + globalTargets.length}`,
    `  then raise exception 'Validación final fallida: no se aplica nada.'; end if;`,
    `  raise notice 'Validación final correcta: ${sectionTargets.length} secciones y ${globalTargets.length} globales con el contenido aprobado; resto del sitio intacto.';`,
    'end $$;',
    'rollback;',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'aplicar.sql'), sql);
  if (args.includes('--definitivo')) writeDefinitive({ json, sectionRows, globalRows, sectionTargets, globalTargets });
}

// SQL reforzado (--definitivo): mismo plan que el ensayo validado, con bloqueos, verificación de estructura y de alcance.
// Escribe ensayo-reforzado.sql (termina en ROLLBACK) y aplicar-DEFINITIVO-commit.sql (idéntico salvo cabecera y COMMIT final).
function writeDefinitive({ json, sectionRows, globalRows, sectionTargets, globalTargets }) {
  const text = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
  const targets = [...sectionTargets, ...globalTargets];
  // Claves de primer nivel que cambia cada fila (incluye las 4 claves antiguas que se quitan).
  const changedKeys = (t) => [...new Set(t.fieldsChanged.map(f => f.replace(/^-/, '').split('.')[0]))];
  const declared = targets.reduce((n, t) => n + changedKeys(t).length, 0);
  const removed = targets.reduce((n, t) => n + t.fieldsChanged.filter(f => f.startsWith('-')).length, 0);
  if (declared !== counts.actualizar + counts.coleccion + removed) throw new Error(`Cambios declarados (${declared}) ≠ campos (${counts.actualizar + counts.coleccion}) + claves quitadas (${removed}).`);
  const nSec = sectionTargets.length, nGlob = globalTargets.length, nTotal = nSec + nGlob;
  const expectedRows = sectionRows.length + globalRows.length;
  const site = `'${SITE_ID}'`;
  const body = [
    'begin;',
    "set local lock_timeout = '10s';            -- si otra sesión retiene las filas, falla en lugar de esperar indefinidamente",
    "set local statement_timeout = '120s';",
    '',
    '-- 0) Sitio y bloqueo exclusivo del sitio (misma clave de bloqueo que usa sync_site_manifest).',
    `do $$ begin if not exists (select 1 from public.sites where id = ${site} and slug = '${SITE_SLUG}') then raise exception 'Sitio inesperado'; end if; end $$;`,
    `select pg_advisory_xact_lock(hashtextextended(${site}, 0));`,
    '',
    '-- 1) Bloqueo de filas hasta el final de la transacción: nadie puede modificar, borrar ni agregar páginas, secciones',
    '--    o globales del sitio mientras se verifica y aplica (FOR UPDATE en sites/pages bloquea también las altas que las referencian).',
    'do $$ begin',
    `  perform 1 from public.sites where id = ${site} for update;`,
    `  perform 1 from public.pages where site_id = ${site} for update;`,
    `  perform 1 from public.sections s join public.pages p on p.id = s.page_id where p.site_id = ${site} for update of s;`,
    `  perform 1 from public.site_globals where site_id = ${site} for update;`,
    'end $$;',
    '',
    '-- 2) Estado esperado (respaldo): estructura y contenido de las 12 páginas, 66 secciones y 2 globales.',
    'drop table if exists pg_temp._eze_pages, pg_temp._eze_expected, pg_temp._eze_target;',
    'create temporary table _eze_pages (id uuid primary key, key text, route text, slug text, name text, position integer);',
    ...backup.pages.map(p => `insert into _eze_pages values ('${p.id}', ${text(p.key)}, ${text(p.route)}, ${text(p.slug)}, ${text(p.name)}, ${p.position ?? 'null'});`),
    'create temporary table _eze_expected (kind text not null, id uuid primary key, parent uuid not null, key text not null, type text, name text,',
    '  position integer, visible boolean, sync_status text, field_schema jsonb, settings jsonb, content jsonb);',
    ...sectionRows.map(s => `insert into _eze_expected values ('section', '${s.id}', '${s.page_id}', ${text(s.key)}, ${text(s.type)}, ${text(s.name)}, ${s.position ?? 'null'}, ${s.visible ?? 'null'}, ${text(s.sync_status)}, ${s.field_schema == null ? 'null' : json(s.field_schema)}, ${s.settings == null ? 'null' : json(s.settings)}, ${json(s.content)});`),
    ...globalRows.map(g => `insert into _eze_expected values ('global', '${g.id}', '${g.site_id}', ${text(g.key)}, null, null, null, null, null, null, null, ${json(g.content)});`),
    '',
    '-- 3) Verificación previa (con las filas ya bloqueadas): cualquier diferencia aborta y revierte todo.',
    'do $$',
    'declare n integer;',
    'begin',
    `  if (select count(*) from public.pages where site_id = ${site}) <> ${backup.pages.length} then raise exception 'Verificación previa: cambió la cantidad de páginas.'; end if;`,
    `  select count(*) into n from (select id, key, route, slug, name, position from public.pages where site_id = ${site}) cur`,
    '    full join _eze_pages e on e.id = cur.id',
    '    where cur.id is null or e.id is null or (cur.key, cur.route, cur.slug, cur.name, cur.position) is distinct from (e.key, e.route, e.slug, e.name, e.position);',
    `  if n > 0 then raise exception 'Verificación previa: % páginas difieren del respaldo (clave, ruta, slug, nombre o posición).', n; end if;`,
    '  select count(*) into n from (',
    `    select 'section' kind, s.id, s.page_id parent, s.key, s.type, s.name, s.position, s.visible, s.sync_status, s.field_schema, s.settings, s.content`,
    `      from public.sections s join public.pages p on p.id = s.page_id where p.site_id = ${site}`,
    `    union all select 'global', g.id, g.site_id, g.key, null, null, null, null, null, null, null, g.content from public.site_globals g where g.site_id = ${site}`,
    '  ) cur full join _eze_expected e on e.id = cur.id',
    '  where cur.id is null or e.id is null',
    '     or (cur.kind, cur.parent, cur.key, cur.type, cur.name, cur.position, cur.visible, cur.sync_status) is distinct from (e.kind, e.parent, e.key, e.type, e.name, e.position, e.visible, e.sync_status)',
    '     or cur.field_schema is distinct from e.field_schema or cur.settings is distinct from e.settings or cur.content is distinct from e.content;',
    `  if n > 0 then raise exception 'Verificación previa: % filas difieren del respaldo (estructura o contenido). No se aplica nada: tomar un respaldo nuevo y regenerar el plan.', n; end if;`,
    `  if (select count(*) from _eze_expected) <> ${expectedRows} then raise exception 'Verificación previa: el respaldo embebido está incompleto.'; end if;`,
    'end $$;',
    '',
    `-- 4) Contenido objetivo de las ${nTotal} filas y claves de primer nivel que cambia cada una (${declared} = ${counts.actualizar + counts.coleccion} valores + ${removed} claves antiguas que se quitan).`,
    'create temporary table _eze_target (kind text not null, id uuid primary key, changed text[] not null, content jsonb not null);',
    ...sectionTargets.map(t => `insert into _eze_target values ('section', '${t.id}', array[${changedKeys(t).map(text).join(', ')}]::text[], ${json(t.after)}); -- ${t.route} › ${t.sectionKey}`),
    ...globalTargets.map(t => `insert into _eze_target values ('global', '${t.id}', array[${changedKeys(t).map(text).join(', ')}]::text[], ${json(t.after)}); -- ${t.sectionKey}`),
    'do $$ begin',
    `  if (select count(*) from _eze_target where kind = 'section') <> ${nSec} or (select count(*) from _eze_target where kind = 'global') <> ${nGlob} then raise exception 'Objetivo: cantidad de filas inesperada.'; end if;`,
    "  if exists (select 1 from _eze_target t left join _eze_expected e on e.id = t.id and e.kind = t.kind where e.id is null) then raise exception 'Objetivo: fila fuera del alcance aprobado.'; end if;",
    `  if (select sum(cardinality(changed)) from _eze_target) <> ${declared} then raise exception 'Objetivo: cantidad de valores declarados inesperada.'; end if;`,
    // El objetivo solo difiere del respaldo en las claves declaradas, y cada clave declarada cambia de verdad.
    "  if exists (select 1 from _eze_target t join _eze_expected e on e.id = t.id where (t.content - t.changed) is distinct from (e.content - t.changed)",
    "             or exists (select 1 from unnest(t.changed) k where t.content -> k is not distinct from e.content -> k))",
    "  then raise exception 'Objetivo: el contenido objetivo no coincide con los cambios declarados.'; end if;",
    "  if exists (select 1 from _eze_target t join _eze_expected e on e.id = t.id where t.kind = 'global' and t.content -> '_eze' is distinct from e.content -> '_eze') then raise exception 'Objetivo: se alteraría _eze.'; end if;",
    'end $$;',
    '',
    '-- 5) Aplicación: solo content, solo filas del sitio, solo si siguen iguales al respaldo (comparación y escritura en la misma sentencia).',
    'do $$',
    'declare n integer;',
    'begin',
    '  update public.sections s set content = t.content from _eze_target t, _eze_expected e, public.pages p',
    `    where t.kind = 'section' and s.id = t.id and e.id = t.id and s.content = e.content and p.id = s.page_id and p.site_id = ${site};`,
    '  get diagnostics n = row_count;',
    `  if n <> ${nSec} then raise exception 'Aplicación: se esperaban ${nSec} secciones actualizadas y fueron %', n; end if;`,
    '  update public.site_globals g set content = t.content, updated_at = statement_timestamp() from _eze_target t, _eze_expected e',
    `    where t.kind = 'global' and g.id = t.id and e.id = t.id and g.content = e.content and g.site_id = ${site};`,
    '  get diagnostics n = row_count;',
    `  if n <> ${nGlob} then raise exception 'Aplicación: se esperaban ${nGlob} globales actualizados y fueron %', n; end if;`,
    'end $$;',
    '',
    '-- 6) Verificación posterior: cualquier discrepancia aborta y revierte todo.',
    'do $$',
    'declare n integer;',
    'begin',
    "  select count(*) into n from _eze_target t left join public.sections s on s.id = t.id left join public.site_globals g on g.id = t.id where coalesce(s.content, g.content) is distinct from t.content;",
    "  if n > 0 then raise exception 'Verificación posterior: % filas objetivo sin el contenido aprobado.', n; end if;",
    "  select count(*) into n from _eze_target t join _eze_expected e on e.id = t.id left join public.sections s on s.id = t.id left join public.site_globals g on g.id = t.id",
    "    where exists (select 1 from unnest(t.changed) k where coalesce(s.content, g.content) -> k is not distinct from e.content -> k);",
    "  if n > 0 then raise exception 'Verificación posterior: % filas con valores declarados sin cambiar.', n; end if;",
    "  select count(*) into n from _eze_expected e left join _eze_target t on t.id = e.id left join public.sections s on s.id = e.id left join public.site_globals g on g.id = e.id",
    "    where t.id is null and coalesce(s.content, g.content) is distinct from e.content;",
    "  if n > 0 then raise exception 'Verificación posterior: % filas fuera del objetivo modificadas.', n; end if;",
    '  select count(*) into n from (',
    `    select 'section' kind, s.id, s.page_id parent, s.key, s.type, s.name, s.position, s.visible, s.sync_status, s.field_schema, s.settings`,
    `      from public.sections s join public.pages p on p.id = s.page_id where p.site_id = ${site}`,
    `    union all select 'global', g.id, g.site_id, g.key, null, null, null, null, null, null, null from public.site_globals g where g.site_id = ${site}`,
    '  ) cur full join _eze_expected e on e.id = cur.id',
    '  where cur.id is null or e.id is null',
    '     or (cur.kind, cur.parent, cur.key, cur.type, cur.name, cur.position, cur.visible, cur.sync_status) is distinct from (e.kind, e.parent, e.key, e.type, e.name, e.position, e.visible, e.sync_status)',
    '     or cur.field_schema is distinct from e.field_schema or cur.settings is distinct from e.settings;',
    "  if n > 0 then raise exception 'Verificación posterior: % filas con la estructura alterada.', n; end if;",
    `  select count(*) into n from public.pages cur full join _eze_pages e on e.id = cur.id where (cur.site_id = ${site} or e.id is not null)`,
    '    and (cur.id is null or e.id is null or (cur.key, cur.route, cur.slug, cur.name, cur.position) is distinct from (e.key, e.route, e.slug, e.name, e.position));',
    "  if n > 0 then raise exception 'Verificación posterior: % páginas alteradas.', n; end if;",
    '  -- Alcance: filas escritas por ESTA transacción en cada tabla (age(xmin) = 0). Solo pueden ser las del objetivo.',
    `  if (select count(*) from public.sections where age(xmin) = 0) <> ${nSec} then raise exception 'Alcance: se escribieron secciones fuera del objetivo.'; end if;`,
    `  if exists (select 1 from public.sections s where age(s.xmin) = 0 and not exists (select 1 from _eze_target t where t.id = s.id and t.kind = 'section')) then raise exception 'Alcance: sección escrita fuera del objetivo.'; end if;`,
    `  if (select count(*) from public.site_globals where age(xmin) = 0) <> ${nGlob} then raise exception 'Alcance: se escribieron globales fuera del objetivo.'; end if;`,
    `  if exists (select 1 from public.site_globals g where age(g.xmin) = 0 and not exists (select 1 from _eze_target t where t.id = g.id and t.kind = 'global')) then raise exception 'Alcance: global escrito fuera del objetivo.'; end if;`,
    "  if exists (select 1 from public.pages where age(xmin) = 0) or exists (select 1 from public.sites where age(xmin) = 0) then raise exception 'Alcance: se escribieron páginas o sitios.'; end if;",
    "  if to_regclass('public.articles') is not null then",
    "    execute 'select count(*) from public.articles where age(xmin) = 0' into n;",
    "    if n > 0 then raise exception 'Alcance: se escribieron artículos.'; end if;",
    '  end if;',
    `  raise notice 'Verificación posterior correcta: ${nSec} secciones y ${nGlob} globales con el contenido aprobado (${declared} claves); resto del sitio, estructura, páginas, artículos y otros sitios intactos.';`,
    'end $$;',
    '',
    'drop table if exists pg_temp._eze_pages, pg_temp._eze_expected, pg_temp._eze_target;',
  ];
  const header = (kind) => [
    `-- Etapa 4B · ${kind}`,
    `-- Reconciliación de contenido de ${SITE_SLUG} (${SITE_ID}) desde el respaldo leído el ${backup.read_at}. Manifiesto sha256 ${plan.manifest_sha256}.`,
    '-- Generado por scripts/cms-content-plan.mjs --definitivo. Mismo plan que el ensayo validado (aplicar.sql), con garantías reforzadas:',
    '--   bloqueo del sitio y de sus filas, verificación de estructura y contenido de las 68 filas y de las 12 páginas,',
    '--   escritura condicionada a que cada fila siga igual al respaldo, y verificación posterior de valores, estructura y alcance.',
    `-- Cambia solo content de ${nSec} secciones y ${nGlob} globales. Cualquier error aborta y revierte toda la transacción.`,
    '-- Ejecutar el script COMPLETO de una vez. No ejecutar partes sueltas.',
  ];
  const ensayo = [...header('ENSAYO REFORZADO · termina en ROLLBACK, no escribe nada'), ...body, 'rollback;', ''].join('\n');
  const definitivo = [
    ...header('APLICACIÓN DEFINITIVA · TERMINA EN COMMIT · ESCRIBE EN SUPABASE'),
    '-- ⚠ Ejecutar solo con autorización expresa, después de un ensayo reforzado sin errores y sin ediciones en el CMS desde el respaldo.',
    ...body, 'commit;', '',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'ensayo-reforzado.sql'), ensayo);
  fs.writeFileSync(path.join(outDir, 'aplicar-DEFINITIVO-commit.sql'), definitivo);
  console.log(`SQL reforzado: ensayo-reforzado.sql y aplicar-DEFINITIVO-commit.sql (${nSec} secciones, ${nGlob} globales, ${declared} claves).`);
}
console.log(`Plan (${mode}) en ${outDir}: ${counts.igual} campos iguales, ${counts.actualizar} a actualizar, ${counts.coleccion} colecciones, ${counts.crear} a crear; ${plans.length} filas cambian${mode === 'owner' ? '; SQL en aplicar.sql' : ''}.`);
