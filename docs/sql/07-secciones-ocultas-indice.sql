-- Secciones ocultas · índice público de secciones (get_public_section_index).
-- INSTALADO en Supabase; el código de la web que lo usa todavía no se publicó. Ejecutar (o reinstalar) solo con autorización, como owner, desde el SQL Editor de Supabase, ANTES de desplegar el código
-- de la web que lo usa (docs/claudia-cms-secciones-ocultas.md). Sin esta función, cada build en modo CMS se detiene.
--
-- Qué hace:
--   · Crea una función de solo lectura que devuelve, por sitio, la ruta, la clave y el valor real de `visible` de cada sección.
--     NUNCA devuelve contenido: el de una sección oculta sigue siendo privado.
--   · Identifica las secciones con los mismos criterios que public.get_public_section(text,text,text): sitio (sites.slug),
--     ruta (pages.route) y clave (sections.key). No agrega filtros: no usa sync_status ni ninguna otra columna.
--   · Devuelve `visible` tal cual, sin coalesce. La web solo considera visible el valor true; false, null o cualquier otro valor
--     cuenta como oculta, igual que el filtro `sec.visible = true` de get_public_section.
--   · No modifica tablas, datos ni políticas RLS. Es aditiva, como get_public_site_global y get_public_page_seo.
--   · Verifica, dentro de la misma transacción, que el índice coincide exactamente con get_public_section para el sitio de Claudia:
--     visible = true ⇔ get_public_section devuelve 1 fila. Si no coincide, aborta sin dejar cambios.
-- Se retira con docs/sql/07b-secciones-ocultas-indice-retirar.sql (primero revertir el código de la web).

begin;

-- 0) Requisitos. Cualquier diferencia aborta sin cambios.
do $$
declare
  v_type text;
  v_nullable text;
  v_default text;
begin
  select data_type, is_nullable, column_default into v_type, v_nullable, v_default
  from information_schema.columns
  where table_schema = 'public' and table_name = 'sections' and column_name = 'visible';
  if v_type is null then raise exception 'No existe la columna public.sections.visible.'; end if;
  if v_type <> 'boolean' then raise exception 'public.sections.visible es de tipo %, se esperaba boolean.', v_type; end if;
  raise notice 'public.sections.visible: boolean · admite null: % · default: %', v_nullable, coalesce(v_default, '(sin default)');
  if to_regprocedure('public.get_public_section(text,text,text)') is null then
    raise exception 'Falta public.get_public_section(text,text,text).';
  end if;
  if to_regprocedure('public.get_public_section_index(text)') is not null then
    raise exception 'public.get_public_section_index(text) ya existe: revisar antes de reemplazarla.';
  end if;
end $$;

-- 1) Índice público: solo metadatos estructurales.
create function public.get_public_section_index(site_slug text)
returns table (page_route text, section_key text, visible boolean)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select page.route::text, sec."key"::text, sec.visible
  from public.sections sec
  join public.pages page on page.id = sec.page_id
  join public.sites site on site.id = page.site_id
  where site.slug = get_public_section_index.site_slug
  order by page.route::text, sec."key"::text;
$function$;

revoke all on function public.get_public_section_index(text) from public;
grant execute on function public.get_public_section_index(text) to anon, authenticated;

comment on function public.get_public_section_index(text) is
  'Índice público de secciones: ruta, clave y visible (sin coalesce). Nunca devuelve contenido. Mismos criterios de identificación que get_public_section.';

-- 2) Verificación: misma identificación que get_public_section en el sitio de Claudia. Aborta si difiere.
do $$
declare
  v_rows integer;
  v_mismatch text;
begin
  select count(*) into v_rows from public.get_public_section_index('claudia-sanchez');
  if v_rows = 0 then raise exception 'El índice de claudia-sanchez está vacío.'; end if;

  select string_agg(format('%s::%s (visible=%s, filas públicas=%s)', i.page_route, i.section_key, coalesce(i.visible::text, 'null'), n.total), ', ')
  into v_mismatch
  from public.get_public_section_index('claudia-sanchez') i
  cross join lateral (
    select count(*) as total
    from public.get_public_section(site_slug => 'claudia-sanchez', page_route => i.page_route, section_key => i.section_key)
  ) n
  where (i.visible is true and n.total <> 1) or (i.visible is not true and n.total <> 0);
  if v_mismatch is not null then raise exception 'El índice no coincide con get_public_section: %', v_mismatch; end if;

  raise notice 'get_public_section_index: % secciones de claudia-sanchez, coherentes con get_public_section.', v_rows;
end $$;

commit;

-- ───────── Comprobaciones posteriores (solo lectura) ─────────
-- a) Como visitante anónimo: responde, y solo con ruta, clave y visible.
--    begin; set local role anon; select * from public.get_public_section_index('claudia-sanchez'); rollback;
-- b) Firma pública de la función (debe ser exactamente estas tres columnas):
--    select pg_get_function_result('public.get_public_section_index(text)'::regprocedure);
-- c) Secciones ocultas hoy en el sitio:
--    select * from public.get_public_section_index('claudia-sanchez') where visible is not true;
