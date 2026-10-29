// Genera (no ejecuta) el SQL que revierte una sincronización del manifiesto de Claudia a partir del respaldo owner.
// Deshace exactamente lo que modifica `sync_site_manifest`: filas creadas, name/route/slug de pages, name/field_schema/content
// de sections y content de site_globals. El SQL termina en ROLLBACK; pasarlo a COMMIT solo con autorización.
//   node scripts/cms-restore-sql.mjs <carpeta de respaldo owner | backup.json del SQL 04/Q6> > restaurar.sql
import fs from 'node:fs';
import path from 'node:path';

const SITE_ID = '1875d747-0758-4c09-b5b3-935a6ace0249';
const source = process.argv[2];
if (!source) throw new Error('Indicá la carpeta o el archivo del respaldo owner.');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
// El SQL Editor exporta Q6 como [{ "backup": {...} }]; también se acepta { backup } o el objeto directo.
const unwrapBackup = (raw) => { const row = Array.isArray(raw) ? raw[0] : raw; const b = row?.backup ?? row; return typeof b === 'string' ? JSON.parse(b) : b; };
const data = fs.statSync(source).isDirectory()
  ? { pages: readJson(path.join(source, 'pages.json')), sections: readJson(path.join(source, 'sections.json')), site_globals: readJson(path.join(source, 'site_globals.json')) }
  : unwrapBackup(readJson(source));
for (const row of [...data.pages, ...data.site_globals]) if (row.site_id !== SITE_ID) throw new Error(`El respaldo contiene una fila de otro sitio (${row.id}); se aborta.`);
const pageIds = new Set(data.pages.map(p => p.id));
for (const s of data.sections) if (!pageIds.has(s.page_id)) throw new Error(`Sección ${s.id} sin página del sitio en el respaldo; se aborta.`);

const TAG = '$eze_restore$';
const json = (value) => { const text = JSON.stringify(value ?? null); if (text.includes(TAG)) throw new Error('El contenido incluye el delimitador SQL.'); return `${TAG}${text}${TAG}::jsonb`; };
const text = (value) => value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`;
const uuidList = (rows) => rows.length ? rows.map(r => `'${r.id}'`).join(', ') : `'00000000-0000-0000-0000-000000000000'`;

const sql = [
  `-- Reversión de la sincronización de ${SITE_ID} al respaldo leído el ${data.read_at ?? '(fecha no registrada)'}.`,
  '-- Generado por scripts/cms-restore-sql.mjs. Revisar los conteos de cada sentencia antes de pasar ROLLBACK a COMMIT.',
  '-- Atención: también descarta las ediciones hechas en el CMS después del respaldo.',
  'begin;',
  `do $$ begin if not exists (select 1 from public.sites where id = '${SITE_ID}' and slug = 'claudia-sanchez') then raise exception 'Sitio inesperado'; end if; end $$;`,
  '',
  '-- 1) Secciones y páginas creadas después del respaldo (p. ej. Diseño de Carrera y Comunidad y Experiencias).',
  `delete from public.sections s using public.pages p where p.id = s.page_id and p.site_id = '${SITE_ID}' and s.id not in (${uuidList(data.sections)});`,
  `delete from public.pages where site_id = '${SITE_ID}' and id not in (${uuidList(data.pages)});`,
  `delete from public.site_globals where site_id = '${SITE_ID}' and id not in (${uuidList(data.site_globals)});`,
  '',
  '-- 2) Páginas existentes: nombre, ruta y slug.',
  ...data.pages.map(p => `update public.pages set name = ${text(p.name)}, route = ${text(p.route)}, slug = ${text(p.slug)} where id = '${p.id}' and site_id = '${SITE_ID}';`),
  '',
  '-- 3) Secciones existentes: nombre, esquema y contenido.',
  ...data.sections.map(s => `update public.sections set name = ${text(s.name)}, field_schema = ${s.field_schema == null ? 'null' : json(s.field_schema)}, content = ${json(s.content)} where id = '${s.id}' and page_id = '${s.page_id}';`),
  '',
  '-- 4) Globales: contenido completo (incluye metadatos _eze).',
  ...data.site_globals.map(g => `update public.site_globals set content = ${json(g.content)} where id = '${g.id}' and site_id = '${SITE_ID}';`),
  '',
  '-- Verificación: debe coincidir con la huella Q7 tomada junto al respaldo.',
  `select (select count(*) from public.pages where site_id = '${SITE_ID}') as paginas, (select count(*) from public.sections s join public.pages p on p.id = s.page_id where p.site_id = '${SITE_ID}') as secciones,`,
  `  (select md5(string_agg(s.id::text || s.content::text, '|' order by s.id)) from public.sections s join public.pages p on p.id = s.page_id where p.site_id = '${SITE_ID}') as huella_secciones;`,
  'rollback;',
  '',
].join('\n');
process.stdout.write(sql);
