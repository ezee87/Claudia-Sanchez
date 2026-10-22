# Implementación institucional — 21 de octubre de 2026

Trabajo local, sin commit, push, deploy, sincronización CMS ni escrituras remotas. Se conservaron los cambios que ya existían al iniciar.

## Rutas y presentación

- Inicio, Personas, Empresas, Contacto, Artículos, plantilla individual, Gracias y vista 404.
- Redirecciones React con `replace` desde `/newsletter` y `/newsletter/:slug`; conservan slug, query y hash. El rewrite SPA de Vercel permanece. Son redirecciones del cliente; no se afirma un HTTP 301.
- Menú institucional compartido, Servicios desplegable, Escape, foco, versión móvil y enlace Sobre mí a `/#sobre-mi`. La landing mantiene su menú de conversión y Calendly para preservar su apariencia y flujo.
- Tipografía Cormorant Garamond / Manrope, paleta, espaciados y fotografía local heredados de la landing. No se descargaron ni generaron imágenes.
- La landing conserva programa, L.I.F.E., animaciones, testimonios ilustrativos preexistentes y reserva. Solo se corrigió el nombre público, incluido contenido remoto antiguo al renderizarlo. No se reemplazó contenido productivo.

## Archivos principales

- `src/components/institutional/`: layout, secciones, formulario, artículos, metadatos, adaptadores CMS y estilos aislados.
- `src/data/institutional/content.json`: copy exacto y fallbacks compartidos con el manifiesto. `types.ts`: contratos editoriales y de artículos.
- `src/App.jsx` y wrappers de `src/pages/`: rutas y sustitución de placeholders.
- `src/integration/eze-cms/claudia-sanchez.manifest.json`: versión 1, mismas claves de landing, nuevas páginas y campos.
- `src/integration/eze-cms/ClaudiaCms.jsx`, `src/data/claudia/site.js`, título de iframe y `index.html`: nombre público completo.
- `scripts/`: extracción del copy, generación local del manifiesto, validación y pruebas. No realizan llamadas de escritura al CMS.

## CMS: capacidades y límites

Ver [matriz por página, sección y campo](CMS-COVERAGE.md).

Implementado y verificado localmente: 162 campos superiores, colecciones con `_id`, fallbacks idénticos a `initialContent`, enlaces con validación de protocolo, reemplazo de arrays completos, alta/baja/orden en la representación frontend, texto, CTA, imagen y ALT; selección del kit con origen autorizado y rechazo de un origen ajeno mediante simulación local.

La documentación del kit soporta colecciones, campos `string`, `number`, `image` y links fuera de colecciones. Dentro de las colecciones, CTA se representa con `label` y `href` de tipo string, porque `itemFields` no admite links. El orden es el del array; `visible: 0` oculta elementos. No se necesita ampliar el CMS para esta representación.

Preparado pero no comprobado contra el CMS real: lectura de cada nueva sección publicada, sincronización manual, edición y persistencia remota, sustitución/subida de imágenes, alta/baja/reordenamiento desde el panel y actualizaciones del iframe sin recargar. No se hizo sync/import porque está expresamente prohibido en la especificación. No se afirma que el entorno remoto ya contenga estas secciones.

Los campos visuales simples y los bloques de colección utilizan `CmsEditable`. ALT, SEO, etiquetas auxiliares y estados condicionalmente ocultos se editan en el panel; no requieren un control público adicional. Navbar y footer se leen desde `/`, compartidos por todas las páginas institucionales.

## Artículos

Una sola fuente: `/articulos` → `listado` → colección `items`. Inicio, listado y detalle consumen esa misma sección mediante la RPC documentada. `/articulos/:slug` es la plantilla de etiquetas, no una consulta de RPC con una ruta dinámica inventada.

Cada artículo necesita `_id`, `slug` único, `title`, `publishedAt` en formato YYYY-MM-DD, `cover`, `alt`, `body`, `status` (`draft` o `published`) y `visible` (1/0). El renderer admite Markdown restringido: párrafos, títulos, citas, listas, enlaces seguros, negrita y cursiva. HTML crudo se muestra como texto y no se ejecuta. Importar cada original conservando su estructura; otros formatos enriquecidos necesitarán un adaptador explícito.

Faltan los 18 cuerpos completos, fechas/títulos restantes y portadas originales. El único dato comprobado aportado es “El mapa que nadie nos dio: cómo se construye una carrera fuera del organigrama”, del 17 de septiembre de 2026; no se publica una tarjeta incompleta ni se fabrica su cuerpo. Actualmente el listado está vacío. Los publicados se ordenan por fecha descendente y Inicio toma hasta tres.

## Contacto y reserva

No hay backend de contacto comprobado. El formulario valida campos obligatorios/email, preselecciona tipo y muestra empresa solo cuando corresponde. No persiste datos ni simula éxito. Indica que no está operativo y ofrece el LinkedIn real. El adaptador `sendInquiry` está preparado con bloqueo de duplicados y estados loading/error/success; solo debe conectarse a un transporte real que confirme `ok: true`. Esos estados de transporte no se probaron contra un servicio real.

Pendientes: correo confirmado, destinos WhatsApp/Calendly por servicio y backend de contacto. Mientras tanto, las tarjetas llevan a contacto con tipo y servicio.

No hay señal verificable de reserva ni prueba de emails de Calendly. `/gracias` muestra siempre la vista neutral; query params y acceso directo nunca habilitan confirmación. Copy de confirmación y próximos pasos preparado en CMS, pero inactivo hasta integrar/verificar el flujo. No se modificó el modal existente ni se realizó una reserva de prueba.

## Aprobación editorial y SEO

- Confirmar nombres, alcance y formatos de los cinco servicios provisionales y el proceso corporativo de cuatro pasos.
- Autorizar testimonios, cargos y traducción de Pedro. No se inventaron cargos de Pedro o Fabián, ni se asociaron estos testimonios a un programa.
- Credenciales preparadas como colección, ocultas (`visible: 0`, `status: pendiente`) hasta confirmar denominación/vigencia. Activar con `visible: 1` y `status: confirmed`.
- Metadatos distintos por página, OG/Twitter y JSON-LD Article cuando hay artículo real. Canonical solo si se configura `VITE_SITE_URL` con dominio confirmado.
- Se conservan `robots.txt` y `noindex/nofollow` del repositorio de revisión. Antes de publicación definitiva, aprobar contenido, configurar dominio, habilitar indexación y generar sitemap. No se inventó dominio ni se declaró el sitio listo para indexar.
- Las rutas desconocidas tienen vista 404; el hosting SPA seguirá devolviendo el estado HTTP de su fallback hasta añadir soporte del servidor para 404 reales.

## Verificación

Comandos reproducibles: `npm test`, `npm run typecheck`, `npm run build`. No había linter configurado ni se agregó uno.

Pruebas automatizadas: paridad manifiesto/fallback, cobertura de campos/colecciones, nueve rutas/variantes mediante render sin navegador, un H1, ausencia de falsos éxitos, selección empresa, URLs peligrosas, cambios de texto/CTA/imagen/ALT, colecciones, publicaciones/duplicados/orden de artículos, selección visual y validación del origen (simulación local).

Navegador Chrome: Inicio desktop y 375 px, Personas 375 px, Empresas 375/768 px, Contacto con query empresa y otra consulta, validación obligatoria, envío sin backend sin éxito, rutas de Artículos/Gracias/404, redirecciones de newsletter. Sin overflow horizontal en las vistas revisadas. Menú móvil: apertura, Escape y restitución del foco. Revisión visual de landing antes/después: estructura y flujo conservados; nombre completo.

Movimiento reducido verificado en Chrome mediante emulación: `prefers-reduced-motion: reduce`, animación del hero `none`, opacidad 1 y contenido visible después de recargar. Se restauró la preferencia de prueba. También se verificó Sobre mí desde Empresas hacia `/#sobre-mi`, sin errores de consola registrados.

Resultado final: `npm test`, `npm run typecheck`, `npm run build` y `git diff --check` pasaron. Git solo informó advertencias de normalización LF/CRLF en archivos de la copia de trabajo.

Límites: no se importaron artículos ficticios para simular publicación, no se realizó QA con una reserva o envío reales, ni persistencia remota del CMS. La comparación visual fue manual, no un diff de capturas automatizado.
