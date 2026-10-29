-- Etapa 2A SEO · El despliegue automático (Etapa 5C) también se activa al editar el SEO de una página.
-- PREPARADO, NO EJECUTADO. Ejecutar solo con autorización, como owner, desde el SQL Editor de Supabase, con la
-- Etapa 5C (docs/sql/06-etapa5c-despliegue-automatico.sql) y la migración 009 del CMS (columnas SEO de pages) ya aplicadas.
-- No modifica ni reejecuta la 009 ni la 06.
--
-- Por qué: el HTML inicial de cada página se genera en el build con su SEO (scripts/seo-prerender-plugin.mjs).
-- public.update_page_seo (009) actualiza seo_title, meta_description, canonical_url y noindex de public.pages, pero la 06
-- solo escucha public.sections y public.site_globals, así que editar el SEO de una página no volvía a compilar el sitio.
--
-- Qué hace (cambio mínimo):
--   · Un trigger AFTER UPDATE OF seo_title, meta_description, canonical_url, noindex ON public.pages. Postgres solo lo
--     invoca cuando el UPDATE incluye alguna de esas columnas: ediciones de nombre, ruta, slug u otras columnas no lo activan.
--   · La función compara valor viejo y nuevo de las cuatro columnas (IS DISTINCT FROM). update_page_seo hace el UPDATE
--     aunque se guarde lo mismo: sin cambio real no marca nada.
--   · Marca el sitio con eze_deploy.mark_sites_changed, la función existente de la 06. Reutiliza todo lo demás:
--       - solo los sitios registrados en eze_deploy.site_deploy (hoy, únicamente el de Claudia) y habilitados quedan
--         marcados: los cambios de otros clientes no hacen nada;
--       - agrupación (quiet_seconds 120 s / max_wait_seconds 600 s), un único aviso por ronda, seguimiento, reintentos y
--         la misma tarea de pg_cron. Guardar el SEO de varias páginas seguidas genera un único despliegue.
--   · Igual que los triggers de la 06: nunca hace fallar la edición en el CMS ni llama a la red desde el trigger.
--   · No reacciona a INSERT/DELETE de páginas (los hace el sincronizador del manifiesto, no la edición de SEO).
-- Se retira con docs/sql/08b-etapa2a-seo-paginas-despliegue-retirar.sql. El retiro completo de la 06 (06b) también lo
-- elimina, porque borra el esquema eze_deploy con CASCADE.

begin;

-- 0) Requisitos. Cualquier falta aborta sin cambios.
do $$
begin
  if to_regprocedure('eze_deploy.mark_sites_changed(uuid[])') is null or to_regclass('eze_deploy.site_deploy') is null then
    raise exception 'Falta el despliegue automático de la Etapa 5C (docs/sql/06-etapa5c-despliegue-automatico.sql).';
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'pages'
         and column_name in ('site_id', 'seo_title', 'meta_description', 'canonical_url', 'noindex')) <> 5 then
    raise exception 'public.pages no tiene site_id y las columnas SEO de la migración 009.';
  end if;
end $$;

-- 1) Marca de cambios del SEO de una página.
create or replace function eze_deploy.on_page_seo_change()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  if old.seo_title is not distinct from new.seo_title and old.meta_description is not distinct from new.meta_description
     and old.canonical_url is not distinct from new.canonical_url and old.noindex is not distinct from new.noindex
     and old.site_id is not distinct from new.site_id then
    return null;
  end if;
  perform eze_deploy.mark_sites_changed(array[old.site_id, new.site_id]);
  return null;
exception when others then
  raise warning '[eze_deploy] No se pudo registrar el cambio de SEO de página: %', sqlerrm;
  return null;
end $$;

revoke all on function eze_deploy.on_page_seo_change() from public, anon, authenticated;

drop trigger if exists eze_deploy_page_seo_change on public.pages;
create trigger eze_deploy_page_seo_change
  after update of seo_title, meta_description, canonical_url, noindex on public.pages
  for each row execute function eze_deploy.on_page_seo_change();

-- 2) Comprobación final: debe mostrar 1 trigger nuevo, los 2 de la 06 y el sitio de Claudia habilitado.
select (select count(*) from pg_trigger where tgname = 'eze_deploy_page_seo_change')::int as trigger_seo_paginas,
       (select count(*) from pg_trigger where tgname in ('eze_deploy_section_change', 'eze_deploy_global_change'))::int as triggers_etapa_5c,
       (select count(*) from eze_deploy.site_deploy where enabled)::int as sitios_registrados;

commit;
