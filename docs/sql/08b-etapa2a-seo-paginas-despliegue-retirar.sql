-- Retira el disparo del despliegue automático por cambios de SEO de páginas (docs/sql/08-etapa2a-seo-paginas-despliegue.sql).
-- PREPARADO, NO EJECUTADO. Ejecutar solo con autorización, como owner, desde el SQL Editor de Supabase.
-- No toca la Etapa 5C (secciones y globales siguen desplegando), ni páginas, ni datos. Después de retirarlo, editar el SEO de
-- una página vuelve a requerir un despliegue manual para que llegue al HTML inicial.

begin;
drop trigger if exists eze_deploy_page_seo_change on public.pages;
drop function if exists eze_deploy.on_page_seo_change();

select (select count(*) from pg_trigger where tgname = 'eze_deploy_page_seo_change')::int as trigger_restante,
       (select count(*) from pg_trigger where tgname in ('eze_deploy_section_change', 'eze_deploy_global_change'))::int as triggers_etapa_5c;
commit;
