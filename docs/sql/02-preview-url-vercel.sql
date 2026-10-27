-- REQUIERE AUTORIZACIÓN. No ejecutado.
-- Apunta el preview de Eze CMS de Claudia a la web publicada. Solo afecta a la fila de claudia-sanchez.
-- El desarrollo local sigue disponible sin tocar la base: en el .env.local del CMS,
-- VITE_EZE_PREVIEW_URLS={"claudia-sanchez":"http://localhost:5174"}

-- 1) Lectura previa: anotar el valor actual (es el valor de reversión).
select id, slug, preview_url from public.sites where id = '1875d747-0758-4c09-b5b3-935a6ace0249';

-- 2) Cambio. Termina en ROLLBACK a propósito: revisar la fila devuelta y, solo con autorización, cambiar a COMMIT.
begin;
update public.sites
set preview_url = 'https://claudia-sanchez.vercel.app'
where id = '1875d747-0758-4c09-b5b3-935a6ace0249'
  and slug = 'claudia-sanchez'
returning id, slug, preview_url;
-- Debe devolver exactamente 1 fila.
rollback;

-- Reversión (con el valor anotado en el paso 1):
-- update public.sites set preview_url = '<valor anterior>' where id = '1875d747-0758-4c09-b5b3-935a6ace0249' and slug = 'claudia-sanchez';
