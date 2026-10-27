-- REQUIERE AUTORIZACIÓN. No ejecutado.
-- Elimina del CMS la página antigua /disena-tu-futuro de Claudia y sus secciones, para que Claudia vea una sola
-- página de Diseño de Carrera. Ejecutar SOLO después de:
--   1. sincronizar el manifiesto y verificar /diseno-de-carrera en el CMS y en https://claudia-sanchez.vercel.app/;
--   2. tomar el respaldo owner (npm run cms:backup -- --owner, o 01-respaldo-claudia-solo-lectura.sql) y guardar
--      además la salida de la PARTE A de este archivo.
-- La redirección pública /disena-tu-futuro → /diseno-de-carrera vive en vercel.json y en React: no depende de esta página.
-- No se borran archivos del bucket page-images (el retrato subido queda como histórico).

-- ============ PARTE A · Verificación y respaldo de la página antigua (solo lectura) ============

-- A1) Ambas páginas, con sus claves. Esperado: una fila por ruta.
select id, key, route, slug, name from public.pages
where site_id = '1875d747-0758-4c09-b5b3-935a6ace0249' and route in ('/disena-tu-futuro', '/diseno-de-carrera');

-- A2) Respaldo completo de la página antigua y sus secciones (guardar el resultado).
select jsonb_pretty(jsonb_build_object(
  'read_at', now(),
  'page', to_jsonb(p),
  'sections', (select coalesce(jsonb_agg(to_jsonb(s) order by s.position), '[]'::jsonb) from public.sections s where s.page_id = p.id)
)) as backup_disena_tu_futuro
from public.pages p
where p.site_id = '1875d747-0758-4c09-b5b3-935a6ace0249' and p.route = '/disena-tu-futuro';

-- A3) La página nueva está completa. Esperado: 10 secciones (hero, situations, career-testimonials, approach,
--     life, about, closing, site-header, site-footer, seo), todas con contenido.
select s.key, s.position, s.visible, s.sync_status, s.content <> '{}'::jsonb as con_contenido
from public.sections s join public.pages p on p.id = s.page_id
where p.site_id = '1875d747-0758-4c09-b5b3-935a6ace0249' and p.route = '/diseno-de-carrera'
order by s.position;

-- A4) Dependencias: tablas con claves foráneas hacia pages o sections (para saber si el borrado propaga o falla).
select con.conrelid::regclass as tabla, con.conname, pg_get_constraintdef(con.oid) as definicion
from pg_constraint con
where con.contype = 'f' and con.confrelid in ('public.pages'::regclass, 'public.sections'::regclass);

-- A5) Contenido de Claudia que todavía enlaza a la ruta antigua (debe corregirse en la etapa 4; la redirección
--     mantiene esos enlaces funcionando mientras tanto). Esperado tras la etapa 4: 0 filas fuera de la página antigua.
select p.route, s.key from public.sections s join public.pages p on p.id = s.page_id
where p.site_id = '1875d747-0758-4c09-b5b3-935a6ace0249' and p.route <> '/disena-tu-futuro'
  and s.content::text like '%/disena-tu-futuro%';
select key from public.site_globals
where site_id = '1875d747-0758-4c09-b5b3-935a6ace0249' and content::text like '%/disena-tu-futuro%';

-- A6) Archivos del bucket que cuelgan de la página antigua (no se borran; solo inventario).
select o.name from storage.objects o join public.pages p on o.name like p.site_id::text || '/pages/' || p.id::text || '/%'
where o.bucket_id = 'page-images' and p.site_id = '1875d747-0758-4c09-b5b3-935a6ace0249' and p.route = '/disena-tu-futuro';

-- ============ PARTE B · Eliminación (transacción con verificaciones; termina en ROLLBACK) ============
begin;
do $$
declare
  v_site constant uuid := '1875d747-0758-4c09-b5b3-935a6ace0249';
  v_old uuid;
  v_new_sections int;
  v_deleted int;
begin
  select id into strict v_old from public.pages where site_id = v_site and route = '/disena-tu-futuro';
  select count(*) into v_new_sections from public.sections s join public.pages p on p.id = s.page_id
    where p.site_id = v_site and p.route = '/diseno-de-carrera' and s.content <> '{}'::jsonb;
  if v_new_sections < 10 then
    raise exception 'La página /diseno-de-carrera tiene % secciones con contenido (se esperaban 10). Se aborta.', v_new_sections;
  end if;

  delete from public.sections where page_id = v_old;
  get diagnostics v_deleted = row_count;
  raise notice 'Secciones eliminadas de /disena-tu-futuro: %', v_deleted;

  delete from public.pages where id = v_old and site_id = v_site and route = '/disena-tu-futuro';
  get diagnostics v_deleted = row_count;
  if v_deleted <> 1 then raise exception 'Se esperaba eliminar 1 página y se eliminaron %. Se aborta.', v_deleted; end if;
end $$;

-- Verificación dentro de la transacción. Esperado: una sola fila, /diseno-de-carrera.
select key, route, slug, name from public.pages
where site_id = '1875d747-0758-4c09-b5b3-935a6ace0249' and (route like '/disen%' or key like '%carrera%' or key like '%futuro%');

-- Revisar las salidas anteriores y, SOLO con autorización, reemplazar ROLLBACK por COMMIT.
rollback;

-- Reversión tras un COMMIT: volver a insertar la página y sus secciones desde el JSON de A2
-- (mismos id, key, route, slug, content y field_schema), con un usuario owner y en una transacción.
