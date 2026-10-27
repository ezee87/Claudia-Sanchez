-- Respaldo de SOLO LECTURA del sitio claudia-sanchez (alternativa a `npm run cms:backup -- --owner`).
-- Ejecutar en el SQL Editor de Supabase y guardar el resultado como JSON fechado fuera del repositorio,
-- p. ej. ../claudia-sanchez-cms-backups/<fecha>_sql/backup.json. No modifica ninguna fila.
-- Alcance: solo el site_id de Claudia. No incluye artículos (no se tocan en esta reconciliación).

select jsonb_pretty(jsonb_build_object(
  'read_at', now(),
  'site', (select to_jsonb(s) from public.sites s where s.id = '1875d747-0758-4c09-b5b3-935a6ace0249' and s.slug = 'claudia-sanchez'),
  'pages', (select coalesce(jsonb_agg(to_jsonb(p) order by p.route), '[]'::jsonb)
            from public.pages p where p.site_id = '1875d747-0758-4c09-b5b3-935a6ace0249'),
  'sections', (select coalesce(jsonb_agg(to_jsonb(x) order by p.route, x.position), '[]'::jsonb)
               from public.sections x join public.pages p on p.id = x.page_id
               where p.site_id = '1875d747-0758-4c09-b5b3-935a6ace0249'),
  'site_globals', (select coalesce(jsonb_agg(to_jsonb(g) order by g.key), '[]'::jsonb)
                   from public.site_globals g where g.site_id = '1875d747-0758-4c09-b5b3-935a6ace0249'),
  'site_modules', (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
                   from public.site_modules m where m.site_id = '1875d747-0758-4c09-b5b3-935a6ace0249')
)) as backup;

-- Verificaciones de la etapa 0 (también de solo lectura).
-- a) Claves almacenadas: deben coincidir con `pages[].key` del manifiesto antes de sincronizar.
select key, route, slug, name from public.pages
where site_id = '1875d747-0758-4c09-b5b3-935a6ace0249' order by route;

-- b) Definición de las RPC públicas (R13: ¿filtran por visible o sync_status?).
select p.proname, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('get_public_section', 'get_public_site_global');
