# SEO · Etapa 2A: metadatos del CMS en páginas y artículos

Fecha: 2026-10-29. Antecedentes: [seo-diagnostico.md](seo-diagnostico.md) y [seo-etapa1-articulos.md](seo-etapa1-articulos.md). No se modificaron el CMS, la base de datos, el diseño, los contenidos ni las rutas.

## Contrato utilizado (verificado con la clave pública)

- `get_published_articles`: 18 artículos con `seo_title`, `meta_description`, `cover_image_alt`, `canonical_url` y `noindex`. Hoy todos están vacíos y `noindex` vale `false`.
- `get_public_page_seo(p_site_slug, p_page_route)`: una fila por página del manifiesto (10, incluida `/articulos/:slug`). Una ruta no registrada devuelve `[]`.

## Reglas (un solo módulo: `src/integration/eze-cms/seoShared.js`)

Las usan React, la función de artículos y el build, así el HTML inicial y el que calcula React no pueden divergir.

| Dato | Artículo | Página |
|---|---|---|
| Título | `seo_title`, tal cual; si falta, `título editorial \| Claudia Sánchez Urencio` | `seo_title`; si falta, la sección `seo` (CMS o local); si está oculta, el título del documento |
| Descripción | `meta_description` completa; si falta, el extracto o el comienzo del cuerpo (160 caracteres) | `meta_description`; si falta, la sección `seo` |
| Canonical | `canonical_url` si es https, sin credenciales y no es `localhost`, una IP ni `*.vercel.app`; si no, `VITE_SITE_URL` + ruta; si no hay dominio, ninguno | Igual (en `/404` nunca hay canonical) |
| Robots | `index` solo si el bloqueo global está levantado **y** `noindex` no es `true` | Igual, y `/404` y `/gracias` siempre `noindex` |
| Imagen | `cover_image_alt` en la imagen destacada, `og:image:alt` y `twitter:image:alt` (vacío: decorativa) | — |
| JSON-LD | `BlogPosting`: `headline` es el título editorial (el del `h1`), y `description` y `mainEntityOfPage` son los mismos de los metadatos | — |

**Bloqueo global** (`globalIndexing`): se mantiene. Solo se levanta si se cumplen tres condiciones: `VITE_SEO_ALLOW_INDEXING=true`, un `VITE_SITE_URL` válido y que la petición llegue por ese mismo host. Si el hosting informa el entorno (`VERCEL_ENV`), además debe ser producción. `noindex = false` nunca levanta el bloqueo. Hoy no hay dominio ni autorización, así que todo sale `noindex, nofollow, noarchive` y sin canonical.

El SEO genérico de `/articulos/:slug` nunca se aplica a un artículo: no se consulta. Mientras el artículo carga en el navegador, `Seo.jsx` no escribe nada, y solo se usa la sección genérica si el artículo no existe.

## Arquitectura

- **Artículos** (`api/articulo.js`, Etapa 1): toma los campos nuevos.
  - La plantilla `dist/index.html` ahora trae los metadatos de Inicio: la función los retira (`stripSeoTags`) antes de escribir los del artículo.
  - Los errores 503 y 500 usan un título neutro.
- **Páginas: HTML por ruta generado en el build** (`scripts/seo-prerender-plugin.mjs`):
  - El snapshot del CMS (`scripts/cms-snapshot-plugin.mjs`) ya leía secciones y globales. Ahora lee también `get_public_page_seo` de cada página.
  - Después de `vite build`, el plugin escribe:
    - `dist/index.html` (Inicio);
    - `dist/<ruta>/index.html` (`personas`, `empresas`, `comunidad-y-experiencias`, `contacto`, `articulos`, `gracias`, `diseno-de-carrera`);
    - `dist/404.html`.
  - Cada uno lleva su `<title>`, description, robots, canonical y Open Graph. El contenido lo sigue montando React.
  - Los fallbacks locales se cargan con Vite (`pageSeoSources.js`) y se mezclan con `mergeCmsContent`, la misma regla de React.
- **Navegador:** `usePageSeo` usa la fila del build como estado inicial y la revalida con `get_public_page_seo`, a través de la integración existente (mismo cliente Supabase, `deliverTogether`, sin consultas en modo local).
  - En las páginas, `Seo.jsx` reemplaza siempre las etiquetas del build por las calculadas con el dato revalidado (son las mismas, salvo que el CMS haya cambiado después del build).
  - En los artículos conserva las del servidor, generadas en la misma petición, hasta que se navega a otra URL.
  - La landing (`usePrivateDocument`) actualiza el título y la descripción y conserva el resto.
  - Si el host no es el definitivo, siempre se endurece `robots`.
- **Por qué no SSR general:** las páginas normales no dependen de datos por petición; su SEO solo cambia cuando se edita el CMS. Un HTML estático por ruta da el mismo resultado para los rastreadores, sin servidor y en cualquier hosting. El costo es la actualización, que depende de un nuevo build (ver pendientes).

## Requisitos para el hosting definitivo (pendiente de su elección)

Los archivos son estáticos y funcionan en cualquier hosting. Cada uno debe configurarse así:

1. **URL → archivo:** `/personas` → `personas/index.html` (índice de directorio, como `try_files $uri $uri/index.html` en nginx). Vercel, Netlify y Cloudflare Pages lo hacen por defecto.
2. **Fallback de la SPA:** `/404.html`, no `/index.html`, que ahora tiene los metadatos de Inicio. En `vercel.json` ya está cambiado. En otro hosting hay que hacer el cambio equivalente.
3. **Artículos:** necesitan ejecutar `api/articulo.js` (función Node).
   - En Vercel ya está resuelto.
   - En otro hosting hay que adaptar el handler (por ejemplo, a una función de Netlify o Cloudflare, o a un servidor Node) y el rewrite `/articulos/:slug` → función, más el 308 de la barra final.
   - Sin función, los artículos siguen funcionando como SPA, pero sin metadatos en el HTML inicial.
4. **Indexación:** al publicar, configurar `VITE_SITE_URL` (dominio definitivo) y `VITE_SEO_ALLOW_INDEXING=true` en el build de producción. El HTML del build no conoce el host. Si el mismo build se sirve también desde un dominio secundario o temporal, el navegador vuelve a bloquear la indexación, pero un rastreador sin JS vería `index`. Para evitarlo, el hosting debe enviar `X-Robots-Tag: noindex` en esos hosts o redirigirlos al definitivo. `robots.txt` (`Disallow: /`) sigue sin cambios: es de la Etapa 2.

## Validación (local, sin despliegue)

- `npm test` (incluye `scripts/test-seo-cms.mjs`, nuevo), `npm run typecheck` y `npm run build`: sin errores. El build informa "SEO de 9 páginas" y genera los 9 HTML.
- **HTTP sin JavaScript** (emulación local del enrutado de `vercel.json` con la función real y datos reales):
  - los 18 artículos devuelven 200, con 1 `<title>`, 1 robots, 1 description, 1 `h1` y 1 JSON-LD, sin restos de los metadatos de Inicio;
  - un artículo inexistente devuelve 404;
  - la barra final devuelve 308;
  - las 8 páginas tienen sus metadatos;
  - una ruta desconocida recibe el 404 neutro con `noindex`.
- **Artículo con SEO del CMS:** función real, plantilla real y respuesta real de Supabase, con los campos SEO agregados en memoria (sin escribir en el CMS).
  - Se aplican `seo_title`, `meta_description`, `canonical_url` y el alt, con el JSON-LD sincronizado.
  - `noindex=true` se respeta aun con la indexación global habilitada.
  - Un canonical a `*.vercel.app` se descarta.
- **Chrome headless:**
  - Carga directa de páginas, landing, `/gracias` y ruta desconocida: una etiqueta de cada tipo.
  - Navegación interna (listado → artículo → relacionado): React calcula los mismos metadatos que el HTML del build, sin duplicados ni errores de consola.

## Limitación: actualización del SEO de páginas

El despliegue automático de la etapa 5C ([06-etapa5c-despliegue-automatico.sql](sql/06-etapa5c-despliegue-automatico.sql)) solo se dispara con cambios en `sections` y `site_globals`. Si se edita el SEO de una página en el CMS:
- el HTML inicial (el que leen los rastreadores sin JS) conserva el valor anterior hasta el próximo despliegue;
- con JavaScript, React ya muestra el valor nuevo.

Los artículos no tienen este problema: se resuelven en cada petición, con caché de 5 minutos.

**Corrección preparada, no ejecutada:** [08-etapa2a-seo-paginas-despliegue.sql](sql/08-etapa2a-seo-paginas-despliegue.sql), que se retira con [08b](sql/08b-etapa2a-seo-paginas-despliegue-retirar.sql). Mientras no se ejecute, hay que redesplegar a mano después de editar el SEO de una página.

### Mecanismo

- **Trigger:** `AFTER UPDATE OF seo_title, meta_description, canonical_url, noindex ON public.pages`. Postgres solo lo invoca si el `UPDATE` incluye esas columnas.
- **Sin cambio real, sin despliegue:** la función compara valor viejo y nuevo (`IS DISTINCT FROM`). `update_page_seo` hace el `UPDATE` aunque se guarde lo mismo, y en ese caso no marca nada.
- **Reutiliza la 06:** llama a `eze_deploy.mark_sites_changed`, así que se aprovecha todo lo existente:
  - solo marcan los sitios registrados y habilitados en `eze_deploy.site_deploy` (hoy, únicamente Claudia), de modo que los cambios de otros clientes no hacen nada;
  - la misma agrupación (120 s sin ediciones, o 600 s como máximo), con un único aviso por ronda;
  - el mismo seguimiento y los mismos reintentos;
  - la misma tarea de `pg_cron`.
- **Lo que no hace:** no modifica la 009 ni la 06, no llama a la red desde el trigger y nunca hace fallar el guardado en el CMS.

### Prueba realizada

Postgres real (PGlite 0.3.14), con las secciones 1 y 2 de la 06 y la `update_page_seo` de la 009 tal cual, más la 08 y la 08b. Las 11 comprobaciones pasan:
- sin la 06, la 08 aborta sin dejar cambios;
- un cambio real de cada columna SEO (incluido pasar a `NULL`) marca el despliegue;
- guardar los mismos valores, aun con espacios que `btrim` elimina, no marca;
- el SEO de otro sitio no marca a Claudia ni registra a ese sitio;
- editar nombre o ruta no marca;
- dos ediciones seguidas generan una sola marca pendiente;
- con `enabled = false` no marca;
- un fallo del registro no hace fallar `update_page_seo`;
- la 08b la retira sin tocar los triggers de la 06, y la 08 puede reejecutarse sin duplicar.

No se probó el envío a Vercel (`pg_net`, `pg_cron`, Vault): no cambia y ya está validado en la 5C.

### Verificación en Supabase, después de ejecutar la 08

1. La consulta final de la migración debe devolver `trigger_seo_paginas = 1`, `triggers_etapa_5c = 2` y `sitios_registrados = 1`.
2. Guardar desde el CMS el SEO de una página de Claudia con un valor nuevo. Luego:
   `select pending_since, last_change_at, last_result from eze_deploy.site_deploy;` → `pending_since` deja de ser `NULL`.
3. Unos 2 minutos después (agrupación de 120 s más el minuto de `pg_cron`), la misma consulta muestra `last_result = 'aceptado por Vercel (HTTP 2xx)'` (con el código real) y en Vercel aparece un despliegue nuevo.
4. Al terminar el build, `curl -s https://<dominio>/<ruta>` debe mostrar en `<title>` / `description` el valor nuevo.
5. Guardar de nuevo sin cambiar nada: `pending_since` sigue en `NULL` y no hay despliegue nuevo.

## Pendientes para la Etapa 2B (optimización editorial de los 18 artículos)

- Cargar `meta_description` en los 18. Hoy la descripción sale del comienzo del cuerpo, y en algunos casos empieza con la fecha (p. ej. "19 de octubre de 2026 He pasado…").
- Cargar `cover_image_alt`. Todas las portadas comparten la misma imagen y hoy son decorativas.
- `seo_title` donde el título editorial sea largo. Se usa tal cual, sin la firma del sitio.
- Decidir `canonical_url` solo donde corresponda. Por defecto se usa el dominio definitivo, cuando exista.
- Revisar los 8 slugs truncados a 75 caracteres (decisión editorial; cambiarlos requiere redirecciones).
- Cargar `seo_title` y `meta_description` de las páginas en el CMS, si se quiere reemplazar los de las secciones `seo`.
