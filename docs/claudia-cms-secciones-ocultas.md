# Secciones ocultas en la web de Claudia (Eze CMS)

Estado: **RPC instalada en Supabase y verificada (57 secciones visibles, 0 ocultas). Código probado en local, todavía sin publicar ni desplegar.**

## Problema

El build en modo CMS exigía exactamente 1 fila de `get_public_section` por cada sección del manifiesto. Esa RPC filtra por `sec.visible = true`, así que una sección oculta respondía `[]`, la misma respuesta que una sección inexistente, y el build se detenía. En el navegador, la respuesta vacía se interpretaba como «sin publicar» y se mostraba el contenido del build o el local, de modo que la sección oculta seguía viéndose.

## Solución

Una RPC pública nueva, de solo lectura, `get_public_section_index(site_slug)` ([SQL](sql/07-secciones-ocultas-indice.sql)), devuelve la ruta, la clave y el valor real de `visible` de cada sección del sitio. Nunca devuelve contenido. Identifica las secciones con los mismos criterios que `get_public_section` (sitio, ruta y clave), sin filtros adicionales.

| Caso | Build | Navegador |
|---|---|---|
| Visible (`visible = true`) | Se lee su contenido; si `get_public_section` no devuelve la fila, el build falla (inconsistencia) | Se muestra como antes |
| Oculta (`false`, `null` u otro valor) | Se registra como oculta y no se lee | No se monta: ni contenido del build ni fallback local, desde el primer render |
| No está en el índice | **Error de integridad: el build falla** | Conserva el estado del build |
| Índice no disponible o mal formado | **El build falla** (con reintentos ante red o 5xx) | Conserva el estado del build; un error nunca oculta ni muestra una sección |
| Oculta después del despliegue, con la página abierta o recargada | — | Al leer el índice, la sección se desmonta |
| Vuelve a mostrarse después del despliegue | — | Se lee primero su contenido de Eze CMS y recién entonces aparece, en su posición original |

Al cambiar `visible` también se dispara el despliegue automático (el trigger `eze_deploy.on_section_change` reacciona a esa columna). El build siguiente ya trae la visibilidad nueva.

### Cómo se oculta en la página

- **Bloques**: `CmsSection` (`SectionBlock` en las páginas institucionales y `ClaudiaSection` en la landing) desmonta el bloque completo. El orden de las secciones visibles no cambia.
- **Campos**: `CmsEditable` y `CmsEditableCollection` no renderizan los campos de una sección oculta, aunque aparezcan fuera de su bloque. Por ejemplo, las etiquetas de `/articulos › listado` en las tarjetas de artículos.
- **Casos explícitos**:
  - `seo` oculta: no se aplican su título ni su descripción.
  - Navegación de la landing: no enlaza anclas de secciones ocultas, y la frase del menú móvil (que viene de `situations`) tampoco se muestra.
  - `pie-articulo` oculta: el autor del artículo sale del global del pie.

## Archivos

| Archivo | Cambio |
|---|---|
| `scripts/cms-snapshot-plugin.mjs` | Lee el índice; distingue visibles, ocultas e inexistentes; `snapshot.hidden` |
| `src/integration/eze-cms/cmsClient.ts` | `parseSectionIndex` y `createPublicSectionIndexReader` |
| `src/integration/eze-cms/cmsVisibility.ts` (nuevo) | Estado de visibilidad: arranca con el del build y se actualiza con el índice |
| `src/integration/eze-cms/cmsRuntime.ts` | `refreshCmsSectionVisibility` y `applyCmsSectionIndex` (lectura del índice en el navegador) |
| `src/integration/eze-cms/cmsSnapshot.ts` | `hidden` en el snapshot; contenido de secciones reveladas |
| `src/integration/eze-cms/CmsSection.tsx` (nuevo) | Envoltorio de bloque |
| `src/integration/eze-cms/useCmsSection.ts` | Devuelve `hidden` |
| `src/integration/eze-cms/CmsEditable.tsx`, `CmsEditableCollection.tsx` | No renderizan campos de secciones ocultas |
| `src/integration/eze-cms/ClaudiaCms.jsx`, `src/components/institutional/Cms.jsx` | `ClaudiaSection`, `useClaudiaHiddenSections`, `SectionBlock` |
| Páginas y componentes (`HomePage`, `PersonasPage`, `EmpresasPage`, `ComunidadPage`, `ContactoPage`, `Pages`, `Section`, `ContactForm`, `Seo`, `articles`, `ClaudiaSite`, `Approach`, `About`, `SiteHeader`, `SiteFooter`) | Envoltorios de bloque; guardas de GSAP cuando falta el hero o el cierre |
| `src/data/claudia/landingCms.js` | `navSectionKeys` (enlace de navegación → sección) |
| `src/utils/usePrivateDocument.js` | Sin título, conserva el del documento |
| `scripts/test-cms-visibility.mjs` (nuevo), `scripts/test-editorial.mjs`, `package.json` | Pruebas |
| `docs/sql/07-…sql`, `docs/sql/07b-…-retirar.sql` | Instalación y retiro de la RPC |

## Instalación (en este orden)

1. **Respaldo** como owner (`npm run cms:backup -- --owner` o `docs/sql/01-…`).
2. **Instalar la RPC**: ejecutar [07-secciones-ocultas-indice.sql](sql/07-secciones-ocultas-indice.sql) como owner en el SQL Editor.
   - Comprueba que `sections.visible` sea `boolean` e informa si admite `null` y su default.
   - Crea la función y verifica, dentro de la misma transacción, que coincide con `get_public_section` en todas las secciones de Claudia. Si algo no coincide, no deja cambios.
3. **Comprobar como anónimo** (comprobaciones a–c al final del SQL): responde solo con `page_route`, `section_key` y `visible`.
4. **Build local contra Supabase**: `npm run build` (sin `VITE_CMS_LOCAL_ONLY`). Debe informar `55 secciones visibles, 0 ocultas y 2 globales` (o las ocultas que haya).
5. **Commit, push y despliegue** del código.

> **No desplegar el código antes del paso 2.** Sin la RPC, cada build en modo CMS se detiene con `No se pudo obtener el índice de secciones: HTTP 404`. Vercel conserva el último despliegue correcto, pero los cambios del CMS dejan de publicarse.

## Reversión

1. Revertir el código en Git y desplegar. La versión anterior no usa la RPC.
2. Recién entonces, si se quiere, ejecutar [07b-secciones-ocultas-indice-retirar.sql](sql/07b-secciones-ocultas-indice-retirar.sql).

La RPC sola no cambia nada visible. Puede quedar instalada aunque se revierta el código.

## Verificación con una sección real

Eze CMS **hoy solo muestra** si una sección está «Visible» u «Oculta»: no tiene un control para cambiarlo. Mientras no lo tenga, el cambio se hace como owner con un `update` de `public.sections.visible`. Es un cambio de datos del CMS, requiere autorización y dispara el despliegue automático.

**Prueba sin efecto visible.** Usa `/gracias › confirmacion`: existe en Supabase y en el manifiesto, pero la página no la renderiza (está desactivada a propósito). Hacerla después del despliegue del paso 5:

```sql
-- Ocultar (owner). Anotar el valor previo de visible para restaurarlo.
update public.sections sec set visible = false
from public.pages page
where page.id = sec.page_id and page.site_id = '1875d747-0758-4c09-b5b3-935a6ace0249'
  and page.route = '/gracias' and sec.key = 'confirmacion';
```

1. El despliegue automático debe terminar bien. En el log de Vercel debe figurar `54 secciones visibles, 1 ocultas`.
2. `select * from public.get_public_section_index('claudia-sanchez') where visible is not true;` → solo esa fila.
3. `/gracias` se ve igual que antes.
4. Restaurar con `visible = true`. El despliegue siguiente debe informar `55 visibles, 0 ocultas`.

**Prueba con un bloque visible (opcional, la ven los visitantes).** Por ejemplo `/ › testimonios`:

1. Con la home abierta, ocultarla. Al recargar antes del nuevo despliegue, la sección desaparece después de la lectura del índice (puede verse un instante; ver limitaciones).
2. Después del despliegue, una recarga forzada no la muestra en ningún momento. Tampoco aparece el enlace ni su texto, y el resto conserva el orden.
3. Volver a mostrarla: tras el despliegue reaparece con su contenido y en su lugar.

## Limitaciones

- **Ventana hasta el nuevo despliegue.** Una página servida por el despliegue anterior arranca con la visibilidad de ese build. La lectura del índice la corrige en menos de 2,5 s. Una sección recién ocultada puede verse un instante, y una recién mostrada aparece con retraso. Después del despliegue automático no hay parpadeo.
- **Animaciones.** Una sección revelada con la página abierta aparece sin su animación de entrada hasta la próxima carga. Al ocultar o mostrar con la página abierta se recalcula ScrollTrigger.
- **Secciones anidadas.** L.I.F.E. (`life`) está dentro del bloque `approach` y el cierre de reserva (`closing`) dentro de `about`. Cada una se oculta sola, pero ocultar el contenedor también las oculta.
- **Imágenes compartidas.** El retrato de «Sobre mí» en la landing se lee de `hero`, y el fondo de contacto de Personas y Comunidad se lee de `/ › contacto`. Si la sección de origen está oculta, esas secciones visibles usan la imagen del repositorio.
- **Hero oculto:** la página queda sin `h1`.
- **SEO oculto:** se conserva el título del documento; en navegación interna, el de la página anterior.
- **Enlaces editoriales** (CTA como `#servicios`) que apunten a una sección oculta no se quitan. Solo la navegación de la landing lo hace.
- **Vista previa del CMS:** las secciones ocultas tampoco se ven en el iframe. Se siguen editando desde el panel.
- **Exposición:** la RPC hace públicas la clave y la visibilidad de las secciones ocultas de cualquier sitio, nunca su contenido. Es el mismo modelo que `get_public_page_seo` con las rutas.
- **`vite dev`** con `VITE_CMS_LOCAL_ONLY=false` no tiene snapshot: en desarrollo una sección oculta puede verse hasta leer el índice. En producción el snapshot siempre existe.
