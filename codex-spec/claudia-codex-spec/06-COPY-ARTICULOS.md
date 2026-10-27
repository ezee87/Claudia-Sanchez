# Copy exacto — Artículos `/articulos` y `/articulos/:slug`

## Identidad y reglas

El menú y la sección del sitio se llaman **Artículos**, NO Newsletter. El newsletter original de LinkedIn mantiene su identidad editorial **How to Thrive Beyond 40**, pero el sitio **no** tendrá suscripción, emails, botón de suscribirse ni formularios de newsletter.

**Nombre de la colección:** How to Thrive Beyond 40.

**Descripción original:** Un newsletter para líderes que buscan evolucionar más allá de los éxitos convencionales.

Los artículos existentes se originan en LinkedIn. **No inventar contenido ni transcribir a partir de una imagen de pantalla.** Usar textos, fechas, títulos y portadas completos **solo cuando estén efectivamente disponibles** en archivos locales, datos del CMS o fuentes que el usuario ya proporcionó. Si los 18 artículos no están disponibles en el proyecto, preparar estructura, modelo y placeholders claramente identificados y reportar que falta importarlos. No realizar scraping autenticado ni usar la cuenta de LinkedIn del usuario.

## Página listado `/articulos`

### 01 — Encabezado (`intro`)

**Título principal:** Artículos

**Nombre editorial:** How to Thrive Beyond 40

**Subtítulo:** Un newsletter para líderes que buscan evolucionar más allá de los éxitos convencionales.

**Párrafo:** Reflexiones sobre liderazgo, desarrollo profesional, transiciones de carrera y las decisiones que nos permiten construir nuevas etapas con claridad y propósito.

### 02 — Listado (`listado`)

Tarjetas de artículos ordenadas por **fecha de publicación descendente**. Cada tarjeta muestra **únicamente**:

- Portada real del artículo si está disponible (si no, fallback gráfico de la marca sin inventar imagen).
- Título real.
- Fecha real, formato legible en español.
- Enlace accesible al artículo individual; puede mostrar texto `Leer artículo` como acción de la tarjeta.

No inventar resumen, categoría, autor extra, tiempo de lectura, número de comentarios ni etiquetas. No añadir filtros sin necesidad. Si no hay datos reales, mostrar estado vacío elegante, no tarjetas ficticias publicadas.

**Único ejemplo comprobado en material proporcionado:**

- Título: `El mapa que nadie nos dio: cómo se construye una carrera fuera del organigrama`.
- Fecha: `17 de septiembre de 2026`.
- Colección: `How to Thrive Beyond 40`.
- El cuerpo íntegro y la portada original **no están incluidos en estas especificaciones**. No fabricar el texto ni considerar una captura de pantalla como importación completa.

### Inicio — 3 artículos recientes

La sección de Artículos en `/` debe leer el **mismo origen de datos** que `/articulos` y mostrar los 3 más recientes según fecha. Si hay menos de 3 artículos reales, mostrar los disponibles; no completar con ficticios.

## Página individual `/articulos/:slug`

### 01 — Encabezado (`encabezado`)

**Colección:** How to Thrive Beyond 40.

**Título:** título real del artículo, variable.

**Fecha:** fecha original, variable.

**Portada:** imagen real original si existe, con fallback elegante si no.

### 02 — Cuerpo (`contenido`)

Texto completo original del artículo con párrafos, subtítulos, citas, listas y énfasis preservados. Render seguro para contenido rico (sanitización si se admite HTML). No reescribir, resumir ni rellenar con lorem ipsum.

### 03 — Firma y navegación (`pie-articulo`)

**Firma:** Por Claudia Sánchez Urencio.

**Enlace:** Volver a Artículos → `/articulos`.

No mostrar suscripción ni testimonios ni formularios.

## Datos y CMS

Preparar modelo de artículo con `slug`, `title`, `publishedAt`, `cover`, `body` y opcional `status` para borradores; conservar el orden de publicación. Las etiquetas de interfaz y secciones deben estar declaradas en el manifiesto Eze CMS. Para contenido de artículos individuales, usar el mecanismo de contenido dinámico real que admita la integración (no asumir que la RPC `get_public_section` soporta colecciones si no está documentado). Si no existe soporte, implementar lectura local tipada con una capa desacoplada y documentar cómo conectarla al CMS; no modificar backend remoto ni inventar una API.

## SEO

- `/articulos`: title sugerido `Artículos | Claudia Sánchez Urencio`; description derivada del copy real.
- `/articulos/:slug`: title del artículo + ` | Claudia Sánchez Urencio`; description solo si se puede obtener un extracto real sin inventar; canonical único; Open Graph con portada real si existe; `Article` JSON-LD con fechas y autor solo cuando los datos estén disponibles.
- Redirecciones desde `/newsletter` y `/newsletter/:slug` conservando slugs.
