-- Retira el índice público de secciones (docs/sql/07-secciones-ocultas-indice.sql).
-- PREPARADO, NO EJECUTADO. Ejecutar solo con autorización, como owner, desde el SQL Editor de Supabase.
--
-- ORDEN OBLIGATORIO: primero desplegar en Vercel la versión de la web que no usa get_public_section_index (revertir el código).
-- Si se retira la función con el código nuevo publicado, cada build en modo CMS se detiene con
-- «No se pudo obtener el índice de secciones» y los cambios del CMS dejan de publicarse (Vercel conserva el último despliegue).
-- No toca tablas, datos ni políticas RLS.

begin;
drop function if exists public.get_public_section_index(text);
commit;
