# Reconciliación Claudia ↔ Eze CMS · Preparación (etapa 0 y 1)

Complementa [claudia-cms-reconciliation.md](claudia-cms-reconciliation.md). **No se escribió nada en Supabase**: no se ejecutó SQL, no se sincronizó el manifiesto y no se borró ninguna página. Las únicas operaciones remotas fueron lecturas públicas (RPC con la clave anon).

Decisiones aplicadas: la versión aprobada es el render local; orden de Empresas Ana Cristina · Pedro · Ricardo; una sola página de Diseño de Carrera en `/diseno-de-carrera` (opción B del informe: página nueva, y luego se borra `/disena-tu-futuro`); web publicada `https://claudia-sanchez.vercel.app/`.

---

## 1. Versión aprobada (fuente de verdad)

El contenido que se ve en localhost sale de estos archivos. Cualquier cambio en ellos se propaga al manifiesto con `npm run cms:manifest`, y `npm test` falla si el manifiesto quedó desactualizado.

| Página | Archivos |
|---|---|
| Institucionales y globales | [content.json](../src/data/institutional/content.json) + [careerContent.js](../src/data/institutional/careerContent.js) + [businessTestimonials.js](../src/data/institutional/businessTestimonials.js) + [whatsapp.js](../src/data/institutional/whatsapp.js), combinados en [content.js](../src/components/institutional/content.js) |
| Landing `/diseno-de-carrera` | [site.js](../src/data/claudia/site.js) + [careerTestimonials.js](../src/data/claudia/careerTestimonials.js) + [booking.js](../src/data/claudia/booking.js), combinados en [landingCms.js](../src/data/claudia/landingCms.js) |
| Imágenes | `public/assets/claudia-sanchez/**` |
| Diseño | `src/components/**`, `src/pages/**`, `src/styles/**` (sin cambios visuales en esta etapa) |

Verificación: el HTML SSR de las 10 rutas es **idéntico byte a byte** antes y después de los cambios de esta etapa.

## 2. Respaldo

### 2.1 Ya preservado (fuera del repositorio, solo lectura)

`../claudia-sanchez-cms-backups/`

- `2026-10-27_fase1-diagnostico/`: snapshot y diff de tres vías usados en el informe (copiados del directorio temporal donde se generaron, con `SHA256SUMS.txt`).
- `2026-10-27T14-11-08-877Z_publico/`: línea base pública nueva. 74 secciones leídas, 52 con contenido, 18 artículos publicados. **Ninguna sección cambió** desde el diagnóstico.
- `2026-10-27_cms-ezequiel-antes-de-preview-url/`: copia de los archivos del CMS antes de modificarlos (el proyecto `CMS_Ezequiel` no está bajo git).

### 2.2 Respaldo completo (requiere credenciales de owner — pendiente)

La lectura directa de `sites`, `pages`, `sections` y `site_globals` exige sesión de owner. Dos alternativas equivalentes, ambas de solo lectura:

```powershell
# Opción 1: script (las credenciales solo viven en la sesión de la terminal)
$env:CMS_OWNER_EMAIL = '...'; $env:CMS_OWNER_PASSWORD = '...'
npm run cms:backup -- --owner
Remove-Item Env:CMS_OWNER_PASSWORD
```

Opción 2: ejecutar [01-respaldo-claudia-solo-lectura.sql](sql/01-respaldo-claudia-solo-lectura.sql) en el SQL Editor de Supabase y guardar el resultado.

El script valida que el sitio sea `1875d747-…`, aborta si lee filas de otro sitio, no lee contenido de artículos y nunca sobrescribe (la carpeta no debe existir; los archivos se crean con `wx`).

Con ese respaldo hay que verificar, **antes de sincronizar**:

1. Que `pages.key` de las páginas existentes coincida con el manifiesto (`inicio`, `personas`, `empresas`, `contacto`, `gracias`, `articulos`, `articulo`, `404`). Si alguna difiere, la sync crearía una página duplicada: hay que ajustar la clave en `PAGES` de [editorial-manifest.mjs](../scripts/editorial-manifest.mjs).
2. **La clave de `/disena-tu-futuro`.** Si fuera `diseno-de-carrera`, la sync no crearía una página nueva: movería la ruta de la antigua y publicaría su contenido viejo (R4). En ese caso no sincronizar y decidir de nuevo.
3. La definición de `get_public_section` (R13).

## 3. Manifiesto (etapa 1) — hecho

- [editorial-manifest.mjs](../scripts/editorial-manifest.mjs) se reescribió: construye el manifiesto desde cero a partir de `content.js` y `landingCms.js` (vía Vite), **sin leer el manifiesto anterior**. Así ya no puede reintroducir `impact`, el hero antiguo, `#life`, el slug `disena-tu-futuro` ni los hrefs sin WhatsApp. Además rechaza cualquier salida que contenga patrones obsoletos conocidos y tiene modo `--check`.
- Landing: `key` y `slug` `diseno-de-carrera`; secciones en orden de render: `hero`, `situations`, `career-testimonials` (nueva), `approach`, `life`, `about`, `closing`, `site-header`, `site-footer`, `seo` (nueva). Declara `title`, `highlightedTitle`, `description`, `ctaLink` y `portrait` (imagen) en el hero; `ctaLink` en situations y closing; `instruction` y `hubLabel` en life. `ctaLabel` deja de declararse (obsoleto, K5).
- `career-testimonials` y `seo` ya se leen en React con fallback idéntico al literal anterior (Aldo, José, Manuel; con `sourceLabel` y `linkedinUrl` por ítem). Sin datos remotos, el render no cambia.
- Comunidad y Experiencias: página completa y `community` en el global de navegación.
- `/ › navbar` y `/ › footer` se quitaron de la página de Inicio (duplicaban los globales). La sync no las borra: quedan como obsoletas en Supabase.
- Nombres de página en el CMS: Inicio, Personas, Empresas, Comunidad y Experiencias, Diseño de Carrera, Artículos, Artículo, Contacto, Gracias, Página no encontrada. La sync renombrará las páginas existentes (hoy, por ejemplo, «Career Longevity»).
- [build-editorial-data.py](../scripts/build-editorial-data.py) ya no sobrescribe `content.json` salvo con `--overwrite-approved-content`.

Fuera de alcance (etapa 2): los 72 textos hardcodeados de §3.2, salvo los de la sección de testimonios de la landing y su SEO, que se conectaron para que esas secciones no quedaran sin efecto.

## 4. Conexión con Vercel

### 4.1 Cómo funciona

- El CMS arma la URL del iframe con la URL base del sitio + la ruta de la página + `?cmsPreview=true`, y escucha solo mensajes cuyo `event.source` es ese iframe y cuyo `event.origin` es el origen de esa URL.
- El sitio activa el modo editable solo si está dentro de un iframe, tiene `?cmsPreview=true` y el origen de `document.referrer` figura en la lista autorizada. Envía `EZE_CMS_SELECT_*` con `targetOrigin` = ese origen exacto, y acepta `EZE_CMS_UPDATE_*` solo de `window.parent` con ese mismo origen.
- Tras guardar, el CMS envía la sección completa al iframe y la página se actualiza al instante. **Esto ocurre solo en builds de producción** (Vercel, `vite preview`): en `npm run dev` los hooks usan solo el contenido local y la selección funciona, pero la actualización en vivo no.

### 4.2 Cambios hechos

| Dónde | Cambio |
|---|---|
| CMS · [previewUrl.ts](../../CMS_Ezequiel/src/lib/previewUrl.ts), `App.tsx` | URL base = override del entorno para ese sitio (`VITE_EZE_PREVIEW_URLS`, JSON por `sites.slug`) o, si no hay, `sites.preview_url`. Sin URLs fijas en el código. |
| Sitio · [cmsOrigins.ts](../src/integration/eze-cms/cmsOrigins.ts), `CmsEditable*`, `useCmsSection`, `useCmsGlobal` | `VITE_EZE_CMS_ORIGIN` acepta una lista de orígenes exactos separados por coma. Las entradas inválidas (con ruta, comodines, otro protocolo) se descartan; sin entradas válidas, el modo preview queda desactivado. El `targetOrigin` y el origen aceptado son siempre el origen exacto que embebe la página. |

### 4.3 Configuración resultante

| Entorno | CMS | Sitio |
|---|---|---|
| Producción | `sites.preview_url = https://claudia-sanchez.vercel.app` (requiere autorización: [02-preview-url-vercel.sql](sql/02-preview-url-vercel.sql)) | Variable de Vercel `VITE_EZE_CMS_ORIGIN` = origen(es) del CMS, p. ej. `http://localhost:5173` mientras el CMS corre en local, más el origen del CMS publicado cuando exista. Requiere redeploy. |
| Desarrollo local | `.env.local` del CMS: `VITE_EZE_PREVIEW_URLS={"claudia-sanchez":"http://localhost:5174"}` (opcional) | `.env.local`: `VITE_EZE_CMS_ORIGIN=http://localhost:5173` (ya está) |

**Hoy el bundle publicado tiene `cmsPreviewOrigin` vacío**: `VITE_EZE_CMS_ORIGIN` no está definida en Vercel, así que la edición contextual en producción está desactivada hasta configurarla y redesplegar.

### 4.4 Cabeceras y comprobaciones

- `https://claudia-sanchez.vercel.app/` no envía `X-Frame-Options` ni `Content-Security-Policy`: el iframe funciona sin cambios. `/disena-tu-futuro` responde `308` a `/diseno-de-carrera`.
- Recomendado cuando se conozca el origen definitivo del CMS: limitar quién puede embeber el sitio. **No se aplicó** porque, con el origen del CMS publicado desconocido, podría bloquear el iframe:

  ```json
  "headers": [{ "source": "/(.*)", "headers": [{ "key": "Content-Security-Policy", "value": "frame-ancestors 'self' http://localhost:5173 https://<cms-publicado>" }] }]
  ```
- Un CMS servido por HTTPS puede embeber `http://localhost:5174` (localhost es un contexto seguro), pero el navegador no envía referrer de HTTPS a HTTP: en esa combinación el modo editable no se activa. Para editar en local, servir ambos en local.

### 4.5 Rutas internas y colecciones

- Rutas: el CMS ignora selecciones cuyo `pageRoute` no es la página abierta. Si se navega dentro del iframe a otra ruta, se pierde `?cmsPreview=true` y desaparecen los editables. Hay que cambiar de página desde la barra lateral del CMS.
- `/articulos/:slug` se abre literalmente como `/articulos/:slug`: se ve el estado «Artículo inexistente», y solo son editables la plantilla y sus textos.
- `/disena-tu-futuro` redirige, así que sus clics nunca coinciden: es otra razón para borrarla.
- Colecciones: la prueba de paridad verifica que los 57 editables de la landing (campos, ítems indexados y colecciones) existan en el manifiesto, que es la condición que exige el CMS para abrir el editor.

## 5. Acciones que requieren autorización (no ejecutadas)

En este orden:

1. **Respaldo owner** (§2.2) y verificación de las claves. Es de solo lectura, pero necesita credenciales.
2. **Sincronizar el manifiesto** desde el panel «Sincronizar manifiesto». En la vista previa debe aparecer: páginas nuevas «Diseño de Carrera» y «Comunidad y Experiencias»; secciones nuevas de Comunidad y de la landing; campos nuevos como `/ › enfoque.steps` o `/ › contacto.image`; renombres de páginas; **ningún `routeChange`**. Si aparece algo distinto, abortar.
3. **Vercel**: definir `VITE_EZE_CMS_ORIGIN` y redesplegar.
4. **`sites.preview_url`** → `https://claudia-sanchez.vercel.app` ([02-preview-url-vercel.sql](sql/02-preview-url-vercel.sql)).
5. **Verificar `/diseno-de-carrera`** en el CMS: selección, edición y actualización en vivo de cada sección, y comparación visual con localhost.
6. **Eliminar `/disena-tu-futuro`** ([03-eliminar-disena-tu-futuro.sql](sql/03-eliminar-disena-tu-futuro.sql), ver §6).
7. **Etapa 4**: patch de los 45 campos y 8 colecciones institucionales que la sync no actualiza. Hasta entonces, producción sigue mostrando ese contenido antiguo.

## 6. Eliminación de `/disena-tu-futuro`

El CMS lista todas las páginas del sitio sin filtrar, y `sync_status` solo existe en `sections`: retirar secciones no oculta la página. Para que Claudia vea una sola página, hay que borrar la fila.

[03-eliminar-disena-tu-futuro.sql](sql/03-eliminar-disena-tu-futuro.sql):

- **Parte A** (solo lectura): ids y claves de ambas páginas, respaldo JSON de la página antigua y sus 9 secciones, comprobación de que la nueva tiene 10 secciones con contenido, claves foráneas hacia `pages` y `sections` (las tablas base no están en las migraciones), contenido que aún enlaza a la ruta antigua (`/gracias › neutral.cta` y `/personas › servicios.item-3` en Supabase hoy) e inventario de archivos del bucket.
- **Parte B**: transacción que aborta si la nueva página no tiene 10 secciones con contenido o si no borra exactamente una página. Borra solo las secciones de la página antigua y la página. **Termina en `ROLLBACK`**; hay que cambiarlo a `COMMIT` con autorización.
- Se conservan la redirección pública (vercel.json y React, independientes del CMS), los archivos del bucket y todo lo de otros sitios.

## 7. Riesgos y dependencias pendientes

| | |
|---|---|
| Clave de la página antigua | Bloqueante: si es `diseno-de-carrera`, la sync movería la ruta en lugar de crear la página nueva (§2.2). |
| Producción sigue mostrando contenido antiguo | Hasta la etapa 4 (R1, R2). La sync solo crea lo que falta. |
| `/ › enfoque.paragraph3/4` | Se siguen renderizando en producción (R7, decisión D4 pendiente). |
| Retrato de la landing | La página nueva usa el asset local `claudia-hero.png` (D3). El archivo subido al bucket queda en la página antigua. |
| Textos hardcodeados (§3.2) | No editables hasta la etapa 2. |
| `ctaLabel` en el hero | `Hero.jsx` todavía lo usa como fallback cuando `ctaLink` no es válido. Retirarlo del código cuando Supabase tenga `ctaLink` en todas las secciones. |
| Edición en vivo en `npm run dev` | No se aplica (los hooks usan solo el contenido local en desarrollo). Probar en Vercel o con `vite build && vite preview`. |
| Kits de integración duplicados | `cms-integration-kit/` y `CMS_Ezequiel/integration/react-vite/` no recibieron la lista de orígenes. Solo se cambió la copia que usa el sitio. |
| `CMS_Ezequiel/manifests/claudia-sanchez.json` | Esqueleto antiguo: no sincronizarlo nunca (K10). |
